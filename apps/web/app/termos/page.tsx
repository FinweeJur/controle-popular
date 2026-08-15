import type { Metadata } from "next";
// `next/link` DIRETO, e não o `<Link>` de zona (`lib/link-zona.tsx`): esta
// página mora na RAIZ do domínio, então todo caminho interno daqui já é
// absoluto. Passar por um wrapper de zona geraria `/betim/sobre` a partir de
// `/sobre` — a classe de 404 mudo que `lib/link-zona.tsx` registra ter
// acontecido três vezes. `<a>` cru também não serve: o lint do Next
// (`no-html-link-for-pages`) reprova, e com razão, porque perde o
// pré-carregamento da rota.
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/termos` — termo de uso e origem dos dados.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE, E POR QUE AGORA ═══
 *
 * Em 15/08/2026 um CPF de pessoa física foi publicado no repositório PÚBLICO
 * deste projeto, dentro da ementa oficial de uma portaria do IBAMA que delega
 * competência para firmar TAC (`etl/betim/dados/legislacao-mma.json`). Uma
 * ocorrência em 8.940 normas federais — o número que faz conferência manual
 * passar batido. A trava automática pegou (`ef9afe7` criou as três camadas),
 * o commit `7b9c9db` removeu, e a limpeza foi para a origem
 * (`redigir_documentos`, em `etl/betim/etl/apis/_legislacao_ambiental.py`).
 *
 * O episódio é a tese da página inteira: **o portal republica ato oficial, e
 * ato oficial às vezes traz dado pessoal dentro dele.** Sem um documento que
 * diga isso e sem canal declarado, a pessoa citada não tem para onde escrever.
 *
 * ═══ POR QUE NÃO É UMA QUARTA PÁGINA DE PRIVACIDADE ═══
 *
 * Já existem duas — `/judiciario/privacidade` e `/[municipio]/privacidade` — e
 * as duas respondem a OUTRA pergunta: o que o site não coleta de QUEM VISITA
 * (sem login, sem rastreador, sem publicidade). Esta trata do lado oposto: o
 * dado de quem APARECE no conteúdo publicado, que nunca visitou o site e não
 * escolheu estar nele. São documentos diferentes; esta referencia aquelas em
 * vez de repeti-las, porque texto duplicado em três lugares diverge —
 * é o mesmo raciocínio de `lib/zonas.ts` e de `FooterGlobal.tsx`.
 *
 * ═══ DECISÕES DE CONSTRUÇÃO ═══
 *
 * FICA NA RAIZ, fora das zonas (mesmo motivo de `app/sobre/page.tsx` e
 * `app/busca/page.tsx`): o assunto é o portal inteiro. É também a página que
 * o rodapé de TODA zona precisa alcançar — o link "Termos" do eixo Cidades
 * dava 404 desde sempre e foi REMOVIDO na auditoria de hiperlinks de 13/08
 * justamente por não ter destino. Este é o destino que faltava; o link volta
 * pelo `FooterGlobal.tsx`, que já renderiza `<a>` cru para rota de raiz.
 *
 * SEM CONSULTA A BANCO, de propósito. A Neon está em HTTP 402 até 01/09 e
 * todo o resto do trabalho de hoje está travado por isso. Uma página de termo
 * que dependesse de build com banco seria a única do portal que fica no ar
 * exatamente quando não pode: no dia em que houve incidente de dado pessoal.
 *
 * NENHUMA LISTA DE FONTES É REPETIDA AQUI. Os `docs/FONTES-*.md` (5 arquivos,
 * contados em 15/08) são a fonte de verdade e mudam toda semana; uma cópia
 * nesta página envelheceria em duas semanas e passaria a mentir com aparência
 * de documento oficial. A página aponta para eles no GitHub.
 *
 * `<main>` explícito porque não há `layout.tsx` de zona aqui — sem ele o botão
 * global "Ouvir esta página" (`OuvirPagina.tsx`) não acha conteúdo. Mesma nota
 * de `app/sobre/page.tsx` e `app/busca/page.tsx`.
 */
export const metadata: Metadata = metadataEditavel("/termos", {
  title: "Termo de uso e origem dos dados — Controle Popular",
  description:
    "De onde vem cada dado publicado, com que base legal, sob qual licença, o que o portal mascara antes de publicar — e como pedir correção ou remoção se você aparece no conteúdo.",
});

const GH = "https://github.com/FinweeJur/controle-popular/blob/main";

/**
 * Os `docs/FONTES-*.md` do repositório, em ordem alfabética de arquivo.
 *
 * Cada linha diz o que o documento cobre em UMA frase — não o que ele contém.
 * A diferença importa: a lista de fontes de cada documento cresce a cada
 * coleta, o escopo dele não. É o que permite esta página não envelhecer junto.
 */
const DOCS_DE_FONTES = [
  {
    arquivo: "FONTES-BIBLIOTECA-ATI.md",
    escopo:
      "acervo das Assessorias Técnicas Independentes do Paraopeba (AEDAS, Guaicuy, Nacab)",
  },
  {
    arquivo: "FONTES-BRUMADINHO-UFMG.md",
    escopo: "Plataforma Brumadinho da UFMG e o acervo do processo coletivo",
  },
  {
    arquivo: "FONTES-CNJ-JUMA.md",
    escopo:
      "CNJ (CACOL/DataJud), litigância climática do JUMA, legislação ambiental do MMA e resoluções do CNDH",
  },
  {
    arquivo: "FONTES-FLUXO-FINANCEIRO.md",
    escopo:
      "quem recebe dinheiro público, quem paga royalty de mineração (CFEM) e quem controla quem",
  },
  {
    arquivo: "FONTES-TERRITORIO-E-MINERACAO.md",
    escopo:
      "terras indígenas (FUNAI), territórios quilombolas (INCRA), unidades de conservação (CNUC) e processos minerários (ANM/SIGMINE)",
  },
];

/**
 * Licença POR FONTE, com o lugar do repositório onde ela foi lida.
 *
 * A coluna "onde está registrada" não é enfeite de rodapé: é o que separa
 * licença medida de licença presumida. Todas as linhas abaixo foram lidas no
 * arquivo indicado, não em página institucional da fonte.
 *
 * As restritivas vêm PRIMEIRO. Declarar que o INCRA veda uso comercial
 * protege quem reusa o dado daqui — e um termo que só lista as licenças
 * permissivas seria propaganda, não termo.
 */
const LICENCAS = [
  {
    fonte: "INCRA — territórios quilombolas (poligonal, WFS)",
    licenca: "Vedado o uso comercial",
    onde: "apps/web/public/terras/globo/scripts/ingerir_incra_quilombolas.py",
    nota: "Lido no campo AccessConstraints do GetCapabilities do serviço. É a mais restritiva do acervo.",
    restritiva: true,
  },
  {
    fonte: "CNDH — resoluções e recomendações",
    licenca: "CC BY-ND 3.0 (Atribuição · SemDerivações)",
    onde: "etl/betim/etl/apis/legislacao_cndh.py",
    nota: "SemDerivações: a ementa é citada literalmente, nunca reescrita nem resumida pelo portal.",
    restritiva: true,
  },
  {
    fonte: "Assessorias Técnicas Independentes (AEDAS, Guaicuy)",
    licenca: "Nenhuma licença declarada — tratado como direitos reservados",
    onde: "docs/FONTES-BIBLIOTECA-ATI.md",
    nota: "Os sites não publicam licença (as URLs /licenca/ respondem 404 ou conteúdo alheio). Na dúvida o portal guarda só link e título, nunca o texto.",
    restritiva: true,
  },
  {
    fonte: "MMA — legislação ambiental federal",
    licenca: "CC-BY (Creative Commons Atribuição)",
    onde: "etl/betim/etl/apis/legislacao_mma.py",
    nota: "Lido do próprio catálogo (license_id do pacote), não de página institucional.",
    restritiva: false,
  },
  {
    fonte: "Fundação Cultural Palmares — comunidades certificadas (CSV)",
    licenca: "CC-BY (Creative Commons Atribuição)",
    onde: "apps/web/public/terras/globo/scripts/ingerir_incra_quilombolas.py",
    nota: "Conferido respondendo em 2026-08-13, com última atualização da fonte em 05/07/2022.",
    restritiva: false,
  },
];

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Termo de uso e origem dos dados</span>
      </nav>

      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Termo de uso e origem dos dados
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Este documento responde a uma pergunta específica:{" "}
          <strong className="text-text">
            e se o dado publicado aqui for sobre você
          </strong>
          . De onde ele veio, com que base legal está no ar, sob qual licença
          pode ser reusado, o que o portal tenta esconder antes de publicar — e
          o que fazer quando algo passou.
        </p>
        <p className="text-[.95em] text-text-soft">
          Não é a política de privacidade de quem visita o site. Essa é outra, e
          diz o que o portal não coleta de você enquanto você navega:{" "}
          {/* `/betim` cravado e NÃO derivado de `listarCidades()`: a página de
              privacidade da zona de Cidades é a mesma em todas elas (só o nome
              do portal muda), e consultar o banco só para escolher qual citar
              amarraria esta página ao Postgres — que está fora do ar até 01/09.
              É o mesmo `href` de fallback que `lib/zonas.ts` já usa para a
              zona. O rodapé de cada cidade leva à versão dela. */}
          <Link href="/betim/privacidade" className="text-primary hover:text-accent">
            privacidade das Cidades
          </Link>{" "}
          e{" "}
          <Link href="/judiciario/privacidade" className="text-primary hover:text-accent">
            privacidade do Judiciário
          </Link>
          . Aqui é o outro lado: o dado de quem <em>aparece</em> no conteúdo e
          nunca escolheu estar nele.
        </p>
      </header>

      {/* ═══ O CASO CONCRETO — abre a página em vez de fechar ═══
          Ressalva sem exemplo vira carimbo e ninguém lê (mesma doutrina de
          `AvisoColetaEmCurso.tsx`). O episódio é a razão de a página existir,
          então vem antes de qualquer declaração de princípio. */}
      <section className="space-y-3 rounded-xl border border-alert/40 bg-alert/5 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-text">
          Um CPF já foi publicado aqui. Em 15 de agosto de 2026.
        </h2>
        <p className="text-[.95em] text-text">
          O portal ingeriu 8.940 normas ambientais federais. Uma delas — a
          portaria do IBAMA que delega competência para firmar Termo de
          Ajustamento de Conduta — escreve, na própria ementa oficial, o nome de
          um proprietário rural com o CPF ao lado. Esse texto entrou no
          repositório do projeto, que é público.
        </p>
        <p className="text-[.95em] text-text-soft">
          Uma ocorrência em 8.940 é exatamente o volume que faz conferência
          manual passar batido. Quem pegou foi a trava automática, no mesmo dia;
          o dado foi removido e a limpeza passou a acontecer na origem, antes de
          qualquer gravação. Mas o arquivo chegou a ser publicado antes da
          correção, e <strong className="text-text">o histórico do Git ainda
          guarda a versão antiga</strong> — apagá-lo exige reescrever histórico
          já distribuído, o que quebra qualquer cópia existente do repositório.
          É decisão pendente de quem é dono do projeto, e está registrada como
          pendência, não como resolvida.
        </p>
        <p className="text-[.95em] text-text-soft">
          Está aqui em primeiro lugar porque é o que este termo tem de mais
          honesto a dizer:{" "}
          <strong className="text-text">
            a fonte publicar não autoriza o portal a republicar
          </strong>
          , e a proteção deste projeto é boa o bastante para ter pegado o caso —
          e imperfeita o bastante para ele ter existido.
        </p>
      </section>

      {/* ═══ 1. DE ONDE VEM O DADO ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          1. De onde vem cada coisa
        </h2>
        <p className="text-text-soft">
          O portal não produz informação nova. Todo conteúdo publicado é dado que
          um órgão público já divulgou — contrato, licitação, licença ambiental,
          norma, voto, processo minerário, território demarcado — recoletado de
          sistemas oficiais e reapresentado em um só lugar.
        </p>
        <p className="text-text-soft">
          A lista completa de fontes, com a URL chamada, a data em que respondeu
          e a contagem do que foi efetivamente gravado, vive no repositório e é
          atualizada a cada coleta. Ela{" "}
          <strong className="text-text">não é copiada para esta página</strong>:
          uma cópia aqui envelheceria em semanas e passaria a mentir com
          aparência de documento oficial. Os cinco documentos de fontes:
        </p>
        <ul className="space-y-2.5 text-[.95em]">
          {DOCS_DE_FONTES.map((d) => (
            <li key={d.arquivo} className="text-text-soft">
              <a
                href={`${GH}/docs/${d.arquivo}`}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-[.9em] text-primary hover:text-accent"
              >
                {d.arquivo} ↗
              </a>
              <br />
              {d.escopo}
            </li>
          ))}
        </ul>
        <p className="text-text-soft">
          Como o dado é lido, o que um modelo de linguagem extrai e o que só
          código determinístico calcula está explicado em{" "}
          <Link href="/sobre#metodologia" className="text-primary hover:text-accent">
            metodologia
          </Link>
          .
        </p>
      </section>

      {/* ═══ 2. BASE LEGAL ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">2. Com que base legal</h2>
        <p className="text-text-soft">
          Citando dispositivo, porque &ldquo;conforme a legislação vigente&rdquo;
          não é informação:
        </p>
        <ul className="space-y-3 text-[.95em] text-text-soft">
          <li>
            <strong className="text-text">
              Lei de Acesso à Informação (Lei 12.527/2011), art. 8º
            </strong>{" "}
            — órgãos públicos têm o dever de divulgar informação de interesse
            coletivo independentemente de pedido, e o § 3º manda publicar em
            formato aberto e legível por máquina. É esse formato que o portal
            consome.
          </li>
          <li>
            <strong className="text-text">
              A mesma LAI, art. 31 — e é o dispositivo que mais importa aqui
            </strong>{" "}
            — o tratamento de informação pessoal deve respeitar intimidade, vida
            privada, honra e imagem, e a informação pessoal sensível tem acesso
            restrito <em>independentemente de classificação de sigilo</em>. Ou
            seja: documento público não torna público tudo que está escrito
            dentro dele. É a regra que o CPF na ementa violaria se tivesse
            ficado.
          </li>
          <li>
            <strong className="text-text">Decreto 8.777/2016, art. 1º</strong> —
            institui a Política de Dados Abertos do Poder Executivo federal, que
            é o que faz existir a API pública de onde grande parte deste acervo
            é lida.
          </li>
          <li>
            <strong className="text-text">
              LGPD (Lei 13.709/2018), art. 7º, VI e IX
            </strong>{" "}
            — o tratamento de dado pessoal é admitido para exercício regular de
            direitos e para atender interesse legítimo, o que ampara controle
            social sobre ato de agente público no exercício da função.
          </li>
          <li>
            <strong className="text-text">LGPD, art. 7º, § 3º</strong> — dado de
            acesso público só pode ser tratado considerando{" "}
            <em>a finalidade, a boa-fé e o interesse público que justificaram
            sua disponibilização</em>. É por isso que o portal remove o CPF que
            veio numa ementa: o CPF não foi disponibilizado para virar chave de
            cruzamento de cadastro, e reusá-lo assim extrapolaria a finalidade
            original.
          </li>
          <li>
            <strong className="text-text">LGPD, art. 18</strong> — direitos do
            titular: confirmação, acesso, correção, anonimização, bloqueio e
            eliminação. É o que a seção 5 desta página operacionaliza, com o
            limite que ela também declara.
          </li>
        </ul>
        <p className="rounded-lg border border-border bg-surface-2 p-4 text-[.9em] text-text-soft">
          Este documento explica a prática do projeto. Não é parecer jurídico e
          não substitui um.
        </p>
      </section>

      {/* ═══ 3. LICENÇA POR FONTE ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          3. Licença — e as fontes que restringem
        </h2>
        <p className="text-text-soft">
          Dado público não é sinônimo de dado livre. Cada fonte tem a sua
          licença, e ela continua valendo depois que o dado passa por aqui:{" "}
          <strong className="text-text">
            quem reusar o conteúdo do portal herda a restrição da fonte
          </strong>
          , não a do portal. As restritivas vêm primeiro de propósito.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-[.9em]">
            <thead>
              <tr className="border-b border-border text-text-soft">
                <th className="py-2 pr-4 font-semibold">Fonte</th>
                <th className="py-2 pr-4 font-semibold">Licença</th>
              </tr>
            </thead>
            <tbody>
              {LICENCAS.map((l) => (
                <tr key={l.fonte} className="border-b border-border align-top">
                  <td className="py-3 pr-4 text-text">{l.fonte}</td>
                  <td className="py-3 pr-4">
                    {/* `text-alert` só no rótulo curto da restritiva, com o
                        texto explicativo em `text-text-soft` logo abaixo: o
                        token de alerta carrega urgência e usá-lo em parágrafo
                        inteiro o gasta. Mesma escolha de `RotuloBadge`. */}
                    <span className={l.restritiva ? "font-medium text-alert" : "text-text"}>
                      {l.licenca}
                    </span>
                    <span className="mt-1 block text-[.9em] text-text-soft">
                      {l.nota}
                    </span>
                    <span className="mt-1 block font-mono text-[.85em] text-text-soft">
                      registrada em {l.onde}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[.95em] text-text-soft">
          O <strong className="text-text">código</strong> do portal é livre, sob{" "}
          <a
            href={`${GH}/LICENSE`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:text-accent"
          >
            AGPL-3.0-or-later
          </a>
          . Isso cobre o programa, não o dado de terceiro que ele exibe — são
          duas licenças diferentes e a do código não sobrepõe a da fonte.
        </p>
      </section>

      {/* ═══ 4. O QUE O PORTAL MASCARA, E ONDE A TRAVA FALHA ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          4. O que o portal esconde antes de publicar
        </h2>
        <p className="text-text-soft">
          Existe uma assimetria deliberada, e ela vale a pena ser dita em voz
          alta:{" "}
          <strong className="text-text">
            o nome de quem assina ato público permanece; o número que serve para
            cruzar cadastros sai
          </strong>
          . Quem firma um Termo de Ajustamento de Conduta ambiental responde por
          ele com nome — essa é a informação de interesse público. O CPF não
          acrescenta nada ao controle social e acrescenta tudo à vigilância.
          CNPJ permanece por decisão: saber <em>qual empresa</em> assinou é
          exatamente o que este portal existe para mostrar.
        </p>
        <p className="text-text-soft">Na prática, isso é feito em três lugares:</p>
        <ul className="list-disc space-y-2 pl-6 text-[.95em] text-text-soft">
          <li>
            <strong className="text-text">Na coleta.</strong> No licenciamento
            ambiental, quem é pessoa física não tem nome nem coordenada
            publicados — só a existência da licença. Quando o tipo de documento
            é ambíguo, a decisão vai para o lado mais protetor: trata-se como
            pessoa física.
          </li>
          <li>
            <strong className="text-text">Na gravação.</strong> Documento colado
            dentro de campo de texto livre é removido antes de o registro
            existir, e por padrão genérico — não por lista de casos já
            conhecidos, porque a fonte cola outro número na coleta seguinte.
          </li>
          <li>
            <strong className="text-text">Na entrada do repositório.</strong>{" "}
            Três camadas independentes (teste automatizado, gancho antes do
            envio e verificação na integração contínua) barram CPF em arquivo
            versionado. A validação é por{" "}
            <strong className="text-text">mod-11</strong>, o dígito verificador
            do próprio CPF: sequência de onze dígitos que é código de município,
            protocolo ou identificador não dispara alarme falso, e CPF sintético
            (000.000.000-00) continua passando, porque precisa poder ilustrar
            formato.
          </li>
        </ul>
        <div className="space-y-3 rounded-xl border border-alert/40 bg-alert/5 p-5">
          <h3 className="font-display text-lg font-semibold text-text">
            E a trava é imperfeita — isto não é ressalva de estilo
          </h3>
          <p className="text-[.95em] text-text">
            Ela já falhou uma vez, em{" "}
            <strong>15 de agosto de 2026</strong>, no caso descrito no topo desta
            página. Não falhou por estar desligada: pegou o CPF, mas depois de o
            arquivo já ter sido publicado.
          </p>
          <p className="text-[.95em] text-text-soft">
            E há um limite conhecido, registrado como dívida do projeto:{" "}
            <strong className="text-text">
              a verificação automática varre código-fonte e documentação, não o
              acervo de dados ingerido
            </strong>{" "}
            — varrer megabytes de dado a cada verificação a tornaria lenta a
            ponto de alguém desligá-la, que é o pior resultado possível para uma
            trava. Nas frentes que ingerem acervo, a triagem é escrita à parte, e
            ela já encontrou coisa real: um resumo de documento que anunciava
            lista com nome, endereço e telefone de pessoa desaparecida.
          </p>
          <p className="text-[.95em] text-text-soft">
            Um termo que prometesse infalibilidade ficaria falso na primeira
            falha. Este declara o limite e continua verdadeiro — e é justamente
            por causa do limite que a seção seguinte existe.
          </p>
        </div>
      </section>

      {/* ═══ 5. CORREÇÃO E REMOÇÃO ═══ */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          5. Se você aparece aqui: correção e remoção
        </h2>

        <h3 className="font-display text-lg font-semibold text-text">
          Erro factual
        </h3>
        <p className="text-text-soft">
          Se um número, nome, data ou vínculo está errado, o projeto quer saber.
          Erro apontado por quem é citado costuma ser o mais preciso que existe.
          Diga a página, o trecho e o que está certo — se puder, com o link da
          fonte oficial que comprova.
        </p>

        <h3 className="font-display text-lg font-semibold text-text">
          Remoção — e o que o portal pode e não pode fazer
        </h3>
        <p className="text-text-soft">
          Esta é a distinção que mais gera frustração, então vale explicitá-la
          antes de qualquer pedido:
        </p>
        <ul className="space-y-3 text-[.95em] text-text-soft">
          <li>
            <strong className="text-text">
              A cópia local, o portal pode tirar.
            </strong>{" "}
            O que está exibido nas páginas, guardado no banco e versionado no
            repositório está sob controle do projeto. Dado pessoal que não devia
            ter entrado sai — e sai da origem, para não voltar na próxima coleta.
          </li>
          <li>
            <strong className="text-text">
              O ato na fonte oficial, o portal não pode tirar.
            </strong>{" "}
            A portaria continua no Diário Oficial, o contrato continua no portal
            de contratações, a decisão continua no tribunal. Isso não depende
            deste projeto e não seria apagado por ele. Para o documento na
            origem, o caminho é o órgão que o publicou — e, se for o caso, a
            Autoridade Nacional de Proteção de Dados.
          </li>
          <li>
            <strong className="text-text">
              O histórico já distribuído é o caso mais difícil.
            </strong>{" "}
            Conteúdo que chegou a ser publicado num repositório público pode
            existir em cópias que o projeto não controla. Limpar o histórico do
            projeto é possível, mas quebra as cópias existentes — é decisão
            caso a caso, não automática, e nenhum termo honesto pode prometer
            que a informação desaparece de toda parte.
          </li>
          <li>
            <strong className="text-text">
              Nem todo pedido de remoção é atendido, e o critério é este:
            </strong>{" "}
            ato de agente público no exercício da função é registro de interesse
            público e permanece — não é exclusão a pedido. Dado pessoal que não
            precisava estar ali para o controle social funcionar (documento de
            identificação, endereço residencial, contato pessoal) sai. Recusa
            vem com motivo escrito, nunca em silêncio.
          </li>
        </ul>
      </section>

      {/* ═══ 6. CANAL ═══
          Até 15/08/2026 esta seção dizia que o canal reservado NÃO existia, e
          isso estava certo: a varredura daquele dia em `apps/web/app` e `docs/`
          não achou nenhum e-mail do próprio projeto (só e-mails de ÓRGÃOS —
          ouvidorias, defensorias, câmaras). O dono definiu o endereço na mesma
          noite, e ele entra aqui.

          A DIVISÃO ENTRE OS DOIS CANAIS NÃO É ENFEITE, é a razão de o e-mail
          ter sido necessário: a issue do repositório é PÚBLICA, então descrever
          nela o CPF que se quer remover republica exatamente o que se pretende
          tirar. Erro factual pode ser público; dado pessoal, não. Se um dia o
          endereço mudar, mude NOS DOIS lugares — ele também é citado na seção
          de remoção acima.

          O que continua valendo: NÃO PROMETER PRAZO. Prazo que ninguém pode
          cumprir é a única parte de um termo que fica falsa sozinha, sem
          ninguém mexer. */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">6. Como falar com o projeto</h2>
        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-5">
          <p className="text-[.95em] text-text">
            <strong className="text-text">
              Para pedido sobre dado pessoal — correção, remoção ou dúvida sobre
              algo que cite você:
            </strong>
          </p>
          <p className="text-[1.05em]">
            <a
              href="mailto:contato@controlepopular.com.br"
              className="font-semibold text-primary hover:text-accent"
            >
              contato@controlepopular.com.br
            </a>
          </p>
          <p className="text-[.95em] text-text-soft">
            Use este endereço, e não a via pública abaixo, quando o pedido
            envolver dado pessoal. Escreva o endereço da página e onde no texto
            está o problema.
          </p>
          <p className="text-[.95em] text-text-soft">
            Para <strong className="text-text">erro factual</strong> — número
            errado, fonte trocada, link quebrado — o repositório público do
            projeto é o melhor lugar, porque a correção fica registrada junto
            com o código:
          </p>
          <p className="text-[.95em]">
            <a
              href="https://github.com/FinweeJur/controle-popular/issues"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:text-accent"
            >
              github.com/FinweeJur/controle-popular/issues ↗
            </a>
          </p>
          <p className="text-[.95em] text-text">
            <strong className="text-alert">
              Não escreva dado pessoal na issue.
            </strong>{" "}
            Ela é pública: descrever ali o CPF, endereço ou telefone que você
            quer remover republicaria exatamente o que se pretende tirar. Para
            esse caso existe o e-mail acima.
          </p>
          <p className="text-[.9em] text-text-soft">
            O projeto é mantido por voluntários e{" "}
            <strong className="text-text">não promete prazo de resposta</strong>,
            porque não tem plantão para cumprir um. Um prazo escrito aqui e não
            cumprido seria a parte deste termo que fica falsa sozinha. Pedido que
            envolva dado pessoal é o que tem prioridade.
          </p>
        </div>
      </section>

      <footer className="space-y-2 border-t border-border pt-6 text-[.9em] text-text-soft">
        <p>
          Última revisão desta página: 15 de agosto de 2026 — mesmo dia do
          episódio descrito na abertura.
        </p>
        <p>
          Controle Popular é uma iniciativa cidadã independente, sem vínculo com
          órgão público, partido ou empresa. Ver{" "}
          <Link href="/sobre" className="text-primary hover:text-accent">
            sobre o projeto
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
