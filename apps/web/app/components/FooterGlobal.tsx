import { ZONAS_PUBLICADAS, contagemZonasPublicadas } from "@/lib/zonas";

// Ações do rodapé padrão (PLANO-NAVEGACAO-E-NOTIFICACOES.md): pedido de
// dados por e-mail e mostrador público do contador de envios/downloads.
import PedirDadosEmail from "@/app/components/PedirDadosEmail";
import ContadorPublico from "@/app/components/ContadorPublico";

/**
 * Rodapé padrão do portal — os links principais do site, no fim de toda
 * página, nas quatro zonas.
 *
 * POR QUE EXISTIA SÓ NA ZONA DE CIDADES ATÉ AGORA: `/ambiental`,
 * `/congresso` e `/judiciario` tinham `<footer>` próprio (aviso de
 * independência + link de metodologia), mas nenhum deles apontava para as
 * OUTRAS zonas, para a busca ou para os dados populares — o rodapé de cada
 * zona só falava daquela zona. `grep -c Footer` nos três layouts devolvia
 * zero: não existia um componente de rodapé ali, só HTML solto.
 *
 * DECISÃO DE ARQUITETURA — "global que a cidade estende", não "global nas
 * três zonas + cidade como está": a segunda opção deixaria a zona de
 * Cidades sem os mesmos links padrão que as outras três ganharam agora
 * (busca, dados populares, as zonas irmãs), o que contradiz o pedido de um
 * rodapé padrão em TODA página. Em vez disso, este componente é o núcleo
 * único — Cidades o inclui dentro do seu `Footer.tsx` (que mantém LAI,
 * contatos e fontes por cidade ao redor dele), e as outras três zonas o
 * colocam dentro do `<footer>` que já tinham. Mesma lista de links em
 * cinco lugares seria o defeito que `lib/zonas.ts` já evita para a home e
 * para `OutrasFrentes.tsx` — aqui é o mesmo raciocínio aplicado ao rodapé.
 *
 * TODO LINK AQUI É `<a href>` CRU, nunca o `<Link>` de zona
 * (`lib/link-zona.tsx`): cada item aponta para a RAIZ do domínio ou para
 * uma zona diferente da que está renderizando o rodapé — e como este
 * componente é o mesmo em qualquer zona, não há um `<Link>` "certo" único
 * para importar. Passar um deles prefixaria "/ambiental/congresso" ou
 * "/judiciario/busca", a classe de bug que os comentários de
 * `lib/link-zona.tsx` e `lib/zonas.ts` registram já ter acontecido três
 * vezes.
 *
 * "METODOLOGIA" aponta para `/sobre#metodologia`, não para a metodologia
 * de uma zona específica: `/congresso/metodologia` e `/judiciario/
 * metodologia` existem e continuam alcançáveis pela navegação de cada
 * zona, mas `/ambiental` não tem uma, e um rodapé padrão não pode
 * apontar para um link que só existe em duas das cinco zonas. `/sobre`
 * (a página de apresentação do projeto) é onde a metodologia do portal
 * INTEIRO — a separação entre o que o modelo extrai e o que o código
 * calcula, a taxa de erro, a cobertura por amostra — está explicada num
 * lugar só; é ela que faz sentido linkar de qualquer zona.
 */
