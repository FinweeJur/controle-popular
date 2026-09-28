#!/usr/bin/env python3
"""Espelha o HEAD do git (codigo commitado) para o Hugging Face.

Funcao: manter em huggingface.co/FinweeBR/controle-popular uma copia
publica do portal, no mesmo espirito do espelho do Gitee — rede de
seguranca caso o GitHub suma e vitrine do projeto onde a comunidade de
IA ja procura codigo.

Como funciona (e por que assim):

- Fonte da verdade e o HEAD, nunca a arvore de trabalho: o que o Hub
  recebe e exatamente o que o GitHub mostra. `git archive` exporta só
  os arquivos commitados; build, cache e worktree de outra sessao ficam
  fora por construcao. (Medido: `upload_folder` solto varreu os
  worktrees de .claude e o Hub derrubou a conta com caminho .cache.)
- O Hub PROIBE caminho sob `.cache/` — os 30 arquivos de benchmark
  versionados em etl/congresso/.../benchmark/.cache/ nao sobem. Limite
  da plataforma, nao nosso.
- Poda apos upload: arquivo removido do git some do Hub. Sem poda o
  espelho acumula lixo — num saneamento so, 520 PDFs sairam do repo.
- Upload e deduplicado pelo Hub (conteudo igual nao reenvia), entao o
  push cotidiano gasta banda so no que mudou.
- Nunca imprime o token. Ele vem do ambiente HF_TOKEN (secrets do
  GitHub) ou do login local do `hf auth login`.

Uso:
    python scripts/espelhar-hf.py            # sobe o HEAD e poda
    python scripts/espelhar-hf.py --apagar   # so poda, nao envia
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

from huggingface_hub import HfApi

REPO_ID = "FinweeBR/controle-popular"
RAIZ = Path(__file__).resolve().parents[1]

# Caminho sob .cache/ e rejeitado pelo Hub (regra de plataforma) — fica
# de fora do upload; a diferenca contra o git na poda nunca o alca.
PADROES_FORA = ["**/.cache/*", ".cache/*"]

# Criado pelo proprio Hub no primeiro arquivo grande; nao existe no git,
# entao a poda tem que poupá-lo.
RESPIRAR_HUB = {".gitattributes"}


def com(*args: str) -> bytes:
    """Roda um comando do git na raiz do repo e devolve a saida em bytes."""
    return subprocess.run(
        ["git", *args], cwd=RAIZ, capture_output=True, check=True
    ).stdout


def arquivos_do_head() -> set[str]:
    """Caminhos commitados no HEAD (fonte da verdade do espelho)."""
    return {
        p.decode("utf-8", "surrogateescape")
        for p in com("ls-tree", "-r", "--name-only", "-z", "HEAD").split(b"\x00")
        if p
    }


def extrair_head(destino: Path) -> None:
    """Exporta o HEAD como arvore de arquivos via `git archive`.

    O archive sai conteudo cru (o repo nao usa git-LFS — medido:
    `git ls-files` vazio — entao nao ha ponteiro no lugar de arquivo).
    O filtro 'data' do tarfile recusa caminho absoluto e '..'.
    """
    tar = destino.with_suffix(".tar")
    com("archive", "--format=tar", "-o", str(tar), "HEAD")
    with tarfile.open(tar) as tf:
        try:
            tf.extractall(destino, filter="data")
        except TypeError:  # python antigo sem o argumento filter
            tf.extractall(destino)
    tar.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apagar",
        action="store_true",
        help="so poda do Hub arquivos que sairam do git; nao envia nada",
    )
    args = parser.parse_args()

    api = HfApi()
    try:
        quem = api.whoami()
    except Exception:
        print(
            "sem login no Hugging Face: rode `hf auth login` ou exporte "
            "HF_TOKEN (o token nunca vai para o repositorio)",
            file=sys.stderr,
        )
        return 2

    api.create_repo(REPO_ID, repo_type="model", exist_ok=True)
    do_git = arquivos_do_head()
    print(f"git HEAD: {len(do_git)} arquivo(s)", flush=True)

    enviados = 0
    if not args.apagar:
        with tempfile.TemporaryDirectory(prefix="espelho-hf-") as tmp:
            raiz_tmp = Path(tmp)
            extrair_head(raiz_tmp)
            api.upload_folder(
                repo_id=REPO_ID,
                repo_type="model",
                folder_path=str(raiz_tmp),
                ignore_patterns=PADROES_FORA,
            )
        print("upload concluido", flush=True)
        enviados = len(do_git)

    # Poda: o que existe no Hub e saiu do git (ou nunca pode subir) sai.
    no_hub = set(api.list_repo_files(REPO_ID, repo_type="model"))
    podados = sorted(no_hub - do_git - RESPIRAR_HUB)
    for caminho in podados:
        api.delete_file(path_in_repo=caminho, repo_id=REPO_ID, repo_type="model")
    if podados:
        print(f"podado(s): {len(podados)} arquivo(s) obsoleto(s)", flush=True)

    restantes = len(set(api.list_repo_files(REPO_ID, repo_type="model")))
    print(
        f"ok: usuario {quem['name']}, enviados {enviados}, "
        f"podados {len(podados)}, {restantes} arquivo(s) no Hub",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
