import Link from "next/link";
import {
  ADESAO,
  OBRIGACOES,
  PAISES_CIDH,
  adesaoDoPais,
  ratificacoesPorTratado,
  type Adesao,
} from "@/lib/direitos-globais/cidh";
import { ListaDispositivos } from "../Dispositivos";

/**
 * Blocos da página do sistema interamericano.
 *
 * Regra de apresentação: status nunca depende só de cor. O texto
 * ("ratificou 1996", "só assinou", "não aderiu") carrega a informação; a cor
 * é reforço. Quem imprime em preto e branco continua entendendo.
 */

export function Obrigacoes() {
  return (
    <section className="mb-10">
      <h2 className="mb-2 text-xl font-bold text-text">
        O que a condenação obriga
      </h2>
      <p className="mb-6 text-sm text-text-soft">
        A Corte não cria direito novo: ela aplica o Pacto de San José. A
        obrigação de reparar está no art. 63.1; a de cumprir a sentença, no
        art. 68.1. Texto oficial, em espanhol, transcrito abaixo.
      </p>
      <ListaDispositivos pais="Pacto de San José" dispositivos={OBRIGACOES} />
    </section>
  );
}

export function ResumoTratados() {
  const linhas = ratificacoesPorTratado();
  return (
    <section className="mb-10">
      <h2 className="mb-2 text-xl font-bold text-text">
        Tratados interamericanos
      </h2>
      <p className="mb-6 text-sm text-text-soft">
        Ratificação é o que vincula o Estado. Assinatura sem ratificação não
        obriga. Fonte: Departamento de Direito Internacional da OEA.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {linhas.map(({ tratado, total }) => (
          <li
            key={tratado.id}
            className="rounded-lg border border-border bg-surface-2 p-4"
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h3 className="font-medium text-text">{tratado.nome}</h3>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {total}/20
              </span>
            </div>
            <p className="mb-2 text-xs text-text-soft">{tratado.resumo}</p>
            <a
              href={tratado.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Fonte oficial ({tratado.id})
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Selo({ adesao }: { adesao: Adesao }) {
  if (adesao.status === "ratificado") {
    return (
      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        ratificou {adesao.ano}
      </span>
    );
  }
  if (adesao.status === "assinado") {
    return (
      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-text-soft">
        só assinou
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-text-soft">
      não aderiu
    </span>
  );
}

function CartaoPais({ pais }: { pais: string }) {
  const linhas = adesaoDoPais(pais);
  const ratificados = linhas.filter((l) => l.adesao.status === "ratificado");
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-text">{pais}</h3>
        <span className="text-xs text-text-soft">
          {ratificados.length} de {linhas.length}
        </span>
      </header>
      <ul className="space-y-2">
        {linhas.map(({ tratado, adesao }) => (
          <li
            key={`${pais}-${tratado.id}`}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="text-text-soft">
              <span className="font-mono text-xs text-text-soft">
                {tratado.id}
              </span>{" "}
              {tratado.apelido}
            </span>
            <Selo adesao={adesao} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function AdesaoPorPais() {
  return (
    <section className="mb-10">
      <h2 className="mb-2 text-xl font-bold text-text">Adesão por país</h2>
      <p className="mb-6 text-sm text-text-soft">
        Vinte países da América Latina, oito tratados. O selo diz o ano do
        depósito do instrumento de ratificação.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PAISES_CIDH.map((pais) => (
          <CartaoPais key={pais} pais={pais} />
        ))}
      </div>
    </section>
  );
}

export function NotaCondenacoes() {
  const semCorte = Object.values(ADESAO["B-32"]).filter(
    (a) => a.status !== "ratificado",
  );
  return (
    <section className="mb-10">
      <h2 className="mb-2 text-xl font-bold text-text">
        Condenações e denúncias
      </h2>
      <p className="mb-4 text-sm text-text-soft">
        Quem recomenda é a Comissão (CIDH); quem condena é a Corte IDH. Só
        Estado que ratificou o Pacto de San José pode ser réu na Corte. Nesta
        lista, {semCorte.length} país não ratificou.
      </p>
      <div className="rounded-xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
        <p className="mb-3">
          <strong className="text-text">Ainda sem lista de casos.</strong> O
          site oficial da Corte responde HTTP 403 ao nosso agente, mesmo com
          User-Agent honesto. Não contornamos bloqueio de acesso.
        </p>
        <p className="mb-3">
          Até a conferência manual, o caminho é a fonte primária: a busca de
          casos da Corte e o relatório anual da Comissão.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://www.corteidh.or.cr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Corte IDH — busca de casos
          </a>
          <a
            href="https://www.oas.org/es/cidh/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            CIDH — Comissão Interamericana
          </a>
        </div>
      </div>
    </section>
  );
}

export function VoltarParaAmericaLatina() {
  return (
    <Link
      href="/direitos-globais/america-latina"
      className="text-sm text-primary underline-offset-2 hover:underline"
    >
      Voltar para América Latina
    </Link>
  );
}
