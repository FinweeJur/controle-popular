"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Filter,
  Sparkles,
  Leaf,
  Droplets,
  Landmark,
  Scale,
  Building2,
  Shield,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Layers,
  Pickaxe,
  Zap,
  Users,
  GraduationCap,
  HeartPulse,
  Briefcase,
} from "lucide-react";

export interface PaginaCatalogo {
  numero: number;
  id: string;
  titulo: string;
  href: string;
  eixo: string;
  badge: string;
  resumo: string;
}

interface Props {
  paginas: PaginaCatalogo[];
}

const EIXOS = [
  "Todos",
  "Eixo 1: Direitos em Movimento",
  "Eixo 2: Terra e Territórios",
  "Eixo 3: Estado e Economia",
  "Central ONSA & Ferramentas",
] as const;

interface EstiloEixo {
  card: string;
  badge: string;
  iconBg: string;
  textAcc: string;
}

function obterEstiloEixo(eixo: string): EstiloEixo {
  if (eixo.includes("Direitos")) {
    return {
      card: "border-alert/30 bg-alert/[0.025] hover:border-alert/70 hover:bg-alert/[0.06] hover:shadow-xs",
      badge: "bg-alert/10 text-alert border-alert/30",
      iconBg: "bg-alert/15 text-alert",
      textAcc: "text-alert",
    };
  }
  if (eixo.includes("Terra")) {
    return {
      card: "border-emerald-500/30 bg-emerald-500/[0.025] hover:border-emerald-500/70 hover:bg-emerald-500/[0.06] hover:shadow-xs",
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      iconBg: "bg-emerald-500/15 text-emerald-500",
      textAcc: "text-emerald-500",
    };
  }
  if (eixo.includes("Estado")) {
    return {
      card: "border-sky-500/30 bg-sky-500/[0.025] hover:border-sky-500/70 hover:bg-sky-500/[0.06] hover:shadow-xs",
      badge: "bg-sky-500/10 text-sky-500 border-sky-500/30",
      iconBg: "bg-sky-500/15 text-sky-500",
      textAcc: "text-sky-500",
    };
  }
  return {
    card: "border-primary/30 bg-primary/[0.025] hover:border-primary/70 hover:bg-primary/[0.06] hover:shadow-xs",
    badge: "bg-primary/10 text-primary border-primary/30",
    iconBg: "bg-primary/15 text-primary",
    textAcc: "text-primary",
  };
}

