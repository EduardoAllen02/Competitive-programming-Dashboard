import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertReplicationHealthy, ReplicationError } from "@/lib/replication";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const { id } = await params;
  const { nombre, descripcion, teoria } = await req.json();

  if (!nombre?.trim() || !descripcion?.trim()) {
    return NextResponse.json({ error: "Nombre y descripción requeridos" }, { status: 400 });
  }

  const problema = await prisma.problema.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      teoria: teoria?.trim() || null,
      fechas: {
        create: { fecha_id: Number(id) },
      },
    },
    include: { fechas: true },
  });
  return NextResponse.json(problema, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const { id } = await params;
  const { problema_id } = await req.json();
  await prisma.fechaProblema.delete({
    where: { fecha_id_problema_id: { fecha_id: Number(id), problema_id: Number(problema_id) } },
  });
  return NextResponse.json({ ok: true });
}
