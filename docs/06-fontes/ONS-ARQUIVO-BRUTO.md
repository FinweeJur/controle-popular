# Arquivo bruto do ONS no Drive

> **Tipo:** FONTE
> **Domínio:** energia (ONS Dados Abertos)
> **Última medição:** 2026-11-18
> **Leitura estimada:** curta (2–4 min)
> **Relacionados:** [ONS-DADOS-ABERTOS.md](ONS-DADOS-ABERTOS.md), [ENERGIA-CONTRATOS.md](ENERGIA-CONTRATOS.md), [COLETA-ETICA.md](COLETA-ETICA.md)
> **Palavras-chave:** ons, parquet, drive, arquivo bruto, manifesto, sha256, energia

## Sumário

- [Por que existe](#por-que-existe)
- [O que é guardado](#o-que-é-guardado)
- [Onde](#onde)
- [Como rodar](#como-rodar)
- [Limites](#limites)
- [Rotina sugerida](#rotina-sugerida)

## Por que existe

O portal publica **agregados**; o bruto é a prova. Guardar o arquivo original
permite reconstruir a série, conferir um número e auditar o coletor anos depois.
Sem isso, o agregado vira fé.

## O que é guardado

**Parquet**, não CSV nem XLSX. O mesmo dado existe em três formatos no CKAN:
CSV (75 GB), XLSX (29 GB) e Parquet (**3,3 GB**). O Parquet é colunar,
comprimido e abre com `pyarrow`/`pandas` sem conversão.

- Histórico completo: ~4.900 arquivos, ~3,3 GB.
- Ano corrente: ~1.800 arquivos, ~595 MB.
- Dicionários em PDF ficam fora (não são dado).

## Onde

```
G:\Meu Drive\controle-popular\dados\ons\<conjunto>\<arquivo>.parquet
G:\Meu Drive\controle-popular\dados\ons\<conjunto>\_manifest.json
G:\Meu Drive\controle-popular\dados\ons\_resumo.json
```

O `_manifest.json` de cada conjunto guarda **URL de origem, bytes, SHA-256 e
data do download** por arquivo. É o que permite provar que o bruto é o que o
ONS publicou.

## Como rodar

```bash
python scripts/arquivar-ons.py --ano 2026        # só o ano corrente
python scripts/arquivar-ons.py --tudo            # histórico completo
python scripts/arquivar-ons.py --dataset carga-energia --seco
python scripts/arquivar-ons.py --formato csv --tudo   # exceção
```

- Retomada: arquivo com o mesmo tamanho é pulado; `.part` continua de onde parou.
- Ritmo: 4 downloads simultâneos, 0,2 s entre arquivos, 1 s entre conjuntos.
- User-Agent honesto: `finweejur/github artur colito` (regra de coleta).
- O bruto **nunca** entra no repositório: `.gitignore` bloqueia CSV/XLSX/Parquet
  em `apps/web/data/ons/`.

## Limites

- O Drive é cópia de trabalho, não backup: o manifesto é a garantia de
  integridade, não o provedor.
- Conjunto mensal do mês corrente chega parcial; não trate como fechado.
- Recurso removido do CKAN não é apagado do arquivo (histórico preservado).
- A licença é a do ONS (dado aberto, com atribuição); o arquivo mantém a URL de
  origem para citar.

## Rotina sugerida

1. Diária: `--ano <atual>` (só o que muda).
2. Mensal: conferir `_resumo.json` e refazer o agregado publicado.
3. Anual: `--tudo` para capturar correções retroativas do ONS.
