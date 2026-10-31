"use client";

/**
 * @file apps/web/app/universidades/CruzamentoUniversidades.tsx
 * @description Cruzamento do acervo por tema, local e data.
 *
 * Papel no portal: sair do cartão isolado e mostrar o mapa. Cada chip é um
 * filtro: clicar em "Saúde · MG" leva a lista já recortada naquele tema e
 * naquele estado. Nada aqui inventa número — as linhas chegam calculadas de
 * `lib/universidades/cruzamento.ts`, a partir dos registros já filtrados.
 *
 * Por que cliente: o clique precisa aplicar filtro sem recarregar. O portal é
 * export estático e não tem servidor para ler `searchParams`.
 *
 * Acessibilidade: cada chip é `<button>` com `aria-pressed`, alvo de toque
 * confortável e texto de 12 px no mínimo (AGENTS §5.16).
 */

import type { ReactNode } from "react";
import { CalendarDays, Layers, MapPin } from "lucide-react";
import type {
  LinhaData,
  LinhaLocal,
  LinhaTema,
} from "@/lib/universidades/cruzamento";

export interface CruzamentoProps {
  temas: LinhaTema[];
  locais: LinhaLocal[];
  datas: LinhaData[];
  temaAtivo: string;
  ufAtiva: string;
  anoAtivo: string;
  /** Registros sem tema transversal: aparecem em local e data, não na matriz. */
  semTema: number;
  onFiltrar: (patch: { tema?: string; uf?: string; ano?: string }) => void;
}

const chipBase =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors";
const chipOff =
  "border-border bg-surface text-text hover:border-primary hover:text-primary";
const chipOn = "border-primary bg-primary/10 text-primary";

function Chip({
  ativo,
  onClick,
  children,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  children: ReactNode;
  titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title={titulo}
      className={`${chipBase} ${ativo ? chipOn : chipOff}`}
    >
      {children}
    </button>
  );
}

/** Título curto de cada bloco do mapa. */
function Titulo({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text">
      {icone}
      {children}
    </h3>
  );
}

/** Matriz tema × estado: uma linha por tema, um chip por UF. */
function BlocoTemas({
  temas,
  temaAtivo,
  ufAtiva,
  semTema,
  onFiltrar,
}: Pick<CruzamentoProps, "temas" | "temaAtivo" | "ufAtiva" | "semTema" | "onFiltrar">) {
  return (
    <div>
      <Titulo icone={<Layers className="h-4 w-4 text-primary" aria-hidden="true" />}>
        Tema × estado
      </Titulo>

      {temas.length === 0 ? (
        <p className="text-xs text-text-soft">Sem tema classificado.</p>
      ) : (
        <ul className="space-y-2">
          {temas.map((linha) => (
            <li key={linha.tema}>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onFiltrar({ tema: linha.tema })}
                  aria-pressed={temaAtivo === linha.tema}
                  className={`text-left text-xs font-semibold ${
                    temaAtivo === linha.tema
                      ? "text-primary"
                      : "text-text hover:text-primary"
                  }`}
                >
                  {linha.nome}
                </button>
                <span className="text-xs text-text-soft">{linha.total}</span>
                {linha.porUf.map((celula) => (
                  <Chip
                    key={`${linha.tema}-${celula.uf}`}
                    ativo={temaAtivo === linha.tema && ufAtiva === celula.uf}
                    titulo={`${linha.nome} em ${celula.uf}: ${celula.total} registros`}
                    onClick={() =>
                      onFiltrar({ tema: linha.tema, uf: celula.uf })
                    }
                  >
                    {celula.uf}{" "}
                    <span className="font-normal">{celula.total}</span>
                  </Chip>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {semTema > 0 && (
        <p className="mt-2 text-xs text-text-soft">
          {semTema} registro{semTema === 1 ? "" : "s"} sem tema classificado —
          contam em local e data, não nesta matriz.
        </p>
      )}
    </div>
  );
}

/** Recorte por estado: total, grupos, projetos e instituições. */
function BlocoLocais({
  locais,
  ufAtiva,
  onFiltrar,
}: Pick<CruzamentoProps, "locais" | "ufAtiva" | "onFiltrar">) {
  return (
    <div>
      <Titulo icone={<MapPin className="h-4 w-4 text-primary" aria-hidden="true" />}>
        Local
      </Titulo>

      {locais.length === 0 ? (
        <p className="text-xs text-text-soft">Sem estado.</p>
      ) : (
        <ul className="space-y-2">
          {locais.map((linha) => (
            <li key={linha.uf}>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip
                  ativo={ufAtiva === linha.uf}
                  titulo={`Filtrar ${linha.uf}: ${linha.total} registros`}
                  onClick={() => onFiltrar({ uf: linha.uf })}
                >
                  {linha.uf} <span className="font-normal">{linha.total}</span>
                </Chip>
                <span className="text-xs text-text-soft">
                  {linha.grupos} grupo{linha.grupos === 1 ? "" : "s"} ·{" "}
                  {linha.projetos} projeto{linha.projetos === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 pl-1 text-xs text-text-soft">
                {linha.instituicoes.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Recorte por ano do relatório ou início do projeto. */
function BlocoDatas({
  datas,
  anoAtivo,
  onFiltrar,
}: Pick<CruzamentoProps, "datas" | "anoAtivo" | "onFiltrar">) {
  return (
    <div>
      <Titulo
        icone={<CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />}
      >
        Data
      </Titulo>

      {datas.length === 0 ? (
        <p className="text-xs text-text-soft">Sem data na fonte.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {datas.map((linha) => (
            <li key={linha.ano}>
              <Chip
                ativo={anoAtivo === linha.ano}
                titulo={`Filtrar ${linha.ano}: ${linha.total} registros`}
                onClick={() => onFiltrar({ ano: linha.ano })}
              >
                {linha.ano} <span className="font-normal">{linha.total}</span>
              </Chip>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-text-soft">
        Em grupo, o ano é o do relatório oficial do DGP. Em projeto, é o início
        da execução. A fonte não publica a data de criação do grupo.
      </p>
    </div>
  );
}

export default function CruzamentoUniversidades({
  temas,
  locais,
  datas,
  temaAtivo,
  ufAtiva,
  anoAtivo,
  semTema,
  onFiltrar,
}: CruzamentoProps) {
  const vazio = temas.length === 0 && locais.length === 0 && datas.length === 0;

  return (
    <section
      id="cruzamento"
      aria-label="Cruzamento por tema, local e data"
      className="scroll-mt-24 rounded-xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="mb-3">
        <h2 className="text-lg font-bold text-text">
          Cruzamento: tema, local e data
        </h2>
        <p className="mt-1 text-xs text-text-soft">
          Cada chip aplica o filtro na lista abaixo. Os números saem do acervo
          já filtrado — não são estimativa.
        </p>
      </div>

      {vazio ? (
        <p className="text-sm text-text-soft">
          Nenhum registro com os filtros atuais.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <BlocoTemas
            temas={temas}
            temaAtivo={temaAtivo}
            ufAtiva={ufAtiva}
            semTema={semTema}
            onFiltrar={onFiltrar}
          />
          <div className="space-y-5">
            <BlocoLocais locais={locais} ufAtiva={ufAtiva} onFiltrar={onFiltrar} />
            <BlocoDatas datas={datas} anoAtivo={anoAtivo} onFiltrar={onFiltrar} />
          </div>
        </div>
      )}
    </section>
  );
}
