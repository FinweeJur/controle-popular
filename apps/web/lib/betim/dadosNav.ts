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

/**
 * Lista única das subpáginas de "<Cidade> em Dados" — usada em /dados
 * (grade completa) e no menu suspenso do Header (pedido do usuário
 * 2026-07-24: "quero que as supáginas presentes em dados apareçam
 * também... assim que o mouse passar por dados").
 *
 * Virou FUNÇÃO da cidade por causa da "Nota Betim": o rótulo carrega o
 * nome do município. A ROTA continua `/nota-betim` — renomeá-la mudaria
 * uma das 54 URLs já indexadas de Betim, o que é decisão separada (o
 * plano previa o rename; o commit que criou `[municipio]` optou por
 * preservar as URLs). Então, em outra cidade, o rótulo fica certo e a
 * URL fica esquisita.
 */
export const paginasDados = (cidade: {
  nome: string;
}): { href: string; nome: string; desc: string; icon: LucideIcon }[] => [
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
  { href: "/nota-betim", nome: `Nota ${cidade.nome}`, desc: "Ranking de transparência (PNTP)", icon: BadgeDollarSign },
  { href: "/grupos-economicos", nome: "Grupos econômicos", desc: "Fornecedores que dividem sócios", icon: Network },
];
