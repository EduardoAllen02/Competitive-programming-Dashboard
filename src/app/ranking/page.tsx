"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, Crown, Medal } from "lucide-react";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_COLORS = ["#fbbf24", "#94a3b8", "#c2773a"];
const PODIUM_GLOWS = ["rgba(251,191,36,0.3)", "rgba(148,163,184,0.2)", "rgba(194,119,58,0.25)"];
const PODIUM_BG = [
  "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))",
  "linear-gradient(135deg, rgba(148,163,184,0.07), rgba(148,163,184,0.02))",
  "linear-gradient(135deg, rgba(194,119,58,0.08), rgba(194,119,58,0.02))",
];

type RankEntry = {
  posicion: number;
  equipo: { id: number; nombre: string };
  total: number;
  porFecha?: Record<number, number>;
  clasificatorias?: { id: number; numero: number | null }[];
};

type Fecha = { id: number; tipo: string; numero: number | null; fecha: string };

function PodiumBlock({ entry, rank }: { entry: RankEntry; rank: number }) {
  const heights = ["h-24", "h-16", "h-12"];
  const sizes = ["text-4xl", "text-3xl", "text-2xl"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="text-2xl">{MEDALS[rank]}</div>
      <div
        className="px-4 py-2 rounded-xl text-center max-w-[140px] w-full"
        style={{
          background: PODIUM_BG[rank],
          border: `1px solid ${PODIUM_GLOWS[rank]}`,
          boxShadow: `0 0 20px ${PODIUM_GLOWS[rank]}`,
        }}
      >
        <p className="text-xs font-medium mb-1 truncate" style={{ color: "#f0f4f8" }}>
          {entry.equipo.nombre}
        </p>
        <p
          className={`font-bold ${sizes[rank]}`}
          style={{
            fontFamily: "var(--font-geist-mono)",
            color: PODIUM_COLORS[rank],
            textShadow: `0 0 16px ${PODIUM_GLOWS[rank]}`,
          }}
        >
          {entry.total}
        </p>
        <p className="text-xs" style={{ color: PODIUM_COLORS[rank], opacity: 0.7 }}>pts</p>
      </div>
      <div
        className={`${heights[rank]} w-full rounded-t-lg`}
        style={{
          background: `linear-gradient(180deg, ${PODIUM_GLOWS[rank]}, rgba(0,0,0,0))`,
          border: `1px solid ${PODIUM_GLOWS[rank]}`,
          borderBottom: "none",
          boxShadow: `0 -4px 20px ${PODIUM_GLOWS[rank]}`,
        }}
      />
    </motion.div>
  );
}

