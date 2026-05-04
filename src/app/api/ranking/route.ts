import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fecha_id = searchParams.get("fecha_id");

  if (fecha_id) {
    // Ranking por fecha específica
    const resultados = await prisma.resultado.findMany({
      where: { fecha_id: Number(fecha_id) },
      include: { equipo: true },
    });

    const agrupado: Record<number, { equipo: { id: number; nombre: string }; total: number }> = {};
    for (const r of resultados) {
      if (!agrupado[r.equipo_id]) {
        agrupado[r.equipo_id] = { equipo: r.equipo, total: 0 };
      }
      agrupado[r.equipo_id].total += r.puntos_obtenidos;
    }

    const ranking = Object.values(agrupado)
      .sort((a, b) => b.total - a.total)
      .map((item, i) => ({ posicion: i + 1, ...item }));

    return NextResponse.json(ranking);
  }

  // Ranking acumulado: solo clasificatorias
  const clasificatorias = await prisma.fechaCompetencia.findMany({
    where: { tipo: "clasificatoria" },
    select: { id: true, numero: true },
  });

  const ids = clasificatorias.map((f) => f.id);

  const resultados = await prisma.resultado.findMany({
    where: { fecha_id: { in: ids } },
    include: { equipo: true },
  });

  const agrupado: Record<number, { equipo: { id: number; nombre: string }; total: number; porFecha: Record<number, number> }> = {};
  for (const r of resultados) {
    if (!agrupado[r.equipo_id]) {
      agrupado[r.equipo_id] = { equipo: r.equipo, total: 0, porFecha: {} };
    }
    agrupado[r.equipo_id].total += r.puntos_obtenidos;
    agrupado[r.equipo_id].porFecha[r.fecha_id] =
      (agrupado[r.equipo_id].porFecha[r.fecha_id] || 0) + r.puntos_obtenidos;
  }

  // Incluir equipos sin resultados con 0
  const todosEquipos = await prisma.equipo.findMany();
  for (const eq of todosEquipos) {
    if (!agrupado[eq.id]) {
      agrupado[eq.id] = { equipo: eq, total: 0, porFecha: {} };
    }
  }

  const ranking = Object.values(agrupado)
    .sort((a, b) => b.total - a.total)
    .map((item, i) => ({ posicion: i + 1, ...item, clasificatorias }));

  return NextResponse.json(ranking);
}
