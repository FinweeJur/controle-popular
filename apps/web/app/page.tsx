import type { Metadata } from "next";

/**
 * Home da marca Controle Popular, na raiz do domínio.
 *
 * Antes vivia em `app/hub/` dentro do repo do Betim e chegava em `/` por
 * um rewrite, porque `controlepopular.vercel.app` era o domínio
 * auto-gerado do projeto Vercel do Betim e domínio `.vercel.app` não se
 * transfere entre projetos — então quem atendia a raiz era o Betim.
 *
 * Com o monorepo isso deixou de ser verdade: as três zonas são
 * diretórios do mesmo build e a raiz é uma rota como outra qualquer. O
 * `ForaDoHub`, que escondia o cabeçalho do Betim aqui, saiu junto — como
 * o próprio comentário dele previa.
 *
 * Os links para as zonas usam `<a>` cru, não o `<Link>` de zona: daqui
 * eles apontam para `/betim`, `/congresso` e `/judiciario`, que são
 * caminhos absolutos e não devem receber prefixo nenhum.
 */

export const metadata: Metadata = {
  title: "Controle Popular — dados públicos que dá para usar",
  description:
    "Transparência do orçamento e dos contratos de Betim-MG, monitoramento do que o Congresso Nacional decide sobre direitos, e quem ocupa cada cadeira do Judiciário. Portal independente.",
};

interface Secao {
  href: string;
  etiqueta: string;
  titulo: string;
  descricao: string;
  itens: string[];
  cor: string;
}

const SECOES: Secao[] = [
  {
    href: "/betim",
    etiqueta: "Municipal · Betim-MG",
    titulo: "Prefeitura e Câmara de Betim",
    descricao:
      "Para onde vai o dinheiro da cidade: contratos, fornecedores, orçamento, obras e a atuação de cada vereador — com serviços do dia a dia reunidos no mesmo lugar.",
    itens: [
      "Contratos e licitações com alertas de risco",
      "Ranking de atuação dos 23 vereadores",
      "Saúde, educação e economia em dados",
      "Farmácias de plantão, coleta de lixo, postos",
    ],
    cor: "var(--cp-primary)",
  },
  {
    href: "/congresso",
    etiqueta: "Federal · Congresso Nacional",
    titulo: "O que o Congresso decide sobre seus direitos",
    descricao:
      "Projetos de lei federais por tema, comissão e bancada, com uma análise fundamentada de quais direitos cada proposta amplia ou restringe — e o ofício pronto para você se manifestar.",
    itens: [
      "5.500+ proposições de 2026 acompanhadas",
      "Análise garantista × reducionista auditável",
      "Comissões e frentes parlamentares",
      "Gera ofício de apoio ou repúdio em PDF",
    ],
    cor: "var(--cp-accent)",
  },
  {
    href: "/judiciario",
    etiqueta: "Judiciário · Tribunais superiores",
    titulo: "Quem ocupa, quem indicou, quando vaga",
    descricao:
      "O único Poder cujos membros ninguém elege. Composição de cada tribunal, quem indicou cada ministro, e a data em que cada um é obrigado a se aposentar — calculada, não estimada.",
    itens: [
      "Data de aposentadoria de cada ministro (75 anos, por lei)",
      "Quantas cadeiras cada Presidente já indicou",
      "Toda indicação enviada ao Senado, aprovada ou rejeitada",
      "Origem de cada cadeira: carreira, OAB ou Ministério Público",
    ],
    cor: "var(--cp-secondary, #7c3aed)",
  },
];

export default function Hub() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="font-display text-[1.4em] font-bold tracking-tight">
          controlepopular<span className="text-primary">.br</span>
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Dados públicos que dá para usar
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Informação oficial sobre dinheiro público e sobre as leis que mexem com a sua
          vida, reunida e explicada. Portal independente, sem vínculo com nenhum governo,
          câmara ou partido.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SECOES.map((s) => (
          // <a> puro, não next/link: estes caminhos estão FORA do basePath
          // deste app (`/betim`), e o next/link prefixaria, gerando
          // `/betim/congresso`. É a mesma classe de bug que já mordeu aqui.
          <a
            key={s.href}
            href={s.href}
            className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
          >
            <span
              className="text-[.88em] font-semibold uppercase tracking-wide"
              style={{ color: s.cor }}
            >
              {s.etiqueta}
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
              {s.titulo}
            </h2>
            <p className="mt-2 text-[.95em] text-text-soft">{s.descricao}</p>
            <ul className="mt-4 space-y-1.5 text-[.9em] text-text-soft">
              {s.itens.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" style={{ color: s.cor }}>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <span className="mt-5 font-medium text-primary">Entrar →</span>
          </a>
        ))}
      </div>

      <section className="mt-12 rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold">Por que três portais</h2>
        <p className="mt-2 text-[.95em] text-text-soft">
          O poder público se divide em três frentes, e cada uma decide algo diferente: o
          dinheiro é executado na prefeitura e na câmara municipal, os direitos são
          definidos — e às vezes reduzidos — no Congresso, e é o Judiciário quem interpreta
          essas leis e resolve os conflitos, sem que ninguém tenha votado em quem ocupa
          essas cadeiras. Acompanhar só uma frente deixa boa parte da história de fora.
        </p>
      </section>

      <footer className="mt-10 space-y-2 text-[.85em] text-text-soft">
        <p>
          Todos os dados vêm de fontes oficiais e cada número mostra de onde saiu. As
          classificações de ampliação ou restrição de direitos seguem uma régua declarada
          e auditável, publicada na seção do Congresso; a data de aposentadoria de cada
          ministro segue a mesma disciplina, publicada na seção do Judiciário.
        </p>
      </footer>
    </div>
  );
}
