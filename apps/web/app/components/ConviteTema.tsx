"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * @file Convite de tema — aparece uma vez, depois da primeira leitura.
 *
 * O QUE É: a pílula discreta que lembra que o portal tem tema escuro e temas de
 * bioma. O padrão do site passou a ser o CLARO em 02/11/2026 (decisão do
 * dono); sem este convite, quem prefere escuro nunca descobre que existe.
 *
 * POR QUE NÃO UM MODAL: interromper a leitura de quem veio atrás de dado de
 * barragem para perguntar sobre cor de fundo é ruído. O convite entra depois de
 * 6 s, no canto, e some sozinho da próxima vez — guarda a decisão em
 * `localStorage`, não em cookie.
 *
 * ACESSIBILIDADE: é uma `region` rotulada, não um diálogo (não prende o foco);
 * os botões têm alvo de 44 px no celular; com `prefers-reduced-motion` a
 * entrada não anima, ela só aparece. Contraste vem dos tokens do tema.
 *
 * QUEM DECIDE O TEMA É O next-themes: aqui só se chama `setTheme`. O atributo
 * `data-theme` no `<html>` já foi escrito pelo script anti-flash do layout.
 */

const CHAVE = "cp:convite-tema";
const ATRASO_MS = 6000;

const TEMAS_EXTRAS = [
  { id: "pequi", rotulo: "Pequi" },
  { id: "cerrado", rotulo: "Cerrado" },
  { id: "mata-atlantica", rotulo: "Mata Atlântica" },
  { id: "caatinga", rotulo: "Caatinga" },
  { id: "pantanal", rotulo: "Pantanal" },
  { id: "high-contrast", rotulo: "Alto contraste" },
];

export default function ConviteTema() {
  const { setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [listaAberta, setListaAberta] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE)) return;
    } catch {
      // Sem storage: o convite aparece nesta visita e não volta a insistir.
    }
    const t = window.setTimeout(() => {
      setMontado(true);
      // Um quadro depois de montar, para a transição ter de onde sair.
      requestAnimationFrame(() => setVisivel(true));
    }, ATRASO_MS);
    return () => window.clearTimeout(t);
  }, []);

  const fechar = () => {
    setVisivel(false);
    try {
      window.localStorage.setItem(CHAVE, "1");
    } catch {
      // storage bloqueado: só esconde nesta visita.
    }
    window.setTimeout(() => setMontado(false), 250);
  };

  const trocar = (id: string) => {
    setTheme(id);
    fechar();
  };

  if (!montado) return null;

  const botao =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary min-h-11";

  return (
    <section
      aria-label="Sugestão de tema"
      className={`fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] transition-all duration-300 motion-reduce:transition-none ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-lg">
        <div className="flex items-start gap-2">
          <p className="text-sm text-foreground">
            Prefere o tema <strong>escuro</strong> ou um tema de bioma?
          </p>
          <button
            type="button"
            onClick={fechar}
            aria-label="Dispensar sugestão de tema"
            className="ml-1 shrink-0 rounded-md px-2 text-lg leading-none text-text-soft hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={botao} onClick={() => trocar("dark")}>
            Tema escuro
          </button>
          <button
            type="button"
            className={botao}
            aria-expanded={listaAberta}
            aria-controls="convite-tema-lista"
            onClick={() => setListaAberta((aberto) => !aberto)}
          >
            {listaAberta ? "Fechar temas" : "Ver temas"}
          </button>
        </div>

        {listaAberta ? (
          <ul id="convite-tema-lista" className="mt-2 flex flex-wrap gap-1.5">
            {TEMAS_EXTRAS.map((tema) => (
              <li key={tema.id}>
                <button
                  type="button"
                  onClick={() => trocar(tema.id)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                >
                  {tema.rotulo}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
