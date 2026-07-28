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
  type LucideIcon,
} from "lucide-react";

/** Lista única das subpáginas de "Betim em Dados" — usada em /dados
 *  (grade completa) e no menu suspenso do Header (pedido do usuário
 *  2026-07-24: "quero que as supáginas presentes em dados apareçam
 *  também... assim que o mouse passar por dados"). */
export const PAGINAS_DADOS: { href: string; nome: string; desc: string; icon: LucideIcon }[] = [
  { href: "/saude", nome: "Saúde", desc: "Internações, arboviroses e óbitos", icon: HeartPulse },
  { href: "/educacao", nome: "Educação", desc: "Escolas, matrículas e IDEB", icon: GraduationCap },
  { href: "/social", nome: "Assistência Social", desc: "Bolsa Família e outros benefícios", icon: Users },
  { href: "/economia", nome: "Economia", desc: "PIB, salário médio e empregos", icon: TrendingUp },
  { href: "/agro", nome: "Agro", desc: "Produção agropecuária", icon: Wheat },
  { href: "/seguranca", nome: "Segurança", desc: "Ocorrências e criminalidade", icon: ShieldAlert },
  { href: "/infraestrutura", nome: "Infraestrutura", desc: "Água e esgoto", icon: Construction },
  { href: "/meio-ambiente", nome: "Meio Ambiente", desc: "Indicadores ambientais", icon: Trees },
  {
    href: "/emendas",
    nome: "Emendas Parlamentares / Repasses Federais",
    desc: "Convênios e verbas federais recebidos",
    icon: Landmark,
  },
  { href: "/nota-betim", nome: "Nota Betim", desc: "Ranking de transparência (PNTP)", icon: BadgeDollarSign },
  { href: "/grupos-economicos", nome: "Grupos econômicos", desc: "Fornecedores que dividem sócios", icon: Network },
];
