import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export function log(evento: string, dados: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      servico: "pedidos",
      evento,
      ...dados,
    })
  );
}

// Trilha de auditoria do pedido (lista em ordem cronológica)
export async function registrarHistorico(idPedido: string, evento: string, detalhe = "") {
  await redis.rpush(`pedido:${idPedido}:historico`, {
    evento,
    detalhe,
    em: new Date().toISOString(),
  });
}