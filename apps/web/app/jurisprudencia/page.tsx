import type { Metadata } from "next";
import Link from "next/link";
import dados from "@/data/jurisprudencia-resumo.json";

/**
 * @file Página /jurisprudencia — o retrato dos acórdãos do Brumadinho.
 *
 * O QUE É: lê `data/jurisprudencia-resumo.json`, gerado no repo
 * `tjmg-jurimetria` a partir do relatório Guaicuy + NACAB (2.970 processos
 * únicos). Mostra cobertura, polo, resultado, temas, danos PNAB/PEAB e
 * valores — sempre com N, método e data.
 *
 * REGRAS DE QUALIDADE (AGENTS): cada número tem N e fonte; nada é somado de
 * cabeça (o JSON é a saída do script); a página diz o que não foi medido; a
 * fonte é a mesma do relatório; nenhum dado pessoal. O leitor não vê resumo
 * por caso aqui — a lista completa fica no relatório, com link oficial.
 *
 * POR QUE SERVER COMPONENT: a tabela é estática e o acervo tem 2.970 linhas;
 * mandar isso como props de cliente violaria a regra 5.1 (coleção grande em
 * componente de cliente). Aqui só entram agregados.
 */

export const metadata: Metadata = {
  title: "Jurisprudência — Controle Popular",
  description:
    "2.970 acórdãos do TJMG sobre o rompimento da barragem de Brumadinho: polo vencedor, resultado, temas, danos PNAB/PEAB e valores, com método e fonte.",
};

interface Resumo {
  geradoEm: string;
  fonte: string;
  coleta: string;
  publicacao: string;
  auditoria: Record<string, number>;
  polo: Record<string, number>;
  resultado: Record<string, number>;
  recorrente: Record<string, number>;
  temas: Record<string, number>;
  danos_pnab: Record<string, number>;
  processos_sem_dano: number;
  valores: Record<string, number | null>;
  status_resumos: Record<string, number>;
  amostragem: Record<string, string | number>;
}

const resumo = dados as Resumo;

const ROTULOS: Record<string, string> = {
  empresa: "Empresa",
  atingido: "Atingido",
  parcial: "Parcial",
  indeterminado: "Indeterminado",
  negado: "Negado",
  provido: "Provido",
  ambos: "Ambos",
  "nao consta": "Não consta",
};

const NOMES_PNAB: Record<string, string> = {
  perda_propriedade: "Perda de propriedade",
  desvalorizacao_imoveis: "Desvalorização de imóveis",
  perda_capacidade_produtiva: "Perda de capacidade produtiva",
  perda_areas_pesca: "Perda de áreas de pesca",
  agua_abastecimento: "Água e abastecimento",
  perda_renda_trabalho: "Perda de renda/trabalho",
  mudanca_habitos_psicossociais: "Mudança de hábitos psicossociais",
  comunidades_tradicionais: "Comunidades tradicionais",
  acesso_areas_urbanas_rurais: "Acesso a áreas urbanas/rurais",
  deslocamento_compulsorio: "Deslocamento compulsório",
  atividades_produtivas_locais: "Atividades produtivas locais",
  outros_pnab_peab: "Outros PNAB/PEAB",
};

