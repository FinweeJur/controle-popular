import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obterLugar, LUGARES_CATALOGO } from "@/lib/lugares";
import PainelLugar from "@/app/ambiental/components/PainelLugar";
import type { DadosImpactoPovoGente } from "@/app/ambiental/components/BlocoPovoGente";

export function generateStaticParams() {
  return LUGARES_CATALOGO.filter((l) => l.tipo === "vale" || l.tipo === "cerrado").map((t) => ({
    slug: t.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lugar = obterLugar(slug);
  if (!lugar) return { title: "Território não encontrado" };
  return {
    title: `${lugar.nome} — Nossos Territórios · ONSA`,
    description: lugar.resumoVozCidada,
  };
}

export default async function TerritorioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lugar = obterLugar(slug);

  if (!lugar || (lugar.tipo !== "vale" && lugar.tipo !== "cerrado")) {
    notFound();
  }

  const impactoPovoGente: DadosImpactoPovoGente = {
    lugarNome: lugar.nome,
    saude: {
      indicador: "Segurança Hídrica no Semiárido & Veredas",
      descricao:
        slug === "vale-do-jequitinhonha"
          ? "Acesso intermitente à água tratada e dependência de reservatórios comunitários e cisternas de placa."
          : "Secamento de nascentes e rebaixamento de aquíferos provocado pelo avanço de monoculturas irrigadas.",
      fonte: "Ministério da Integração e do Desenvolvimento Regional / IGAM",
    },
    trabalhoERenda: {
      atividadePrincipal: "Artesanato em Cerâmica, Agricultura Familiar & Mineração",
      vulnerabilidade:
        slug === "vale-do-jequitinhonha"
          ? "Mulheres artesãs e ceramistas tradicionais organizadas em associações, convivendo com a atração de mão de obra para plantas de lítio."
          : "Geraizeiros, extrativistas do pequi e do baru defendendo áreas públicas de pastoreio comunitário.",
      fonte: "Emater-MG / Associações de Artesãos",
    },
    moradia: {
      situacao: "Quilombos Certificados & Posse Tradicional da Terra",
      familiasRisco:
        "Regularização fundiária de territórios quilombolas e conflitos possessórios por sobreposição de títulos no Cadastro Ambiental Rural (CAR).",
      fonte: "INCRA / Fundação Cultural Palmares / Observatório de Terras ONSA",
    },
    cultura: {
      manifestacao: "Folia de Reis, Cerâmica do Vale & Cultura Geraizeira",
      ameacaOuPotencia:
        "Saberes passados de geração em geração que sustentam a identidade do povo sertanejo e a resistência ao êxodo rural.",
      fonte: "IEPHA-MG / IPHAN",
    },
  };

  const numeroProtagonista = {
    valor: slug === "vale-do-jequitinhonha" ? "80 mil km²" : "[ligar à fonte]",
    rotulo: "Área de abrangência territorial e cultural",
    fonte: "IBGE / Codevasf",
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
