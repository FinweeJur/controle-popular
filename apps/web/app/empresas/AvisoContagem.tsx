import Link from "next/link";

/**
 * @file Aviso de procedência das contagens do painel de empresas.
 *
 * POR QUE EXISTE: o painel mostra N de entidades por setor, e um número ao lado
 * de "risco crítico" parece medição de mercado. Não é: é a contagem do acervo
 * versionado que o portal publica, com classificação derivada do setor. Publicar
 * isso sem dizer transforma contagem em afirmação falsa.
 *
 * O aviso fica ANTES do primeiro número, não no rodapé: quem chega pelo celular
 * precisa ler a ressalva antes de interpretar o contador.
 *
 * FONTE: o acervo `data/empresas-perfil/entidades-completas.json`; a fonte
 * oficial de cada entidade (CVM, SEC, PNCP, ANM) está linkada na ficha dela.
 */

export default function AvisoContagem({ total }: { total: number }) {
  return (
    <aside
      aria-label="Procedência das contagens do painel"
      className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm sm:p-5"
    >
      <p className="font-semibold text-foreground">
        Os números abaixo são contagem deste acervo — não medição de mercado.
      </p>
      <p className="mt-1.5 text-text-soft">
        O painel conta as {total.toLocaleString("pt-BR")} entidades do arquivo versionado que
        alimenta esta página. Não é ranking por valor de mercado, faturamento ou importância: é o
        recorte do que o portal publica. A classificação de risco socioambiental é derivada do setor
        pelo portal, não é laudo do órgão ambiental.
      </p>
      <p className="mt-2 text-xs">
        <Link href="/documentacao/fontes-e-coletas" className="font-medium underline">
          Como o portal trata fonte, coleta e data
        </Link>{" "}
        <span className="text-text-soft">
          — a fonte oficial de cada entidade (CVM, SEC, PNCP, ANM) está na ficha dela.
        </span>
      </p>
    </aside>
  );
}
