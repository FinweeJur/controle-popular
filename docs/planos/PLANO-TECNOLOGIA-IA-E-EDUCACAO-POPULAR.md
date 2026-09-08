# Plano de Tecnologia, Inteligência Artificial e Educação Popular em Software Livre

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-06
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** tecnologia, inteligencia-artificial, software-livre, open-source, educacao-popular, applivre, sementeira, floresta-de-apps, ollama, llm-br, cdd, dados-abertos

## Sumário

- [Propósito](#propósito)
- [Diretrizes de Tecnologia e IA Cívica](#diretrizes-de-tecnologia-e-ia-cívica)
- [Catálogo Educacional de Projetos Open Source](#catálogo-educacional-de-projetos-open-source)
- [Guia Prático de IA para Movimentos e Cidadãos](#guia-prático-de-ia-para-movimentos-e-cidadãos)
- [Checklist de Execução do Plano](#checklist-de-execução-do-plano)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Estruturar a expansão educacional do portal **Controle Popular**, oferecendo um centro de formação cidadã em **Tecnologia, Inteligência Artificial e Software Livre** baseado na experiência prática da Floresta de Apps (`sementeiraprojetos.com.br`) e no ecossistema `applivre.pages.dev`, com código aberto, links para o GitHub e guias passo a passo de como usar IA com soberania, privacidade e eficácia para a defesa de direitos e fiscalização pública.

## Diretrizes de Tecnologia e IA Cívica

1. **Soberania e Local-First**: A tecnologia deve rodar perto de quem precisa, preferencialmente no computador do próprio usuário ou em servidores auditáveis, sem dependência mandatória de nuvens proprietárias opacas.
2. **O modelo extrai, não inventa (RAG determinístico)**: A inteligência artificial serve para acelerar a leitura e estruturação de dados públicos volumosos. Toda afirmação deve vir acompanhada da fonte oficial (link, data e página).
3. **Privacidade e Proteção de Dados (Zero-Secret e LGPD)**: Nunca alimentar modelos externos com dados pessoais sensíveis ou chaves criptográficas. Sanitização prévia de identificadores.
4. **Educação em Três Níveis**: Como no modelo do AppLivre, todo projeto ou conceito deve ser explicado em três linguagens:
   - *Para quem é leigo*: analogias do dia a dia e utilidade imediata na vida real.
   - *Para quem é curioso*: funcionamento dos fluxos e comandos básicos.
   - *Para quem é técnico*: arquitetura de código, repositório no GitHub e parâmetros de execução.

## Catálogo Educacional de Projetos Open Source

Mapeamento integrado dos projetos da Floresta de Apps e ferramentas livres para incorporação e remissão:

| Projeto | Categoria | Propósito Cívico | Status | Repositório / Acesso |
|---|---|---|---|---|
| **Controle Popular** | Transparência Cívica | Monorepo de fiscalização popular de cidades, congresso, judiciário e meio ambiente | No ar | [GitHub / FinweeJur](https://github.com/melkepinho/controle-popular) |
| **llm-br** | Biblioteca de IA | Camada Python padronizada local-first (Ollama, Sabiá/Maritaca, DeepSeek) com 52 testes offline | No ar | [GitHub / llm-br](https://github.com/FinweeJur/llm-br) |
| **AppLivre** | Catálogo Livre | Diretório de ferramentas gratuitas e de código aberto explicadas em português | No ar | [applivre.pages.dev](https://applivre.pages.dev) |
| **Sementeira** | Reparação Socioambiental | Elaboração comunitária de projetos do Anexo I.1 do Acordo de Brumadinho | No ar | [sementeiraprojetos.com.br/paraopeba](https://sementeiraprojetos.com.br/paraopeba/) |
| **Foz Juris** | Gestão Jurídica | Gestão jurídica local-first com histórico imutável e criptografia AES-256 | No ar | [fozjuris.com.br](https://fozjuris.com.br) |
| **Vaire** | Agentes de IA | Pipeline de 5 agentes para ações coletivas (ACP/ADPF) com gate humano obrigatório | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **Despacho** | Advocacia Offline | App desktop Qt offline com histórico encadeado em SHA-256 estilo SEI | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **OpenOSC Harness** | Terceiro Setor | Conformidade preventiva MROSC (Lei 13.019), coleta Kobo offline e OCR de notas | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **Cutia & Cutiazinha** | Workspace & OCR | Workspace local de IA (Ollama/vLLM) integrado com automação ágil e OCR de notas | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **OSINT BR** | Investigação Cívica | Orquestrador de 31 coletores de inteligência de fontes abertas e APIs públicas | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **Lattes Agent** | Pesquisa Científica | Assistente em linguagem natural para atualização transparente do Currículo Lattes | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **Agitprop** | Organização de Base | Planejador territorial de campanhas e ações de rua 100% offline | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |
| **Coletânea Artivismo** | Acervo Cultural | Catálogo pesquisável offline de cartazes políticos e arte de rua | Em construção | [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) |

## Guia Prático de IA para Movimentos e Cidadãos

A nova rota pública `/tecnologia` reúne 5 oficinas didáticas em linguagem de praça:

1. **Oficina 1 — O que é IA Local e como rodar no seu computador sem pagar mensalidade**
   - Como instalar e usar o Ollama para rodar modelos abertos offline.
   - Por que rodar local protege denúncias e dados da comunidade de espionagem.
2. **Oficina 2 — Como cruzar contratos públicos com CNPJs suspeitos sem ser programador**
   - Uso de planilhas abertas, extração determinística e leitura automatizada do Diário Oficial.
3. **Oficina 3 — OCR e Leitura de Documentos Físicos**
   - Como transformar fotos de processos velhos ou notas fiscais em texto pesquisável.
4. **Oficina 4 — Agentes com "Gate Humano" (O humano decide)**
   - O perigo da alucinação de modelos: por que nenhuma petição ou acusação pode ser disparada sem revisão humana direta.
5. **Oficina 5 — RAG Cívico (Assistente que só cita com documento na mão)**
   - O que é Recuperação Aumentada por Geração e como construir assistentes como o Seu Nonô.

## Checklist de Execução do Plano

- [x] Conclusão da arquitetura em 3 eixos temáticos (`/direitos-em-movimento`, `/terra-e-territorios`, `/estado-e-economia`).
- [x] Ajuste da frente Cidades para a visão geral nacional em `/cidades` (199 cidades estratégicas).
- [x] Atualização da barra superior para `controlepopular.com.br` com tipografia ajustada e remoção de subtítulo.
- [x] Implementação da fita animada contínua (`Marquee`) logo abaixo da barra superior.
- [x] Reforço de contraste e sombreamento nas letras na capa da Home sobre a fotografia.
- [x] Entrada das 14 citações canônicas de *Coração sem medo* (Itamar Vieira Junior, 2025) e Galeano no catálogo canônico (`lib/citacoes.ts`).
- [x] Eliminação de menções a `.md` em páginas públicas (`/cidades`, `/alertas`, `/ambiental/clima-risco`, `/ambiental/crimes-socioambientais`, `/congresso`).
- [x] Atualização do cartão da Home para **R$ 171 bi** (orçamento municipal somado + acordos socioambientais).
- [x] Criação da página educacional de Tecnologia e IA (`apps/web/app/tecnologia/page.tsx`).
- [x] Adição da rota de Tecnologia e IA no índice do portal (`/indice`) e no menu de navegação (`TopNav.tsx` / `FooterGlobal.tsx`).
- [ ] Bateria completa de testes automatizados (`npm test` + `tsc --noEmit`).
- [ ] Verificação de ausência de dados pessoais/CPF e validação de documentação.
- [ ] Atualização do estado geral em `docs/02-estado/ESTADO.md`.
- [ ] Commit e deploy quando aprovado.

## Decisões registradas

- **2026-09-06 — Inclusão de Tecnologia e Software Livre no Portal**: Decidido incorporar uma rota dedicada de formação cidadã em tecnologia e IA (`/tecnologia`), integrando o acervo do AppLivre e da Floresta de Apps (`sementeiraprojetos.com.br`) como réplicas educacionais de acesso livre.
- **2026-09-06 — Cidades Geral em `/cidades`**: A home do eixo de municípios foi desatrelada de Betim e apontada para a visão integrada das 199 cidades polo e capitais do país.

## Origem

Documento criado a partir da solicitação direta do dono em 06/09/2026 para consolidar os marcos de reformulação, as correções editoriais e o plano de educação em software livre.
