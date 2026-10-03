import { NOME_ESTADO, urlBandeira, urlBandeiraEstado } from "@/lib/radio/estacoes";

/**
 * Bandeira do país como imagem, para o diretório de rádios.
 *
 * Por que imagem e não o emoji regional-indicator: o Windows não desenha o
 * bloco Unicode das bandeiras, e o `/radio` fica com as duas letras cruas
 * (`BR`) no lugar da bandeira. O `flagcdn.com` entrega um SVG público por
 * código ISO-3166-1 alfa-2 — o mesmo `pais` que já vive na estação.
 *
 * Uso em três pontos: o índice do player, a linha do cartão do painel e o
 * rótulo do filtro de país. A altura é um parâmetro porque o contexto muda
 * (lista compacta × cartão), e a largura acompanha a proporção de cada
 * bandeira (as razões oficiais variam), então só a altura é fixada.
 *
 * Acessibilidade: o `alt` nomeia o país; quando não há nome, diz
 * "Bandeira do país". Sem código válido a imagem some — nunca um `src`
 * quebrado.
 */
export default function Bandeira({
  iso,
  nome,
  tamanho = 14,
}: {
  /** Código ISO-3166-1 alfa-2 (ex.: "BR"). */
  iso: string;
  /** Nome do país para o `alt` (ex.: "Brasil"). */
  nome?: string;
  /** Altura em pixels; a largura segue a proporção da bandeira. */
  tamanho?: number;
}) {
  const url = urlBandeira(iso);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático do CDN, sem otimização do Next.
    <img
      src={url}
      alt={nome ? `Bandeira de ${nome}` : "Bandeira do país"}
      style={{ height: tamanho, width: "auto" }}
      loading="lazy"
      decoding="async"
      className="inline-block shrink-0 rounded-[2px] align-[-0.15em]"
    />
  );
}

/**
 * Bandeira do estado brasileiro, ao lado da do país no card (pedido do dono,
 * 02/10/2026). Some quando a UF não é conhecida — a estação internacional
 * ou sem `uf` não ganha um ícone quebrado, só fica sem o estado.
 *
 * A imagem vem do Wikimedia Commons (`Special:FilePath`, PNG 40 px medido),
 * títulos conferidos pela API em 02/10/2026; o nome no `alt` sai do mesmo
 * mapa que a URL, então alt e src nunca divergem.
 */
export function BandeiraEstado({
  uf,
  tamanho = 14,
}: {
  /** Sigla da UF brasileira (ex.: "MG"); omitida ou desconhecida = sem imagem. */
  uf?: string;
  /** Altura em pixels; a largura segue a proporção da bandeira. */
  tamanho?: number;
}) {
  const url = urlBandeiraEstado(uf);
  const nome = uf ? NOME_ESTADO[uf.trim().toUpperCase()] : undefined;
  if (!url || !nome) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- PNG estático do Commons, sem otimização do Next.
    <img
      src={url}
      alt={`Bandeira de ${nome}`}
      title={`Bandeira de ${nome}`}
      style={{ height: tamanho, width: "auto" }}
      loading="lazy"
      decoding="async"
      className="inline-block shrink-0 rounded-[2px] align-[-0.15em]"
    />
  );
}
