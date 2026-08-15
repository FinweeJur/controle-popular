"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Filtro em memória sobre as 853 cidades — mesmo padrão de
 * `ambiental/barragens/BuscaMunicipio.tsx`, com UMA diferença deliberada no
 * formato dos dados.
 *
 * ═══ POR QUE `[codigo, nome, comValor, itens]` E NÃO UM OBJETO ═══
 *
 * `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`: `/ambiental/legislacao` entregou 15.318
 * normas como props de componente de cliente e gerou um `.cache` de **35,5
 * MiB** contra 4,7 MiB de texto real — 7,5× de inflação, porque o payload é
 * embutido duas vezes (HTML e RSC flight) e cada linha repete o nome de todos
 * os campos. O teto da Cloudflare é 25 MiB por asset, e o deploy do portal
 * está travado nisso hoje.
 *
 * Aqui a lista é curta por linha, mas são 853 linhas: em objetos,
 * `{"codigo":…,"nome":…,"comValor":…,"itens":…}` gastaria ~40 bytes de NOME DE
 * CAMPO por cidade — 34 KB de puro rótulo, duplicados pelo flight — para
 * carregar 4 valores. A tupla carrega os mesmos 4 valores sem nenhum.
 *
 * E o que NÃO passa por aqui é o que mais importa: os 174.012 indicadores do
 * acervo ficam no servidor. A ficha de cada cidade é uma rota própria,
 * renderizada com os ~204 itens daquela cidade e nada mais.
 */

/** `[código IBGE de 6 dígitos, nome sem "/MG", itens com valor, itens no total]`. */
type CidadeCompacta = readonly [string, string, number, number];

function semAcento(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export default function BuscaCidade({ cidades }: { cidades: CidadeCompacta[] }) {
  const [termo, setTermo] = useState("");

  const filtradas = useMemo(() => {
    const alvo = semAcento(termo);
    if (!alvo) return cidades.slice(0, 24);
    return cidades.filter(([, nome]) => semAcento(nome).includes(alvo)).slice(0, 60);
  }, [termo, cidades]);

  return (
    <div>
      <label htmlFor="busca-cidade-comunicabr" className="sr-only">
        Buscar cidade de Minas Gerais
      </label>
      <input
        id="busca-cidade-comunicabr"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Digite o nome de uma cidade de Minas Gerais…"
        className="w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-[.95em] text-text outline-none focus:border-primary"
      />

      {filtradas.length === 0 ? (
        <p className="mt-4 text-sm text-text-soft">
          Nenhuma cidade de Minas bate com &quot;{termo}&quot;. O acervo tem as{" "}
          {cidades.length} do estado — se o nome não aparece, é grafia, não ausência.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map(([codigo, nome, comValor, itens]) => (
            <li key={codigo}>
              <Link
                href={`/dados/comunicabr/${codigo}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text hover:border-primary"
              >
                <span>{nome}</span>
                {/* As duas contagens juntas, nunca só a de cima: "105" sozinho
                    parece cobertura completa, e "105 de 204" é a mesma frase
                    que a página inteira faz questão de dizer. */}
                <span className="shrink-0 font-tabular text-xs text-text-soft">
                  {comValor} de {itens}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!termo && cidades.length > filtradas.length ? (
        <p className="mt-3 text-xs text-text-soft">
          Mostrando as {filtradas.length} primeiras, em ordem alfabética, de {cidades.length}. Digite
          para achar a sua.
        </p>
      ) : null}
    </div>
  );
}
