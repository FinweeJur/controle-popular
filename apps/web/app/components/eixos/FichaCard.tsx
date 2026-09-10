import React from 'react';
import Link from 'next/link';
import type { Ficha } from '@/lib/eixos/types';
import { CATALOGO_EIXOS } from '@/lib/eixos/catalogo';

interface Props {
  ficha: Ficha;
  variant?: 'normal' | 'compact';
  showEixoTag?: boolean;
}

export default function FichaCard({ ficha, variant = 'normal', showEixoTag = true }: Props) {
  const eixo = CATALOGO_EIXOS[ficha.eixo];
  const subfrente = eixo?.subfrentes.find((s) => s.id === ficha.subfrente);

  const corVar = eixo?.corVar ?? '--cp-primary';
  const corInkVar = eixo?.corInkVar ?? '--cp-primary-ink';

  const formatarData = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const rotaEixo =
    ficha.eixo === 'direitos'
      ? '/direitos-em-movimento'
      : ficha.eixo === 'terra'
      ? '/terra-e-territorios'
      : '/estado-e-economia';

  const subfrentesMapeadas: Record<string, string> = {
    'saude-publica': '/direitos-em-movimento/saude-publica',
    educacao: '/direitos-em-movimento/educacao',
    'trabalho-e-renda': '/direitos-em-movimento/trabalho-e-renda',
    cidades: '/terra-e-territorios/cidades',
    'nossas-serras': '/terra-e-territorios/nossas-serras',
    'nossos-rios': '/terra-e-territorios/nossos-rios',
    'meio-ambiente': '/ambiental',
    judiciario: '/judiciario/instituicoes',
    orcamento: '/estado-e-economia/orcamento',
    congresso: '/congresso',
  };
  const rotaSubfrente = subfrentesMapeadas[ficha.subfrente] ?? `${rotaEixo}?subfrente=${ficha.subfrente}`;

  const fichasDestino: Record<string, string> = {
    'ficha-bh-saude-sus': '/direitos-em-movimento/saude-publica',
    'ficha-bh-educacao-ideb': '/direitos-em-movimento/educacao',
    'ficha-bh-orcamento-execucao': '/estado-e-economia/orcamento',
    'ficha-bh-meio-ambiente-velhas': '/terra-e-territorios/nossos-rios',
    'ficha-betim-saude-cnes': '/betim',
    'ficha-betim-paraopeba-obras': '/paraopeba',
    'ficha-sirenejud-processos-mg': '/judiciario/sirenejud',
  };
  const destinoFicha = fichasDestino[ficha.id] ?? rotaSubfrente;

  if (variant === 'compact') {
    return (
      <article className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-border/80 hover:shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {showEixoTag && eixo && (
            <Link
              href={rotaEixo}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              style={{ backgroundColor: `var(${corVar})`, color: `var(${corInkVar})` }}
            >
              {eixo.titulo}
            </Link>
          )}
          {subfrente && (
            <Link
              href={rotaSubfrente}
              className="text-xs font-medium text-muted hover:text-primary transition-colors"
            >
              {subfrente.titulo}
            </Link>
          )}
        </div>
        <h4 className="font-display text-sm font-bold text-foreground leading-snug line-clamp-2">
          <Link
            href={destinoFicha}
            className="group/link inline-flex items-center gap-1 hover:text-primary hover:underline transition-colors"
          >
            <span>{ficha.titulo}</span>
            <span className="text-xs opacity-70 group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
          </Link>
        </h4>
        <p className="mt-1.5 text-xs text-muted leading-relaxed line-clamp-2">
          {ficha.resumo}
        </p>
      </article>
    );
  }

  return (
    <article className="group rounded-2xl border border-border bg-surface p-5 sm:p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* CABEÇALHO DO CARD */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {showEixoTag && eixo && (
            <Link
              href={rotaEixo}
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shadow-xs hover:opacity-90 transition-opacity"
              style={{ backgroundColor: `var(${corVar})`, color: `var(${corInkVar})` }}
            >
              {eixo.titulo}
            </Link>
          )}
          {subfrente && (
            <Link
              href={rotaSubfrente}
              className="rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-xs font-medium text-muted hover:text-primary hover:border-primary/40 transition-colors"
            >
              {subfrente.titulo}
            </Link>
          )}
        </div>
        <span className="text-xs text-muted" title="Data de publicação">
          {formatarData(ficha.dataPublicacao)}
        </span>
      </div>

      {/* TÍTULO E RESUMO */}
      <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
        <Link
          href={destinoFicha}
          className="group/link inline-flex items-center gap-1.5 hover:text-primary hover:underline transition-colors"
        >
          <span>{ficha.titulo}</span>
          <span className="text-xs opacity-70 group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
        </Link>
      </h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        {ficha.resumo}
      </p>

      {/* INDICADORES EM DESTAQUE */}
      {ficha.indicadores && ficha.indicadores.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-border/50">
          {ficha.indicadores.slice(0, 2).map((ind) => (
            <div key={ind.chave} className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs">
              <span className="text-muted">{ind.nome}: </span>
              <strong className="text-foreground font-semibold">
                {ind.valor} {ind.unidade ?? ''}
              </strong>
            </div>
          ))}
        </div>
      )}

      {/* RODAPÉ COM FONTES E TAGS */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-foreground">Fontes:</span>
          {ficha.fontes.map((f, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted/60">·</span>}
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                  title={`Abrir fonte oficial: ${f.nome}`}
                >
                  {f.nome}
                  <span className="text-xs" aria-hidden="true">↗</span>
                </a>
              ) : (
                <span>{f.nome}</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ficha.tags.map((t) => (
            <Link
              key={t}
              href={`/busca?q=${encodeURIComponent(t)}`}
              className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-soft hover:bg-primary/15 hover:text-primary transition-colors duration-150"
              title={`Ver mais itens com o tema #${t}`}
            >
              #{t}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
