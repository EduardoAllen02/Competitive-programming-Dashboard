"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const input = {
  backgroundColor: "#162030",
  border: "1px solid #1e3a5f",
  color: "#e2e8f0",
  borderRadius: 8,
  padding: "10px 12px",
  width: "100%",
  fontSize: 14,
  outline: "none",
} as React.CSSProperties;

export default function NuevoPersona() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre_completo: "",
    correo_electronico: "",
    es_competidor: false,
    fecha_inicio_estudios: "",
    fecha_termino_estudios: "",
    fecha_nacimiento: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Persona registrada");
      router.push("/personas");
    } else {
      const err = await res.json();
      toast.error(err.error || "Error al guardar");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/personas" className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Nueva Persona</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Competidor o coach</p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-xl p-6" style={{ backgroundColor: "#0f1620", border: "1px solid #1e3a5f" }}>
        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "#94a3b8" }}>Nombre completo</label>
          <input style={input} value={form.nombre_completo} onChange={(e) => set("nombre_completo", e.target.value)} required placeholder="Nombre Apellido" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "#94a3b8" }}>Correo electrónico</label>
          <input style={input} type="email" value={form.correo_electronico} onChange={(e) => set("correo_electronico", e.target.value)} required placeholder="correo@ejemplo.com" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.es_competidor}
            onChange={(e) => set("es_competidor", e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
          <span className="text-sm" style={{ color: "#94a3b8" }}>Es competidor (tiene datos académicos)</span>
        </label>

        {form.es_competidor && (
          <div className="space-y-4 pt-2 border-t" style={{ borderColor: "#1e3a5f" }}>
            <div className="space-y-1.5">
              <label className="text-sm" style={{ color: "#94a3b8" }}>Fecha de nacimiento</label>
              <input style={input} type="date" value={form.fecha_nacimiento} onChange={(e) => set("fecha_nacimiento", e.target.value)} required={form.es_competidor} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: "#94a3b8" }}>Inicio de estudios</label>
                <input style={input} type="date" value={form.fecha_inicio_estudios} onChange={(e) => set("fecha_inicio_estudios", e.target.value)} required={form.es_competidor} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: "#94a3b8" }}>Término (opcional)</label>
                <input style={input} type="date" value={form.fecha_termino_estudios} onChange={(e) => set("fecha_termino_estudios", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "#3b82f6", color: "#fff" }}
        >
          {loading ? "Guardando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}
