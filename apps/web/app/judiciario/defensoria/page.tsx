import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import { COBERTURA_DEFENSORIA } from "@/lib/judiciario/defensoria-mg";
import { lerComarcasMg } from "@/lib/judiciario/defensoria-mg-dados";

/** Sinônimo — o dado agora vive no loader server-only. */
const COMARCAS_MG = lerComarcasMg();
import TabelaComarcas from "./TabelaComarcas";

/**
 * `/judiciario/defensoria` — a pessoa procura a própria comarca e descobre
 * se tem defensor público onde ela mora.
 *
 * ═══ O DENOMINADOR É O PRODUTO ═══
 *
 * A DPMG publica onde ELA está — nunca onde ela não está. "128 unidades"
 * parece cobertura boa. Contra as 298 comarcas do estado, vira déficit. Esta
 * página existe para juntar as duas pontas: o dado próprio (comarca a
 * comarca, com população) é o que faz a conta aparecer.
 *
 * ═══ AS FONTES DIVERGEM, E AS DUAS FICAM ═══
 *
 * A DPMG lista 129 unidades físicas hoje (128 comarcas mineiras + a sede em
 * Brasília); a Pesquisa Nacional da Defensoria 2025 marca 120 comarcas como
 * atendidas. São recortes diferentes — unidade física instalada contra
 * comarca declarada atendida —, e escolher um e calar esconderia a
 * diferença. Ver `lib/judiciario/defensoria-mg.ts` para o detalhe da coleta.
 *
 * ═══ O RITMO É A SEGUNDA MANCHETE ═══
 *
 * 105 comarcas atendidas em 2013 (IPEA), 120 em 2025: quinze em doze anos.
 * A conta de quanto tempo levaria para cobrir as 176 restantes nesse ritmo
 * é feita AQUI embaixo, a partir dos números do módulo — nunca hardcoded —,
 * com a ressalva de que ritmo passado não é previsão.
 */

const C = COBERTURA_DEFENSORIA;

export const metadata: Metadata = metadataEditavel("/judiciario/defensoria", {
  title: "Tem Defensoria na sua comarca? — Controle Popular · Judiciário",
  description:
    `Das ${C.comarcas} comarcas de Minas Gerais, ${C.atendidas2025} têm Defensoria Pública, ${C.naoAtendidas2025} não têm e ${C.parcialmente2025} têm parcialmente — Pesquisa Nacional da Defensoria 2025. Busque a sua comarca e veja o ritmo de expansão desde 2013.`,
});

/** Doze anos entre a foto do IPEA (2013) e a Pesquisa Nacional (2025). Todo
 *  outro número desta conta vem do módulo — nada aqui é estimativa solta. */
const ANOS_ENTRE_FOTOS = 2025 - 2013;
const GANHO_COMARCAS = C.atendidas2025 - C.atendidas2013;
const RITMO_POR_ANO = GANHO_COMARCAS / ANOS_ENTRE_FOTOS;
const ANOS_PARA_COBRIR_RESTO = Math.round(C.naoAtendidas2025 / RITMO_POR_ANO);

const SEM_REGISTRO_2013 = COMARCAS_MG.filter((c) => c.atendida2013 === null).length;

const DISTRIBUICAO_2025 = [
  { rotulo: "Não atendida", valor: C.naoAtendidas2025, cor: "bg-alert" },
  { rotulo: "Atendida", valor: C.atendidas2025, cor: "bg-accent" },
  { rotulo: "Parcialmente atendida", valor: C.parcialmente2025, cor: "bg-ord-4" },
];

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="font-display text-[1.9em] leading-none font-bold text-text tabular-nums">
        {valor}
      </p>
      <p className="mt-2 text-[.92em] font-semibold text-text">{rotulo}</p>
      {nota && <p className="mt-1 text-[.82em] leading-relaxed text-text-soft">{nota}</p>}
    </div>
  );
}

