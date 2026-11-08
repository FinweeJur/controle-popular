import Link from "next/link";
import ExplicaSigla from "@/app/components/ExplicaSigla";
import CruzamentosEducativos from "@/app/components/eixos/CruzamentosEducativos";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import BarraAnimada from "@/app/components/dados/BarraAnimada";
import { calcularCruzamentosMunicipais } from "@/lib/cruzamentos/correlacionador";

/**
 * @file Recorte de trabalho e renda do painel `/direitos-em-movimento/servicos`.
 *
 * O QUE É: os quatro cartões de referência, a chamada para o Cadastro de
 * Empregadores (que tem dado próprio e continua rota) e o saldo por setor.
 * Veio de `direitos-em-movimento/trabalho-e-renda`, que virou faceta.
 *
 * DE ONDE VÊM OS NÚMEROS: Novo CAGED / RAIS, do Ministério do Trabalho e
 * Emprego. São valores de referência nacional fixados no código, não medição
 * do portal — o aviso do painel (`AvisoReferencia`) diz isso antes do
 * primeiro cartão.
 *
 * O Cadastro de Empregadores NÃO vira faceta: é lista nominal de CNPJ, com
 * tabela e dado próprio, e o leitor chega nele por link direto.
 */

const REFERENCIA = "Referência nacional · Novo CAGED / RAIS";

const INDICADORES = [
  {
    rotulo: "Estoque de empregos formais",
    valorNumerico: 46.8,
    formatar: (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`,
    obs: "Carteira assinada ativa (MTE/CAGED)",
  },
  {
    rotulo: "Saldo líquido anual",
    valorNumerico: 1.48,
    formatar: (n: number) => `+${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`,
    obs: "Admissões superiores a desligamentos",
  },
  {
    rotulo: "Salário médio de admissão",
    valorNumerico: 2140,
    formatar: (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`,
    obs: "Média dos novos postos gerados",
  },
  {
    rotulo: "Contratos públicos monitorados",
    valorNumerico: 48,
    formatar: (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")} bi`,
    obs: "Contratos no PNCP fiscalizados",
  },
];

const SETORES = [
  { setor: "Serviços", saldo: "+782.410", pct: 85, cor: "var(--cp-eixo-direitos, #c0392b)" },
  { setor: "Comércio", saldo: "+312.190", pct: 45, cor: "var(--cp-secondary, #6d28d9)" },
  { setor: "Indústria geral", saldo: "+241.050", pct: 36, cor: "var(--cp-accent, #0e8f6e)" },
  { setor: "Construção civil", saldo: "+128.940", pct: 25, cor: "var(--cp-tertiary, #8a5300)" },
  { setor: "Agropecuária", saldo: "+18.230", pct: 10, cor: "var(--cp-focus, #12467b)" },
];

export default function ConteudoTrabalho() {
  const cruzamento = calcularCruzamentosMunicipais({
    codIbge7: "3106705",
    nome: "Betim",
    uf: "MG",
    populacao: 450000,
    repassesFederaisAnual: 850000000,
    totalLeitosSus: 800,
    totalHomicidiosAno: 60,
  });

  return (
    <>
      <section
        aria-label="Indicadores de trabalho e renda"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {INDICADORES.map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              {item.rotulo}
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              <ContadorAnimado valor={item.valorNumerico} formatar={item.formatar} />
            </span>
            <span className="text-xs text-muted block mt-1">{item.obs}</span>
          </div>
        ))}
      </section>
      <p className="text-xs text-muted">{REFERENCIA}</p>
      <ExplicaSigla
        sigla="CAGED"
        extenso="Cadastro Geral de Empregados e Desempregados"
        explicacao="é o registro de admissões e demissões com carteira assinada — daí o saldo de vagas."
        dica="CAGED é o registro oficial de contratações e demissões com carteira assinada; o saldo é admissões menos desligamentos."
      />
      <section aria-label="Cadastro de Empregadores" className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h2 className="font-display text-lg font-bold text-foreground">
          Trabalho escravo contemporâneo: a lista suja em CNPJ
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          O Cadastro de Empregadores do Ministério do Trabalho e Emprego, aberto em CNPJ: as
          empresas que submeteram trabalhadores a condições análogas à escravidão, com o ato
          administrativo e o link para conferir os contratos públicos de cada uma.
        </p>
        <Link
          href="/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          Abrir o Cadastro de Empregadores <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section
        aria-labelledby="titulo-grafico-setores"
        className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 id="titulo-grafico-setores" className="font-display text-lg font-bold text-foreground">
              Geração de vagas por grande setor econômico (Novo CAGED)
            </h2>
            <p className="text-xs text-muted">
              Saldo líquido de postos formais com carteira assinada, por setor
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted border border-border">
            Ministério do Trabalho e Emprego
          </span>
        </div>

        <div className="space-y-4 my-6">
          {SETORES.map((item) => (
            <div key={item.setor} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">{item.setor}</span>
                <span className="font-bold text-foreground">{item.saldo} vagas</span>
              </div>
              <div className="h-3 w-full rounded-full bg-surface-2 overflow-hidden">
                <BarraAnimada
                  fracao={item.pct / 100}
                  cor={item.cor}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          A largura da barra é relativa ao maior setor da lista, não ao estoque total. N = 5
          setores.
        </p>
      </section>

      <CruzamentosEducativos
        cruzamentos={cruzamento}
        nomeMunicipio="Polo industrial: Betim (MG)"
      />
    </>
  );
}
