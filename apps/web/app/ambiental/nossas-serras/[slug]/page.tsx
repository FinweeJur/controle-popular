import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obterLugar, LUGARES_CATALOGO } from "@/lib/lugares";
import PainelLugar from "@/app/ambiental/components/PainelLugar";
import type { DadosImpactoPovoGente } from "@/app/ambiental/components/BlocoPovoGente";

export function generateStaticParams() {
  return LUGARES_CATALOGO.filter((l) => l.tipo === "serra").map((s) => ({
    slug: s.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lugar = obterLugar(slug);
  if (!lugar) return { title: "Serra não encontrada" };
  return {
    title: `${lugar.nome} — Nossas Serras · ONSA`,
    description: lugar.resumoVozCidada,
  };
}

export default async function SerraPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lugar = obterLugar(slug);

  if (!lugar || lugar.tipo !== "serra") {
    notFound();
  }

  const impactoPovoGente: DadosImpactoPovoGente = {
    lugarNome: lugar.nome,
    saude: {
      indicador: "Proteção de Nascentes & Mananciais",
      descricao:
        "As serras funcionam como caixas d'água naturais. A preservação da cobertura vegetal no topo recarrega lençóis freáticos que abastecem as cidades da base.",
      fonte: "IGAM / IEF-MG",
    },
    trabalhoERenda: {
      atividadePrincipal: "Ecoturismo, Agricultura Tradicional & Mineração",
      vulnerabilidade:
        "Tensão entre atividades de mineração intensiva em áreas de recarga e o potencial de renda comunitária por guias, pousadas e agricultura agroecológica.",
      fonte: "Censo / Secretarias Municipais de Turismo",
    },
    moradia: {
      situacao: "Comunidades Históricas, Quilombos & Vilas de Encosta",
      familiasRisco:
        "Famílias em encostas sob pressão de expansão imobiliária e servidões de passagem para dutos e estradas de escoamento mineral.",
      fonte: "Defesa Civil / Prefeituras",
    },
    cultura: {
      manifestacao: "Patrimônio Paisagístico, Festas Religiosas & Veredas",
      ameacaOuPotencia:
        "Tombamentos pelo IPHAN e IEPHA que protegem a ambiência histórica e as tradições do tropeirismo e dos apanhadores de flores sempre-vivas.",
      fonte: "IPHAN / UNESCO",
    },
  };

  const numeroProtagonista = {
    valor: slug === "serra-do-espinhaco" ? "1.200 km" : "[ligar à fonte]",
    rotulo: "Extensão da cordilheira no território brasileiro entre MG e BA",
    fonte: "CPRM / Serviço Geológico do Brasil",
    dataReferencia: "2026",
  };

  return (
    <PainelLugar
      lugar={lugar}
      numeroProtagonista={numeroProtagonista}
      impactoPovoGente={impactoPovoGente}
      variacaoPovoGente="gente"
    />
  );
}
