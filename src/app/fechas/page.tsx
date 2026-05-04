"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Calendar, Trash2, ArrowRight, Code, Zap } from "lucide-react";
import { toast } from "sonner";

interface Fecha {
  id: number;
  tipo: string;
  numero: number | null;
  fecha: string;
  _count: { problemas: number };
}

const TIPO_META: Record<string, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  fecha_cero:    { label: "Fecha 0",      color: "#40405a", bg: "rgba(64,64,90,0.12)",   icon: Calendar },
  clasificatoria:{ label: "Clasificatoria",color: "#aaff00", bg: "rgba(170,255,0,0.1)",  icon: Zap      },
  repechaje:     { label: "Repechaje",    color: "#ffb800", bg: "rgba(255,184,0,0.1)",  icon: Code     },
};

function getLabel(f: Fecha) {
  if (f.tipo === "clasificatoria") return `Clasificatoria ${f.numero}`;
  return TIPO_META[f.tipo]?.label ?? f.tipo;
}

export default function FechasPage() {
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/fechas").then(r => r.json()).catch(() => [])
      .then(d => setFechas(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const eliminar = async (id: number, lbl: string) => {
    if (!confirm(`¿Eliminar "${lbl}"? Se borrarán todos los problemas y resultados asociados.`)) return;
    await fetch(`/api/fechas/${id}`, { method: "DELETE" });
    toast.success(`"${lbl}" eliminada`);
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
            <Calendar className="w-3 h-3" style={{ color: "#aaff00" }} />
            <span style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)", fontSize: 11 }} className="uppercase tracking-[0.25em]">
              Calendario de Competencia
            </span>
          </div>
          <h1 className="text-5xl font-black leading-none">
            <span style={{ color: "#ffffff" }}>Fe</span>
            <span className="neon-text" style={{ fontStyle: "italic" }}>chas</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "#a0a0c0" }}>
            {loading ? "—" : `${fechas.length} fecha${fechas.length !== 1 ? "s" : ""} registrada${fechas.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #aaff00, transparent)" }} />
            <div style={{ width: 8, height: 2, background: "#aaff0033" }} />
          </div>
        </div>
        <Link href="/fechas/new">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(170,255,0,0.5)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #aaff00, #0090bb)", color: "#000", boxShadow: "0 0 24px rgba(170,255,0,0.3)" }}>
            <Plus className="w-4 h-4" /> Nueva Fecha
          </motion.button>
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-3 py-8" style={{ color: "#40405a" }}>
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: "#aaff00", borderTopColor: "transparent" }} />
          <span className="text-sm">Cargando fechas...</span>
        </div>
      ) : fechas.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-16 text-center"
          style={{ background: "linear-gradient(135deg, #0c0c14, #0e0e1c)", border: "1px solid #1c1c30" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(170,255,0,0.06)", border: "1px solid rgba(170,255,0,0.1)" }}>
            <Calendar className="w-7 h-7" style={{ color: "#40405a" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#a0a0c0" }}>Sin fechas registradas</p>
          <p className="text-xs" style={{ color: "#40405a" }}>Crea la primera fecha de competencia</p>
        </motion.div>
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-px"
            style={{ background: "linear-gradient(180deg, #aaff0040, #1c1c30, transparent)" }} />

          <div className="flex flex-col gap-4">
            {fechas.map((f, i) => {
              const meta = TIPO_META[f.tipo] ?? TIPO_META.fecha_cero;
              const IconComp = meta.icon;
              const lbl = getLabel(f);
              return (
                <motion.div key={f.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
                  className="flex items-start gap-5">

                  {/* Timeline dot */}
                  <div className="relative shrink-0 mt-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center z-10 relative"
                      style={{ background: meta.bg, border: `1px solid ${meta.color}30`, boxShadow: `0 0 12px ${meta.color}20` }}>
                      <IconComp className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-2xl overflow-hidden transition-all duration-200 group"
                    style={{ background: "linear-gradient(135deg, #0c0c14, #0e0e1c)", border: "1px solid #1c1c30" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${meta.color}30`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${meta.color}08`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1c1c30"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>

                    <div style={{ height: 2, background: `linear-gradient(90deg, ${meta.color}60, transparent)` }} />

                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Link href={`/fechas/${f.id}`}>
                            <span className="font-bold text-sm hover:opacity-70 transition-opacity cursor-pointer"
                              style={{ color: "#ffffff" }}>
                              {lbl}
                            </span>
                          </Link>
                          <span className="badge"
                            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
                            {f.tipo === "clasificatoria" ? `C${f.numero}` : meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>
                            {new Date(f.fecha).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                          <span style={{ color: "#1c1c30" }}>·</span>
                          <span style={{ color: "#40405a", fontSize: 12 }}>
                            {f._count.problemas} problema{f._count.problemas !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/fechas/${f.id}`}>
                          <motion.button
                            whileHover={{ x: 3 }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}25` }}>
                            Gestionar <ArrowRight className="w-3 h-3" />
                          </motion.button>
                        </Link>
                        <button onClick={() => eliminar(f.id, lbl)}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                          style={{ color: "#40405a" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
