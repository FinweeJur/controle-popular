import type { Metadata } from "next";
import NextLink from "next/link";
import {
  listarNormasDireitoCritico,
  listarPrecedentesDireitoCritico,
} from "@/lib/db/queries/direito-critico";
import { REDE_ITENS, LAI_ESTADUAL, LAI_FEDERAL, NAO_VERIFICADO } from "@/lib/betim/redeProtecao";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";
import AberturaHero from "@/app/components/abertura/AberturaHero";
import { CAMADAS_MEMORIA, fontesPrimarias, verbeteValido } from "@/lib/memoria";
import VitrineLutas from "./VitrineLutas";
import type { VerbeteVitrine } from "./VitrineLutas";

/**
 * `/direitos-em-movimento` — a PORTA, não uma seção nova para construir.
 *
 * Pedido do dev (13/08): "quais leis existem pra proteção dos
 * ecossistemas, da fauna, flora e grupos sociais e onde é possível buscar
 * ajuda / parcerias. Passo a passo e links para que ação cidadã seja
 * possível por todos." Plano completo, com os números medidos e a decisão
 * de arquitetura já tomada pelo dev: `docs/PLANO-DIREITOS-EM-MOVIMENTO.md`.
 * Não reabra a decisão (A) de lá — a seção é GERAL, e só pergunta a cidade
 * quando chega em "onde buscar ajuda": quem sofreu violação não sabe em
 * que aba do site está, sabe o que aconteceu com ele.
 *
 * FICA NA RAIZ, ao lado das cinco zonas — mesmo motivo de `/sobre` e
 * `/busca`: o assunto atravessa as cinco, uma versão dentro de uma delas
 * descreveria só um recorte.
 *
 * As quatro portas abaixo já existem e estão em produção — este arquivo é
 * sobretudo NAVEGAÇÃO, não construção nova:
 *  - "Que lei protege isso"   → `/ambiental/legislacao` (até 13/08/2026 era
 *    `/ambiental/direito-critico`; a unificação dos dois painéis de
 *    legislação moveu o conteúdo pra lá e a URL antiga redireciona — sem
 *    isso o link já compartilhado quebraria)
 *  - "Onde buscar ajuda"      → `/direitos-em-movimento/ajuda`, que reusa
 *    `lib/betim/redeProtecao.ts` inteiro
 *  - "Como pedir informação"  → `/direitos-em-movimento/informacao`, idem
 *  - "Como denunciar"         → `/direitos-em-movimento/denuncia`, a
 *    entrevista guiada + `.docx` gerado só no navegador
 *    (`docs/PLANO-ACAO-CIDADA.md`, Fase 1: roteiro de 9 passos, roteamento
 *    de destino via `lib/denuncia/roteiro.ts` reusando `redeProtecao.ts`,
 *    rascunho local opt-in. Fases 2 e 3 do plano — PDF e roteamento por
 *    dado dinâmico do portal — ficaram de fora de propósito, não por
 *    esquecimento)
 */
export const metadata: Metadata = metadataEditavel("/direitos-em-movimento", {
  title: "Direitos em Movimento — Eixo 2 | Controle Popular",
  description:
    "Que lei protege isso, onde buscar ajuda, como pedir informação e como denunciar — reunidos num lugar só, para quem sofreu ou viu uma violação de direitos.",
});

const CARD_COR = "var(--cp-alert)";

