import { CheckCircle2 } from "lucide-react";

/**
 * @file "Em resumo" do post — o serviço antes do texto.
 *
 * POR QUE EXISTE: a matéria de serviço precisa responder em 15 segundos
 * (quantas vagas, quanto paga, até quando). O box repete o essencial em
 * frases curtas, e o corpo fica livre para o detalhe. É o mesmo padrão de
 * destaque do bloco Tema 1.280 em /jurisprudencia: borda, kicker e leitura
 * rápida sem quebrar a hierarquia do texto.
 */
export default function ResumoEssencial({ itens }: { itens?: string[] }) {
  if (!itens?.length) return null;

  return (
    <section
      aria-label="O essencial"
      className="my-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">O essencial</p>
      <ul className="mt-3 space-y-2">
        {itens.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-base sm:text-lg leading-relaxed text-foreground/90"
          >
            <CheckCircle2 size={17} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
