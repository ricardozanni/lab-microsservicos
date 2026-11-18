// Encaminha a requisição para outro serviço, com TIMEOUT e tratamento de falha
export async function encaminhar(
  baseUrl: string | undefined,
  caminho: string,
  init?: RequestInit
) {
  if (!baseUrl) {
    return Response.json({ erro: "URL do serviço não configurada." }, { status: 500 });
  }
  try {
    const res = await fetch(`${baseUrl}${caminho}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(5000), // não espera para sempre
    });
    const corpo = await res.text();
    return new Response(corpo, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // 503: o serviço de destino está indisponível. O gateway continua de pé
    return Response.json(
      { erro: "Serviço indisponível (timeout ou erro de rede)." },
      { status: 503 }
    );
  }
}