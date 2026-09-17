# Plano de Implementação — Geolocalização e Integração das Camadas Ambientais no Globo 3D

> Data: 2026-09-17  
> Status: Aprovado via entrevista /grill-me  
> Domínio: Meio Ambiente / Globo 3D  

---

## 🧭 Diretrizes e Decisões Alinhadas (Entrevista /grill-me)

1. **3 Camadas Temáticas Independentes no Painel do Globo:**
   - 🟢 **Licenciamento Ambiental** (cor `#10b981` / Verde Esmeralda): Licenças Prévias, de Instalação, Operação e Simplificadas de todos os estados e IBAMA.
   - 🔵 **Outorgas de Água** (cor `#38bdf8` / Ciano): Usos e captações outorgadas pela ANA e pelo IGAM-MG.
   - 🔴 **Infrações e Embargos** (cor `#ef4444` / Vermelho Coral): Autos de infração, multas e termos de embargo (IBAMA autos, FEPAM-RS, SEMA-MT, etc.).

2. **Estratégia de Geolocalização Híbrida Inteligente:**
   - **Coordenadas Nativas Exatas:** Aproveita latitudes/longitudes originais dos cadastros WFS/GeoServer/GeoNode quando presentes.
   - **Centróide Municipal com Dispersão Determinística (Jittering):** Para registros com apenas Município e UF, utiliza o centróide oficial do município (base IBGE) com micro-afastamento em espiral baseado no hash do processo (`fibonacci/golden ratio spiral`), evitando sobreposição exata de múltiplos pontos no mesmo pixel 3D.

3. **Arquitetura de Dados Leve e Estática (Regra 1 AGENTS.md):**
   - Pipeline de geração pré-processado (`scripts/gerar-camadas-ambientais-globo.py`) gerando 3 arquivos GeoJSON compactos:
     - `apps/web/public/terras/globo/dados/camadas/licencas-ambientais.geojson`
     - `apps/web/public/terras/globo/dados/camadas/outorgas-agua.geojson`
     - `apps/web/public/terras/globo/dados/camadas/infracoes-embargos.geojson`
   - Respeita rigorosamente o teto de 25 MiB do Cloudflare Workers e garante 60 FPS no Three.js.

4. **Interatividade e Inspetor no HUD Lateral:**
   - Ao clicar no ponto 3D, o inspetor (`ui/inspector.js`) exibe a ficha com:
     - Nome do Órgão e UF em badge
     - Número do Processo e Empresa/Titular
     - Porte do Empreendimento e Valor Monetário (R$)
     - Microresumo do ato
     - Botão estilizado **Fonte Oficial ↗** (link externo direto ao processo)
     - Botão **Ver na Tabela do Portal ↗** (redireciona para `/ambiental/licencas` com busca pré-preenchida)

5. **Comportamento e Performance:**
   - As 3 camadas nascem desativadas na abertura inicial para renderização instantânea do globo, e podem ser ligadas a qualquer momento no seletor lateral com 1 clique.

---

## 🛠️ Arquivos e Componentes Afetados

### 1. Script de Coleta e Georreferenciamento
#### [`scripts/gerar-camadas-ambientais-globo.py`](file:///c:/DevCoder/controle-popular/scripts/gerar-camadas-ambientais-globo.py)
- Lê os arquivos JSON de dados unificados em `apps/web/data/*.json`.
- Carrega as coordenadas dos municípios a partir de `apps/web/data/municipios-mg.json` e base municipal nacional.
- Aplica o algoritmo de jittering determinístico nos pontos municipais.
- Sanitiza dados pessoais (mod-11 CPF).
- Emite as 3 FeatureCollections GeoJSON em `apps/web/public/terras/globo/dados/camadas/`.

### 2. Configuração do Globo 3D
#### [`apps/web/public/terras/globo/js/config.js`](file:///c:/DevCoder/controle-popular/apps/web/public/terras/globo/js/config.js)
- Adiciona o grupo de assunto `'ambiental'` em `ASSUNTOS`.
- Registra as 3 novas entradas em `LAYER_REGISTRY`:
  - `licencas-ambientais`: `render: 'point'`, `pointSize: 6`, `color: 0x10b981`.
  - `outorgas-agua`: `render: 'point'`, `pointSize: 6`, `color: 0x38bdf8`.
  - `infracoes-embargos`: `render: 'point'`, `pointSize: 7`, `color: 0xef4444`.

### 3. Inspetor e Ficha de Detalhes
#### [`apps/web/public/terras/globo/js/ui/inspector.js`](file:///c:/DevCoder/controle-popular/apps/web/public/terras/globo/js/ui/inspector.js)
- Reconhece as camadas ambientais e renderiza a ficha lateral especializada:
  - Exibição de Empresa, Processo, Porte, Valor R$, Microresumo.
  - Botão "Fonte Oficial ↗" abrindo a URL oficial do ato em nova aba.
  - Botão "Ver no Painel de Licenças ↗".

### 4. Testes Automatizados
#### [`apps/web/public/terras/globo/js/layers/camadas-ambientais.test.mjs`](file:///c:/DevCoder/controle-popular/apps/web/public/terras/globo/js/layers/camadas-ambientais.test.mjs)
- Testa a integridade dos GeoJSONs gerados.
- Valida que nenhum CPF vaza nas propriedades.
- Valida que as coordenadas geradas estão dentro dos limites geográficos do Brasil.
- Valida que as 3 camadas estão registradas no `LAYER_REGISTRY`.
