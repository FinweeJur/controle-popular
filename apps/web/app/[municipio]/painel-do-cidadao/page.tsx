import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import Moeda from "@/app/components/Moeda";
import { fetchContratos } from "@/lib/betim/contratos";
import { maioresFornecedores } from "@/lib/db/queries/betim";
import { carregarCruzamentosDoMunicipio } from "@/lib/terras/cruzamentos-municipio";
import { contagemPorStatus, linhasDaTabela } from "@/lib/betim/legislacao/logica";
import { empresaDoMunicipio, resumoDinheiro } from "@/lib/betim/painel-cidadao";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Painel do cidadão de ${c.nome} — dinheiro público, território e leis — ${nomePortal(c)}`,
  (c) =>
    `Resumo em uma tela: maiores contratos e fornecedores de ${c.nome}, contratos em alerta, sobreposições territoriais e legislação principal, com links para o detalhe.`
);

interface PainelPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function PainelDoCidadaoPage({ params: rota }: PainelPageProps) {
  const cidade = await cidadeDaRota(rota);

  // Uma única varredura dos contratos da cidade alimenta top 5 E as três
  // contagens de alerta (mesmas funções da tabela completa — os números
  // deste painel NUNCA divergem da tela de detalhe).
  const { rows, configured } = await fetchContratos(cidade.id_municipio, {
    porPagina: 100_000,
  });
  const dinheiro = resumoDinheiro(rows, configured);
  const fornecedores = (await maioresFornecedores(cidade.id_municipio, 5)) ?? [];

  const cruz = carregarCruzamentosDoMunicipio(cidade.nome, cidade.id_municipio);
  const legislacao = contagemPorStatus(linhasDaTabela(cidade.slug));
  const empresa = empresaDoMunicipio(cidade.nome);

  const diarioUrl = cidade.fontes?.diario_oficial;
  const temDiario = typeof diarioUrl === "string" && diarioUrl.length > 0;
  // Só entram aqui rotas QUE EXISTEM na zona Cidades deste build: /obras e
  // /servidores ainda não têm página — linkar seria 404 com cara de atalho.
  // Quando ganharem tela, entram nesta lista (registrado no plano).
  const acessoRapido: { href: string; rotulo: string; externo?: boolean }[] = [
    ...(temDiario
      ? [{ href: diarioUrl as string, rotulo: "Diário Oficial ↗", externo: true }]
      : []),
    { href: "/camara", rotulo: "Câmara" },
    { href: "/terras", rotulo: "Terras" },
    { href: "/mineracao", rotulo: "Mineração" },
    { href: "/meio-ambiente", rotulo: "Meio Ambiente" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Painel do cidadão</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Painel do cidadão — {cidade.nome}
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        O essencial em uma tela: para onde vai o dinheiro da Prefeitura, onde
        empreendimentos encontram territórios tradicionais, quais leis
        organizam a cidade — cada número com link para conferir linha a linha.
      </p>

      {/* ═══ Dinheiro público ═══ */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold tracking-tight">Dinheiro público</h2>
        {!dinheiro.disponivel ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-sm text-text-soft">
            Contratos ainda não disponíveis para {cidade.nome} neste build — a
            ausência é declarada, não escondida.{" "}
            <Link href="/prefeitura/contratos" className="font-medium text-accent hover:underline">
              Ir à lista completa →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <DataCard title={`Maiores contratos (${dinheiro.totalContratos.toLocaleString("pt-BR")} no total)`} source={{ label: "PNCP" }}>
                <ol className="flex flex-col gap-2 text-sm">
                  {dinheiro.top5Contratos.map((c) => (
                    <li key={c.id} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-text">
                        {c.fornecedor_nome ?? "Fornecedor não identificado"}
                      </span>
                      <strong className="font-tabular shrink-0">
                        <Moeda value={Number(c.valor_global)} />
                      </strong>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-text-soft">
                  <Link href="/prefeitura/contratos?ordem=valor_global:desc" className="font-medium text-accent hover:underline">
                    Ver todos ordenados por valor →
                  </Link>
                </p>
              </DataCard>

              <DataCard title="Maiores fornecedores (soma de todos os contratos)" source={{ label: "PNCP" }}>
                <ol className="flex flex-col gap-2 text-sm">
                  {fornecedores.map((f) => (
                    <li key={`${f.cnpj ?? f.chave}`} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-text">{f.nome ?? f.chave}</span>
                      <strong className="font-tabular shrink-0">
                        <Moeda value={Number(f.valor)} />
                      </strong>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-text-soft">
                  <Link href="/prefeitura/fornecedores" className="font-medium text-accent hover:underline">
                    Ranking completo com filtros →
                  </Link>
                </p>
              </DataCard>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <DataCard title="Concentração por ano">
                <p className="font-tabular text-2xl font-bold text-text">{dinheiro.concentracao}</p>
                <p className="mt-1 text-xs text-text-soft">
                  contrato(s) de fornecedor com mais de 3 no mesmo ano — indício de fracionamento.
                </p>
                <p className="mt-2 text-xs">
                  <Link href="/prefeitura/contratos?conc=1" className="font-medium text-accent hover:underline">
                    Ver na tabela →
                  </Link>
                </p>
              </DataCard>
              <DataCard title="Dispensa próxima do limite">
                <p className="font-tabular text-2xl font-bold text-text">{dinheiro.dispensaLimite}</p>
                <p className="mt-1 text-xs text-text-soft">
                  compra sem licitação em ≥90% do teto legal (art. 75).
                </p>
                <p className="mt-2 text-xs">
                  <Link
                    href="/prefeitura/contratos?motivo=regra_2_dispensa_proxima_limite"
                    className="font-medium text-accent hover:underline"
                  >
                    Ver na tabela →
                  </Link>
                </p>
              </DataCard>
              <DataCard title="Empresa recém-criada">
                <p className="font-tabular text-2xl font-bold text-text">{dinheiro.recemCriada}</p>
                <p className="mt-1 text-xs text-text-soft">
                  CNPJ aberto no mesmo ano do contrato — sinal de atenção, não violação.
                </p>
                <p className="mt-2 text-xs">
                  <Link href="/prefeitura/contratos?recem=1" className="font-medium text-accent hover:underline">
                    Ver na tabela →
                  </Link>
                </p>
              </DataCard>
            </div>
          </>
        )}
      </section>

      {/* ═══ Território + Legislação + Empresa ═══ */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <DataCard title="Território × empreendimentos" source={{ label: "FUNAI/INCRA × ANM/FEAM" }}>
          <p className="font-tabular text-2xl font-bold text-text">{cruz.linhas.length}</p>
          <p className="mt-1 text-xs text-text-soft">
            sobreposição(ões) exata(s) envolvendo território tradicional do
            município ({formatNumberBR(Math.round(cruz.linhas.reduce((s, l) => s + l.areaIntersecaoHa, 0)))} ha).
          </p>
          <p className="mt-2 text-xs">
            <Link href="/terras/cruzamentos" className="font-medium text-accent hover:underline">
              Ver cruzamentos →
            </Link>
          </p>
        </DataCard>

        <DataCard title="Legislação principal" source={{ label: "Fontes oficiais (.gov.br)" }}>
          <p className="font-tabular text-2xl font-bold text-text">
            {legislacao.encontrado} <span className="text-sm font-normal text-text-soft">de 5</span>
          </p>
          <p className="mt-1 text-xs text-text-soft">
            instrumentos localizados em fonte oficial; o resto tem caminho anotado.
          </p>
          <p className="mt-2 text-xs">
            <Link href="/legislacao" className="font-medium text-accent hover:underline">
              Ver status de cada lei →
            </Link>
          </p>
        </DataCard>

        {empresa ? (
          <DataCard title="Empresa monitorada" source={{ label: "Observatório de Empresas" }}>
            <p className="text-lg font-semibold text-text">{empresa.nomeCurto}</p>
            <p className="mt-1 text-xs text-text-soft">
              área prioritária de atuação neste município — processos mineiros e notícias no observatório.
            </p>
            <p className="mt-2 text-xs">
              {/* `<a>` cru: /empresas mora fora da zona [municipio], e o Link de zona prefixaria com o slug. */}
              <a href={empresa.href} className="font-medium text-accent hover:underline">
                Abrir observatório →
              </a>
            </p>
          </DataCard>
        ) : null}
      </section>

      {/* ═══ Acesso rápido ═══ */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-text">Acesso rápido</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {acessoRapido.map((a) =>
            a.externo ? (
              <a
                key={a.rotulo}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/15"
              >
                {a.rotulo}
              </a>
            ) : (
              <Link
                key={a.rotulo}
                href={a.href}
                className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/15"
              >
                {a.rotulo}
              </Link>
            )
          )}
        </div>
        {!temDiario && (
          <p className="mt-2 text-xs text-text-soft">
            Diário Oficial: nenhuma fonte confirmada para {cidade.nome} — lacuna declarada nas demais telas.
          </p>
        )}
      </section>
    </main>
  );
}
