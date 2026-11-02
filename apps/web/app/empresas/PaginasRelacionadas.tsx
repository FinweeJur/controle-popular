import SecaoPaginasRelacionadas, {
  type ItemPaginaRelacionada,
} from "@/app/components/SecaoPaginasRelacionadas";

/**
 * @file Cruzamentos cívicos do painel de empresas.
 *
 * POR QUE EXISTE: mantém a lista de páginas irmãs fora do corpo da página, que
 * já carrega painel, barras e lista. O conteúdo é o mesmo que o hub publicava
 * antes da migração; só mudou de arquivo para o componente principal caber no
 * limite de tamanho do CodeScene sem perder link.
 *
 * FONTE: nenhuma. É navegação; cada destino tem a própria fonte.
 */

const PAGINAS: ItemPaginaRelacionada[] = [
  {
    href: "/empresas/fortunas",
    titulo: "1.000 Maiores Fortunas Mundiais",
    descricao: "Dinastias e bilionários que controlam as corporações e fundos globais.",
    badge: "Fortunas",
    icone: "dinheiro",
  },
  {
    href: "/empresas/conglomerados",
    titulo: "Monopólios e Redes de Controle",
    descricao: "Grafo das holdings, fundos Big Three e cartéis de grãos e mineração.",
    badge: "Holdings",
    icone: "rede",
  },
  {
    href: "/empresas/executivos",
    titulo: "CEOs e Conselhos Corporativos",
    descricao: "Diretores, conselheiros estatutários e diretorias entrelaçadas.",
    badge: "Governança",
    icone: "empresa",
  },
  {
    href: "/canada/mineracao",
    titulo: "Mineradoras Canadenses no Brasil",
    descricao: "Corporações da TSX com concessões de lavra e barragens de rejeitos na ANM.",
    badge: "Mineração",
    icone: "mineracao",
  },
  {
    href: "/ambiental/barragens-globais",
    titulo: "Grandes Barragens Mundiais",
    descricao: "Barragens de rejeitos operadas pelas grandes mineradoras privadas.",
    badge: "Barragens",
    icone: "barragem",
  },
  {
    href: "/ambiental/crise-climatica",
    titulo: "Observatório da Crise Climática",
    descricao: "As maiores fontes de emissão das petrolíferas e indústrias.",
    badge: "Clima",
    icone: "clima",
  },
];

export default function PaginasRelacionadas() {
  return (
    <SecaoPaginasRelacionadas
      titulo="Investigações & conexões corporativas"
      subtitulo="Cruze o poder econômico das empresas com fortunas, governança e impactos no território."
      paginas={PAGINAS}
    />
  );
}
