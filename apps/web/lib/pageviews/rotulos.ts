/**
 * Rótulo legível para um `path` de `page_views`, para a tela "Páginas mais
 * vistas" (`app/dados/populares`).
 *
 * `page_views` grava TODO path que dispara o beacon — inclusive página de
 * entidade individual (um vereador, uma norma). A tela só mostra "páginas
 * principais" (hubs e páginas de zona-topo), então este módulo separa as
 * duas coisas: a tabela conta tudo, o rótulo decide o que é "principal" —
 * `rotularPath` devolve `null` para o que não está na lista abaixo, e quem
 * chama filtra os `null`. Preferido a sub-escopar a CONTAGEM: é mais barato
 * ampliar esta lista depois do que reprocessar dado que nunca foi gravado.
 *
 * Os rótulos espelham os textos que o próprio site já usa em
 * `app/[municipio]/components/Header.tsx` e `lib/betim/dadosNav.ts` — não
 * importados de lá porque nenhum dos dois exporta a lista como dado (é JSX
 * inline), e recriá-la aqui é mais simples do que refatorar um componente
 * que não é desta feature.
 */

export type CidadeRotulo = { slug: string; nome: string };

const PAGINAS_ZONA: Record<string, string> = {
  "/": "Início — Controle Popular",
  "/busca": "Busca unificada",
  "/congresso": "Congresso — Início",
  "/congresso/proposicoes": "Congresso — Proposições",
  "/congresso/votacoes": "Congresso — Votações",
  "/congresso/agenda": "Congresso — Agenda",
  "/congresso/alertas": "Congresso — Alertas",
  "/congresso/bons-exemplos": "Congresso — Bons exemplos",
  "/congresso/bancadas": "Congresso — Bancadas",
  "/congresso/comissoes": "Congresso — Comissões",
  "/congresso/parlamentares": "Congresso — Parlamentares",
  "/judiciario": "Judiciário — Início",
  "/judiciario/tribunais": "Judiciário — Tribunais",
  "/judiciario/indicacoes": "Judiciário — Indicações",
  "/judiciario/vagas": "Judiciário — Vagas",
  "/ambiental": "Meio Ambiente (MG) — Início",
  "/funcaosocialterra": "Terras — Início",
};

/** Sufixo depois do slug da cidade (`""` = a home da própria cidade). */
const SUBPAGINAS_CIDADE: { sufixo: string; rotulo: (nome: string) => string }[] = [
  { sufixo: "", rotulo: (n) => `${n} — Início` },
  { sufixo: "/prefeitura", rotulo: (n) => `Prefeitura — ${n}` },
  { sufixo: "/prefeitura/contratos", rotulo: (n) => `Contratos da Prefeitura — ${n}` },
  { sufixo: "/prefeitura/licitacoes", rotulo: (n) => `Licitações da Prefeitura — ${n}` },
  { sufixo: "/prefeitura/servidores", rotulo: (n) => `Servidores — ${n}` },
  { sufixo: "/prefeitura/despesas", rotulo: (n) => `Despesas da Prefeitura — ${n}` },
  { sufixo: "/prefeitura/obras", rotulo: (n) => `Obras — ${n}` },
  { sufixo: "/prefeitura/diarias", rotulo: (n) => `Diárias — ${n}` },
  { sufixo: "/camara", rotulo: (n) => `Câmara Municipal — ${n}` },
  { sufixo: "/camara/proposicoes", rotulo: (n) => `Proposições da Câmara — ${n}` },
  { sufixo: "/camara/legislacao", rotulo: (n) => `Legislação — ${n}` },
  { sufixo: "/camara/comissoes", rotulo: (n) => `Comissões da Câmara — ${n}` },
  { sufixo: "/camara/votacoes", rotulo: (n) => `Votações da Câmara — ${n}` },
  { sufixo: "/dados", rotulo: (n) => `${n} em Dados` },
  { sufixo: "/servicos", rotulo: (n) => `Serviços — ${n}` },
  { sufixo: "/saude", rotulo: (n) => `Saúde — ${n}` },
  { sufixo: "/educacao", rotulo: (n) => `Educação — ${n}` },
  { sufixo: "/economia", rotulo: (n) => `Economia — ${n}` },
  { sufixo: "/seguranca", rotulo: (n) => `Segurança — ${n}` },
  { sufixo: "/social", rotulo: (n) => `Assistência Social — ${n}` },
  { sufixo: "/meio-ambiente", rotulo: (n) => `Meio Ambiente — ${n}` },
  { sufixo: "/legislacao/alertas", rotulo: (n) => `Legislação · Alertas — ${n}` },
  { sufixo: "/legislacao/bons-exemplos", rotulo: (n) => `Legislação · Bons exemplos — ${n}` },
  { sufixo: "/noticias", rotulo: (n) => `Notícias — ${n}` },
  { sufixo: "/sobre", rotulo: (n) => `Sobre — ${n}` },
];

/**
 * Rótulo pro cidadão, ou `null` quando o path não é uma "página principal"
 * conhecida (página de entidade individual, ou rota fora do mapeamento).
 */
export function rotularPath(path: string, cidades: CidadeRotulo[]): string | null {
  const daZona = PAGINAS_ZONA[path];
  if (daZona) return daZona;

  for (const cidade of cidades) {
    const prefixo = `/${cidade.slug}`;
    if (path !== prefixo && !path.startsWith(`${prefixo}/`)) continue;
    const resto = path.slice(prefixo.length); // "" para a home da cidade
    const sub = SUBPAGINAS_CIDADE.find((s) => s.sufixo === resto);
    // Path é desta cidade, mas o resto não bate com nenhuma página
    // principal conhecida (ex. /betim/vereadores/fulano) — para de
    // procurar: dois slugs de cidade nunca compartilham prefixo.
    return sub ? sub.rotulo(cidade.nome) : null;
  }

  return null;
}
