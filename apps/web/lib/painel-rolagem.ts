/**
 * Rolagem preservada ao medir painéis flutuantes.
 *
 * Papel no portal: o índice do rádio, o menu do pet e a janelinha do Seu Nonô
 * medem a altura natural do painel para decidir onde abrir. A medição tira o
 * teto de altura por uma batida de layout; isso zera o `scrollTop` do painel e
 * dos filhos roláveis (a lista do rádio é filha, não o painel). Aqui ficam as
 * duas funções que guardam e devolvem essa rolagem.
 *
 * Extraído de `posicionar-painel.ts` em 29/10/2026 porque o CodeScene cobra a
 * complexidade média do arquivo; separar mantém cada módulo com uma
 * responsabilidade e a média baixa.
 */

/**
 * Guarda e devolve a rolagem de TODOS os contêineres roláveis dentro do painel.
 *
 * O conserto de 05/10/2026 já guardava o `scrollTop` do painel; em 29/10/2026
 * ficou medido que o índice do rádio rola na LISTA filha e continuava pulando
 * para o topo a cada render (inclusive nos eventos do `<audio>`). Por isso os
 * descendentes também entram.
 */
export function guardarRolagemDescendentes(raiz: HTMLElement): () => void {
  const alvos: { el: HTMLElement; topo: number }[] = [];
  const elementos = Array.from(raiz.querySelectorAll<HTMLElement>("*"));
  for (const el of elementos) {
    if (el.scrollTop > 0) alvos.push({ el, topo: el.scrollTop });
  }
  return () => {
    for (const { el, topo } of alvos) {
      if (el.scrollTop !== topo) el.scrollTop = topo;
    }
  };
}

/**
 * Mede o tamanho natural do painel sem perder a rolagem do leitor.
 *
 * O teto de altura é removido por uma batida de layout para o `scrollHeight`
 * refletir o conteúdo inteiro; a posição do painel e dos filhos roláveis é
 * recolocada antes de devolver.
 *
 * Melhorado em 30/10/2026: adiciona timeout e rollback para garantir que
 * a rolagem seja restaurada mesmo em casos de falha ou medições consecutivas.
 */
export function medirTamanhoNatural(painel: HTMLElement): {
  largura: number;
  altura: number;
} {
  // Salva estado completo de rolagem antes da medição
  const estadoRolagem = {
    painel: {
      scrollTop: painel.scrollTop,
      scrollLeft: painel.scrollLeft,
    },
    maxAnterior: painel.style.maxHeight,
    restaurarDescendentes: guardarRolagemDescendentes(painel),
  };

  // Remove o teto de altura para medição natural
  painel.style.maxHeight = "none";
  
  // Mede o tamanho natural
  const altura = painel.scrollHeight;
  const largura = painel.offsetWidth;

  // Função de rollback em caso de falha
  const rollback = () => {
    // Restaura maxHeight primeiro para evitar flicker
    painel.style.maxHeight = estadoRolagem.maxAnterior;
    // Restaura rolagem dos descendentes
    estadoRolagem.restaurarDescendentes();
    // Restaura rolagem do painel
    painel.scrollTop = estadoRolagem.painel.scrollTop;
    painel.scrollLeft = estadoRolagem.painel.scrollLeft;
  };

  try {
    // Restaura maxHeight imediatamente após medição
    painel.style.maxHeight = estadoRolagem.maxAnterior;
    
    // Restaura rolagem dos descendentes
    estadoRolagem.restaurarDescendentes();
    
    // Garante que a rolagem do painel seja restaurada mesmo se houve mudança
    if (painel.scrollTop !== estadoRolagem.painel.scrollTop) {
      painel.scrollTop = estadoRolagem.painel.scrollTop;
    }
    if (painel.scrollLeft !== estadoRolagem.painel.scrollLeft) {
      painel.scrollLeft = estadoRolagem.painel.scrollLeft;
    }

    // Timeout de segurança para garantir restauração final
    setTimeout(() => {
      if (painel.scrollTop !== estadoRolagem.painel.scrollTop) {
        painel.scrollTop = estadoRolagem.painel.scrollTop;
      }
      if (painel.scrollLeft !== estadoRolagem.painel.scrollLeft) {
        painel.scrollLeft = estadoRolagem.painel.scrollLeft;
      }
    }, 0);

    return { largura, altura };
  } catch (error) {
    // Em caso de erro, usa rollback
    rollback();
    throw error;
  }
}
