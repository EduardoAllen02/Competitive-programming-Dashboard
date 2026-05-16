import { prisma } from "@/lib/db";
import net from "net";

type HealthState = {
  healthy: boolean;
  node1: { io: string; sql: string; seconds: number | null; error: string | null };
  node2Reachable: boolean;
  checkedAt: number;
};

let cache: HealthState | null = null;
const CACHE_TTL = 15_000;

function checkNode2Reachable(): Promise<boolean> {
  const host = process.env.NODE2_HOST ?? "100.113.123.57";
  const port = parseInt(process.env.NODE2_PORT ?? "3306");
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => { socket.destroy(); resolve(false); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

export async function getReplicationHealth(): Promise<HealthState> {
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL) return cache;

  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SHOW REPLICA STATUS`;
    const row = rows[0] ?? {};

    const ioErr = String(row.Last_IO_Error ?? "").trim();
    const sqlErr = String(row.Last_SQL_Error ?? "").trim();

    const node1 = {
      io: String(row.Replica_IO_Running ?? "No"),
      sql: String(row.Replica_SQL_Running ?? "No"),
      seconds: row.Seconds_Behind_Source != null ? Number(row.Seconds_Behind_Source) : null,
      error: (ioErr || sqlErr) || null,
    };

    const node2Reachable = await checkNode2Reachable();
    const healthy = node1.io === "Yes" && node1.sql === "Yes" && !node1.error && node2Reachable;

    cache = { healthy, node1, node2Reachable, checkedAt: Date.now() };
  } catch {
    cache = {
      healthy: false,
      node1: { io: "No", sql: "No", seconds: null, error: "Error al consultar SHOW REPLICA STATUS" },
      node2Reachable: false,
      checkedAt: Date.now(),
    };
  }

  return cache;
}

export class ReplicationError extends Error {
  constructor() {
    super("Replicación no disponible — escrituras bloqueadas");
    this.name = "ReplicationError";
  }
}

export async function assertReplicationHealthy() {
  const health = await getReplicationHealth();
  if (!health.healthy) throw new ReplicationError();
}
