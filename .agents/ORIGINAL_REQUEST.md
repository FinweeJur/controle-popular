# Original User Request

## 2026-08-31T16:45:57Z

Implementar o pipeline completo de coleta, extração estruturada de metadados, classificação temática determinística e linkagem automática de atos de diários oficiais municipais (editais, contratos, convênios, decretos e leis) no portal Controle Popular, conectando-os às páginas de contratos, licitações e finanças de cada cidade.

Working directory: C:\DevCoder\controle-popular
Integrity mode: development

## Requirements

### R1. Motor de Classificação e Extração de Metadados
- Expandir o classificador determinístico (apps/web/lib/diario/classificarAto.ts e etl/betim/etl/diario.py) para categorizar com precisão os atos em: edital (licitações/dispensas/homologações), contrato, convenio, decreto, portaria, lei e outro.
- Implementar extrator de entidades para capturar valores monetários (R$), CNPJs de empresas contratadas, números de processos/editais e objetos.
- Garantir anonimização automática rigorosa de CPFs de pessoas físicas via algoritmo mod-11 antes de qualquer persistência.

### R2. Ingestão e Coletores por Plataforma Municipal
- Estruturar e normalizar dados dos diários oficiais das cidades do portal:
  * Diamantina (SIGPub / AMM-MG — base de 16.601 atos);
  * Betim (Órgão Oficial de Betim);
  * Belo Horizonte (DOM-Web PBH);
  * Araçuaí e Itinga (Diários eletrônicos municipais).
- Gerar fatias compactadas JSON para consumo eficiente no cliente.

### R3. Página do Diário Oficial Municipal
- Construir a interface /[municipio]/prefeitura/diario seguindo a regra das 5 coisas:
  1. Gráfico SVG de distribuição de atos por tipo e evolução no tempo;
  2. Cartões de topo com os agregados (total de atos, editais, contratos, convênios);
  3. Filtros interativos por Tipo (TagChip), Órgão e Período;
  4. Busca textual com normalização sem acento (semAcento);
  5. Botão de exportação de planilha CSV com BOM UTF-8 e separador ;.

### R4. Linkagem Automática Cruzada
- Conectar automaticamente os atos categorizados com as páginas temáticas:
  * Aba / card de contratos do diário em /[municipio]/prefeitura/contratos;
  * Aba / card de editais e avisos em /[municipio]/prefeitura/licitacoes;
  * Remissão a termos de colaboração e fomento em /[municipio]/convenios.

## Acceptance Criteria

### Integridade e Tipagem
- [ ] TypeScript compila com 0 erros (npx tsc --noEmit -p apps/web/tsconfig.json).
- [ ] Nenhum erro de lint ou imports circulares.

### Testes e Verificação
- [ ] Suíte de testes unitários passando (npm test e classificarAto.test.ts).
- [ ] Extrator de entidades validado com fixtures reais de diários.

### Privacidade e LGPD
- [ ] Verificação de zero CPFs em arquivos de dados (python scripts/checar-dado-pessoal-em-dado.py) passa com 100% de sucesso.
- [ ] Segredos isolados de acordo com .claude/settings.json e .cursorignore.
