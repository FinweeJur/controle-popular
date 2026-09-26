"""orquestrador_pncp_vales.py — Orquestrador sequencial do PNCP para os 82 municípios dos Vales.

Uso:
    python etl/betim/scripts/orquestrador_pncp_vales.py

═══ PAPEL NO PROCESSO DE TRANSPARÊNCIA CÍVICA ═══
Este script orquestra a esteira completa de extração de contratações públicas para os 82 municípios
que integram os Vales do Jequitinhonha (55 cidades) e Mucuri (27 cidades), no nordeste de Minas Gerais.
Garante que cidades historicamente desprovidas de cobertura da grande imprensa tenham 100% de seus
contratos, atas e editais do PNCP mapeados, categorizados e abertos à fiscalização popular.

═══ REGRAS OPERACIONAIS INEGOCIÁVEIS (AGENTS.md) ═══
1. EXECUÇÃO MONOTAREFA E SERIALIZADA:
   "1 ETL por máquina, 1 comando por vez." Respeita a capacidade de hardware da máquina local
   e as políticas de rate limit da API pública do governo federal.
2. SEQUÊNCIA OBRIGATÓRIA DE TRÊS ETAPAS POR MUNICÍPIO:
   - 1) `python -m etl.pncp.orgaos --id-municipio <IBGE> --gravar` (Identifica secretarias e autarquias);
   - 2) `python -m etl.pncp.contratos --id-municipio <IBGE>` (Baixa contratos e aditivos);
   - 3) `python -m etl.pncp.licitacoes --id-municipio <IBGE>` (Baixa editais e atas de registro de preços).
3. CONTROLE DE CHECKPOINTS RESILIENTE:
   Armazena o estado de execução em `etl/betim/.progresso-vales.json`. Caso ocorra interrupção de energia
   ou reinício do sistema, o script retoma exatamente a partir do município não finalizado.
4. RETENTATIVAS AUTOMÁTICAS COM BACKOFF:
   Até 5 tentativas com espaçamento linear (`10 * tentativa` segundos) para absorver oscilações de rede.
5. NOTIFICAÇÃO VIA TELEGRAM:
   Emite alerta de progresso a cada município concluído via `scripts/notificar-telegram.mjs`.
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

# Resolução de diretórios absolutos a partir da localização deste script no repositório
RAIZ_BETIM = Path(__file__).resolve().parents[1]
RAIZ_REPO = RAIZ_BETIM.parent.parent
ARQUIVO_PROGRESSO = RAIZ_BETIM / ".progresso-vales.json"
PYTHON_BIN = RAIZ_BETIM / ".venv" / "Scripts" / "python.exe"

# Garante que o modulo `etl` seja importavel diretamente por este script
if str(RAIZ_BETIM) not in sys.path:
    sys.path.insert(0, str(RAIZ_BETIM))


def carregar_municipios() -> list[tuple[str, str, str]]:
    """Carrega a relação dos 82 municípios dos Vales a partir dos arquivos JSON canônicos.

    ═══ FONTES E DEDUPLICAÇÃO ═══
    1. Lê os 55 municípios do Vale do Jequitinhonha em `apps/web/data/vales-jequitinhonha.json`;
    2. Lê os 27 municípios do Vale do Mucuri em `apps/web/data/vales-mucuri.json`;
    3. Deduplica eventuais municípios de divisa pelo código oficial de 7 dígitos do IBGE.

    Returns:
        Lista de tuplas no formato `[(id_ibge7, nome_municipio, nome_vale), ...]`.
    """
    cidades = []

    # 1. Vale do Jequitinhonha (55 municípios)
    path_jeq = RAIZ_REPO / "apps" / "web" / "data" / "vales-jequitinhonha.json"
    if path_jeq.exists():
        try:
            with open(path_jeq, "r", encoding="utf-8") as f:
                dados_jeq = json.load(f)
                for m in dados_jeq.get("municipios", []):
                    cidades.append((m["id_ibge7"], m["nome"], "Vale do Jequitinhonha"))
        except Exception as e:
            print(f"[Orquestrador Vales] Aviso ao ler Jequitinhonha: {e}")

    # 2. Vale do Mucuri (27 municípios)
    path_mucuri = RAIZ_REPO / "apps" / "web" / "data" / "vales-mucuri.json"
    if path_mucuri.exists():
        try:
            with open(path_mucuri, "r", encoding="utf-8") as f:
                dados_mucuri = json.load(f)
                for m in dados_mucuri.get("municipios", []):
                    # Evita duplicatas se algum município estiver referenciado em ambos os vales
                    if not any(c[0] == m["id_ibge7"] for c in cidades):
                        cidades.append((m["id_ibge7"], m["nome"], "Vale do Mucuri"))
        except Exception as e:
            print(f"[Orquestrador Vales] Aviso ao ler Mucuri: {e}")

    return cidades


def carregar_progresso() -> dict:
    """Lê o arquivo de estado `.progresso-vales.json`.

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
    """Salva atomicamente o estado de progresso dos municípios no disco.

    Utiliza gravação prévia em arquivo `.tmp` seguida de substituição (`os.replace`),
    garantindo que o arquivo nunca fique corrompido em caso de interrupção repentina.

    Args:
        progresso: Dicionário contendo os dados de status dos municípios.
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
            print(f"[Orquestrador Vales] Erro ao notificar Telegram: {e}")


def executar_comando(args: list[str], max_retentativas: int = 5) -> bool:
    """Executa um comando Python de ETL subordinado com política de retentativas e backoff linear.

    Em caso de falha de conexão ou código de saída diferente de zero, aguarda
    `10 * tentativa` segundos antes da próxima tentativa.

    Args:
        args: Argumentos passados ao interpretador Python (ex: `["-m", "etl.pncp.contratos", ...]`).
        max_retentativas: Quantidade máxima de tentativas permitidas (padrão: 5).

    Returns:
        True se o comando retornou código 0 de sucesso; False caso esgote as retentativas.
    """
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


def garantir_municipios_semeados(cidades: list[tuple[str, str, str]]):
    """Garante que todos os municípios dos Vales existam na tabela `municipios`.

    Evita que o ETL falhe com 'ABORT: id_municipio não existe em municipios'.
    Insere com `ativo = False` para não afetar o build até a conclusão.
    """
    try:
        from etl.common import get_supabase_client
        client = get_supabase_client()
        conn = client.conexao()
        semeados = 0
        for ibge, nome, _ in cidades:
            cur = conn.execute(
                "INSERT INTO municipios (id_municipio, nome, uf, ativo, branding, fontes) "
                "VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id_municipio) DO NOTHING RETURNING id_municipio",
                (ibge, nome, "MG", False, json.dumps({}), json.dumps({}))
            )
            if cur.fetchone():
                semeados += 1
        if semeados > 0:
            print(f"[Orquestrador Vales] {semeados} municípios novos semeados em `municipios` com sucesso.", flush=True)
    except Exception as e:
        print(f"[Orquestrador Vales] Aviso ao garantir municípios no banco: {e}", flush=True)


def main():
    """Função principal que orquestra a execução contínua dos 82 municípios dos Vales."""
    progresso = carregar_progresso()
    cidades = carregar_municipios()
    total = len(cidades)

    if total == 0:
        print("[Orquestrador Vales] Nenhum município carregado. Verifique os arquivos JSON em apps/web/data/.")
        sys.exit(1)

    print(f"\n[Orquestrador Vales] Iniciando esteira dos Vales: {total} municípios catalogados.", flush=True)

    # Garante que todas as cidades estejam registradas no banco antes de rodar os passos
    garantir_municipios_semeados(cidades)

    for idx, (ibge, nome, vale) in enumerate(cidades, start=1):
        if progresso.get(ibge, {}).get("status") == "concluido":
            print(f"[Orquestrador Vales] {idx}/{total} - {nome} ({ibge}) [{vale}] já concluída anteriormente.", flush=True)
            continue

        print(f"\n{'='*60}\n[Orquestrador Vales] Iniciando {idx}/{total} - {nome} ({ibge}) [{vale}]\n{'='*60}", flush=True)

        # Passo 1: Descoberta de órgãos municipais
        ok1 = executar_comando(["-m", "etl.pncp.orgaos", "--id-municipio", ibge, "--gravar"])
        if not ok1:
            print(f"[Orquestrador Vales] FALHA ao mapear órgãos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Passo 2: Coleta de contratos administrativos
        ok2 = executar_comando(["-m", "etl.pncp.contratos", "--id-municipio", ibge])
        if not ok2:
            print(f"[Orquestrador Vales] FALHA ao coletar contratos de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Passo 3: Coleta de licitações com filtro de esfera municipal
        ok3 = executar_comando(["-m", "etl.pncp.licitacoes", "--id-municipio", ibge])
        if not ok3:
            print(f"[Orquestrador Vales] FALHA ao coletar licitações de {nome}. Interrompendo.", flush=True)
            sys.exit(1)

        # Registra a conclusão da cidade no arquivo de progresso
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
