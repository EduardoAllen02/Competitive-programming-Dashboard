import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Personas
  const personas = await Promise.all([
    prisma.persona.upsert({
      where: { correo_electronico: "ana.garcia@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Ana García López",
        correo_electronico: "ana.garcia@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2002-03-15"), fecha_inicio_estudios: new Date("2020-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "carlos.perez@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Carlos Pérez Martínez",
        correo_electronico: "carlos.perez@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2001-07-22"), fecha_inicio_estudios: new Date("2019-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "sofia.ruiz@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Sofía Ruiz Hernández",
        correo_electronico: "sofia.ruiz@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2003-01-10"), fecha_inicio_estudios: new Date("2021-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "miguel.torres@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Miguel Torres Vega",
        correo_electronico: "miguel.torres@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2002-11-05"), fecha_inicio_estudios: new Date("2020-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "lucia.mendez@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Lucía Méndez Castro",
        correo_electronico: "lucia.mendez@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2001-09-18"), fecha_inicio_estudios: new Date("2019-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "roberto.silva@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Roberto Silva Reyes",
        correo_electronico: "roberto.silva@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2002-04-30"), fecha_inicio_estudios: new Date("2020-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "diana.flores@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Diana Flores Ortiz",
        correo_electronico: "diana.flores@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2003-06-12"), fecha_inicio_estudios: new Date("2021-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "andres.ramirez@uni.mx" },
      update: {},
      create: {
        nombre_completo: "Andrés Ramírez Luna",
        correo_electronico: "andres.ramirez@uni.mx",
        competidor: { create: { fecha_nacimiento: new Date("2001-12-25"), fecha_inicio_estudios: new Date("2019-08-01") } },
      },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "prof.morales@uni.mx" },
      update: {},
      create: { nombre_completo: "Dr. Juan Morales Soto", correo_electronico: "prof.morales@uni.mx" },
    }),
    prisma.persona.upsert({
      where: { correo_electronico: "prof.guerrero@uni.mx" },
      update: {},
      create: { nombre_completo: "Mtra. Carmen Guerrero Díaz", correo_electronico: "prof.guerrero@uni.mx" },
    }),
  ]);

  console.log(`✅ ${personas.length} personas`);

  // Equipos
  const equipos = await Promise.all([
    prisma.equipo.upsert({ where: { id: 1 }, update: {}, create: { nombre: "Los Compiladores" } }),
    prisma.equipo.upsert({ where: { id: 2 }, update: {}, create: { nombre: "Stack Overflow" } }),
    prisma.equipo.upsert({ where: { id: 3 }, update: {}, create: { nombre: "Null Pointers" } }),
  ]);
  console.log(`✅ ${equipos.length} equipos`);

  // Miembros (3 competidores + 1 coach por equipo)
  const miembros = [
    { equipo_id: 1, persona_id: personas[0].id, rol: "competidor" as const },
    { equipo_id: 1, persona_id: personas[1].id, rol: "competidor" as const },
    { equipo_id: 1, persona_id: personas[2].id, rol: "competidor" as const },
    { equipo_id: 1, persona_id: personas[8].id, rol: "coach" as const },
    { equipo_id: 2, persona_id: personas[3].id, rol: "competidor" as const },
    { equipo_id: 2, persona_id: personas[4].id, rol: "competidor" as const },
    { equipo_id: 2, persona_id: personas[5].id, rol: "competidor" as const },
    { equipo_id: 2, persona_id: personas[9].id, rol: "coach" as const },
    { equipo_id: 3, persona_id: personas[6].id, rol: "competidor" as const },
    { equipo_id: 3, persona_id: personas[7].id, rol: "competidor" as const },
    { equipo_id: 3, persona_id: personas[0].id, rol: "sustituto" as const },
    { equipo_id: 3, persona_id: personas[8].id, rol: "co_coach" as const },
  ];

  for (const m of miembros) {
    await prisma.miembroEquipo.upsert({
      where: { equipo_id_persona_id: { equipo_id: m.equipo_id, persona_id: m.persona_id } },
      update: {},
      create: m,
    });
  }
  console.log(`✅ ${miembros.length} miembros asignados`);

  // Fechas de competencia
  const fecha0 = await prisma.fechaCompetencia.upsert({ where: { id: 1 }, update: {}, create: { tipo: "fecha_cero", fecha: new Date("2025-08-30") } });
  const clasi1 = await prisma.fechaCompetencia.upsert({ where: { id: 2 }, update: {}, create: { tipo: "clasificatoria", numero: 1, fecha: new Date("2025-09-20") } });
  const clasi2 = await prisma.fechaCompetencia.upsert({ where: { id: 3 }, update: {}, create: { tipo: "clasificatoria", numero: 2, fecha: new Date("2025-10-18") } });
  const clasi3 = await prisma.fechaCompetencia.upsert({ where: { id: 4 }, update: {}, create: { tipo: "clasificatoria", numero: 3, fecha: new Date("2025-11-15") } });
  const repechaje = await prisma.fechaCompetencia.upsert({ where: { id: 5 }, update: {}, create: { tipo: "repechaje", fecha: new Date("2025-12-06") } });
  console.log("✅ 5 fechas creadas");

  // Problemas y asignación a fechas
  const problemasData = [
    { nombre: "Two Sum", descripcion: "Encontrar dos números que sumen un objetivo dado" },
    { nombre: "Fibonacci Mod", descripcion: "Calcular el n-ésimo Fibonacci módulo 10^9+7" },
    { nombre: "BFS Laberinto", descripcion: "Encontrar el camino más corto en una cuadrícula" },
    { nombre: "Max Subarray", descripcion: "Subarreglo contiguo de suma máxima (Kadane)" },
    { nombre: "Árbol Binario", descripcion: "Recorrido inorden de árbol binario de búsqueda" },
  ];

  const problemas = [];
  for (let i = 0; i < problemasData.length; i++) {
    const p = await prisma.problema.upsert({
      where: { id: i + 1 },
      update: {},
      create: problemasData[i],
    });
    problemas.push(p);
  }

  // Asignar problemas a cada fecha
  const asignaciones = [
    { fecha_id: fecha0.id, problema_id: problemas[0].id },
    { fecha_id: fecha0.id, problema_id: problemas[1].id },
    { fecha_id: clasi1.id, problema_id: problemas[0].id },
    { fecha_id: clasi1.id, problema_id: problemas[1].id },
    { fecha_id: clasi1.id, problema_id: problemas[2].id },
    { fecha_id: clasi2.id, problema_id: problemas[1].id },
    { fecha_id: clasi2.id, problema_id: problemas[2].id },
    { fecha_id: clasi2.id, problema_id: problemas[3].id },
    { fecha_id: clasi3.id, problema_id: problemas[2].id },
    { fecha_id: clasi3.id, problema_id: problemas[3].id },
    { fecha_id: clasi3.id, problema_id: problemas[4].id },
    { fecha_id: repechaje.id, problema_id: problemas[3].id },
    { fecha_id: repechaje.id, problema_id: problemas[4].id },
  ];

  for (const a of asignaciones) {
    await prisma.fechaProblema.upsert({
      where: { fecha_id_problema_id: { fecha_id: a.fecha_id, problema_id: a.problema_id } },
      update: {},
      create: a,
    });
  }
  console.log(`✅ ${problemas.length} problemas, ${asignaciones.length} asignaciones`);

  // Resultados de ejemplo (clasificatorias)
  const resultados = [
    // Clasi 1
    { equipo_id: 1, fecha_id: clasi1.id, problema_id: problemas[0].id, puntos_obtenidos: 100 },
    { equipo_id: 1, fecha_id: clasi1.id, problema_id: problemas[1].id, puntos_obtenidos: 75 },
    { equipo_id: 1, fecha_id: clasi1.id, problema_id: problemas[2].id, puntos_obtenidos: 50 },
    { equipo_id: 2, fecha_id: clasi1.id, problema_id: problemas[0].id, puntos_obtenidos: 100 },
    { equipo_id: 2, fecha_id: clasi1.id, problema_id: problemas[1].id, puntos_obtenidos: 100 },
    { equipo_id: 2, fecha_id: clasi1.id, problema_id: problemas[2].id, puntos_obtenidos: 25 },
    { equipo_id: 3, fecha_id: clasi1.id, problema_id: problemas[0].id, puntos_obtenidos: 75 },
    { equipo_id: 3, fecha_id: clasi1.id, problema_id: problemas[1].id, puntos_obtenidos: 50 },
    { equipo_id: 3, fecha_id: clasi1.id, problema_id: problemas[2].id, puntos_obtenidos: 0 },
    // Clasi 2
    { equipo_id: 1, fecha_id: clasi2.id, problema_id: problemas[1].id, puntos_obtenidos: 100 },
    { equipo_id: 1, fecha_id: clasi2.id, problema_id: problemas[2].id, puntos_obtenidos: 100 },
    { equipo_id: 1, fecha_id: clasi2.id, problema_id: problemas[3].id, puntos_obtenidos: 75 },
    { equipo_id: 2, fecha_id: clasi2.id, problema_id: problemas[1].id, puntos_obtenidos: 75 },
    { equipo_id: 2, fecha_id: clasi2.id, problema_id: problemas[2].id, puntos_obtenidos: 50 },
    { equipo_id: 2, fecha_id: clasi2.id, problema_id: problemas[3].id, puntos_obtenidos: 100 },
    { equipo_id: 3, fecha_id: clasi2.id, problema_id: problemas[1].id, puntos_obtenidos: 100 },
    { equipo_id: 3, fecha_id: clasi2.id, problema_id: problemas[2].id, puntos_obtenidos: 75 },
    { equipo_id: 3, fecha_id: clasi2.id, problema_id: problemas[3].id, puntos_obtenidos: 50 },
  ];

  for (const r of resultados) {
    await prisma.resultado.upsert({
      where: { equipo_id_fecha_id_problema_id: { equipo_id: r.equipo_id, fecha_id: r.fecha_id, problema_id: r.problema_id } },
      update: { puntos_obtenidos: r.puntos_obtenidos },
      create: r,
    });
  }
  console.log(`✅ ${resultados.length} resultados de ejemplo`);

  console.log("\n🚀 Seed completo!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
