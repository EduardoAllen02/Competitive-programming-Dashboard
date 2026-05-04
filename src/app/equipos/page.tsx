"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Plus, Users, Trash2, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";

interface Equipo {
  id: number;
  nombre: string;
  miembros: { id: number; rol: string; persona: { nombre_completo: string } }[];
}

const ROL_COLOR: Record<string, string> = {
  competidor: "#aaff00",
  sustituto: "#7c3aed",
  coach: "#ffb800",
  co_coach: "#ff6b35",
};
const ROL_LABEL: Record<string, string> = {
  competidor: "Comp", sustituto: "Sust", coach: "Coach", co_coach: "Co-C",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const TEAM_ACCENTS = ["#aaff00", "#7c3aed", "#ffb800", "#00ff88", "#ff6b35", "#f472b6"];

function TiltCard({ children, style = {}, className = "" }: {
  children: React.ReactNode; style?: React.CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const rX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 200, damping: 20 });
  const rY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 200, damping: 20 });
  return (
    <motion.div ref={ref}
      onMouseMove={e => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 900, ...style }}
      className={className}
    >{children}</motion.div>
  );
}

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/equipos").then(r => r.json()).catch(() => [])
      .then(d => setEquipos(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const eliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    await fetch(`/api/equipos/${id}`, { method: "DELETE" });
    toast.success(`Equipo "${nombre}" eliminado`);
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
            <Shield className="w-3 h-3" style={{ color: "#aaff00" }} />
            <span style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)", fontSize: 11 }} className="uppercase tracking-[0.25em]">
              Competencias
            </span>
          </div>
          <h1 className="text-5xl font-black leading-none">
            <span style={{ color: "#ffffff" }}>Equi</span>
            <span className="neon-text" style={{ fontStyle: "italic" }}>pos</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "#a0a0c0" }}>
            {loading ? "—" : `${equipos.length} equipo${equipos.length !== 1 ? "s" : ""} registrado${equipos.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #aaff00, transparent)" }} />
            <div style={{ width: 8, height: 2, background: "#aaff0033" }} />
          </div>
        </div>
        <Link href="/equipos/new">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(170,255,0,0.5)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #aaff00, #0090bb)", color: "#000", boxShadow: "0 0 24px rgba(170,255,0,0.3)" }}
          >
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </motion.button>
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-3 py-8" style={{ color: "#40405a" }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: "#aaff00", borderTopColor: "transparent" }} />
          <span className="text-sm">Cargando equipos...</span>
        </div>
      ) : equipos.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-16 text-center"
          style={{ background: "linear-gradient(135deg, #0c0c14, #0e0e1c)", border: "1px solid #1c1c30" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(170,255,0,0.06)", border: "1px solid rgba(170,255,0,0.1)" }}>
            <Users className="w-7 h-7" style={{ color: "#40405a" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#a0a0c0" }}>No hay equipos</p>
          <p className="text-xs" style={{ color: "#40405a" }}>Crea el primero para comenzar</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipos.map((eq, i) => {
            const accent = TEAM_ACCENTS[eq.id % TEAM_ACCENTS.length];
            const compCount = eq.miembros.filter(m => m.rol === "competidor" || m.rol === "sustituto").length;
            const coachCount = eq.miembros.filter(m => m.rol === "coach" || m.rol === "co_coach").length;
            return (
              <motion.div key={eq.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}>
                <TiltCard>
                  <div className="rounded-2xl overflow-hidden transition-all duration-300 group"
                    style={{ background: "linear-gradient(135deg, #0c0c14, #0e0e1c)", border: `1px solid #1c1c30` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accent}30`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${accent}10`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1c1c30"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>

                    {/* Top accent bar */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)` }} />

                    <div className="p-5">
                      {/* Team header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                            style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}08)`, border: `1px solid ${accent}30`, color: accent, fontFamily: "var(--font-geist-mono)" }}>
                            {initials(eq.nombre)}
                          </div>
                          <div>
                            <Link href={`/equipos/${eq.id}`}>
                              <p className="font-bold text-sm hover:opacity-70 transition-opacity cursor-pointer" style={{ color: "#ffffff" }}>
                                {eq.nombre}
                              </p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {compCount > 0 && (
                                <span className="badge" style={{ background: "rgba(170,255,0,0.08)", color: "#aaff00", border: "1px solid rgba(170,255,0,0.15)" }}>
                                  {compCount} comp
                                </span>
                              )}
                              {coachCount > 0 && (
                                <span className="badge" style={{ background: "rgba(255,184,0,0.08)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.15)" }}>
                                  {coachCount} coach
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => eliminar(eq.id, eq.nombre)}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                          style={{ color: "#40405a" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Members */}
                      {eq.miembros.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {eq.miembros.map(m => (
                            <span key={m.id} className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1c1c30", color: "#a0a0c0" }}>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: ROL_COLOR[m.rol] ?? "#40405a", boxShadow: `0 0 4px ${ROL_COLOR[m.rol] ?? "#40405a"}` }} />
                              {m.persona.nombre_completo.split(" ")[0]}
                              <span style={{ color: "#40405a", fontSize: 10 }}>{ROL_LABEL[m.rol]}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {eq.miembros.length === 0 && (
                        <p className="text-xs mb-4" style={{ color: "#40405a" }}>Sin miembros aún</p>
                      )}

                      {/* Footer */}
                      <Link href={`/equipos/${eq.id}`}>
                        <div className="flex items-center gap-2 text-xs font-semibold transition-all group-hover:gap-3"
                          style={{ color: accent }}>
                          Ver detalle <ArrowRight className="w-3 h-3" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
