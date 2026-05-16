import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Rol } from "@/generated/prisma";
import { assertReplicationHealthy, ReplicationError } from "@/lib/replication";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const { id } = await params;
  const { persona_id, rol } = await req.json();
  const miembro = await prisma.miembroEquipo.create({
    data: { equipo_id: Number(id), persona_id: Number(persona_id), rol: rol as Rol },
    include: { persona: true },
  });
  return NextResponse.json(miembro, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await assertReplicationHealthy(); }
  catch (e) { if (e instanceof ReplicationError) return NextResponse.json({ error: e.message }, { status: 503 }); throw e; }

  const { id } = await params;
  const { miembro_id } = await req.json();
  await prisma.miembroEquipo.delete({ where: { id: Number(miembro_id) } });
  return NextResponse.json({ ok: true });
}
