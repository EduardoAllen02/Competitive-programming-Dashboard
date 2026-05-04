"use client";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { Users, User, Calendar, Code, Trophy, ArrowRight, Zap, Activity } from "lucide-react";

type RankEntry = { posicion: number; equipo: { id: number; nombre: string }; total: number };
type Stats = { equipos: number; personas: number; fechas: number; problemas: number };

/* ── Animated counter ─────────────────────────── */
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let v = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const id = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(v);
      if (v >= target) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [target]);
  return <>{val}</>;
}

/* ── 3D Tilt Card ─────────────────────────────── */
function TiltCard({ children, className = "", style = {} }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotY = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const sX = useSpring(rotX, { stiffness: 180, damping: 18 });
  const sY = useSpring(rotY, { stiffness: 180, damping: 18 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: sX, rotateY: sY, transformPerspective: 900, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const STAT_META = [
  { key: "equipos" as const,    label: "Equipos",       icon: Users,    href: "/equipos",  featured: false },
  { key: "personas" as const,   label: "Participantes", icon: User,     href: "/personas", featured: false },
  { key: "fechas" as const,     label: "Fechas",        icon: Calendar, href: "/fechas",   featured: false },
  { key: "problemas" as const,  label: "Problemas",     icon: Code,     href: "/fechas",   featured: true  },
];

const QUICK_ACTIONS = [
  { href: "/equipos/new",  label: "Nuevo Equipo",       icon: Users,   neon: true  },
  { href: "/personas/new", label: "Nueva Persona",      icon: User,    neon: false },
  { href: "/fechas/new",   label: "Nueva Fecha",        icon: Calendar,neon: false },
  { href: "/ranking",      label: "Ver Ranking Completo",icon: Trophy,  neon: false },
];

const MEDALS = ["🥇", "🥈", "🥉"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ranking, setRanking] = useState<RankEntry[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/equipos").then(r => r.json()).catch(() => []),
      fetch("/api/personas").then(r => r.json()).catch(() => []),
      fetch("/api/fechas").then(r => r.json()).catch(() => []),
      fetch("/api/ranking").then(r => r.json()).catch(() => []),
    ]).then(([eq, pe, fe, rk]) => {
      const tp = (fe as { _count: { problemas: number } }[]).reduce(
        (s, f) => s + (f._count?.problemas ?? 0), 0
      );
      setStats({
        equipos: Array.isArray(eq) ? eq.length : 0,
        personas: Array.isArray(pe) ? pe.length : 0,
        fechas: Array.isArray(fe) ? fe.length : 0,
        problemas: tp,
      });
      setRanking(Array.isArray(rk) ? rk.slice(0, 5) : []);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto relative z-10">

      {/* ── Hero ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="mb-12 pt-1"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3 h-3" style={{ color: "#aaff00" }} />
          <span
            style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            className="uppercase tracking-[0.25em]"
          >
            Sistema de Gestión
          </span>
        </div>

        <h1 className="text-5xl font-black leading-none mb-1">
          <span style={{ color: "#ffffff" }}>Panel </span>
          <span className="neon-text" style={{ fontStyle: "italic" }}>Principal</span>
        </h1>
        <p className="text-sm mt-3" style={{ color: "#a0a0c0" }}>
          Gestión de competencias universitarias de programación
        </p>

        {/* Neon line */}
        <div className="flex items-center gap-3 mt-4">
          <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #aaff00, transparent)" }} />
          <div style={{ width: 8, height: 2, background: "#aaff0033" }} />
          <div style={{ width: 4, height: 2, background: "#aaff0022" }} />
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────── */}
      {stats && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {STAT_META.map(({ key, label, icon: Icon, href, featured }) => (
            <motion.div key={key} variants={fadeUp}>
              <TiltCard>
                <Link href={href}>
                  {featured ? (
                    /* Featured card — solid neon */
                    <div
                      className="p-5 rounded-2xl cursor-pointer relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #aaff00, #66bb00)",
                        boxShadow: "0 0 40px rgba(170,255,0,0.4), 0 8px 32px rgba(0,0,0,0.5)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute", top: -20, right: -20,
                          width: 100, height: 100, borderRadius: "50%",
                          background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
                        }}
                      />
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(0,0,0,0.2)" }}
                      >
                        <Icon className="w-4 h-4" style={{ color: "#ffffff" }} />
                      </div>
                      <p
                        className="text-3xl font-black mb-1"
                        style={{ fontFamily: "var(--font-geist-mono)", color: "#ffffff" }}
                      >
                        <Counter target={stats[key]} />
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {label}
                      </p>
                    </div>
                  ) : (
                    /* Regular card */
                    <div
                      className="p-5 rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-300 group"
                      style={{
                        background: "linear-gradient(135deg, #0c0c14, #111120)",
                        border: "1px solid #1c1c30",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = "rgba(170,255,0,0.25)";
                        el.style.boxShadow = "0 0 30px rgba(170,255,0,0.08), 0 4px 20px rgba(0,0,0,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = "#1c1c30";
                        el.style.boxShadow = "none";
                      }}
                    >
                      <div
                        style={{
                          position: "absolute", top: -30, right: -30,
                          width: 90, height: 90, borderRadius: "50%",
                          background: "radial-gradient(circle, rgba(170,255,0,0.04) 0%, transparent 70%)",
                        }}
                      />
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "rgba(170,255,0,0.08)", border: "1px solid rgba(170,255,0,0.12)" }}
                      >
                        <Icon className="w-4 h-4" style={{ color: "#aaff00" }} />
                      </div>
                      <p
                        className="text-3xl font-black mb-1"
                        style={{ fontFamily: "var(--font-geist-mono)", color: "#aaff00" }}
                      >
                        <Counter target={stats[key]} />
                      </p>
                      <p className="text-xs font-medium" style={{ color: "#40405a" }}>
                        {label}
                      </p>
                    </div>
                  )}
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Bottom Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, type: "spring", stiffness: 220, damping: 22 }}
        >
          <div
            className="rounded-2xl overflow-hidden scanline"
            style={{
              background: "linear-gradient(135deg, #0c0c14, #0e0e1c)",
              border: "1px solid #1c1c30",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                borderBottom: "1px solid #1c1c30",
                background: "linear-gradient(90deg, rgba(255,184,0,0.06), transparent)",
              }}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className="w-4 h-4"
                  style={{ color: "#ffb800", filter: "drop-shadow(0 0 8px rgba(255,184,0,0.6))" }}
                />
                <span className="font-bold text-sm" style={{ color: "#ffffff" }}>
                  Ranking Acumulado
                </span>
              </div>
              <Link
                href="/ranking"
                className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: "#aaff00" }}
              >
                Ver todo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {ranking.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-8 text-center text-sm"
                    style={{ color: "#40405a" }}
                  >
                    Sin datos aún
                  </motion.p>
                ) : (
                  <motion.div key="list" className="flex flex-col gap-2">
                    {ranking.map((r, i) => (
                      <motion.div
                        key={r.equipo.id}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={
                          i === 0
                            ? {
                                background: "linear-gradient(135deg, rgba(255,184,0,0.12), rgba(255,184,0,0.04))",
                                border: "1px solid rgba(255,184,0,0.25)",
                                boxShadow: "0 0 20px rgba(255,184,0,0.08)",
                              }
                            : {
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid #1c1c30",
                              }
                        }
                      >
                        <span className="text-base w-6 text-center">{MEDALS[i] ?? `${i + 1}`}</span>
                        <span className="flex-1 text-sm font-semibold" style={{ color: "#ffffff" }}>
                          {r.equipo.nombre}
                        </span>
                        <span
                          className="text-sm font-black"
                          style={{
                            fontFamily: "var(--font-geist-mono)",
                            color: i === 0 ? "#ffb800" : "#aaff00",
                            textShadow: i === 0
                              ? "0 0 12px rgba(255,184,0,0.5)"
                              : "0 0 10px rgba(170,255,0,0.4)",
                          }}
                        >
                          {r.total} <span style={{ opacity: 0.5, fontSize: 10 }}>pts</span>
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, type: "spring", stiffness: 220, damping: 22 }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0c0c14, #0e0e1c)",
              border: "1px solid #1c1c30",
            }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid #1c1c30" }}
            >
              <Zap className="w-4 h-4" style={{ color: "#aaff00" }} />
              <span className="font-bold text-sm" style={{ color: "#ffffff" }}>
                Acciones rápidas
              </span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon, neon }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.42 + i * 0.07, type: "spring", stiffness: 280, damping: 24 }}
                >
                  <Link href={href}>
                    {neon ? (
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm cursor-pointer transition-all duration-200"
                        style={{
                          background: "linear-gradient(135deg, #aaff00, #66bb00)",
                          color: "#000000",
                          fontWeight: 700,
                          boxShadow: "0 0 24px rgba(170,255,0,0.3)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 40px rgba(170,255,0,0.5)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(170,255,0,0.3)";
                          (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                        <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm cursor-pointer transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid #1c1c30",
                          color: "#a0a0c0",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "rgba(170,255,0,0.2)";
                          el.style.background = "rgba(170,255,0,0.04)";
                          el.style.color = "#ffffff";
                          el.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "#1c1c30";
                          el.style.background = "rgba(255,255,255,0.02)";
                          el.style.color = "#a0a0c0";
                          el.style.transform = "translateX(0)";
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(170,255,0,0.08)", border: "1px solid rgba(170,255,0,0.12)" }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: "#aaff00" }} />
                        </div>
                        <span className="flex-1">{label}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
