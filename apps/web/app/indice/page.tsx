import type { Metadata } from "next";
import {
  Building2,
  Landmark,
  Scale,
  TreePine,
  Droplets,
  Map,
  Search,
  BarChart3,
  Globe,
  HeartHandshake,
  BookOpen,
  FileText,
  Shield,
  HelpCircle,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { Sparkles } from "lucide-react";
import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import novidades from "@/data/novidades.json";
import { listarCidades } from "@/lib/db/queries/municipios";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Hub global de indice do portal: `/indice`.
 *
 * Entrada do formato wiki. Aponta para as frentes, cidades, temas
 * transversais e situacoes praticas. Cada card descreve o destino e leva
 * a uma pagina de indice ou de conteudo.
 *
 * ⟲ 02/09/2026, copy v6 (docs/planos/PLANO-COPY-VOZ.md): título,
 * descrição e cabeçalho na voz nova — o índice é "o mapa", e cada porta
 * leva ao número com a fonte ao lado. Estrutura e cards intactos.
 */

const ICONES_FRENTE: Record<string, React.ReactNode> = {
  cidades: <Building2 size={14} />,
  congresso: <Landmark size={14} />,
  judiciario: <Scale size={14} />,
  ambiental: <TreePine size={14} />,
  paraopeba: <Droplets size={14} />,
  terras: <Map size={14} />,
};

export const metadata: Metadata = {
  title: "Índice — Controle Popular",
  description:
    "Todas as frentes, cidades e temas do Controle Popular num mapa só — dado público com fonte, organizado do seu jeito de procurar.",
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
          icon: ICONES_FRENTE[z.id] ?? null,
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
          cor: "var(--cp-primary)",
          badge: `${c.uf}`,
          icon: <Building2 size={14} />,
        })
      ),
    },
    {
      id: "transversal",
      titulo: "Por tema",
      topicos: [
        { href: "/busca", titulo: "Busca", descricao: "Procure por palavra, tema ou territorio.", cor: "var(--cp-accent)", badge: "Transversal", icon: <Search size={14} /> },
        { href: "/paraopeba/biblioteca", titulo: "Biblioteca de Documentos", descricao: "Acervo de publicações das ATIs, perícia e órgãos ambientais.", cor: "var(--cp-secondary)", badge: "Paraopeba", icon: <BookOpen size={14} /> },
        { href: "/dados/populares", titulo: "Paginas mais vistas", descricao: "O que as pessoas mais consultam.", cor: "var(--cp-accent)", badge: "Transversal", icon: <BarChart3 size={14} /> },
        { href: "/dados/comunicabr", titulo: "Governo federal nas cidades", descricao: "Repasses e acoes da Uniao em Minas Gerais.", cor: "var(--cp-accent)", badge: "Transversal", icon: <Globe size={14} /> },
        { href: "/direitos-em-movimento", titulo: "Direitos em Movimento", descricao: "Onde buscar ajuda e como se defender.", cor: "var(--cp-alert)", badge: "Transversal", icon: <HeartHandshake size={14} /> },
        { href: "/sobre", titulo: "Sobre", descricao: "O que e, de onde vem os dados e quem somos.", cor: "var(--cp-primary)", badge: "Portal", icon: <BookOpen size={14} /> },
        { href: "/termos", titulo: "Termos e origem dos dados", descricao: "Licenca, fontes e limitacoes.", cor: "var(--cp-primary)", badge: "Portal", icon: <FileText size={14} /> },
      ],
    },
    {
      id: "situacoes",
      titulo: "Por situacao",
      topicos: [
        { href: "/direitos-em-movimento/denuncia", titulo: "Quero denunciar", descricao: "Canais de denuncia e protecao.", cor: "var(--cp-alert)", badge: "Acao", icon: <Shield size={14} /> },
        { href: "/direitos-em-movimento/ajuda", titulo: "Preciso de ajuda", descricao: "Onde encontrar assistencia juridica e social.", cor: "var(--cp-alert)", badge: "Acao", icon: <HelpCircle size={14} /> },
        { href: "/paraopeba/entenda", titulo: "Quero entender Brumadinho", descricao: "Reparacao, auxilio e acompanhamento do Acordo.", cor: "var(--cp-secondary)", badge: "Acao", icon: <AlertTriangle size={14} /> },
        { href: "/paraopeba/vale", titulo: "Quero dados da Vale", descricao: "Cotações na B3, documentos CVM e notícias da empresa.", cor: "var(--cp-secondary)", badge: "Acao", icon: <BarChart3 size={14} /> },
        { href: "/ambiental/mariana", titulo: "Quero o Acordo de Mariana", descricao: "Execução de R$ 677 mi da repactuação do Rio Doce.", cor: "var(--cp-tertiary)", badge: "Acao", icon: <TreePine size={14} /> },
        { href: "/ambiental/barragens", titulo: "Moro perto de uma barragem", descricao: "Situacao e risco de barragens em Minas Gerais.", cor: "var(--cp-tertiary)", badge: "Acao", icon: <MapPin size={14} /> },
        { href: "/funcaosocialterra/mapa", titulo: "Quero ver o territorio", descricao: "Globo 3D com camadas de mineracao, CAR, UCs e mais.", cor: "var(--cp-accent)", badge: "Acao", icon: <Map size={14} /> },
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
        <h1 className="font-display text-3xl font-bold">Índice do Controle Popular</h1>
        <p className="max-w-2xl text-text-soft">
          Tudo o que o portal vigia, organizado do seu jeito: por frente, por cidade, por
          tema ou pelo momento em que você está. Escolha uma porta — todas levam ao número
          com a fonte ao lado.
        </p>
      </header>

      <IndiceWiki itens={itensIndice} />

      {/* Novidades */}
      <section className="mt-10 scroll-mt-20" id="novidades">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Sparkles size={20} className="text-primary" aria-hidden="true" />
          Novidades
          <a href="/novidades" className="ml-auto text-[.72em] font-medium text-text-soft hover:text-primary">
            ver tudo
          </a>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {novidades.slice(0, 6).map((item, i) => (
            <CartaoTopico
              key={`${item.data}-${i}`}
              topico={{
                href: item.link || "#",
                titulo: item.titulo,
                descricao: item.descricao,
                cor: "var(--cp-primary)",
                badge: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
                  new Date(item.data + "T12:00:00Z")
                ),
                novo: item.data >= "2026-08-24",
              }}
            />
          ))}
        </div>
      </section>

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
      <FooterGlobal />
    </main>
  );
}
