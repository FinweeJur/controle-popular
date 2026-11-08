import Link from "next/link";
import { EIXOS, portaDoEixo } from "@/lib/navegacao/mapa";
import { arteDoEixo } from "@/lib/navegacao/arte-eixos";

/**
 * @file HeroEixos.tsx
 * @description Os 9 eixos do portal no hero da home, com as artes de aquarela
 * que já existem no repositório (arara, rio, cachoeira com antas, ipê com
 * lobo-guará, cidade e lagoa).
 *
 * POR QUE EXISTE (dono, 08/11/2026): a home ainda mostrava a grade antiga de
 * 4 eixos, com o rótulo "4 Eixos • 36+ Subfrentes" — desatualizado desde o
 * mapa de 9. O dono pediu os efeitos de entrada e as imagens da fauna na
 * hero dos eixos atuais, funcionando também no tablet e no celular.
 *
 * ENTRADA: animação CSS (`cp-hero-eixo`), escalonada por card. Não depende de
 * hover, ponteiro fino nem WebGL — por isso aparece no dedo. Quem pediu
 * `prefers-reduced-motion` recebe a grade parada (regra do portal: movimento
 * é escolha). O hover só dá um leve zoom na imagem, nunca é o único sinal.
 *
 * ARTES: os arquivos vêm de `public/images/eixos/` (aquarelas da fauna e do
 * Cerrado) e de `public/capas/`. Eixo sem arte própria herda a mais próxima;
 * não há imagem gerada nem arquivo novo nesta entrega. A geração de novas
 * artes está bloqueada por falta de saldo na conta de imagem — quando houver,
 * basta trocar o `src` aqui.
 */

export default function HeroEixos() {
  return (
    <section
      aria-label="Os nove eixos do portal"
      className="my-8 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">
          Os 9 eixos do portal
        </h2>
        <Link
          href="/indice"
          className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:underline"
        >
          abrir o índice completo →
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EIXOS.map((eixo, indice) => {
          const arte = arteDoEixo(eixo.slug);
          return (
            <li
              key={eixo.slug}
              className="cp-hero-eixo"
              style={{ animationDelay: `${indice * 60}ms` }}
            >
              <Link
                href={portaDoEixo(eixo)}
                className="group relative flex min-h-44 flex-col justify-end overflow-hidden rounded-xl border border-border bg-surface-2 shadow-xs transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
              >
                {/* `next/image` não é usado de propósito: os arquivos são
                    estáticos, já comprimidos, e o `sizes` do card varia por
                    coluna; o otimizador do Next cobraria quota de imagem no
                    deploy e o ganho seria pequeno. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={arte.src}
                  alt={arte.alt}
                  loading="lazy"
                  width={1024}
                  height={600}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="relative p-3 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Eixo {indice + 1}
                  </p>
                  <p className="font-display text-lg font-bold leading-tight">{eixo.rotulo}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/90">
                    {eixo.descricao}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
