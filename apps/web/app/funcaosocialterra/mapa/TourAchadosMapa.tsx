"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";

export interface PontoAchado {
  id: string;
  titulo: string;
  subtitulo: string;
  municipio: string;
  geocodigo: string;
  camada: string;
  idx?: number;
  resumo: string;
  destaque: string;
  fonte: string;
  linkFonte: string;
  linkPortal: string;
  narracaoTexto: string;
}

export const PONTOS_ACHADOS: PontoAchado[] = [
  {
    id: "visao-geral",
    titulo: "Panorama Fundiário & Vazio Cadastral",
    subtitulo: "853 Municípios de Minas Gerais",
    municipio: "Minas Gerais (Geral)",
    geocodigo: "3106200",
    camada: "municipios-mg",
    resumo:
      "Mapeamento geoespacial das terras sem registro formal confrontadas com áreas certificadas pelo INCRA, assentamentos e malhas municipais oficiais.",
    destaque: "Mais de 16 mil feições mapeadas no acervo oficial.",
    fonte: "INCRA / Acervo Fundiário e IBGE",
    linkFonte: "https://acervofundiario.incra.gov.br/",
    linkPortal: "/funcaosocialterra",
    narracaoTexto:
      "Bem-vindo ao mapa interativo do Controle Popular. Este painel mapeia o vazio cadastral e terras públicas em todos os 853 municípios de Minas Gerais.",
  },
  {
    id: "brumadinho",
    titulo: "Brumadinho & Bacia do Paraopeba",
    subtitulo: "Reparação e Mancha de Inundação",
    municipio: "Brumadinho",
    geocodigo: "3109006",
    camada: "brumadinho-area-atingida",
    resumo:
      "Polígono oficial da área atingida pelo rompimento da barragem em 2019, obras de contenção e monitoramento dos 26 municípios atingidos pelo Acordo de R$ 37,68 bilhões.",
    destaque: "R$ 5,48 bi auditados pela FGV nos anexos municipais.",
    fonte: "Comitê Pró-Brumadinho & Auditoria FGV",
    linkFonte: "https://www.probrumadinho.mg.gov.br/",
    linkPortal: "/paraopeba/execucao",
    narracaoTexto:
      "Em Brumadinho, visualizamos o polígono exato da mancha do rompimento de 2019 e o monitoramento financeiro da reparação nos municípios da bacia.",
  },
  {
    id: "quilombolas-paracatu",
    titulo: "Sobreposição Quilombola × Manchas",
    subtitulo: "Territórios Amaros, Machadinho e São Sebastião",
    municipio: "Paracatu",
    geocodigo: "3147006",
    camada: "alerta-quilombola-mancha",
    resumo:
      "6 interseções críticas identificadas entre territórios quilombolas em titulação e manchas de inundação de barragens de mineração cadastradas na FEAM.",
    destaque: "3.192,1 hectares sob mancha de inundação publicada.",
    fonte: "FEAM / SNISB & INCRA",
    linkFonte: "https://www.feam.br/",
    linkPortal: "/funcaosocialterra/alertas",
    narracaoTexto:
      "Em Paracatu e região, o cruzamento revela seis sobreposições de territórios quilombolas com manchas de inundação de barragens minerárias.",
  },
  {
    id: "jequitinhonha-mineracao",
    titulo: "Vale do Jequitinhonha & Minerais Críticos",
    subtitulo: "Processos SIGMINE em Araçuaí e Itinga",
    municipio: "Araçuaí",
    geocodigo: "3103405",
    camada: "sigmine-operacao",
    resumo:
      "Poligonais de mineração e faixas de restrição ambiental de 8 km no Vale do Jequitinhonha, com processos autorizados confrontados com comunidades tradicionais.",
    destaque: "Dezenas de processos em fase de lavra e requerimento.",
    fonte: "Agência Nacional de Mineração (ANM/SIGMINE)",
    linkFonte: "https://sistemas.anm.gov.br/SCM/Extra/site/admin/pesquisarProcessos.aspx",
    linkPortal: "/aracuai",
    narracaoTexto:
      "No Vale do Jequitinhonha, observamos os processos minerários de lítio e suas faixas de proximidade em relação às áreas de preservação.",
  },
  {
    id: "protecao-serras",
    titulo: "Serras Protegidas & Áreas de Proteção",
    subtitulo: "Normas de Proteção e Relevo",
    municipio: "Belo Horizonte",
    geocodigo: "3106200",
    camada: "atos-area-protegida-municipios",
    resumo:
      "Leis e decretos municipais que delimitam zonas de proteção em serras e mananciais, cruzadas com a legislação ambiental unificada.",
    destaque: "8 normas com link direto à fonte oficial.",
    fonte: "Diários Oficiais e Legislação Ambiental",
    linkFonte: "https://normas.leg.br/",
    linkPortal: "/ambiental/legislacao",
    narracaoTexto:
      "Por fim, destacamos as normas municipais e estaduais de proteção às serras e patrimônio natural em Minas Gerais.",
  },
];

const emptySubscribe = () => () => {};
function useClientMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface TourAchadosMapaProps {
  onSelecionarPonto?: (ponto: PontoAchado) => void;
}

