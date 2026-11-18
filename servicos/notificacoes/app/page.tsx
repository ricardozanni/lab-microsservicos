export default function Page() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>Serviço de Notificações</h1>
      <p>
        Consumidor de fila. Endpoints: <code>POST /api/notificar</code> (assinado) e{" "}
        <code>GET /api/notificacoes</code>.
      </p>
    </main>
  );
}