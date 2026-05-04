# CompOS — Contexto de Implementación

> Sistema de gestión de competencias universitarias de programación.
> Capa de software sobre la BD diseñada en la práctica de replicación MySQL.
> Reporte fuente: `C:\Users\Yeyian PC\Downloads\REPORTE_PRACTICA_REPLICACION (1).md`

---

## Contexto del Proyecto

Eduardo tiene una práctica universitaria sobre diseño de BD relacional y replicación MySQL Master-Slave. La práctica diseñó la BD `competencias_programacion` para gestionar equipos en competencias de programación. El reporte explícitamente delega el cálculo de rankings y puntajes a la **capa de aplicación** — eso es lo que CompOS implementa.

---

## Base de Datos (del reporte — no modificar el schema)

8 tablas, 3FN completa:

```
PERSONA           → id, nombre_completo, correo_electronico (UNIQUE)
COMPETIDOR        → persona_id (PK/FK), fecha_inicio_estudios, fecha_termino_estudios?, fecha_nacimiento
EQUIPO            → id, nombre
MIEMBRO_EQUIPO    → id, equipo_id FK, persona_id FK, rol enum(competidor|sustituto|coach|co_coach)
FECHA_COMPETENCIA → id, tipo enum(fecha_cero|clasificatoria|repechaje), numero?, fecha
PROBLEMA          → id, nombre, descripcion TEXT, teoria TEXT?
FECHA_PROBLEMA    → fecha_id PK/FK, problema_id PK/FK  ← tabla puente
RESULTADO         → equipo_id PK/FK, fecha_id PK/FK, problema_id PK/FK, puntos_obtenidos
```

Schema Prisma en: `prisma/schema.prisma`
Prisma client generado en: `src/generated/prisma`
DB client singleton en: `src/lib/db.ts`

---

## Reglas de Negocio Confirmadas por Eduardo

- **Ranking por fecha**: puntos de esa fecha específica, aplica a cualquier tipo
- **Ranking acumulado**: suma ÚNICAMENTE de fechas tipo `clasificatoria` (1, 2 y 3)
- `fecha_cero` → NO suma al acumulado
- `repechaje` → NO suma al acumulado (decisión provisional, preguntar si cambia)
- Un equipo puede tener 0 puntos (aparece igual en el ranking con 0)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router, React 19) |
| Lenguaje | TypeScript |
| ORM | Prisma 6 + MySQL |
| Estilos | Tailwind CSS v4 |
| Animaciones | Framer Motion |
| Charts | Recharts |
| Toasts | Sonner |
| Iconos | Lucide React |

**Importante Tailwind v4:** usa `@import "tailwindcss"` y `@theme inline { }` en globals.css — NO hay tailwind.config.ts. Los tokens custom están definidos en globals.css.

**Importante Prisma 6:** el cliente se genera en `src/generated/prisma` (no en node_modules). Importar así: `import { PrismaClient } from "@/generated/prisma"`. La URL de DB viene de `prisma.config.ts` vía `process.env.DATABASE_URL`.

---

## Conexión a la Base de Datos

Archivo `.env`:
```
DATABASE_URL="mysql://root:password@localhost:3306/competencias_programacion"
```

Cambiar credenciales según el entorno. La práctica usó:
- Master: Windows, IP Tailscale `100.110.30.15`, usuario `usuario_replica`
- Para desarrollo local: cualquier MySQL en localhost con la BD `competencias_programacion`

Para generar el cliente y migrar:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

Para seed (una vez implementado):
```bash
npx tsx prisma/seed.ts
```

---

## Tema Visual: CompOS

Estética "terminal de competencia" — oscuro, tenso, estilo leaderboard de esports.

Colores base (definidos en `src/app/globals.css` via `@theme inline`):
- `#080c10` — fondo principal (`bg-bg`)
- `#0f1620` — superficie cards (`bg-surface`)
- `#162030` — superficie hover (`bg-surface-2`)
- `#1e3048` — superficie activa (`bg-surface-3`)
- `#1e3a5f` — borde (`border-border`)
- `#3b82f6` — acento azul (`text-accent`)
- `#f59e0b` — ámbar / top 3 (`text-amber`)
- `#64748b` — texto muted (`text-muted`)

Clases utilitarias custom en globals.css: `.glass`, `.glow-blue`, `.glow-amber`

Tipografía:
- `var(--font-geist-sans)` — texto general
- `var(--font-geist-mono)` — datos, puntajes, rankings, código

---

## Estructura de Archivos

