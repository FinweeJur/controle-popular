import { paramsDasCidades } from "@/lib/betim/staticParams";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { temFonte } from "@/lib/db/queries/municipios";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getParaopebaData } from "@/lib/betim/paraopeba";
import Moeda from "@/app/components/Moeda";
import { formatDateBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import ListaProjetos, { ListaProjetosCompleta } from "./ListaProjetos";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
// Filtro é do cliente (`useSearchParams()` no componente de lista). Sem
// `force-static`, `output: export` trata a rota como dinâmica e aborta com
// "missing generateStaticParams()" — mensagem que não descreve a causa.
export const dynamic = "force-static";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Reparação do Rio Paraopeba — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Projetos de reparação socioeconômica em ${c.nome} ligados ao Acordo Geral pelo rompimento da barragem da Vale em Brumadinho, auditados pela FGV.`
);

function referenciaLabel(referencia: string): string {
  const [ano, mes] = referencia.split("-");
  return formatDateBR(`${ano}-${mes}-01`).slice(3);
}

interface ParaopebaPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function ParaopebaPage({ params }: ParaopebaPageProps) {
  const cidade = await cidadeDaRota(params);
  // Só municípios signatários do Acordo do Rio Paraopeba. A página já
  // degradava para "em breve" sem dado, mas "em breve" promete uma coisa
  // que nunca vai chegar para BH e São Paulo.
  if (!temFonte(cidade, "paraopeba")) notFound();
  // SEM os filtros de status/ordem: eles agora são do cliente (ver
  // `ListaProjetos`). Lê-los aqui exigiria `searchParams` num Server
  // Component, e é exatamente isso que `output: 'export'` proíbe.
  const { configured, ok, saldo, iniciativas } = await getParaopebaData(cidade.id_municipio);
  const temDados = configured && ok && iniciativas.length > 0;

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo={`Reparação do Rio Paraopeba em ${cidade.nome}`}
        descricao={`Projetos de reparação socioeconômica em ${cidade.nome}, ligados ao Acordo Geral pelo rompimento da barragem da Vale em Brumadinho (2019), auditados pela FGV.`}
        motivo="Fonte confirmada 2026-07-24 (www18.fgv.br/projetorioparaopeba disponibiliza planilhas mensais em Dados Abertos) — migration 0022_paraopeba.sql ainda não rodada neste ambiente."
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
        <Link href="/meio-ambiente" className="hover:text-primary">
          Meio Ambiente
        </Link>{" "}
        · <span className="text-text">Reparação do Rio Paraopeba</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Reparação do Rio Paraopeba em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {cidade.nome} é um dos 26 municípios da Bacia do Paraopeba que assinaram o
        Acordo Geral de Reparação pelo rompimento da barragem da Vale em
        Brumadinho (2019). A execução dos projetos é auditada de forma
        independente pela FGV (Fundação Getulio Vargas) —{" "}
        {saldo && `dado de ${referenciaLabel(saldo.referencia)}`}.
      </p>

      {saldo && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <DataCard
            title="Valor do acordo (atualizado)"
            source={{ label: "FGV — Projeto Paraopeba", url: "https://www18.fgv.br/projetorioparaopeba/" }}
          >
            <p className="font-tabular text-xl font-bold text-text">
              {saldo.valorAcordoAtual != null ? <Moeda value={saldo.valorAcordoAtual} /> : "—"}
            </p>
            <p className="text-xs text-text-soft">
              inicial:{" "}
              {saldo.valorAcordoInicial != null ? <Moeda value={saldo.valorAcordoInicial} /> : "—"}
            </p>
          </DataCard>
          <DataCard title="Empenhado autorizado">
            <p className="font-tabular text-xl font-bold text-text">
              {saldo.empenhosAutorizados != null ? <Moeda value={saldo.empenhosAutorizados} /> : "—"}
            </p>
          </DataCard>
          <DataCard title="Saldo disponível">
            <p className="font-tabular text-xl font-bold text-text">
              {saldo.saldoTeto != null ? <Moeda value={saldo.saldoTeto} /> : "—"}
            </p>
            <p className="text-xs text-text-soft">já reservados 25% de contingência</p>
          </DataCard>
          <DataCard title={`Projetos ligados a ${cidade.nome}`}>
            <p className="font-tabular text-xl font-bold text-text">{iniciativas.length}</p>
          </DataCard>
        </div>
      )}

      {/* O fallback é a lista COMPLETA e na ordem padrão, não um
          esqueleto: é o que o servidor tem para mostrar antes de o
          navegador ler a query, e é também exatamente o conteúdo certo
          para quem chega sem filtro. */}
      <Suspense fallback={<ListaProjetosCompleta iniciativas={iniciativas} />}>
        <ListaProjetos iniciativas={iniciativas} />
      </Suspense>

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">O que é essa auditoria</h2>
        <p className="mt-2">
          A FGV é a auditora independente definida no Acordo Judicial de
          Repactuação de Indenizações (AJRI) — não tem vínculo com a Vale
          nem com as prefeituras. Os dados aqui vêm direto da planilha
          mensal de &quot;Dados Abertos&quot; publicada pela própria FGV, não de
          scraping do site.
        </p>
        <p className="mt-2">
          <a
            href="https://www18.fgv.br/projetorioparaopeba/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Ver o portal completo da FGV ↗
          </a>
        </p>
      </section>

      {/* ═══ POR QUE A UFMG ENTRA COMO LINK, E NÃO COMO DADO ═══
          A pesquisa de 13/08/2026 (`docs/FONTES-BRUMADINHO-UFMG.md`) foi
          atrás de INTEGRAR o acervo do Projeto Brumadinho UFMG e concluiu o
          contrário. O catálogo geoespacial deles tem 16 camadas, todas de
          2020, todas cartografia-base que já existe mais fresca na fonte
          primária (ANA, IBGE, IEDE-Sisema) — e os serviços WMS/WFS/REST
          respondem erro de banco travado. O que teria valor de verdade para
          quem foi atingido (saúde, contaminação, impacto socioeconômico)
          está em relatório fechado, não em camada aberta.

          Republicar aquilo seria dado velho com selo de universidade. Citar
          é o uso honesto: a UFMG produziu 67 subprojetos sobre o rompimento,
          e esse acervo não existe em outro lugar.

          ⚠️ O LINK É `http://`, E ISSO FOI MEDIDO, NÃO DESCUIDO. O site do
          projeto (`projetobrumadinho.ufmg.br`) responde 200 em HTTP e falha
          a conexão em HTTPS — testado nas quatro variantes (com e sem www,
          http e https), e o servidor não redireciona para a versão segura.
          Escrever `https://` aqui produziria um link morto com cara de link
          certo, que é exatamente o defeito que a auditoria de hiperlinks
          deste mesmo dia foi caçar. Se um dia a UFMG publicar certificado,
          trocar é uma letra. */}
      <section className="mt-4 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          A avaliação independente da UFMG
        </h2>
        <p className="mt-2">
          Além da auditoria financeira da FGV, a UFMG mantém desde 2019 uma
          avaliação dos impactos do rompimento — saúde das pessoas atingidas,
          contaminação e efeitos sociais e econômicos na bacia. É pesquisa
          acadêmica publicada em relatórios, e não entra neste portal como
          dado: os relatórios não são planilha aberta, e o acervo geográfico
          que eles publicam é cartografia de 2020 que já existe mais atual na
          fonte original. Fica o caminho para quem quiser ler direto.
        </p>
        <p className="mt-2">
          <a
            href="http://www.projetobrumadinho.ufmg.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Ver o Projeto Brumadinho UFMG ↗
          </a>{" "}
          <span className="text-text-soft">
            (o site da UFMG ainda não usa conexão segura)
          </span>
        </p>
      </section>
    </div>
  );
}
