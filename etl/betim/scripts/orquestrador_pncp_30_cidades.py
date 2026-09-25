"""orquestrador_pncp_30_cidades.py — Orquestrador sequencial do PNCP para as 30 cidades delegadas.

Uso:
    python etl/betim/scripts/orquestrador_pncp_30_cidades.py

═══ PAPEL NO PROCESSO DE TRANSPARÊNCIA CÍVICA ═══
Este script automatiza e supervisiona a extração completa de dados de compras públicas e contratos
para o lote das 30 maiores cidades do interior paulista, mineiro e polos regionais brasileiros
(Guarulhos, São Bernardo, Campina Grande, Feira de Santana, Joinville, Londrina, Caxias do Sul, etc.).

Ao finalizar com sucesso todas as 30 cidades, o script aciona automaticamente a esteira seguinte:
o orquestrador dos 82 municípios dos Vales do Jequitinhonha e Mucuri (`orquestrador_pncp_vales.py`).

═══ REGRAS OPERACIONAIS INEGOCIÁVEIS (AGENTS.md) ═══
1. EXECUÇÃO MONOTAREFA:
   - "1 ETL por máquina, 1 comando por vez." É proibido paralelizar requisições pesadas ao PNCP,
     sob pena de bloqueio de IP por HTTP 429 ou saturação da máquina local (`home-pc`).
2. RITO DE TRÊS PASSOS POR MUNICÍPIO:
   Para cada cidade, executam-se estritamente nesta ordem:
   Passo 1: `python -m etl.pncp.orgaos --id-municipio <IBGE> --gravar` (Mapeia todos os CNPJs municipais)
   Passo 2: `python -m etl.pncp.contratos --id-municipio <IBGE>` (Coleta os contratos de todos os CNPJs)
   Passo 3: `python -m etl.pncp.licitacoes --id-municipio <IBGE>` (Coleta as licitações com filtro de esfera)
3. RESILIÊNCIA E PERSISTÊNCIA ATÔMICA:
   O progresso é salvo após cada cidade em `.progresso-30-cidades.json`. Em caso de reinicialização
   da máquina ou do terminal, o script retoma imediatamente da primeira cidade pendente.
4. RETENTATIVAS COM BACKOFF:
   Falhas de conexão são retentadas até 5 vezes com espera progressiva (`10s * tentativa`).
5. NOTIFICAÇÃO EM TEMPO REAL:
   A cada cidade concluída com sucesso, envia um alerta ao canal de monitoramento do Telegram.
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Configuração de suporte estrito a UTF-8 no stdout/stderr para terminais Windows (PowerShell / cmd.exe)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Resolução de diretórios absolutos a partir da localização canônica deste script
RAIZ_BETIM = Path(__file__).resolve().parents[1]
RAIZ_REPO = RAIZ_BETIM.parent.parent
ARQUIVO_PROGRESSO = RAIZ_BETIM / ".progresso-30-cidades.json"
PYTHON_BIN = RAIZ_BETIM / ".venv" / "Scripts" / "python.exe"

# Relação ordenada das 30 cidades de grande porte do interior e regiões metropolitanas
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
    """Lê o arquivo de estado `.progresso-30-cidades.json`.

    Permite identificar quais municípios já foram concluídos e onde a esteira deve retomar.

    Returns:
        Dicionário com o histórico de municípios e seus respectivos status.
    """
    if ARQUIVO_PROGRESSO.exists():
        try:
            with open(ARQUIVO_PROGRESSO, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def salvar_progresso(progresso: dict):
    """Grava o estado de progresso de forma atômica no disco.

    Escreve primeiro em arquivo temporário (`.tmp`) e depois renomeia, prevenindo
    corrupção do JSON em caso de encerramento repentino do processo.

    Args:
        progresso: Dicionário contendo os dados de status das cidades.
    """
    tmp = ARQUIVO_PROGRESSO.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(progresso, f, indent=2, ensure_ascii=False)
    os.replace(tmp, ARQUIVO_PROGRESSO)


def notificar_telegram(msg: str):
    """Envia notificação informativa ao canal oficial de telemetria no Telegram.

    Aciona o script auxiliar `scripts/notificar-telegram.mjs` via Node.js em processo isolado.

    Args:
        msg: Texto da mensagem (com suporte a formatação HTML simples).
    """
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
    """Executa um módulo Python subordinado com política de retentativas e backoff linear.

    Em caso de falha de conexão ou código de saída não-zero, aguarda `10 * tentativa` segundos
    antes de tentar novamente (ex: 10s, 20s, 30s...).

    Args:
        args: Argumentos passados ao interpretador Python (ex: `["-m", "etl.pncp.contratos", ...]`).
        max_retentativas: Número máximo de tentativas antes de abortar a esteira (padrão: 5).

    Returns:
        True se o comando retornou código 0 de sucesso; False caso esgote as retentativas.
    """
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
    """Função principal que governa o ciclo de vida da esteira das 30 cidades."""
    progresso = carregar_progresso()
    total = len(CIDADES)

    for idx, (ibge, nome) in enumerate(CIDADES, start=1):
        if progresso.get(ibge, {}).get("status") == "concluido":
            print(f"[Orquestrador] {idx}/{total} - {nome} ({ibge}) já concluída anteriormente.", flush=True)
            continue

        print(f"\n{'='*60}\n[Orquestrador] Iniciando {idx}/{total} - {nome} ({ibge})\n{'='*60}", flush=True)

        # Passo 1: Descoberta de todos os órgãos e CNPJs municipais
        ok1 = executar_comando(["-m", "etl.pncp.orgaos", "--id-municipio", ibge, "--gravar"])
        if not ok1:
            print(f"[Orquestrador] FALHA ao mapear órgãos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Passo 2: Coleta de contratos administrativos
        ok2 = executar_comando(["-m", "etl.pncp.contratos", "--id-municipio", ibge])
        if not ok2:
            print(f"[Orquestrador] FALHA ao coletar contratos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Passo 3: Coleta de licitações com filtro estrito de esfera
        ok3 = executar_comando(["-m", "etl.pncp.licitacoes", "--id-municipio", ibge])
        if not ok3:
            print(f"[Orquestrador] FALHA ao coletar licitações de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Registro persistente de conclusão da cidade
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

    # Transição automática e contínua para os Vales do Jequitinhonha e Mucuri
    script_vales = RAIZ_BETIM / "scripts" / "orquestrador_pncp_vales.py"
    if script_vales.exists():
        print("\n🚀 Iniciando automaticamente a esteira dos 82 municípios dos Vales do Jequitinhonha e Mucuri...", flush=True)
        notificar_telegram("🚀 <b>Controle Popular</b>: Iniciando automaticamente a esteira de ETL dos 82 municípios dos Vales do Jequitinhonha e Mucuri!")
        subprocess.run([str(PYTHON_BIN), str(script_vales)], cwd=str(RAIZ_BETIM))


if __name__ == "__main__":
    main()
