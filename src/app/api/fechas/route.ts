import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TipoFecha } from "@/generated/prisma/client";

export async function GET() {
  const fechas = await prisma.fechaCompetencia.findMany({
    include: {
      problemas: { include: { problema: true } },
      _count: { select: { problemas: true } },
    },
    orderBy: [{ tipo: "asc" }, { numero: "asc" }, { fecha: "asc" }],
  });
  return NextResponse.json(fechas);
}

export async function POST(req: Request) {
  const { tipo, numero, fecha } = await req.json();
  if (!tipo || !fecha) {
    return NextResponse.json({ error: "Tipo y fecha requeridos" }, { status: 400 });
  }
  const nuevaFecha = await prisma.fechaCompetencia.create({
    data: {
      tipo: tipo as TipoFecha,
      numero: numero ? Number(numero) : null,
      fecha: new Date(fecha),
    },
  });
  return NextResponse.json(nuevaFecha, { status: 201 });
}
