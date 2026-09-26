"use client";

import { useEffect, useRef, useState } from "react";
import { LanyardDataSchema, type LanyardData } from "./schemas";

const REST = "https://api.lanyard.rest/v1/users/";
const WS = "wss://api.lanyard.rest/socket";
const POLL_MS = 15_000;

/** Live Discord presence via Lanyard: websocket first, REST polling as fallback. */
export function useLanyard(userId: string) {
  const [data, setData] = useState<LanyardData | null>(null);
  const [live, setLive] = useState(false);
  const closed = useRef(false);

  useEffect(() => {
    closed.current = false;
    let socket: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let reconnect: ReturnType<typeof setTimeout> | null = null;

    const apply = (raw: unknown) => {
      const parsed = LanyardDataSchema.safeParse(raw);
      if (parsed.success && !closed.current) setData(parsed.data);
    };

    const fetchOnce = async () => {
      try {
        const res = await fetch(REST + userId, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        apply(json?.data);
      } catch {}
    };

    const connect = () => {
      try {
        socket = new WebSocket(WS);
      } catch {
        return;
      }
      socket.onopen = () => setLive(true);
      socket.onmessage = (ev) => {
        let msg: { op?: number; t?: string; d?: Record<string, unknown> };
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.op === 1) {
          const interval = (msg.d?.heartbeat_interval as number) ?? 30_000;
          if (heartbeat) clearInterval(heartbeat);
          heartbeat = setInterval(() => socket?.send(JSON.stringify({ op: 3 })), interval);
          socket?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
        }
        if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") apply(msg.d);
      };
      socket.onclose = () => {
        setLive(false);
        if (heartbeat) clearInterval(heartbeat);
        if (!closed.current) reconnect = setTimeout(connect, 5_000);
      };
      socket.onerror = () => socket?.close();
    };

    fetchOnce();
    poll = setInterval(fetchOnce, POLL_MS);
    connect();

    return () => {
      closed.current = true;
      if (heartbeat) clearInterval(heartbeat);
      if (poll) clearInterval(poll);
      if (reconnect) clearTimeout(reconnect);
      socket?.close();
    };
  }, [userId]);

  return { data, live };
}
