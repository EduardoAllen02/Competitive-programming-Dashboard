"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Problema { id: number; nombre: string; descripcion: string }
interface FechaProblema { fecha_id: number; problema_id: number; problema: Problema }
interface Equipo { id: number; nombre: string }
interface Fecha {
  id: number; tipo: string; numero: number | null; fecha: string;
  problemas: FechaProblema[];
}

const TIPO_LABEL: Record<string, string> = {
  fecha_cero: "Fecha 0", clasificatoria: "Clasificatoria", repechaje: "Repechaje",
};

function ScoreCell({
  valor, onChange,
}: {
  valor: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(valor));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setLocal(String(valor)), [valor]);

  return (
    <input
      ref={ref}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        const n = parseInt(local);
        if (!isNaN(n) && n >= 0 && n !== valor) onChange(n);
        else setLocal(String(valor));
      }}
      onKeyDown={(e) => { if (e.key === "Enter") ref.current?.blur(); }}
      className="w-16 text-center text-sm rounded py-1"
      style={{
        backgroundColor: "#162030",
        border: "1px solid #1e3a5f",
        color: local !== "0" ? "#3b82f6" : "#64748b",
        fontFamily: "var(--font-geist-mono)",
        outline: "none",
      }}
    />
  );
}

export default function FechaDetail() {
  const { id } = useParams();
  const [fecha, setFecha] = useState<Fecha | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [newProblema, setNewProblema] = useState({ nombre: "", descripcion: "" });
  const [saving, setSaving] = useState(false);

  const key = (eq: number, pr: number) => `${eq}-${pr}`;

  const load = async () => {
    const [f, eq, res] = await Promise.all([
      fetch(`/api/fechas/${id}`).then((r) => r.json()),
      fetch("/api/equipos").then((r) => r.json()),
      fetch(`/api/resultados?fecha_id=${id}`).then((r) => r.json()),
    ]);
    setFecha(f);
    setEquipos(eq);
    const map: Record<string, number> = {};
    for (const r of res) map[key(r.equipo_id, r.problema_id)] = r.puntos_obtenidos;
    setScores(map);
  };

  useEffect(() => { load(); }, [id]);

  const saveScore = async (equipo_id: number, problema_id: number, puntos: number) => {
    await fetch("/api/resultados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipo_id, fecha_id: Number(id), problema_id, puntos_obtenidos: puntos }),
    });
    setScores((prev) => ({ ...prev, [key(equipo_id, problema_id)]: puntos }));
    toast.success("Guardado", { duration: 1200 });
  };

  const addProblema = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/fechas/${id}/problemas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProblema),
    });
    if (res.ok) {
      toast.success("Problema agregado");
      setNewProblema({ nombre: "", descripcion: "" });
      setShowForm(false);
      load();
    } else {
      toast.error("Error al agregar");
    }
    setSaving(false);
  };

  const removeProblema = async (problema_id: number, nombre: string) => {
    if (!confirm(`¿Quitar "${nombre}" de esta fecha?`)) return;
    await fetch(`/api/fechas/${id}/problemas`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problema_id }),
    });
    toast.success("Problema eliminado");
    load();
  };

  if (!fecha) return <div className="text-sm" style={{ color: "#64748b" }}>Cargando...</div>;

  const etiqueta = fecha.tipo === "clasificatoria"
    ? `Clasificatoria ${fecha.numero}`
    : TIPO_LABEL[fecha.tipo];

  const inp = {
    backgroundColor: "#162030", border: "1px solid #1e3a5f",
    color: "#e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", width: "100%",
  } as React.CSSProperties;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/fechas" className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
        <ArrowLeft className="w-4 h-4" /> Fechas
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>{etiqueta}</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b", fontFamily: "var(--font-geist-mono)" }}>
            {new Date(fecha.fecha).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "#1e3048", color: "#3b82f6", border: "1px solid #1e3a5f" }}
        >
          <Plus className="w-4 h-4" /> Agregar problema
        </button>
      </div>

      {/* Form nuevo problema */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={addProblema}
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: "#0f1620", border: "1px solid #1e3a5f" }}
        >
          <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>Nuevo Problema</p>
          <div className="grid grid-cols-2 gap-3">
            <input style={inp} placeholder="Nombre" value={newProblema.nombre}
              onChange={(e) => setNewProblema((p) => ({ ...p, nombre: e.target.value }))} required />
            <input style={inp} placeholder="Descripción breve" value={newProblema.descripcion}
              onChange={(e) => setNewProblema((p) => ({ ...p, descripcion: e.target.value }))} required />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "#3b82f6", color: "#fff" }}>
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: "#64748b" }}>
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {/* Grid de resultados */}
      {fecha.problemas.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: "#0f1620", border: "1px solid #1e3a5f" }}>
          <p className="text-sm" style={{ color: "#64748b" }}>Sin problemas. Agrega el primero.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#0f1620", border: "1px solid #1e3a5f" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3a5f" }}>
                  <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                    Equipo
                  </th>
                  {fecha.problemas.map((fp) => (
                    <th key={fp.problema_id} className="px-3 py-3 text-center" style={{ color: "#64748b", minWidth: 100 }}>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{fp.problema.nombre}</span>
                        <button onClick={() => removeProblema(fp.problema_id, fp.problema.nombre)}
                          className="p-0.5 rounded hover:bg-red-500/10 transition-colors">
                          <X className="w-3 h-3" style={{ color: "#64748b" }} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((eq, i) => {
                  const total = fecha.problemas.reduce(
                    (s, fp) => s + (scores[key(eq.id, fp.problema_id)] ?? 0), 0
                  );
                  return (
                    <tr key={eq.id} style={{ borderBottom: i < equipos.length - 1 ? "1px solid #1e3a5f" : "none" }}>
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{eq.nombre}</span>
                      </td>
                      {fecha.problemas.map((fp) => (
                        <td key={fp.problema_id} className="px-3 py-3 text-center">
                          <ScoreCell
                            valor={scores[key(eq.id, fp.problema_id)] ?? 0}
                            onChange={(v) => saveScore(eq.id, fp.problema_id, v)}
                          />
                        </td>
                      ))}
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold" style={{ fontFamily: "var(--font-geist-mono)", color: total > 0 ? "#3b82f6" : "#64748b" }}>
                          {total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
