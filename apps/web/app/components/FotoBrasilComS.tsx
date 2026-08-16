/**
 * Fotos do acervo Brasil com S (https://www.brasilcoms.com.br), baixadas e
 * comprimidas (webp q72) para `public/brasilcoms/`.
 *
 * REGRAS DOS TERMOS DE USO DO ACERVO (medidas em 16/08/2026):
 * - uso editorial e gratuito, com crédito à fonte em toda reprodução;
 * - sem fim comercial, promocional ou político;
 * - sem edição das fotos — por isso NENHUM uso aqui corta a imagem
 *   (sem `object-fit: cover`): o que se vê é o quadro inteiro do acervo.
 *
 * `alt` descreve a cena pelos dados do acervo (tags da própria página do
 * produto); a 00296 ficou fora por não ter descrição publicada — a
 * legenda só entra com descrição honesta.
 *
 * O prefixo `PAGES_BASE_PATH` é o mesmo sinal que `next.config.ts` usa:
 * vazio no alvo Cloudflare, `/controle-popular` no export estático.
 */
export const PREFIXO_EXPORT = process.env.PAGES_BASE_PATH ?? "";

export interface FotoBrasilComSInfo {
  w: number;
  h: number;
  alt: string;
}

export const FOTOS_BRASILCOMS: Record<string, FotoBrasilComSInfo> = {
  "00031": { w: 667, h: 1000, alt: "Detalhe de janela de vidro" },
  "00033": { w: 667, h: 1000, alt: "Muro de tijolos" },
  "00036": { w: 667, h: 1000, alt: "Folhas de costela de adão" },
  "00039": { w: 667, h: 1000, alt: "Calçada de pedra portuguesa" },
  "00085": { w: 667, h: 1000, alt: "Laje ao sol, com fios e céu" },
  "00089": { w: 667, h: 1000, alt: "Churrasco na laje, com cerveja" },
  "00253": { w: 667, h: 1000, alt: "Passando café na cozinha" },
  "00254": { w: 667, h: 1000, alt: "Cafezinho na cozinha" },
  "00293": { w: 1000, h: 667, alt: "Almoço em família, com risadas" },
  "00304": { w: 1000, h: 667, alt: "Almoço em família na cozinha" },
  "00308": { w: 1000, h: 667, alt: "Trabalho em home office" },
  "00325": { w: 667, h: 1000, alt: "Mulher na cozinha com o celular" },
  "00397": { w: 1000, h: 667, alt: "Verão no quintal, com bicicleta e bebida" },
  "00410": { w: 667, h: 1000, alt: "Quintal de casa com cachorro" },
  "00414": { w: 667, h: 1000, alt: "Muro e quintal de casa" },
  "00416": { w: 667, h: 1000, alt: "Quintal com moto e bicicleta" },
  "00417": { w: 667, h: 1000, alt: "Parede de quintal" },
  "00433": { w: 1000, h: 667, alt: "Torcida assistindo futebol na TV" },
  "00483": { w: 1000, h: 667, alt: "Venda no hortifruti de mercadinho" },
  "00500": { w: 667, h: 1000, alt: "Prateleiras de hortifruti em mercadinho" },
  "00503": { w: 667, h: 1000, alt: "Arrumando prateleiras no hortifruti" },
  "00517": { w: 667, h: 1000, alt: "Legumes à venda: tomate, batata e cebola" },
};

/** A página do produto no acervo, para o crédito de cada foto. */
export const paginaDaFoto = (id: string) =>
  `https://www.brasilcoms.com.br/product-page/brasilcoms-${id}`;

/**
 * Foto do acervo com crédito obrigatório em legenda visível
 * (`<figcaption>`), nunca em `alt` — leitor de tela não repete o crédito.
 *
 * `<img>` cru e não `next/image`, seguindo o padrão já usado no portal
 * (fotos de vereador/parlamentar): no export estático o otimizador de
 * imagem não existe. `width`/`height` vêm das dimensões reais para não
 * pular o layout — e a foto nunca é cortada (`h-auto w-full`).
 */
export default function FotoBrasilComS({
  id,
  alt,
  className = "",
  creditar = true,
}: {
  id: string;
  alt?: string;
  className?: string;
  creditar?: boolean;
}) {
  const info = FOTOS_BRASILCOMS[id];
  if (!info) return null;
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${PREFIXO_EXPORT}/brasilcoms/brasilcoms-${id}.webp`}
        alt={alt ?? info.alt}
        width={info.w}
        height={info.h}
        loading="lazy"
        decoding="async"
        className="h-auto w-full"
      />
      {creditar ? (
        <figcaption className="mt-1.5 text-[.78em] text-text-soft">
          Foto:{" "}
          <a
            href={paginaDaFoto(id)}
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:text-primary"
          >
            Brasil com S — Lab 678
          </a>{" "}
          · reprodução sem corte, conforme termos do acervo
        </figcaption>
      ) : null}
    </figure>
  );
}