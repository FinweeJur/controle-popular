# Auditoria Visual e Responsividade Mobile (375x1200px)

> **Data de execução:** 28/09/2026  
> **Metodologia:** Captura automatizada via Chrome Headless com emulação de viewport mobile (375x1200px, DPR=2, mobile=true).  
> **Resultado Geral:** 20 de 20 rotas auditadas com **375px exatos** de largura de viewport (zero overflow horizontal).

---

## 📱 Galeria de Capturas Móveis

| ID | Rota | Arquivo | Largura Documento | Status |
|---|---|---|---|---|
| 01 | `/` | `01-home.png` | 375px | ✅ Conforme |
| 02 | `/indice` | `02-indice.png` | 375px | ✅ Conforme |
| 03 | `/central` | `03-central.png` | 375px | ✅ Conforme |
| 04 | `/direitos-em-movimento` | `04-direitos.png` | 375px | ✅ Conforme |
| 05 | `/terra-e-territorios` | `05-terra.png` | 375px | ✅ Conforme |
| 06 | `/estado-e-economia` | `06-estado.png` | 375px | ✅ Conforme |
| 07 | `/ambiental` | `07-ambiental.png` | 375px | ✅ Conforme |
| 08 | `/ambiental/car` | `08-car.png` | 375px | ✅ Conforme |
| 09 | `/ambiental/capacidade-institucional` | `09-capacidade.png` | 375px | ✅ Conforme |
| 10 | `/cidades` | `10-cidades.png` | 375px | ✅ Conforme |
| 11 | `/betim` | `11-betim.png` | 375px | ✅ Conforme |
| 12 | `/busca` | `12-busca.png` | 375px | ✅ Conforme |
| 13 | `/noticias` | `13-noticias.png` | 375px | ✅ Conforme |
| 14 | `/editais` | `14-editais.png` | 375px | ✅ Conforme |
| 15 | `/funcaosocialterra/mapa` | `15-mapa3d.png` | 375px | ✅ Conforme |
| 16 | `/laboratorio` | `16-laboratorio.png` | 375px | ✅ Conforme |
| 17 | `/empresas` | `17-empresas.png` | 375px | ✅ Conforme |
| 18 | `/assembleias` | `18-assembleias.png` | 375px | ✅ Conforme |
| 19 | `/assembleias/mg` | `19-assembleias-mg.png` | 375px | ✅ Conforme |
| 20 | `/congresso` | `20-congresso.png` | 375px | ✅ Conforme |

---

## 🛠️ Correções Realizadas na Auditoria

1. **TopNav (`apps/web/app/components/TopNav.tsx`):**
   - Ocultados botões de tamanho de fonte (`<FontSizeControl />`) em telas menores que 640px (`hidden sm:inline-flex`), eliminando 104px de estiramento do cabeçalho fixo.
2. **Cidades (`apps/web/app/cidades/TabelaCidadesClient.tsx`):**
   - Flex-wrap nos dropdowns de filtro e scroll horizontal no container da tabela mestre.
3. **Editais (`apps/web/app/editais/page.tsx` e `PainelEditais.tsx`):**
   - Inseridas classes `w-full max-w-full min-w-0` no wrapper da tabela e nos cartões de topo, reduzindo a largura da página de 1.137px para 375px exatos.
4. **Betim (`apps/web/app/[municipio]/page.tsx` e `layout.tsx`):**
   - Inserido `w-full max-w-full min-w-0 overflow-x-hidden` no `main` e padding responsivo `px-4 sm:px-6` no botão de busca da hero section.
