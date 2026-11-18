import { Client, Receiver } from "@upstash/qstash";

// Cliente para PUBLICAR mensagens (usado pelos serviços que enviam à fila)
export const qstash = new Client({
  baseUrl: process.env.QSTASH_URL,
  token: process.env.QSTASH_TOKEN ?? "",
});

// Verificador de assinatura para CONSUMIR mensagens
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
});

/**
 * Lê o corpo da requisição e confirma que ela foi assinada pelo QStash.
 * Retorna o objeto da mensagem, ou null se a assinatura for inválida.
 */
export async function lerMensagemAssinada<T>(request: Request): Promise<T | null> {
  const corpo = await request.text();
  const assinatura = request.headers.get("upstash-signature") ?? "";
  try {
    const valida = await receiver.verify({ signature: assinatura, body: corpo });
    if (!valida) return null;
    return JSON.parse(corpo) as T;
  } catch {
    return null;
  }
}