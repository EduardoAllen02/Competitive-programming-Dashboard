"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Persona { id: number; nombre_completo: string }
interface Miembro { id: number; rol: string; persona: { id: number; nombre_completo: string } }
interface Equipo { id: number; nombre: string; miembros: Miembro[] }

const ROLES = ["competidor", "sustituto", "coach", "co_coach"];
const ROL_LABEL: Record<string, string> = {
  competidor: "Competidor", sustituto: "Sustituto", coach: "Coach", co_coach: "Co-Coach",
};
const ROL_COLOR: Record<string, string> = {
  competidor: "#3b82f6", sustituto: "#10b981", coach: "#f59e0b", co_coach: "#a78bfa",
};

export default function EquipoDetail() {
  const { id } = useParams();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [personaId, setPersonaId] = useState("");
  const [rol, setRol] = useState("competidor");
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([
      fetch(`/api/equipos/${id}`).then((r) => r.json()),
      fetch("/api/personas").then((r) => r.json()),
    ]).then(([eq, pe]) => {
      setEquipo(eq);
      setPersonas(pe);
    });

  useEffect(() => { load(); }, [id]);

  const addMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/equipos/${id}/miembros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona_id: personaId, rol }),
    });
    if (res.ok) {
      toast.success("Miembro agregado");
      setShowForm(false);
      setPersonaId("");
      load();
    } else {
      toast.error("Error — revisa que la persona no esté ya en el equipo");
    }
    setSaving(false);
  };

  const removeMiembro = async (miembro_id: number, nombre: string) => {
    if (!confirm(`¿Quitar a ${nombre} del equipo?`)) return;
    await fetch(`/api/equipos/${id}/miembros`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miembro_id }),
    });
    toast.success("Miembro eliminado");
    load();
  };

  if (!equipo) return <div className="text-sm" style={{ color: "#64748b" }}>Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/equipos" className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
        <ArrowLeft className="w-4 h-4" /> Equipos
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>{equipo.nombre}</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>{equipo.miembros.length} miembros</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: "#1e3048", color: "#3b82f6", border: "1px solid #1e3a5f" }}
        >
          <UserPlus className="w-4 h-4" /> Agregar miembro
        </button>
      </div>

      {/* Formulario agregar miembro */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={addMiembro}
          className="glass rounded-xl p-5 space-y-4"
          style={{ border: "1px solid #1e3a5f" }}
        >
          <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>Agregar persona al equipo</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#64748b" }}>Persona</label>
              <select
                value={personaId}
                onChange={(e) => setPersonaId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "#162030", border: "1px solid #1e3a5f", color: "#e2e8f0" }}
              >
                <option value="">Seleccionar...</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#64748b" }}>Rol</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "#162030", border: "1px solid #1e3a5f", color: "#e2e8f0" }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !personaId} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40" style={{ backgroundColor: "#3b82f6", color: "#fff" }}>
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: "#64748b" }}>
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {/* Lista de miembros */}
      <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid #1e3a5f" }}>
        <div className="px-5 py-3 border-b text-xs font-medium uppercase tracking-wider" style={{ borderColor: "#1e3a5f", color: "#64748b" }}>
          Miembros
        </div>
        {equipo.miembros.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "#64748b" }}>Sin miembros. Agrega el primero.</div>
        ) : (
          equipo.miembros.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-5 py-3.5 border-b last:border-b-0"
              style={{ borderColor: "#1e3a5f" }}
            >
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${ROL_COLOR[m.rol]}18`, color: ROL_COLOR[m.rol], border: `1px solid ${ROL_COLOR[m.rol]}40` }}
              >
                {ROL_LABEL[m.rol]}
              </span>
              <span className="flex-1 text-sm" style={{ color: "#e2e8f0" }}>{m.persona.nombre_completo}</span>
              <button onClick={() => removeMiembro(m.id, m.persona.nombre_completo)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "#64748b" }} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
