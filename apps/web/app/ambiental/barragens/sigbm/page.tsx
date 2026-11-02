import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/ambiental/barragens/sigbm`.
 *
 * A rota filha não tinha dado próprio: lia o MESMO `barragens-sigbm.json` e
 * renderizava a MESMA `TabelaSigbm` da página-mãe, acrescentando cinco cartões
 * e dois gráficos. Em 02/11/2026 essa parte migrou para
 * `/ambiental/barragens#sigbm-anm` e a URL antiga virou ponte.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts` — a mesma lista que monta
 * o `redirects()` do `next.config.ts` e que esta ponte usa no alvo estático.
 * A âncora é parte do destino: quem clicava em "SIGBM" quer chegar na seção,
 * não no topo de uma página longa.
 */
const ROTA = "/ambiental/barragens/sigbm";

export const metadata: Metadata = {
  title: "SIGBM / ANM — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteSigbm() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="O painel do SIGBM agora vive na página de barragens"
      descricao="O conteúdo é o mesmo: os cinco cartões, os gráficos de emergência e situação, a nota metodológica e a tabela completa do cadastro da ANM. Ele passa a dividir a página com o inventário da FEAM e o cadastro nacional do SNISB."
    />
  );
}
