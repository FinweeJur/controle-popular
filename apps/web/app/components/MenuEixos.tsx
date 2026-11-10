import Link from "next/link";
import { EIXOS, portaDoEixo } from "@/lib/navegacao/mapa";

/**
 * Porta do mapa de navegação dentro do menu da barra superior.
 *
 * POR QUE EXISTE
 *
 * O menu superior abria direto na curadoria dos 4 eixos antigos. Quem não conhece
 * a curadoria ficava sem entrada. Este bloco põe os 9 eixos do mapa na primeira
 * linha do menu, com atalho para a árvore completa — e a curadoria continua
 * abaixo, intacta.
 *
 * Fica em componente próprio porque o TopNav é grande e o CodeScene barra
 * arquivo que cresce sem necessidade.
 */
export default function MenuEixos({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="mb-3 rounded-xl border border-border/70 bg-surface-2/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.85em] font-bold uppercase tracking-wider text-text-soft">
          Navegue por eixo
        </p>
        <Link
          href="/indice"
          onClick={onFechar}
          className="text-[0.85em] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:underline"
        >
          ver a árvore completa →
        </Link>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {EIXOS.map((eixo) => (
          <li key={eixo.slug}>
            <Link
              href={portaDoEixo(eixo)}
              onClick={onFechar}
              title={
                eixo.estado === "proposta"
                  ? `${eixo.rotulo} — porta em construção; abre pela frente publicada`
                  : eixo.rotulo
              }
              className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[0.85em] font-medium text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {eixo.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
