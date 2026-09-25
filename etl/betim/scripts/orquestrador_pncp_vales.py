"""orquestrador_pncp_vales.py — Executa o lote dos 82 municípios dos Vales do Jequitinhonha e Mucuri.

Regra inegociável do projeto:
- 1 ETL por máquina, 1 comando por vez.
- Cada município = 3 comandos, nesta ordem:
  1) python -m etl.pncp.orgaos --id-municipio <IBGE> --gravar
  2) python -m etl.pncp.contratos --id-municipio <IBGE>
  3) python -m etl.pncp.licitacoes --id-municipio <IBGE>
- Checkpoint retoma sozinho em etl/betim/.progresso-vales.json.
- Notifica conclusão de cada município via Telegram (scripts/notificar-telegram.mjs).
"""
import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Garante suporte a UTF-8 no stdout/stderr no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

RAIZ_BETIM = Path(__file__).resolve().parents[1]
RAIZ_REPO = RAIZ_BETIM.parent.parent
ARQUIVO_PROGRESSO = RAIZ_BETIM / ".progresso-vales.json"
PYTHON_BIN = RAIZ_BETIM / ".venv" / "Scripts" / "python.exe"


def carregar_municipios() -> list[tuple[str, str, str]]:
    """Carrega os 82 municípios dos Vales do Jequitinhonha e Mucuri a partir dos JSONs canônicos."""
    cidades = []
    
    # 1. Jequitinhonha
    path_jeq = RAIZ_REPO / "apps" / "web" / "data" / "vales-jequitinhonha.json"
    if path_jeq.exists():
        try:
            with open(path_jeq, "r", encoding="utf-8") as f:
                dados_jeq = json.load(f)
                for m in dados_jeq.get("municipios", []):
                    cidades.append((m["id_ibge7"], m["nome"], "Vale do Jequitinhonha"))
        except Exception as e:
            print(f"[Orquestrador Vales] Aviso ao ler Jequitinhonha: {e}")

    # 2. Mucuri
    path_mucuri = RAIZ_REPO / "apps" / "web" / "data" / "vales-mucuri.json"
    if path_mucuri.exists():
        try:
            with open(path_mucuri, "r", encoding="utf-8") as f:
                dados_mucuri = json.load(f)
                for m in dados_mucuri.get("municipios", []):
                    # Evita duplicatas se algum município estiver em ambos
                    if not any(c[0] == m["id_ibge7"] for c in cidades):
                        cidades.append((m["id_ibge7"], m["nome"], "Vale do Mucuri"))
        except Exception as e:
            print(f"[Orquestrador Vales] Aviso ao ler Mucuri: {e}")

    return cidades


def carregar_progresso() -> dict:
    if ARQUIVO_PROGRESSO.exists():
        try:
            with open(ARQUIVO_PROGRESSO, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def salvar_progresso(progresso: dict):
    tmp = ARQUIVO_PROGRESSO.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(progresso, f, indent=2, ensure_ascii=False)
    os.replace(tmp, ARQUIVO_PROGRESSO)


def notificar_telegram(msg: str):
    script = RAIZ_REPO / "scripts" / "notificar-telegram.mjs"
    if script.exists():
        try:
            subprocess.run(
                ["node", str(script), msg],
                cwd=str(RAIZ_REPO),
                timeout=30,
                capture_output=True,
                shell=True,
            )
        except Exception as e:
            print(f"[Orquestrador Vales] Erro ao notificar Telegram: {e}")


def executar_comando(args: list[str], max_retentativas: int = 5) -> bool:
    cmd = [str(PYTHON_BIN)] + args
    print(f"\n[Orquestrador Vales] Executando: {' '.join(args)}", flush=True)
    for tentativa in range(1, max_retentativas + 1):
        try:
            res = subprocess.run(cmd, cwd=str(RAIZ_BETIM))
            if res.returncode == 0:
                return True
            print(f"[Orquestrador Vales] Código de saída {res.returncode}. Tentativa {tentativa}/{max_retentativas}.", flush=True)
        except Exception as e:
            print(f"[Orquestrador Vales] Exceção na execução: {e}. Tentativa {tentativa}/{max_retentativas}.", flush=True)
        time.sleep(10 * tentativa)
    return False


def main():
    progresso = carregar_progresso()
    cidades = carregar_municipios()
    total = len(cidades)

    if total == 0:
        print("[Orquestrador Vales] Nenhum município carregado. Verifique os arquivos JSON em apps/web/data/.")
        sys.exit(1)

    print(f"\n[Orquestrador Vales] Iniciando esteira dos Vales: {total} municípios catalogados.", flush=True)

    for idx, (ibge, nome, vale) in enumerate(cidades, start=1):
        if progresso.get(ibge, {}).get("status") == "concluido":
            print(f"[Orquestrador Vales] {idx}/{total} - {nome} ({ibge}) [{vale}] já concluída anteriormente.", flush=True)
            continue

        print(f"\n{'='*60}\n[Orquestrador Vales] Iniciando {idx}/{total} - {nome} ({ibge}) [{vale}]\n{'='*60}", flush=True)

        # 1. Órgãos
        ok1 = executar_comando(["-m", "etl.pncp.orgaos", "--id-municipio", ibge, "--gravar"])
        if not ok1:
            print(f"[Orquestrador Vales] FALHA ao mapear órgãos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # 2. Contratos
        ok2 = executar_comando(["-m", "etl.pncp.contratos", "--id-municipio", ibge])
        if not ok2:
            print(f"[Orquestrador Vales] FALHA ao coletar contratos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # 3. Licitações
        ok3 = executar_comando(["-m", "etl.pncp.licitacoes", "--id-municipio", ibge])
        if not ok3:
            print(f"[Orquestrador Vales] FALHA ao coletar licitações de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Registra conclusão
        progresso[ibge] = {
            "nome": nome,
            "vale": vale,
            "status": "concluido",
            "concluido_em": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        salvar_progresso(progresso)

        msg = f"✅ <b>Vales {idx}/{total}</b>: {nome}/MG ({ibge}) concluída com sucesso no PNCP! [{vale}]"
        print(f"[Orquestrador Vales] {msg}", flush=True)
        notificar_telegram(msg)

    print("\n🎉 Todos os 82 municípios dos Vales do Jequitinhonha e Mucuri foram concluídos com sucesso!", flush=True)
    notificar_telegram("🎉 <b>Controle Popular</b>: Todos os 82 municípios dos Vales do Jequitinhonha e Mucuri foram concluídos com sucesso no PNCP!")


if __name__ == "__main__":
    main()
