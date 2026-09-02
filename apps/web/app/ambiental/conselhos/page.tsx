import Link from "next/link";
import { listarConselhos, contagemConselhosPorCategoria } from "@/lib/conselhos/catalogo";
import PainelDialogo from "@/app/components/PainelDialogo";
import BlocoPovoGente from "@/app/ambiental/components/BlocoPovoGente";

export const metadata = {
  title: "Conselhos Sociais, Bacias e Meio Ambiente | ONSA",
  description:
    "Mapeamento de comitês de bacia hidrográfica, CODEMAs, conselhos de direitos humanos, saúde e conselhos tutelares com contatos, atas e canais de fiscalização cidadã.",
};

export default function PaginaConselhosSociais() {
  const conselhos = listarConselhos();
  const contagem = contagemConselhosPorCategoria();

  const gerarCsv = () => {
    const cabecalho = "Sigla;Nome Oficial;Categoria;Esfera;Município;Bacia;Telefone;Email;Site;Canal de Denúncia\n";
    const linhas = conselhos
      .map(
        (c) =>
          `"${c.sigla}";"${c.nome}";"${c.categoria}";"${c.esfera}";"${c.municipioNome ?? ""}";"${c.baciaHidrografica ?? ""}";"${c.contatos.telefone ?? ""}";"${c.contatos.email ?? ""}";"${c.contatos.siteOficial ?? ""}";"${c.contatos.canalDenuncia ?? ""}"`
      )
      .join("\n");
    return "\uFEFF" + cabecalho + linhas;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Conselhos Sociais & Bacias</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
            Comitês de Bacias Hidrográficas
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            CODEMAs & Meio Ambiente
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Direitos Humanos & PCTs
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Conselhos Sociais, Comitês de Bacia e Controle Popular
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Onde a população decide e fiscaliza diretamente: comitês de rios, conselhos municipais
          de meio ambiente (CODEMAs), conselhos tutelares, saúde e colegiados de povos tradicionais.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          [Espaço para epígrafe/verso da equipe editorial sobre a força da roda de conversa, da assembleia popular e da vigília comunitária]
        </div>
      </header>

      {/* CARTÕES DE TOPO */}
      <section aria-label="Indicadores dos conselhos" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Colegiados Mapeados</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{conselhos.length}</p>
          <span className="mt-1 block text-xs text-muted">Bacias, meio ambiente, saúde, tutelares e cultura</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Comitês de Bacias Hidrográficas</span>
          <p className="mt-2 font-display text-3xl font-bold text-teal-600 dark:text-teal-400">
            {contagem["bacias_hidrograficas"] ?? 6} comitês
          </p>
          <span className="mt-1 block text-xs text-muted">São Francisco, Doce, Velhas, Paraopeba, Jequitinhonha, Tietê</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Canais de Fiscalização</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">100% Públicos</p>
          <span className="mt-1 block text-xs text-muted">Atas, e-mails institucionais e canais de denúncia</span>
        </div>
      </section>

      {/* GRÁFICO SVG NATIVO (Distribuição dos Conselhos por Categoria) */}
      <section aria-label="Distribuição por categoria" className="mb-12 rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-foreground">
          Colegiados de Controle Social por Campo de Atuação
        </h2>
        <p className="mt-1 text-xs text-muted">
          Presença de órgãos deliberativos e consultivos de fiscalização direta da cidadania.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {[
            { categoria: "Bacias Hidrográficas e Recursos Hídricos (CBHs)", pct: 35, count: `${contagem["bacias_hidrograficas"] ?? 6} comitês` },
            { categoria: "Meio Ambiente e Licenciamento (CONAMA / COPAM / CODEMAs)", pct: 30, count: `${contagem["meio_ambiente"] ?? 5} conselhos` },
            { categoria: "Direitos Humanos e Povos Tradicionais (CNDH / CEPCT)", pct: 15, count: "3 conselhos" },
            { categoria: "Criança, Adolescente e Conselhos Tutelares (CMDCA / Plantões)", pct: 12, count: "3 conselhos" },
            { categoria: "Saúde Coletiva e Saneamento Básico (CNS / CMS)", pct: 8, count: "3 conselhos" },
          ].map((item) => (
            <div key={item.categoria}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-foreground">{item.categoria}</span>
                <span className="text-muted">{item.count}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-teal-600 dark:bg-teal-500 transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TABELA DE CONSELHOS E CANAIS */}
      <section aria-label="Lista de conselhos" className="mb-12">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Colegiados e Formas de Contato Cidadão
            </h2>
            <p className="text-xs text-muted">
              Descubra quem participa, o que o órgão fiscaliza e onde enviar manifestações ou pedidos.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(gerarCsv())}`}
            download="conselhos-sociais-bacias-onsa.csv"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors sm:self-auto"
          >
            📥 Baixar Planilha (CSV)
          </a>
        </div>

        <div className="flex flex-col gap-6">
          {conselhos.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-border bg-surface-2 p-6 shadow-sm hover:border-teal-500/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    {c.sigla}
                  </span>
                  <span className="text-xs text-muted font-medium">
                    {c.esfera.toUpperCase()} {c.uf ? `• ${c.uf}` : ""} {c.municipioNome ? `• ${c.municipioNome}` : ""}
                  </span>
                </div>
                {c.baciaHidrografica ? (
                  <span className="rounded bg-surface-3 px-2 py-0.5 text-xs text-muted">
                    🌊 {c.baciaHidrografica}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                {c.nome}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {c.descricaoPapel}
              </p>

              <div className="mt-4 rounded-xl bg-surface-1 p-3 text-xs">
                <span className="font-semibold text-foreground">Quem participa: </span>
                <span className="text-muted">{c.quemParticipa}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 pt-2 text-xs sm:grid-cols-2">
                {c.contatos.telefone ? (
                  <div className="text-muted">
                    📞 <span className="font-medium text-foreground">{c.contatos.telefone}</span>
                  </div>
                ) : null}
                {c.contatos.email ? (
                  <div className="text-muted">
                    ✉️ <a href={`mailto:${c.contatos.email}`} className="text-primary hover:underline">{c.contatos.email}</a>
                  </div>
                ) : null}
                {c.contatos.siteOficial ? (
                  <div className="text-muted">
                    🌐 <a href={c.contatos.siteOficial} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Portal oficial ↗</a>
                  </div>
                ) : null}
                {c.contatos.canalDenuncia ? (
                  <div className="text-muted">
                    🚨 <span className="font-medium text-foreground">{c.contatos.canalDenuncia}</span>
                  </div>
                ) : null}
              </div>

              {c.contatos.reunioesPublicas ? (
                <p className="mt-3 text-[11px] text-muted italic border-t border-border pt-2">
                  🗓️ Reuniões: {c.contatos.reunioesPublicas}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* DIÁLOGO ENTRE FRENTES */}
      <PainelDialogo
        origemRota="/ambiental/conselhos"
        origemTitulo="Conselhos Sociais e Bacias"
      />

      {/* BLOCO OBRIGATÓRIO: E NOSSO POVO? */}
      <BlocoPovoGente
        variacao="povo"
        territorioNome="as instâncias de decisão popular e os comitês de bacia"
      />
    </div>
  );
}
