"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuevoEquipo() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setLoading(true);
    const res = await fetch("/api/equipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    if (res.ok) {
      const eq = await res.json();
      toast.success("Equipo creado");
      router.push(`/equipos/${eq.id}`);
    } else {
      toast.error("Error al crear el equipo");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/equipos" className="flex items-center gap-2 text-sm transition-colors" style={{ color: "#64748b" }}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Nuevo Equipo</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Los miembros se asignan después</p>
      </div>

      <form onSubmit={submit} className="glass rounded-xl p-6 space-y-5" style={{ border: "1px solid #1e3a5f" }}>
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#94a3b8" }}>Nombre del equipo</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Los Compiladores"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
            style={{
              backgroundColor: "#162030",
              border: "1px solid #1e3a5f",
              color: "#e2e8f0",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#1e3a5f")}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || !nombre.trim()}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "#3b82f6", color: "#fff" }}
        >
          {loading ? "Creando..." : "Crear Equipo"}
        </button>
      </form>
    </div>
  );
}
