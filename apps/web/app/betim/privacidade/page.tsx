export const metadata = {
  title: "Política de Privacidade — Controle Popular Betim",
  description:
    "Como o Controle Popular Betim trata dados pessoais, em conformidade com a LGPD (Lei 13.709/2018).",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="mb-2 text-2xl font-display font-bold text-text">
        Política de Privacidade
      </h1>
      <p className="mb-8 text-sm text-text-soft">
        Em conformidade com a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018 — LGPD).
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          1. Dados públicos governamentais
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          A maior parte do conteúdo do Controle Popular Betim é composta por dados públicos
          já divulgados por órgãos oficiais (contratos, licitações, despesas,
          atividade legislativa, indicadores). Quando esses dados
          mencionam pessoas físicas em função pública (por exemplo,
          agentes públicos ou vereadores no exercício do mandato), o
          tratamento se baseia no interesse público da transparência e nas
          hipóteses legais de tratamento previstas na LGPD (art. 7º, incisos
          II, III e IX), sem finalidade de exposição indevida. Documentos
          pessoais como CPF são exibidos apenas quando a própria fonte
          oficial já os divulga de forma parcialmente mascarada (por
          exemplo, doações de campanha do TSE), nunca em texto completo.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          2. Dados que coletamos diretamente
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-text-soft">
          Quando disponíveis, os seguintes recursos do site coletam dados
          fornecidos voluntariamente pelo usuário:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-soft">
          <li>
            <strong>Newsletter:</strong> endereço de e-mail, com confirmação
            de inscrição (double opt-in) e link de cancelamento em toda
            mensagem enviada.
          </li>
          <li>
            <strong>Cadastro de estabelecimentos (Zap Betim) e anúncios
            classificados:</strong> nome do negócio, número de WhatsApp e
            descrição — informações que o próprio usuário opta por publicar
            publicamente no diretório.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-text-soft">
          Não solicitamos nem armazenamos CPF, RG, dados bancários ou
          quaisquer documentos pessoais dos usuários do site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          3. Cookies e analytics
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          Podemos utilizar ferramentas de análise de audiência (como
          Vercel Analytics) para entender o uso agregado e anônimo do site.
          Essas ferramentas não têm como objetivo identificar
          individualmente os visitantes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          4. Compartilhamento
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          Não vendemos nem compartilhamos dados pessoais com terceiros para
          fins de marketing. Dados de contato voluntariamente publicados em
          diretórios (como o Zap Betim) são exibidos publicamente por opção
          do próprio usuário no momento do cadastro.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-display font-semibold text-text">
          5. Seus direitos e contato
        </h2>
        <p className="text-sm leading-relaxed text-text-soft">
          Você pode solicitar a qualquer momento a confirmação, correção,
          anonimização ou exclusão de dados pessoais tratados pelo Controle Popular Betim,
          nos termos do art. 18 da LGPD. Para exercer esses direitos ou
          tirar dúvidas sobre esta política, utilize o canal de contato
          divulgado no rodapé do site.
        </p>
      </section>
    </div>
  );
}