const reais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Tabela({
  titulo,
  dados: linhas,
  total,
}: {
  titulo: string;
  dados: Record<string, number>;
  total: number;
}) {
  const itens = Object.entries(linhas).sort((a, b) => b[1] - a[1]);
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--cp-surface-2)] text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Categoria</th>
              <th className="px-3 py-2 text-right font-semibold">N</th>
              <th className="px-3 py-2 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(([chave, valor]) => (
              <tr key={chave} className="border-t border-[var(--cp-border)]">
                <td className="px-3 py-2">{ROTULOS[chave] ?? NOMES_PNAB[chave] ?? chave}</td>
                <td className="px-3 py-2 text-right font-tabular">{valor}</td>
                <td className="px-3 py-2 text-right font-tabular opacity-70">
                  {total ? `${((100 * valor) / total).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Jurisprudencia() {
  const total = resumo.auditoria.processos_unicos;
  const valores = resumo.valores;
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Jurisprudência do Brumadinho</h1>
        <p className="max-w-3xl text-sm opacity-80">
          {total.toLocaleString("pt-BR")} acórdãos do TJMG sobre o rompimento da barragem
          da Mina Córrego do Feijão, julgados entre 2019 e 2024. O retrato segue a
          metodologia NACAB/ADAI e o Dossiê Paraopeba (Instituto Guaicuy): polo definido
          por <strong>quem recorreu × resultado do recurso</strong>, danos nas 12
          categorias PNAB/PEAB e valor quando o texto informa.
        </p>
        <p className="text-xs opacity-70">
          Coleta: {resumo.coleta} · Publicação: {resumo.publicacao} · Fonte:{" "}
          {resumo.fonte}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">Processos únicos</p>
          <p className="font-display text-2xl font-bold">{total.toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">Com inteiro teor</p>
          <p className="font-display text-2xl font-bold">
            {resumo.auditoria.com_inteiro_teor.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">Resumos aprovados</p>
          <p className="font-display text-2xl font-bold">
            {(resumo.status_resumos.aprovado ?? 0).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="text-xs uppercase tracking-wide opacity-60">Amostra AAS (5%, 95%)</p>
          <p className="font-display text-2xl font-bold">{resumo.amostragem.amostra}</p>
        </div>
      </section>

      <Tabela titulo="Polo vencedor" dados={resumo.polo} total={total} />
      <Tabela titulo="Resultado do recurso" dados={resumo.resultado} total={total} />
      <Tabela titulo="Quem recorreu" dados={resumo.recorrente} total={total} />
      <Tabela titulo="Temas (um processo pode ter vários)" dados={resumo.temas} total={total} />
      <Tabela titulo="Danos PNAB/PEAB reconhecidos" dados={resumo.danos_pnab} total={total} />

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Valores</h2>
        <p className="text-sm opacity-80">
          {Number(valores.n ?? 0).toLocaleString("pt-BR")} processos com valor numérico.
          Mediana {reais(Number(valores.mediana ?? 0))}; Q1{" "}
          {reais(Number(valores.q1 ?? 0))}; Q3 {reais(Number(valores.q3 ?? 0))}.
        </p>
        <p className="text-xs opacity-70">
          O campo é o maior valor em R$ mencionado no texto — pode ser pedido, condenação
          ou valor de ação coletiva. A média não é publicada: um outlier de R$ 200 bilhões
          a distorce.
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-[var(--cp-border)] p-4 text-sm">
        <h2 className="font-display text-lg font-semibold">Como ler e o que não afirmar</h2>
        <ul className="list-disc space-y-1 pl-5 opacity-80">
          <li>
            O polo é recalculado pela regra NACAB; {resumo.status_resumos.revisao_humana}{" "}
            resumos ainda estão em revisão humana.
          </li>
          <li>
            {resumo.processos_sem_dano.toLocaleString("pt-BR")} processos não têm nenhuma
            categoria PNAB/PEAB reconhecida na ementa.
          </li>
          <li>
            O recorte é a 2ª instância do TJMG; não é o universo de 1ª instância do
            Guaicuy nem a amostra da 18ª Câmara do NACAB.
          </li>
          <li>Não há dado pessoal nesta página: só processo, tema, número e fonte.</li>
        </ul>
      </section>

      <footer className="space-y-2 text-sm opacity-80">
        <p>
          Relatório completo (método, tabelas e crítica):{" "}
          <a
            className="underline"
            href="https://github.com/FinweeJur/tjmg-jurimetria/blob/master/relatorios/RELATORIO-GUAICUY-NACAB.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            RELATORIO-GUAICUY-NACAB.md
          </a>
          .
        </p>
        <p>
          O assistente do portal consulta este acervo pelo RAG. Para a lista caso a caso,
          use a{" "}
          <Link className="underline" href="/busca">
            busca
          </Link>{" "}
          ou o relatório.
        </p>
      </footer>
    </div>
  );
}
