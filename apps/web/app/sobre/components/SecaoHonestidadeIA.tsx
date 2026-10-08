/**
 * SecaoHonestidadeIA — seção "Site em desenvolvimento e uso de Inteligência
 * Artificial" da página /sobre. A seção mais importante da página.
 *
 * Extraída do `SobrePage` em 08/10/2026 (hotspots CodeScene, saúde 7,26).
 * Conteúdo textual intacto.
 */
import NextLink from "next/link";

export function SecaoHonestidadeIA() {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold">
        Site em desenvolvimento e uso de Inteligência Artificial
      </h2>
      <p className="text-text-soft">
        Site em desenvolvimento, aberto para acesso, colaboração e revisão. Os
        dados ainda estão sendo conferidos e podem conter erros.
      </p>
      <p className="text-text-soft">
        O site foi feito com auxílio de Inteligência Artificial - IA, como
        modelos de linguagem como <strong className="text-text">Deepseek</strong>,{" "}
        <strong className="text-text">Mimo</strong>,{" "}
        <strong className="text-text">Claude</strong> e ferramentas como{" "}
        <strong className="text-text">OpenCode</strong>, entre outras.
      </p>
      <p className="text-text-soft">
        Isso não significa que os números são palpite. O projeto segue uma doutrina que
        separa duas coisas que costumam ser confundidas:{" "}
        <strong className="text-text">o modelo extrai, o programa calcula</strong>. Na
        análise garantista do Congresso, por exemplo, o modelo de linguagem nunca recebe a
        pergunta &ldquo;este projeto é garantista ou reducionista?&rdquo;. Ele recebe uma
        tarefa de extração: apontar quais direitos a proposta afeta, em que direção, por
        qual mecanismo — e, obrigatoriamente, citar o dispositivo legal e o trecho literal
        que sustentam cada apontamento. O rótulo final (garantista, reducionista, misto...)
        não sai do modelo: é aritmética sobre esse formulário, feita por código
        determinístico e reexecutável. A mesma separação organiza a análise de vício
        legislativo e a atribuição de tema da legislação em{" "}
        <NextLink href="/ambiental/legislacao" className="text-primary hover:text-accent">
          /ambiental/legislacao
        </NextLink>{" "}
        (até 13/08/2026, <code className="text-[.85em]">/ambiental/direito-critico</code> — unificada
        com a legislação estadual num painel só, a URL antiga redireciona pra cá).
      </p>
      <p className="text-text-soft">
        A analogia é a do escrivão e do juiz: o modelo é escrivão, preenche um formulário de
        campos fechados e anota de onde tirou cada informação; o rótulo é aritmética sobre
        esse formulário. Isso não torna a IA inofensiva —{" "}
        <strong className="text-text">
          se a extração erra, o rótulo calculado a partir dela também erra
        </strong>
        , porque o código confia no que o formulário diz. É por isso que item com confiança
        baixa não vira manchete: fica marcado na tela como{" "}
        <strong className="text-text">&ldquo;requer revisão humana&rdquo;</strong> e sai dos
        rankings de alerta e de bom exemplo, mesmo continuando publicado ao lado do rótulo.
      </p>
      <p className="text-text-soft">
        A atribuição de tema da legislação é o exemplo do padrão que este projeto adota
        consigo mesmo: até 13/08/2026, a página de{" "}
        <NextLink href="/ambiental/legislacao" className="text-primary hover:text-accent">
          legislação e precedentes por tema de direito
        </NextLink>{" "}
        chamava a atribuição de tema de &ldquo;leitura humana&rdquo;; hoje a página diz o
        que é — leitura assistida por IA, registrada linha a linha com o trecho que
        sustenta cada tema — e declara que está em revisão. Quem cobra procedência dos
        outros deve o mesmo padrão sobre si: dizer de onde cada coisa vem, na própria
        tela em que aparece.
      </p>
      <p className="text-[.9em] text-text-soft">
        Nenhum número do portal é <em>escrito</em> por modelo de linguagem: o assistente de
        conversa de cada zona responde só com o contexto que vem do banco, e o registro de
        camadas do mapa 3D bloqueia e conta qualquer feição marcada como demonstração antes
        de exportar. O que a IA faz é ler texto não estruturado — ementa de lei, inteiro
        teor de projeto — e transformar em campos que o código então soma, filtra e rotula
        por regra fixa, nunca por opinião do modelo.
      </p>
    </section>
  );
}
