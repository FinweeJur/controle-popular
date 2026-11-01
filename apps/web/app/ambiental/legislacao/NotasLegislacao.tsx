import Link from "@/lib/ambiental/link";

/**
 * Notas de proveniência e metodologia do painel de legislação.
 * Extraído para reduzir `LegislacaoAmbientalIndex` (CodeScene).
 */
export default function NotasLegislacao() {
  return (
    <>
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem cada item</h2>
        <dl className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <div>
            <dt className="font-semibold text-text">ALMG — Assembleia Legislativa de MG (estadual)</dt>
            <dd>
              Leis, decretos e leis complementares do Legislativo e do Executivo estaduais. As normas
              aqui vêm das ~2.500 &quot;normas básicas&quot; publicadas pela própria ALMG, filtradas
              localmente pelo tema oficial &quot;Meio Ambiente&quot; que a ALMG já atribui a cada uma.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Semad — Banco de Legislação Ambiental (estadual)</dt>
            <dd>
              Cobre o que a ALMG não tem: Deliberação Copam, Portaria IEF, Portaria Igam, Resolução
              Conjunta dos órgãos do Sisema — atos administrativos, não leis da Assembleia.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Siam — arquivo histórico (estadual)</dt>
            <dd>
              Sistema de legislação ambiental mais antigo da Semad, cobrindo até 2024. Soma um volume
              maior e um identificador (idNorma) que as outras duas fontes não têm.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">MMA — legislação ambiental federal, inclusive Conama</dt>
            <dd>
              Catálogo de dados abertos do Ministério do Meio Ambiente e Mudança do Clima (licença
              Creative Commons Atribuição): leis, decretos, portarias do Ibama e do ICMBio, instruções
              normativas e as Resoluções Conama. Cada norma traz a situação declarada pela fonte
              (vigente, revogada, ato exaurido), mostrada no card.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">CNDH — resoluções e recomendações (federal)</dt>
            <dd>
              Conselho Nacional dos Direitos Humanos, nas duas plataformas em que publica. Licença
              Creative Commons Atribuição-SemDerivações: a ementa é{" "}
              <strong className="font-semibold text-text">citação literal</strong> do CNDH, nunca
              reescrita. Inclui a Resolução nº 1/2019, sobre a missão emergencial a Brumadinho.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Direito Crítico Popular (nacional e internacional)</dt>
            <dd>
              Carga inicial curada em torno de barragens e populações atingidas (Mariana, Brumadinho,
              o Movimento dos Atingidos por Barragens).
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[.9em] text-text-soft">
          O que ainda falta: legislação{" "}
          <strong className="font-semibold text-text">municipal</strong> — as leis ambientais das
          câmaras de vereadores não entraram nesta busca. A esfera já está reservada no banco e no
          filtro por esfera; fica dito aqui em vez de a lacuna passar despercebida.
        </p>
        <p className="mt-3 text-[.9em] text-text-soft">
          Tombamento de patrimônio cultural é o mesmo tipo de restrição territorial que a legislação
          ambiental impõe, mas não é norma — é registro de bem protegido. Por isso tem acervo próprio:{" "}
          <Link href="/patrimonio-cultural" className="text-accent hover:underline">
            153 bens tombados pelo IEPHA-MG →
          </Link>
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Como o tema de cada item é decidido</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          A ALMG é a única fonte estadual que atribui, a cada norma, uma taxonomia oficial própria (o
          campo &quot;indexação&quot; da sua API de dados abertos). Os 9 temas estaduais do filtro
          nasceram de ramos reais dessa taxonomia, cruzados com palavra-chave auditável na ementa.
          Semad e Siam não publicam taxonomia equivalente — para essas normas o tema vem só de
          palavra-chave, indício de conteúdo, não afirmação oficial.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          O MMA publica taxonomia própria por norma, mas é um vocabulário plano, diferente da árvore
          da ALMG, e o classificador não sabe traduzir um no outro — então as normas federais também
          recebem tema só por palavra-chave na ementa.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Os 6 temas exclusivos da legislação nacional/internacional não têm campo de tema na fonte —
          cada atribuição saiu da leitura do texto de cada lei/precedente{" "}
          <strong className="font-semibold text-text">feita com auxílio de inteligência artificial</strong>
          , registrada linha a linha em{" "}
          <code className="font-mono text-[.85em]">etl/temas_direito_critico.py</code>, com o trecho
          que sustenta cada tema. É curadoria assistida por máquina, não leitura humana de ponta a
          ponta, e <strong className="font-semibold text-text">está em revisão</strong>.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          O tema &quot;Proteção de serras&quot; usa o mesmo slug nos dois vocabulários de propósito.
          Os temas parecidos entre si continuam com slugs distintos porque o método por trás de cada um
          é diferente.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Esta página dizia, até 13/08/2026, que a atribuição de tema do acervo nacional/internacional
          vinha de &ldquo;leitura humana&rdquo;. Não vinha, e a correção está aqui em vez de sumir no
          histórico.
        </p>
      </section>
    </>
  );
}
