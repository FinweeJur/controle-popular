/**
 * intro.js — cartão de abertura: o que é este mapa e como mexer nele.
 *
 * Por que existe: antes disto, o globo abria mostrando um planeta girando,
 * manchas roxas sobre Minas, um relógio UTC e a palavra "LAYERS". Nada na tela
 * dizia o que as manchas eram, o que a pessoa devia fazer, nem que os dados são
 * uma pesquisa e não um cadastro oficial. Quem não construiu o projeto não
 * tinha como saber — e não havia texto nenhum a que recorrer.
 *
 * Aparece na primeira visita e some quando a pessoa fecha; a escolha fica no
 * localStorage. O botão "?" da barra de cima reabre sempre.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   #intro, .intro-card, .intro-title, .intro-lead, .intro-steps,
 *   .intro-nota, .intro-btn, .intro-close
 *
 * API pública:
 *   const intro = createIntro(document.getElementById('intro'));
 *   intro.abrir();   // usado pelo botão "?" da statusbar
 */

const CHAVE = 'terras-publicas:intro-vista';

export function createIntro(el) {
  el.innerHTML = `
    <div class="intro-card" role="dialog" aria-labelledby="intro-title" aria-modal="false">
      <button class="intro-close" type="button" aria-label="Fechar">×</button>

      <h2 class="intro-title" id="intro-title">O que é este mapa</h2>

      <p class="intro-lead">
        Uma pesquisa sobre <strong>terra pública em Minas Gerais</strong>: procurar, no mapa,
        onde pode haver terra que é do Estado sem ninguém saber.
      </p>

      <p class="intro-lead">
        As manchas roxas são <strong>terra sem cadastro rural</strong>. Todo imóvel rural
        deveria estar declarado no CAR, o Cadastro Ambiental Rural — estas áreas não estão em
        nenhum. Isso pode ser sinal de terra pública sem destino certo. Também pode ser
        simplesmente um cadastro que ninguém fez.
      </p>

      <ol class="intro-steps">
        <li><strong>Escolha onde olhar.</strong> Os botões embaixo do globo levam a sete municípios do estudo. O campo ao lado deles busca qualquer um dos 853 de Minas.</li>
        <!-- ⟲ 13/08: este passo dizia "cada linha explica o que aquela camada
             mostra", e a reorganização do painel tornou isso falso — a
             explicação saiu da linha e foi para trás do botão "?". Cartão de
             abertura que descreve uma tela que não existe mais é pior que
             cartão nenhum: ensina a procurar o que não está lá. -->
        <li><strong>Ligue e desligue camadas.</strong> No painel da direita, agrupadas por assunto. Cada linha tem um <strong>?</strong> que abre a explicação: o que a camada mostra, de onde veio e o que ela <em>não</em> prova.</li>
        <li><strong>Filtre por região, se quiser.</strong> Em cima do painel. Escolher a região não liga nem desliga camada nenhuma — só recorta o que já está ligado. O estudo cobre a bacia do Paraopeba, o Vale do Jequitinhonha e o Vale do Mucuri.</li>
        <li><strong>Clique numa mancha.</strong> Abre o tamanho da área, o município e quanto dela é mata nativa — e dá para focar a câmera nela ou ver o lugar de perto, na imagem de satélite.</li>
        <li><strong>Ou veja tudo em lista.</strong> O botão <em>Ver em lista</em>, lá em cima, mostra as áreas encontradas da maior para a menor. Clicar numa linha leva ao lugar.</li>
      </ol>

      <p class="intro-nota">
        Pesquisa acadêmica, não documento oficial. Cada área é um lugar para conferir, não uma
        conclusão: quem decide se uma terra é devoluta é o INCRA, a SPU ou a Justiça.
      </p>

      <button class="intro-btn" type="button">Ver o mapa</button>
      <p class="intro-nota intro-nota-fim">
        Para reler isto, use o <strong>?</strong> na barra de cima.
        Para entender como a conta é feita, de onde vem cada dado e o que o mapa
        <!-- Era /app/metodo (backend FastAPI original, página dedicada que não foi
             publicada aqui). /funcaosocialterra é o hub do Controle Popular para esta
             frente e já explica o método — mais perto do que existe de fato do que um
             link morto. target="_blank": o globo roda num <iframe>, e navegar sem isso
             trocaria o conteúdo do iframe pelo hub, perdendo o mapa. -->
        <em>não</em> prova: <a class="intro-link" href="/funcaosocialterra" target="_blank" rel="noopener">como este mapa é feito</a>.
      </p>
    </div>`;

  const fechar = () => {
    el.classList.remove('visible');
    try {
      localStorage.setItem(CHAVE, '1');
    } catch {
      /* navegador com storage bloqueado: o cartão volta na próxima visita, e tudo bem */
    }
  };

  el.querySelector('.intro-close').addEventListener('click', fechar);
  el.querySelector('.intro-btn').addEventListener('click', fechar);
  el.addEventListener('click', (e) => {
    if (e.target === el) fechar(); // clique fora do cartão
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.classList.contains('visible')) fechar();
  });

  let jaViu = false;
  try {
    jaViu = localStorage.getItem(CHAVE) === '1';
  } catch {
    jaViu = false;
  }
  if (!jaViu) el.classList.add('visible');

  return {
    abrir() {
      el.classList.add('visible');
    },
  };
}
