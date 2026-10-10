import type { ReactElement } from "react";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import Moeda from "@/app/components/Moeda";
import TabelaOrdenavel from "./TabelaOrdenavel";
import { GraficoMensalBigTech } from "./GraficosGastos";
import { Cartao, serieMensal, totaisPorGrupo } from "./comum";
import {
  COLUNAS_CANDIDATO_BIGTECH,
  COLUNAS_EMPRESA_BIGTECH,
  COLUNAS_MENCAO,
  COLUNAS_META_PLATAFORMA,
  COLUNAS_PARTIDO_BIGTECH,
} from "./tabelas";
import { bigtech, dataColeta, meta } from "./dados";
import { formatCurrencyCompactaBR } from "@/lib/betim/format";
import { formatarNumeroBR } from "@/lib/utilitarios/calculos";

/**
 * Seção "Big tech" da página de gastos de campanha: resumo editorial,
 * cartões por grupo, série mensal e as quatro tabelas do cruzamento
 * (empresas, candidatos, partidos e menção textual).
 *
 * Motivo da separação do `page.tsx`: era o bloco mais longo da página e o
 * único com ressalva editorial própria (AGENTS.md § 7 — cruzamento de dois
 * dados verdadeiros não é achado; o leitor precisa ler isso ao lado do
 * número, não num rodapé).
 *
 * As tabelas usam `TabelaOrdenavel`: todo cabeçalho ordena e a de empresas
 * tem filtro por grupo ("tipo" de big tech), pedido do dono em 10/10/2026.
 */
export default function SecaoBigTech(): ReactElement {
  const grupos = totaisPorGrupo(bigtech.empresas);
  const mensal = serieMensal(bigtech.empresas);
  const impulsionamento = bigtech.empresas.reduce(
    (soma, e) =>
      soma + (e.naturezas.find((n) => n.despesa === "Despesa com Impulsionamento de Conteúdos")?.total ?? 0),
    0
  );
  const pctImpulsionamento = bigtech.total > 0 ? (impulsionamento / bigtech.total) * 100 : 0;
  const mencao = Object.entries(meta.mencaoPlataformas)
    .map(([rede, v]) => ({ rede, linhas: v.linhas, total: v.total }))
    .sort((a, b) => b.total - a.total);

  return (
    <section aria-labelledby="bigtech" className="space-y-4">
      <h2 id="bigtech" className="font-display text-2xl font-bold">
        Big tech: o que Meta, Google, TikTok, X e Kwai receberam
      </h2>
      <ResumoExpandivel
        className="max-w-3xl opacity-80"
        texto={`As campanhas de 2026 declararam ${formatCurrencyCompactaBR(bigtech.total)} pagos a plataformas digitais, medidos em ${dataColeta}. ${pctImpulsionamento.toFixed(1).replace(".", ",")}% disso é a natureza "Despesa com Impulsionamento de Conteúdos" — o anúncio pago dentro da rede. O cruzamento achou ${formatarNumeroBR(bigtech.match.cnpj, 0)} despesas pelo CNPJ oficial e ${formatarNumeroBR(bigtech.match.nome, 0)} pelo nome da empresa. Entrar nesta lista não é acusação: é o que a campanha declarou ao TSE. O cruzamento é o começo de uma pergunta, não o fim de uma investigação.`}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {grupos.map((g) => (
          <Cartao
            key={g.rotulo}
            titulo={g.rotulo}
            valor={<Moeda value={g.total} />}
            detalhe={`soma das filiais declaradas · coleta ${dataColeta}`}
          />
        ))}
      </div>
      {bigtech.metaPlataformas.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold">Meta por plataforma</h3>
          <TabelaOrdenavel
            colunas={COLUNAS_META_PLATAFORMA}
            linhas={bigtech.metaPlataformas}
            campoChave="plataforma"
            legenda="Classificado pela palavra na descrição da despesa — heurística do portal, o TSE não informa a plataforma. Linha da Meta sem nome de rede na descrição vira “sem plataforma declarada”"
          />
        </div>
      )}
      <GraficoMensalBigTech serie={mensal} />
      <TabelaOrdenavel
        colunas={COLUNAS_EMPRESA_BIGTECH}
        linhas={bigtech.empresas}
        campoChave="empresa"
        legenda="Empresas de big tech contratadas pelas campanhas — ordene por qualquer coluna e filtre por grupo (o tipo de big tech). CNPJ como vem na fonte"
        nomeArquivo="gastos-2026-bigtech-empresas"
      />
      <TabelaOrdenavel
        colunas={COLUNAS_CANDIDATO_BIGTECH}
        linhas={bigtech.topCandidatos}
        campoChave="urna"
        legenda="Os 30 candidatos que mais contrataram com big tech — ordene por qualquer coluna e filtre por cargo ou partido"
        nomeArquivo="gastos-2026-bigtech-candidatos"
      />
      <TabelaOrdenavel
        colunas={COLUNAS_PARTIDO_BIGTECH}
        linhas={bigtech.partidos}
        campoChave="partido"
        legenda="Gasto em big tech por partido — soma dos candidatos de cada partido"
      />
      <TabelaOrdenavel
        colunas={COLUNAS_MENCAO}
        linhas={mencao}
        campoChave="rede"
        legenda="Menção textual do nome da rede no texto da despesa — pista, não pagamento direto: o valor pode ser a uma agência que citou a rede"
      />
      <p className="text-xs opacity-70">
        Não aparecem entre os fornecedores: {bigtech.naoLocalizadas.join(", ")} (medido em{" "}
        {dataColeta}). A verificação cruzada do gasto declarado contra os anúncios que a
        própria Meta exibe está na seção seguinte (Biblioteca de Anúncios da Meta).
      </p>
    </section>
  );
}
