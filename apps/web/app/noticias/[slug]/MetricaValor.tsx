"use client";

import ContadorAnimado from "@/app/components/dados/ContadorAnimado";

/**
 * @file Valor de cartão de métrica do post, com contagem animada.
 *
 * O QUE É: lê o texto já publicado em `metricas[].valor` e anima o número
 * quando ele é um valor simples — inteiro, decimal, percentual ou moeda.
 *
 * POR QUE ASSIM:
 * - O dado do post é string ("73", "R$ 1.573,43", "19 a 26/11"). O contador
 *   padrão do portal (`ContadorAnimado`) recebe número, então a conversão
 *   fica aqui e não no JSON.
 * - Texto composto — faixa ("19 a 26/11"), aproximação ("~160 mil pessoas"),
 *   "6 de 7" — fica estático de propósito. Animar um pedaço da frase daria
 *   a ele um peso que o dado não tem.
 * - `ContadorAnimado` entrega o valor final no HTML e respeita
 *   `prefers-reduced-motion`: robô e leitor de tela nunca leem zero.
 */
type ValorAnalisado = {
  numero: number;
  casas?: number;
  prefixo?: string;
  formato?: "numero" | "percentual";
};

/** Converte o texto da métrica em número + formatação; null = não animar. */
function analisarTexto(valor: string): ValorAnalisado | null {
  const texto = valor.trim();

  const inteiro = /^(\d{1,3}(?:\.\d{3})+|\d+)$/.exec(texto);
  if (inteiro) return { numero: Number(inteiro[1].replace(/\./g, "")) };

  const decimal = /^\d{1,3}(?:\.\d{3})*,\d+$/.exec(texto);
  if (decimal) {
    const casas = decimal[0].split(",")[1].length;
    return {
      numero: Number(decimal[0].replace(/\./g, "").replace(",", ".")),
      casas,
    };
  }

  const percentual = /^(\d+(?:,\d+)?)\s*%$/.exec(texto);
  if (percentual) {
    return { numero: Number(percentual[1].replace(",", ".")), formato: "percentual" };
  }

  const moeda = /^R\$\s*([\d.]+)(?:,(\d+))?$/.exec(texto);
  if (moeda) {
    const casas = moeda[2]?.length ?? 0;
    const numero = Number(moeda[1].replace(/\./g, "") + (moeda[2] ? `.${moeda[2]}` : ""));
    return { numero, casas, prefixo: "R$ " };
  }

  return null;
}

export default function MetricaValor({ valor }: { valor: string }) {
  const analisado = analisarTexto(valor);
  if (!analisado) return <>{valor}</>;

  return (
    <ContadorAnimado
      valor={analisado.numero}
      casas={analisado.casas}
      prefixo={analisado.prefixo}
      formato={analisado.formato ?? "numero"}
    />
  );
}
