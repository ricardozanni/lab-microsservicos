import { redis, log } from "@/lib/comum";
import { lerMensagemAssinada } from "@/lib/qstash";

export const dynamic = "force-dynamic";

type MensagemNotificacao = {
  idPedido: string;
  tipo: string;
  cliente: string;
  mensagem: string;
};

export async function POST(request: Request) {
  // 1) Só aceita mensagens assinadas pelo QStash
  const msg = await lerMensagemAssinada<MensagemNotificacao>(request);
  if (!msg) {
    log("assinatura_invalida");
    return Response.json({ erro: "Assinatura inválida." }, { status: 401 });
  }

  const { idPedido, tipo, cliente, mensagem } = msg;

  // 2) IDEMPOTÊNCIA: reserva a chave "pedido + tipo de notificação".
  //    SET ... NX só grava se a chave NÃO existir (operação atômica).
  const chave = `notificado:${idPedido}:${tipo}`;
  const reservou = await redis.set(chave, "processando", { nx: true, ex: 60 });

  if (!reservou) {
    log("duplicada_ignorada", { idPedido, tipo });
    // Responder 200 diz ao QStash: "já tratei, não reenvie"
    return Response.json({ duplicada: true });
  }

  try {
    // Falha técnica simulada (Parte 3): % configurável por variável de ambiente
    const pct = Number(process.env.FALHA_TECNICA_PCT ?? 0);
    if (Math.random() * 100 < pct) {
      throw new Error("Falha técnica simulada");
    }

    // 3) "Envio" da notificação (aqui, apenas gravamos em uma lista)
    await redis.lpush("notificacoes", {
      idPedido,
      tipo,
      cliente,
      mensagem,
      em: new Date().toISOString(),
    });
    await redis.ltrim("notificacoes", 0, 49); // guarda só as 50 mais recentes

    // 4) Marca como enviada de forma duradoura (24 h)
    await redis.set(chave, "enviado", { ex: 86400 });

    log("notificacao_enviada", { idPedido, tipo });
    return Response.json({ ok: true });
  } catch (erro) {
    // 5) Libera a reserva para que o RETRY do QStash consiga processar
    await redis.del(chave);
    log("falha_ao_notificar", { idPedido, tipo, erro: String(erro) });
    // 500 diz ao QStash: "falhou, tente novamente depois"
    return Response.json({ erro: "Falha ao processar." }, { status: 500 });
  }
}