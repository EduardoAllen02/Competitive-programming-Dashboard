"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Trash2, Mail, Users } from "lucide-react";
import { toast } from "sonner";

interface Persona {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  competidor: { fecha_nacimiento: string } | null;
  miembros: { rol: string; equipo: { nombre: string } }[];
}

const ROL_COLOR: Record<string, string> = {
  competidor: "#aaff00", sustituto: "#7c3aed", coach: "#ffb800", co_coach: "#ff6b35",
};
const ROL_LABEL: Record<string, string> = {
  competidor: "Competidor", sustituto: "Sustituto", coach: "Coach", co_coach: "Co-Coach",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#aaff00", "#7c3aed", "#ffb800", "#00ff88", "#f472b6", "#ff6b35"];

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/personas").then(r => r.json()).catch(() => [])
      .then(d => setPersonas(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const eliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar a "${nombre}"?`)) return;
    await fetch(`/api/personas/${id}`, { method: "DELETE" });
    toast.success(`"${nombre}" eliminado`);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="flex items-end justify-between mb-10 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-3 h-3" style={{ color: "#aaff00" }} />
            <span style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)", fontSize: 11 }} className="uppercase tracking-[0.25em]">
              Competidores y Staff
            </span>
          </div>
          <h1 className="text-5xl font-black leading-none">
            <span style={{ color: "#ffffff" }}>Perso</span>
            <span className="neon-text" style={{ fontStyle: "italic" }}>nas</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "#a0a0c0" }}>
            {loading ? "—" : `${personas.length} persona${personas.length !== 1 ? "s" : ""} registrada${personas.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #aaff00, transparent)" }} />
            <div style={{ width: 8, height: 2, background: "#aaff0033" }} />
          </div>
        </div>
        <Link href="/personas/new">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(170,255,0,0.5)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #aaff00, #0090bb)", color: "#000", boxShadow: "0 0 24px rgba(170,255,0,0.3)" }}>
            <Plus className="w-4 h-4" /> Nueva Persona
          </motion.button>
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-3 py-8" style={{ color: "#40405a" }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: "#aaff00", borderTopColor: "transparent" }} />
          <span className="text-sm">Cargando personas...</span>
        </div>
      ) : personas.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-16 text-center"
          style={{ background: "linear-gradient(135deg, #0c0c14, #0e0e1c)", border: "1px solid #1c1c30" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(170,255,0,0.06)", border: "1px solid rgba(170,255,0,0.1)" }}>
            <User className="w-7 h-7" style={{ color: "#40405a" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#a0a0c0" }}>No hay personas registradas</p>
          <p className="text-xs" style={{ color: "#40405a" }}>Agrega competidores y coaches</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl overflow-hidden scanline"
          style={{ background: "linear-gradient(135deg, #0c0c14, #0e0e1c)", border: "1px solid #1c1c30" }}>

          {/* Table header */}
          <div className="flex items-center gap-4 px-6 py-3 text-xs uppercase tracking-wider"
            style={{ borderBottom: "1px solid #1c1c30", color: "#40405a", fontFamily: "var(--font-geist-mono)", background: "rgba(170,255,0,0.02)" }}>
            <span className="w-8" />
            <span className="flex-1">Nombre</span>
            <span className="hidden md:block w-48">Correo</span>
            <span className="w-32 text-center">Equipos</span>
            <span className="w-8" />
          </div>

          <AnimatePresence>
            {personas.map((p, i) => {
              const avatarColor = AVATAR_COLORS[p.id % AVATAR_COLORS.length];
              const mainRol = p.miembros[0]?.rol ?? null;
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                  className="flex items-center gap-4 px-6 py-3.5 transition-all duration-200"
                  style={{ borderBottom: "1px solid #1c1c2a" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(170,255,0,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: `linear-gradient(135deg, ${avatarColor}20, ${avatarColor}08)`, border: `1px solid ${avatarColor}25`, color: avatarColor, fontFamily: "var(--font-geist-mono)" }}>
                    {initials(p.nombre_completo)}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: "#ffffff" }}>
                        {p.nombre_completo}
                      </span>
                      {mainRol && (
                        <span className="badge shrink-0"
                          style={{ background: `${ROL_COLOR[mainRol]}12`, color: ROL_COLOR[mainRol], border: `1px solid ${ROL_COLOR[mainRol]}25` }}>
                          {ROL_LABEL[mainRol]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="hidden md:flex items-center gap-1.5 w-48">
                    <Mail className="w-3 h-3 shrink-0" style={{ color: "#40405a" }} />
                    <span className="text-xs truncate" style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)" }}>
                      {p.correo_electronico}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="w-32 flex items-center justify-center gap-1 flex-wrap">
                    {p.miembros.length === 0 ? (
                      <span className="text-xs" style={{ color: "#40405a" }}>—</span>
                    ) : (
                      <>
                        {p.miembros.slice(0, 2).map((m, j) => (
                          <span key={j} className="badge"
                            style={{ background: "rgba(255,255,255,0.04)", color: "#a0a0c0", border: "1px solid #1c1c30" }}>
                            {m.equipo.nombre.split(" ")[0]}
                          </span>
                        ))}
                        {p.miembros.length > 2 && (
                          <span className="text-xs" style={{ color: "#40405a" }}>+{p.miembros.length - 2}</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Delete */}
                  <button onClick={() => eliminar(p.id, p.nombre_completo)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/10"
                    style={{ color: "#40405a" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
