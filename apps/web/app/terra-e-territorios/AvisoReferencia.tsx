/**
 * @file Aviso de procedência dos números de referência das telas de Terra e
 * Territórios.
 *
 * POR QUE EXISTE: os cartões de indicadores de `/terra-e-territorios`,
 * `/nossos-rios` e `/nossas-serras` são valores fixos no código, tirados das
 * fontes oficiais (CNUC/MMA, SIGMINE/ANM, ANA/IGAM, IBGE). Eles não são
 * recalculados neste build, não são do município do leitor e não são do dia.
 * Publicar um número plausível sem dizer isso é o jeito mais fácil de um dado
 * de referência virar afirmação falsa sobre o território.
 *
 * O aviso fica ANTES do primeiro cartão, não no rodapé: quem chega pelo
 * celular e rola rápido precisa ler a ressalva antes do número.
 *
 * FONTE: as URLs apontam para a área de estatística de cada órgão, onde
 * qualquer pessoa confere o valor. Não são links genéricos de ministério.
 */
export default function AvisoReferenciaTerritorio({ ressalva }: { ressalva?: string }) {
  return (
    <aside
      aria-label="Procedência dos números de referência"
      className="mb-8 rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm sm:p-5"
    >
      <p className="font-semibold text-foreground">
        Os cartões de indicadores são referência das fontes — não medição deste portal.
      </p>
      <p className="mt-1.5 text-text-soft">
        Os valores vêm de CNUC/MMA (unidades de conservação), SIGMINE/ANM (processos
        minerários), ANA/IGAM (bacias e qualidade da água) e IBGE (população e malha
        municipal). O portal não os recalcula neste build nem os atualiza sozinho.
        {ressalva ? ` ${ressalva}` : ""}
      </p>
      <p className="mt-2 text-xs">
        <a
          href="https://cnuc.mma.gov.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          CNUC
        </a>{" "}
        ·{" "}
        <a
          href="https://sigmine.anm.gov.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          SIGMINE/ANM
        </a>{" "}
        ·{" "}
        <a
          href="https://www.ana.gov.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          ANA
        </a>{" "}
        ·{" "}
        <a
          href="https://www.ibge.gov.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          IBGE
        </a>{" "}
        <span className="text-text-soft">
          — o que o portal mede, cidade a cidade, está nas fichas e nos painéis municipais.
        </span>
      </p>
    </aside>
  );
}