export default async function DireitosEmMovimentoHub() {
  const [normas, precedentes] = await Promise.all([
    listarNormasDireitoCritico(),
    listarPrecedentesDireitoCritico(),
  ]);
  const totalLei = normas.length + precedentes.length;
  const totalOrgs = REDE_ITENS.length;
  const totalLai = LAI_ESTADUAL.length + LAI_FEDERAL.length;

  // Vitrine das lutas curadas (F5): país, regiões e UFs, cada uma com tipo,
  // período, lugar e a fonte primária. Só verbete válido publica (guarda
  // editorial: verbete sem fonte fechada não entra — AGENTS §7).
  const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const paraVitrine = (
    ambito: string,
    lugar: string | undefined,
    lista: (typeof CAMADAS_MEMORIA.pais)[string]
  ): VerbeteVitrine[] =>
    lista.filter(verbeteValido).map((v) => ({
      ambito,
      lugar,
      titulo: v.titulo,
      periodo: v.periodo,
      resumo: v.resumo,
      tipo: v.tipo,
      fonte: fontesPrimarias(v).map((f) => ({
        orgao: f.orgao,
        ano: f.ano,
        titulo: f.titulo,
        url: f.url,
      })),
    }));
  const vitrine: VerbeteVitrine[] = [
    ...paraVitrine("Brasil", undefined, CAMADAS_MEMORIA.pais["br"] ?? []),
    ...Object.entries(CAMADAS_MEMORIA.regiao).flatMap(([regiao, lista]) =>
      paraVitrine("Região", capitalizar(regiao), lista)
    ),
    ...Object.entries(CAMADAS_MEMORIA.uf).flatMap(([uf, lista]) =>
      paraVitrine("Estado", uf.toUpperCase(), lista)
    ),
  ];

  return (
    // ⟲ 05/10, hero vivo: a abertura (tela cheia, só o nome, fundo Vanta)
    // fica FORA e ACIMA do <main> — o <h1> da página mora lá agora, então
    // o título do header abaixo desceu para <h2>. Este hub é standalone
    // (não usa EixoLayout), por isso a abertura entra direto aqui — o
    // efeito e o token de cor vêm de `lib/hero-vivo.ts` ("birds").
    <>
      <AberturaHero paginaId="direitos" titulo="Direitos em Movimento" />
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <NextLink href="/" className="hover:text-primary">
          Início
        </NextLink>{" "}
        · <span className="text-text">Direitos em Movimento</span>
      </nav>

      <header className="mt-4 space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: CARD_COR }}
        >
          Eixo 2: Direitos em Movimento · Para quem sofreu ou viu uma violação
        </p>
        {/* h2, não h1: o h1 único da página vive na abertura viva acima. */}
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Direitos em Movimento</h2>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Quatro perguntas, quatro portas: que lei protege isso, onde buscar ajuda, como pedir
          informação e como denunciar. Você não precisa saber em que parte do site está — só o
          que aconteceu. A cidade só é perguntada na porta que realmente depende dela.
        </p>
      </header>

      {/* SUBFRENTES PRIORITÁRIAS EM DESTAQUE */}
      <section aria-label="Subfrentes prioritárias" className="mt-8 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">✦ Portas Prioritárias</span>
          <h2 className="font-display text-xl font-bold text-foreground mt-1">
            Subfrentes em Destaque Cívico
          </h2>
          <p className="text-sm text-text-soft">
            Acesso imediato às garantias de direitos fundamentais, memória das lutas populares e saúde coletiva.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NextLink
            href="/memoria"
            className="group flex flex-col justify-between rounded-xl border border-amber-500/40 bg-surface p-4 hover:border-amber-500 hover:bg-amber-500/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">✦ Memória Operária</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-500 mt-1">
                Linha do Tempo das Lutas
              </h3>
              <p className="text-xs text-text-soft mt-1 leading-relaxed">
                6 décadas de resistência camponesa, sindical e comunitária no Brasil.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 flex items-center justify-between">
              <span>Ver Linha do Tempo</span>
              <span>→</span>
            </span>
          </NextLink>

          <NextLink
            href="/ambiental/legislacao"
            className="group flex flex-col justify-between rounded-xl border border-amber-500/40 bg-surface p-4 hover:border-amber-500 hover:bg-amber-500/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">✦ Biblioteca Jurídica</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-500 mt-1">
                Que Lei Protege Isso
              </h3>
              <p className="text-xs text-text-soft mt-1 leading-relaxed">
                Leis ambientais, tratados internacionais e precedentes de tribunais.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 flex items-center justify-between">
              <span>Consultar Leis</span>
              <span>→</span>
            </span>
          </NextLink>

          <NextLink
            href="/direitos-em-movimento/saude-publica"
            className="group flex flex-col justify-between rounded-xl border border-amber-500/40 bg-surface p-4 hover:border-amber-500 hover:bg-amber-500/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">✦ SUS & Vida</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-500 mt-1">
                Saúde Pública & SUS
              </h3>
              <p className="text-xs text-text-soft mt-1 leading-relaxed">
                Leitos CNES, internações SIH e rede assistencial por município.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 flex items-center justify-between">
              <span>Ver Painel SUS</span>
              <span>→</span>
            </span>
          </NextLink>

          {/* Este card trata de Tarifa Social, que é uma notícia própria com o
              passo a passo do desconto. A rede de proteção (Defensoria, CRAS,
              MP) fica no PortaCard "Onde buscar ajuda" mais abaixo. */}
          <NextLink
            href="/noticias/tarifa-social-energia-agua-como-acessar"
            className="group flex flex-col justify-between rounded-xl border border-amber-500/40 bg-surface p-4 hover:border-amber-500 hover:bg-amber-500/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">✦ Conta de Luz e Água</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-500 mt-1">
                Tarifa Social de Água & Luz
              </h3>
              <p className="text-xs text-text-soft mt-1 leading-relaxed">
                Desconto de até 65% para famílias de baixa renda: quem tem direito e como pedir.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 flex items-center justify-between">
              <span>Ver passo a passo</span>
              <span>→</span>
            </span>
          </NextLink>
        </div>
      </section>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <PortaCard
          etiqueta="Legislação e precedentes"
          titulo="Que lei protege isso"
          descricao="Normas nacionais e internacionais, e decisões de tribunais, filtráveis por tema: rios, povos indígenas, quilombolas, comunidades tradicionais e direitos humanos."
          numero={`${formatNumberBR(totalLei)} itens catalogados`}
          href="/ambiental/legislacao"
          cta="Ver o acervo →"
        />
        <PortaCard
          etiqueta="Rede de proteção"
          titulo="Onde buscar ajuda"
          descricao="Defensoria, Ministério Público, delegacias especializadas, assistência social, redes populares e clínicas jurídicas gratuitas — por necessidade, depois por cidade."
          numero={`${formatNumberBR(totalOrgs)} organizações`}
          href="/direitos-em-movimento/ajuda"
          cta="Buscar ajuda →"
        />
        <PortaCard
          etiqueta="Lei de Acesso à Informação"
          titulo="Como pedir informação"
          descricao="Qualquer cidadão pode pedir informação por escrito a qualquer órgão público, de graça. Os canais estaduais, federais e — quando cadastrado — o da sua prefeitura e câmara."
          numero={`${formatNumberBR(totalLai)} canais estaduais e federais + os municipais de cada cidade`}
          href="/direitos-em-movimento/informacao"
          cta="Ver os canais →"
        />
        <PortaCard
          etiqueta="Democracia direta e controle social"
          titulo="Conselhos de Direitos & Colegiados"
          descricao="Onde a população fiscaliza: conselhos de saúde (CMS/CES), meio ambiente (CODEMA), direitos humanos, tutelares e comitês de bacia das 27 UFs e 203 cidades estratégicas."
          numero="710 conselhos e colegiados mapeados"
          href="/direitos-em-movimento/conselhos"
          cta="Ver conselhos →"
        />
        <PortaCard
          etiqueta="Passo a passo guiado"
          titulo="Como denunciar"
          descricao="Nove perguntas curtas, não um formulário em branco: o que aconteceu, quando, quem esteve envolvido, que prova reunir e para onde mandar. O documento (.docx) nasce no seu navegador e nunca é enviado a nenhum servidor."
          numero="Fase 1 pronta — DOCX no navegador, sem envio"
          href="/direitos-em-movimento/denuncia"
          cta="Começar →"
        />
      </div>

      {/* Atalho destacado para o Judiciário e Balcão Virtual */}
      <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              Atendimento do Poder Judiciário
            </span>
            <h3 className="font-display text-lg font-bold text-text">
              Precisa falar diretamente com uma Vara, Fórum ou Juiz?
            </h3>
            <p className="text-xs text-text-soft">
              Catálogo de 990 unidades judiciárias com telefones com DDD, e-mails institucionais, endereços com CEP, juízes titulares e link direto para o Balcão Virtual em todas as 298 comarcas de MG e cidades do Brasil.
            </p>
          </div>
          <NextLink
            href="/judiciario/contatos"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90"
          >
            <span>Consultar Guia de Varas</span>
            <span>→</span>
          </NextLink>
        </div>
      </div>

      {/* ═══ AS DUAS LACUNAS QUE PRECISAM ESTAR NA TELA, NÃO NO RODAPÉ ═══
          Regra de cobertura declarada do projeto — ver
          `docs/PLANO-DIREITOS-EM-MOVIMENTO.md`, seção "Honestidade de
          cobertura". As duas ficam aqui, na porta de entrada, porque
          quem vem correndo atrás de uma das quatro entradas acima
          precisa ver isto ANTES de escolher, não depois de já ter ido
          embora achando que o mapa e a rede cobrem tudo. */}
      <section className="mt-12 space-y-4">
        <h2 className="font-display text-lg font-semibold">
          O que esta seção NÃO cobre — dito, não escondido
        </h2>

        <div className="rounded-2xl border border-dashed border-accent bg-accent/10 p-5">
          <p className="font-medium text-text">
            {formatNumberBR(NAO_VERIFICADO.length)} canais da rede de proteção são reais, mas
            não confirmados
          </p>
          <p className="mt-1.5 text-[.92em] text-text-soft">
            E-SIC de câmara que devolveu erro, delegacia especializada fora de Belo Horizonte
            sem endereço atual, comissão de direitos humanos que bloqueou acesso automatizado.
            Mandar alguém em situação de urgência para um telefone não confirmado é pior que
            avisar. A lista completa, com o motivo de cada um, está na porta{" "}
            <NextLink href="/direitos-em-movimento/ajuda" className="font-medium text-primary hover:underline">
              Onde buscar ajuda
            </NextLink>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-accent bg-accent/10 p-5">
          <p className="font-medium text-text">
            Povos e comunidades tradicionais não indígenas e não quilombolas não têm base
            geográfica no portal
          </p>
          <p className="mt-1.5 text-[.92em] text-text-soft">
            Faiscadores, geraizeiros, apanhadoras de flores sempre-vivas, vazanteiros, povos de
            terreiro, pescadores artesanais: o acervo de LEI os alcança — o tema{" "}
            <em>povos_tradicionais</em> existe na porta{" "}
            <NextLink href="/ambiental/legislacao" className="font-medium text-primary hover:underline">
              Que lei protege isso
            </NextLink>
            . O MAPA de território não os representa — o mapa 3D da zona Terra e Território
            mostra terra indígena, mineração e barragem, não esse recorte. Não aparecer no mapa
            não é o mesmo que não existir ali.
          </p>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="vitrine-lutas">
        <h2 id="vitrine-lutas" className="font-display text-2xl font-bold">
          Vitrine das lutas
        </h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Marcos de resistência do Brasil, das regiões e dos estados, com período,
          lugar e a fonte de cada um. Todo verbete sai de fonte primária; lacuna é
          declarada, nunca preenchida com marco inventado.
        </p>
        <div className="mt-6">
          <VitrineLutas verbetes={vitrine} />
        </div>
      </section>

      <footer className="mt-12 border-t border-border pt-6 text-[.85em] text-text-soft">
        <p>
          As quatro portas foram medidas contra o banco local e o código deste portal em
          13/08/2026 — não são promessa. Portal independente, sem vínculo com nenhum órgão,
          governo ou partido.
        </p>
      </footer>
      <FooterGlobal />
    </main>
    </>
  );
}

function PortaCard({
  etiqueta,
  titulo,
  descricao,
  numero,
  href,
  cta,
}: {
  etiqueta: string;
  titulo: string;
  descricao: string;
  numero: string;
  href: string;
  cta: string;
}) {
  return (
    // <a> cru: `/direitos-em-movimento` é raiz, fora de qualquer zona — não
    // há `<Link>` de zona pra usar aqui, e não existe risco de basePath
    // (nenhuma destas rotas mora sob /ambiental, /congresso etc., exceto a
    // primeira, que é justamente outra zona e por isso também é <a> cru).
    <a
      href={href}
      className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
    >
      <span
        className="text-[.82em] font-semibold uppercase tracking-wide"
        style={{ color: CARD_COR }}
      >
        {etiqueta}
      </span>
      <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
        {titulo}
      </h2>
      <p className="mt-2 text-[.95em] text-text-soft">{descricao}</p>
      <p className="mt-3 text-[11px] font-medium text-text-soft">{numero}</p>
      <span className="mt-5 font-medium text-primary">{cta}</span>
    </a>
  );
}
