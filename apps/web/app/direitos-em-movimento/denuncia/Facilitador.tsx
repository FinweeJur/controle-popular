"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Cidade } from "@/lib/db/queries/municipios";
import { montarItensPainel, itensSemCidade, NAO_VERIFICADO, type ItemPainel } from "@/lib/betim/redeProtecao";
import {
  respostasVazias,
  type RespostasDenuncia,
  type Continuacao,
  type Violador,
  type Situacao,
  type TipoProva,
} from "@/lib/denuncia/tipos";
import {
  necessidadesSugeridas,
  regrasAplicaveis,
  textoUrgencia,
  TEXTO_CIDH,
  TEXTO_NAO_E_ACONSELHAMENTO,
  TEXTO_VISITA_REGISTRADA,
  VIOLADOR_LABEL,
  SITUACAO_LABEL,
} from "@/lib/denuncia/roteiro";
import { FERRAMENTAS_PROVA, AVISO_GRAVACAO, TIPO_PROVA_LABEL } from "@/lib/denuncia/provas";
import { comporDocumentoDenuncia } from "@/lib/denuncia/compor";
import { apagarRascunho, carregarRascunho, salvarRascunho, type RascunhoCarregado } from "@/lib/denuncia/rascunho";

/**
 * `ssr: false` é obrigatório, não preferência — mesmo motivo de
 * `BotoesBinarios.tsx`/`FormularioOficio.tsx` em `app/congresso/...`: sem
 * isto o Next compila `docx` (importado por `render-binario.ts`) para o
 * grafo de SSR também, e o teto de 3 MB gzip do Worker do Cloudflare Free
 * fica em risco. Aqui isso é bônus — o motivo que decide é de privacidade
 * (ver `render-binario.ts`), mas o motivo técnico continua valendo.
 */
const BaixarDocumento = dynamic(() => import("./BaixarDocumento"), {
  ssr: false,
  loading: () => (
    <span className="inline-block rounded-xl border border-border px-6 py-3 font-medium opacity-60">
      preparando o gerador de documento…
    </span>
  ),
});

const TITULOS_PASSO = [
  "Antes de começar",
  "Quando começou",
  "Continua acontecendo?",
  "Onde foi",
  "Quem esteve envolvido",
  "O que aconteceu",
  "Provas",
  "Para onde enviar",
  "Baixar o documento",
] as const;

const TOTAL_PASSOS = TITULOS_PASSO.length;

/** `RascunhoCarregado` + o texto "há quanto tempo" já calculado no momento
 * da detecção — para o render nunca precisar chamar `Date.now()` sozinho
 * (`react-hooks/purity` trata isso como impuro dentro do corpo do
 * componente). */
interface RascunhoDetectado extends RascunhoCarregado {
  tempoAtras: string;
}

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

