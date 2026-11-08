"use client";

/**
 * DockFlutuante — quatro ações rápidas no canto inferior direito: Seu Nonô,
 * rádio, bicho (companheiro) e rastro mágico.
 *
 * POR QUE EXISTE (pedido do dono, 08/11/2026): as quatro ações estavam
 * espalhadas por cantos diferentes. O dono pediu um lugar só, com o assistente
 * MENOR que o botão atual, e o resto aparecendo só quando a pessoa chega perto.
 *
 * COMO SE COMPORTA:
 * - colapsado no mouse: só Seu Nonô (36 px de avatar em alvo de 44) e rádio;
 * - bicho e rastro entram com o ponteiro a ~120 px (`useProximidade`) ou com
 *   foco de teclado dentro do dock;
 * - cada item expande o nome no hover/foco (padrão "expanding index" do
 *   Tailwind UI: `group` + `max-w`/`opacity`);
 * - rastro fica só com o ícone; 800 ms parado abre a explicação, e no toque
 *   ela abre por 6 s (`useExplicacaoRastro`);
 * - no toque os quatro ficam abertos, senão dois seriam inalcançáveis;
 * - cores sempre com sinal além da cor (✓ + `aria-pressed`), alvo de 44 px,
 *   anel de foco e `prefers-reduced-motion` sem transição.
 *
 * NÃO REESCREVE OS COMPONENTES GRANDES: cada item dispara o evento global que
 * o dono do estado já escuta (`abrir-seu-nono`, `cp:radio-toggle`); rastro e
 * bicho usam as funções exportadas pelos próprios módulos, com
 * `useSyncExternalStore` — mesma chave, mesmo evento.
 */

import { useRef, useState, useSyncExternalStore } from "react";
import { PawPrint, RadioTower, Sparkles } from "lucide-react";
import { AvatarSeuNono } from "@/app/components/SeuNono";
import {
  EVENTO_COMPANHEIRO_ATIVO,
  definirCompanheiroAtivo,
  lerCompanheiroAtivo,
} from "@/app/components/CompanheiroOpcional";
import {
  EVENTO_RASTRO_CURSOR,
  definirRastroCursor,
  lerRastroCursor,
} from "@/app/components/RastroCursor";
import DockItem from "@/app/components/dock/DockItem";
import DockExplicacao, { ID_EXPLICACAO_RASTRO } from "@/app/components/dock/DockExplicacao";
import { ehToque, useProximidade, useSemHover } from "@/app/components/dock/useProximidade";
import { useExplicacaoRastro } from "@/app/components/dock/useExplicacaoRastro";

function inscreverRastro(cb: () => void) {
  window.addEventListener(EVENTO_RASTRO_CURSOR, cb);
  return () => window.removeEventListener(EVENTO_RASTRO_CURSOR, cb);
}

function inscreverBicho(cb: () => void) {
  window.addEventListener(EVENTO_COMPANHEIRO_ATIVO, cb);
  return () => window.removeEventListener(EVENTO_COMPANHEIRO_ATIVO, cb);
}

/** Snapshot do servidor: tudo desligado (mesmo padrão dos dois módulos). */
function desligadoNoServidor(): boolean {
  return false;
}

export default function DockFlutuante() {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [foco, setFoco] = useState(false);

  const perto = useProximidade(dockRef);
  const semHover = useSemHover();
  const explicacao = useExplicacaoRastro(dockRef);

  const rastroAtivo = useSyncExternalStore(inscreverRastro, lerRastroCursor, desligadoNoServidor);
  const bichoAtivo = useSyncExternalStore(inscreverBicho, lerCompanheiroAtivo, desligadoNoServidor);

  const aberto = perto || foco || semHover;

  const aoClicarRastro = () => {
    definirRastroCursor(!rastroAtivo);
    // No celular não há hover: o toque abre a explicação curta.
    if (ehToque()) explicacao.abrirPorToque();
  };

  return (
    <div
      ref={dockRef}
      role="group"
      aria-label="Ações rápidas do portal"
      data-cp-sem-dica
      onFocus={() => setFoco(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFoco(false);
          explicacao.fechar();
        }
      }}
      onPointerLeave={explicacao.sair}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end print:hidden"
    >
      {explicacao.aberta && <DockExplicacao />}

      {/* `flex-col-reverse`: o DOM segue a ordem do Tab (Seu Nonô, rádio,
          bicho, rastro) e a coluna cresce de baixo para cima. */}
      <div className="flex flex-col-reverse items-end">
        <DockItem
          nome="Seu Nonô"
          onClick={() => window.dispatchEvent(new CustomEvent("abrir-seu-nono"))}
          icone={
            <span aria-hidden="true" className="flex h-full w-full items-center justify-center p-1">
              <AvatarSeuNono size={36} />
            </span>
          }
        />
        <DockItem
          nome="Rádio"
          onClick={() => window.dispatchEvent(new Event("cp:radio-toggle"))}
          icone={<RadioTower size={20} aria-hidden="true" />}
        />
        <DockItem
          nome="Bicho companheiro"
          disponivel={aberto}
          ativo={bichoAtivo}
          onClick={() => definirCompanheiroAtivo(!bichoAtivo)}
          icone={<PawPrint size={20} aria-hidden="true" />}
        />
        <DockItem
          nome="Rastro mágico"
          disponivel={aberto}
          ativo={rastroAtivo}
          descritoPor={explicacao.aberta ? ID_EXPLICACAO_RASTRO : undefined}
          aoEntrarPonteiro={explicacao.entrar}
          aoSairPonteiro={explicacao.cancelar}
          onClick={aoClicarRastro}
          icone={<Sparkles size={20} aria-hidden="true" />}
        />
      </div>
    </div>
  );
}
