"use client";

/**
 * Mística do Dia — bloco de memória da home.
 *
 * O que faz: mostra, abaixo da nav bar e do letreiro "✦ OLHO ABERTO ✦" e
 * acima da capa-hero, a luta popular do DIA do visitante. O calendário
 * guarda UM verbete por ASSUNTO do dia (regra do dono, 30/09/2026); a
 * home mostra o primeiro verbete por inteiro e lista os demais assuntos
 * do dia em um bloco recolhível ("Também neste dia"), para o leitor não
 * perder o resto sem ocupar a tela. Citação CURTA da fonte no formato do
 * dev `(Obra, Autor, Data)`, com link quando houver.
 *
 * UNIFICAÇÃO DAS DATAS (dev, 30/09/2026): o selo de ano só aparece
 * quando o título NÃO traz o ano; e a citação é curta, para a data não
 * sair duas vezes na tela.
 *
 * POR QUE COMPONENTE DE CLIENTE E CARGA SOB DEMANDA (decisão técnica):
 * 1. o dia tem que ser o do visitante, não o do build — a home é
 *    pré-renderizada, então o cálculo tem que rodar no navegador;
 * 2. o calendário tem centenas de entradas (~150 KB): importar isso no
 *    bundle principal inflaria a página mais visitada do portal. O módulo
 *    entra por `import()` dentro do efeito, virando um chunk separado;
 * 3. sem entrada do dia, o componente não renderiza nada — a lacuna é
 *    declarada pelo silêncio, nunca por fato inventado (AGENTS.md §7).
 *
 * EDIÇÃO DE TEXTO (dono, 30/09/2026): a fonte é citada DIRETO, sem o
 * rótulo "Fonte:" e sem a nota "fato sem data no original". O bloco
 * conta a história (quem, o que, quando, qual luta) — o resumo pode ter
 * até 2 parágrafos — e fecha com a citação curta `(Obra, Autor, Data)`.
 *
 * Acessibilidade: é um `aside` rotulado e sem cor como único canal; a
 * lista de outros assuntos usa `details`/`summary` (teclado e leitor de
 * tela nativos), sem depender de JavaScript de interação.
 */

import { useEffect, useState } from "react";
import type { EntradaCalendario } from "@/lib/memoria/tipos";
import type { Local } from "@/lib/memoria/locais";
import { CampfireColonyAnim } from "@/app/components/CampfireColonyAnim";
import BotaoVoarAte from "@/app/components/BotaoVoarAte";

interface ItemMistica {
  entrada: EntradaCalendario;
  fonte: string;
  seloAno: boolean;
  local: Local | null;
}

interface MisticaCarregada {
  principal: ItemMistica;
  outros: ItemMistica[];
}

/** Rótulo do ano + título, sem repetir a data (selo só quando cabe). */
function TituloMistica({ item }: { item: ItemMistica }) {
  return (
    <>
      {item.seloAno ? (
        <span className="font-semibold">{item.entrada.ano}: </span>
      ) : null}
      {item.entrada.titulo}
    </>
  );
}

/** Resumo em até 2 parágrafos; um <p> por parágrafo (o gerador separa
 * com uma linha em branco). */
function ResumoMistica({ resumo }: { resumo: string }) {
  return (
    <>
      {resumo.split(/\n{2,}/).map((paragrafo, i) => (
        <p key={i} className="mt-1 text-[.95em] text-text-soft">
          {paragrafo}
        </p>
      ))}
    </>
  );
}

/** Citação curta da fonte, com link quando houver URL. */
function FonteMistica({ item }: { item: ItemMistica }) {
  return (
    <p className="mt-2 text-[.85em] text-muted">
      {item.entrada.url ? (
        <a
          href={item.entrada.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          {item.fonte}
        </a>
      ) : (
        item.fonte
      )}
    </p>
  );
}

function OndeMistica({ item }: { item: ItemMistica }) {
  const { entrada, local } = item;
  if (!local) return null;
  return (
    <p className="mt-1 text-[.85em] text-muted">
      <span className="font-semibold">Onde: </span>
      {local.nome}
      {local.uf ? `/${local.uf}` : ""} ·{" "}
      <BotaoVoarAte
        lat={local.lat}
        lon={local.lon}
        nome={`${entrada.titulo} — ${local.nome}${local.uf ? `/${local.uf}` : ""}`}
        ctx={local.ctx}
      />
    </p>
  );
}

export default function MisticaDoDia() {
  const [mistica, setMistica] = useState<MisticaCarregada | null>(null);

  useEffect(() => {
    let vivo = true;
    // Os dois módulos entram juntos no chunk da Mística: o gazetteer de lugares
    // é leve (coordenadas embutidas) e não pesa na home.
    Promise.all([import("@/lib/memoria/mistica"), import("@/lib/memoria/locais")])
      .then(([{ entradasDoDia, fonteCurta, mostrarAnoSelo }, { localDaEntrada }]) => {
        if (!vivo) return;
        const entradas = entradasDoDia(new Date());
        if (entradas.length === 0) return;
        const monta = (entrada: EntradaCalendario): ItemMistica => ({
          entrada,
          fonte: fonteCurta(entrada),
          seloAno: mostrarAnoSelo(entrada),
          local: localDaEntrada(entrada),
        });
        setMistica({ principal: monta(entradas[0]), outros: entradas.slice(1).map(monta) });
      })
      .catch(() => {
        // Bloco de memória é enfeite cívico: falha aqui não pode derrubar
        // a home. Silêncio é a degradação correta (e é o que a lacuna já
        // faz quando não há entrada do dia).
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (!mistica) return null;

  const { principal, outros } = mistica;

  return (
    <aside
      aria-label="Mística do Dia"
      className="mistica-asile mb-8 rounded-2xl border border-border bg-surface px-4 py-3 sm:px-6 sm:py-4 flex items-start gap-3 sm:gap-4"
    >
      {/* Fogueira decorativa à esquerda, alinhada à linha do título. */}
      <CampfireColonyAnim />

      {/* Conteúdo da mística à direita, começando na mesma altura da peça. */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
          Mística do Dia
        </p>
        <p className="mt-1 text-[1.02em] text-foreground">
          <TituloMistica item={principal} />
        </p>
        {principal.entrada.resumo ? (
          <ResumoMistica resumo={principal.entrada.resumo} />
        ) : null}
        <OndeMistica item={principal} />
        <FonteMistica item={principal} />

        {outros.length > 0 ? (
          <details className="mt-3 border-t border-border pt-2">
            <summary className="cursor-pointer text-[.85em] font-semibold text-muted hover:text-primary">
              Também neste dia ({outros.length})
            </summary>
            <ul className="mt-2 space-y-2">
              {outros.map((item) => (
                <li key={`${item.entrada.diaMes}-${item.entrada.titulo}`}>
                  <details>
                    <summary className="cursor-pointer text-[.95em] text-foreground hover:text-primary">
                      <TituloMistica item={item} />
                    </summary>
                    {item.entrada.resumo ? (
                      <ResumoMistica resumo={item.entrada.resumo} />
                    ) : null}
                    <OndeMistica item={item} />
                    <FonteMistica item={item} />
                  </details>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </aside>
  );
}
