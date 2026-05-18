# Reporte de Práctica — CompOS: Sistema Distribuido de Gestión de Competencias

**Asignatura:** Bases de Datos Distribuidas  
**Fecha:** 2026-05-18  
**Equipo:** Eduardo Emmanuel Figueroa Gutiérrez · Mario Ávila Guzmán  
**Repositorio:** [EduardoAllen02/Competitive-programming-Dashboard](https://github.com/EduardoAllen02/Competitive-programming-Dashboard)

---

## 1. Descripción General

CompOS es una aplicación web para la gestión de competencias universitarias de programación. Su particularidad técnica es que no opera sobre una sola base de datos centralizada, sino sobre un clúster de tres nodos MySQL físicamente distribuidos entre tres máquinas distintas, conectadas mediante una red VPN privada. Los datos se mantienen sincronizados en tiempo real mediante replicación nativa de MySQL.

---

## 2. Arquitectura del Sistema

### 2.1 Nodos físicos

| Nodo   | Máquina          | IP Tailscale      | Puerto | Rol               |
|--------|------------------|-------------------|--------|-------------------|
| Node 1 | Laptop Mario     | `100.110.30.15`   | 3306   | Master (primario) |
| Node 2 | PC Principal     | `100.113.123.57`  | 3306   | Master (secundario)|
| Node 3 | Laptop Edd       | `100.111.63.7`    | 3306   | Slave (réplica)   |

Cada nodo corre **MySQL 8.0 nativo** directamente en el sistema operativo de la máquina (Windows en Node 1 y Node 2, Linux en Node 3).

### 2.2 Topología de replicación

```
Node 1 (Mario) ←──── Master-Master ────► Node 2 (PC Principal)
       │
       └──── Master-Slave ────► Node 3 (Edd)
```

- **Node 1 ↔ Node 2:** Replicación bidireccional (Master-Master). Ambos nodos pueden recibir escrituras y propagan sus cambios al otro.
- **Node 1 → Node 3:** Replicación unidireccional (Master-Slave). Node 3 solo recibe cambios desde Node 1 y no genera escrituras propias. Funciona como respaldo de solo lectura.

### 2.3 Conectividad entre máquinas — Tailscale

Las tres máquinas no comparten la misma red física. La comunicación entre nodos se realiza a través de **Tailscale**, una solución VPN mesh basada en WireGuard. Tailscale asigna a cada máquina una IP privada estable (las `100.x.x.x` de la tabla anterior) que es accesible desde cualquier otro nodo de la misma red Tailscale, independientemente de la ubicación física o del ISP.

Esto permite que MySQL en cada nodo escuche conexiones entrantes de los otros nodos a través de sus IPs Tailscale, como si estuvieran en la misma red local.

---

## 3. Por qué se descartó Docker

La arquitectura inicial contemplaba correr Node 2 como un contenedor Docker en la misma máquina de Mario (puerto 3307), mientras Node 1 era MySQL nativo. Esto causó un problema recurrente: **al reiniciar el contenedor, el motor de replicación de MySQL almacenaba internamente una posición de binlog (log_file + log_pos) que quedaba desfasada respecto al estado real del archivo binario tras el reinicio**.

El error manifestaba así:

> `Got fatal error 1236 from source when reading data from binary log: 'Client requested source to start replication from position > file size'`

La posición que el slave intentaba leer era mayor al tamaño real del archivo binlog, porque Docker reiniciaba el proceso MySQL en un estado inconsistente. El fix era manual cada vez: detectar la posición correcta del binlog actual y ejecutar `CHANGE SOURCE TO` con los valores correctos.

**Decisión:** migrar Node 2 a MySQL nativo en una segunda máquina física (PC Principal), eliminando el problema de raíz. Con MySQL nativo, los archivos binlog y el estado de replicación persisten correctamente entre reinicios.

---

## 4. Configuración de Replicación en los Tres Nodos

### 4.1 Requisitos base en cada nodo

Para que la replicación funcione, cada nodo necesita:

1. **`server_id` único:** identifica al nodo dentro del clúster. MySQL usa este ID para evitar ciclos de replicación (un evento no se aplica si fue originado por el mismo `server_id`).
2. **Binlog habilitado (`log_bin`):** cada nodo registra todas sus escrituras en archivos binlog que los otros nodos leen.
3. **Usuario de replicación:** cuenta MySQL con privilegios `REPLICATION SLAVE` que los nodos remotos usan para conectarse y leer el binlog.

### 4.2 Configuración por nodo

#### Node 1 — Laptop Mario (`server_id = 1`)

- `server_id = 1` en `my.ini` (persiste en reinicios).
- Binlog habilitado: archivos `MARIOAG-bin.*`.
- Configurado como **slave de Node 2**: lee el binlog de `100.113.123.57:3306`, filtrado a la base de datos `competencias_programacion` (`Replicate_Do_DB = competencias_programacion`).
- Configurado como **master de Node 3**: Node 3 lee el binlog de Node 1.
- Parámetro `log_slave_updates = ON`: los cambios que Node 1 recibe de Node 2 también se escriben en su propio binlog, permitiendo que Node 3 (que solo escucha a Node 1) reciba indirectamente los cambios originados en Node 2.

#### Node 2 — PC Principal (`server_id = 2`)

- `server_id = 2` establecido via `SET PERSIST server_id = 2`, que lo almacena en `mysqld-auto.cnf` y sobrevive reinicios sin editar `my.ini`.
- Binlog habilitado: archivos `DESKTOP-Q6FADEP-bin.*`.
- Configurado como **slave de Node 1**: lee el binlog de `100.110.30.15:3306`, sin filtro por base de datos (replica todo lo que Node 1 genera).

#### Node 3 — Laptop Edd (`server_id = 3`)

- `server_id = 3` en `/etc/mysql/my.cnf`.
- Configurado como **slave de Node 1**: lee el binlog de `100.110.30.15:3306`, filtrado a `competencias_programacion`.
- **No tiene binlog propio habilitado** (no es master de nadie).
- Opera en modo solo lectura de facto: no recibe escrituras directas de la aplicación.

### 4.3 Mecanismo anti-ciclo en Master-Master

En una topología Master-Master, existe el riesgo de que un cambio se replique infinitamente: Node 1 escribe → replica a Node 2 → Node 2 lo replica de vuelta a Node 1, y así sucesivamente. MySQL previene esto con el `server_id`: cada evento en el binlog lleva el `server_id` de quien lo originó. Cuando un slave recibe un evento cuyo `server_id` coincide con el propio, lo descarta. Así, Node 1 jamás aplica de vuelta un cambio que él mismo originó.

### 4.4 Persistencia del estado de replicación

Las posiciones de lectura del binlog (qué archivo y qué offset se ha leído hasta ahora) se persisten en la tabla `mysql.slave_relay_log_info` y `mysql.slave_master_info` (con `master_info_repository = TABLE`), garantizando que un reinicio del servicio MySQL no pierda el progreso de replicación.

---

## 5. Esquema Relacional de la Base de Datos

La base de datos `competencias_programacion` contiene las siguientes entidades principales:

```
Persona ──── Competidor (1:1 opcional)
   │
   └──────── MiembroEquipo ─────► Equipo
                                     │
                                     └─► Resultado ◄─── FechaProblema
                                                              │
                                              FechaCompetencia   Problema
```

**Tablas:**

| Tabla               | Descripción                                                               |
|---------------------|---------------------------------------------------------------------------|
| `persona`           | Datos de cualquier participante (nombre, correo único)                    |
| `competidor`        | Extiende `persona` con fechas de inicio/término de estudios y nacimiento  |
| `equipo`            | Nombre del equipo                                                         |
| `miembro_equipo`    | Relación N:M entre personas y equipos, con rol (competidor, coach, etc.)  |
| `fecha_competencia` | Una jornada de competencia: tipo (`fecha_cero`, `clasificatoria`, `repechaje`) y número |
| `problema`          | Enunciado con nombre, descripción y teoría opcional                       |
| `fecha_problema`    | Relación N:M entre fechas y problemas (qué problemas se resuelven en cada fecha) |
| `resultado`         | Puntos obtenidos por un equipo en un problema específico de una fecha. PK compuesta: `(equipo_id, fecha_id, problema_id)` |

---

## 6. Frontend — CompOS

### 6.1 Stack tecnológico

| Componente  | Tecnología                        |
|-------------|-----------------------------------|
| Framework   | Next.js (App Router, modo producción) |
| ORM         | Prisma 5.22.0 + MySQL2            |
| UI          | Tailwind CSS + Framer Motion      |
| Lenguaje    | TypeScript                        |
| Despliegue  | Node.js en producción (Task Scheduler Windows) |

### 6.2 Módulos de la aplicación

La aplicación tiene las siguientes secciones accesibles desde el menú de navegación:

- **Panel Principal (`/`):** dashboard con contadores animados (equipos, participantes, fechas, problemas) y un resumen del ranking acumulado top-5. Incluye accesos rápidos para crear equipos, personas, fechas y ver el ranking completo.
- **Equipos (`/equipos`):** listado y gestión de equipos. Permite crear equipos y asignar miembros con sus roles.
- **Personas (`/personas`):** gestión de participantes. Se pueden registrar como competidores con sus fechas académicas.
- **Fechas (`/fechas`):** gestión de jornadas de competencia y asignación de problemas a cada fecha.
- **Ranking (`/ranking`):** visualización de resultados (ver sección 6.3).

Cada módulo tiene sus propias rutas API REST bajo `/api/[módulo]` implementadas como Route Handlers de Next.js, conectadas a la base de datos mediante Prisma.

### 6.3 Cómo se calculan los rankings

El ranking se calcula en el servidor en `/api/ranking` y ofrece dos modos:

**Ranking acumulado (default):**
- Solo toma en cuenta fechas de tipo `clasificatoria` (excluye `fecha_cero` y `repechaje`).
- Para cada equipo, suma todos los `puntos_obtenidos` en todas sus filas de `resultado` cuyo `fecha_id` corresponda a una clasificatoria.
- Equipos sin ningún resultado aparecen con 0 puntos (se incluyen explícitamente).
- El resultado se ordena de mayor a menor puntuación total.
- La respuesta incluye también el desglose por clasificatoria (`porFecha`), permitiendo al frontend mostrar una columna por cada clasificatoria en la tabla.

**Ranking por fecha:**
- Filtra `resultado` por un `fecha_id` específico.
- Agrupa por equipo y suma los puntos de todos los problemas de esa fecha.
- No distingue tipo de fecha; puede consultarse para cualquier jornada incluyendo fecha cero o repechaje.

En la vista de ranking, el top-3 se presenta visualmente como un **pódium animado** (oro, plata, bronce). El resto de posiciones aparece en una tabla con el desglose por clasificatoria visible en modo acumulado.

### 6.4 Gestión de fechas y problemas

Desde `/fechas` se crean jornadas de competencia indicando su tipo (`fecha_cero`, `clasificatoria` con número, o `repechaje`) y la fecha calendario. A cada jornada se le asignan los problemas que los equipos deben resolver. Esta asociación se registra en `fecha_problema`.

Los **resultados** (puntos obtenidos por equipo en cada problema de una fecha) se cargan vía `POST /api/resultados`. La operación usa `upsert`: si ya existe un resultado para esa combinación `(equipo, fecha, problema)`, actualiza los puntos; si no, lo crea. Esto permite corregir puntuaciones sin duplicar registros.

### 6.5 Conexión al nodo principal

El frontend se despliega en **Node 1 (laptop Mario, `100.110.30.15:3000`)** y se conecta exclusivamente al MySQL local de ese nodo (la variable `DATABASE_URL` apunta a `localhost:3306`). Node 1 es el punto de entrada para todas las escrituras.

Prisma mantiene una instancia global del cliente (patrón singleton) para reutilizar conexiones entre peticiones en el entorno de producción de Node.js.

### 6.6 Health check de replicación

**Endpoint:** `GET /api/replication/health`

El sistema verifica continuamente el estado de la replicación antes de permitir escrituras. La lógica central vive en `src/lib/replication.ts` y hace dos comprobaciones en paralelo:

1. **Estado IO Thread y SQL Thread de Node 1:** consulta `performance_schema.replication_connection_status` y `performance_schema.replication_applier_status` directamente en MySQL (vía Prisma raw query). El IO Thread se encarga de leer el binlog remoto; el SQL Thread aplica los eventos recibidos. Ambos deben reportar `SERVICE_STATE = 'ON'` para considerar la replicación saludable.

2. **Ping TCP a Node 2:** abre una conexión TCP a `100.113.123.57:3306` con un timeout de 3 segundos. Si la conexión se establece, Node 2 está alcanzable; si falla o expira, se considera inaccesible.

El sistema considera la replicación **saludable** solo si las tres condiciones se cumplen simultáneamente: IO ON + SQL ON + Node 2 alcanzable.

El resultado se **cachea en memoria por 15 segundos** para evitar consultar la base de datos en cada petición HTTP.

### 6.7 Bloqueo de escrituras cuando la replicación está caída

Todos los endpoints de escritura (`POST`, `PUT`, `DELETE`) de la API llaman a `assertReplicationHealthy()` antes de procesar la petición. Si la replicación no está saludable, la función lanza un `ReplicationError` y el endpoint responde inmediatamente con **HTTP 503** y el mensaje `"Replicación no disponible — escrituras bloqueadas"`.

Las operaciones de **lectura (`GET`)** no verifican el estado de la replicación y funcionan normalmente incluso si la replicación está caída. Esto permite seguir consultando datos históricos mientras se restaura la conectividad.

Este diseño garantiza que no se ingresen datos que queden sin replicar a los otros nodos, preservando la consistencia del clúster.

### 6.8 Despliegue en producción

La aplicación corre en modo producción (`npm run build && npm start`) desde el directorio `C:\CompOS` en la laptop de Mario. Un **Task Scheduler** de Windows llamado `CompOS-Prod` la levanta automáticamente al iniciar el sistema (trigger `ONSTART`, bajo la cuenta `SYSTEM`), por lo que el servicio está disponible sin intervención manual tras cada reinicio.

Los logs del proceso se almacenan en `C:\CompOS\server.log`.

---

## 7. Flujo Completo de una Escritura

A continuación se describe el recorrido completo de, por ejemplo, registrar el resultado de un equipo en un problema:

```
Usuario (navegador)
    │  POST /api/resultados { equipo_id, fecha_id, problema_id, puntos_obtenidos }
    ▼
Next.js en Node 1 (100.110.30.15:3000)
    │  assertReplicationHealthy() → verifica IO+SQL ON y Node 2 reachable
    │  Si falla → HTTP 503
    ▼
MySQL Node 1 (localhost:3306)
    │  UPSERT en tabla resultado
    │  Escribe el evento en binlog MARIOAG-bin.*
    ▼
    ├── Node 2 (PC Principal, 100.113.123.57:3306) lee binlog de Node 1
    │       SQL Thread aplica el INSERT/UPDATE → dato replicado
    │
    └── Node 3 (Laptop Edd, 100.111.63.7:3306) lee binlog de Node 1
            SQL Thread aplica el INSERT/UPDATE → dato replicado
```

---

## 8. Resumen de Características del Sistema

| Característica                         | Valor                                      |
|----------------------------------------|--------------------------------------------|
| Nodos totales                          | 3                                          |
| Topología                              | Master-Master (N1↔N2) + Master-Slave (N1→N3) |
| Conectividad entre nodos               | Tailscale VPN (WireGuard)                  |
| Motor de base de datos                 | MySQL 8.0 nativo (sin Docker)              |
| Base de datos replicada                | `competencias_programacion`                |
| Anti-ciclo Master-Master               | Filtro por `server_id` nativo de MySQL     |
| Persistencia de binlog                 | `master_info_repository = TABLE`           |
| Frontend                               | Next.js + Prisma 5.22.0                    |
| Nodo con frontend                      | Node 1 (Mario, `100.110.30.15:3000`)       |
| Health check                           | IO Thread + SQL Thread + ping TCP Node 2   |
| Cache del health check                 | 15 segundos en memoria                     |
| Comportamiento con replicación caída   | Lecturas: OK — Escrituras: HTTP 503        |
