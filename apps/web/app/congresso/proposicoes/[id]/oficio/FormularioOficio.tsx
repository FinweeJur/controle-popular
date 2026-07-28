"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/congresso/basePath";
import type { Bloco, Destinatario, TipoDocumento } from "@/lib/congresso/oficio/compor";

interface Suspeita {
  tipo: string;
  trecho: string;
}

interface Resposta {
  oficio: { titulo: string; blocos: Bloco[]; assunto: string };
  original?: Bloco[];
  revisao?: {
    aplicada: boolean;
    motivoDescarte?: string;
    modelo: string;
    suspeitas: Suspeita[];
  };
  mailto: string;
  erro?: string;
}

const TIPOS: { valor: TipoDocumento; rotulo: string; descricao: string }[] = [
  { valor: "apoio", rotulo: "Apoio", descricao: "pede voto favorável" },
  { valor: "repudio", rotulo: "Repúdio", descricao: "pede rejeição" },
  { valor: "vista", rotulo: "Pedido de vista", descricao: "pede mais tempo de exame" },
  { valor: "comentario", rotulo: "Comentário técnico", descricao: "contribui sem pedir posição" },
];

export default function FormularioOficio({
  proposicaoId,
  identificacao,
  destinatariosSugeridos,
}: {
  proposicaoId: string;
  identificacao: string;
  destinatariosSugeridos: Destinatario[];
}) {
  const [tipo, setTipo] = useState<TipoDocumento>("apoio");
  // Pré-marca só quem tem `destaque` (mesa diretora da comissão — quem de
  // fato decide a pauta). Pedir para o autor do PL aprovar o próprio
  // projeto não serve para nada, e pré-marcar dezenas de titulares
  // arriscaria virar disparo em massa sem o usuário perceber. Se a
  // migration dos membros ainda não rodou, `destinatariosSugeridos` só
  // tem o(s) autor(es) — nesse caso volta ao comportamento antigo (marca
  // tudo) para o formulário não nascer vazio.
  const destaque = destinatariosSugeridos
    .map((d, i) => (d.destaque ? i : -1))
    .filter((i) => i >= 0);
  const [selecionados, setSelecionados] = useState<number[]>(
    destaque.length > 0 ? destaque : destinatariosSugeridos.map((_, i) => i)
  );
  const [revisar, setRevisar] = useState(false);
  const [resultado, setResultado] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarOriginal, setMostrarOriginal] = useState(false);

  function corpoDoFormulario(form: HTMLFormElement, formato: string) {
    const d = new FormData(form);
    return {
      proposicaoId,
      tipo,
      formato,
      revisar,
      tratamento: String(d.get("tratamento") ?? "").trim() || undefined,
      observacoes: String(d.get("observacoes") ?? "").trim() || undefined,
      remetente: {
        nome: String(d.get("nome") ?? "").trim(),
        qualificacao: String(d.get("qualificacao") ?? "").trim() || undefined,
        cidade: String(d.get("cidade") ?? "").trim() || undefined,
        uf: String(d.get("uf") ?? "").trim() || undefined,
        email: String(d.get("email") ?? "").trim() || undefined,
      },
      destinatarios: selecionados.map((i) => destinatariosSugeridos[i]).filter(Boolean),
    };
  }

  async function gerar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // `e.currentTarget` fica null depois do primeiro await — capturar antes.
    const form = e.currentTarget;
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch(withBasePath("/api/oficio"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corpoDoFormulario(form, "json")),
      });
      const dados = (await resp.json()) as Resposta;
      if (!resp.ok) {
        setErro(dados.erro ?? "não foi possível gerar o ofício");
        setResultado(null);
      } else {
        setResultado(dados);
      }
    } catch {
      setErro("erro de conexão ao gerar o ofício");
    } finally {
      setCarregando(false);
    }
  }

  async function baixar(formato: "txt" | "docx" | "pdf") {
    const form = document.getElementById("form-oficio") as HTMLFormElement | null;
    if (!form) return;
    setCarregando(true);
    try {
      const resp = await fetch(withBasePath("/api/oficio"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corpoDoFormulario(form, formato)),
      });
      if (!resp.ok) {
        setErro("não foi possível gerar o arquivo");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        resp.headers.get("content-disposition")?.match(/filename="(.+?)"/)?.[1] ??
        `oficio.${formato}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCarregando(false);
    }
  }

  const blocosMostrados =
    mostrarOriginal && resultado?.original ? resultado.original : resultado?.oficio.blocos;

  return (
    <div className="space-y-8">
      <form id="form-oficio" onSubmit={gerar} className="space-y-6">
        <fieldset className="space-y-2">
          <legend className="font-semibold">1. O que você quer dizer</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIPOS.map((t) => (
              <label
                key={t.valor}
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 ${
                  tipo === t.valor
                    ? "border-[var(--cp-primary)]"
                    : "border-[var(--cp-border)]"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={t.valor}
                  checked={tipo === t.valor}
                  onChange={() => setTipo(t.valor)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{t.rotulo}</span>
                  <span className="block text-sm opacity-70">{t.descricao}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-semibold">2. Para quem</legend>
          {destaque.length > 0 ? (
            <p className="text-sm opacity-70">
              Pré-marcamos a presidência e as vice-presidências da comissão — é quem decide
              a pauta agora. O autor do projeto está na lista por cortesia, não marcado: não
              adianta pedir para quem propôs o texto aprovar o próprio projeto.
            </p>
          ) : null}
          {destinatariosSugeridos.length === 0 ? (
            <p className="text-sm opacity-70">
              Nenhum destinatário disponível — a proposição não tem autoria nem órgão
              registrados no banco.
            </p>
          ) : (
            <ul className="space-y-1">
              {destinatariosSugeridos.map((d, i) => (
                <li key={`${d.nome}-${i}`}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(i)}
                      onChange={(ev) =>
                        setSelecionados((s) =>
                          ev.target.checked ? [...s, i] : s.filter((x) => x !== i)
                        )
                      }
                    />
                    <span className="text-sm">
                      {d.cargo} {d.nome}
                      {d.partido ? ` (${d.partido}${d.uf ? `/${d.uf}` : ""})` : ""}
                      {d.email ? (
                        <span className="opacity-60"> · {d.email}</span>
                      ) : (
                        <span className="opacity-60"> · sem e-mail cadastrado</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold">3. Quem assina</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-sm opacity-75">Nome *</span>
              <input
                name="nome"
                required
                className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm opacity-75">Qualificação</span>
              <input
                name="qualificacao"
                placeholder="cidadã, Coletivo X, Sindicato Y"
                className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm opacity-75">Cidade</span>
              <input
                name="cidade"
                className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
              />
            </label>
            <label>
              <span className="text-sm opacity-75">UF</span>
              <input
                name="uf"
                maxLength={2}
                className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm opacity-75">E-mail (aparece na assinatura)</span>
              <input
                name="email"
                type="email"
                className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold">4. Ajustes (opcional)</legend>
          <label className="block">
            <span className="text-sm opacity-75">
              Tratamento — deixe em branco para a forma neutra
              {" "}
              <span className="opacity-60">
                (padrão: “Excelentíssimo(a) Senhor(a) Deputado(a) Fulano”)
              </span>
            </span>
            <input
              name="tratamento"
              placeholder="Excelentíssima Senhora Deputada Fulana"
              className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm opacity-75">Parágrafo próprio</span>
            <textarea
              name="observacoes"
              rows={3}
              placeholder="Algo que você queira acrescentar com suas palavras."
              className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
            />
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={revisar}
              onChange={(e) => setRevisar(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Deixar a IA melhorar a redação</span>
              <span className="block opacity-70">
                O texto é montado sem IA a partir dos dados oficiais. Marcando aqui, um
                modelo reescreve os parágrafos para soarem mais naturais — proibido de
                acrescentar lei, número ou data. Se ele acrescentar mesmo assim, a revisão
                é descartada automaticamente e você recebe o texto original.
              </span>
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={carregando}
          className="rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-[var(--cp-primary-ink)] disabled:opacity-60"
        >
          {carregando ? "Gerando…" : "Gerar ofício"}
        </button>
        {erro ? <p className="text-[var(--cp-alert)]">{erro}</p> : null}
      </form>

      {resultado ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-semibold">Prévia</h2>
            <span className="text-sm opacity-70">{identificacao}</span>
          </div>

          {resultado.revisao ? (
            <div
              className="rounded-lg border p-4 text-sm"
              style={{
                borderColor: resultado.revisao.aplicada
                  ? "var(--cp-border)"
                  : "var(--cp-alert)",
              }}
            >
              {resultado.revisao.aplicada ? (
                <>
                  <p>
                    Redação revisada por <strong>{resultado.revisao.modelo}</strong>. Nenhum
                    dispositivo legal foi acrescentado — se tivesse sido, a revisão teria
                    sido descartada.
                  </p>
                  {resultado.revisao.suspeitas.length > 0 ? (
                    <p className="mt-2">
                      Marcados como não confirmados na fonte:{" "}
                      {resultado.revisao.suspeitas.map((s) => `“${s.trecho}”`).join(", ")}.
                      Confira antes de assinar.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setMostrarOriginal((v) => !v)}
                    className="mt-2 underline"
                  >
                    {mostrarOriginal ? "ver versão revisada" : "ver versão original, sem IA"}
                  </button>
                </>
              ) : (
                <p>
                  <strong>Revisão descartada</strong> — {resultado.revisao.motivoDescarte}. O
                  texto abaixo é o gerado sem IA, direto dos dados oficiais.
                </p>
              )}
            </div>
          ) : null}

          <article className="space-y-3 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6">
            {blocosMostrados?.map((b, i) => {
              if (b.tipo === "local_data")
                return (
                  <p key={i} className="text-right">
                    {b.texto}
                  </p>
                );
              if (b.tipo === "referencia")
                return (
                  <p key={i} className="font-semibold">
                    {b.texto}
                  </p>
                );
              if (b.tipo === "citacao")
                return (
                  <blockquote
                    key={i}
                    className="border-l-2 border-[var(--cp-border)] pl-4 italic opacity-85"
                  >
                    “{b.texto}”
                  </blockquote>
                );
              if (b.tipo === "assinatura")
                return (
                  <p key={i} className="whitespace-pre-line pt-6 text-center">
                    {b.texto}
                  </p>
                );
              return (
                <p key={i} className={b.tipo === "paragrafo" ? "text-justify indent-8" : ""}>
                  {b.texto}
                </p>
              );
            })}
          </article>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => baixar("pdf")}
              className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium"
            >
              Baixar PDF
            </button>
            <button
              type="button"
              onClick={() => baixar("docx")}
              className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium"
            >
              Baixar DOCX
            </button>
            <button
              type="button"
              onClick={() => baixar("txt")}
              className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium"
            >
              Baixar TXT
            </button>
            {resultado.mailto ? (
              <a
                href={resultado.mailto}
                className="rounded-md bg-[var(--cp-accent)] px-4 py-2 font-medium text-[var(--cp-accent-ink)]"
              >
                Abrir no meu e-mail
              </a>
            ) : null}
          </div>

          <p className="text-sm opacity-70">
            O envio é seu: o app monta o documento e abre seu cliente de e-mail já
            preenchido, mas quem aperta “enviar” é você. Nada sai daqui sozinho.
          </p>
        </section>
      ) : null}
    </div>
  );
}
