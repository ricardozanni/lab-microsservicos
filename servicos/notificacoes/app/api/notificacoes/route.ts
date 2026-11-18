import { redis } from "@/lib/comum";

export const dynamic = "force-dynamic";

export async function GET() {
  const itens = await redis.lrange("notificacoes", 0, 19);
  return Response.json(itens);
}