function obterIconeTema(p: PaginaCatalogo) {
  const id = p.id.toLowerCase();
  const href = p.href.toLowerCase();
  const titulo = p.titulo.toLowerCase();
  const badge = p.badge.toLowerCase();

  // Saúde
  if (id.includes("saude") || titulo.includes("saúde") || badge.includes("saúde")) {
    return HeartPulse;
  }
  // Educação
  if (id.includes("educacao") || titulo.includes("educação") || badge.includes("educação") || titulo.includes("ideb")) {
    return GraduationCap;
  }
  // Trabalho
  if (id.includes("trabalho") || titulo.includes("trabalho") || badge.includes("trabalho") || titulo.includes("caged")) {
    return Briefcase;
  }
  // Mineração, Barragens, Descaracterização, SIGMA
  if (
    id.includes("barragens") ||
    id.includes("sigma") ||
    titulo.includes("barragens") ||
    titulo.includes("mineração") ||
    titulo.includes("lítio") ||
    badge.includes("barragens") ||
    badge.includes("mineração")
  ) {
    if (id.includes("descaracterizacao") || titulo.includes("descaracterização") || titulo.includes("risco")) {
      return AlertTriangle;
    }
    return Pickaxe;
  }
  // Água, Rios, Bacias, Paraopeba, Mariana, Saneamento
  if (
    id.includes("paraopeba") ||
    id.includes("mariana") ||
    titulo.includes("paraopeba") ||
    titulo.includes("mariana") ||
    titulo.includes("rio doce") ||
    titulo.includes("água") ||
    badge.includes("paraopeba") ||
    badge.includes("mariana")
  ) {
    return Droplets;
  }
  // Rural, CAR, Meio Ambiente, Clima, Floresta, Unidades de Conservação
  if (
    id.includes("car") ||
    id.includes("rural") ||
    id.includes("ambiental") ||
    id.includes("clima") ||
    titulo.includes("car") ||
    titulo.includes("meio ambiente") ||
    titulo.includes("rural") ||
    titulo.includes("climática") ||
    badge.includes("meio ambiente") ||
    badge.includes("car")
  ) {
    return Leaf;
  }
  // Terras, Territórios, Globo 3D, Conflitos, Mapas
  if (
    id.includes("funcaosocialterra") ||
    id.includes("territorio") ||
    id.includes("mapa") ||
    titulo.includes("terra") ||
    titulo.includes("quilomb") ||
    titulo.includes("indígen") ||
    badge.includes("território")
  ) {
    return MapPin;
  }
  // Judiciário, Leis, Tribunais, TAC, Licitações, Legislação, Ministério Público
  if (
    id.includes("judiciario") ||
    id.includes("tac") ||
    id.includes("direito") ||
    id.includes("legislacao") ||
    titulo.includes("judiciário") ||
    titulo.includes("tribunal") ||
    titulo.includes("mpmg") ||
    titulo.includes("tac") ||
    titulo.includes("justiça") ||
    titulo.includes("sirenejud") ||
    badge.includes("judiciário") ||
    badge.includes("lai")
  ) {
    return Scale;
  }
  // Congresso, Câmara, Governo, Secretarias, Eleições, Instituições
  if (
    id.includes("congresso") ||
    id.includes("camara") ||
    id.includes("governo") ||
    id.includes("prefeitura") ||
    titulo.includes("congresso") ||
    titulo.includes("câmara") ||
    titulo.includes("governo") ||
    titulo.includes("secretaria") ||
    titulo.includes("parlamentar") ||
    badge.includes("congresso") ||
    badge.includes("governo")
  ) {
    return Landmark;
  }
  // Economia, Orçamento, Contratos, Compras, Finanças, Repasses, ICMS
  if (
    id.includes("economia") ||
    id.includes("orcamento") ||
    id.includes("comunicabr") ||
    titulo.includes("economia") ||
    titulo.includes("orçamento") ||
    titulo.includes("icms") ||
    titulo.includes("repasses") ||
    titulo.includes("contratos") ||
    badge.includes("economia")
  ) {
    return TrendingUp;
  }
  // Empresas, Corporativo, Vale, Concessionárias, Ecossistema
  if (
    id.includes("empresas") ||
    id.includes("vale") ||
    id.includes("ecossistema") ||
    titulo.includes("empresas") ||
    titulo.includes("vale") ||
    titulo.includes("ecossistema") ||
    badge.includes("empresas") ||
    badge.includes("regulação")
  ) {
    return Building2;
  }
  // Tecnologia, GitHub, Infraestrutura, Luz, Energia
  if (
    id.includes("tecnologia") ||
    id.includes("github") ||
    titulo.includes("tecnologia") ||
    titulo.includes("github") ||
    badge.includes("github")
  ) {
    return Zap;
  }
  // Alertas, Denúncia, Proteção, Defesa Civil, Segurança
  if (
    id.includes("alerta") ||
    id.includes("denuncia") ||
    id.includes("seguranca") ||
    id.includes("defesa-civil") ||
    id.includes("protecao") ||
    titulo.includes("alerta") ||
    titulo.includes("denúncia") ||
    titulo.includes("proteção")
  ) {
    return Shield;
  }
  // Cidades em geral (Betim, BH, Diamantina, etc.)
  if (
    id.includes("cidades") ||
    id.includes("betim") ||
    id.includes("bh") ||
    id.includes("diamantina") ||
    id.includes("aracuai") ||
    id.includes("itinga") ||
    id.includes("brumadinho") ||
    id.includes("mariana") ||
    id.includes("serro") ||
    id.includes("valadares") ||
    id.includes("ipatinga") ||
    id.includes("juiz-de-fora") ||
    id.includes("uberlandia") ||
    badge.includes("cidades")
  ) {
    return Building2;
  }
  // Busca
  if (id.includes("busca") || href.includes("busca")) {
    return Search;
  }
  // Acervo, Biblioteca, Documentos, Notícias, Dados
  if (
    id.includes("biblioteca") ||
    id.includes("documento") ||
    id.includes("noticia") ||
    id.includes("dados") ||
    id.includes("indice")
  ) {
    return Layers;
  }
  // Padrão
  if (p.eixo.includes("Direitos")) return Users;
  if (p.eixo.includes("Terra")) return Leaf;
  if (p.eixo.includes("Estado")) return Landmark;
  return Sparkles;
}

