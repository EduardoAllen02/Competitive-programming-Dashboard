import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fecha = await prisma.fechaCompetencia.findUnique({
    where: { id: Number(id) },
    include: {
      problemas: { include: { problema: true } },
    },
  });
  if (!fecha) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(fecha);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.fechaCompetencia.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
