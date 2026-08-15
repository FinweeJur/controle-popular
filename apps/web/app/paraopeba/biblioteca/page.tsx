import type { Metadata } from "next";

import FooterGlobal from "@/app/components/FooterGlobal";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  ATI_BIBLIOTECA_LABEL,
  BIBLIOTECA_ATI,
  COBERTURA_BIBLIOTECA,
  FONTES_BIBLIOTECA,
  temasDaBiblioteca,
  tiposDaBiblioteca,
  type AtiBiblioteca,
} from "@/lib/paraopeba/biblioteca";
import BibliotecaClient from "./BibliotecaClient";

/**
 * `/paraopeba/biblioteca` — o que as Assessorias Técnicas Independentes
 * publicaram para as pessoas atingidas.
 *
 * ═══ NÃO É `/paraopeba/documentos` ═══
 *
 * Aquela rota é o acervo do processo judicial (petição, laudo, decisão), vindo
 * da Plataforma Brumadinho UFMG. Esta é material de comunicação e formação
 * produzido pelas próprias assessorias. Misturar as duas apagaria a diferença
 * que mais importa aqui: quem escreveu, e para quem.
 *
 * ═══ A PÁGINA LÊ O DISCO, O COMPONENTE NÃO ═══
 *
 * `biblioteca.ts` usa `node:fs`. Este componente é servidor, então pode
 * chamá-lo; `BibliotecaClient` recebe tudo por prop e importa só o tipo.
 *
 * Nenhum número abaixo é digitado — todos vêm de `COBERTURA_BIBLIOTECA`, que
 * conta o array já triado.
 */
export const metadata: Metadata = {
  title: "Biblioteca das assessorias — Paraopeba | Controle Popular",
  description:
    "Cartilhas, boletins, jornais, produtos do plano de trabalho, documentos técnicos e vídeos publicados pelas assessorias técnicas independentes da bacia do Paraopeba — com link para a fonte original de cada item.",
};

const ATIS_COM_ACERVO = [...new Set(BIBLIOTECA_ATI.map((i) => i.ati))].sort() as AtiBiblioteca[];

export default function BibliotecaPage() {
  const tipos = tiposDaBiblioteca();
  const temas = temasDaBiblioteca();
  const semColeta = COBERTURA_BIBLIOTECA.geradoEm === "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Biblioteca das assessorias</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        O que as assessorias publicaram
      </h1>

      {semColeta ? (
        <p className="mt-4 rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
          A coleta desta biblioteca ainda não rodou nesta instalação. Rode{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5">
            python scripts/coletar-biblioteca-ati.py
          </code>{" "}
          e reconstrua o site. A lista abaixo está vazia porque o arquivo não existe — não porque as
          assessorias não publicaram nada.
        </p>
      ) : (
        <>
          <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
            <strong className="text-text">
              {formatNumberBR(COBERTURA_BIBLIOTECA.publicados)} publicações
            </strong>{" "}
            das assessorias técnicas independentes da bacia, de{" "}
            {formatDateBR(COBERTURA_BIBLIOTECA.periodo.de)} a{" "}
            {formatDateBR(COBERTURA_BIBLIOTECA.periodo.ate)} — cartilhas, boletins, jornais,
            programas de rádio, vídeos, documentos técnicos e os produtos que cada ATI entrega no
            plano de trabalho.
          </p>

          {/* Aviso de método, não rodapé jurídico: quem chega aqui procurando um
              PDF precisa saber, ANTES de clicar, que o arquivo abre no site da
              assessoria. Esconder isso no fim da página faria a tela parecer um
              repositório que ela não é. */}
          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
            <p>
              <strong className="text-text">Este portal não hospeda os arquivos.</strong> De cada
              item guardamos título, data, tipo, tema, qual assessoria produziu e o link — o
              material abre no site da própria ATI, que é quem responde por ele e pode corrigi-lo.
              Nenhuma das fontes declara licença de uso, e sem declaração expressa a obra é de
              direitos reservados (Lei 9.610/98, art. 7º): link e título são citação, cópia não
              seria.
            </p>
            <p className="mt-3">
              Não há resumo em nenhum item porque{" "}
              <strong className="text-text">nenhuma das fontes publica um</strong>. Escrever um aqui
              seria este portal resumindo obra de terceiro e assinando embaixo.
            </p>
            <p className="mt-3">
              A régua de dado pessoal de{" "}
              <code className="rounded bg-surface px-1.5 py-0.5">lib/paraopeba/triagem.ts</code>{" "}
              rodou sobre os {formatNumberBR(COBERTURA_BIBLIOTECA.publicados + COBERTURA_BIBLIOTECA.barradosPelaTriagem)}{" "}
              itens coletados e barrou{" "}
              <strong className="text-text">
                {formatNumberBR(COBERTURA_BIBLIOTECA.barradosPelaTriagem)}
              </strong>
              . Item barrado não é publicado nem em título.
            </p>
          </div>

          <BibliotecaClient
            itens={BIBLIOTECA_ATI}
            tipos={tipos}
            temas={temas}
            atis={ATIS_COM_ACERVO}
            atiLabel={ATI_BIBLIOTECA_LABEL}
          />

          <section className="mt-14 border-t border-border pt-8" aria-labelledby="titulo-fontes">
            <h2
              id="titulo-fontes"
              className="font-display text-[clamp(1.15em,2.4vw,1.45em)] font-bold tracking-tight"
            >
              De onde veio, e o que ficou de fora
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {FONTES_BIBLIOTECA.map((f) => (
                <li key={f.id} className="rounded-2xl border border-border bg-surface p-5 text-sm">
                  <p className="font-display font-semibold text-text">
                    {f.nome}{" "}
                    <span className="font-normal text-text-soft">
                      — {formatNumberBR(f.itens)} itens
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-text-soft">{f.regioes}</p>
                  <p className="mt-2 text-text-soft">
                    <strong className="text-text">Licença:</strong> {f.licenca}
                  </p>
                  <p className="mt-1 text-text-soft">
                    <strong className="text-text">Coleta:</strong> {f.metodo}
                  </p>
                  <a
                    href={f.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
                  >
                    {f.site} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
              <strong className="text-text">Fora do acervo:</strong>{" "}
              {COBERTURA_BIBLIOTECA.ficouDeFora}
            </p>
            <p className="mt-3 text-xs text-text-soft">
              Coleta de {formatDateBR(COBERTURA_BIBLIOTECA.geradoEm.slice(0, 10))}. O acervo não se
              atualiza sozinho: ele muda quando o coletor roda e o site é reconstruído.
            </p>
          </section>
        </>
      )}

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </div>
  );
}
