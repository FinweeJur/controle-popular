import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  contagemPorStatus,
  ehPrioritario,
  linhasDaTabela,
  VERIFICADO_EM,
} from "@/lib/betim/legislacao/logica";
import { formatDateBR } from "@/lib/betim/format";
import ListaLegislacao from "./ListaLegislacao";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Legislação municipal de ${c.nome} — Lei Orgânica, Plano Diretor — ${nomePortal(c)}`,
  (c) =>
    `Lei Orgânica, Plano Diretor, zoneamento, Código Tributário e Obras/Posturas de ${c.nome}: status, links oficiais e onde procurar cada um.`
);

interface LegislacaoPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function LegislacaoPage({ params: rota }: LegislacaoPageProps) {
  const cidade = await cidadeDaRota(rota);
  const linhas = linhasDaTabela(cidade.slug);
  const contagem = contagemPorStatus(linhas);
  const prioridade = ehPrioritario(cidade.slug);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Legislação municipal</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Legislação principal de {cidade.nome}
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Os cinco instrumentos que organizam a vida jurídica do município —
        onde cada um está publicado, com link direto quando localizado.
      </p>

      <div className="mt-4 max-w-3xl rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-sm leading-relaxed text-text-soft">
        <p>
          <strong className="text-text">Como este levantamento foi feito.</strong>{" "}
          Só entra como “Encontrado” o documento localizado em{" "}
          <strong>domínio oficial (.gov.br)</strong> na verificação de{" "}
          {formatDateBR(VERIFICADO_EM)}. Agregadores privados de legislação
          podem ser citados nas notas como pista, nunca como link principal.
          “Não verificado” significa que esta sprint ainda não passou por ali —
          e a nota diz onde procurar primeiro. Links podem sair do ar: se um
          deles quebrar, o caminho indicado na nota continua valendo.
        </p>
        {!prioridade && (
          <p className="mt-2">
            {cidade.nome} não estava entre os municípios prioritários desta
            primeira rodada (Betim, BH, Araçuaí, Itinga, Diamantina e bacia do
            Paraopeba) — todos os itens aparecem como “Não verificado”, que é
            a verdade sobre o estado da checagem, não sobre a existência das
            leis.
          </p>
        )}
      </div>

      {/* Cartões de topo — respondem "como está a cobertura?" antes da tabela. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <DataCard title="Encontrados" source={{ label: "Fontes oficiais (.gov.br)", url: undefined }}>
          <p className="font-tabular text-2xl font-bold text-text">{contagem.encontrado}</p>
          <p className="mt-1 text-xs text-text-soft">documentos com link oficial direto.</p>
        </DataCard>
        <DataCard title="Não encontrados" source={{ label: "Procurados nesta sprint" }}>
          <p className="font-tabular text-2xl font-bold text-text">{contagem.nao_encontrado}</p>
          <p className="mt-1 text-xs text-text-soft">buscou-se e não achou-se publicação oficial — nota diz onde foi.</p>
        </DataCard>
        <DataCard title="Ainda não verificados" source={{ label: `Verificação em ${formatDateBR(VERIFICADO_EM)}` }}>
          <p className="font-tabular text-2xl font-bold text-text">{contagem.nao_verificado}</p>
          <p className="mt-1 text-xs text-text-soft">fora do alcance desta sprint; nota indica o caminho.</p>
        </DataCard>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Os cinco instrumentos</h2>
        <ListaLegislacao slug={cidade.slug} />
      </section>
    </main>
  );
}
