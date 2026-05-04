"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, User, Calendar, Trophy, Code2, Wifi } from "lucide-react";

const NAV = [
  { href: "/",        label: "Dashboard", icon: LayoutDashboard },
  { href: "/equipos", label: "Equipos",   icon: Users           },
  { href: "/personas",label: "Personas",  icon: User            },
  { href: "/fechas",  label: "Fechas",    icon: Calendar        },
  { href: "/ranking", label: "Ranking",   icon: Trophy          },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-52 flex flex-col shrink-0 relative"
      style={{
        background: "linear-gradient(180deg, #0a0a12 0%, #06060a 100%)",
        borderRight: "1px solid #1c1c30",
      }}
    >
      {/* Top ambient glow */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 140,
          background: "radial-gradient(ellipse at 50% -20%, rgba(170,255,0,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5 relative"
        style={{ borderBottom: "1px solid #1c1c30" }}
      >
        <div
          style={{
            padding: "6px", borderRadius: 8,
            background: "linear-gradient(135deg, rgba(170,255,0,0.15), rgba(124,58,237,0.1))",
            border: "1px solid rgba(170,255,0,0.2)",
            boxShadow: "0 0 16px rgba(170,255,0,0.12)",
          }}
        >
          <Code2 className="w-4 h-4" style={{ color: "#aaff00" }} />
        </div>
        <div>
          <span
            className="text-sm font-black tracking-widest uppercase block"
            style={{
              fontFamily: "var(--font-geist-mono)",
              background: "linear-gradient(135deg, #aaff00, #55bb00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CompOS
          </span>
          <span className="text-xs block" style={{ color: "#40405a", fontFamily: "var(--font-geist-mono)" }}>
            v1.0
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 p-3 pt-4">
        {NAV.map(({ href, label, icon: Icon }, idx) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ x: active ? 0 : 4 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer relative overflow-hidden"
                style={
                  active
                    ? {
                        background: "linear-gradient(90deg, rgba(170,255,0,0.1), rgba(170,255,0,0.03))",
                        color: "#aaff00",
                        fontWeight: 700,
                        border: "1px solid rgba(170,255,0,0.2)",
                        boxShadow: "0 0 20px rgba(170,255,0,0.06), inset 0 0 20px rgba(170,255,0,0.03)",
                      }
                    : { color: "#a0a0c0", border: "1px solid transparent" }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.color = "#ffffff";
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLDivElement).style.color = "#a0a0c0";
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }
                }}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeBar"
                    style={{
                      position: "absolute", left: 0, top: "20%", bottom: "20%",
                      width: 3, borderRadius: 9999,
                      background: "linear-gradient(180deg, #aaff00, #55bb00)",
                      boxShadow: "0 0 10px rgba(170,255,0,0.7)",
                    }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" style={{ color: active ? "#aaff00" : "#a0a0c0" }} />
                <span style={{ marginLeft: active ? 2 : 0 }}>{label}</span>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#aaff00", boxShadow: "0 0 8px rgba(170,255,0,0.9)" }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid #1c1c30" }}>
        <div className="flex items-center gap-2">
          <div className="status-dot" />
          <span className="text-xs" style={{ fontFamily: "var(--font-geist-mono)", color: "#40405a" }}>
            MySQL
          </span>
          <Wifi className="w-3 h-3 ml-auto" style={{ color: "#1c1c30" }} />
        </div>
      </div>
    </aside>
  );
}
