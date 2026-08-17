# Créditos de mídia — fotos e fontes de ícones

Este documento registra a procedência, a licença e as decisões de uso de todo
conteúdo de mídia (fotografia e fonte tipográfica) incorporado ao portal. A
regra do projeto: nada de mídia sem fonte declarada — o mesmo padrão de
`FONTES.md` para dados.

## Fotografias — acervo Brasil com S (Lab 678)

- **Origem:** https://www.brasilcoms.com.br (produtos `brasilcoms-000XX`,
  páginas Wix com `contentUrl` em `static.wixstatic.com/media/<hash>~mv2.jpg`).
- **Projeto:** Brasil com S, de GUNZ COMUNICAÇÃO / Lab 678 (CNPJ
  22.061.059/0001-22, contato@brasilcoms.com.br).
- **Termos medidos em 16/08/2026:** uso editorial e gratuito, sem fim
  comercial, promocional ou político; sem edição (recorte de objetos ou
  pessoas); crédito à fonte em toda reprodução.
- **Tratamento aplicado:** download via transform do próprio Wix
  (`w_1600,q_75`) e conversão para webp q72 (1.598 KB o conjunto, em
  `apps/web/public/brasilcoms/`). **Nenhum corte** — as fotos são exibidas no
  quadro inteiro, em proporção nativa (`width`/`height` reais no markup, sem
  `object-fit: cover`).
- **Crédito:** legenda visível em toda reprodução
  (`FotoBrasilComS.tsx`): "Foto: Brasil com S — Lab 678", com link para a
  página do produto no acervo. Leitor de tela não repete o crédito (está no
  `figcaption`, não no `alt`).
- **Onde estão:** foto de abertura (cartão emoldurado) na home de cada zona —
  cidade 00039 (pedra portuguesa), ambiental 00036 (costela de adão),
  congresso 00031 (janela de vidro), judiciário 00033 (muro de tijolos),
  Paraopeba 00085 (laje ao sol) — e faixas decorativas `CenasDoBrasil`:
  cidade 00253/00254/00293/00325, ambiental 00483/00500/00503/00517,
  congresso 00089/00433/00308/00304, judiciário 00414/00416/00417,
  Paraopeba 00397/00410.
- **Decisões registradas:**
  - "Fundo de página" pedido pelo dono virou cartão emoldurado: foto como
    fundo de texto furaria o contraste dos três temas; em cartão, nenhum
    número fica por cima dela.
  - **00296 fora** das faixas: a página do produto não publica descrição, e
    `alt` honesto é requisito (ver TODO item 15).
  - As faixas dizem em voz alta que são ilustração e que os dados da página
    não dependem delas.

## Fontes de ícones

### Brasil Icons — Woodcutter Manero (2020)

- **Licença:** donationware "100% FREE" (dafont), uso pessoal e comercial
  livre; doação opcional (PayPal) e licenças comerciais via
  odiadme@hotmail.com; crédito ©Woodcutter Manero. **OK para o portal.**
- **Arquivo:** `apps/web/app/fonts/BrasilIcons.woff2` (139 KB), convertido do
  OTF instalado (558 KB) com wawoff2 — na verdade TTF (magic `00 01 00 00`),
  carregado via `next/font/local` em `app/fonts-icones.ts`.
- **Conteúdo:** 236 glifos nos caracteres A-Z/a-z + PUA U+F001/F002, sem nome
  descritivo. Ícones pedidos pelo dono: tucano, cacto, arara, café em grãos,
  maracá, árvore, mapa do Brasil com bandeira, havaianas, mapa da América
  Latina, cruz, capoeirista.

### Icones do Brasil — Marcos Ferreira Maranzana (2009)

- **Licença: NÃO VERIFICADA — decisão do dono pendente antes de usar em
  produção.** fonttoolbox marca "Unknown" (não casou com arquivo de licença;
  único metadado é o gerador Fontographer 4.7) e fonts2u marca "Personal use"
  (veda uso comercial/público). O arquivo está no repositório e no plano,
  mas o primeiro uso público exige autorização do autor ou troca de fonte.
- **Arquivo:** `apps/web/app/fonts/IconesDoBrasil.woff2` (48 KB), convertido
  do TTF instalado (170 KB, `ICONB_.TTF`) com wawoff2.
- **Conteúdo:** 56 glifos nos caracteres A-Z/a-z, sem nome descritivo. Ícones
  pedidos pelo dono: tartaruga, papagaio, banana, capoeira, violão, palmeira,
  onça, pandeiro, santa, mico, pão de açúcar, indígena, saci.

### Mapa letra→ícone (22/24 preenchidos via Character Map, 16/08/2026)

> Decisão do dono em 17/08/2026: cruz e mapa da América Latina ficam de fora —
> usar só os ícones já mapeados. 22 ícones em uso.

| Fonte | Ícone | Letra |
|---|---|---|
| Brasil Icons | tucano | D |
| Brasil Icons | cacto | u |
| Brasil Icons | arara | y |
| Brasil Icons | café em grãos | U |
| Brasil Icons | maracá | l |
| Brasil Icons | árvore | k |
| Brasil Icons | mapa do Brasil com bandeira | h |
| Brasil Icons | havaianas | j |
| Brasil Icons | capoeirista | H |
| Brasil Icons | ~~cruz~~ | _saiu — decisão do dono em 17/08: usar só os mapeados_ |
| Brasil Icons | ~~mapa da América Latina~~ | _saiu — decisão do dono em 17/08: usar só os mapeados_ |
| Icones do Brasil | tartaruga | n |
| Icones do Brasil | papagaio | a |
| Icones do Brasil | banana | b |
| Icones do Brasil | capoeira | e |
| Icones do Brasil | violão | g |
| Icones do Brasil | palmeira | h |
| Icones do Brasil | onça | s |
| Icones do Brasil | pandeiro | t |
| Icones do Brasil | santa | r |
| Icones do Brasil | mico | Q |
| Icones do Brasil | pão de açúcar | U |
| Icones do Brasil | indígena | M |
| Icones do Brasil | saci | X |

## Origem dos arquivos

- `apps/web/public/brasilcoms/*.webp` — 23 fotos do acervo Brasil com S.
- `apps/web/app/fonts/BrasilIcons.woff2` — instalado em
  `%LOCALAPPDATA%\Microsoft\Windows\Fonts\Brasil Icons.otf` (Woodcutter).
- `apps/web/app/fonts/IconesDoBrasil.woff2` — instalado em
  `%LOCALAPPDATA%\Microsoft\Windows\Fonts\ICONB_.TTF` (Maranzana).