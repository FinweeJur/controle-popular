#!/usr/bin/env python3
"""
scripts/gerar-icones-emblema.py — Processa a arte do emblema do Controle Popular,
gerando os icones oficiais para navegadores, atalhos de celular e navbar.
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

RAIZ = Path(__file__).resolve().parent.parent
IMAGEM_ORIGINAL = Path("C:/Users/Home/.gemini/antigravity/brain/5580d63f-d503-4aad-a020-94774e84f53b/.user_uploaded/media_1788758195409.jpg")

DIR_MARCA = RAIZ / "apps" / "web" / "public" / "marca"
DIR_PUBLIC = RAIZ / "apps" / "web" / "public"
DIR_APP = RAIZ / "apps" / "web" / "app"

DIR_MARCA.mkdir(parents=True, exist_ok=True)
DIR_PUBLIC.mkdir(parents=True, exist_ok=True)
DIR_APP.mkdir(parents=True, exist_ok=True)

def processar():
    print(f"🎨 Abrindo imagem original de {IMAGEM_ORIGINAL}...")
    if not IMAGEM_ORIGINAL.exists():
        print(f"❌ Imagem original nao encontrada: {IMAGEM_ORIGINAL}")
        sys.exit(1)

    img = Image.open(IMAGEM_ORIGINAL).convert("RGBA")
    
    # Centro e raio medidos na imagem 1024x1024
    center_x, center_y = 514, 521
    raio = 433

    # Para recorte com anti-aliasing perfeito, fazemos supersampling 4x
    scale = 4
    tamanho_crop = raio * 2
    crop_box = (center_x - raio, center_y - raio, center_x + raio, center_y + raio)
    cropped = img.crop(crop_box)

    # Cria mascara circular com supersampling
    mask_large = Image.new("L", (tamanho_crop * scale, tamanho_crop * scale), 0)
    draw = ImageDraw.Draw(mask_large)
    draw.ellipse((0, 0, tamanho_crop * scale - 1, tamanho_crop * scale - 1), fill=255)
    mask = mask_large.resize((tamanho_crop, tamanho_crop), Image.Resampling.LANCZOS)

    # Aplica mascara alfa
    recorte_circular = Image.new("RGBA", (tamanho_crop, tamanho_crop), (0, 0, 0, 0))
    recorte_circular.paste(cropped, (0, 0), mask=mask)

    print(f"✂️ Recorte circular obtido: {recorte_circular.size}")

    # 1. Emblema WebP e PNG para Navbar (256x256)
    emblema_256 = recorte_circular.resize((256, 256), Image.Resampling.LANCZOS)
    emblema_webp = DIR_MARCA / "emblema.webp"
    emblema_png = DIR_MARCA / "emblema.png"
    emblema_256.save(emblema_webp, "WEBP", quality=95)
    emblema_256.save(emblema_png, "PNG")
    print(f"  + Salvo {emblema_webp} ({emblema_webp.stat().st_size} bytes)")
    print(f"  + Salvo {emblema_png} ({emblema_png.stat().st_size} bytes)")

    # 2. Ícone padrão 512x512 (PWA / Web App / Next.js)
    icon_512 = recorte_circular.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(DIR_PUBLIC / "icon.png", "PNG")
    icon_512.save(DIR_APP / "icon.png", "PNG")
    print("  + Salvo apps/web/public/icon.png e apps/web/app/icon.png (512x512)")

    # 3. Apple Touch Icon 180x180
    apple_180 = recorte_circular.resize((180, 180), Image.Resampling.LANCZOS)
    apple_180.save(DIR_PUBLIC / "apple-icon.png", "PNG")
    apple_180.save(DIR_APP / "apple-icon.png", "PNG")
    print("  + Salvo apps/web/public/apple-icon.png e apps/web/app/apple-icon.png (180x180)")

    # 4. Favicons 32x32 e 16x16
    fav_32 = recorte_circular.resize((32, 32), Image.Resampling.LANCZOS)
    fav_16 = recorte_circular.resize((16, 16), Image.Resampling.LANCZOS)
    fav_48 = recorte_circular.resize((48, 48), Image.Resampling.LANCZOS)
    fav_32.save(DIR_PUBLIC / "favicon-32x32.png", "PNG")
    fav_16.save(DIR_PUBLIC / "favicon-16x16.png", "PNG")

    # 5. Favicon.ico multi-resolução (16, 32, 48)
    ico_pub = DIR_PUBLIC / "favicon.ico"
    ico_app = DIR_APP / "favicon.ico"
    fav_48.save(ico_pub, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    fav_48.save(ico_app, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  + Salvo {ico_pub} e {ico_app} com resoluções 16x16, 32x32 e 48x48")

    print("✅ Todos os ícones e emblemas foram gerados com sucesso!")

if __name__ == "__main__":
    processar()
