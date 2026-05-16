import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import net from "net";

type HealthState = {
  healthy: boolean;
  node1: { io: string; sql: string; error: string | null };
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
    const [ioRows, sqlRows] = await Promise.all([
      prisma.$queryRaw<{ SERVICE_STATE: string }[]>(
        Prisma.sql`SELECT SERVICE_STATE FROM performance_schema.replication_connection_status LIMIT 1`
      ),
      prisma.$queryRaw<{ SERVICE_STATE: string }[]>(
        Prisma.sql`SELECT SERVICE_STATE FROM performance_schema.replication_applier_status LIMIT 1`
      ),
    ]);

    const io = ioRows[0]?.SERVICE_STATE ?? "OFF";
    const sql = sqlRows[0]?.SERVICE_STATE ?? "OFF";
    const node2Reachable = await checkNode2Reachable();
    const healthy = io === "ON" && sql === "ON" && node2Reachable;

    cache = {
      healthy,
      node1: { io, sql, error: null },
      node2Reachable,
      checkedAt: Date.now(),
    };
  } catch (e) {
    cache = {
      healthy: false,
      node1: { io: "OFF", sql: "OFF", error: String(e) },
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
