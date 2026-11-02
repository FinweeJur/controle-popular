import Link from "next/link";

/**
 * @file Bloco "outros acervos" do painel de empresas.
 *
 * POR QUE EXISTE: o leitor precisa saber por que fortunas, conglomerados,
 * executivos e documentos NÃO estão nas facetas. Sem dizer, parece que o painel
 * perdeu conteúdo; dizendo, fica claro que são registros de outro tipo e que o
 * endereço próprio é intencional.
 *
 * FONTE: nenhuma. É navegação para rotas que continuam existindo.
 */

const ACERVOS = [
  { href: "/empresas/fortunas", rotulo: "1.000 maiores fortunas" },
  { href: "/empresas/conglomerados", rotulo: "Monopólios, holdings e cartéis" },
  { href: "/empresas/executivos", rotulo: "Executivos, conselhos e porta giratória" },
  { href: "/empresas/documentos", rotulo: "Biblioteca de relatórios ESG e CVM" },
];

export default function OutrosAcervos() {
  return (
    <section aria-labelledby="titulo-outros-acervos" className="space-y-3">
      <h2 id="titulo-outros-acervos" className="font-display text-xl font-semibold">
        Outros acervos — não são recorte deste painel
      </h2>
      <p className="text-sm text-text-soft">
        Estes assuntos têm registro próprio (pessoa, cargo, documento ou grafo de controle) e
        continuam em endereço próprio. Juntá-los por prefixo misturaria tipos de dado diferentes:
      </p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {ACERVOS.map((acervo) => (
          <li key={acervo.href}>
            <Link className="underline" href={acervo.href}>
              {acervo.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
