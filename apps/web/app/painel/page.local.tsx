import type { Metadata } from "next";

import { listarRotasEditaveis } from "@/lib/painel/rotas-editaveis";
import { lerEstadoDoRepo } from "@/lib/painel/git-estado";
import { lerEdicoes } from "@/lib/painel/edicoes-io";

import PainelClient from "./PainelClient";

/**
 * `/painel` — o painel gráfico de edição do site. **Só existe em `next dev`.**
 *
 * Como subir:
 *
 *     PAINEL_LOCAL=1 npx next dev --port 3028
 *
 * e ter `PAINEL_TOKEN` no `apps/web/.env.local`. Sem as duas coisas, esta rota
 * não existe (a extensão `.local.tsx` fica fora de `pageExtensions`) e a API
 * nega tudo (fail-closed). Ver o bloco `painelLocalLigado` em `next.config.ts`
 * para por que a garantia é estrutural e não disciplinar.
 *
 * ═══ O QUE ESTE PAINEL É, E O QUE NÃO É ═══
 *
 * É a Fase 1b de `docs/PLANO-PAINEL-EDICAO.md`: a Fase 1 já existia em linha de
 * comando (`scripts/editar-pagina.mts`), e o que faltava era tela para quem não
 * usa terminal. Os dois gravam o MESMO arquivo, no mesmo formato.
 *
 * **Não** apaga página e **não** renomeia URL — são as Fases 2 e 3, e cada uma
 * tem uma janela de inconsistência própria (entre gravar e o rebuild publicar)
 * que o plano descreve e que esta tela não sabe tratar ainda.
 */
export const metadata: Metadata = {
  title: "Painel de edição — local",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PainelPage() {
  /**
   * Estado lido no SERVIDOR, no primeiro render: a tela já abre sabendo se o
   * repositório está atrasado em relação à outra máquina. Deixar isso para uma
   * chamada do cliente faria a pessoa ver o formulário liberado por um
   * instante antes do aviso aparecer — e começar a digitar o que vai ser
   * recusado.
   */
  return (
    <PainelClient
      rotasEditaveis={listarRotasEditaveis()}
      edicoesIniciais={lerEdicoes()}
      repoInicial={lerEstadoDoRepo()}
    />
  );
}
