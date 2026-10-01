import type { Metadata } from "next";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import {
  obterCatalogoJequitinhonha,
  obterEstatisticasJequitinhonha,
} from "@/lib/cidades/vales-jequitinhonha";
import { obterCatalogoMucuri, obterEstatisticasMucuri } from "@/lib/cidades/vales-mucuri";
import TabelaMunicipiosVales, { type LinhaVale } from "./TabelaMunicipiosVales";

/**
 * `/terra-e-territorios/vales` — catálogo territorial dos Vales do Jequitinhonha
 * e do Mucuri (MG), 82 municípios.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * O nordeste mineiro concentra três pressões ao mesmo tempo: a corrida do lítio
 * ("Lithium Valley Brazil", no Médio Jequitinhonha), a presença de povos e
 * comunidades tradicionais (Geraizeiros, Apanhadores de Flores Sempre-Vivas,
 * Quilombolas, Maxakali) e a fragilidade hídrica do semiárido. A pergunta cívica
 * é "quem é quem no território antes de decidir sobre ele?". Esta página publica
 * o catálogo medido — 55 municípios do Jequitinhonha e 27 do Mucuri — com os
 * links oficiais de conferência em cada linha.
 *
 * ═══ FONTES ═══
 *
 * - IBGE Localidades: códigos de 7 e 6 dígitos, nomes canônicos e bacias
 *   (`municipios-mg.json`, código IBGE é fonte única — nunca casar município
 *   por nome, AGENTS § 6);
 * - PNCP (Lei 14.133/2021): link paramétrico de contratações por município;
 * - ANM/CPRM-SGB: presença de lítio na Faixa Pegmatítica do Médio Jequitinhonha;
 * - FUNAI e INCRA/FCP: povos indígenas (Maxakali) e comunidades tradicionais.
 *
 * ═══ O QUE A PÁGINA NÃO DIZ (régua editorial, AGENTS § 7) ═══
 *
 * - "Lítio mapeado" significa títulos, pesquisas ou reservas catalogadas — NÃO
 *   é lavra ativa, não é receita garantida e não é aprovação de licença;
 * - Comunidade tradicional mapeada no catálogo NÃO é certificação oficial
 *   (a certificação é da autoridade: FUNAI, INCRA, Fundação Cultural Palmares);
 * - O link do PNCP é consulta paramétrica pelo nome do município: o resultado
 *   depende de cada órgão publicar — lacuna no PNCP é lacuna da fonte, não do
 *   município.
 *
 * Os dados vêm dos JSON versionados lidos pelas libs testadas
 * (`lib/cidades/vales-jequitinhonha.ts` e `lib/cidades/vales-mucuri.ts`),
 * atualizados em 25/09/2026. Todos os totais dos cartões são medidos do dado,
 * nunca digitados à mão.
 */

const jeq = obterCatalogoJequitinhonha();
const muc = obterCatalogoMucuri();
const statsJeq = obterEstatisticasJequitinhonha();
const statsMuc = obterEstatisticasMucuri();

/** Linha unificada: cada catálogo tem campos próprios; a tabela precisa de um formato só. */
const LINHAS: LinhaVale[] = [
  ...jeq.municipios.map((m): LinhaVale => ({
    vale: "Jequitinhonha",
    nome: m.nome,
    id_ibge7: m.id_ibge7,
    subregiao: m.sub_regiao,
    polo_regional: m.polo_regional,
    bacia: m.bacia_principal,
    tem_litio: m.tem_litio,
    comunidades: m.tem_comunidades_tradicionais && m.tipo_comunidade.length
      ? m.tipo_comunidade.join(", ")
      : null,
    povo_indigena: null,
    link_pncp: m.link_pncp,
    link_transparencia: m.link_transparencia,
  })),
  ...muc.municipios.map((m): LinhaVale => ({
    vale: "Mucuri",
    nome: m.nome,
    id_ibge7: m.id_ibge7,
    subregiao: null,
    polo_regional: m.polo_regional,
    bacia: m.bacia_principal,
    tem_litio: false,
    comunidades: null,
    povo_indigena: m.tem_terras_indigenas && m.povo_indigena ? m.povo_indigena : null,
    link_pncp: m.link_pncp,
    link_transparencia: m.link_transparencia,
  })),
];

/** Totais medidos do dado — nunca digitados à mão (AGENTS § 8.4). */
const TOTAIS = {
  municipios: statsJeq.totalCidades + statsMuc.totalCidades,
  litio: statsJeq.totalLitio,
  tradicionais: statsJeq.totalTradicionais,
  indigenas: statsMuc.totalIndigenas,
  populacao: statsJeq.populacaoTotal,
  atualizadoEm: jeq.atualizado_em >= muc.atualizado_em ? jeq.atualizado_em : muc.atualizado_em,
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

export const metadata: Metadata = {
  title: "Vales do Jequitinhonha e do Mucuri — 82 municípios | Controle Popular",
  description:
    `${fmt(TOTAIS.municipios)} municípios dos Vales do Jequitinhonha e do Mucuri (MG): ` +
    `${TOTAIS.litio} com lítio mapeado, ${fmt(TOTAIS.tradicionais)} com comunidades tradicionais e ` +
    `${TOTAIS.indigenas} com terra Maxakali — com link oficial de conferência em cada linha.`,
};

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-text-soft">{rotulo}</p>
      {nota ? <p className="mt-2 text-xs text-text-soft">{nota}</p> : null}
    </div>
  );
}