function formatarTempoAtras(ms: number): string {
  const minutos = Math.max(0, Math.round(ms / 60000));
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `${minutos} min atrás`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas}h atrás`;
  return "faz mais de um dia";
}

function Pill({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className="cursor-pointer rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition-colors"
      style={
        ativo
          ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
          : { borderColor: "var(--border)" }
      }
    >
      {children}
    </button>
  );
}

function BarraNavegacao({
  passo,
  onVoltar,
  onAvancar,
  rotuloAvancar = "Avançar",
}: {
  passo: number;
  onVoltar: () => void;
  onAvancar?: () => void;
  rotuloAvancar?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
      <button
        type="button"
        onClick={onVoltar}
        disabled={passo === 0}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        ← Voltar
      </button>
      <span className="text-xs text-text-soft">
        Passo {passo + 1} de {TOTAL_PASSOS}
      </span>
      {onAvancar ? (
        <button
          type="button"
          onClick={onAvancar}
          className="rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--cp-primary)" }}
        >
          {rotuloAvancar} →
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

export default function Facilitador({ cidades }: { cidades: Cidade[] }) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<RespostasDenuncia>(respostasVazias());
  const [rascunhoAtivo, setRascunhoAtivo] = useState(false);
  const [rascunhoEncontrado, setRascunhoEncontrado] = useState<RascunhoDetectado | null>(null);
  const [outraCidade, setOutraCidade] = useState(false);

  // Só LÊ um rascunho de sessão anterior, na abertura — nunca aplica
  // sozinho. Quem decide "continuar" ou "começar do zero" é a pessoa, ver o
  // banner no passo 0. `Date.now()` e a leitura de `localStorage` só
  // acontecem aqui dentro (nunca no corpo de render — ver `render()` mais
  // abaixo), e o `setState` roda dentro do `.then()`, não sincronamente no
  // corpo do efeito: mesmo formato de `PopularesClient.tsx`
  // (`app/dados/populares/`), que evita o lint `react-hooks/set-state-in-effect`.
  useEffect(() => {
    if (typeof window === "undefined") return;
    Promise.resolve().then(() => {
      const carregado = carregarRascunho(window.localStorage);
      if (!carregado) return;
      setRascunhoEncontrado({
        ...carregado,
        tempoAtras: formatarTempoAtras(Date.now() - carregado.salvoEm),
      });
    });
  }, []);

  // Persiste a cada mudança, só se o opt-in estiver ligado. Enquanto
  // desligado, nada toca `localStorage` — a decisão de risco é da pessoa,
  // ver a docstring de `lib/denuncia/rascunho.ts`.
  useEffect(() => {
    if (typeof window === "undefined" || !rascunhoAtivo) return;
    salvarRascunho(window.localStorage, respostas);
  }, [respostas, rascunhoAtivo]);

  function apagarTudoAgora() {
    if (typeof window !== "undefined") apagarRascunho(window.localStorage);
    setRespostas(respostasVazias());
    setRascunhoAtivo(false);
    setRascunhoEncontrado(null);
    setOutraCidade(false);
    setPasso(0);
  }

  function continuarRascunho() {
    if (!rascunhoEncontrado) return;
    setRespostas(rascunhoEncontrado.respostas);
    setRascunhoAtivo(true);
    setOutraCidade(
      !rascunhoEncontrado.respostas.cidadeSlug && !!rascunhoEncontrado.respostas.outraCidadeNome
    );
    setRascunhoEncontrado(null);
    setPasso(1);
  }

  function descartarRascunhoEncontrado() {
    if (typeof window !== "undefined") apagarRascunho(window.localStorage);
    setRascunhoEncontrado(null);
  }

  const cidadeEscolhida = cidades.find((c) => c.slug === respostas.cidadeSlug) ?? null;
  const cidadeNome = cidadeEscolhida
    ? `${cidadeEscolhida.nome}/${cidadeEscolhida.uf}`
    : respostas.outraCidadeNome.trim() || null;

  // Desestruturado para o `useMemo` depender só do que de fato usa —
  // `violadores`/`situacoes` mantêm a MESMA referência de array entre
  // renders quando só `relato`/`quando`/outros campos mudam (o `setRespostas`
  // é sempre um spread raso), então isto evita recomputar o roteamento a
  // cada tecla digitada no relato, e ainda assim satisfaz o
  // `react-hooks/exhaustive-deps` (que não sabe disso sozinho quando o
  // objeto inteiro `respostas` é referenciado dentro do callback).
  const { violadores, situacoes } = respostas;
  const necessidades = useMemo(
    () => necessidadesSugeridas({ violadores, situacoes }),
    [violadores, situacoes]
  );
  const regras = useMemo(
    () => regrasAplicaveis({ violadores, situacoes }),
    [violadores, situacoes]
  );

  const itensSugeridos = useMemo((): ItemPainel[] => {
    const base = cidadeEscolhida ? montarItensPainel(cidadeEscolhida) : itensSemCidade();
    const filtrados = base.filter((it) => it.necessidades.some((n) => necessidades.includes(n)));
    const vistos = new Set<string>();
    return filtrados.filter((it) => {
      if (vistos.has(it.id)) return false;
      vistos.add(it.id);
      return true;
    });
  }, [cidadeEscolhida, necessidades]);

  const documento = useMemo(
    () => comporDocumentoDenuncia(respostas, { cidadeNome, itensSugeridos }),
    [respostas, cidadeNome, itensSugeridos]
  );

  const urgencia = textoUrgencia(respostas.continua);
  const mostrarBarraApagar = rascunhoAtivo;

  function irPara(p: number) {
    setPasso(Math.max(0, Math.min(TOTAL_PASSOS - 1, p)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {mostrarBarraApagar && (
        <div
          className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 bg-surface px-4 py-3"
          style={{ borderColor: "var(--cp-alert)" }}
        >
          <p className="text-[.85em] text-text">
            Rascunho sendo salvo neste aparelho.
          </p>
          <button
            type="button"
            onClick={apagarTudoAgora}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-white"
            style={{ background: "var(--cp-alert)" }}
          >
            Apagar tudo agora
          </button>
        </div>
      )}

      <p className="text-xs font-medium uppercase tracking-wide text-text-soft">
        {TITULOS_PASSO[passo]}
      </p>

      {passo === 0 && (
        <div className="mt-3 space-y-6">
          <p className="text-text-soft">
            Nove passos curtos. Cada um vem com ajuda em linguagem comum — nada de campo mudo.
            Você pode parar e voltar a qualquer momento; sem rascunho salvo (a decisão é sua,
            logo abaixo), fechar a aba apaga tudo.
          </p>

          <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--cp-primary)" }}>
            <p className="font-medium text-text">{TEXTO_VISITA_REGISTRADA}</p>
          </div>

          {rascunhoEncontrado && (
            <div className="rounded-2xl border-2 border-dashed border-accent bg-accent/10 p-5">
              <p className="font-medium text-text">
                Encontramos um rascunho salvo neste aparelho, de{" "}
                {rascunhoEncontrado.tempoAtras}.
              </p>
              <p className="mt-1 text-[.9em] text-text-soft">
                Continuar de onde parou, ou apagar e começar do zero?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={continuarRascunho}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--cp-primary)" }}
                >
                  Continuar de onde parei
                </button>
                <button
                  type="button"
                  onClick={descartarRascunhoEncontrado}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium"
                >
                  Apagar e começar do zero
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={rascunhoAtivo}
                onChange={(e) => setRascunhoAtivo(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-text">
                  Salvar rascunho neste aparelho para continuar depois
                </span>
                <span className="mt-1 block text-[.88em] text-text-soft">
                  {rascunhoAtivo
                    ? "Isto grava o que você escreve NESTE computador ou celular. Se alguém tiver acesso a ele — inclusive por apreensão — pode ler o rascunho. Expira sozinho em 24h, e o botão \"Apagar tudo agora\" fica sempre visível enquanto estiver ligado."
                    : "Desligado: se você fechar esta aba, perde o que já respondeu. Só marque se este aparelho for seu e for seguro — uma lan house, um telecentro ou o computador de outra pessoa não são."}
                </span>
              </span>
            </label>
          </div>

          <div className="flex justify-end border-t border-border pt-5">
            <button
              type="button"
              onClick={() => irPara(1)}
              className="rounded-md px-5 py-2.5 font-semibold text-white"
              style={{ background: "var(--cp-primary)" }}
            >
              Começar →
            </button>
          </div>
        </div>
      )}

      {passo === 1 && (
        <div className="mt-3 space-y-4">
          <h2 className="font-display text-xl font-semibold">Mais ou menos quando isso começou?</h2>
          <p className="text-text-soft">
            Pode ser só o mês, ou &quot;faz uns 2 anos&quot; — não precisa de data exata. Data é o
            que mais decide prazo (inclusive o prazo de 6 meses para a Comissão Interamericana,
            se um dia chegar a esse ponto) e o que a memória guarda pior sob estresse.
          </p>
          <input
            type="text"
            value={respostas.quando}
            onChange={(e) => setRespostas((r) => ({ ...r, quando: e.target.value }))}
            placeholder="ex.: março de 2026, ou &quot;faz uns 2 anos&quot;"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text"
          />
          <BarraNavegacao passo={passo} onVoltar={() => irPara(0)} onAvancar={() => irPara(2)} />
        </div>
      )}

      {passo === 2 && (
        <div className="mt-3 space-y-4">
          <h2 className="font-display text-xl font-semibold">A violação continua acontecendo?</h2>
          <p className="text-text-soft">
            Isso muda a orientação inteira: se continua, o que mais importa é uma medida
            imediata, não só reunir prova.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["sim", "Sim, continua"],
                ["nao", "Não, já parou"],
                ["nao_sei", "Não sei dizer"],
              ] as [Continuacao, string][]
            ).map(([valor, rotulo]) => (
              <Pill
                key={valor}
                ativo={respostas.continua === valor}
                onClick={() => setRespostas((r) => ({ ...r, continua: valor }))}
              >
                {rotulo}
              </Pill>
            ))}
          </div>
          {urgencia && (
            <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--cp-alert)" }}>
              <p className="font-medium text-text">{urgencia}</p>
            </div>
          )}
          <BarraNavegacao passo={passo} onVoltar={() => irPara(1)} onAvancar={() => irPara(3)} />
        </div>
      )}

      {passo === 3 && (
        <div className="mt-3 space-y-4">
          <h2 className="font-display text-xl font-semibold">Onde foi?</h2>
          <p className="text-text-soft">
            Ajuda a decidir competência (delegacia, comarca, promotoria) junto com a data.
          </p>
          <div className="flex flex-wrap gap-2">
            {cidades.map((c) => (
              <Pill
                key={c.slug}
                ativo={respostas.cidadeSlug === c.slug}
                onClick={() => {
                  setOutraCidade(false);
                  setRespostas((r) => ({
                    ...r,
                    cidadeSlug: r.cidadeSlug === c.slug ? "" : c.slug,
                    outraCidadeNome: "",
                  }));
                }}
              >
                {c.nome} · {c.uf}
              </Pill>
            ))}
            <Pill
              ativo={outraCidade}
              onClick={() => {
                setOutraCidade((atual) => !atual);
                setRespostas((r) => ({ ...r, cidadeSlug: "" }));
              }}
            >
              Outra cidade
            </Pill>
          </div>
          {outraCidade && (
            <div>
              <input
                type="text"
                value={respostas.outraCidadeNome}
                onChange={(e) => setRespostas((r) => ({ ...r, outraCidadeNome: e.target.value }))}
                placeholder="Nome da sua cidade"
                className="w-full max-w-xs rounded-xl border border-border bg-bg px-3 py-2.5 text-text"
              />
              <p className="mt-2 max-w-2xl rounded-lg border border-dashed border-accent bg-accent/10 px-3 py-2 text-[.85em] text-text">
                {(respostas.outraCidadeNome.trim() || "Sua cidade")} não está entre as 6 cidades
                que este portal tem cadastradas — <strong>isso não significa que não existe canal
                municipal aí</strong>, só que o Controle Popular ainda não o levantou. O estadual
                e o federal, mais adiante, continuam valendo normalmente.
              </p>
            </div>
          )}
          <BarraNavegacao passo={passo} onVoltar={() => irPara(2)} onAvancar={() => irPara(4)} />
        </div>
      )}

      {passo === 4 && (
        <div className="mt-3 space-y-6">
          <h2 className="font-display text-xl font-semibold">Quem esteve envolvido?</h2>
          <p className="text-text-soft">
            Marque quantas se aplicarem — é a resposta que mais alimenta a sugestão de para onde
            mandar, mais adiante.
          </p>
          <div>
            <p className="text-[.9em] font-semibold text-text">Quem violou</p>
            <p className="mt-1 text-[.85em] text-text-soft">
              Pode ser uma pessoa (um vizinho, um chefe), uma empresa, ou um agente do Estado
              (policial, fiscal, funcionário público).
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(VIOLADOR_LABEL) as Violador[]).map((v) => (
                <Pill
                  key={v}
                  ativo={respostas.violadores.includes(v)}
                  onClick={() => setRespostas((r) => ({ ...r, violadores: alternar(r.violadores, v) }))}
                >
                  {VIOLADOR_LABEL[v]}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[.9em] font-semibold text-text">Isso também descreve a situação</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(SITUACAO_LABEL) as Situacao[]).map((s) => (
                <Pill
                  key={s}
                  ativo={respostas.situacoes.includes(s)}
                  onClick={() => setRespostas((r) => ({ ...r, situacoes: alternar(r.situacoes, s) }))}
                >
                  {SITUACAO_LABEL[s]}
                </Pill>
              ))}
            </div>
          </div>
          {respostas.violadores.includes("agente_estado") && (
            <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--cp-alert)" }}>
              <p className="font-medium text-text">
                Isto não é caso para resolver sozinho com a própria corporação do agente. A
                sugestão, mais adiante, vai incluir o Ministério Público e a Defensoria.
              </p>
            </div>
          )}
          <BarraNavegacao passo={passo} onVoltar={() => irPara(3)} onAvancar={() => irPara(5)} />
        </div>
      )}

      {passo === 5 && (
        <div className="mt-3 space-y-4">
          <h2 className="font-display text-xl font-semibold">O que aconteceu?</h2>
          <p className="text-text-soft">
            Escreva com suas palavras. Se ajudar a lembrar, pense em: o que foi feito, quem
            sofreu, quem mais viu.
          </p>
          <textarea
            value={respostas.relato}
            onChange={(e) => setRespostas((r) => ({ ...r, relato: e.target.value }))}
            rows={8}
            placeholder="Conte o que aconteceu, do seu jeito."
            className="w-full resize-y rounded-xl border border-border bg-bg p-3 text-text"
          />
          <BarraNavegacao passo={passo} onVoltar={() => irPara(4)} onAvancar={() => irPara(6)} />
        </div>
      )}

      {passo === 6 && (
        <div className="mt-3 space-y-6">
          <h2 className="font-display text-xl font-semibold">Você tem alguma prova?</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIPO_PROVA_LABEL) as TipoProva[]).map((p) => (
              <Pill
                key={p}
                ativo={respostas.provas.includes(p)}
                onClick={() => setRespostas((r) => ({ ...r, provas: alternar(r.provas, p) }))}
              >
                {TIPO_PROVA_LABEL[p]}
              </Pill>
            ))}
          </div>
          <textarea
            value={respostas.detalheProvas}
            onChange={(e) => setRespostas((r) => ({ ...r, detalheProvas: e.target.value }))}
            rows={3}
            placeholder="Algum detalhe sobre a prova que você tem (opcional)."
            className="w-full resize-y rounded-xl border border-border bg-bg p-3 text-text"
          />

          <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--cp-alert)" }}>
            <p className="font-medium text-text">{AVISO_GRAVACAO}</p>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold">
              Ferramentas — o que cada uma garante, e o que não garante
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {FERRAMENTAS_PROVA.map((f) => (
                <li key={f.ferramenta} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[.8em] font-semibold uppercase tracking-wide text-text-soft">
                    {f.situacao}
                  </p>
                  <p className="mt-1 font-medium text-text">
                    {f.link ? (
                      <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {f.ferramenta} ↗
                      </a>
                    ) : (
                      f.ferramenta
                    )}
                  </p>
                  <p className="mt-1.5 text-[.88em] text-text">
                    <span className="font-medium">Garante: </span>
                    {f.garante}
                  </p>
                  <p className="mt-1 text-[.88em] text-text-soft">
                    <span className="font-medium text-text">Não garante: </span>
                    {f.naoGarante}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <BarraNavegacao passo={passo} onVoltar={() => irPara(5)} onAvancar={() => irPara(7)} />
        </div>
      )}

      {passo === 7 && (
        <div className="mt-3 space-y-6">
          <h2 className="font-display text-xl font-semibold">Para onde levar isto</h2>

          {urgencia && (
            <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--cp-alert)" }}>
              <p className="font-medium text-text">{urgencia}</p>
            </div>
          )}

          {itensSugeridos.length === 0 ? (
            <p className="text-text-soft">
              Nenhum canal catalogado para esta combinação de respostas ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {itensSugeridos.map((it) => (
                <li key={it.id} className="rounded-2xl border border-border bg-surface p-5">
                  <p className="font-medium text-text">{it.nome}</p>
                  <p className="mt-1 text-[.9em] text-text-soft">{it.oQueAtende}</p>
                  {it.telefone && (
                    <p className="mt-1 text-xs text-text-soft">
                      <span className="font-medium text-text">Telefone: </span>
                      {it.telefone}
                    </p>
                  )}
                  {it.endereco && (
                    <p className="mt-1 text-xs text-text-soft">
                      <span className="font-medium text-text">Endereço: </span>
                      {it.endereco}
                    </p>
                  )}
                  {it.site && (
                    <a
                      href={it.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
                    >
                      Abrir site oficial →
                    </a>
                  )}
                  <p className="mt-2 text-[.7em] text-text-soft">Verificado em {it.verificadoEm}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            {regras.map((regra) => (
              <p key={regra.id} className="text-[.88em] text-text-soft">
                {regra.motivo}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-dashed border-accent bg-accent/10 p-5">
            <p className="font-medium text-text">
              {NAO_VERIFICADO.length} canais da rede de proteção são reais, mas não confirmados
            </p>
            <p className="mt-1.5 text-[.88em] text-text-soft">
              E-SIC que devolveu erro, delegacia especializada sem endereço atual confirmado,
              comissão que bloqueou acesso automatizado. Mandar alguém em situação de urgência
              para um telefone não confirmado é pior que avisar — a lista completa, com o motivo
              de cada um, está em{" "}
              <a href="/direitos-em-movimento/ajuda" className="font-medium text-primary hover:underline">
                Onde buscar ajuda
              </a>
              .
            </p>
          </div>

          <div className="rounded-2xl border-2 p-5" style={{ borderColor: "var(--cp-primary)" }}>
            <p className="font-medium text-text">{TEXTO_NAO_E_ACONSELHAMENTO}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[.9em] text-text-soft">{TEXTO_CIDH}</p>
          </div>

          <BarraNavegacao passo={passo} onVoltar={() => irPara(6)} onAvancar={() => irPara(8)} rotuloAvancar="Ir para o documento" />
        </div>
      )}

      {passo === 8 && (
        <div className="mt-3 space-y-6">
          <h2 className="font-display text-xl font-semibold">Baixe o registro</h2>
          <p className="text-text-soft">
            Um arquivo .docx com tudo que você respondeu, pronto para levar à Defensoria, a um
            advogado ou ao NAJUP. Nada de &quot;enviar&quot; — só baixar.
          </p>
          <BaixarDocumento documento={documento} />
          <BarraNavegacao passo={passo} onVoltar={() => irPara(7)} />
        </div>
      )}
    </div>
  );
}
