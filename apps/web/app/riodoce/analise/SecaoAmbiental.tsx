import { MarkdownResumo } from "@/app/components/ResumoRealidade";
import { TEXTO_LITORAL } from "./dados";
import {
  Aviso,
  Botao,
  CabecalhoSecao,
  Marca,
  TabelaRolavel,
} from "./Componentes";

const EVIDENCIAS = [
  {
    dimensao: "Chegada da pluma",
    achado:
      "Rejeitos percorreram mais de 650 km até o Atlântico; material do Rio Doce foi identificado em Abrolhos e incorporado a corais.",
    limite:
      "Forte para a chegada ao mar e a Abrolhos; não autoriza atribuir todo dano recifal ao rompimento.",
    marca: "medido",
  },
  {
    dimensao: "Exposição humana",
    achado:
      "Biomonitoramento de 300 moradores de Regência, Povoação e Campo Grande indicou exposição elevada a alumínio, arsênio, mercúrio e níquel.",
    limite:
      "Exposição medida; o estudo não fechou diagnóstico de doença nos participantes.",
    marca: "medido",
  },
  {
    dimensao: "Pesca",
    achado:
      "Perda de renda, rotina e identidade; compensações percebidas como inferiores à renda anterior e recuperação incompleta seis anos depois.",
    limite:
      "Evidência direta no litoral capixaba, com fonte por estudo citado na análise.",
    marca: "medido",
  },
  {
    dimensao: "Estuário e sedimento",
    achado:
      "Metais registrados até cinco vezes acima dos valores de referência, com perda de organismos associados ao sedimento.",
    limite:
      "Estudos posteriores apontam risco ecológico e contaminação crônica.",
    marca: "medido",
  },
  {
    dimensao: "Perdas culturais",
    achado:
      "No Quilombo de Degredo e entre povos indígenas, as perdas descritas não são redutíveis a valor monetário.",
    limite:
      "Reconhecimento descritivo; não há métrica monetária que captures essas perdas.",
    marca: "medido",
  },
] as const;

/**
 * "Meio ambiente, saúde e pesca": o texto do litoral vem inteiro do
 * markdown da análise. A tabela ao lado é uma síntese de leitura — cada
 * linha aponta o que o estudo mede e o que ele NÃO permite concluir.
 */
export function SecaoAmbiental() {
  return (
    <section
      id="meio-ambiente"
      aria-labelledby="titulo-meio-ambiente"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-meio-ambiente"
        numero="05"
        titulo="Meio ambiente, saúde e pesca"
        descricao="O que a literatura documenta sobre a chegada da pluma ao litoral, a exposição das pessoas e a perda de renda na pesca. Cada afirmação mantém a citação do estudo que a sustenta."
      />

      <div className="mt-5 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <MarkdownResumo markdown={TEXTO_LITORAL} />
      </div>

      <h3 className="mt-8 font-display text-lg font-semibold">
        Evidência por dimensão
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-text-soft">
        A tabela separa quatro perguntas que costumam ser misturadas: a pluma
        chegou, as pessoas foram expostas, a pesca perdeu renda, a cultura foi
        atingida. Cada linha traz o limite do que o dado permite afirmar.
      </p>
      <TabelaRolavel legenda="Síntese da evidência sobre a pluma, a exposição humana, a pesca e as perdas culturais no Rio Doce">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-text-soft">
            <th scope="col" className="px-3 py-2 font-semibold">Dimensão</th>
            <th scope="col" className="px-3 py-2 font-semibold">O que foi observado</th>
            <th scope="col" className="px-3 py-2 font-semibold">O que o dado permite afirmar</th>
          </tr>
        </thead>
        <tbody>
          {EVIDENCIAS.map((linha) => (
            <tr key={linha.dimensao} className="border-b border-border/60 align-top">
              <th scope="row" className="min-w-[8rem] px-3 py-3 text-left text-xs font-semibold">
                {linha.dimensao}
              </th>
              <td className="min-w-[14rem] px-3 py-3 text-xs leading-relaxed">
                {linha.achado}
              </td>
              <td className="min-w-[14rem] px-3 py-3 text-xs leading-relaxed text-text-soft">
                {linha.limite}
                <Marca tipo={linha.marca} />
              </td>
            </tr>
          ))}
        </tbody>
      </TabelaRolavel>

      <div className="mt-4">
        <Aviso tom="atencao">
          <p className="font-semibold">O que a evidência não permite concluir</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-soft">
            <li>
              Atribuir <em>todo</em> dano recifal de Abrolhos ao rompimento de
              Fundão. <Marca tipo="nao" />
            </li>
            <li>
              Transformar exposição a metais em diagnóstico de doença nos 300
              moradores monitorados. <Marca tipo="nao" />
            </li>
            <li>
              Somar as compensações das diferentes vias como se fossem uma
              série única de indenizações. <Marca tipo="nao" />
            </li>
          </ul>
        </Aviso>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Botao href="/ambiental/rio-doce/analise">
          Análise completa do litoral
        </Botao>
        <Botao href="/ambiental/crimes-socioambientais" variante="contorno">
          Biblioteca dos desastres
        </Botao>
      </div>
    </section>
  );
}