export default function Catalogo100PaginasClient({ paginas }: Props) {
  const [busca, setBusca] = useState("");
  const [eixoAtivo, setEixoAtivo] = useState<string>("Todos");

  const paginasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return paginas.filter((p) => {
      const casaEixo =
        eixoAtivo === "Todos" ||
        p.eixo === eixoAtivo ||
        (eixoAtivo.includes("Central") && p.eixo.includes("Central"));
      if (!casaEixo) return false;
      if (!termo) return true;
      return (
        p.titulo.toLowerCase().includes(termo) ||
        p.resumo.toLowerCase().includes(termo) ||
        p.href.toLowerCase().includes(termo) ||
        p.badge.toLowerCase().includes(termo)
      );
    });
  }, [paginas, busca, eixoAtivo]);

  return (
    <section id="catalogo-100-paginas" className="space-y-6 scroll-mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            As 100 Principais Páginas do Portal
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            Catálogo completo e auditado de rotas com potencial de interesse social, microresumos e fontes oficiais.
          </p>
        </div>
        <div className="text-xs font-mono text-text-soft bg-surface-2 px-3 py-1.5 rounded-lg self-start sm:self-auto border border-border">
          Exibindo <span className="font-bold text-primary">{paginasFiltradas.length}</span> de {paginas.length}
        </div>
      </div>

      {/* Controles: Busca e Filtro de Eixo */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por título, assunto, rota ou município (ex: SUS, Mariana, Betim, Editais, CAR)..."
            aria-label="Filtrar catálogo das 100 páginas"
            className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-soft focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1" role="tablist" aria-label="Filtrar por eixo">
          <span className="flex items-center gap-1 text-xs font-semibold text-text-soft mr-1">
            <Filter className="h-3 w-3" /> Eixos:
          </span>
          {EIXOS.map((e) => {
            const ativo = eixoAtivo === e;
            const rotuloCurto = e.replace("Eixo 1: ", "").replace("Eixo 2: ", "").replace("Eixo 3: ", "");
            return (
              <button
                key={e}
                type="button"
                role="tab"
                aria-selected={ativo}
                onClick={() => setEixoAtivo(e)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  ativo
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "border border-border bg-surface-2/60 text-text-soft hover:bg-surface-2 hover:text-text"
                }`}
              >
                {rotuloCurto}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Páginas — Design 25% mais compacto, estreito e 100% clicável */}
      {paginasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-soft">
          <p className="text-base font-medium text-text">Nenhuma página encontrada para esta busca.</p>
          <p className="mt-1 text-xs">Tente buscar por termos mais genéricos ou selecionar &quot;Todos&quot; os eixos.</p>
          <button
            type="button"
            onClick={() => { setBusca(""); setEixoAtivo("Todos"); }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {paginasFiltradas.map((p) => {
            const isExternal = p.href.startsWith("http");
            const estilo = obterEstiloEixo(p.eixo);
            const IconeTema = obterIconeTema(p);

            const cardClassName = `group relative flex flex-col justify-between rounded-xl border p-2.5 sm:p-3 transition-all ${estilo.card} hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`;

            const cardContent = (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${estilo.iconBg}`}
                        aria-hidden="true"
                      >
                        <IconeTema className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-mono text-[11px] font-bold text-text-soft/70">
                        #{String(p.numero).padStart(2, "0")}
                      </span>
                    </div>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${estilo.badge}`}
                    >
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-sm font-semibold text-text group-hover:text-primary transition-colors flex items-center justify-between gap-1 line-clamp-1">
                    <span>{p.titulo}</span>
                    {isExternal && (
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden="true" />
                    )}
                  </h3>

                  <p className="line-clamp-2 text-[11px] leading-tight text-text-soft">
                    {p.resumo}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <code className="font-mono text-text-soft/80 truncate max-w-[130px] sm:max-w-[150px]">
                    {p.href.replace("https://github.com/FinweeJur/", "gh:")}
                  </code>
                  <span className={`font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${estilo.textAcc}`}>
                    {isExternal ? (
                      <>
                        Abrir <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                      </>
                    ) : (
                      "Acessar →"
                    )}
                  </span>
                </div>
              </>
            );

            return isExternal ? (
              <a
                key={p.numero}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClassName}
                aria-label={`Acessar ${p.titulo} (abre em nova guia)`}
              >
                {cardContent}
              </a>
            ) : (
              <Link
                key={p.numero}
                href={p.href}
                className={cardClassName}
                aria-label={`Acessar ${p.titulo}`}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
