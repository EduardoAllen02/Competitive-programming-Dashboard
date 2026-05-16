"use client";
import { useEffect, useState, useCallback } from "react";

type HealthData = {
  healthy: boolean;
  node1?: { io: string; sql: string; seconds: number | null; error: string | null };
  node2Reachable?: boolean;
};

export function useReplicationHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/replication/health");
      const data: HealthData = await res.json();
      setHealth(data);
    } catch {
      setHealth({ healthy: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [check]);

  return { healthy: health?.healthy ?? false, loading, details: health };
}
