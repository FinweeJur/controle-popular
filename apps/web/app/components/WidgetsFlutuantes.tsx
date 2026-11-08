"use client";

import DicaHover from "@/app/components/DicaHover";
import { SeuNono } from "@/app/components/SeuNono";
import { PonteCompanheiro } from "@/app/components/PonteCompanheiro";
import CompanheiroOpcional from "@/app/components/CompanheiroOpcional";
import RastroCursorBotao from "@/app/components/RastroCursorBotao";
import CliqueNegado from "@/app/components/CliqueNegado";
import ConviteTema from "@/app/components/ConviteTema";

/**
 * @file Widgets flutuantes do casco — o que aparece por cima de qualquer rota.
 *
 * POR QUE ESTÃO JUNTOS: são sete componentes que o layout monta em TODA página,
 * cada um com uma decisão de produto própria. Empilhados dentro do componente
 * `RootLayout`, eles faziam dele o maior bloco do arquivo e escondiam a
 * estrutura do documento (head, provider, header, main, footer). Separados,
 * o layout volta a ler como documento e esta lista vira o inventário do que
 * flutua sobre o site — em ordem de camada, não de importância.
 *
 * ORDEM IMPORTA: `ConviteTema` entra por último porque é o mais novo e o mais
 * discreto; os demais já convivem em produção. Todos dependem do ThemeProvider
 * (usam `useTheme`), por isso este componente só pode ser montado DENTRO dele.
 *
 * CADA UM É OPT-IN OU SILENCIOSO: nenhum abre sozinho na cara do leitor.
 * Ver o comentário de cada arquivo antes de mudar o comportamento.
 *
 * SEM DOCK (dono, 08/11/2026): o dock de rádio/bicho/rastro durou poucas horas.
 * A pilha da esquerda volta a ter só o Seu Nonô, a pata e o rádio que já
 * existiam. Não reintroduza botões flutuantes novos aqui sem pedido explícito.
 */
export default function WidgetsFlutuantes() {
  return (
    <>
      {/* Dica no hover: janelinha explicativa depois de 2 s parado sobre um
          botão ou link. Um componente aqui cobre as ~100 páginas do portal —
          o texto sai do `data-dica`, do `aria-label` ou do `title`. */}
      <DicaHover />
      {/* Seu Nonô — assistente flutuante. Modo texto enquanto IA não está
          configurada; modo IA (RAG) quando houver chave de API. */}
      <SeuNono />
      {/* Ponte responsiva para o companheiro de desktop (bichinho). Só age com
          NEXT_PUBLIC_COMPANHEIRO_PONTE=1; sem a variável, é um no-op. */}
      <PonteCompanheiro />
      {/* Companheiro Seu Nonô — passarinho flutuante. OPT-IN (dono,
          19/10/2026): não nasce sozinho. Este componente virou só o PORTÃO
          (monta o bicho quando ligado e o menu offline quando não); o
          liga/desliga fica no cartão "Acessibilidade" do Seu Nonô. */}
      <CompanheiroOpcional />
      {/* Interruptor do rastro mágico: quarto item da pilha da esquerda.
          Só aparece com o ponteiro no Seu Nonô (ou com a trilha ligada). */}
      <RastroCursorBotao />
      {/* X de negação no clique fora de botões (dono, 19/10/2026): recado
          visual de que o alvo é só um card, sem ação. */}
      <CliqueNegado />
      {/* Convite de tema (02/11/2026): o padrão virou claro; este é o lembrete
          discreto de que existe escuro e tema de bioma. Uma vez por navegador,
          sem modal. */}
      <ConviteTema />
    </>
  );
}
