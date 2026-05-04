import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const personas = await prisma.persona.findMany({
    include: { competidor: true, miembros: { include: { equipo: true } } },
    orderBy: { nombre_completo: "asc" },
  });
  return NextResponse.json(personas);
}

export async function POST(req: Request) {
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
