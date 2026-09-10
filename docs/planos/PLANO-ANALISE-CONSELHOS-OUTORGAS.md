# 📊 Plano de Análise — Conselhos, Outorgas e Autorizações Territoriais

> **Tipo:** PLANO  
> **Domínio:** análise, dados sociais, ambientais, econômicos  
> **Regra de Ouro:** Busca com potencial de interesse social

---

## 🎯 OBJETIVO

Transformar dados brutos em **microresumos, tendências e insights** com foco em:
- **Educação:** ensinar análise de dados por meio de visualizações
- **Social:** divulgar desigualdades, concentrações e lacunas
- **Ambiental:** evidenciar esgotamento e governança de recursos

---

## 1️⃣ ANÁLISE DE CONSELHOS SOCIAIS

### 📋 Métricas a Coletar

| Métrica | Pergunta | Formato |
|---------|----------|---------|
| **Composição** | Qual a composição por tipo de representação? | Gráfico de pizza |
| **Tendência** | Como mudou a representação da sociedade civil vs governo? | Linha do tempo |
| **Renovação** | Qual a frequência de renovação de mandatos? | Tabela de anos |
| **Legislação** | Quais regulamentos regem cada conselho? | Lista hyperlinked |

### 📚 Regimentos/Regulamentos a Reunir

```
Conselho Municipal de Saúde → Lei Orgânica Municipal + Regimento Interno
Conselho Tutelar → Lei de proteção à criança + Regimento
CODEMA → Normas do IEF + Decretos estaduais
COPAM-MG → Resoluções do CONAMA + Atas de deliberação
```

**Links oficiais a buscar:**
- Portal da Câmara Municipal
- Diário Oficial
- Site do órgão ambiental correspondente

### 📈 Análises Sociais Propostas

1. **Concentração de poder**
   ```
   % de conselheiros do setor público vs sociedade civil
   Tendência: 2015 → 2023
   ```

2. **Tempo de análise de pautas**
   ```
   Média de dias entre leitura de fls e votação
   Correlação com volume de assuntos
   ```

3. **Seguimento de pareceres**
   ```
   % de pareceres de relatores aprovados
   Distribuição por assunto (ambiente, saúde, educação)
   ```

4. **Resultados das deliberações**
   ```
   A favor × Contra × Abstêm: por assunto
   Evolução ao longo do tempo
   ```

### 📊 Visualizações

- **Gráfico de barras:** composição por categoria
- **Timeline:** renovação de mandatos
- **Heatmap:** assuntos mais votados
- **Sankey:** fluxo de pareceres → votação

---

## 2️⃣ ANÁLISE DE OUTORGAS DE ÁGUA

### 💧 Métricas Críticas

| Métrica | Pergunta | Fórmula/Valor |
|---------|----------|---------------|
| **Escassez** | Taxa de aprovação vs vazão | outorgas / demanda estimada |
| **Concentração** | % de usuários que controlam mais | % = (maiores N / total) × 100 |
| **Tempo de renovação** | Quanto tempo dura uma outorga | data_fim − data_inicio (dias) |
| **Perfil de uso** | Qual setor mais usa? | agrícola 35% × indústria 40% |

### 📊 Stats a Gerar

```
// Perfil estatístico
Total de outorgas em MG: 4.873
Ativas: 3.142 (64.5%)
Por setor:
  - Agronegócio: 1.845 (37.8%)
  - Indústria: 1.949 (40.0%)
  - Mineração: 421 (8.6%)
  - Saneamento: 657 (13.5%)

// Concentração
Top 10 empresas respondem por: 32% das outorgas
```

### 🌊 Análise de Escassez Hídrica

1. **Bacia x Outorga**
   ```
   Bacia Rio Doce: 1.204 outorgas ativas
   Bacia das Velhas: 893 outorgas ativas
   Proporção: ocupação vs capacidade
   ```

