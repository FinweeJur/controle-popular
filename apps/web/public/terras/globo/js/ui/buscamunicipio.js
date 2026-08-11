/**
 * buscamunicipio.js — campo de busca dos 853 municípios de Minas Gerais.
 *
 * Antes só dava para ir a cinco lugares: os botões de foco. Um mapa de
 * pesquisa sobre Minas em que não se pode ir a Pompéu — onde estão 3.745 dos
 * 4.408 ha de pastagem sobre terra pública da bacia — deixa a resposta fora
 * do alcance de quem pergunta.
 *
 * Usa `<datalist>` nativo em vez de dropdown próprio: o navegador já filtra
 * enquanto se digita, funciona com teclado, funciona no celular, e são 853
 * opções — nada que exija virtualização. Menos código para manter e mais
 * acessível do que qualquer combobox que eu escrevesse aqui.
 *
 * A busca ignora acento e caixa: "para de minas", "Pará de Minas" e
 * "PARA DE MINAS" chegam no mesmo lugar. Quem digita nome de município não
 * está pensando em acentuação.
 *
 * Classes CSS esperadas (definidas em ../css/hud.css — NÃO estilizar aqui):
 *   .busca-municipio, .busca-erro
 *
 * API pública:
 *   const busca = createBuscaMunicipio(el, { onSelecionar });
 *   busca.limpar();
 */

import { carregarMunicipios, normalizar } from '../data/municipios.js';

export { normalizar };

/**
 * @param {HTMLElement} el          container (o próprio #focusbar — anexa, não limpa)
 * @param {object} opts
 * @param {(feature: object) => void} opts.onSelecionar
 */
export function createBuscaMunicipio(el, { onSelecionar } = {}) {
  const listaId = 'lista-municipios';

  const campo = document.createElement('input');
  campo.type = 'search';
  campo.className = 'busca-municipio';
  campo.placeholder = 'Buscar município…';
  campo.setAttribute('aria-label', 'Buscar município de Minas Gerais');
  campo.setAttribute('list', listaId);
  campo.autocomplete = 'off';
  campo.disabled = true;                     // habilita quando a lista chegar
  campo.title = 'Carregando a lista de municípios…';

  const lista = document.createElement('datalist');
  lista.id = listaId;

  el.append(campo, lista);

  /** normalizado -> Feature */
  let porNome = new Map();

  carregarMunicipios()
    .then(({ porNome: mapa, nomes }) => {
      porNome = mapa;
      lista.innerHTML = nomes.map((n) => `<option value="${n}"></option>`).join('');
      campo.disabled = false;
      campo.title = `Buscar entre ${nomes.length} municípios de Minas Gerais`;
    })
    .catch((err) => {
      campo.placeholder = 'Busca indisponível';
      campo.title = `Não foi possível carregar a lista de municípios: ${err.message}`;
      console.warn('[busca] lista de municípios não carregou:', err.message);
    });

  function tentar() {
    const digitado = campo.value.trim();
    if (!digitado) return;
    const achado = porNome.get(normalizar(digitado));
    if (!achado) {
      // Sem correspondência exata, aceita o único que começa pelo que foi digitado
      const chave = normalizar(digitado);
      const parciais = [...porNome.entries()].filter(([k]) => k.startsWith(chave));
      if (parciais.length === 1) {
        campo.value = parciais[0][1].properties.nome;
        campo.classList.remove('busca-erro');
        onSelecionar?.(parciais[0][1]);
        campo.blur();
        return;
      }
      campo.classList.add('busca-erro');
      campo.title = parciais.length
        ? `${parciais.length} municípios começam com "${digitado}" — escolha na lista`
        : `Nenhum município de MG chamado "${digitado}"`;
      return;
    }
    campo.classList.remove('busca-erro');
    onSelecionar?.(achado);
    campo.blur();
  }

  // `change` cobre a escolha no datalist (clique/seta); `keydown` cobre o Enter
  // depois de digitar o nome inteiro sem abrir a lista.
  campo.addEventListener('change', tentar);
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); tentar(); }
  });
  campo.addEventListener('input', () => campo.classList.remove('busca-erro'));

  return {
    limpar() {
      campo.value = '';
      campo.classList.remove('busca-erro');
    },
  };
}
