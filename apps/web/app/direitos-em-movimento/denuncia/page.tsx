import type { Metadata } from "next";

/**
 * `/direitos-em-movimento/denuncia` — porta "Como denunciar", 4 de 4.
 *
 * A ÚNICA das quatro portas que é feature nova de verdade — as outras três
 * são navegação para o que já existe (ver `docs/PLANO-DIREITOS-EM-
 * MOVIMENTO.md`). O desenho inteiro já está escrito em
 * `docs/PLANO-ACAO-CIDADA.md`: entrevista guiada, não formulário; roteamento
 * determinístico de destino a partir das respostas; e o requisito que
 * decide a arquitetura toda — o `.docx` nasce NO NAVEGADOR da pessoa e
 * nunca toca o servidor (mesmo padrão de `lib/congresso/oficio/
 * render-binario.ts`: `await import()` de `docx`/`pdf-lib`, sem rota
 * `.din.ts` recebendo o texto da denúncia).
 *
 * ESTA TELA É HONESTA DE PROPÓSITO, NÃO UM LINK MORTO: construir metade de
 * um facilitador de denúncia de violação de direitos humanos é pior do que
 * não construir — a pessoa entra achando que tem ajuda estruturada e sai
 * com um roteamento pela metade, sem a garantia de privacidade que é o
 * requisito não negociável do plano. Então esta página diz o que existe
 * (nada ainda), o que está desenhado, e manda quem precisa de ajuda AGORA
 * para os canais que já funcionam — a porta "Onde buscar ajuda" e os
 * números de plantão, que não dependem deste facilitador existir.
 */
export const metadata: Metadata = {
  title: "Como denunciar — Direitos em Movimento | Controle Popular",
  description:
    "Ainda em construção. O que este passo a passo vai fazer, por que ainda não existe, e para onde ir agora se você precisa de ajuda.",
};

export default function DenunciaPage() {
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

      {/* Se você está em situação de urgência, isto vem ANTES de qualquer
          explicação sobre o que falta construir — ninguém deveria ter que
          ler um aviso de "em construção" até o fim para achar um telefone. */}
      <div className="mt-6 rounded-2xl border-2 p-6" style={{ borderColor: "var(--cp-alert)" }}>
        <p className="font-display text-lg font-semibold text-text">
          Precisa de ajuda agora? Não espere este facilitador — ele não existe ainda.
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
          — essa porta já funciona hoje.
        </p>
      </div>

      <header className="mt-10 space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-alert)" }}
        >
          Em construção
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Como denunciar</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Esta porta ainda não existe. Em vez de um link morto ou de um facilitador pela
          metade, esta página diz exatamente o que está planejado, por que ainda não foi
          construído, e o que já funciona enquanto isso.
        </p>
      </header>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl font-semibold">O que vai existir</h2>
        <p className="text-text-soft">
          Um facilitador guiado — pergunta por pergunta, não formulário em branco — que ajuda
          a registrar uma violação de direitos humanos, sugere que prova reunir e para onde
          mandar, e entrega um documento pronto (.docx) para levar à Defensoria, a um
          advogado ou ao NAJUP.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Por que a privacidade decide tudo aqui
        </h2>
        <p className="text-text-soft">
          Quem denuncia violação de direitos humanos pode estar em risco. Um rascunho salvo em
          servidor é prova contra a pessoa — obtível por intimação, vazamento ou apreensão. Se
          a denúncia é contra um agente do Estado, um portal de transparência é exatamente o
          tipo de lugar que esse agente saberia pedir para investigar.
        </p>
        <p className="text-text-soft">
          Por isso o requisito não é negociável: o documento tem que nascer{" "}
          <strong className="text-text">no navegador da própria pessoa</strong>, sem passar
          pelo servidor em nenhum momento — nenhuma rota deste site vai receber o texto da
          denúncia. O projeto já resolveu esse problema uma vez, para o ofício ao Congresso
          (gerado em PDF/DOCX só no navegador de quem clica em &quot;baixar&quot;); o plano
          reusa o mesmo caminho, porque é a única forma da garantia ser verdadeira em vez de
          prometida.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl font-semibold">O que falta, concretamente</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-text-soft">
          <li>O roteiro de entrevista (quando começou, continua acontecendo, onde foi, quem está envolvido, o que aconteceu, provas)</li>
          <li>A geração do .docx no navegador, reusando o padrão já usado no ofício ao Congresso</li>
          <li>O roteamento de sugestão de destino a partir das respostas — nunca do texto livre, para não inventar um encaminhamento que a resposta não sustenta</li>
          <li>A tela de aviso de privacidade e o rascunho local opt-in, com expiração e botão de apagar sempre visível</li>
        </ul>
        <p className="text-[.9em] text-text-soft">
          O desenho completo, pergunta a pergunta, está escrito em{" "}
          <code className="font-mono text-[.85em]">docs/PLANO-ACAO-CIDADA.md</code> — inclusive
          o motivo de cada decisão de privacidade e o que fazer quando a resposta é ambígua.
        </p>
      </section>
    </main>
  );
}
