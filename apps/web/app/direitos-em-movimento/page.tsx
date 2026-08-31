import type { Metadata } from "next";
import {
  listarNormasDireitoCritico,
  listarPrecedentesDireitoCritico,
} from "@/lib/db/queries/direito-critico";
import { REDE_ITENS, LAI_ESTADUAL, LAI_FEDERAL, NAO_VERIFICADO } from "@/lib/betim/redeProtecao";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * `/direitos-em-movimento` — a PORTA, não uma seção nova para construir.
 *
 * Pedido do dono (13/08): "quais leis existem pra proteção dos
 * ecossistemas, da fauna, flora e grupos sociais e onde é possível buscar
 * ajuda / parcerias. Passo a passo e links para que ação cidadã seja
 * possível por todos." Plano completo, com os números medidos e a decisão
 * de arquitetura já tomada pelo dono: `docs/PLANO-DIREITOS-EM-MOVIMENTO.md`.
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
  title: "Direitos em Movimento — Controle Popular",
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

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        · <span className="text-text">Direitos em Movimento</span>
      </nav>

      <header className="mt-4 space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: CARD_COR }}
        >
          Transversal às cinco frentes · Para quem sofreu ou viu uma violação
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Direitos em Movimento</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Quatro perguntas, quatro portas: que lei protege isso, onde buscar ajuda, como pedir
          informação e como denunciar. Você não precisa saber em que parte do site está — só o
          que aconteceu. A cidade só é perguntada na porta que realmente depende dela.
        </p>
      </header>

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
          etiqueta="Passo a passo guiado"
          titulo="Como denunciar"
          descricao="Nove perguntas curtas, não um formulário em branco: o que aconteceu, quando, quem esteve envolvido, que prova reunir e para onde mandar. O documento (.docx) nasce no seu navegador e nunca é enviado a nenhum servidor."
          numero="Fase 1 pronta — DOCX no navegador, sem envio"
          href="/direitos-em-movimento/denuncia"
          cta="Começar →"
        />
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
            <a href="/direitos-em-movimento/ajuda" className="font-medium text-primary hover:underline">
              Onde buscar ajuda
            </a>
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
            <a href="/ambiental/legislacao" className="font-medium text-primary hover:underline">
              Que lei protege isso
            </a>
            . O MAPA de território não os representa — o mapa 3D da zona Terra e Território
            mostra terra indígena, mineração e barragem, não esse recorte. Não aparecer no mapa
            não é o mesmo que não existir ali.
          </p>
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
      <p className="mt-3 text-[.8em] font-medium text-text-soft">{numero}</p>
      <span className="mt-5 font-medium text-primary">{cta}</span>
    </a>
  );
}
