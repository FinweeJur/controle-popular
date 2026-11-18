import { ChevronDown, FileText } from "lucide-react";
import transcricao from "@/data/transcricoes/comissao-direitos-humanos.json";

/**
 * @file Transcrição revisada, em sanfona, no fim do post.
 *
 * Por que sanfona: são ~1.500 palavras. Abertas por padrão, empurrariam o
 * crédito e as fontes para longe. Fechadas, continuam a um clique.
 *
 * `<details>/<summary>` é nativo: funciona sem JavaScript, é lido por leitor
 * de tela e não vira estado de cliente (regra da casca persistente).
 *
 * O texto aqui NÃO é o .txt bruto. É a revisão que removeu "né", "então",
 * "aí" e corrigiu palavras da transcrição automática. O áudio e o .txt
 * original continuam linkados em "fontes oficiais", para auditoria.
 */

interface Bloco {
  quem: string;
  texto: string;
}

interface Secao {
  titulo: string;
  blocos: Bloco[];
}

interface Transcricao {
  slug: string;
  titulo: string;
  nota: string;
  secoes: Secao[];
}

const DADOS = transcricao as Transcricao;

export default function TranscricaoAcordeao({ slug }: { slug: string }) {
  if (slug !== DADOS.slug) return null;

  return (
    <details className="group my-8 rounded-2xl border border-border bg-surface shadow-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6">
        <span className="flex items-center gap-2">
          <FileText size={16} className="text-primary" aria-hidden="true" />
          <span className="font-display text-base font-bold text-foreground">
            {DADOS.titulo}
          </span>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
            {DADOS.secoes.length} seções · 15 min 43 s
          </span>
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-border p-5 sm:p-6">
        <p className="mb-6 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted">
          {DADOS.nota}
        </p>

        <div className="space-y-7">
          {DADOS.secoes.map((secao) => (
            <section key={secao.titulo}>
              <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-primary">
                {secao.titulo}
              </h3>
              <div className="space-y-3">
                {secao.blocos.map((bloco, i) => (
                  <div key={`${secao.titulo}-${i}`} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-xs font-semibold text-foreground">{bloco.quem}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{bloco.texto}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}
