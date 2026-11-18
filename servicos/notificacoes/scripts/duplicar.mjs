// Uso: node --env-file=.env.local scripts/duplicar.mjs <notificar|pagar> <URL-completa> [idPedido] [valor]
import { Client } from "@upstash/qstash";

const [, , alvo, url, idPedido = "PED-TESTE01", valor = "100"] = process.argv;

if (!alvo || !url) {
  console.error("Uso: node --env-file=.env.local scripts/duplicar.mjs <notificar|pagar> <URL> [idPedido] [valor]");
  process.exit(1);
}

const corpos = {
  notificar: { idPedido, tipo: "PEDIDO_CRIADO", cliente: "Teste", mensagem: "Mensagem duplicada de propósito" },
  pagar: { idPedido, valor: Number(valor) },
};

const qstash = new Client({ baseUrl: process.env.QSTASH_URL, token: process.env.QSTASH_TOKEN });

// Publica a MESMA mensagem duas vezes, sem deduplicationId: simula entrega duplicada
for (let i = 1; i <= 2; i++) {
  const r = await qstash.publishJSON({ url, body: corpos[alvo], retries: 0 });
  console.log(`Mensagem #${i} publicada:`, r.messageId);
}