import { enderecoVoarAte } from "@/lib/globo/voo";

/**
 * Botão "Voe até aqui" — leva o leitor ao globo 3D já no ponto indicado.
 *
 * O endereço é o contrato de `apps/web/public/terras/globo/js/core/voo.js`
 * (`?voe=<lat>,<lon>&nome=<rótulo>&ctx=<slug>`): o globo voa até o ponto e abre
 * a ficha de contexto do lugar (`ctx` aponta para `dados/contextos-lugares.json`).
 *
 * É um `<a>` simples, não um botão com estado: link compartilhável, funciona sem
 * JavaScript de app, e mantém o globo num iframe/página própria, sem acoplar a
 * página que publica o botão ao Three.js.
 *
 * Acessibilidade: `aria-label` diz para onde o clique leva, e o alvo tem
 * contraste AA (usa os tokens de acento do portal).
 */
export interface BotaoVoarAteProps {
  lat: number;
  lon: number;
  /** Rótulo humano do ponto, mostrado na ficha do globo. */
  nome: string;
  /** Slug do contexto em `contextos-lugares.json` (opcional). */
  ctx?: string;
  /** Texto do botão; padrão "Voe até aqui". */
  rotulo?: string;
  className?: string;
}

export default function BotaoVoarAte({
  lat,
  lon,
  nome,
  ctx,
  rotulo = "Voe até aqui",
  className = "",
}: BotaoVoarAteProps) {
  const href = enderecoVoarAte({ lat, lon, nome, ctx });
  return (
    <a
      href={href}
      className={`whitespace-nowrap underline ${className}`.trim()}
      aria-label={`Abrir o globo 3D em ${nome}`}
      title={`Abrir o globo 3D em ${nome}`}
    >
      {rotulo}
    </a>
  );
}
