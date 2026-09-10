"use client";

import { useState, useMemo } from "react";
import {
  Cpu,
  Terminal,
  ShieldCheck,
  Layers,
  ExternalLink,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  FolderGit2,
} from "lucide-react";

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export interface ProjetoLivre {
  id: string;
  nome: string;
  subtitulo: string;
  categoria: "civico" | "ia" | "gestao" | "cultura" | "utilitarios";
  descricaoLeigo: string;
  descricaoTecnica: string;
  funcionalidades: string[];
  tags: string[];
  status: "No ar" | "Código aberto" | "Em desenvolvimento";
  linkGithub?: string;
  linkApp?: string;
}

const PROJETOS: ProjetoLivre[] = [
  {
    id: "controle-popular",
    nome: "Controle Popular",
    subtitulo: "Portal Monorepo de Transparência e Fiscalização Cívica",
    categoria: "civico",
    descricaoLeigo:
      "Junta o dinheiro público de cidades, Congresso, Judiciário e meio ambiente numa tela só, com cada número provado por documento oficial.",
    descricaoTecnica:
      "Monorepo Next.js 16 com SSG para Cloudflare Workers, PostgreSQL/Drizzle ORM, auditoria estrita sem CPF e compressão em múltiplos níveis.",
    funcionalidades: [
      "Cruzamento municipal de contratos, emendas e orçamentos",
      "Régua de ampliação/restrição de direitos em leis federais",
      "Globo 3D com terras públicas e sobreposição com minerárias",
      "Auditoria do Acordo de Reparação de Brumadinho documento a documento",
    ],
    tags: ["Next.js", "TypeScript", "Drizzle", "Dados Abertos", "LGPD"],
    status: "No ar",
    linkGithub: "https://github.com/melkepinho/controle-popular",
    linkApp: "https://controlepopular.com.br",
  },
  {
    id: "llm-br",
    nome: "llm-br",
    subtitulo: "Camada Python Padronizada de IA Local-First",
    categoria: "ia",
    descricaoLeigo:
      "Uma biblioteca que permite usar inteligência artificial no computador sem depender de nuvens pagas e sem risco de vazamento de dados.",
    descricaoTecnica:
      "Biblioteca Python com suporte a Ollama local por padrão, DeepSeek, Maritaca (Sabiá) e Claude. Extração com esquema estrito e 52 testes offline.",
    funcionalidades: [
      "JSON com decodificação restrita e validação de schema",
      "Provedor e modelo registrados em cada resultado gerado",
      "Streaming e embeddings locais com fallbacks auditáveis",
      "52 testes unitários sem dependência de conexão externa",
    ],
    tags: ["Python", "Ollama", "Sabiá-3", "Local-first", "RAG"],
    status: "Código aberto",
    linkGithub: "https://github.com/FinweeJur/llm-br",
  },
  {
    id: "applivre",
    nome: "AppLivre",
    subtitulo: "Diretório de Ferramentas Gratuitas e de Código Aberto",
    categoria: "utilitarios",
    descricaoLeigo:
      "Um catálogo completo em português com mais de 300 ferramentas gratuitas que substituem programas caros e pagos.",
    descricaoTecnica:
      "Aplicação web ultrarrápida hospedada no Cloudflare Pages com categorização tripla, filtros por licença livre e curadoria em português.",
    funcionalidades: [
      "Mais de 300 ferramentas organizadas por área de atuação",
      "Explicação em 3 níveis: leigo, curioso e técnico",
      "Filtros: sem cadastro, 100% offline e open source",
      "Kits de produtividade e segurança digital para ativistas",
    ],
    tags: ["Open Source", "Catálogo", "Cloudflare Pages", "Educação"],
    status: "No ar",
    linkApp: "https://applivre.pages.dev",
  },
  {
    id: "sementeira",
    nome: "Sementeira",
    subtitulo: "Da Ideia ao Projeto de Reparação Socioambiental",
    categoria: "civico",
    descricaoLeigo:
      "Ajuda pessoas atingidas por barragens a montar projetos comunitários para acessar os recursos do Acordo Judicial sem intermediários.",
    descricaoTecnica:
      "Engine determinística de conformidade com os Ofícios 45/46 da reparação do Paraopeba, importação de planilhas e simulação de custos.",
    funcionalidades: [
      "Importação de planilhas (.xlsx) e projetos (.docx)",
      "Catálogo de preços públicos e cotação de maquinários",
      "Motor determinístico de conformidade regulatória",
      "Simulador de sustentabilidade econômica comunitária",
    ],
    tags: ["Reparação", "Paraopeba", "Offline-first", "Comunitário"],
    status: "No ar",
    linkApp: "https://sementeiraprojetos.com.br/paraopeba/",
  },
  {
    id: "foz-juris",
    nome: "Foz Juris",
    subtitulo: "Gestão Jurídica Local-First com Criptografia",
    categoria: "gestao",
    descricaoLeigo:
      "Sistema para advogados e defensores populares onde os dados ficam guardados no computador do próprio usuário, e não na nuvem de terceiros.",
    descricaoTecnica:
      "Arquitetura local-first com protocolos sequenciais, anexos criptografados em AES-256 e chat de IA com anonimização automática de partes.",
    funcionalidades: [
      "Protocolos imutáveis com 2FA e trilha de auditoria",
      "Anexos com criptografia ponta a ponta AES-256",
      "IA com pseudonimização de nomes e CPFs antes de processar",
      "Sem mensalidades obrigatórias, sem dependência de nuvem",
    ],
    tags: ["Desktop", "Criptografia", "LGPD", "Local-first"],
    status: "No ar",
    linkApp: "https://fozjuris.com.br",
  },
  {
    id: "vaire",
    nome: "Vaire",
    subtitulo: "Pipeline de 5 Agentes de IA com Gate Humano",
    categoria: "ia",
    descricaoLeigo:
      "Acompanha processos judiciais de grandes tragédias, coletando despachos e redigindo resumos — mas nunca publica nada sem aprovação de um humano.",
    descricaoTecnica:
      "Orquestrador de agentes de IA para ações coletivas (ACP/ADPF) conectado ao DataJud/CNJ, com barreira obrigatória de revisão humana.",
    funcionalidades: [
      "Rastreamento de movimentações nos tribunais via DataJud",
      "Gate humano inegociável: o modelo sugere, a pessoa aprova",
      "Filtro ativo de dados pessoais antes de gravar em disco",
    ],
    tags: ["Agentes de IA", "DataJud", "Gate Humano", "Coletivas"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
  {
    id: "despacho",
    nome: "Despacho",
    subtitulo: "Escritório de Advocacia 100% Offline com Cadeia SHA-256",
    categoria: "gestao",
    descricaoLeigo:
      "Programa que roda até sem internet. Se alguém tentar alterar o histórico de uma decisão por fora, o sistema avisa na hora que foi fraudado.",
    descricaoTecnica:
      "App desktop nativo em Qt sem navegador embutido. Histórico em cadeia de hashes SHA-256 (estilo SEI) e anexos cifrados com Fernet/AES.",
    funcionalidades: [
      "Histórico encadeado imutável em SHA-256",
      "Anexos protegidos por papel e nível de sigilo",
      "Chat de IA local para indexação e busca de precedentes",
    ],
    tags: ["Qt", "C++", "SHA-256", "Offline"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
  {
    id: "openosc",
    nome: "OpenOSC Harness",
    subtitulo: "Conformidade MROSC e Coleta de Campo para Coletivos",
    categoria: "gestao",
    descricaoLeigo:
      "Plataforma para associações e movimentos sociais prestarem contas de verbas públicas sem medo de erros burocráticos.",
    descricaoTecnica:
      "Conformidade preventiva MROSC (Lei 13.019/2014), integração com formulários Kobo offline com GPS e OCR automatizado de notas fiscais.",
    funcionalidades: [
      "Prevenção ativa de glosas e alertas de CNDs vencidas",
      "Coleta de campo no celular sem sinal de internet com GPS",
      "Quadros Kanban com robôs de automação de prazos",
      "OCR e conciliação bancária de comprovantes",
    ],
    tags: ["MROSC", "Terceiro Setor", "KoboToolbox", "OCR"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
  {
    id: "cutia",
    nome: "Cutia & Cutiazinha (PicoClaw)",
    subtitulo: "Workspace de IA Local & OCR Ágil de Documentos",
    categoria: "ia",
    descricaoLeigo:
      "Tira fotos de processos e papéis e os transforma em textos pesquisáveis na hora, sem mandar as fotos para servidores no exterior.",
    descricaoTecnica:
      "Ambiente de automação com modelos locais Ollama/vLLM integrado ao motor PicoClaw para OCR e leitura de notas fiscais em lote.",
    funcionalidades: [
      "Leitura de documentos físicos e notas fiscais com OCR local",
      "Chat e agentes com modelos abertos rodando no PC",
      "Pesquisa profunda e comparação paralela de respostas",
      "100% autohospedado com privacidade por padrão",
    ],
    tags: ["OCR", "Ollama", "Visão Computacional", "Self-hosted"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
  {
    id: "osint-br",
    nome: "OSINT BR",
    subtitulo: "Investigação Cívica com Dados Públicos em Linha de Comando",
    categoria: "utilitarios",
    descricaoLeigo:
      "Uma ferramenta que consulta 31 cadastros públicos de uma só vez para checar donos de empresas, contratos e propriedades rurais.",
    descricaoTecnica:
      "Orquestrador CLI de 31 coletores OSINT em código aberto e APIs governamentais gratuitas, com geração de grafos e relatórios auditáveis.",
    funcionalidades: [
      "31 coletores integrados (CNPJ, Diários Oficiais, GPS, voos)",
      "Filtro ético: bloqueia raspagens que violem termos de uso",
      "Exportação de laudos de auditoria com data e fonte oficial",
    ],
    tags: ["OSINT", "CLI", "Investigação", "Transparência"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
  {
    id: "agitprop",
    nome: "Agitprop",
    subtitulo: "Planejador Territorial de Ações de Rua e Panfletagem",
    categoria: "cultura",
    descricaoLeigo:
      "Mapa offline para movimentos sociais organizarem mutirões de rua, panfletagem e diálogo nos bairros de forma segura.",
    descricaoTecnica:
      "App de mapa vetorial offline com cálculo de rotas a pé, densidade demográfica, dados eleitorais e cifragem de informações de equipes.",
    funcionalidades: [
      "Rotas otimizadas a pé para mobilização popular",
      "Índice de prioridade de atuação por bairro e comunidade",
      "Dados de segurança cifrados sem armazenamento na nuvem",
    ],
    tags: ["Georreferenciamento", "Mapas", "Offline", "Cultura Popular"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
  {
    id: "coletanea-artivismo",
    nome: "Coletânea Artivismo",
    subtitulo: "Catálogo Histórico de Cartazes e Expressão Popular",
    categoria: "cultura",
    descricaoLeigo:
      "Acervo de cartazes e artes de protesto e movimentos sociais de todo o mundo, para inspirar a luta contemporânea.",
    descricaoTecnica:
      "Galeria offline pesquisável gerada estaticamente a partir de raspagens do Internet Archive e acervos históricos públicos com dedup por hash.",
    funcionalidades: [
      "Galeria pesquisável por tema, país e década",
      "Funciona 100% offline em qualquer navegador",
      "Deduplicação de imagens por hash perceptivo",
    ],
    tags: ["Arte Popular", "Memória", "Acervo", "História"],
    status: "Em desenvolvimento",
    linkApp: "https://sementeiraprojetos.com.br",
  },
];

const CATEGORIAS = [
  { id: "todas", label: "Todos os Projetos" },
  { id: "civico", label: "Justiça & Transparência" },
  { id: "ia", label: "Inteligência Artificial" },
  { id: "gestao", label: "Gestão & Terceiro Setor" },
  { id: "cultura", label: "Cultura & Território" },
  { id: "utilitarios", label: "Utilitários & Ferramentas" },
];

export default function TecnologiaClient() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("todas");
  const [busca, setBusca] = useState("");
  const [abaAberta, setAbaAberta] = useState<string | null>(null);

  const projetosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return PROJETOS.filter((p) => {
      const casaCategoria = categoriaAtiva === "todas" || p.categoria === categoriaAtiva;
      const casaBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.subtitulo.toLowerCase().includes(termo) ||
        p.descricaoLeigo.toLowerCase().includes(termo) ||
        p.tags.some((t) => t.toLowerCase().includes(termo));
      return casaCategoria && casaBusca;
    });
  }, [categoriaAtiva, busca]);

  return (
    <div className="space-y-12">
      {/* ═══ KIT GUIAS DO APPLIVRE (applivre.pages.dev) ═══ */}
      <section aria-labelledby="kit-guias-titulo" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Terminal size={14} aria-hidden="true" />
              <span>Parceria Cívica & Educação Popular</span>
            </div>
            <h2 id="kit-guias-titulo" className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Kit Guias do AppLivre
            </h2>
            <p className="text-sm text-muted max-w-2xl leading-relaxed">
              Guias didáticos da Floresta de Apps e do portal parceiro <strong className="text-foreground">applivre.pages.dev</strong>. 
              Três usos simples da vida real para movimentos sociais, lideranças comunitárias e cidadãos, com 3 passos a passo de Inteligência Artificial para cada um.
            </p>
          </div>

          <a
            href="https://applivre.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-[1.02]"
          >
            <span>Explorar applivre.pages.dev</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* USO SIMPLES 1 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Uso Simples 1</span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                Fiscalização de Contratos e Compras Públicas
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Como checar o que a prefeitura compra e identificar suspeitas de superfaturamento em obras e serviços sem precisar ser auditor.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</span>
                  <h4 className="text-xs font-bold text-foreground">IA 1: Leitura de Diários Escaneados (OCR)</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Baixe o PDF do Diário Oficial. Use OCR aberto no PC (Tesseract ou Cutiazinha) para transformar páginas em foto em texto pesquisável. Procure por termos como &ldquo;dispensa&rdquo;, &ldquo;inexigibilidade&rdquo; e &ldquo;aditivo&rdquo;.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</span>
                  <h4 className="text-xs font-bold text-foreground">IA 2: Comparação Automática de Preços</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Cole a lista de itens da licitação no modelo com o prompt: <em>&ldquo;Cruze os valores unitários com a média de mercado do PNCP e aponte itens com variação acima de 25% com a fonte.&rdquo;</em>
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</span>
                  <h4 className="text-xs font-bold text-foreground">IA 3: Microresumo de Aditivo com Seu Nonô</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Abra o assistente Seu Nonô e pergunte: <em>&ldquo;O que aumentou neste aditivo de obra e qual foi o motivo alegado pela prefeitura?&rdquo;</em> Receba a síntese em 2 parágrafos simples para ler no bairro.
                </p>
              </div>
            </div>
          </div>

          {/* USO SIMPLES 2 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Uso Simples 2</span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                Defesa Comunitária e Denúncia Ambiental
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Como comunidades atingidas por barragens, poeira mineral ou despejos podem produzir provas e acionar órgãos de controle.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">1</span>
                  <h4 className="text-xs font-bold text-foreground">IA 1: Transcrição de Audiências (Whisper)</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Grave os depoimentos da assembleia em áudio. Execute o modelo Whisper localmente pelo terminal ou app livre. Gere ata transcrita palavra por palavra com privacidade total para as famílias.
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">2</span>
                  <h4 className="text-xs font-bold text-foreground">IA 2: Minuta de LAI e Notícia de Fato ao MP</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Relate o dano ao modelo de IA pedindo: <em>&ldquo;Redija uma notícia de fato ao MPMG fundamentando na Lei 6.938/81 e na Resolução CONAMA, com espaço para anexar fotos e testemunhos.&rdquo;</em>
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">3</span>
                  <h4 className="text-xs font-bold text-foreground">IA 3: Checagem de Licenças de Barragens</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> No painel de Barragens do portal, pegue o código SIGBM da estrutura. Peça à IA para comparar a data de descaracterização declarada pela mineradora com os prazos legais da Lei Mar de Lama Nunca Mais.
                </p>
              </div>
            </div>
          </div>

          {/* USO SIMPLES 3 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Uso Simples 3</span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                Comunicação e Mobilização Popular
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Como sindicatos, associações e estudantes transformam leis difíceis em materiais didáticos de rua que qualquer pessoa entende.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                  <h4 className="text-xs font-bold text-foreground">IA 1: Tradução de Projetos de Lei em Panfletos</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Cole a ementa de um projeto do Congresso ou da Câmara no modelo: <em>&ldquo;Explique em 3 tópicos curtos: O que muda na prática, quem ganha e quem perde com este projeto para um panfleto impresso.&rdquo;</em>
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
                  <h4 className="text-xs font-bold text-foreground">IA 2: Roteiro de Vídeo Curto (Reels / Status)</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Solicite: <em>&ldquo;Crie um roteiro de 60 segundos com fala natural em primeira pessoa: gancho inicial de 3 segundos, 3 números comprovados e chamada para a audiência pública do bairro.&rdquo;</em>
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-surface-2/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
                  <h4 className="text-xs font-bold text-foreground">IA 3: Assistente Offline Comunitário</h4>
                </div>
                <p className="text-xs text-muted leading-normal">
                  <strong>Passo a passo:</strong> Configure um computador na sede comunitária usando Ollama + modelo Sabiá 7B ou Qwen. Carregue o estatuto do bairro e leis municipais para criar um tira-dúvidas que roda mesmo sem internet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATÁLOGO INTEGRADO DE PROJETOS (APPLIVRE & FLORESTA DE APPS) ═══ */}
      <section aria-labelledby="catalogo-titulo" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <Sparkles size={14} className="text-primary" />
              <span>Floresta de Ferramentas com Propósito</span>
            </div>
            <h2 id="catalogo-titulo" className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
              Catálogo de Software Livre & Projetos Cívicos
            </h2>
            <p className="mt-1 text-sm text-muted">
              Inspirado no acervo <strong>AppLivre</strong> e na <strong>Floresta de Apps da Sementeira</strong>.
            </p>
          </div>

          {/* Busca Rápida */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="search"
              placeholder="Buscar por nome, IA, tag..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Abas de Categorias */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                categoriaAtiva === cat.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grade de Cartões */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projetosFiltrados.map((p) => (
            <article
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      p.status === "No ar"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : p.status === "Código aberto"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    ● {p.status}
                  </span>
                  <span className="text-xs font-mono text-muted uppercase tracking-wider">
                    {p.categoria}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-foreground">{p.nome}</h3>
                <p className="text-xs font-medium text-primary">{p.subtitulo}</p>

                <p className="mt-2.5 text-xs sm:text-sm text-muted leading-relaxed">
                  {p.descricaoLeigo}
                </p>

                {/* Detalhes Técnicos Expansíveis */}
                <details className="mt-3 text-xs text-muted">
                  <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
                    Ver detalhes técnicos e arquitetura
                  </summary>
                  <p className="mt-2 rounded-lg bg-surface-2 p-2.5 leading-relaxed">
                    {p.descricaoTecnica}
                  </p>
                  <ul className="mt-2 space-y-1 pl-1">
                    {p.funcionalidades.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </details>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-border/60 bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ações / Links */}
              <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4">
                {p.linkApp && (
                  <a
                    href={p.linkApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <span>Abrir Projeto</span>
                    <ExternalLink size={13} />
                  </a>
                )}
                {p.linkGithub && (
                  <a
                    href={p.linkGithub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface hover:text-primary"
                    title="Ver repositório no GitHub"
                  >
                    <GithubIcon size={13} />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
