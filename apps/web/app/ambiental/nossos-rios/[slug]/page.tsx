import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obterLugar, LUGARES_CATALOGO } from "@/lib/lugares";
import PainelLugar from "@/app/ambiental/components/PainelLugar";
import { obterDadosRio } from "@/lib/ambiental/nossos-rios-dados";
import type { DadosImpactoPovoGente } from "@/app/ambiental/components/BlocoPovoGente";

export function generateStaticParams() {
  return LUGARES_CATALOGO.filter((l) => l.tipo === "rio").map((r) => ({
    slug: r.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lugar = obterLugar(slug);
  if (!lugar) return { title: "Rio não encontrado" };
  return {
    title: `${lugar.nome} — Nossos Rios · ONSA`,
    description: lugar.resumoVozCidada,
  };
}

export default async function RioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lugar = obterLugar(slug);

  if (!lugar || lugar.tipo !== "rio") {
    notFound();
  }

  const dadosRio = obterDadosRio(slug);

  const fallbackImpacto: DadosImpactoPovoGente = {
    lugarNome: lugar.nome,
    saude: {
      indicador: "Qualidade da Água & Abastecimento",
      descricao: "Captação para saneamento urbano e controle contínuo de qualidade pelo órgão ambiental.",
      fonte: "IGAM / ANA (2026)",
    },
    trabalhoERenda: {
      atividadePrincipal: "Pesca Artesanal & Agricultura Familiar",
      vulnerabilidade: "Comunidades tradicionais de pescadores e pequenos produtores de vazante.",
      fonte: "Emater / Colônias de Pesca",
    },
    moradia: {
      situacao: "Comunidades Ribeirinhas & Áreas de Várzea",
      familiasRisco: "Famílias residentes em cotas de cheia e monitoradas por planos de contingência.",
      fonte: "Defesa Civil / Prefeituras",
    },
    cultura: {
      manifestacao: "Cultura das Águas & Tradições Ribeirinhas",
      ameacaOuPotencia: "Celebrações religiosas tradicionais, festas populares e memória ribeirinha.",
      fonte: "IPHAN / IEPHA",
    },
  };

  const numeroProtagonista = dadosRio?.numeroProtagonista ?? {
    valor: "Monitorado",
    rotulo: "Calha fluvial monitorada por órgãos públicos estaduais e federais",
    fonte: "ANA / Comitê de Bacia Hidrográfica",
    dataReferencia: "2026",
  };

  return (
    <PainelLugar
      lugar={lugar}
      numeroProtagonista={numeroProtagonista}
      dadosGrafico={dadosRio?.dadosGrafico}
      impactoPovoGente={dadosRio?.impactoPovoGente ?? fallbackImpacto}
      itensTabela={dadosRio?.itensTabela}
      variacaoPovoGente="povo"
    />
  );
}
