import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getSegurancaData } from "@/lib/betim/seguranca";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Segurança Pública — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `Estatísticas de criminalidade em ${c.nome}-${c.uf}.`
);

export default async function SegurancaPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const data = await getSegurancaData(cidade.id_municipio);

  // A página inteira foi escrita para Betim (MG) e citava "Sejusp-MG" fixo em
  // sete lugares, sem condicional nenhum. São Paulo tem coletor PRÓPRIO
  // (`etl.psp.crimes`, fonte no banco = `ssp_sp_ocorrencias_mensais`) desde
  // 2026-08-10 — o NÚMERO sempre foi correto, mas a tela seguia dizendo que
  // vinha "do Portal de Dados Abertos do Estado de Minas Gerais", com link
  // pro portal de MG, numa página que mostra dado real de SP. Achado pela
  // auditoria de 2026-08-11: o pior tipo de erro num portal de transparência
  // não é dado faltando, é dado real rotulado como se fosse de outro lugar.
  //
  // Ramifica por UF, não por nome de cidade: é o eixo que já existe (as duas
  // fontes são estaduais) e escala sozinho se um terceiro estado entrar.
  const fonte =
    cidade.uf === "SP"
      ? {
          orgao: "SSP-SP",
          orgaoLongo: "Secretaria de Segurança Pública do Estado de São Paulo",
          url: "https://www.ssp.sp.gov.br/estatistica/dados-mensais",
          rotuloPortal: "Portal de Dados Abertos SSP-SP",
        }
      : {
          orgao: "Sejusp-MG",
          orgaoLongo: "Sejusp (Secretaria de Estado de Justiça e Segurança Pública)",
          url: "https://dados.mg.gov.br/dataset/crimes-violentos",
          rotuloPortal: "Portal de Dados Abertos MG",
        };

  if (!data.configured || !data.ok) {
    return (
      <PaginaEmBreve
        titulo={`Segurança Pública em ${cidade.nome}`}
        descricao={`Ocorrências registradas e estatísticas de criminalidade em ${cidade.nome}.`}
        motivo={
          data.configured
            ? "Nenhum dado de ocorrências encontrado no momento."
            : "Depende do banco de dados, ainda não configurado neste ambiente."
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          {cidade.nome} em Dados
        </Link>{" "}
        · <span className="text-text">Segurança Pública</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Segurança Pública em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Ocorrências de crimes violentos registradas pela Polícia Civil,
        publicadas pela {fonte.orgao} — estupro, roubo, extorsão, homicídio e
        feminicídio tentados, sequestro e cárcere privado.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DataCard
          title={`Ocorrências registradas em ${data.anoRecente}`}
          source={{ label: fonte.orgao, url: fonte.url }}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            {formatNumberBR(data.totalRecente)}
          </p>
          {data.variacaoTotal !== null && data.anoAnterior && (
            <p className="mt-1 text-xs">
              {data.variacaoTotal >= 0 ? "+" : ""}
              {data.variacaoTotal.toFixed(0)}% vs. os mesmos meses de {data.anoAnterior}
            </p>
          )}
        </DataCard>
        {data.porNaturezaRecente[0] && (
          <DataCard title="Ocorrência mais frequente">
            <p className="font-tabular text-2xl font-bold text-text">
              {formatNumberBR(data.porNaturezaRecente[0].qtd)}
            </p>
            <p className="mt-1 text-xs">{data.porNaturezaRecente[0].natureza.toLowerCase()}</p>
          </DataCard>
        )}
      </div>

      {data.porNaturezaRecente.length > 0 && (
        <div className="mt-8">
          <DataCard
            title={`Ocorrências por tipo — ${data.anoRecente}`}
            source={{ label: fonte.orgao, url: fonte.url }}
          >
            <ul className="divide-y divide-border/60">
              {data.porNaturezaRecente.map((n) => (
                <li key={n.natureza} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-text">{n.natureza}</span>
                  <strong className="font-tabular text-text">{formatNumberBR(n.qtd)}</strong>
                </li>
              ))}
            </ul>
          </DataCard>
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          O que este dado é — e o que não é
        </h2>
        <p className="mt-2">
          Vem do portal mantido pela {fonte.orgaoLongo} — crimes classificados
          como violentos, registrados mês a mês.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-text">
            {data.anoRecente} pode estar incompleto
          </strong>{" "}
          — só os meses já publicados pela fonte entram na conta. A
          comparação acima usa só os meses que existem nos dois anos, não o
          ano inteiro, pra não distorcer a variação.
        </p>
        <p className="mt-2">
          Não inclui furtos ou crimes patrimoniais não violentos, que a{" "}
          {fonte.orgao} classifica em outro conjunto de dados — esta página
          cobre só a categoria &ldquo;crimes violentos&rdquo; da fonte.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
        <div>
          <strong className="text-[1.05em]">Quer conferir na fonte?</strong>
          <p className="mt-1 text-sm text-text-soft">
            A {fonte.orgao} publica os dados completos de todos os municípios
            que cobre.
          </p>
        </div>
        <Link
          href={fonte.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          {fonte.rotuloPortal} ↗
        </Link>
      </div>
    </div>
  );
}