export default function PaginaVales() {
  const hoje = TOTAIS.atualizadoEm.split("-").reverse().join("/");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Terra e Territórios · Vales do Jequitinhonha e do Mucuri · dados de {hoje}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Vales do Jequitinhonha e do Mucuri: quem é quem no território
        </h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `Este catálogo reúne os ${fmt(TOTAIS.municipios)} municípios dos Vales do Jequitinhonha (55) ` +
            `e do Mucuri (27), no nordeste de Minas Gerais. É o território onde a corrida do lítio encontra ` +
            `Geraizeiros, Apanhadores de Flores Sempre-Vivas, Quilombolas e o povo Maxakali — em bacias que ` +
            `já vivem com escassez de água. A página não decide o que é legítimo: publica quem é quem, com ` +
            `fonte oficial e a porta de conferência em cada linha.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Cartao
          valor={fmt(TOTAIS.municipios)}
          rotulo="municípios catalogados"
          nota="55 no Jequitinhonha + 27 no Mucuri (IBGE)"
        />
        <Cartao
          valor={fmt(TOTAIS.litio)}
          rotulo="com lítio mapeado"
          nota="títulos, pesquisas ou reservas — não é lavra ativa nem receita garantida"
        />
        <Cartao
          valor={fmt(TOTAIS.tradicionais)}
          rotulo="com comunidades tradicionais"
          nota="Geraizeiros, Vazanteiros, Quilombolas, Apanhadores de Flores — mapeamento do catálogo, não certificação"
        />
        <Cartao
          valor={fmt(TOTAIS.indigenas)}
          rotulo="com terra indígena"
          nota="povo Maxakali (FUNAI) — Ladainha e Santa Helena de Minas"
        />
        <Cartao
          valor={fmt(TOTAIS.populacao)}
          rotulo="habitantes no Jequitinhonha"
          nota="população estimada somada dos 55 municípios"
        />
        <Cartao
          valor="3 / 2"
          rotulo="sub-regiões / polos regionais"
          nota="Alto, Médio e Baixo Jequitinhonha · Teófilo Otoni e Nanuque"
        />
      </section>

      <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
        <strong>O lítio é promessa até a licença sair.</strong> Ter títulos ou reservas mapeadas não
        significa mina aberta, emprego garantido ou CFEM a receber. E o link do PNCP é busca
        paramétrica: se um município não aparece, pode ser o órgão que não publicou — lacuna da
        fonte, não do município.
      </p>

      <section aria-label="Tabela dos municípios" className="mt-6">
        <TabelaMunicipiosVales linhas={LINHAS} />
      </section>

      <section
        aria-label="Fonte e método"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed"
      >
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Códigos e nomes</dt>
            <dd>IBGE Localidades — código IBGE de 7 dígitos é a chave única; município nunca é casado por nome (grafia diverge entre tabelas oficiais).</dd>
          </div>
          <div>
            <dt className="font-semibold">Lítio</dt>
            <dd>ANM / CPRM-SGB — Faixa Pegmatítica do Médio Jequitinhonha (Araçuaí, Itinga e entorno).</dd>
          </div>
          <div>
            <dt className="font-semibold">Comunidades tradicionais</dt>
            <dd>Mapeamento territorial do catálogo (SEDESE/UFVJM) — a certificação oficial é de INCRA e Fundação Cultural Palmares.</dd>
          </div>
          <div>
            <dt className="font-semibold">Povos indígenas</dt>
            <dd>FUNAI — terras do povo Maxakali no Vale do Mucuri.</dd>
          </div>
          <div>
            <dt className="font-semibold">Contratações públicas</dt>
            <dd>PNCP / Lei 14.133/2021 — link paramétrico por município em cada linha da tabela.</dd>
          </div>
          <div>
            <dt className="font-semibold">Bacias hidrográficas</dt>
            <dd>IGAM / CBH Jequitinhonha — Alto, Médio e Baixo Jequitinhonha; Bacia do Rio Mucuri.</dd>
          </div>
        </dl>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Ressalva:</strong> o catálogo descreve o território; não avalia empreendimento,
          não certifica comunidade e não substitui a consulta à fonte oficial. A data de cada linha
          é a mesma do catálogo ({hoje}).
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          A tabela é vetorial e sai nítida na impressão; o botão de planilha baixa exatamente o que
          está filtrado na tela, com separador <code>;</code> e BOM UTF-8 para o Excel brasileiro.
        </p>
      </section>
    </main>
  );
}