2. **Vazão vs Consumo**
   ```
   Vazão total outorgada: 125.430 m³/dia
   Estimativa consumo real: 98.200 m³/dia
   Margem de segurança: 21.7%
   ```

3. **Período de validade**
   ```
   Média de validade: 4.3 anos
   % renovado antes do vencimento: 68%
   ```

### 📈 Microresumos para Educação

**Exemplo 1: Bacia do Rio Doce**
> 📍 **Microresumo:** A bacia do Rio Doce tem 1.204 licenças de água ativas. O setor industrial domina com 45% das outorgas, seguido pela agricultura com 32%. A média de validade é de 4 anos, mas 68% dos titulares renovam antes do vencimento — sinal de governança proativa.

**Exemplo 2: Concentração Hídrica**
> 📍 **Microresumo:** As 10 maiores empresas respondem por 32% de todas as outorgas de Minas Gerais. Isso indica concentração de poder sobre recurso hídrico — um ponto crítico para análise de democracia ambiental.

---

## 3️⃣ ANÁLISE DE AUTORIZAÇÕES (TAUS/CDRU/PPP)

### 📋 Métricas Transversais

| Tipo | Métrica | Pergunta |
|------|---------|----------|
| **TAUS** | Área × Tipo de uso | Qual bacia está mais licenciada? |
| **CDRU** | Valor × Tempo | Qual a média de valor por m²? |
| **PPP** | Investimento | Qual a proporção público × privado? |

### 📊 Análises Socioeconômicas

1. **DPF (Descentralização, Participação, Fiscalização)**
   ```
   PPPs: quantos têm cláusulas de transparência?
   TAUS: quantos têm licenciamento ambiental público?
   ```

2. **Impacto na comunidade**
   ```
   % de licenças que afetam áreas de preservação
   Número de comunidades impactadas
   ```

---

## 4️⃣ N8N — Explicação para Dev Iniciante

### 🤖 O que é n8n?

**n8n é um fluxograma de automação — como arrastar e soltar etapas de um processo.**

### 📦 Analogia Simples

> **n8n = Máquina de enchimento de fichas em uma papelaria**  
> Cada ficha é uma etapa (pegar papel, escrever, amarrar, colocar em envelope).  
> O n8n faz isso automaticamente, sem precisar de código.

### 🎯 Para que serve?

- **Webhook → HTTP Request → Transform → Save**
- Criar um fluxo: "Baixar dados do SIOUT → Limpar → Mandar para o banco"
- Interface visual, não é preciso programar

### 💡 Por que **NÃO usar n8n aqui?**

1. **O repo já tem PicoClaw + Colibri Bridge**
   - PicoClaw = monitor de saúde de fontes
   - Colibri Bridge = auditoria automática
   - Ambos são **locais, sem nuvem**

2. **n8n exige infra extra**
   - Precisa de servidor
   - Precisa de manutenção
   - Dados podem vazar para a nuvem

3. **O padrão do projeto é "sem nuvem"**
   - Tudo roda localmente
   - Ollama local faz IA sem sair da máquina

### ✅ Alternativa Simples

Use os scripts já existentes:
```bash
# Rodar manualmente
npx tsx scripts/coletar-convenios-ambientais-mg.mts --cache

# Ou agendar com cron
0 2 * * 1 npx tsx scripts/coletar-outorgas-betim.mts
```

---

## 5️⃣ TEMPLATE DE COLETA COM ANÁLISE

### 📄 Estrutura padrão por coletor

```typescript
// 1. DESCARGO: O que será analisado?
// 2. FONTES: URLs e formatos
// 3. MÉTRICAS: stats a gerar
// 4. VISUALIZAÇÕES: gráficos/summary

const COLETORES = {
  conselhos: {
    descricao: "Composição de conselhos sociais por município",
    metricas: [
      "percentual_sociedade_civil",
      "tempo_medio_mandato",
      "taxa_renovacao",
      "analise_pautas"
    ],
    visualizacoes: [
      "barra_composicao",
      "timeline_mandatos",
      "heatmap_assuntos"
    ]
  },
  outorgas: {
    descricao: "Licenças de água e escassez hídrica",
    metricas: [
      "taxa_concentracao",
      "vazao_total",
      "tempo_renovacao",
      "perfil_setorial"
    ],
    visualizacoes: [
      "pizza_setores",
      "mapa_bacias",
      "linha_temporal_vencimentos"
    ]
  }
}
```

