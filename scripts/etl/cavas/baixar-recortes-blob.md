# Baixar os recortes das cavas do Azure Blob (no home-pc)

O preparador (`scripts/etl/cavas/preparador-cavas.sh`), rodando na VM do Azure
pelo workflow `cavas-preparador.yml`, sobe **um tar por rodada** com os recortes
e o manifesto para o **Azure Blob**:

- Conta: `cpdados4751`
- Container: `cavas`
- Blobs: `recortes-AAAAMMDD-HHMM.tgz` e `manifesto-AAAAMMDD-HHMM.json`

O `home-pc` baixa quando quiser (a VM pode estar desligada — o Blob guarda).

## Listar o que existe

```powershell
$sa = "cpdados4751"
$key = az storage account keys list -g cp-app -n $sa --query "[0].value" -o tsv
az storage blob list --account-name $sa -c cavas --account-key $key `
  --query "[].{nome:name, mb:properties.contentLength}" -o table
```

## Baixar a rodada mais recente

```powershell
$sa = "cpdados4751"
$key = az storage account keys list -g cp-app -n $sa --query "[0].value" -o tsv
$nome = az storage blob list --account-name $sa -c cavas --account-key $key `
  --query "sort_by([?contains(name,'recortes-')], &name)[-1].name" -o tsv
az storage blob download --account-name $sa -c cavas -n $nome `
  -f ".\recortes.tgz" --account-key $key
tar -xzf .\recortes.tgz   # vira a pasta recortes/ para o treino na GPU
```

O `manifesto-*.json` (leve) pode ir para `apps/web/data/cavas-calibracao-manifesto.json`
quando você quiser versionar a rodada.

## Notas

- O preparador NAO guarda a chave da conta na VM: ele recebe um **SAS de 3 h**
  (create/write) gerado pelo workflow. Por isso a chave e usada so aqui, no PC.
- Custo: centavos/mes (ver a conversa de orcamento). Egress dos recortes cabe
  na franquia gratuita de 100 GB/mes.
- Os recortes ficam **fora do git** — o cache e `scripts/.cache/cavas-calibracao/`
  (gitignored). O que entra no repo e so o manifesto.
