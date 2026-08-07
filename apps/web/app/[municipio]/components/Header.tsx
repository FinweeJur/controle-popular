import Link from "@/lib/betim/link";
import type { Cidade } from "@/lib/db/queries/municipios";
import ThemeSwitcher from "@/app/[municipio]/components/ThemeSwitcher";
import FontSizeControl from "@/app/[municipio]/components/FontSizeControl";
import NavDropdown from "@/app/[municipio]/components/NavDropdown";
import BuscaUniversal from "@/app/components/BuscaUniversal";
import { paginasDados } from "@/lib/betim/dadosNav";

// Ordem do nav: [Prefeitura], [Câmara], Serviços, [Dados], Notícias, Sobre.
// Prefeitura, Câmara e Dados têm menu suspenso (pedido do usuário
// 2026-07-24: replicar pra Prefeitura/Câmara o dropdown que Dados já
// tinha). Serviços/Notícias/Sobre são links simples.
const PREFEITURA_SUB = [
  { href: "/prefeitura", nome: "Visão geral" },
  { href: "/prefeitura/contratos", nome: "Contratos" },
  { href: "/prefeitura/servidores", nome: "Servidores" },
  { href: "/prefeitura/despesas", nome: "Despesas" },
  { href: "/prefeitura/obras", nome: "Obras" },
];
const CAMARA_SUB = [
  { href: "/camara", nome: "Vereadores" },
  { href: "/camara/proposicoes", nome: "Proposições" },
  { href: "/camara/comissoes", nome: "Comissões" },
  // A Legislação saiu de /prefeitura em 2026-08-07. Em Araçuaí e Diamantina o
  // acervo de normas é da CÂMARA (SAPL e portal da Casa), e a URL era o único
  // lugar onde isso não dava para corrigir com texto: o `<h1>` já dizia o
  // órgão certo desde `orgaoDoAcervoNormativo`, mas o endereço dizia
  // "prefeitura". Ver a página-ponte em `prefeitura/legislacao/page.tsx`.
  { href: "/camara/legislacao", nome: "Legislação" },
  // Cobrem lei sancionada E projeto em tramitação — por isso não vivem sob
  // /camara, mas o ponto de entrada mais descoberto continua sendo aqui, ao
  // lado da lista de normas que os alimenta.
  { href: "/legislacao/alertas", nome: "Legislação · Alertas" },
  { href: "/legislacao/bons-exemplos", nome: "Legislação · Bons exemplos" },
];
const NAV_LINKS_DEPOIS_DADOS = [
  { label: "Assistente", href: "/assistente" },
  { label: "Notícias", href: "/noticias" },
  { label: "Sobre", href: "/sobre" },
];

export default function Header({ cidade }: { cidade: Cidade }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface px-4 py-3 backdrop-blur sm:px-8">
      {/* Deixou de ser um flex-row único: a faixa da busca precisa de largura
          inteira embaixo, e no meio da linha do nav ela ficaria estreita
          demais para o painel de sugestões mostrar o subtítulo (objeto do
          contrato, ementa da proposição). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-6">
        {/* <a> puro: a raiz está FORA do basePath (`/betim`) deste app, e
            next/link a prefixaria, mandando para a home do Betim em vez da
            home da marca. */}
        <a
          href="/"
          className="font-display text-[1.15em] font-bold tracking-tight text-text"
        >
          controlepopular<span className="text-primary">.br</span>
        </a>
        {/* "<Cidade> · UF" leva pra home da cidade (pedido do usuário
            2026-07-24). `<Link href="/">` sob o basePath `/betim` resolve
            pra `/betim` — a home desta cidade —, diferente do wordmark
            acima, que é `<a href="/">` cru pra raiz da MARCA (fora do
            basePath). */}
        <Link
          href="/"
          className="border-l border-border pl-3 text-[.85em] text-text-soft transition-colors duration-150 hover:text-primary"
        >
          {cidade.nome} · {cidade.uf}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-[.88em] font-medium">
          <NavDropdown label="Prefeitura" href="/prefeitura" itens={PREFEITURA_SUB} />
          <NavDropdown label="Câmara" href="/camara" itens={CAMARA_SUB} />
          <Link
            href="/servicos"
            className="cp-link-underline text-text-soft transition-colors duration-150 hover:text-primary"
          >
            Serviços
          </Link>
          <NavDropdown label="Dados" href="/dados" itens={paginasDados(cidade)} largura="w-72" />
          {NAV_LINKS_DEPOIS_DADOS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="cp-link-underline text-text-soft transition-colors duration-150 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Pontes para as zonas irmãs. Também <a> puro, mesmo motivo. */}
        <a
          href="/congresso"
          className="cp-btn-anim rounded-md border border-border px-2.5 py-1 text-[.8em] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          Congresso →
        </a>
        <a
          href="/judiciario"
          className="cp-btn-anim rounded-md border border-border px-2.5 py-1 text-[.8em] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          Judiciário →
        </a>
        <ThemeSwitcher />
        <FontSizeControl />
      </div>
      </div>

      <div className="mt-3">
        <BuscaUniversal
          endpointSugestoes={`/${cidade.slug}/api/busca`}
          endpointChat={`/${cidade.slug}/api/chat`}
          placeholder={`Buscar contrato, vereador, projeto — ou perguntar sobre ${cidade.nome}`}
          exemplos={[
            `Quanto a Prefeitura de ${cidade.nome} gasta em saúde?`,
            "Quais os maiores contratos da Prefeitura?",
            "O que a Câmara propôs sobre mobilidade?",
          ]}
          aviso="O assistente responde com base nos dados já reunidos no portal e pode errar. Confira sempre na página e na fonte oficial."
        />
      </div>
    </header>
  );
}
