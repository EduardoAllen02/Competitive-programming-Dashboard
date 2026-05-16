import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReplicationHealthy, ReplicationError } from "@/lib/replication";

export async function GET() {
  const personas = await prisma.persona.findMany({
    include: { competidor: true, miembros: { include: { equipo: true } } },
    orderBy: { nombre_completo: "asc" },
  });
  return NextResponse.json(personas);
}

export async function POST(req: Request) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const body = await req.json();
  const { nombre_completo, correo_electronico, es_competidor, fecha_inicio_estudios, fecha_termino_estudios, fecha_nacimiento } = body;

  if (!nombre_completo?.trim() || !correo_electronico?.trim()) {
    return NextResponse.json({ error: "Nombre y correo requeridos" }, { status: 400 });
  }

  const persona = await prisma.persona.create({
    data: {
      nombre_completo: nombre_completo.trim(),
      correo_electronico: correo_electronico.trim(),
      ...(es_competidor && fecha_inicio_estudios && fecha_nacimiento
        ? {
            competidor: {
              create: {
                fecha_inicio_estudios: new Date(fecha_inicio_estudios),
                fecha_termino_estudios: fecha_termino_estudios ? new Date(fecha_termino_estudios) : null,
                fecha_nacimiento: new Date(fecha_nacimiento),
              },
            },
          }
        : {}),
    },
    include: { competidor: true },
  });
  return NextResponse.json(persona, { status: 201 });
}
