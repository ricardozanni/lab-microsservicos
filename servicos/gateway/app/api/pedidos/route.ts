import { encaminhar } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const corpo = await request.text();
  return encaminhar(process.env.PEDIDOS_URL, "/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: corpo,
  });
}

export async function GET() {
  return encaminhar(process.env.PEDIDOS_URL, "/api/pedidos");
}