import { redis } from "@/lib/comum";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const pedido = await redis.hgetall(`pedido:${id}`);
  if (!pedido) {
    return Response.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  const historico = await redis.lrange(`pedido:${id}:historico`, 0, -1);
  return Response.json({ ...pedido, historico });
}