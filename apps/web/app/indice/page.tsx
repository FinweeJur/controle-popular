import type { Metadata } from "next";
import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import { listarCidades } from "@/lib/db/queries/municipios";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";

/**
 * Hub global de indice do portal: `/indice`.
 *
 * Entrada do formato wiki. Aponta para as frentes, cidades, temas
 * transversais e situacoes praticas. Cada card descreve o destino e leva
 * a uma pagina de indice ou de conteudo.
 */

export const metadata: Metadata = {
  title: "Indice — Controle Popular",
  description:
    "Navegue por todas as frentes, cidades e temas do Controle Popular. Dados publicos reunidos e explicados.",
};

export default async function IndiceGlobal() {
  const cidades = await listarCidades();

  const secoes = [
    {
      id: "frentes",
      titulo: "Por frente",
      topicos: ZONAS_PUBLICADAS.map(
        (z): Topico => ({
          href: `${z.href}/indice`,
          titulo: z.nomeCurto,
          descricao: z.resumo,
          cor: z.cor,
          badge: z.etiqueta,
        })
      ),
    },
    {
      id: "cidades",
      titulo: "Por cidade",
      topicos: cidades.map(
        (c): Topico => ({
          href: `/${c.slug}/indice`,
          titulo: c.nome,
          descricao: `Dados publicos de ${c.nome}-${c.uf}.`,
        })
      ),
    },
    {
      id: "transversal",
      titulo: "Por tema",
      topicos: [
        { href: "/busca", titulo: "Busca", descricao: "Procure por palavra, tema ou territorio." },
        { href: "/dados/populares", titulo: "Paginas mais vistas", descricao: "O que as pessoas mais consultam." },
        { href: "/dados/comunicabr", titulo: "Governo federal nas cidades", descricao: "Repasses e acoes da Uniao em Minas Gerais." },
        { href: "/direitos-em-movimento", titulo: "Direitos em Movimento", descricao: "Onde buscar ajuda e como se defender." },
        { href: "/sobre", titulo: "Sobre", descricao: "O que e, de onde vem os dados e quem somos." },
        { href: "/termos", titulo: "Termos e origem dos dados", descricao: "Licenca, fontes e limitacoes." },
      ],
    },
    {
      id: "situacoes",
      titulo: "Por situacao",
      topicos: [
        { href: "/direitos-em-movimento/denuncia", titulo: "Quero denunciar", descricao: "Canais de denuncia e protecao." },
        { href: "/direitos-em-movimento/ajuda", titulo: "Preciso de ajuda", descricao: "Onde encontrar assistencia juridica e social." },
        { href: "/paraopeba/entenda", titulo: "Quero entender Brumadinho", descricao: "Reparacao, auxilio e acompanhamento do Acordo." },
        { href: "/ambiental/barragens", titulo: "Moro perto de uma barragem", descricao: "Situacao e risco de barragens em Minas Gerais." },
        { href: "/funcaosocialterra/mapa", titulo: "Quero ver o territorio", descricao: "Globo 3D com camadas de mineracao, CAR e mais." },
      ],
    },
  ];

  const itensIndice = secoes.map((s) => ({ id: s.id, titulo: s.titulo }));

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indice do Controle Popular</h1>
        <p className="max-w-2xl text-text-soft">
          Dados publicos sobre cidades, Congresso, Judiciario, meio ambiente e reparacao de
          Brumadinho. Escolha por frente, cidade, tema ou situacao.
        </p>
      </header>

      <IndiceWiki itens={itensIndice} />

      {secoes.map((secao) => (
        <section key={secao.id} id={secao.id} className="mt-10 scroll-mt-20">
          <h2 className="font-display text-xl font-semibold">{secao.titulo}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secao.topicos.map((topico) => (
              <CartaoTopico key={topico.href} topico={topico} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
