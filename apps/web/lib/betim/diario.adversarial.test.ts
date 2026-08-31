import { describe, expect, test } from "vitest";
import {
  fetchAtosDiario,
  fetchResumoDiario,
  fetchSerieDiarioPorAno,
  type LinhaAtoDiario,
} from "./diario";
import { generateStaticParams, GET } from "@/app/[municipio]/prefeitura/diario/dados/[arquivo]/route";
import { arquivosDoIndice, arquivosDeIndiceVazio, NOME_MANIFESTO } from "@/lib/estatico/emitir";
import { fatiar, type ManifestoFatias } from "@/lib/estatico/fatiar";
import { semAcento } from "@/lib/busca/normalizar";
import { formatDateBR } from "./format";
import { ROTULOS_TIPO, TIPOS_ATO, type TipoAto } from "@/lib/diario/classificarAto";

const CIDADES_ALVO = [
  { slug: "diamantina", id: "3121605", nome: "Diamantina" },
  { slug: "betim", id: "3106705", nome: "Betim" },
  { slug: "bh", id: "3106200", nome: "Belo Horizonte" },
  { slug: "aracuai", id: "3103405", nome: "Araçuaí" },
  { slug: "itinga", id: "3134004", nome: "Itinga" },
  { slug: "sp", id: "3550308", nome: "São Paulo" },
];

