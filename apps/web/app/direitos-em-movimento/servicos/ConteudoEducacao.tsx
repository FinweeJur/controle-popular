import Link from "next/link";
import ExplicaSigla from "@/app/components/ExplicaSigla";
import CruzamentosEducativos from "@/app/components/eixos/CruzamentosEducativos";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import BarraAnimada from "@/app/components/dados/BarraAnimada";
import { calcularCruzamentosMunicipais } from "@/lib/cruzamentos/correlacionador";

/**
 * @file Recorte de educação do painel `/direitos-em-movimento/servicos`.
 *
 * O QUE É: os quatro cartões de referência e a série do IDEB. Veio de
 * `direitos-em-movimento/educacao`, que virou faceta.
 *
 * DE ONDE VÊM OS NÚMEROS: INEP/MEC. São valores de referência nacional
 * fixados no código, não medição do portal — o aviso do painel
 * (`AvisoReferencia`) diz isso antes do primeiro cartão. A série termina em
 * 2023; quando o INEP publicar o ciclo seguinte, atualize a série inteira e a
 * nota metodológica, não só a última barra.
 */

const REFERENCIA = "Referência nacional · série do INEP, ciclo 2023";

interface IndicadorFormatavel {
  rotulo: string;
  valorNumerico: number;
  casas?: number;
  prefixo?: string;
  sufixo?: string;
  obs: string;
}

const INDICADORES: IndicadorFormatavel[] = [
  {
    rotulo: "Escolas de educação básica",
    valorNumerico: 178416,
    obs: "Censo Escolar (INEP)",
  },
  {
    rotulo: "Matrículas totais",
    valorNumerico: 47.3,
    casas: 1,
    sufixo: " mi",
    obs: "Redes municipal, estadual e federal",
  },
  {
    rotulo: "IDEB médio anos iniciais",
    valorNumerico: 5.8,
    casas: 1,
    obs: "Meta nacional estipulada: 6,0",
  },
  {
    rotulo: "Escolas com internet banda larga",
    valorNumerico: 88.2,
    casas: 1,
    sufixo: "%",
    obs: "Conectividade pedagógica",
  },
];

const SERIE_IDEB = [
  { ano: "2015", nota: 5.3, altura: "66%" },
  { ano: "2017", nota: 5.5, altura: "72%" },
  { ano: "2019", nota: 5.7, altura: "78%" },
  { ano: "2021", nota: 5.5, altura: "72%" },
  { ano: "2023", nota: 5.8, altura: "82%" },
];

export default function ConteudoEducacao() {
  const cruzamento = calcularCruzamentosMunicipais({
    codIbge7: "3106200",
    nome: "Belo Horizonte",
    uf: "MG",
    populacao: 2315000,
    idebAnosIniciais: 6.1,
    idebMeta: 5.8,
    repassesFederaisAnual: 1200000000,
  });

  return (
    <>
      {/* Ponte Canônica para o Hub Unificado de Educação */}
      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-foreground">💡 Hub Unificado de Educação:</span>{" "}
          <span className="text-muted">
            Acesse o painel completo estilo PowerBI com cruzamentos municipais por cidade, simulador analítico,
            universidades e periódicos abertos.
          </span>
        </div>
        <Link
          href="/educacao?topico=basica"
          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all whitespace-nowrap text-center"
        >
          Abrir Hub de Educação →
        </Link>
      </div>

      <section aria-label="Indicadores da educação básica" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {INDICADORES.map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              {item.rotulo}
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              <ContadorAnimado valor={item.valorNumerico} casas={item.casas} prefixo={item.prefixo} sufixo={item.sufixo} />
            </span>
            <span className="text-xs text-muted block mt-1">{item.obs}</span>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted">{REFERENCIA}</p>
      <ExplicaSigla
        sigla="IDEB"
        extenso="Índice de Desenvolvimento da Educação Básica"
        explicacao="é a nota de aprendizado da escola: junta o desempenho na prova com a taxa de aprovação."
        dica="IDEB é a nota que combina aprendizado na prova e aprovação dos alunos; 6,0 é a meta nacional para os anos iniciais."
      />
      <section
        aria-labelledby="titulo-grafico-ideb"
        className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-ideb" className="font-display text-lg font-bold text-foreground">
              Média nacional do IDEB (anos iniciais do ensino fundamental)
            </h2>
            <p className="text-xs text-muted">
              Histórico de notas oficiais medidas pelo INEP / Ministério da Educação
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            INEP / MEC
          </span>
        </div>

        <div className="my-6">
          <div className="grid grid-cols-5 gap-3 sm:gap-6 items-end h-44 border-b border-border pb-2">
            {SERIE_IDEB.map((ponto) => (
              <div key={ponto.ano} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-bold text-foreground">{ponto.nota}</span>
                <BarraAnimada
                  orientacao="vertical"
                  style={{ height: ponto.altura }}
                  cor="var(--cp-eixo-direitos, #c0392b)"
                  className="w-full max-w-[48px] rounded-t-lg transition-all duration-300 hover:opacity-85"
                />
                <span className="text-xs font-medium text-muted">{ponto.ano}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto mt-4 text-xs text-muted">
          <p>
            * O ciclo 2021 reflete o fechamento das escolas na pandemia de COVID-19; o ciclo 2023
            retoma a trajetória de evolução gradual. O IDEB é bienal e combina fluxo escolar com
            aprendizado — média nacional não descreve uma escola.
          </p>
        </div>
      </section>

      <CruzamentosEducativos
        cruzamentos={cruzamento}
        nomeMunicipio="Referência educacional: municípios polo"
      />
    </>
  );
}
