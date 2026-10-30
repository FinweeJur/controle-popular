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
  for (const el of raiz.querySelectorAll<HTMLElement>("*")) {
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
 * recolocada antes de devolver. Versão aprimorada com restauração síncrona
 * e proteção contra interferências em listas roláveis internas.
 */
export function medirTamanhoNatural(painel: HTMLElement): {
  largura: number;
  altura: number;
} {
  // Salvar estado de rolagem completo
  const scrollTopAnterior = painel.scrollTop;
  const restaurarDescendentes = guardarRolagemDescendentes(painel);
  
  // Salvar estilo atual
  const maxAnterior = painel.style.maxHeight;
  const overflowAnterior = painel.style.overflow;
  
  // Preparar medição sem perder rolagem
  painel.style.maxHeight = "none";
  painel.style.overflow = "visible"; // Evitar rolagem durante medição
  
  // Medir tamanho natural
  const altura = painel.scrollHeight;
  const largura = painel.offsetWidth;
  
  // Restaurar estilo ANTES de restaurar rolagem para evitar pulos
  painel.style.maxHeight = maxAnterior;
  painel.style.overflow = overflowAnterior;
  
  // Restaurar rolagem de forma síncrona e segura
  restaurarDescendentes();
  
  // Garantir que a rolagem do painel principal seja restaurada
  if (painel.scrollTop !== scrollTopAnterior) {
    painel.scrollTop = scrollTopAnterior;
  }
  
  return { largura, altura };
}
