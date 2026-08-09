import Link from "@/lib/betim/link";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { temFonte } from "@/lib/db/queries/municipios";
import { capCobreCidade } from "@/lib/betim/capAutos";

export const generateMetadata = metadataDaCidade(
  (c) => `Meio Ambiente — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `O que existe de fonte pública sobre meio ambiente na região de ${c.nome}-${c.uf}: barragens de mineração, compensação ambiental e TACs.`
);

// FONTES DE MINAS GERAIS. Todas as três são estaduais (MPMG, SEMAD/MG) e a
// primeira cita municípios limítrofes de Betim pelo nome. Servi-las a São
// Paulo seria pior que não ter a seção: são órgãos que não têm competência
// sobre a cidade. A lista só é exibida quando a cidade declara
// `fontes.links_uteis_mg`, o mesmo sinal que governa `/links-uteis-mg`.
//
// CORRIGIDO EM 2026-08-09 — o comentário anterior dizia "nenhuma fonte
// encontrada tem API/dataset aberto por município", com base na pesquisa de
// 2026-07-21 (`docs/betim/ambiental-pecma-research.md`), que só tinha olhado
// PECMA e MPMG. A afirmação está FALSA desde `docs/ambiental/F0-discovery.md`:
// IBAMA (§10), SNISB (§11) e CAP (§13.2) são fontes abertas por município, e o
// CAP tem tela própria em `/meio-ambiente/autuacoes`.
//
// Os três links abaixo continuam sendo o que são: canais e portais sem dado
// aberto por município, organizados para o leitor — não indicador.
const FONTES = [
  {
    nome: "Barragens a montante na região — MPMG",
    desc: '"Desativando Bombas-Relógio": 54 barragens erguidas pelo método mais arriscado (o mesmo de Mariana e Brumadinho), monitoradas em Minas Gerais. Nenhuma está dentro de Betim, mas 3 municípios que fazem fronteira direta com Betim aparecem na lista: Igarapé, Itatiaiuçu e Sarzedo — risco regional real (bacia hidrográfica compartilhada, rotas de evacuação).',
    href: "https://barragens.mpmg.mp.br/",
    cta: "Ver mapa de barragens",
  },
  {
    nome: "PECMA — Compensação de multas ambientais",
    desc: "Programa estadual que permite converter multa ambiental em investimento em projeto de recuperação. 9.712 adesões ativas e R$357,5 milhões envolvidos em todo o estado (dado agregado, não por município) — SEMAD ainda não publica esse número aberto por cidade.",
    href: "https://www.agenciaminas.mg.gov.br/",
    cta: "Sobre o programa (SEMAD)",
  },
  {
    nome: "TACs ambientais — Portal Ecosistemas (MPMG)",
    desc: "Termos de Ajustamento de Conduta ambientais do estado. O sistema de busca antigo foi descontinuado; o atual exige navegação própria e não expõe um endpoint público filtrável por município que já tenhamos confirmado.",
    href: "https://ecosistemas.meioambiente.mg.gov.br/gtac/acessoExterno",
    cta: "Consultar TACs",
  },
];

export default async function MeioAmbientePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const fontesDoEstado = temFonte(cidade, "links_uteis_mg") ? FONTES : [];
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Meio Ambiente
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        O que existe de fonte ambiental pública por município para{" "}
        {cidade.nome} — e o que ainda não existe.
        {fontesDoEstado.length > 0
          ? " Abaixo, o que é real e verificável, incluindo um risco regional que afeta a cidade mesmo sem estar dentro do município."
          : " Assim que uma fonte pública por município aparecer para esta cidade, ela entra aqui."}
      </p>

      {capCobreCidade(cidade) && (
        <Link
          href="/meio-ambiente/autuacoes"
          className="cp-card-hover mt-6 flex flex-col gap-2 rounded-2xl border border-primary bg-primary/5 p-5 shadow-sm hover:border-primary"
        >
          <p className="font-display font-semibold text-text">
            Autuações ambientais em {cidade.nome}
          </p>
          <p className="text-sm text-text-soft">
            Autos de infração lavrados pelos órgãos ambientais de Minas Gerais
            na cidade: quantos, de que órgão, quanto foi multado e quanto
            continua em aberto — com a situação de cada processo.
          </p>
          <span className="mt-1 inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
            Ver autuações →
          </span>
        </Link>
      )}

      <Link
        href="/meio-ambiente/barragens"
        className="cp-card-hover mt-4 flex flex-col gap-2 rounded-2xl border border-primary bg-primary/5 p-5 shadow-sm hover:border-primary"
      >
        <p className="font-display font-semibold text-text">
          Barragens em {cidade.nome}
        </p>
        <p className="text-sm text-text-soft">
          Quantas, de quem, condição de estabilidade, nível de emergência e
          quais foram erguidas a montante — o método de Mariana e Brumadinho.
          Cruza o inventário estadual da FEAM com o cadastro nacional do SNISB.
        </p>
        <span className="mt-1 inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
          Ver barragens →
        </span>
      </Link>

      {temFonte(cidade, "paraopeba") && (
      <Link
        href="/meio-ambiente/paraopeba"
        className="cp-card-hover mt-6 flex flex-col gap-2 rounded-2xl border border-primary bg-primary/5 p-5 shadow-sm hover:border-primary"
      >
        <p className="font-display font-semibold text-text">
          Reparação do Rio Paraopeba em {cidade.nome}
        </p>
        <p className="text-sm text-text-soft">
          Projetos ligados ao Acordo Geral pelo rompimento da barragem da
          Vale em Brumadinho (2019), com valor, status e link direto pra
          cada projeto — auditoria independente da FGV.
        </p>
        <span className="mt-1 inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
          Ver projetos →
        </span>
      </Link>
      )}

      <section className="mt-8 flex flex-col gap-3">
        {fontesDoEstado.map((f) => (
          <a
            key={f.href}
            href={f.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cp-card-hover flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
          >
            <p className="font-display font-semibold text-text">{f.nome}</p>
            <p className="text-sm text-text-soft">{f.desc}</p>
            <span className="mt-1 inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
              {f.cta} ↗
            </span>
          </a>
        ))}
      </section>

      <p className="mt-8 text-xs text-text-soft">
        Pesquisado ao vivo em 2026-07-21 e conferido de novo em 2026-07-23.
        Se você conhece uma fonte com dado aberto por município que não está
        aqui,{" "}
        <Link href="/contatos" className="text-accent hover:underline">
          avise a gente
        </Link>
        .
      </p>
    </main>
  );
}
