import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";
import { carregarPppsMg } from "@/lib/ambiental/ppp";
import { formatNumberBR } from "@/lib/betim/format";
import PppClient from "./PppClient";

/**
 * `/ambiental/ppp` — concessões e parcerias público-privadas do Estado de MG.
 *
 * A página de servidor importa a base inteira porque ela é pequena (20
 * contratos, ~24 KiB) e a passa ao `<PppClient />`, componente de cliente que
 * faz busca, filtros, ordenação e CSV. O teto que obriga a paginar no servidor
 * é ~2 mil linhas (AGENTS §5.1); aqui estamos três ordens de grandeza abaixo.
 *
 * ═══ A REGRA EDITORIAL DESTA PÁGINA ═══
 *
 * A base mistura três coisas sob o mesmo rótulo "concessão/PPP": o instrumento
 * da concessão em si (6), os contratos de supervisão (9) e os de estudo e
 * estruturação (5). Só o primeiro é a PPP. Publicar o total sem essa separação
 * faria o leitor concluir que Minas tem 20 concessões — falso. A ressalva vem
 * dos próprios metadados da coleta e é mostrada no topo, antes de qualquer
 * número, junto dos cartões por natureza.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/ppp", {
  title: "Concessões e PPPs de Minas Gerais — Controle Popular · Ambiental",
  description:
    `Os ${formatNumberBR(carregarPppsMg().contratos.length)} contratos do Estado de Minas Gerais cujo objeto cita concessão ou parceria público-privada, com valor, vigência e concessionária — separando o instrumento da concessão dos contratos de supervisão e de estudo.`,
});

export default function PppPage() {
  const { metadados, contratos } = carregarPppsMg();
  const concessoes = metadados.porNatureza.instrumento_concessao ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Concessões e PPPs
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] font-bold leading-tight tracking-tight">
          As concessões e parcerias público-privadas de Minas
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Quando o Estado entrega um serviço a uma empresa privada por décadas, o
          contrato fica registrado no Portal da Transparência. Esta página reúne os{" "}
          <strong className="text-text">{formatNumberBR(contratos.length)} contratos</strong>{" "}
          mineiros cujo objeto cita concessão ou parceria público-privada. Mas atenção: só{" "}
          <strong className="text-text">{formatNumberBR(concessoes)}</strong> são a concessão em
          si — os outros são apoio, supervisão ou estudo.
        </p>
      </header>

      <div className="mt-8">
        <PppClient metadados={metadados} contratos={contratos} />
      </div>
    </div>
  );
}