export default function RankingPage() {
  const [modo, setModo] = useState<"acumulado" | "por-fecha">("acumulado");
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fechas")
      .then((r) => r.json())
      .catch(() => [])
      .then((data: Fecha[]) => setFechas(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = modo === "por-fecha" && fechaSeleccionada
      ? `/api/ranking?fecha_id=${fechaSeleccionada}`
      : "/api/ranking";
    fetch(url)
      .then((r) => r.json())
      .catch(() => [])
      .then((data) => { setRanking(Array.isArray(data) ? data : []); setLoading(false); });
  }, [modo, fechaSeleccionada]);

  const clasificatorias = ranking[0]?.clasificatorias ?? [];
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  const labelFecha = (f: Fecha) => {
    if (f.tipo === "fecha_cero") return "Fecha 0";
    if (f.tipo === "clasificatoria") return `Clasificatoria ${f.numero}`;
    return "Repechaje";
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p
          className="mb-1 uppercase tracking-[0.2em] text-xs flex items-center gap-2"
          style={{ color: "#4a6080", fontFamily: "var(--font-geist-mono)" }}
        >
          <Trophy className="w-3 h-3" style={{ color: "#fbbf24" }} />
          Competencias
        </p>
        <h1
          className="text-4xl font-bold"
          style={{
            background: "linear-gradient(135deg, #f0f4f8 30%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ranking
        </h1>
        <div className="mt-3 h-px w-20" style={{ background: "linear-gradient(90deg, #fbbf24, transparent)" }} />
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {(["acumulado", "por-fecha"] as const).map((m) => (
          <motion.button
            key={m}
            onClick={() => setModo(m)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all relative overflow-hidden"
            style={
              modo === m
                ? {
                    background: "linear-gradient(135deg, rgba(170,255,0,0.2), rgba(170,255,0,0.08))",
                    color: "#aaff00",
                    border: "1px solid rgba(170,255,0,0.35)",
                    boxShadow: "0 0 20px rgba(170,255,0,0.12)",
                  }
                : {
                    background: "rgba(10,16,32,0.8)",
                    color: "#4a6080",
                    border: "1px solid rgba(30,58,95,0.6)",
                  }
            }
          >
            {m === "acumulado" ? "Acumulado (Clasificatorias)" : "Por Fecha"}
          </motion.button>
        ))}

        {modo === "por-fecha" && (
          <div className="relative">
            <select
              className="appearance-none px-4 py-2 pr-8 rounded-xl text-sm cursor-pointer"
              style={{
                background: "rgba(10,16,32,0.9)",
                border: "1px solid rgba(30,58,95,0.7)",
                color: "#f0f4f8",
              }}
              value={fechaSeleccionada ?? ""}
              onChange={(e) => setFechaSeleccionada(Number(e.target.value))}
            >
              <option value="">Selecciona fecha</option>
              {fechas.map((f) => (
                <option key={f.id} value={f.id}>{labelFecha(f)}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-3 pointer-events-none" style={{ color: "#aaff00" }} />
          </div>
        )}
      </div>

      {/* Podium — solo si hay top 3 y modo acumulado */}
      <AnimatePresence>
        {!loading && top3.length === 3 && modo === "acumulado" && (
          <motion.div
            key="podium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 flex items-end justify-center gap-4 px-4 pt-4"
          >
            <PodiumBlock entry={top3[1]} rank={1} />
            <PodiumBlock entry={top3[0]} rank={0} />
            <PodiumBlock entry={top3[2]} rank={2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden scanline"
        style={{
          background: "linear-gradient(135deg, #0a1020, #0d1525)",
          border: "1px solid rgba(30,58,95,0.8)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Table header bar */}
        <div
          className="flex items-center gap-3 px-6 py-4"
          style={{
            borderBottom: "1px solid rgba(30,58,95,0.6)",
            background: "linear-gradient(90deg, rgba(251,191,36,0.06), rgba(170,255,0,0.03), transparent)",
          }}
        >
          <Crown className="w-4 h-4" style={{ color: "#fbbf24", filter: "drop-shadow(0 0 6px rgba(251,191,36,0.6))" }} />
          <span className="font-semibold text-sm" style={{ color: "#f0f4f8" }}>
            {modo === "acumulado"
              ? "Ranking Acumulado — Solo Clasificatorias"
              : fechaSeleccionada
              ? `Ranking — ${labelFecha(fechas.find((f) => f.id === fechaSeleccionada)!)}`
              : "Selecciona una fecha"}
          </span>
          {modo === "acumulado" && clasificatorias.length > 0 && (
            <div className="ml-auto flex gap-2">
              {clasificatorias.map((c) => (
                <span
                  key={c.id}
                  className="badge"
                  style={{ background: "rgba(170,255,0,0.08)", color: "#4a6080", border: "1px solid rgba(30,58,95,0.6)" }}
                >
                  C{c.numero}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Column headers */}
        <div
          className="flex items-center gap-4 px-6 py-3 text-xs uppercase tracking-wider"
          style={{
            borderBottom: "1px solid rgba(30,58,95,0.4)",
            color: "#4a6080",
            fontFamily: "var(--font-geist-mono)",
            background: "rgba(170,255,0,0.02)",
          }}
        >
          <span className="w-10 text-center">#</span>
          <span className="flex-1">Equipo</span>
          {modo === "acumulado" && clasificatorias.map((c) => (
            <span key={c.id} className="w-16 text-center">C{c.numero}</span>
          ))}
          <span className="w-20 text-right">Total</span>
        </div>

        {/* Rows */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-16 text-center text-sm" style={{ color: "#4a6080" }}>
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#aaff00", borderTopColor: "transparent" }} />
                Cargando...
              </div>
            </motion.div>
          ) : ranking.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-16 text-center text-sm" style={{ color: "#4a6080" }}>
              Sin resultados aún
            </motion.div>
          ) : (
            <motion.div key="rows" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {ranking.map((r, i) => (
                <motion.div
                  key={r.equipo.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                  className="flex items-center gap-4 px-6 py-4 transition-all duration-200 cursor-default"
                  style={{
                    borderBottom: "1px solid rgba(30,58,95,0.3)",
                    background: i < 3 ? PODIUM_BG[i] : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (i >= 3) (e.currentTarget as HTMLDivElement).style.background = "rgba(170,255,0,0.03)";
                    (e.currentTarget as HTMLDivElement).style.paddingLeft = "28px";
                  }}
                  onMouseLeave={(e) => {
                    if (i >= 3) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.paddingLeft = "24px";
                  }}
                >
                  <span
                    className="w-10 text-center font-bold"
                    style={i < 3 ? { fontSize: 18 } : { color: "#4a6080", fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                  >
                    {i < 3 ? MEDALS[i] : `${i + 1}`}
                  </span>
                  <span className="flex-1 font-medium text-sm" style={{ color: "#f0f4f8" }}>
                    {r.equipo.nombre}
                    {i < 3 && (
                      <span
                        className="ml-2 badge"
                        style={{
                          border: `1px solid ${PODIUM_GLOWS[i]}`,
                          color: PODIUM_COLORS[i],
                          background: PODIUM_BG[i],
                        }}
                      >
                        TOP {i + 1}
                      </span>
                    )}
                  </span>
                  {modo === "acumulado" && clasificatorias.map((c) => (
                    <span key={c.id} className="w-16 text-center text-sm"
                      style={{ fontFamily: "var(--font-geist-mono)", color: "#4a6080" }}>
                      {r.porFecha?.[c.id] ?? 0}
                    </span>
                  ))}
                  <span
                    className="w-20 text-right font-bold text-sm"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      color: i === 0 ? "#fbbf24" : "#aaff00",
                      textShadow: i === 0 ? "0 0 12px rgba(251,191,36,0.4)" : "0 0 10px rgba(170,255,0,0.3)",
                    }}
                  >
                    {r.total} pts
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {modo === "acumulado" && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-4 text-xs"
          style={{ color: "#4a6080" }}
        >
          * Solo se suman puntos de fechas clasificatorias. Fecha 0 y Repechaje no acumulan.
        </motion.p>
      )}
    </div>
  );
}
