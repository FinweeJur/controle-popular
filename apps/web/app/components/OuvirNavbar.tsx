"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Volume2, Pause, Play, Square, Loader2, Globe } from "lucide-react";
import { RESUMOS_TOP100 } from "@/lib/resumos-top100";
import { IDIOMAS_VOZ } from "@/lib/ouvir/idiomas";
import {
  useLeitor,
  iniciarIdioma,
  definirIdioma,
  ouvir,
  pausar,
  retomar,
  parar,
  extrairTextoPrincipal,
} from "@/lib/ouvir/leitor";

const emptySubscribe = () => () => {};

function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Rotas onde a leitura traduzida fica de fora: a busca ECOA o que a pessoa
 * digitou. Enviar esse termo a um servico externo (Azure) poderia expor nome
 * ou CPF (§5.8) — melhor nao ler nessas paginas.
 */
const ROTAS_SEM_TRADUCAO = ["/busca"];

/** Nome do idioma em portugues a partir do locale (ex.: "en-US" -> "inglês"). */
function rotuloIdioma(codigo: string): string {
  try {
    const nomes = new Intl.DisplayNames(["pt"], { type: "language" });
    return nomes.of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

/**
 * Botao "Ouvir" compacto para a TopNav, com seletor de idioma.
 * Idle: escolhe o idioma + "Ouvir". Lendo: Pausar/Retomar + Parar.
 * O audio e o estado vem de `lib/ouvir/leitor` (compartilhado com o
 * controle flutuante `OuvirPagina`).
 */
export default function OuvirNavbar() {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const leitor = useLeitor();
  const [temTexto, setTemTexto] = useState(false);

  const opcoes = useMemo(() => {
    const lista = IDIOMAS_VOZ.map((i) => ({
      codigo: i.codigo,
      rotulo: rotuloIdioma(i.codigo),
    }));
    lista.sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt"));
    return lista;
  }, []);

  useEffect(() => {
    if (mounted) iniciarIdioma();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    parar();
    // Mede o `<main>` depois da pintura (nao durante o render/efeito direto):
    // assim nao ha setState sincrono no efeito e o valor enxerga a pagina ja
    // montada. "Ouvir" so aparece quando ha o que ler.
    const id = requestAnimationFrame(() =>
      setTemTexto(extrairTextoPrincipal().length > 0)
    );
    return () => cancelAnimationFrame(id);
  }, [mounted, pathname]);

  if (!mounted || !temTexto) return null;
  if (ROTAS_SEM_TRADUCAO.some((r) => pathname.startsWith(r))) return null;

  function iniciar() {
    const textoPagina = extrairTextoPrincipal();
    if (!textoPagina) return;
    const resumo =
      RESUMOS_TOP100[pathname] ?? RESUMOS_TOP100[pathname.replace(/\/$/, "")];
    void ouvir(resumo ? `${resumo}. ${textoPagina}` : textoPagina, leitor.idioma);
  }

  if (leitor.estado === "idle") {
    return (
      <div className="flex items-center gap-1">
        <label
          className="relative hidden items-center sm:flex"
          title="Idioma da leitura em voz alta"
        >
          <span className="sr-only">Idioma da leitura</span>
          <Globe
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2 text-text-soft"
          />
          <select
            value={leitor.idioma}
            onChange={(e) => definirIdioma(e.target.value)}
            className="max-w-[8.5rem] appearance-none truncate rounded-md border border-border bg-surface py-1 pl-6 pr-2 text-[11px] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {opcoes.map((o) => (
              <option key={o.codigo} value={o.codigo}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={iniciar}
          aria-label="Ouvir esta pagina em voz alta, no idioma escolhido"
          className="cp-btn-anim flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          <Volume2 size={13} aria-hidden="true" className="shrink-0" />
          <span className="hidden sm:inline">Ouvir</span>
        </button>
      </div>
    );
  }

  if (leitor.estado === "carregando") {
    return (
      <div className="flex items-center gap-1" role="status" aria-live="polite">
        <span className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          <Loader2 size={13} aria-hidden="true" className="animate-spin" />
          <span className="hidden sm:inline">Preparando...</span>
          <span className="sr-only">Preparando a leitura.</span>
        </span>
        <button
          type="button"
          onClick={parar}
          aria-label="Cancelar leitura"
          className="cp-btn-anim flex items-center justify-center rounded-md border border-border px-2 py-1 text-[11px] text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
        >
          <Square size={12} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={leitor.estado === "falando" ? pausar : retomar}
        aria-pressed={leitor.estado === "falando"}
        aria-label={leitor.estado === "falando" ? "Pausar leitura" : "Retomar leitura"}
        className="cp-btn-anim flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors duration-150 hover:bg-primary/20"
      >
        {leitor.estado === "falando" ? (
          <Pause size={13} aria-hidden="true" />
        ) : (
          <Play size={13} aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {leitor.estado === "falando" ? "Pausar" : "Retomar"}
        </span>
      </button>
      <button
        type="button"
        onClick={parar}
        aria-label="Parar leitura"
        className="cp-btn-anim flex items-center justify-center rounded-md border border-border px-2 py-1 text-[11px] text-text-soft transition-colors duration-150 hover:border-primary hover:text-primary"
      >
        <Square size={12} aria-hidden="true" />
      </button>
      <span role="status" className="sr-only">
        {leitor.estado === "falando" && "Lendo a pagina em voz alta."}
        {leitor.estado === "pausado" && "Leitura pausada."}
        {leitor.aviso}
      </span>
    </div>
  );
}
