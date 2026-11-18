import { encaminhar } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return encaminhar(process.env.PEDIDOS_URL, `/api/pedidos/${encodeURIComponent(id)}`);
}