import type { Metadata } from "next";
// `next/link` DIRETO, e não o `<Link>` de zona: esta página mora na RAIZ do
// domínio, então todo caminho interno daqui já é absoluto (mesma razão
// documentada em `app/termos/page.tsx`).
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/politica-de-ia` — política de uso de inteligência artificial do portal.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * O portal usa modelos de linguagem para ler texto não estruturado. A regra
 * editorial do projeto (`AGENTS.md` §7) diz que "o modelo, se houver, só
 * embrulha" e manda rotular resumo de modelo. Sem um documento que declare
 * onde a IA entra e onde não entra, o leitor não consegue saber o que é
 * leitura direta de fonte oficial e o que passou por modelo.
 *
 * ═══ REFERÊNCIA E INSPIRAÇÃO ═══
 *
 * A estrutura e os princípios foram inspirados na política de uso de IA do
 * Brasil de Fato — veículo de imprensa popular. O texto abaixo é adaptado ao
 * portal, não é cópia: o Brasil de Fato faz jornalismo; aqui o objeto é
 * republicar dado público e separar o que o modelo extrai do que o programa
 * calcula. Referência citada no fim, como inspiração.
 * https://www.brasildefato.com.br/politica-de-uso-de-inteligencias-artificiais/
 *
 * ═══ DECISÕES DE CONSTRUÇÃO ═══
 *
 * Fica na RAIZ, fora das zonas, porque o assunto é o portal inteiro — mesma
 * escolha de `app/termos/page.tsx` e `app/sobre/page.tsx`. `<main>` explícito
 * porque não há `layout.tsx` de zona aqui: sem ele o botão global "Ouvir esta
 * página" (`OuvirPagina.tsx`) não acha conteúdo.
 */
export const metadata: Metadata = metadataEditavel("/politica-de-ia", {
  title: "Política de uso de IA — Controle Popular",
  description:
    "Onde o Controle Popular usa inteligência artificial, a separação entre o que o modelo extrai e o que o programa calcula, como o conteúdo assistido por IA é rotulado — e o que a IA nunca faz neste portal.",
});

export default function PoliticaDeIaPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Política de uso de IA</span>
      </nav>

      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Política de uso de inteligência artificial
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Este portal usa inteligência artificial para{" "}
          <strong className="text-text">ler texto</strong> — nunca para escrever
          número. Esta página explica onde a IA entra, onde ela não entra, e como
          o leitor identifica quando um conteúdo passou por modelo.
        </p>
        <p className="text-sm text-text-soft">
          Última revisão: setembro de 2026. O portal está em revisão permanente.
        </p>
      </header>

      {/* ═══ 1. O MODELO EXTRAI, O PROGRAMA CALCULA ═══ */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold">
          O modelo extrai, o programa calcula
        </h2>
        <p className="text-text-soft">
          É a regra que organiza o projeto inteiro. O modelo de linguagem recebe
          tarefa de <strong className="text-text">extração</strong>: apontar
          quais campos existem num documento, de qual trecho saiu cada
          informação, com que confiança. O{" "}
          <strong className="text-text">rótulo e o número final</strong> não saem
          do modelo: são aritmética sobre esse formulário, feita por código
          determinístico e reexecutável.
        </p>
        <p className="text-text-soft">
          A analogia é a do escrivão e do juiz: o modelo é escrivão, preenche
          campos fechados e anota a fonte de cada linha; o rótulo é aplicado
          depois por regra fixa. Isso não torna a IA inofensiva —{" "}
          <strong className="text-text">
            se a extração erra, o cálculo a partir dela também erra
          </strong>
          . Por isso item de confiança baixa fica marcado como{" "}
          <strong className="text-text">&ldquo;requer revisão humana&rdquo;</strong>{" "}
          e sai dos rankings de alerta, mesmo continuando publicado ao lado da
          ressalva.
        </p>
      </section>

      {/* ═══ 2. PARA QUE A IA É USADA ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Para que a IA é usada
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-[.95em] text-text-soft">
          <li>
            <strong className="text-text">Extração de campos</strong> de
            documento não estruturado — ementa de lei, inteiro teor de projeto,
            objeto de contrato — para colunas que o código então soma e filtra.
          </li>
          <li>
            <strong className="text-text">Classificação de texto</strong> em
            categorias fechadas, sempre citando o dispositivo e o trecho literal
            que sustentam cada apontamento.
          </li>
          <li>
            <strong className="text-text">Microresumos</strong> de acervo longo,
            rotulados como gerados por máquina, com data e modelo.
          </li>
          <li>
            <strong className="text-text">Assistência de desenvolvimento</strong>{" "}
            na manutenção do repositório, inclusive na escrita deste portal.
          </li>
        </ul>
        <p className="rounded-lg border border-border bg-surface-2 p-4 text-[.9em] text-text-soft">
          <strong className="text-text">Nenhum número é escrito por modelo.</strong>{" "}
          O assistente de conversa responde só com o contexto que vem do banco. O
          que a IA faz é transformar texto em campos — e o código calcula a
          partir deles.
        </p>
      </section>

      {/* ═══ 3. O QUE A IA NUNCA FAZ ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          O que a IA nunca faz aqui
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-[.95em] text-text-soft">
          <li>
            <strong className="text-text">Escrever número ou total.</strong> Todo
            número publicado vem de fonte oficial ou de cálculo determinístico,
            nunca de geração de texto.
          </li>
          <li>
            <strong className="text-text">Assinar conteúdo.</strong> As decisões
            editoriais — o que publicar, como interpretar, quais ressalvas
            incluir — são sempre de pessoas.
          </li>
          <li>
            <strong className="text-text">Decidir o rótulo.</strong> O selo de
            garantista, reducionista ou qualquer outro é aritmética sobre o
            formulário extraído, não opinião do modelo.
          </li>
          <li>
            <strong className="text-text">Preencher lacuna de apuração.</strong>{" "}
            Quando a fonte não tem o dado, a tela diz que não tem — o modelo não
            completa o vazio com aproximação silenciosa.
          </li>
        </ul>
      </section>

      {/* ═══ 4. COMO IDENTIFICAR CONTEÚDO ASSISTIDO POR IA ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Como identificar conteúdo assistido por IA
        </h2>
        <p className="text-text-soft">
          Quando um resumo ou classificação é gerado por modelo, ele aparece com{" "}
          <strong className="text-text">data e nome do modelo</strong> na própria
          tela — o componente é `RessalvaIa`. A regra é do projeto:{" "}
          <strong className="text-text">
            resumo de modelo é o portal afirmando algo
          </strong>
          , e por isso nunca vai sem rótulo, nem apresentado como conclusão do
          autor do documento.
        </p>
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-[.9em] text-accent">
          <strong>Resposta gerada por IA</strong> — rotulada com data e modelo, e
          com o convite a conferir a fonte oficial antes de decidir.
        </p>
      </section>

      {/* ═══ 5. PROTEÇÃO DE DADOS PESSOAIS ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Dado pessoal nunca vai a prompt
        </h2>
        <p className="text-text-soft">
          O portal publica ato oficial que às vezes traz dado pessoal dentro
          dele. Esse dado{" "}
          <strong className="text-text">
            não é enviado a ferramenta de IA
          </strong>{" "}
          — nem pública, nem comercial. A varredura remove CPF e documento de
          identificação antes de qualquer processamento, e a triagem de acervo
          roda com regra própria, nunca por prompt.
        </p>
        <p className="text-text-soft">
          É a mesma assimetria declarada no{" "}
          <Link href="/termos" className="text-primary hover:text-accent">
            termo de uso
          </Link>
          : o nome de quem assina ato público permanece, o número que serve para
          cruzar cadastros sai. Dado pessoal que precise ser tratado passa pelo
          canal reservado, descrito naquele termo.
        </p>
      </section>

      {/* ═══ 6. DIREITOS AUTORAIS E TRANSPARÊNCIA ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Direitos autorais, fonte e transparência
        </h2>
        <p className="text-text-soft">
          Todo registro publicado aponta para a fonte oficial específica, com
          autor e data, e um botão &ldquo;Fonte&rdquo;. Quando a licença da fonte
          é restritiva, o portal guarda só link e título — nunca reescreve nem
          resume o texto protegido. Licença de terceiro continua valendo depois
          que o dado passa por aqui.
        </p>
        <p className="text-text-soft">
          O código do portal é livre, sob AGPL-3.0-or-later. O método — o que o
          modelo extrai, o que o código calcula, a taxa de erro — está explicado
          em{" "}
          <Link href="/sobre#metodologia" className="text-primary hover:text-accent">
            metodologia
          </Link>
          .
        </p>
      </section>

      {/* ═══ 7. REVISÃO PERMANENTE E CONTATO ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Revisão permanente — e como falar com o projeto
        </h2>
        <p className="text-text-soft">
          Este portal está em{" "}
          <strong className="text-text">revisão permanente</strong>. Não é um
          estado transitório que termina numa data marcada: é a condição de um
          projeto que usa IA e pede para ser conferido. Erro apontado por quem
          lê é bem-vindo.
        </p>
        <p className="text-text-soft">
          Achou conteúdo gerado por IA sem o rótulo? Encontrou número que não
          confere com a fonte?{" "}
          <a
            href="mailto:contato@controlepopular.com.br"
            className="text-primary hover:text-accent"
          >
            contato@controlepopular.com.br
          </a>
          {" "}ou o{" "}
          <a
            href="https://github.com/FinweeJur/controle-popular/issues"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:text-accent"
          >
            repositório público ↗
          </a>
          . Para dado pessoal, use o e-mail — não a via pública.
        </p>
      </section>

      <footer className="space-y-2 border-t border-border pt-6 text-[.9em] text-text-soft">
        <p>
          Estrutura e princípios inspirados na{" "}
          <a
            href="https://www.brasildefato.com.br/politica-de-uso-de-inteligencias-artificiais/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:text-accent"
          >
            política de uso de IA do Brasil de Fato ↗
          </a>
          , adaptada ao Controle Popular. Não é cópia: o texto acima descreve a
          prática deste portal.
        </p>
        <p>Última revisão desta página: setembro de 2026.</p>
      </footer>

      <FooterGlobal />
    </main>
  );
}
