import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/documentacao/editorial", {
  title: "Principios Editoriais — Documentacao Controle Popular",
  description:
    "Regras de publicacao do portal: dupla verificacao, dado pessoal, lacuna como informacao e resumo gerado por IA.",
});

const PRINCIPIOS = [
  {
    titulo: "Dupla verificacao obrigatoria",
    corpo:
      "Todo calculo e toda metodologia passam por duas verificacoes independentes antes de publicar. Link para a fonte oficial em ABNT (Autor/Data) com hiperlink no texto e botao Fonte.",
  },
  {
    titulo: "Dado pessoal: varrer o dado, nao so o codigo",
    corpo:
      "CPF pode aparecer dentro de ementa oficial (aconteceu com TAC do IBAMA) ou colado ao nome em outro campo (aconteceu na Rouanet). O script scripts/checar-dado-pessoal.py usa mod-11 para varrer todo campo de texto de todo registro antes de cada commit.",
  },
  {
    titulo: "Lacuna e informacao",
    corpo:
      "Publicar so o que tem valor faz a cobertura parecer completa. O portal diz quantos itens vieram vazios. Se a fonte nao tem, a resposta e: nao sei, e aqui esta o que existe perto.",
  },
  {
    titulo: "Insinuacao e dano",
    corpo:
      "Dois dados verdadeiros lado a lado podem sugerir um terceiro dado falso. O portal declara explicitamente o que a junção nao implica. Casos reais: Repasse do Acordo de Mariana, incentivador x fornecedor, total doado da Rouanet.",
  },
  {
    titulo: "Resumo gerado por modelo de IA",
    corpo:
      "E o portal afirmando algo. Rotulado como gerado por maquina, com data e modelo. Nunca apresentado como conclusao do autor do documento. O numero vem do dado; o modelo so embulha.",
  },
  {
    titulo: "Pagina com muito dado tem cinco coisas, sempre",
    corpo:
      "Grafico (SVG inline ou CSS, sem biblioteca), cartoes de status no topo, botao de CSV filtrado (separador ; e BOM UTF-8), filtros pelos campos que o acervo tem, e ordenacao por coluna.",
  },
];

export default function EditorialPage() {
  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">Inicio</Link>{" "}·{" "}
          <Link href="/documentacao" className="hover:text-primary">Documentacao</Link>{" "}·{" "}
          <span className="text-text">Principios editoriais</span>
        </nav>

        <header className="space-y-3">
          <p className="font-mono text-xs text-text-soft">04 / editorial</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Principios editoriais
          </h1>
          <p className="text-text-soft">
            O portal e lido por quem esta sob estresse — denuncia, remocao, barragem.
            Isso muda o padrao de qualidade: acessibilidade nao e opcional, numero errado
            e dano, e insinuacao e dano mesmo quando cada dado isolado esta certo.
          </p>
        </header>

        <section className="space-y-4">
          {PRINCIPIOS.map((p) => (
            <div key={p.titulo} className="rounded-xl border border-border bg-surface-2/40 p-5 space-y-2">
              <h2 className="font-display text-base font-semibold">{p.titulo}</h2>
              <p className="text-sm text-text-soft">{p.corpo}</p>
            </div>
          ))}
        </section>

        <nav className="flex justify-between text-sm">
          <Link href="/documentacao/api-publica" className="text-text-soft hover:text-primary">
            ← API pública
          </Link>
          <Link href="/documentacao" className="text-text-soft hover:text-primary">
            Índice da documentação →
          </Link>
        </nav>
      </main>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-12">
        <FooterGlobal />
      </div>
    </>
  );
}
