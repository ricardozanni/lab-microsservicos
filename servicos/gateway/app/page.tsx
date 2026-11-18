"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Pedido = {
  id: string;
  cliente: string;
  valor: number;
  status: string;
  motivo?: string;
};
type Notificacao = { idPedido: string; tipo: string; mensagem: string; em: string };
type Detalhe = Pedido & {
  historico: { evento: string; detalhe: string; em: string }[];
};

const cores: Record<string, string> = {
  PENDENTE: "#f59e0b",
  CONFIRMADO: "#16a34a",
  CANCELADO: "#dc2626",
};

export default function Home() {
  const [cliente, setCliente] = useState("Maria");
  const [valor, setValor] = useState("250");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [msg, setMsg] = useState("");

  const atualizar = useCallback(async () => {
    try {
      const [p, n] = await Promise.all([
        fetch("/api/pedidos").then((r) => r.json()),
        fetch("/api/notificacoes").then((r) => r.json()),
      ]);
      if (Array.isArray(p)) setPedidos(p);
      if (Array.isArray(n)) setNotificacoes(n);
    } catch {
      /* ignora falhas momentâneas de rede */
    }
  }, []);

  // Polling a cada 2 s: é assim que o cliente "enxerga" a consistência eventual
  useEffect(() => {
    atualizar();
    const t = setInterval(atualizar, 2000);
    return () => clearInterval(t);
  }, [atualizar]);

  async function criar(e: FormEvent) {
    e.preventDefault();
    setMsg("Enviando...");
    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, valor: Number(valor) }),
    });
    const dados = await res.json();
    setMsg(
      res.ok
        ? `Pedido ${dados.idPedido} aceito (HTTP ${res.status}). Processamento assíncrono em andamento...`
        : `Erro (HTTP ${res.status}): ${dados.erro}`
    );
    atualizar();
  }

  async function verDetalhe(id: string) {
    const res = await fetch(`/api/pedidos/${id}`);
    if (res.ok) setDetalhe(await res.json());
  }

  const campo = { padding: 8, marginRight: 8, border: "1px solid #888", borderRadius: 4 };

  return (
    <main style={{ maxWidth: 820, margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1>🛒 Sistema de Pedidos Distribuído</h1>

      <form onSubmit={criar} style={{ marginBottom: 16 }}>
        <input style={campo} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente" />
        <input style={{ ...campo, width: 110 }} type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" />
        <button type="submit" style={{ padding: "8px 16px" }}>Criar pedido</button>
      </form>
      {msg && <p><strong>{msg}</strong></p>}

      <h2>Pedidos recentes</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>ID</th><th>Cliente</th><th>Valor</th><th>Status</th><th>Motivo</th><th></th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{p.id}</td>
              <td>{String(p.cliente)}</td>
              <td>R$ {p.valor}</td>
              <td>
                <span style={{ background: cores[p.status] ?? "#999", color: "#fff", padding: "2px 10px", borderRadius: 12 }}>
                  {p.status}
                </span>
              </td>
              <td style={{ fontSize: 12 }}>{p.motivo ?? ""}</td>
              <td><button onClick={() => verDetalhe(p.id)}>histórico</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {detalhe && (
        <section style={{ background: "#f3f4f6", padding: 12, marginTop: 16, borderRadius: 6, color: "#111" }}>
          <h3>Histórico de {detalhe.id} (status atual: {detalhe.status})</h3>
          <ol>
            {detalhe.historico.map((h, i) => (
              <li key={i}>
                <code>{h.em.slice(11, 19)}</code> <strong>{h.evento}</strong> {h.detalhe}
              </li>
            ))}
          </ol>
        </section>
      )}

      <h2>Notificações enviadas</h2>
      <ul>
        {notificacoes.map((n, i) => (
          <li key={i}>
            <code>{n.em.slice(11, 19)}</code> [{n.tipo}] {n.mensagem}
          </li>
        ))}
      </ul>
    </main>
  );
}