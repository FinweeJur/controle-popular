import type { Metadata } from "next";

import FooterGlobal from "@/app/components/FooterGlobal";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  ATI_BIBLIOTECA_LABEL,
  bibliotecaAti,
  coberturaBiblioteca,
  fontesBiblioteca,
  macrosDaBiblioteca,
  tagsDaBiblioteca,
  temasDaBiblioteca,
  tiposDaBiblioteca,
  type AtiBiblioteca,
} from "@/lib/paraopeba/biblioteca";
import {
  bibliotecaProBrumadinho,
  coberturaProBrumadinho,
  fontesProBrumadinho,
} from "@/lib/paraopeba/biblioteca-probrumadinho";
import BibliotecaClient from "./BibliotecaClient";
import { metadataEditavel } from "@/lib/edicoes";

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
export const metadata: Metadata = metadataEditavel("/paraopeba/biblioteca", {
  title: "Biblioteca do Paraopeba — Controle Popular",
  description:
    "Publicações das assessorias técnicas independentes da bacia do Paraopeba e documentos oficiais do Acordo Judicial de Reparação (portal Pró-Brumadinho, Governo de MG) — com link para a fonte original de cada item.",
});

export default async function BibliotecaPage() {
  const [itens, cobertura, fontes, itensPB, coberturaPB, fontesPB] = await Promise.all([
    bibliotecaAti(),
    coberturaBiblioteca(),
    fontesBiblioteca(),
    bibliotecaProBrumadinho(),
    coberturaProBrumadinho(),
    fontesProBrumadinho(),
  ]);
  const tipos = tiposDaBiblioteca(itens);
  const temas = temasDaBiblioteca(itens);
  const macros = macrosDaBiblioteca(itens);
  const tags = tagsDaBiblioteca(itens);
  const semColeta = cobertura.geradoEm === "";

  const atis = [...new Set(itens.map((i) => i.ati))].sort() as AtiBiblioteca[];

  const tiposPB = tiposDaBiblioteca(itensPB);
  const temasPB = temasDaBiblioteca(itensPB);
  const macrosPB = macrosDaBiblioteca(itensPB);
  const tagsPB = tagsDaBiblioteca(itensPB);
  const atisPB = [...new Set(itensPB.map((i) => i.ati))].sort() as AtiBiblioteca[];
  const temPB = itensPB.length > 0;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
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
              {formatNumberBR(cobertura.publicados)} publicações
            </strong>{" "}
            das assessorias técnicas independentes da bacia, de{" "}
            {formatDateBR(cobertura.periodo.de)} a{" "}
            {formatDateBR(cobertura.periodo.ate)} — cartilhas, boletins, jornais,
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
              rodou sobre os {formatNumberBR(cobertura.publicados + cobertura.barradosPelaTriagem)}{" "}
              itens coletados e barrou{" "}
              <strong className="text-text">
                {formatNumberBR(cobertura.barradosPelaTriagem)}
              </strong>
              . Item barrado não é publicado nem em título.
            </p>
          </div>

          <BibliotecaClient
            itens={itens}
            tipos={tipos}
            temas={temas}
            macros={macros}
            tags={tags}
            atis={atis}
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
              {fontes.map((f) => (
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
              {cobertura.ficouDeFora}
            </p>
            <p className="mt-3 text-xs text-text-soft">
              Coleta de {formatDateBR(cobertura.geradoEm.slice(0, 10))}. O acervo não se
              atualiza sozinho: ele muda quando o coletor roda e o site é reconstruído.
            </p>
          </section>
        </>
      )}

      {/* ═══ ACERVO PRÓ-BRUMADINHO (GOVERNO DE MG) ═══ */}
      {temPB && (
        <section className="mt-14 border-t border-border pt-8" aria-labelledby="titulo-acordo">
          <h2
            id="titulo-acordo"
            className="font-display text-[clamp(1.4em,3.2vw,1.9em)] leading-tight font-bold tracking-tight"
          >
            Documentos oficiais do Acordo
          </h2>
          <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
            <strong className="text-text">
              {formatNumberBR(coberturaPB.publicados)} documentos
            </strong>{" "}
            do portal{" "}
            <a
              href="https://www.mg.gov.br/pro-brumadinho"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              Pró-Brumadinho (Governo de MG) ↗
            </a>
            {coberturaPB.periodo.de && coberturaPB.periodo.ate
              ? `, de ${coberturaPB.periodo.de.slice(0, 4)} a ${coberturaPB.periodo.ate.slice(0, 4)}`
              : ""}
            {" — "}legislação, deliberações do Comitê Gestor, termos, prestações de contas,
            relatórios ambientais e artigos acadêmicos.
          </p>

          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
            <p>
              <strong className="text-text">Autoria diferente.</strong> O acervo acima é das
              assessorias técnicas independentes; este é do{" "}
              <strong className="text-text">Governo de MG e dos órgãos compromitentes</strong> do
              Acordo Judicial. Autoria, finalidade e destinatário são diferentes — por isso aparecem
              em seções separadas.
            </p>
            <p className="mt-3">
              <strong className="text-text">Resumos gerados por IA.</strong> Quando um item traz
              resumo, ele foi gerado por modelo de inteligência artificial a partir do texto
              extraído do PDF oficial, com mascaramento prévio de dado pessoal. O texto oficial é
              o documento no link.{" "}
              {coberturaPB.comResumo < coberturaPB.publicados && (
                <>
                  {formatNumberBR(coberturaPB.publicados - coberturaPB.comResumo)} itens não têm
                  resumo — o texto do PDF não pôde ser extraído (documento escaneado ou planilha).
                </>
              )}
            </p>
          </div>

          <BibliotecaClient
            itens={itensPB}
            tipos={tiposPB}
            temas={temasPB}
            macros={macrosPB}
            tags={tagsPB}
            atis={atisPB}
            atiLabel={ATI_BIBLIOTECA_LABEL}
          />

          <section className="mt-10 border-t border-border pt-6" aria-labelledby="titulo-fontes-pb">
            <h3
              id="titulo-fontes-pb"
              className="font-display text-[clamp(1em,2vw,1.25em)] font-bold tracking-tight"
            >
              Fonte e método
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {fontesPB.map((f) => (
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
              {coberturaPB.ficouDeFora}
            </p>
            <p className="mt-3 text-xs text-text-soft">
              Coleta de {formatDateBR(coberturaPB.geradoEm.slice(0, 10))}. O acervo não se
              atualiza sozinho: ele muda quando o coletor roda e o site é reconstruído.
            </p>
          </section>
        </section>
      )}

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