const LINKS_PORTAL = [
  // Primeiro da lista de propósito: "Direitos em Movimento" não é meta-
  // página do portal (não é "sobre", não é "busca") — é a seção
  // transversal às cinco frentes (que lei protege, onde buscar ajuda, como
  // pedir informação, como denunciar). Mora aqui e não em "As cinco
  // frentes" acima porque NÃO é zona — ver a nota de arquitetura em
  // `lib/zonas.ts` e no bloco correspondente de `app/page.tsx`.
  { label: "Índice do portal", href: "/indice" },
  { label: "Direitos em Movimento", href: "/direitos-em-movimento" },
  { label: "Busca", href: "/busca" },
  { label: "Páginas mais vistas", href: "/dados/populares" },
  // Rótulo pela MATÉRIA, não pela sigla: "ComunicaBR" não diz nada a quem
  // nunca ouviu falar do portal da Presidência, e o rodapé é onde o leitor
  // decide se clica. Mesmo raciocínio de `nomeCurto` em `lib/zonas.ts`.
  { label: "Governo federal nas cidades de MG", href: "/dados/comunicabr" },
  { label: "Metodologia", href: "/sobre#metodologia" },
  // "Termos" existiu no rodapé do eixo Cidades apontando para `/termos`, rota
  // que nunca existiu — 404 em toda página daquele eixo, achado na auditoria
  // de hiperlinks de 13/08 e resolvido lá REMOVENDO o link, porque não havia
  // destino. Agora há (`app/termos/page.tsx`), e ele volta AQUI, não no
  // `[municipio]/components/Footer.tsx`: a página fala do portal inteiro, e
  // este é o único rodapé que aparece nas cinco frentes. Voltar no rodapé de
  // cidade cobriria uma zona só e ainda exigiria `<a>` cru no meio de um bloco
  // de `<Link>` de zona — o wrapper prefixaria `/betim/termos`, a mesma classe
  // de 404 mudo que o arquivo de lá documenta ter acontecido três vezes.
  { label: "Termos e origem dos dados", href: "/termos" },
  { label: "Sobre o projeto", href: "/sobre" },
  // Para jornalista que chega pelo rodapé: o portal fala de imprensa na raiz
  // (`app/imprensa/page.tsx`), mesma regra de `/sobre` e `/termos` — assunto
  // do portal inteiro não mora dentro de uma zona.
  { label: "Imprensa", href: "/imprensa" },
];

// Inscrição em novidades por e-mail (Tier 0, double opt-in: o visitante
// envia o pedido e o dono confirma antes de incluir em qualquer lista).
const MAILTO_NOVIDADES = `mailto:contato@controlepopular.com.br?subject=
  ${encodeURIComponent("Quero receber novidades \u2014 Controle Popular")}
  &body=${encodeURIComponent(
    "Ol\u00e1,\n\nQuero receber novidades do portal (novas p\u00e1ginas, dados e corre\u00e7\u00f5es).\nMeu nome:\nE-mail para envio:\n\nAutorizo o uso deste e-mail apenas para novidades do portal. (LGPD)"
  )}`;

export default function FooterGlobal() {
  return (
    <div className="mt-8 border-t border-border pt-6 text-[.85em]">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div>
          <h4 className="mb-2.5 font-semibold tracking-wide text-text-soft uppercase">
            {/* Por extenso vindo de `lib/zonas.ts`, não cravado: era
                "As cinco frentes" escrito à mão até 13/08, apesar do
                comentário no topo de `zonas.ts` jurar que nenhum texto
                fazia isso. Ver `contagemZonasPublicadas`. */}
            As {contagemZonasPublicadas()} frentes
          </h4>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {ZONAS_PUBLICADAS.map((z) => (
              <li key={z.id}>
                <a href={z.href} className="text-primary hover:text-accent">
                  {/* `nomeCurto`, não `etiqueta` cortada no "·": o corte
                      entregava "Estadual" para a frente ambiental, que não
                      diz a matéria. Ver o campo em `lib/zonas.ts`. */}
                  {z.nomeCurto}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2.5 font-semibold tracking-wide text-text-soft uppercase">
            O portal
          </h4>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {LINKS_PORTAL.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-primary hover:text-accent">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4 text-[.85em]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <PedirDadosEmail />
          <a
            href="https://t.me/ControlePopularBOT"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
            aria-label="Receber notificações no Telegram"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"></path></svg>
            Receber no Telegram
          </a>
          <a
            href={MAILTO_NOVIDADES}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
            aria-label="Receber novidades por e-mail"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"></path></svg>
            Receber novidades por e-mail
          </a>
        </div>
        <p className="mt-1 text-text-soft">
          Receba o resumo, os dados em CSV ou o PDF desta página no seu e-mail. Sem cadastro; notificação só com o seu ok (LGPD).
        </p>
        <ContadorPublico />
      </div>
    </div>
  );
}
