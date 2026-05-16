"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const inputStyle = (hasError: boolean) => ({
  backgroundColor: "#162030",
  border: `1px solid ${hasError ? "#ef4444" : "#1e3a5f"}`,
  color: "#e2e8f0",
  borderRadius: 8,
  padding: "10px 12px",
  width: "100%",
  fontSize: 14,
  outline: "none",
} as React.CSSProperties);

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{msg}</p>;
}

const NOMBRE_RE = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-\.]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const next = { ...e }; delete next[k]; return next; });
  };

  function validate() {
    const e: Record<string, string> = {};

    const nombre = form.nombre_completo.trim();
    if (!nombre) e.nombre_completo = "El nombre es requerido";
    else if (nombre.length < 2) e.nombre_completo = "Mínimo 2 caracteres";
    else if (nombre.length > 80) e.nombre_completo = "Máximo 80 caracteres";
    else if (!NOMBRE_RE.test(nombre)) e.nombre_completo = "Solo letras, espacios y guiones — sin números ni símbolos";

    const email = form.correo_electronico.trim();
    if (!email) e.correo_electronico = "El correo es requerido";
    else if (!EMAIL_RE.test(email)) e.correo_electronico = "Ingresa un correo válido (ej. usuario@dominio.com)";

    if (form.es_competidor) {
      if (!form.fecha_nacimiento) {
        e.fecha_nacimiento = "La fecha de nacimiento es requerida";
      } else {
        const hoy = new Date();
        const nac = new Date(form.fecha_nacimiento);
        const edadAnios = (hoy.getTime() - nac.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (nac >= hoy) e.fecha_nacimiento = "Debe ser una fecha pasada";
        else if (edadAnios < 13) e.fecha_nacimiento = "Edad mínima: 13 años";
        else if (edadAnios > 100) e.fecha_nacimiento = "Fecha de nacimiento inválida";
      }

      if (!form.fecha_inicio_estudios) {
        e.fecha_inicio_estudios = "La fecha de inicio es requerida";
      } else if (form.fecha_nacimiento) {
        const nac = new Date(form.fecha_nacimiento);
        const ini = new Date(form.fecha_inicio_estudios);
        if (ini <= nac) e.fecha_inicio_estudios = "Debe ser posterior a la fecha de nacimiento";
      }

      if (form.fecha_termino_estudios && form.fecha_inicio_estudios) {
        const ini = new Date(form.fecha_inicio_estudios);
        const ter = new Date(form.fecha_termino_estudios);
        if (ter < ini) e.fecha_termino_estudios = "Debe ser posterior a la fecha de inicio";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        nombre_completo: form.nombre_completo.trim(),
        correo_electronico: form.correo_electronico.trim().toLowerCase(),
      }),
    });
    if (res.ok) {
      toast.success("Persona registrada");
      router.push("/personas");
    } else {
      const err = await res.json();
      if (err.error?.includes("correo") || err.error?.includes("unique") || err.error?.includes("Unique")) {
        setErrors({ correo_electronico: "Este correo ya está registrado" });
      } else {
        toast.error(err.error || "Error al guardar");
      }
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
          <input
            style={inputStyle(!!errors.nombre_completo)}
            value={form.nombre_completo}
            onChange={(e) => set("nombre_completo", e.target.value)}
            placeholder="Nombre Apellido"
          />
          <FieldError msg={errors.nombre_completo} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "#94a3b8" }}>Correo electrónico</label>
          <input
            style={inputStyle(!!errors.correo_electronico)}
            type="email"
            value={form.correo_electronico}
            onChange={(e) => set("correo_electronico", e.target.value)}
            placeholder="correo@ejemplo.com"
          />
          <FieldError msg={errors.correo_electronico} />
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
              <input
                style={inputStyle(!!errors.fecha_nacimiento)}
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => set("fecha_nacimiento", e.target.value)}
              />
              <FieldError msg={errors.fecha_nacimiento} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: "#94a3b8" }}>Inicio de estudios</label>
                <input
                  style={inputStyle(!!errors.fecha_inicio_estudios)}
                  type="date"
                  value={form.fecha_inicio_estudios}
                  onChange={(e) => set("fecha_inicio_estudios", e.target.value)}
                />
                <FieldError msg={errors.fecha_inicio_estudios} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm" style={{ color: "#94a3b8" }}>Término (opcional)</label>
                <input
                  style={inputStyle(!!errors.fecha_termino_estudios)}
                  type="date"
                  value={form.fecha_termino_estudios}
                  onChange={(e) => set("fecha_termino_estudios", e.target.value)}
                />
                <FieldError msg={errors.fecha_termino_estudios} />
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
