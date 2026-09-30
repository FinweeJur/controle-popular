"use client";

/**
 * "Achou erro? Aponte a fonte" — canal de correção do dado, no rodapé.
 *
 * ═══ O QUE É ═══
 *
 * Dois botões que abrem um relato de erro já preenchido com a página atual:
 * um por e-mail (funciona para qualquer pessoa, sem conta) e um que abre uma
 * issue no GitHub (para quem prefere o rastro público).
 *
 * ═══ POR QUE EXISTE ═══
 *
 * O portal publica ato oficial e dado público, e número errado é dano. Quem
 * encontra o erro precisa de um caminho curto para avisar — e o aviso vale
 * mais quando vem com a FONTE correta, não só com a reclamação. Por isso o
 * texto pré-preenchido já pede a página, o que está errado e a fonte oficial
 * que corrige.
 *
 * ═══ PORQUE NO CLIENTE ═══
 *
 * A URL e o título da página só existem no navegador. As URLs de e-mail e de
 * issue são montadas no clique — assim não há divergência de hidratação e
 * nada é enviado sem a pessoa concluir o envio.
 */

const REPO = "https://github.com/FinweeJur/controle-popular";
const EMAIL = "contato@controlepopular.com.br";

export default function ReportarErro() {
  /** Abre o cliente de e-mail com o relato pré-preenchido. */
  function porEmail() {
    const url = window.location.href;
    const titulo = document.title;
    const assunto = `Erro em ${url}`;
    const corpo = [
      `Página: ${url}`,
      `Título: ${titulo}`,
      "",
      "O que está errado:",
      "[descreva o erro: número, data, nome ou link]",
      "",
      "Fonte oficial que corrige (se souber):",
      "[link da fonte oficial]",
      "",
      "Sugestão: anexe ou cole o trecho da página com o problema.",
    ].join("\n");
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  }

  /** Abre uma issue nova no repositório, já preenchida. */
  function porGithub() {
    const url = window.location.href;
    const titulo = `Erro na página: ${document.title}`;
    const corpo = [
      `**Página:** ${url}`,
      "",
      "**O que está errado:**",
      "",
      "**Fonte oficial que corrige:**",
      "",
      "**Como eu vi o erro:**",
    ].join("\n");
    const destino = `${REPO}/issues/new?labels=correcao&title=${encodeURIComponent(titulo)}&body=${encodeURIComponent(corpo)}`;
    window.open(destino, "_blank", "noopener,noreferrer");
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <button
        type="button"
        onClick={porEmail}
        className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
        title="Abrir o e-mail com o relato já preenchido"
      >
        ⚠️ Achou erro? Aponte a fonte
      </button>
      <button
        type="button"
        onClick={porGithub}
        className="text-xs text-text-soft underline hover:text-primary"
        title="Abrir uma issue no GitHub"
      >
        ou relate no GitHub
      </button>
    </span>
  );
}
