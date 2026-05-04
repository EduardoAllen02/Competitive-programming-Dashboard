"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const inp = {
  backgroundColor: "#162030",
  border: "1px solid #1e3a5f",
  color: "#e2e8f0",
  borderRadius: 8,
  padding: "10px 12px",
  width: "100%",
  fontSize: 14,
  outline: "none",
} as React.CSSProperties;

export default function NuevaFecha() {
  const router = useRouter();
  const [tipo, setTipo] = useState("clasificatoria");
  const [numero, setNumero] = useState("1");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/fechas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        numero: tipo === "clasificatoria" ? Number(numero) : null,
        fecha,
      }),
    });
    if (res.ok) {
      const f = await res.json();
      toast.success("Fecha creada");
      router.push(`/fechas/${f.id}`);
    } else {
      toast.error("Error al crear");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/fechas" className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Nueva Fecha</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Crear fecha de competencia</p>
      </div>

      <form onSubmit={submit} className="rounded-xl p-6 space-y-5" style={{ backgroundColor: "#0f1620", border: "1px solid #1e3a5f" }}>
        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "#94a3b8" }}>Tipo</label>
          <select style={inp} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="fecha_cero">Fecha 0</option>
            <option value="clasificatoria">Clasificatoria</option>
            <option value="repechaje">Repechaje</option>
          </select>
        </div>

        {tipo === "clasificatoria" && (
          <div className="space-y-1.5">
            <label className="text-sm" style={{ color: "#94a3b8" }}>Número (1, 2 o 3)</label>
            <select style={inp} value={numero} onChange={(e) => setNumero(e.target.value)}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm" style={{ color: "#94a3b8" }}>Fecha</label>
          <input style={inp} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>

        <button
          type="submit"
          disabled={loading || !fecha}
          className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ backgroundColor: "#3b82f6", color: "#fff" }}
        >
          {loading ? "Creando..." : "Crear Fecha"}
        </button>
      </form>
    </div>
  );
}
