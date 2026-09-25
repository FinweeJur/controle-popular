"""orquestrador_pncp_30_cidades.py — Executa o lote das 30 cidades delegadas sequencialmente.

Regra inegociável do projeto:
- 1 ETL por máquina, 1 comando por vez.
- Cada cidade = 3 comandos, nesta ordem:
  1) python -m etl.pncp.orgaos --id-municipio <IBGE> --gravar
  2) python -m etl.pncp.contratos --id-municipio <IBGE>
  3) python -m etl.pncp.licitacoes --id-municipio <IBGE>
- Checkpoint retoma sozinho. Se falhar, retenta com backoff.
- Notifica conclusão de cada cidade via Telegram (scripts/passo-telegram.mts).
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
ARQUIVO_PROGRESSO = RAIZ_BETIM / ".progresso-30-cidades.json"
PYTHON_BIN = RAIZ_BETIM / ".venv" / "Scripts" / "python.exe"

CIDADES = [
    ("3518800", "Guarulhos/SP"),
    ("3548708", "Sao Bernardo/SP"),
    ("3543402", "Ribeirao Preto/SP"),
    ("3549904", "Sao Jose dos Campos/SP"),
    ("3534401", "Osasco/SP"),
    ("3552205", "Sorocaba/SP"),
    ("3547809", "Santo Andre/SP"),
    ("3549805", "Sao Jose do Rio Preto/SP"),
    ("3548500", "Santos/SP"),
    ("2910800", "Feira de Santana/BA"),
    ("4209102", "Joinville/SC"),
    ("5201405", "Aparecida de Goiania/GO"),
    ("4113700", "Londrina/PR"),
    ("4305108", "Caxias do Sul/RS"),
    ("5201108", "Anapolis/GO"),
    ("2504009", "Campina Grande/PB"),
    ("4115200", "Maringa/PR"),
    ("2611101", "Petrolina/PE"),
    ("4314407", "Pelotas/RS"),
    ("3529401", "Maua/SP"),
    ("3510609", "Carapicuiba/SP"),
    ("3525904", "Jundiai/SP"),
    ("3516200", "Franca/SP"),
    ("3526902", "Limeira/SP"),
    ("3538709", "Piracicaba/SP"),
    ("3554102", "Taubate/SP"),
    ("3529005", "Marilia/SP"),
    ("3541406", "Presidente Prudente/SP"),
    ("3513801", "Diadema/SP"),
    ("3548807", "Sao Caetano do Sul/SP"),
]


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
    import shutil
    script = RAIZ_REPO / "scripts" / "notificar-telegram.mjs"
    if script.exists():
        try:
            node_bin = shutil.which("node") or "node"
            subprocess.run(
                [node_bin, str(script), msg],
                cwd=str(RAIZ_REPO),
                timeout=30,
                capture_output=True,
                shell=False,
            )
        except Exception as e:
            print(f"[Orquestrador] Erro ao notificar Telegram: {e}")


def executar_comando(args: list[str], max_retentativas: int = 5) -> bool:
    cmd = [str(PYTHON_BIN)] + args
    print(f"\n[Orquestrador] Executando: {' '.join(args)}", flush=True)
    for tentativa in range(1, max_retentativas + 1):
        try:
            res = subprocess.run(cmd, cwd=str(RAIZ_BETIM))
            if res.returncode == 0:
                return True
            print(f"[Orquestrador] Código de saída {res.returncode}. Tentativa {tentativa}/{max_retentativas}.", flush=True)
        except Exception as e:
            print(f"[Orquestrador] Exceção na execução: {e}. Tentativa {tentativa}/{max_retentativas}.", flush=True)
        time.sleep(10 * tentativa)
    return False


def main():
    progresso = carregar_progresso()
    total = len(CIDADES)

    for idx, (ibge, nome) in enumerate(CIDADES, start=1):
        if progresso.get(ibge, {}).get("status") == "concluido":
            print(f"[Orquestrador] {idx}/{total} - {nome} ({ibge}) já concluída anteriormente.", flush=True)
            continue

        print(f"\n{'='*60}\n[Orquestrador] Iniciando {idx}/{total} - {nome} ({ibge})\n{'='*60}", flush=True)

        # 1. Órgãos
        ok1 = executar_comando(["-m", "etl.pncp.orgaos", "--id-municipio", ibge, "--gravar"])
        if not ok1:
            print(f"[Orquestrador] FALHA ao mapear órgãos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # 2. Contratos
        ok2 = executar_comando(["-m", "etl.pncp.contratos", "--id-municipio", ibge])
        if not ok2:
            print(f"[Orquestrador] FALHA ao coletar contratos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # 3. Licitações
        ok3 = executar_comando(["-m", "etl.pncp.licitacoes", "--id-municipio", ibge])
        if not ok3:
            print(f"[Orquestrador] FALHA ao coletar licitações de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Registra conclusão
        progresso[ibge] = {
            "nome": nome,
            "status": "concluido",
            "concluido_em": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        salvar_progresso(progresso)

        msg = f"✅ {idx}/{total} {nome} ({ibge}) concluída com sucesso no PNCP!"
        print(f"[Orquestrador] {msg}", flush=True)
        notificar_telegram(msg)

    print("\n🎉 Todas as 30 cidades grandes foram concluídas com sucesso!", flush=True)
    notificar_telegram("🎉 Todas as 30 cidades grandes do PNCP foram concluídas!")

    # Transição automática para os Vales do Jequitinhonha e Mucuri
    script_vales = RAIZ_BETIM / "scripts" / "orquestrador_pncp_vales.py"
    if script_vales.exists():
        print("\n🚀 Iniciando automaticamente a esteira dos 82 municípios dos Vales do Jequitinhonha e Mucuri...", flush=True)
        notificar_telegram("🚀 <b>Controle Popular</b>: Iniciando automaticamente a esteira de ETL dos 82 municípios dos Vales do Jequitinhonha e Mucuri!")
        subprocess.run([str(PYTHON_BIN), str(script_vales)], cwd=str(RAIZ_BETIM))


if __name__ == "__main__":
    main()
