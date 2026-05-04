import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipo = await prisma.equipo.findUnique({
    where: { id: Number(id) },
    include: {
      miembros: { include: { persona: { include: { competidor: true } } } },
    },
  });
  if (!equipo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(equipo);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre } = await req.json();
  const equipo = await prisma.equipo.update({
    where: { id: Number(id) },
    data: { nombre: nombre.trim() },
  });
  return NextResponse.json(equipo);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.equipo.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