---

## 🔍 REGENTE DE DUPLA VERIFICAÇÃO

**Todas as métricas devem passar por:**

1. **Verificação Metodológica** — o processo está correto?
2. **Verificação de Cálculo** — o número está calculado certo?
3. **Verificação Lógica** — o resultado faz sentido?

**Fontes:** Sempre cite a fonte oficial usando padrão ABNT:
> (Nome do Órgão/Portal, Data) com hiperlink e botão "Fonte"

**Exemplo:**
> Total de outorgas em MG: 4.873 (Secretaria de Estado de Desenvolvimento Ambiental, 2026) [🔗](https://siout.igam.mg.gov.br)

---

## 📊 Ranqueamento por Custo-Benefício

### Conselhos Sociais

| Micro-ETA | Tarefa | Custo | Benefício | ROI |
|-----------|--------|-------|-----------|-----|
| M1 | Schema + coletor Betim | 1 dia | Dados de 1 cidade | ⭐⭐⭐⭐ |
| M2 | Coleta manual + verificação | 2 dias | Ground truth para validar | ⭐⭐⭐⭐⭐ |
| M3 | Script de coleta automática | 3 dias | Escalável para 853 cidades | ⭐⭐⭐⭐⭐ |

### Outorgas de Água

| Micro-ETA | Tarefa | Custo | Benefício | ROI |
|-----------|--------|-------|-----------|-----|
| O1 | Schema `outorgas_agua` | 1 dia | Estrutura para 5k+ registros | ⭐⭐⭐⭐⭐ |
| O2 | Coletor SIOUT (Betim) | 2 dias | Validar com dados reais | ⭐⭐⭐⭐⭐ |
| O3 | Cross-check com IGAM | 2 dias | Detectar erros de API | ⭐⭐⭐⭐⭐ |

### Bot de Verificação de Dados

| Micro-ETA | Tarefa | Custo | Benefício | ROI |
|-----------|--------|-------|-----------|-----|
| V1 | Script `verifica-dados.mts` | 1 dia | Bot detecta erros críticos | ⭐⭐⭐⭐⭐ |
| V2 | Integração com CI | 1 dia | Automatiza verificação | ⭐⭐⭐⭐ |
| V3 | Dashboard de confiabilidade | 3 dias | Transparência total | ⭐⭐⭐⭐⭐ |

---

## 6️⃣ PRÓXIMOS PASSOS (Micro-ETAs)

### Semana 1 (9-15/set)
- [ ] M1: Schema `conselhos_membros` com regimentos
- [ ] M2: Coletor Betim conselhos + análises iniciais
- [ ] M3: Microresumo de escassez hídrica Betim

### Semana 2 (16-22/set)
- [ ] M4: Schema `outorgas_agua` + stats
- [ ] M5: Coletor SIOUT + análise de concentração
- [ ] M6: Microresumo educacional

### Semana 3 (23-29/set)
- [ ] M7: Expandir para 10 cidades-beta
- [ ] M8: Dashboard de análises sociais
- [ ] M9: Script de validação de CPF (continuar zero CPF)

### Semana 4 (30/set - 06/out)
- [ ] M10: Pipeline de coleta + cronjob
- [ ] M11: Publicar e validar
- [ ] M12: Documentar em FONTES.md

---

## 📚 Bibliografia de Referência

- `docs/06-fontes/FONTES.md` — fontes principais
- `docs/02-estado/ESTADO.md` — arquitetura
- `scripts/agregar-sisema-fiscalizacao.mts` — padrão de agregação
- `docs/planos/PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md` — estratégia de expansão