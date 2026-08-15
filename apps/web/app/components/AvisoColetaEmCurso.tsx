/**
 * Aviso de que o dado exibido é o COLETADO ATÉ AGORA — não o universo do tema.
 *
 * ## Por que existe, e por que não é hedge
 *
 * Este portal publica número. Número numa página bem diagramada é lido como
 * censo, e quase nunca é: é o que uma coleta em curso alcançou até a data do
 * build. As duas leituras erradas que isso produz são opostas e igualmente
 * caras:
 *
 *   - "há N casos" → quando o certo é "achamos N; pode haver mais";
 *   - "há ZERO casos" → quando o certo é "não achamos nenhum NA BASE QUE
 *     TEMOS", e a base ainda cresce.
 *
 * A segunda é a pior, porque ausência não chama atenção. E ela não é
 * hipotética aqui: em 13/08/2026 a página de alertas afirmava **zero**
 * territórios quilombolas sob mancha de inundação de barragem. Naquela noite
 * entraram os 13 territórios do INCRA que faltavam, o mesmo cálculo rodou
 * sobre a base maior, e o zero virou **seis sobreposições em três
 * territórios** — AMAROS e MACHADINHO sob barragens da Kinross em Paracatu, e
 * SÃO SEBASTIÃO sob três da Salitre Fertilizantes. O dado não mudou; a nossa
 * cobertura é que mudou.
 *
 * É por isso que o texto abaixo cita esse episódio em vez de falar em
 * genérico. Ressalva sem exemplo vira carimbo e ninguém lê; ressalva com um
 * caso concreto ensina a ler o resto da página.
 *
 * ## Onde usar
 *
 * Em toda página cuja tese dependa de contagem ou de ausência. Não em página
 * de texto, roteiro ou explicação de método — lá o aviso seria enfeite.
 *
 * @param escopo  o que esta página cobre, em uma linha, para o aviso falar do
 *                caso concreto em vez de repetir o genérico.
 */
export default function AvisoColetaEmCurso({ escopo }: { escopo?: string }) {
  return (
    <aside
      className="mt-6 rounded-lg border border-l-4 px-4 py-3 text-sm"
      style={{ borderColor: "var(--cp-caution, #e2a138)" }}
      aria-label="Aviso sobre a cobertura dos dados"
    >
      <p>
        <strong className="text-text">
          O que está aqui é o que conseguimos coletar até agora.
        </strong>{" "}
        A revisão está em curso: pode haver dado que ainda não entrou, fonte que
        ainda não foi lida e registro que ainda não foi geocodificado.
        {escopo ? ` ${escopo}` : ""}
      </p>
      <p className="mt-2 text-text-soft">
        Vale principalmente para os <strong className="text-text">zeros</strong>.
        Nenhum número desta página significa &quot;não existe&quot; — significa
        &quot;não encontramos na base que temos hoje&quot;. Em 13 de agosto de
        2026 esta mesma verificação dizia que <em>nenhum</em> território
        quilombola estava sob mancha de inundação de barragem; naquela noite
        entraram 13 territórios do INCRA que faltavam, e o zero virou{" "}
        <strong className="text-text">seis</strong>. O que mudou não foi a
        realidade — foi a nossa cobertura.
      </p>
    </aside>
  );
}