export default function DefensoriaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/judiciario" className="hover:text-primary">
          Judiciário
        </a>{" "}
        · <span className="text-text">Defensoria Pública</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Judiciário · Acesso à Justiça
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Tem Defensoria na sua comarca?
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          A Defensoria Pública é quem defende de graça quem não pode pagar advogado. Minas Gerais
          tem <strong className="text-text">{C.comarcas} comarcas</strong>; em{" "}
          <strong className="text-text">{C.naoAtendidas2025}</strong> delas não há Defensoria
          nenhuma, segundo a Pesquisa Nacional da Defensoria 2025. Busque a sua comarca na tabela
          no fim desta página.
        </p>
      </header>

      {/* ═══ CARTÕES ═══ */}
      <section aria-label="Números da cobertura" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={String(C.atendidas2025)}
          rotulo="de 298 comarcas têm Defensoria Pública"
          nota={`mais ${C.parcialmente2025} parcialmente atendidas — ${C.naoAtendidas2025} não têm nenhuma`}
        />
        <Cartao
          valor={formatNumberBR(C.populacaoEmComarcaNaoAtendida)}
          rotulo="pessoas moram em comarca sem Defensoria"
          nota="soma da população das 176 comarcas não atendidas, direto do dado"
        />
        <Cartao
          valor={String(C.comUnidadeFisicaHoje)}
          rotulo="unidades físicas da DPMG hoje, segundo a própria Defensoria"
          nota="mais a sede em Brasília — recorte diferente de “comarca atendida”, veja abaixo"
        />
        <Cartao
          valor={String(GANHO_COMARCAS)}
          rotulo="comarcas passaram a ter Defensoria entre 2013 e 2025"
          nota={`de ${C.atendidas2013} para ${C.atendidas2025}, em ${ANOS_ENTRE_FOTOS} anos`}
        />
      </section>

      {/* ═══ DECLARAÇÃO ═══ */}
      <section
        aria-labelledby="declaracao-defensoria"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-defensoria" className="font-display text-base font-semibold text-text">
          De quem é este documento, e o que esta página não faz
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">O denominador é o produto desta página.</strong> A DPMG
            publica onde ela está, nunca onde não está. As {C.comarcas} comarcas vêm da divisão
            judiciária do estado, não da própria Defensoria — é essa contagem que transforma
            &ldquo;{C.comUnidadeFisicaHoje} unidades&rdquo; de número que parece bom em déficit de{" "}
            {C.naoAtendidas2025} comarcas.
          </li>
          <li>
            <strong className="text-text">As fontes divergem, e as duas ficam.</strong> A DPMG
            lista {C.comUnidadeFisicaHoje + 1} unidades físicas hoje ({C.comUnidadeFisicaHoje}{" "}
            comarcas mineiras mais a sede em Brasília); a Pesquisa Nacional da Defensoria 2025
            marca {C.atendidas2025} comarcas como atendidas. São recortes diferentes — unidade
            física instalada contra comarca declarada atendida — e não o mesmo número visto de dois
            jeitos. Escolher um e calar esconderia a diferença.
          </li>
          <li>
            <strong className="text-text">2013 não é o mesmo mapa de comarcas que 2025.</strong> O
            IPEA contava {C.comarcas2013} comarcas em 2013; hoje são {C.comarcas}.{" "}
            {SEM_REGISTRO_2013} comarcas do mapa atual não têm registro na lista de 2013 —
            provavelmente criadas depois —, e por isso a comparação abaixo usa a contagem de
            comarcas atendidas, não uma taxa sobre denominadores que mudaram.
          </li>
          <li>
            <strong className="text-text">A população até 3 salários mínimos</strong> é o público
            que a Defensoria existe para atender — está na tabela ao lado da população total, e é
            ela, não a população total, que mede o tamanho da demanda numa comarca.
          </li>
          <li>
            Fontes: Pesquisa Nacional da Defensoria 2025 (cobertura atual e a própria DPMG), IPEA
            2013 (comparação histórica). Dado extraído em {C.extraidoEm}.
          </li>
        </ul>
      </section>

      {/* ═══ GRÁFICO: distribuição ═══ */}
      <section aria-labelledby="distribuicao-defensoria" className="mt-12">
        <h2 id="distribuicao-defensoria" className="font-display text-xl font-bold text-text">
          As {C.comarcas} comarcas, por situação
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          Cada barra é fatia do total de comarcas do estado — não das comarcas atendidas, para que
          o tamanho do déficit apareça na própria régua.
        </p>

        <ul className="mt-5 space-y-2">
          {DISTRIBUICAO_2025.map((d) => (
            <li key={d.rotulo} className="flex items-center gap-3 text-[.92em]">
              <span className="w-48 shrink-0 text-text-soft">{d.rotulo}</span>
              <span
                className={`h-4 rounded-sm ${d.cor}`}
                style={{ width: `${Math.max(2, (d.valor / C.comarcas) * 100)}%`, maxWidth: "70%" }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{d.valor}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ O RITMO ═══ */}
      <section aria-labelledby="ritmo-defensoria" className="mt-12">
        <h2 id="ritmo-defensoria" className="font-display text-xl font-bold text-text">
          No ritmo medido desde 2013, cobrir o resto levaria mais de um século
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Entre a foto do IPEA em 2013 e a Pesquisa Nacional de 2025, o número de comarcas
          mineiras atendidas foi de <strong className="text-text">{C.atendidas2013}</strong> para{" "}
          <strong className="text-text">{C.atendidas2025}</strong> — um ganho de{" "}
          <strong className="text-text">{GANHO_COMARCAS} comarcas em {ANOS_ENTRE_FOTOS} anos</strong>
          , pouco mais de uma comarca por ano.
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-5 text-[.92em] leading-relaxed text-text-soft">
          <p>
            Nesse ritmo, cobrir as <strong className="text-text">{C.naoAtendidas2025} comarcas</strong>{" "}
            que ainda não têm Defensoria levaria cerca de{" "}
            <strong className="text-text">{formatNumberBR(ANOS_PARA_COBRIR_RESTO)} anos</strong> —
            mais de um século.{" "}
            <strong className="text-text">Ritmo passado não é previsão:</strong> a Defensoria pode
            acelerar ou desacelerar a partir de agora, e nada nesta conta prevê qual dos dois vai
            acontecer. O que ela mostra é o tamanho da tarefa contra a velocidade com que ela
            avançou até aqui.
          </p>
        </div>
      </section>

      {/* ═══ A TABELA COMPLETA (cliente) ═══ */}
      <TabelaComarcas />

      <p className="mt-10 text-[.85em] leading-relaxed text-text-soft">
        Os dados são da <strong className="text-text">Defensoria Pública de Minas Gerais</strong>{" "}
        (unidades hoje), da <strong className="text-text">Pesquisa Nacional da Defensoria 2025</strong>{" "}
        (cobertura por comarca) e do <strong className="text-text">IPEA</strong> (mapa de 2013).
        Extraído em {C.extraidoEm}. Nenhum número desta página foi arredondado para parecer melhor
        ou pior do que o dado publicado.
      </p>
    </div>
  );
}
