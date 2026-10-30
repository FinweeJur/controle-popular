
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Card de indicador individual para o comparador.
 */
interface IndicadorCardProps {
  title: string;
  icon: React.ReactNode;
  indicators: string[];
}

function IndicadorCard({ title, icon, indicators }: IndicadorCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-text">{title}</h3>
      </div>
      <ul className="space-y-1 text-xs text-text-700">
        {indicators.map((indicator) => (
          <li key={indicator} className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            {indicator}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Seletor de estados para comparação.
 */
function SeletorEstados() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Selecionar Estados</h2>
      <p className="mb-4 text-sm text-text-700">
        Escolha até 5 estados para comparar os indicadores
      </p>
      <div className="space-y-2">
        {["MG", "SP", "RJ", "BA", "PE"].map((uf) => (
          <label key={uf} className="flex items-center space-x-2">
            <input type="checkbox" className="rounded border-border" />
            <span className="text-sm">{uf}</span>
          </label>
        ))}
      </div>
      <button className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
        Comparar Indicadores
      </button>
    </div>
  );
}

/**
 * Tabela de comparação de exemplo.
 */
function TabelaComparacao() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2">Indicador</th>
            <th className="text-right p-2">MG</th>
            <th className="text-right p-2">SP</th>
            <th className="text-right p-2">RJ</th>
            <th className="text-right p-2">BA</th>
            <th className="text-right p-2">PE</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="p-2">IDH Geral</td>
            <td className="text-right p-2">0.749</td>
            <td className="text-right p-2">0.826</td>
            <td className="text-right p-2">0.842</td>
            <td className="text-right p-2">0.733</td>
            <td className="text-right p-2">0.718</td>
          </tr>
          <tr className="border-b border-border">
            <td className="p-2">IDEB Fundamental</td>
            <td className="text-right p-2">5.88</td>
            <td className="text-right p-2">6.06</td>
            <td className="text-right p-2">5.99</td>
            <td className="text-right p-2">5.41</td>
            <td className="text-right p-2">5.42</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Fontes de dados do comparador.
 */
function FontesDados() {
  return (
    <div className="grid gap-4 text-sm text-text-700">
      <div>
        <strong>IBGE:</strong> Cidades, IDH, PIB, população, economia
      </div>
      <div>
        <strong>INEP:</strong> IDEB, matrículas, docentes, escolas
      </div>
      <div>
        <strong>MS:</strong> SUS, CNES, profissionais de saúde
      </div>
      <div>
        <strong>CNJ:</strong> Justiça, varas, defensorias, delegacias
      </div>
      <div>
        <strong>TSE:</strong> Eleições, financiamento, candidaturas
      </div>
    </div>
  );
}

export default function PaginaComparadorIndicadores() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/direitos-comparados" className="hover:text-primary hover:underline">
          Direitos Comparados
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Comparador de Indicadores</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Comparador de Indicadores
        </h1>
        <p className="mt-3 text-lg text-text-soft">
          Compare dados de desenvolvimento humano, educação, saúde, justiça, trabalho e finanças entre estados brasileiros.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <SeletorEstados />
        
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text">Indicadores Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <IndicadorCard
              title="Desenvolvimento Humano"
              icon={<BarChart3 className="h-5 w-5" />}
              indicators={["IDH Geral", "IDH Renda", "IDH Educação", "IDH Longevidade", "PIB per capita", "Gini"]}
            />
            <IndicadorCard
              title="Educação"
              icon={<BarChart3 className="h-5 w-5" />}
              indicators={["IDEB Fundamental", "IDEB Médio", "Matrículas", "Docentes", "Escolas", "Taxa Conclusão"]}
            />
            <IndicadorCard
              title="Saúde"
              icon={<BarChart3 className="h-5 w-5" />}
              indicators={["Leitos SUS", "Estabelecimentos", "Profissionais", "Vacinação", "Mortalidade Infantil"]}
            />
            <IndicadorCard
              title="Justiça"
              icon={<BarChart3 className="h-5 w-5" />}
              indicators={["Varas Judiciais", "Defensorias", "Delegacias", "Juízes/100mil", "Processos"]}
            />
            <IndicadorCard
              title="Trabalho"
              icon={<BarChart3 className="h-5 w-5" />}
              indicators={["Formalização CAGED", "Emprego Formal", "Renda Média", "Salário Mínimo"]}
            />
            <IndicadorCard
              title="Finanças Públicas"
              icon={<BarChart3 className="h-5 w-5" />}
              indicators={["Repasses Federais", "Arrecadação ICMS", "Dívida Pública", "Orçamento"]}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Exemplo de Comparação</h2>
        <TabelaComparacao />
      </div>

      <section className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Fontes de Dados</h2>
        <FontesDados />
      </section>

      <FooterGlobal />
    </main>
  );
}