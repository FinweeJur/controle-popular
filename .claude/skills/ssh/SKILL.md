---
name: ssh
description: Ponte SSH segura entre o desktop (DESKTOP-FEFPDDP) e o home-pc para inventariar PDFs, copiar arquivos e rodar comandos de leitura. Use ao precisar acessar o home-pc via Tailscale/OpenSSH, copiar logs ou bases, ou diagnosticar Permission denied.
---

# /ssh — ponte desktop ↔ home-pc

Skill operacional para acessar o `home-pc` pelo Tailscale usando OpenSSH.
Não usa Tailscale SSH (o servidor não existe no Windows v1.102.2) e não
depende de senha.

## Estado medido em 21/10/2026

| Item | Valor |
|---|---|
| Desktop | `DESKTOP-FEFPDDP` / `100.126.160.109` |
| Home-pc | `Home-PC` / `100.91.10.1` |
| Usuário remoto | `user` (local, administrador) |
| Chave dedicada | `C:\Users\teste\.ssh\id_ed25519_rag` |
| Chave antiga | `id_ed25519` **tem passphrase**; não usar em automação |
| Host key | `SHA256:8TXQxMhMaV3YA26V14RrTouTgstrtI0qVQN9YXJUX64` |
| Autorização | `C:\ProgramData\ssh\administrators_authorized_keys` |
| `sshd` | OpenSSH nativo do Windows; relê `authorized_keys` por conexão |

## Comando que funciona

```powershell
ssh -i "$HOME\.ssh\id_ed25519_rag" -o BatchMode=yes -o ConnectTimeout=10 `
  -o StrictHostKeyChecking=accept-new user@100.91.10.1 whoami
```

Retorno esperado:

```text
home-pc\user
```

Use `BatchMode=yes` para automação: sem ele, uma chave com passphrase abre
prompt e o comando fica pendurado.

## Comandos remotos

O shell remoto padrão é `cmd`. Para mais de um comando, chame `cmd /c`:

```powershell
ssh -i "$HOME\.ssh\id_ed25519_rag" -o BatchMode=yes user@100.91.10.1 `
  "cmd /c dir /b C:\DevCoder"
```

Para PowerShell:

```powershell
ssh -i "$HOME\.ssh\id_ed25519_rag" -o BatchMode=yes user@100.91.10.1 `
  "powershell -NoProfile -Command \"Get-ChildItem -LiteralPath 'C:\DevCoder' | Select-Object Name\""
```

Evite `hostname; whoami` solto: o `cmd` pode interpretar o `;` de forma
estranha. Use `cmd /c` ou comandos separados.

## Copiar arquivos

Do desktop para o home-pc:

```powershell
scp -i "$HOME\.ssh\id_ed25519_rag" `
  "C:\caminho\arquivo.md" `
  "user@100.91.10.1:C:/Users/Public/arquivo.md"
```

Do home-pc para o desktop:

```powershell
scp -i "$HOME\.ssh\id_ed25519_rag" `
  "user@100.91.10.1:C:/Users/Public/arquivo.md" `
  "C:\Users\teste\Downloads\arquivo.md"
```

Para inventário grande, prefira listar no remoto e copiar só o resumo:

```powershell
ssh -i "$HOME\.ssh\id_ed25519_rag" -o BatchMode=yes user@100.91.10.1 `
  "cmd /c dir /s /b C:\DevCoder\tjmg-jurimetria\pdfs\*.pdf"
```

## Acessos já mapeados no home-pc

- `C:\DevCoder\controle-popular` — checkout canônico do portal.
- `C:\DevCoder\tjmg-jurimetria` — 1.150 PDFs (o desktop tem 4.147; não duplicar).
- `C:\DevCoder\controle-popular\acervo-documentos` — PDFs de direitos humanos.
- `C:\DevCoder\controle-popular\documentos-site` — documentos baixados.
- `C:\DevCoder\_outbox` — caixa de saída entre máquinas.
- `C:\DevCoder\cutiazinha` — hub Go/Wails; não é RAG.

## Configurar do zero

No home-pc, como administrador:

```powershell
$pub = 'ssh-ed25519 AAAA... rag@DESKTOP-FEFPDDP'
$admin = 'C:\ProgramData\ssh\administrators_authorized_keys'
$user  = 'C:\Users\user\.ssh\authorized_keys'

# ASCII, sem BOM; uma chave por linha.
[System.IO.File]::WriteAllText($admin, $pub + "`r`n", [System.Text.Encoding]::ASCII)
[System.IO.File]::WriteAllText($user,  $pub + "`r`n", [System.Text.Encoding]::ASCII)

icacls $admin /inheritance:r
icacls $admin /grant "user:F"
icacls $admin /grant "*S-1-5-32-544:F"
icacls $admin /grant "*S-1-5-18:F"

icacls $user /inheritance:r
icacls $user /grant "user:F"
icacls $user /grant "*S-1-5-18:F"
```

Não é preciso reiniciar o `sshd` para adicionar chave; ele relê o arquivo.
Reinicie só se mexer no `sshd_config` ou na ACL do serviço.

No desktop, gere uma chave **dedicada e sem passphrase**:

```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\id_ed25519_rag" -N "" -C "rag@DESKTOP-FEFPDDP"
```

No PowerShell, `-N ""` pode ser engolido; se der `Too many arguments`, rode
pelo `cmd`:

```powershell
cmd /c 'ssh-keygen -t ed25519 -f "C:\Users\teste\.ssh\id_ed25519_rag" -N "" -C "rag@DESKTOP-FEFPDDP"'
```

## Diagnóstico

### `Permission denied (publickey)` sem oferecer chave

- Confira o caminho com `-i`.
- Confira `Offering public key` com `ssh -vv`.
- Confira `authorized_keys` e ACL no home-pc.

### `Server accepts key` e depois `we did not send a packet`

Isso é **chave privada com passphrase** em `BatchMode`, não ACL/BOM/hostbound.
Use a chave sem passphrase ou um `ssh-agent` já destravado.

### `Connection closed by ... [preauth]`

Costuma ser timeout, host key ou cliente encerrando. Confira:

```powershell
ssh -vv -o BatchMode=yes -i "$HOME\.ssh\id_ed25519_rag" user@100.91.10.1 whoami
```

### Host key

```powershell
ssh-keyscan -T 10 -t ed25519 100.91.10.1
ssh-keygen -F 100.91.10.1
```

### Log do servidor

No home-pc:

```powershell
Get-WinEvent -LogName OpenSSH/Operational -MaxEvents 30 |
  Format-List TimeCreated,Id,Message
Get-Service sshd
```

### BOM/CRLF

```powershell
Format-Hex C:\ProgramData\ssh\administrators_authorized_keys | Select-Object -First 2
```

Não pode começar com `EF BB BF`. `CRLF` é aceito.

### Tailscale SSH

Não use `tailscale ssh` nem `tailscale set --ssh` no Windows: o servidor
Tailscale SSH não é suportado. A ponte é OpenSSH sobre o IP `100.x`.

## Segurança

- Nunca leia, imprima ou copie `.env`, token, chave privada ou `scripts/.env`.
- Não use `--force`, `rm -rf`, `git reset --hard` ou deploy sem ordem.
- `BatchMode=yes` sempre que não houver humano para digitar senha.
- Em dúvida, faça primeiro comando de leitura (`whoami`, `dir`, `Get-Content`).
- O home-pc é produção/túnel; não reinicie serviço nem publique site sem o dono.
- A chave `id_ed25519_rag` é dedicada; não a reutilize em outros serviços.
