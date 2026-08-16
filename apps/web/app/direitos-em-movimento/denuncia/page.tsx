import type { Metadata } from "next";
import { listarCidades } from "@/lib/db/queries/municipios";
import Facilitador from "./Facilitador";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/direitos-em-movimento/denuncia` — porta "Como denunciar", 4 de 4, e a
 * ÚNICA feature nova de `docs/PLANO-ACAO-CIDADA.md` (as outras três portas
 * de `/direitos-em-movimento` são navegação para o que já existe).
 *
 * O requisito que decide a arquitetura inteira: o documento nasce NO
 * NAVEGADOR da pessoa e nunca toca o servidor. Por isso:
 *  - nenhuma rota `route.din.ts` deste site recebe o texto da denúncia;
 *  - `Facilitador` (a entrevista) é um componente cliente comum, importado
 *    aqui direto — igual a `FormularioOficio` em
 *    `app/congresso/proposicoes/[id]/oficio/page.tsx`;
 *  - só o passo final, `BaixarDocumento`, é carregado com
 *    `next/dynamic({ ssr: false })` DE DENTRO de `Facilitador.tsx` — é ele
 *    quem importa `docx` OU `pdf-lib` via `await import()`, um por clique,
 *    só nesse momento.
 *
 * `listarCidades()` roda aqui, no servidor, pela mesma razão de
 * `AjudaPage`: o passo "onde foi" e a sugestão de destino (`roteiro.ts` +
 * `lib/betim/redeProtecao.ts`) precisam da `Cidade` inteira (com
 * `fontes`), sem outra ida ao banco depois que a pessoa já está no meio da
 * entrevista.
 */
export const metadata: Metadata = metadataEditavel("/direitos-em-movimento/denuncia", {
  title: "Como denunciar — Direitos em Movimento | Controle Popular",
  description:
    "Um passo a passo guiado para registrar uma violação de direitos humanos. O documento nasce no seu navegador e nunca é enviado a este ou a qualquer outro servidor.",
});

export default async function DenunciaPage() {
  const cidades = await listarCidades();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        ·{" "}
        <a href="/direitos-em-movimento" className="hover:text-primary">
          Direitos em Movimento
        </a>{" "}
        · <span className="text-text">Como denunciar</span>
      </nav>

      {/* Preservado tal como estava na versão "em construção" desta porta:
          quem chega em situação de urgência precisa achar um telefone
          antes de qualquer explicação — inclusive antes do facilitador
          abaixo, que é documento, não medida imediata. */}
      <div className="mt-6 rounded-2xl border-2 p-6" style={{ borderColor: "var(--cp-alert)" }}>
        <p className="font-display text-lg font-semibold text-text">
          Precisa de ajuda agora? Ligue — o facilitador abaixo gera um documento, não uma medida
          imediata.
        </p>
        <ul className="mt-3 space-y-1.5 text-[.95em] text-text">
          <li>
            <strong>190</strong> — Polícia Militar, emergência em curso
          </li>
          <li>
            <strong>180</strong> — violência contra a mulher, 24h
          </li>
          <li>
            <strong>100</strong> — Disque Direitos Humanos (crianças, idosos, LGBTfobia,
            racismo e mais), 24h
          </li>
        </ul>
        <p className="mt-3 text-[.9em] text-text-soft">
          Para defesa jurídica gratuita, Ministério Público, delegacias especializadas e mais,
          veja{" "}
          <a href="/direitos-em-movimento/ajuda" className="font-medium text-primary hover:underline">
            Onde buscar ajuda
          </a>{" "}
          — não depende deste facilitador.
        </p>
      </div>

      <header className="mt-10 space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Como denunciar</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Um passo a passo guiado — pergunta por pergunta, não um formulário em branco — que
          ajuda a registrar o que aconteceu, sugere que prova reunir e para onde mandar, e
          entrega um documento pronto (.docx ou .pdf) para levar à Defensoria, a um advogado ou
          ao NAJUP.
        </p>
        <p className="max-w-2xl text-[.92em] text-text-soft">
          O documento nasce no seu navegador e nunca é enviado a este ou a qualquer outro
          servidor — nem como rascunho, nem no final. Não existe botão &quot;enviar&quot;, só
          &quot;baixar&quot;.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <Facilitador cidades={cidades} />
      </section>
    </main>
  );
}