```
comp-os/
├── prisma/
│   ├── schema.prisma          ✅ completo
│   └── seed.ts                ⏳ pendiente
├── prisma.config.ts           ✅ generado
├── src/
│   ├── lib/
│   │   └── db.ts              ✅ Prisma singleton
│   ├── generated/prisma/      ← generado por `prisma generate` (no editar)
│   ├── components/
│   │   └── Sidebar.tsx        ✅ completo
│   └── app/
│       ├── globals.css        ✅ tema CompOS
│       ├── layout.tsx         ✅ con Sidebar + Toaster
│       ├── page.tsx           ⏳ Dashboard
│       ├── equipos/
│       │   ├── page.tsx       ⏳ lista de equipos
│       │   ├── new/page.tsx   ⏳ crear equipo
│       │   └── [id]/page.tsx  ⏳ detalle + miembros
│       ├── personas/
│       │   ├── page.tsx       ⏳ lista
│       │   └── new/page.tsx   ⏳ crear
│       ├── fechas/
│       │   ├── page.tsx       ⏳ lista de fechas
│       │   ├── new/page.tsx   ⏳ crear fecha
│       │   └── [id]/page.tsx  ⏳ problemas + grid de resultados
│       ├── ranking/
│       │   └── page.tsx       ⏳ ranking por fecha y acumulado
│       └── api/
│           ├── equipos/route.ts            ✅
│           ├── equipos/[id]/route.ts       ✅
│           ├── equipos/[id]/miembros/route.ts ✅
│           ├── personas/route.ts           ✅
│           ├── personas/[id]/route.ts      ✅
│           ├── fechas/route.ts             ✅
│           ├── fechas/[id]/route.ts        ✅
│           ├── fechas/[id]/problemas/route.ts ✅
│           ├── resultados/route.ts         ✅ (con upsert)
│           └── ranking/route.ts            ✅ (por fecha y acumulado)
```

---

## Estado de Implementación

| Tarea | Estado |
|-------|--------|
| Scaffold Next.js 15 + TypeScript | ✅ |
| Dependencias instaladas | ✅ |
| Prisma schema (8 tablas) | ✅ |
| Layout + Sidebar CompOS | ✅ |
| API routes completos | ✅ |
| Dashboard (stats + ranking global) | ⏳ |
| CRUD Equipos + gestión de miembros | ⏳ |
| CRUD Personas / Competidores | ⏳ |
| Fechas + Problemas + grid de resultados | ⏳ |
| Ranking page (por fecha + acumulado animado) | ⏳ |
| Prisma generate + migrate + seed + test | ⏳ |

---

## Features Planificadas por Sección

### Dashboard `/`
- Cards animadas: total equipos, total personas, fechas completadas, problema más difícil
- Mini-tabla del ranking acumulado actual (top 5)
- Accesos rápidos a las secciones

### Equipos `/equipos`
- Grid de cards por equipo con conteo de miembros y puntuación acumulada
- `/equipos/new` — formulario de creación
- `/equipos/[id]` — detalle: lista de miembros con roles, historial de puntos por fecha

### Personas `/personas`
- Lista con badge de rol (competidor / coach)
- `/personas/new` — formulario; si es competidor, pide fechas académicas y nacimiento
- Badge de equipos en los que participa

### Fechas `/fechas`
- Cards por fecha con tipo (Fecha 0 / Clasificatoria 1-2-3 / Repechaje) y estado
- `/fechas/new` — crear fecha con tipo y número
- `/fechas/[id]` — vista principal: tabla de problemas + grid de captura de puntos
  - Filas: equipos; Columnas: problemas; Celdas: input de puntos (editable inline)
  - Guarda automáticamente al hacer blur en cada celda

### Ranking `/ranking`
- Tabs: "Acumulado" y una por cada fecha clasificatoria
- Tabla animada con posición, nombre de equipo, puntos por clasificatoria, total
- Top 3 con colores oro/plata/bronce
- Reorder animado con Framer Motion al cambiar de tab

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Generar cliente Prisma
npx prisma generate

# Migrar BD
npx prisma migrate dev --name init

# Prisma Studio (explorar datos)
npx prisma studio

# Seed
npx tsx prisma/seed.ts
```

---

## Notas para la Próxima Sesión

1. Antes de escribir páginas, correr `npx prisma generate` para que el cliente exista
2. Las páginas son todas Client Components (`"use client"`) — usan fetch() a los API routes
3. Las formas de colores en Tailwind v4: usar `style={{}}` inline O las clases custom definidas en globals.css. Los tokens `@theme` generan clases como `bg-[color-name]` donde color-name es el nombre después de `--color-`.
4. Al implementar el grid de resultados, usar `onBlur` para guardar (no `onChange`) para evitar spam de requests
5. El seed debe crear: 5 equipos, 10 personas (8 competidores + 2 coaches), 5 fechas (1 fecha_cero + 3 clasificatorias + 1 repechaje), 3-5 problemas por fecha, y resultados de ejemplo
