import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obterLugar, LUGARES_CATALOGO } from "@/lib/lugares";
import PainelLugar from "@/app/ambiental/components/PainelLugar";
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

  // Dados reais ou de referência pública para os rios
  const impactoPovoGente: DadosImpactoPovoGente = {
    lugarNome: lugar.nome,
    saude: {
      indicador: "Qualidade da Água & Abastecimento",
      descricao:
        slug === "rio-paraopeba"
          ? "Monitoramento contínuo de poços artesianos e turbidez em 11 estações ao longo da calha."
          : "Captação para saneamento urbano e controle de patógenos de veiculação hídrica.",
      fonte: "IGAM / COPASA (2026)",
    },
    trabalhoERenda: {
      atividadePrincipal: "Pesca Artesanal & Agricultura Familiar",
      vulnerabilidade:
        slug === "rio-paraopeba"
          ? "Colônias de pescadores em processo de indenização e reestruturação produtiva."
          : "Irrigação de pequenas lavouras de vazante e hortas comunitárias dependentes do leito.",
      fonte: "Emater-MG / Colônias de Pescadores",
    },
    moradia: {
      situacao: "Comunidades Ribeirinhas & Áreas de Várzea",
      familiasRisco:
        "Famílias residentes em cotas de cheia e monitoradas por planos de contingência da Defesa Civil.",
      fonte: "Defesa Civil Estadual / Prefeituras",
    },
    cultura: {
      manifestacao: "Cultura das Águas & Tradições Ribeirinhas",
      ameacaOuPotencia:
        "Celebrações religiosas tradicionais, festas de Nossa Senhora do Rosário e canoagem secular.",
      fonte: "IEPHA-MG",
    },
  };

  const numeroProtagonista = {
    valor: slug === "rio-paraopeba" ? "510 km" : "[ligar à fonte]",
    rotulo: "Extensão total da calha fluvial monitorada por órgãos públicos",
    fonte: "IGAM / Comitê de Bacia Hidrográfica",
    dataReferencia: "2026",
  };

  return (
    <PainelLugar
      lugar={lugar}
      numeroProtagonista={numeroProtagonista}
      impactoPovoGente={impactoPovoGente}
      variacaoPovoGente="povo"
    />
  );
}
