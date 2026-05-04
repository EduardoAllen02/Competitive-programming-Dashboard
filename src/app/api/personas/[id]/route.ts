import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const persona = await prisma.persona.findUnique({
    where: { id: Number(id) },
    include: { competidor: true, miembros: { include: { equipo: true } } },
  });
  if (!persona) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(persona);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre_completo, correo_electronico } = await req.json();
  const persona = await prisma.persona.update({
    where: { id: Number(id) },
    data: { nombre_completo: nombre_completo.trim(), correo_electronico: correo_electronico.trim() },
  });
  return NextResponse.json(persona);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.persona.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
