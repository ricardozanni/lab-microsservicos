import { encaminhar } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return encaminhar(process.env.NOTIFICACOES_URL, "/api/notificacoes");
}