export default function TourAchadosMapa({ onSelecionarPonto }: TourAchadosMapaProps) {
  const isMounted = useClientMounted();
  const [indice, setIndice] = useState(0);
  const [narrando, setNarrando] = useState(false);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [aberto, setAberto] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pontoAtual = PONTOS_ACHADOS[indice];

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const pararVoz = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const pararAutoplay = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setReproduzindo(false);
  };

  const comunicarGlobo = (ponto: PontoAchado) => {
    const iframe = document.querySelector("iframe");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          tipo: "focar_geocodigo",
          geocodigo: ponto.geocodigo,
          camada: ponto.camada,
          idx: ponto.idx,
        },
        "*"
      );
    }
  };

  const falarPonto = (texto: string, onTerminar?: () => void) => {
    if (!synthRef.current) {
      if (onTerminar) onTerminar();
      return;
    }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    utterance.onend = () => {
      setNarrando(false);
      if (onTerminar) onTerminar();
    };
    utterance.onerror = () => {
      setNarrando(false);
      if (onTerminar) onTerminar();
    };
    setNarrando(true);
    synthRef.current.speak(utterance);
  };

  const alternarNarracao = () => {
    if (narrando) {
      pararVoz();
      setNarrando(false);
    } else {
      falarPonto(pontoAtual.narracaoTexto);
    }
  };

  const irPara = (novoIdx: number, autoFalar = false) => {
    pararVoz();
    setIndice(novoIdx);
    const ponto = PONTOS_ACHADOS[novoIdx];
    comunicarGlobo(ponto);
    if (onSelecionarPonto) {
      onSelecionarPonto(ponto);
    }

    if (autoFalar) {
      falarPonto(ponto.narracaoTexto, () => {
        if (novoIdx < PONTOS_ACHADOS.length - 1) {
          timerRef.current = setTimeout(() => {
            irPara(novoIdx + 1, true);
          }, 2500);
        } else {
          setReproduzindo(false);
        }
      });
    }
  };

  const iniciarTutorialAutomatico = () => {
    setReproduzindo(true);
    setAberto(true);
    irPara(0, true);
  };

  const anterior = () => {
    if (indice > 0) irPara(indice - 1);
  };

  const proximo = () => {
    if (indice < PONTOS_ACHADOS.length - 1) irPara(indice + 1);
  };

  if (!isMounted) return null;

  return (
    <aside
      aria-label="Tour Guiado de Achados no Mapa"
      className={`fixed bottom-4 left-4 z-30 max-w-md rounded-2xl border border-border bg-surface/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 ${
        aberto ? "w-[calc(100vw-2rem)] sm:w-96" : "w-auto"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <h2 className="font-display text-sm font-bold tracking-tight text-text">
            Guia de Achados no Mapa
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (reproduzindo) {
                pararAutoplay();
                pararVoz();
              } else {
                iniciarTutorialAutomatico();
              }
            }}
            title={reproduzindo ? "Pausar Apresentação" : "Iniciar Apresentação Automática"}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              reproduzindo
                ? "bg-primary text-text-contrast shadow-sm animate-pulse"
                : "bg-surface-2 text-text hover:bg-surface-3"
            }`}
          >
            {reproduzindo ? "⏸ Pausar Apresentação" : "▶ Ver Guia de Apresentação"}
          </button>
          <button
            type="button"
            onClick={alternarNarracao}
            title={narrando ? "Pausar Narração" : "Ouvir Explicação"}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              narrando
                ? "bg-accent text-accent-contrast shadow-sm"
                : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
            }`}
          >
            {narrando ? "🔊" : "🔈"}
          </button>
          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            className="rounded-lg bg-surface-2 px-2 py-1 text-xs text-text-soft hover:bg-surface-3 hover:text-text"
          >
            {aberto ? "Ocultar" : "Abrir"}
          </button>
        </div>
      </div>

      {aberto && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                Ponto {indice + 1} de {PONTOS_ACHADOS.length} · {pontoAtual.municipio}
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-text">{pontoAtual.titulo}</h3>
            <p className="text-xs text-text-soft">{pontoAtual.subtitulo}</p>
          </div>

          <p className="text-xs leading-relaxed text-text">{pontoAtual.resumo}</p>

          <div className="rounded-lg bg-surface-2 p-2.5 text-xs">
            <span className="block font-semibold text-text">Achado-chave:</span>
            <span className="text-text-soft">{pontoAtual.destaque}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
            <div className="flex gap-2">
              <a
                href={pontoAtual.linkFonte}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-soft hover:text-primary hover:underline"
              >
                Fonte: {pontoAtual.fonte.split("/")[0]} ↗
              </a>
              ·
              <Link href={pontoAtual.linkPortal} className="font-medium text-accent hover:underline">
                Ver no portal →
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={anterior}
              disabled={indice === 0}
              className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text disabled:opacity-40 hover:bg-surface-3"
            >
              ← Anterior
            </button>

            <div className="flex gap-1">
              {PONTOS_ACHADOS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => irPara(i)}
                  aria-label={`Ir para ponto ${i + 1}: ${p.titulo}`}
                  className={`h-2 rounded-full transition-all ${
                    i === indice ? "w-5 bg-accent" : "w-2 bg-border hover:bg-text-soft"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={proximo}
              disabled={indice === PONTOS_ACHADOS.length - 1}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-text-contrast disabled:opacity-40 hover:opacity-90"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
