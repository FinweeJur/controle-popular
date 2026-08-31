"use client";

import { useState } from "react";
import type { TeiaInteressesMunicipio, NoGrafo } from "@/lib/teia-interesses";

interface Props {
  teia: TeiaInteressesMunicipio;
}

const CORES_NOS: Record<string, string> = {
  politico: "#3b82f6", // Azul
  empresa: "#eab308", // Amarelo
  imovel_rural: "#22c55e", // Verde
  barragem: "#ef4444", // Vermelho
  contrato_publico: "#f97316", // Laranja
  processo_judicial: "#a855f7", // Roxo
  terra_indigena: "#10b981", // Esmeralda
};

export default function TeiaInteressesGrafo({ teia }: Props) {
  const [noSelecionado, setNoSelecionado] = useState<NoGrafo | null>(
    teia.nos[0] ?? null
  );

  // Layout circular vetorial estático determinístico para visualização limpa
  const raio = 160;
  const centroX = 250;
  const centroY = 220;
  const totalNos = teia.nos.length || 1;

  const posicoesNos = teia.nos.map((no, idx) => {
    const angulo = (2 * Math.PI * idx) / totalNos;
    const x = centroX + raio * Math.cos(angulo);
    const y = centroY + raio * Math.sin(angulo);
    return { ...no, x, y };
  });

  const arestasComPosicoes = teia.arestas.map((aresta) => {
    const origem = posicoesNos.find((n) => n.id === aresta.origemId);
    const destino = posicoesNos.find((n) => n.id === aresta.destinoId);
    return {
      ...aresta,
      x1: origem?.x ?? centroX,
      y1: origem?.y ?? centroY,
      x2: destino?.x ?? centroX,
      y2: destino?.y ?? centroY,
    };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Grafo Interativo Vetorial em SVG Inline */}
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-surface-raised p-4 lg:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Grafo Relacional Interativo
          </span>
          <span className="text-xs text-text-soft">
            Clique em um nó para inspecionar vínculos
          </span>
        </div>

        <svg
          viewBox="0 0 500 440"
          className="h-auto w-full max-h-[460px] select-none"
        >
          {/* Definição de marcadores de seta */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#88888880" />
            </marker>
          </defs>

          {/* Arestas */}
          {arestasComPosicoes.map((a) => {
            const ativa =
              noSelecionado?.id === a.origemId ||
              noSelecionado?.id === a.destinoId;
            return (
              <line
                key={a.id}
                x1={a.x1}
                y1={a.y1}
                x2={a.x2}
                y2={a.y2}
                stroke={ativa ? "#3b82f6" : "#66666635"}
                strokeWidth={ativa ? 2.5 : 1.2}
                strokeDasharray={a.relacao === "sobrepoe" ? "4 3" : undefined}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Nós */}
          {posicoesNos.map((no) => {
            const selecionado = noSelecionado?.id === no.id;
            const cor = CORES_NOS[no.tipo] ?? "#3b82f6";
            return (
              <g
                key={no.id}
                onClick={() => setNoSelecionado(no)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <circle
                  cx={no.x}
                  cy={no.y}
                  r={selecionado ? 16 : 12}
                  fill={cor}
                  stroke={selecionado ? "#ffffff" : `${cor}60`}
                  strokeWidth={selecionado ? 3 : 1}
                  className="shadow-sm"
                />
                <text
                  x={no.x}
                  y={no.y + 24}
                  textAnchor="middle"
                  className="fill-text text-[10px] font-medium"
                  style={{
                    fontWeight: selecionado ? 700 : 500,
                  }}
                >
                  {no.rotulo.length > 18
                    ? `${no.rotulo.slice(0, 16)}...`
                    : no.rotulo}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legenda de Tipos */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-border/40 pt-3 text-[11px] text-text-soft">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> Político / Mandato
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" /> Empresa / Fornecedor
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> Imóvel Rural (CAR)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Terra Indígena
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Barragem / Mineração
          </div>
        </div>
      </div>

      {/* Painel Lateral com Detalhes do Nó e Evidências Oficiais */}
      <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-5 shadow-sm">
        {noSelecionado ? (
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: CORES_NOS[noSelecionado.tipo] ?? "#3b82f6",
                }}
              />
              <span className="text-xs font-semibold uppercase text-text-soft">
                {noSelecionado.tipo.replace("_", " ")}
              </span>
            </div>

            <h3 className="mt-2 font-display text-lg font-bold text-text">
              {noSelecionado.rotulo}
            </h3>
            {noSelecionado.subtitulo && (
              <p className="text-xs text-text-soft">{noSelecionado.subtitulo}</p>
            )}

            <div className="mt-4 divide-y divide-border/50 text-xs">
              {Object.entries(noSelecionado.detalhes).map(([chave, valor]) => (
                <div key={chave} className="flex justify-between py-2">
                  <span className="text-text-soft capitalize">
                    {chave.replace(/_/g, " ")}:
                  </span>
                  <span className="font-medium text-text text-right">{String(valor)}</span>
                </div>
              ))}
            </div>

            {noSelecionado.urlOficial && (
              <div className="mt-5">
                <a
                  href={noSelecionado.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Acessar certidão oficial na fonte ↗
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-soft">
            Selecione um nó no grafo para inspecionar detalhes.
          </div>
        )}

        <div className="mt-6 rounded-lg bg-surface-raised p-3 text-[11px] text-text-soft border border-border/40">
          ⚖️ <strong>Garantia Editorial:</strong> Vínculos documentados a partir de bases oficiais (TSE, PNCP, SICAR e ANM). A exibição não constitui acusação prévia.
        </div>
      </div>
    </div>
  );
}
