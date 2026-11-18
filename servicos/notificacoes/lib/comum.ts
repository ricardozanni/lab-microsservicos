import { Redis } from "@upstash/redis";

// Lê UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
export const redis = Redis.fromEnv();

// Log estruturado em JSON: facilita filtrar por idPedido nos Logs da Vercel
export function log(evento: string, dados: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      servico: "notificacoes",
      evento,
      ...dados,
    })
  );
}