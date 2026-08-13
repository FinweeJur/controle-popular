import { ZONAS_PUBLICADAS, contagemZonasPublicadas } from "@/lib/zonas";

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
  { label: "Direitos em Movimento", href: "/direitos-em-movimento" },
  { label: "Busca", href: "/busca" },
  { label: "Páginas mais vistas", href: "/dados/populares" },
  { label: "Metodologia", href: "/sobre#metodologia" },
  { label: "Sobre o projeto", href: "/sobre" },
];

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
    </div>
  );
}
