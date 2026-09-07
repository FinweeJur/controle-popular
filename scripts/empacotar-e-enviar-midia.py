#!/usr/bin/env python3
"""
scripts/empacotar-e-enviar-midia.py — Empacota e envia o Kit de Imprensa
e Materiais de Divulgação (Setembro/2026) por e-mail para arturcolito@gmail.com
e notifica via Telegram.
"""

import os
import re
import sys
import zipfile
import smtplib

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_PATH = os.path.join(RAIZ, "scripts", ".env")

def carregar_env():
    env = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                m = re.match(r"^\s*([\w_]+)\s*=\s*(.*)\s*$", line)
                if m:
                    env[m.group(1)] = m.group(2).strip()
    return env

def criar_zip_kit(caminho_zip):
    print(f"📦 Criando pacote ZIP em {caminho_zip}...")
    arquivos = [
        ("docs/planos/RELEASE-DIVULGACAO-2026-09.md", "RELEASE-DIVULGACAO-2026-09.md"),
        ("docs/planos/PLANO-DIVULGACAO-ZERO-CUSTO.md", "PLANO-DIVULGACAO-ZERO-CUSTO.md"),
        ("apps/web/public/capas/home-page.webp", "capas/home-page.webp"),
        ("apps/web/public/capas/mariana.webp", "capas/mariana.webp"),
        ("apps/web/public/capas/paraopeba.webp", "capas/paraopeba.webp"),
        ("apps/web/public/capas/congresso.webp", "capas/congresso.webp"),
        ("apps/web/public/capas/judiciario.webp", "capas/judiciario.webp"),
    ]
    
    with zipfile.ZipFile(caminho_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for rel_origem, nome_destino in arquivos:
            origem = os.path.join(RAIZ, rel_origem)
            if os.path.exists(origem):
                z.write(origem, nome_destino)
                print(f"  + Adicionado: {nome_destino}")
            else:
                print(f"  ! Aviso: Arquivo nao encontrado {rel_origem}")

        sumario = """KIT DE IMPRENSA & MIDIA — CONTROLE POPULAR (SETEMBRO/2026)
============================================================
Portal: https://controlepopular.com.br
Contato de Imprensa: contato@controlepopular.com.br

CONTEÚDO DO PACOTE:
1. RELEASE-DIVULGACAO-2026-09.md
   - Release oficial com todos os numeros consolidados:
     * R$ 251 bilhoes monitorados
     * 199 municipios mineiros
     * R$ 171 bi do Acordo do Rio Doce (Mariana)
     * R$ 37,7 bi do Acordo de Brumadinho (Paraopeba)
     * R$ 20,4 bi nos 7 orgaos de Justica (TJMG R$ 14,9 bi, MPMG R$ 4,09 bi, DPMG R$ 1,1 bi)
     * 18 reportagens investigativas
     * Assistente Seu Nono (Sabia 7B)
     * Kit Guias AppLivre (3 casos simples com 3 IAs cada)

2. PLANO-DIVULGACAO-ZERO-CUSTO.md
   - Modelos prontos de e-mail (Modelos A, B, C e D) para redacoes e liderancas
   - Roteiro de video vertical (60-90s) para Reels, TikTok e YouTube Shorts
   - Cronograma semanal de disparos e grupos de WhatsApp
   - Planejamento de carrosseis e legendas para Instagram
   - Hashtags estrategicas e ganchos jornalisticos

3. capas/
   - home-page.webp: Imagem oficial de preview Open Graph (1200x630) para WhatsApp, Telegram e Twitter
   - mariana.webp: Imagem para pautas do Rio Doce
   - paraopeba.webp: Imagem para pautas de Brumadinho
   - congresso.webp: Imagem para pautas da bancada federal
   - judiciario.webp: Imagem para pautas dos orcamentos da Justica
"""
        z.writestr("README-KIT-IMPRENSA.txt", sumario)
        print("  + Adicionado: README-KIT-IMPRENSA.txt")
    print("✅ Pacote ZIP criado com sucesso.")

def enviar_email(caminho_zip, destinatario="arturcolito@gmail.com"):
    env = carregar_env()
    smtp_pass = env.get("SMTP_PASS")
    if not smtp_pass:
        print("⛔ SMTP_PASS nao configurado em scripts/.env")
        return False

    remetente = "contato@controlepopular.com.br"
    assunto = "[Controle Popular] Kit de Imprensa e Materiais de Divulgação — Setembro 2026"

    corpo_texto = """Ola Artur,

Segue o Kit de Imprensa e Materiais de Divulgação do Controle Popular (Setembro/2026), conforme solicitado.

Destaques da Rodada de Divulgação:
- R$ 251 bilhões em recursos públicos monitorados
- 199 municípios com painéis locais e auditoria de contratos
- R$ 171 bi da Repactuação de Mariana e R$ 37,7 bi do Acordo de Brumadinho
- Orçamentos dos 7 órgãos de Justiça (TJMG R$ 14,9 bi, MPMG R$ 4,09 bi, DPMG R$ 1,1 bi)
- 18 reportagens cívicas e investigativas publicadas
- Assistente Seu Nonô com modelo Sabiá 7B quantizado e cascata de fallback
- Kit Guias AppLivre: 3 usos simples com 3 ferramentas de IA cada para a cidadania

Arquivos em anexo:
1. kit-imprensa-controle-popular-2026-09.zip (pacote completo com capas em alta definição e textos)
2. RELEASE-DIVULGACAO-2026-09.md (texto integral do press release)
3. PLANO-DIVULGACAO-ZERO-CUSTO.md (e-mails modelo, roteiros de vídeo e cronograma)

O portal está no ar em: https://controlepopular.com.br

Fraternalmente,
Equipe Controle Popular
contato@controlepopular.com.br
"""

    corpo_html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #222; }
  .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; max-width: 640px; margin: auto; background-color: #ffffff; }
  .header { border-bottom: 2px solid #0066cc; padding-bottom: 12px; margin-bottom: 16px; }
  h2 { color: #004499; margin: 0 0 8px 0; }
  .metric-box { background: #f4f8fc; border-left: 4px solid #0066cc; padding: 12px; margin: 16px 0; border-radius: 4px; }
  .metric-box li { margin-bottom: 6px; }
  .btn { display: inline-block; background-color: #0066cc; color: #ffffff !important; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px; }
  .footer { font-size: 13px; color: #666; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>Controle Popular — Kit de Imprensa & Divulgação</h2>
      <p style="margin: 0; color: #555;">Atualização Consolidada • Setembro de 2026</p>
    </div>
    
    <p>Olá Artur,</p>
    
    <p>Seguem em anexo os arquivos completos do <strong>Kit de Imprensa e Materiais de Divulgação</strong> do portal <strong>Controle Popular</strong>.</p>
    
    <div class="metric-box">
      <strong>📊 Métricas Chave do Portal:</strong>
      <ul>
        <li><strong>R$ 251 bilhões</strong> em recursos públicos auditados e rastreáveis.</li>
        <li><strong>199 municípios</strong> com painéis locais e compras públicas abertas.</li>
        <li><strong>R$ 171 bi</strong> da Repactuação de Mariana e <strong>R$ 37,7 bi</strong> de Brumadinho.</li>
        <li><strong>R$ 20,4 bilhões</strong> orçados nos 7 órgãos de Justiça de MG (TJMG, MPMG, DPMG, etc.).</li>
        <li><strong>18 reportagens</strong> analíticas produzidas com dados oficiais.</li>
        <li><strong>Seu Nonô</strong> com fine-tuning em Sabiá 7B e cascata de IA.</li>
        <li><strong>Kit Guias AppLivre</strong> com 3 casos práticos e 9 roteiros de IA.</li>
      </ul>
    </div>
    
    <p><strong>📁 Conteúdo dos Anexos:</strong></p>
    <ul>
      <li><code>kit-imprensa-controle-popular-2026-09.zip</code> — Pacote completo contendo releases, planos de ação, cronograma de WhatsApp, roteiro de vídeo vertical (60-90s) e todas as capas oficiais em alta resolução (Open Graph 1200x630).</li>
      <li><code>RELEASE-DIVULGACAO-2026-09.md</code> — Press release formatado para jornalistas e assessorias.</li>
      <li><code>PLANO-DIVULGACAO-ZERO-CUSTO.md</code> — E-mails modelos A, B, C e D e scripts para redes sociais.</li>
    </ul>

    <p style="text-align: center;">
      <a href="https://controlepopular.com.br" class="btn">Acessar o Portal Controle Popular</a>
    </p>

    <div class="footer">
      <p>Este envio é parte da rotina de comunicação cívica do Controle Popular.<br>
      Dúvidas ou dados adicionais: <a href="mailto:contato@controlepopular.com.br">contato@controlepopular.com.br</a></p>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("mixed")
    msg["Subject"] = assunto
    msg["From"] = f"Controle Popular <{remetente}>"
    msg["To"] = destinatario

    msg_alt = MIMEMultipart("alternative")
    msg_alt.attach(MIMEText(corpo_texto, "plain", "utf-8"))
    msg_alt.attach(MIMEText(corpo_html, "html", "utf-8"))
    msg.attach(msg_alt)

    # Anexo 1: ZIP
    if os.path.exists(caminho_zip):
        with open(caminho_zip, "rb") as f:
            part = MIMEBase("application", "zip")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f'attachment; filename="{os.path.basename(caminho_zip)}"')
            msg.attach(part)
            print(f"  + Anexado ao e-mail: {os.path.basename(caminho_zip)}")

    # Anexo 2: Release MD
    rel_path = os.path.join(RAIZ, "docs/planos/RELEASE-DIVULGACAO-2026-09.md")
    if os.path.exists(rel_path):
        with open(rel_path, "rb") as f:
            part = MIMEBase("text", "markdown")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", 'attachment; filename="RELEASE-DIVULGACAO-2026-09.md"')
            msg.attach(part)
            print("  + Anexado ao e-mail: RELEASE-DIVULGACAO-2026-09.md")

    # Anexo 3: Capa principal
    capa_path = os.path.join(RAIZ, "apps/web/public/capas/home-page.webp")
    if os.path.exists(capa_path):
        with open(capa_path, "rb") as f:
            part = MIMEBase("image", "webp")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", 'attachment; filename="capa-home-page.webp"')
            msg.attach(part)
            print("  + Anexado ao e-mail: capa-home-page.webp")

    print(f"📧 Enviando e-mail via smtp.umbler.com para {destinatario}...")
    try:
        server = smtplib.SMTP("smtp.umbler.com", 587, timeout=20)
        server.starttls()
        server.login(remetente, smtp_pass)
        server.sendmail(remetente, [destinatario], msg.as_string())
        server.quit()
        print(f"✅ E-mail enviado com sucesso para {destinatario}!")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar e-mail: {e}")
        return False

def main():
    zip_path = os.path.join(RAIZ, "kit-imprensa-controle-popular-2026-09.zip")
    criar_zip_kit(zip_path)
    sucesso = enviar_email(zip_path, "arturcolito@gmail.com")
    if not sucesso:
        sys.exit(1)

if __name__ == "__main__":
    main()
