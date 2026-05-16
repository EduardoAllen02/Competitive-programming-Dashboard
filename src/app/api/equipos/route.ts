import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReplicationHealthy, ReplicationError } from "@/lib/replication";

export async function GET() {
  const equipos = await prisma.equipo.findMany({
    include: {
      miembros: { include: { persona: true } },
      _count: { select: { resultados: true } },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(equipos);
}

export async function POST(req: Request) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const { nombre } = await req.json();
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  const equipo = await prisma.equipo.create({ data: { nombre: nombre.trim() } });
  return NextResponse.json(equipo, { status: 201 });
}
