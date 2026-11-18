import { redis, log, registrarHistorico } from "@/lib/comum";
import { qstash } from "@/lib/qstash";

export const dynamic = "force-dynamic";

// POST /api/pedidos  →  cria um pedido
export async function POST(request: Request) {
  let corpo: { cliente?: string; valor?: number };
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const cliente = corpo.cliente?.trim();
  const valor = Number(corpo.valor);
  if (!cliente || !Number.isFinite(valor) || valor <= 0) {
    return Response.json(
      { erro: "Informe 'cliente' e um 'valor' maior que zero." },
      { status: 400 }
    );
  }

  // O prefixo evita que o Redis/SDK interprete o ID como número
  const idPedido = `PED-${crypto.randomUUID().slice(0, 8)}`;
  const agora = new Date().toISOString();

  // 1) Grava o pedido com status PENDENTE
  await redis.hset(`pedido:${idPedido}`, {
    id: idPedido,
    cliente,
    valor,
    status: "PENDENTE",
    criadoEm: agora,
    atualizadoEm: agora,
  });
  await redis.lpush("pedidos:recentes", idPedido);
  await redis.ltrim("pedidos:recentes", 0, 19);
  await registrarHistorico(idPedido, "PEDIDO_CRIADO", `cliente=${cliente} valor=${valor}`);
  log("pedido_criado", { idPedido, valor });

  // 2) Publica na fila (mensagem assíncrona): pedidos NÃO espera a notificação
  try {
    await qstash.publishJSON({
      url: `${process.env.NOTIFICACOES_URL}/api/notificar`,
      body: {
        idPedido,
        tipo: "PEDIDO_CRIADO",
        cliente,
        mensagem: `Recebemos seu pedido ${idPedido} (R$ ${valor}).`,
      },
      retries: 3,
      // Evita publicar duas vezes a mesma mensagem lógica
      deduplicationId: `notificar-${idPedido}-PEDIDO_CRIADO`,
    });
  } catch (erro) {
    // Notificação é secundária: registra e segue (o pedido já foi criado)
    log("falha_ao_publicar_notificacao", { idPedido, erro: String(erro) });
  }

  // 3) 202 Accepted: "recebi e vou processar", e não "já terminei"
  return Response.json({ idPedido, status: "PENDENTE" }, { status: 202 });
}

// GET /api/pedidos  →  lista os 10 mais recentes
export async function GET() {
  const ids = await redis.lrange<string>("pedidos:recentes", 0, 9);
  const pedidos = await Promise.all(ids.map((id) => redis.hgetall(`pedido:${id}`)));
  return Response.json(pedidos.filter(Boolean));
}