describe("ADVERSARIAL STRESS SUITE — Milestones M2, M3, M4 (Diário Oficial)", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. STATIC SLICES & ROUTE BOUNDARY CONDITIONS (M2)
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Static Slices & Route Boundary Conditions", () => {
    test("generateStaticParams returns routes for all target cities with manifesto.json and slice files", async () => {
      const params = await generateStaticParams();
      expect(params.length).toBeGreaterThan(0);

      for (const cidade of CIDADES_ALVO) {
        const paramsCidade = params.filter((p) => p.municipio === cidade.slug);
        expect(
          paramsCidade.length,
          `Cidade ${cidade.slug} deve ter parâmetros gerados`
        ).toBeGreaterThanOrEqual(1);

        const temManifesto = paramsCidade.some((p) => p.arquivo === "manifesto.json");
        expect(temManifesto, `Cidade ${cidade.slug} deve ter manifesto.json`).toBe(true);
      }
    });

    test("GET route returns 200 with application/json charset=utf-8 for manifesto.json across all cities", async () => {
      for (const cidade of CIDADES_ALVO) {
        const req = new Request(`https://controlepopular.com.br/${cidade.slug}/prefeitura/diario/dados/manifesto.json`);
        const res = await GET(req, {
          params: Promise.resolve({ municipio: cidade.slug, arquivo: "manifesto.json" }),
        });

        expect(res.status, `Status para ${cidade.slug}/manifesto.json`).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
        expect(res.headers.get("content-type")).toContain("charset=utf-8");

        const json = (await res.json()) as ManifestoFatias;
        expect(json.total).toBeGreaterThanOrEqual(0);
        expect(json.fatias).toBe(json.linhasPorFatia.length);
        expect(json.fatias).toBe(json.bytesPorFatia.length);

        const somaLinhas = json.linhasPorFatia.reduce((a, b) => a + b, 0);
        expect(somaLinhas).toBe(json.total);
      }
    });

    test("GET route returns 200 for 0.json when fatias > 0", async () => {
      for (const cidade of CIDADES_ALVO) {
        const reqManifesto = new Request(`https://controlepopular.com.br/${cidade.slug}/prefeitura/diario/dados/manifesto.json`);
        const resManifesto = await GET(reqManifesto, {
          params: Promise.resolve({ municipio: cidade.slug, arquivo: "manifesto.json" }),
        });
        const manifesto = (await resManifesto.json()) as ManifestoFatias;

        if (manifesto.fatias > 0) {
          const req0 = new Request(`https://controlepopular.com.br/${cidade.slug}/prefeitura/diario/dados/0.json`);
          const res0 = await GET(req0, {
            params: Promise.resolve({ municipio: cidade.slug, arquivo: "0.json" }),
          });

          expect(res0.status).toBe(200);
          const fatias0 = (await res0.json()) as LinhaAtoDiario[];
          expect(Array.isArray(fatias0)).toBe(true);
          expect(fatias0.length).toBe(manifesto.linhasPorFatia[0]);

          // Valida contrato estrutural de LinhaAtoDiario
          for (const item of fatias0) {
            expect(typeof item.id).toBe("string");
            expect(item.id.length).toBeGreaterThan(0);
            expect(item.data_publicacao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(TIPOS_ATO).toContain(item.tipo);
            expect(typeof item.link_fonte).toBe("string");
          }
        }
      }
    });

    test("GET route returns 404 for nonexistent files, path traversal and malicious filenames", async () => {
      const invalidFiles = [
        "inexistente.json",
        "999.json",
        "-1.json",
        "manifesto.json.bak",
        "../secrets.json",
        "../../package.json",
        "0.json/evil",
        "manifesto",
        "",
      ];

      for (const arquivo of invalidFiles) {
        const req = new Request(`https://controlepopular.com.br/diamantina/prefeitura/diario/dados/${arquivo}`);
        const res = await GET(req, {
          params: Promise.resolve({ municipio: "diamantina", arquivo }),
        });
        expect(res.status, `Arquivo inválido "${arquivo}" deve retornar 404`).toBe(404);
        const text = await res.text();
        expect(text).toBe("não encontrado");
      }
    });

    test("GET route returns valid empty manifest (not 404) for unknown city slug", async () => {
      const req = new Request("https://controlepopular.com.br/cidade-fantasma/prefeitura/diario/dados/manifesto.json");
      const res = await GET(req, {
        params: Promise.resolve({ municipio: "cidade-fantasma", arquivo: "manifesto.json" }),
      });

      expect(res.status).toBe(200);
      const manifesto = (await res.json()) as ManifestoFatias;
      expect(manifesto.total).toBe(0);
      expect(manifesto.fatias).toBe(0);
      expect(manifesto.linhasPorFatia).toEqual([]);
    });

    test("Slice byte budget enforcement (2 MiB default) never overflows Cloudflare limits", async () => {
      for (const cidade of CIDADES_ALVO) {
        const atos = await fetchAtosDiario(cidade.slug);
        const fatiado = fatiar(atos);

        expect(fatiado.manifesto.orcamentoBytes).toBe(2 * 1024 * 1024);
        for (let i = 0; i < fatiado.fatias.length; i++) {
          const fatiaBytes = Buffer.byteLength(JSON.stringify(fatiado.fatias[i]), "utf8");
          // Deve respeitar o orçamento de 2 MiB (com margem de segurança para teto de 25 MiB)
          expect(fatiaBytes).toBeLessThanOrEqual(2 * 1024 * 1024 + 1024);
          expect(fatiaBytes).toBeLessThan(25 * 1024 * 1024);
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SEARCH BEHAVIOR & NORMALIZATION (M3)
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Search Behavior, Diacritics & Normalization", () => {
    test("semAcento normalizes complex Portuguese diacritics and casing", () => {
      expect(semAcento("Licitação")).toBe("licitacao");
      expect(semAcento("PREGÃO PRESENCIAL")).toBe("pregao presencial");
      expect(semAcento("CONVÊNIO & PARCERIA")).toBe("convenio & parceria");
      expect(semAcento("Araçuaí")).toBe("aracuai");
      expect(semAcento("Órgão Oficial")).toBe("orgao oficial");
      expect(semAcento("Ações Judiciais")).toBe("acoes judiciais");
      expect(semAcento("À Á Â Ã Ä Ç È É Ê Ë Ì Í Î Ï")).toBe("a a a a a c e e e e i i i i");
      expect(semAcento("Ò Ó Ô Õ Ö Ù Ú Û Ü Ý")).toBe("o o o o o u u u u y");
    });

    test("Search matches regardless of accentuation and casing across ementa, numero_ato and orgao", async () => {
      const atos = await fetchAtosDiario("diamantina");

      function buscar(termo: string, campos: (keyof LinhaAtoDiario)[]): LinhaAtoDiario[] {
        const t = semAcento(termo.trim());
        if (!t) return atos;
        return atos.filter((item) =>
          campos.some((campo) => {
            const val = item[campo];
            if (typeof val === "string") {
              return semAcento(val).includes(t);
            }
            return false;
          })
        );
      }

      // Busca por 'licitacao' deve achar 'Licitação' e 'LICITAÇÃO'
      const comAcento = buscar("licitação", ["ementa", "numero_ato", "orgao"]);
      const semAcentoRes = buscar("licitacao", ["ementa", "numero_ato", "orgao"]);
      const caps = buscar("LICITAÇÃO", ["ementa", "numero_ato", "orgao"]);

      expect(comAcento.length).toBe(semAcentoRes.length);
      expect(comAcento.length).toBe(caps.length);
      expect(comAcento.length).toBeGreaterThan(0);

      // Busca vazia retorna todos
      expect(buscar("", ["ementa"])).toEqual(atos);
      expect(buscar("   ", ["ementa"])).toEqual(atos);

      // Busca com caracteres especiais não deve quebrar nem lançar erro
      expect(() => buscar(".*+?^${}()|[]\\", ["ementa"])).not.toThrow();
      expect(buscar("!@#$%^&*()", ["ementa"])).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CSV EXPORT INTEGRITY & ESCAPING (M3)
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. CSV Export Data Structure & Escaping Rules", () => {
    function csvEscape(v: unknown): string {
      const s = v === null || v === undefined ? "" : String(v);
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }

    function gerarCsvLinhas(itens: readonly LinhaAtoDiario[]): string {
      const BOM = "\uFEFF";
      const cabecalho = [
        "Data",
        "Edição",
        "Tipo",
        "Número do Ato",
        "Órgão",
        "Ementa / Objeto",
        "Processo Ref",
        "Valor (R$)",
        "CNPJ",
        "Link Oficial",
      ].join(";");

      const corpo = itens.map((item) =>
        [
          formatDateBR(item.data_publicacao),
          item.edicao ?? "",
          ROTULOS_TIPO[item.tipo] ?? item.tipo,
          item.numero_ato ?? "",
          item.orgao ?? "",
          item.ementa ?? "",
          item.processo_ref ?? "",
          item.valor != null ? item.valor.toString().replace(".", ",") : "",
          item.cnpj_mascarado ?? "",
          item.link_fonte ?? "",
        ]
          .map(csvEscape)
          .join(";")
      );

      return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
    }

    test("CSV starts strictly with UTF-8 BOM (\\uFEFF)", async () => {
      const atos = await fetchAtosDiario("diamantina");
      const csv = gerarCsvLinhas(atos.slice(0, 5));

      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv.startsWith("\uFEFF")).toBe(true);
    });

    test("CSV uses semicolon ';' as delimiter in header and data rows", async () => {
      const atos = await fetchAtosDiario("diamantina");
      const csv = gerarCsvLinhas(atos.slice(0, 5));
      const linhas = csv.replace("\uFEFF", "").split("\r\n").filter(Boolean);

      const headerColunas = linhas[0].split(";");
      expect(headerColunas.length).toBe(10);
      expect(headerColunas[0]).toBe("Data");
      expect(headerColunas[1]).toBe("Edição");
      expect(headerColunas[2]).toBe("Tipo");
      expect(headerColunas[3]).toBe("Número do Ato");
      expect(headerColunas[4]).toBe("Órgão");
      expect(headerColunas[5]).toBe("Ementa / Objeto");
      expect(headerColunas[6]).toBe("Processo Ref");
      expect(headerColunas[7]).toBe("Valor (R$)");
      expect(headerColunas[8]).toBe("CNPJ");
      expect(headerColunas[9]).toBe("Link Oficial");

      for (let i = 1; i < linhas.length; i++) {
        expect(linhas[i].length).toBeGreaterThan(0);
      }
    });

    test("CSV escaping properly handles double quotes, semicolons, and multi-line ementas", () => {
      const atosAdversariais: LinhaAtoDiario[] = [
        {
          id: "test-1",
          data_publicacao: "2026-08-15",
          edicao: "100",
          pagina: "1",
          tipo: "contrato",
          numero_ato: '015/2026 "A"',
          orgao: "Secretaria de Saúde; Departamento de Compras",
          ementa: 'Contratação de empresa para fornecimento de "merenda escolar"; lote 1\nSegunda linha com detalhes\r\nTerceira linha.',
          link_fonte: "https://exemplo.com/diario",
          processo_ref: "Proc. 12/2026",
          valor: 1250000.5,
          cnpj_mascarado: "00.***.***/0001-91",
        },
      ];

      const csv = gerarCsvLinhas(atosAdversariais);
      expect(csv).toContain(';"015/2026 ""A""";');
      expect(csv).toContain('"Secretaria de Saúde; Departamento de Compras"');
      expect(csv).toContain('"Contratação de empresa para fornecimento de ""merenda escolar""; lote 1\nSegunda linha com detalhes\r\nTerceira linha."');
      expect(csv).toContain(";1250000,5;");
      expect(csv).toContain("15/08/2026;");
      expect(csv).not.toContain("null");
      expect(csv).not.toContain("undefined");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. CROSS-LINKING & 5-THINGS CONTRACT VERIFICATION (M3, M4)
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. 5-Things Rule & Cross-Linking Consistency", () => {
    test("fetchResumoDiario and fetchSerieDiarioPorAno are mathematically coherent across all target cities", async () => {
      for (const cidade of CIDADES_ALVO) {
        const [resumo, serie, atos] = await Promise.all([
          fetchResumoDiario(cidade.slug),
          fetchSerieDiarioPorAno(cidade.slug),
          fetchAtosDiario(cidade.slug),
        ]);

        expect(resumo.total).toBe(atos.length);

        const somaCategorias =
          resumo.totalEditais +
          resumo.totalContratos +
          resumo.totalConvenios +
          resumo.totalDecretos +
          resumo.totalPortarias +
          resumo.totalLeis +
          resumo.totalOutros;
        expect(somaCategorias).toBe(resumo.total);

        const somaSerie = serie.reduce((acc, s) => acc + s.total, 0);
        expect(somaSerie).toBe(resumo.total);
      }
    });

    test("All 7 canonical TipoAto have valid human-readable labels", () => {
      for (const tipo of TIPOS_ATO) {
        expect(ROTULOS_TIPO[tipo]).toBeDefined();
        expect(typeof ROTULOS_TIPO[tipo]).toBe("string");
        expect(ROTULOS_TIPO[tipo].length).toBeGreaterThan(0);
      }
    });
  });
});
