import {
  HeartPulse,
  GraduationCap,
  Users,
  TrendingUp,
  Wheat,
  ShieldAlert,
  Construction,
  Trees,
  Landmark,
  BadgeDollarSign,
  Network,
  LandPlot,
  Pickaxe,
  type LucideIcon,
} from "lucide-react";

/**
 * Lista única das subpáginas de "<Cidade> em Dados" — usada em /dados
 * (grade completa) e no menu suspenso do Header (pedido do usuário
 * 2026-07-24: "quero que as supáginas presentes em dados apareçam
 * também... assim que o mouse passar por dados").
 *
 * Virou FUNÇÃO da cidade por causa da "Nota <Cidade>": o rótulo carrega o
 * nome do município.
 *
 * A rota era `/nota-betim` e virou `/nota-transparencia` quando BH e São
 * Paulo entraram — `/sp/nota-betim` não é URL defensável num portal de São
 * Paulo, e o mesmo valeu para `/zap-betim` → `/zap`. As duas URLs antigas
 * estavam indexadas, então sobrevivem como páginas-ponte (`noindex` +
 * canonical + meta refresh) que só existem para Betim; ver
 * `app/[municipio]/nota-betim/page.tsx`.
 */
export const paginasDados = (cidade: {
  nome: string;
}): { href: string; nome: string; desc: string; icon: LucideIcon }[] => [
  { href: "/saude", nome: "Saúde", desc: "Internações, arboviroses e óbitos", icon: HeartPulse },
  { href: "/educacao", nome: "Educação", desc: "Escolas, matrículas e IDEB", icon: GraduationCap },
  { href: "/social", nome: "Assistência Social", desc: "Bolsa Família e outros benefícios", icon: Users },
  { href: "/economia", nome: "Economia", desc: "PIB, salário médio e empregos", icon: TrendingUp },
  { href: "/agro", nome: "Agro", desc: "Produção agropecuária", icon: Wheat },
  { href: "/mineracao", nome: "Mineração", desc: "Royalties da mineração (CFEM/ANM)", icon: Pickaxe },
  { href: "/seguranca", nome: "Segurança", desc: "Ocorrências e criminalidade", icon: ShieldAlert },
  { href: "/infraestrutura", nome: "Infraestrutura", desc: "Água e esgoto", icon: Construction },
  { href: "/meio-ambiente", nome: "Meio Ambiente", desc: "Indicadores ambientais", icon: Trees },
  { href: "/terras", nome: "Terras", desc: "Vazio cadastral (pesquisa acadêmica)", icon: LandPlot },
  {
    href: "/emendas",
    nome: "Emendas Parlamentares / Repasses Federais",
    desc: "Convênios e verbas federais recebidos",
    icon: Landmark,
  },
  { href: "/nota-transparencia", nome: `Nota ${cidade.nome}`, desc: "Ranking de transparência (PNTP)", icon: BadgeDollarSign },
  { href: "/grupos-economicos", nome: "Grupos econômicos", desc: "Fornecedores que dividem sócios", icon: Network },
];
