/**
 * SecaoOQueFalta — seção "O que ainda falta" da página /sobre, com as
 * epígrafes de fecho.
 *
 * Extraída do `SobrePage` em 08/10/2026 (hotspots CodeScene, saúde 7,26).
 */
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";

export function SecaoOQueFalta() {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">O que ainda falta</h2>
      <p className="text-text-soft">
        Parte do produto, não um apêndice. A cobertura entre as seis cidades é desigual —
        algumas lacunas são de acesso (fonte que exige protocolo ou tem certificado
        incompleto), outras são limite estrutural da própria fonte (um sistema municipal que
        devolve total por órgão, não nome por nome). Votações nominais do Congresso e de
        câmaras municipais estão em zero linhas hoje: a frente anuncia a função, e o código
        da rota registra que a tabela ainda está vazia. A projeção de vacância do Judiciário
        é parcial, porque depende de data de nascimento levantada nome a nome. A cobertura da
        análise garantista é de poucos por cento do acervo total — ampliá-la é trabalho de
        execução, o método já está validado.
      </p>
      <p className="text-[.85em] text-text-soft">
        Declarar a lacuna é conteúdo; disfarçá-la é defeito. É a mesma régua que rege todo o
        resto desta página.
      </p>
      {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (/sobre · travessia) */}
      <Epigrafe citacao={citacaoPorId("rosa-travessia")!} variante="inicio" />
      {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (/sobre · fecho) */}
      <Epigrafe citacao={citacaoPorId("evaristo-abrir-caminhos")!} variante="inicio" />
    </section>
  );
}
