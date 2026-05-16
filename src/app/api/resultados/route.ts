import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReplicationHealthy, ReplicationError } from "@/lib/replication";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fecha_id = searchParams.get("fecha_id");

  const resultados = await prisma.resultado.findMany({
    where: fecha_id ? { fecha_id: Number(fecha_id) } : undefined,
    include: { equipo: true },
  });
  return NextResponse.json(resultados);
}

export async function POST(req: Request) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const { equipo_id, fecha_id, problema_id, puntos_obtenidos } = await req.json();

  const resultado = await prisma.resultado.upsert({
    where: {
      equipo_id_fecha_id_problema_id: {
        equipo_id: Number(equipo_id),
        fecha_id: Number(fecha_id),
        problema_id: Number(problema_id),
      },
    },
    update: { puntos_obtenidos: Number(puntos_obtenidos) },
    create: {
      equipo_id: Number(equipo_id),
      fecha_id: Number(fecha_id),
      problema_id: Number(problema_id),
      puntos_obtenidos: Number(puntos_obtenidos),
    },
  });
  return NextResponse.json(resultado);
}
