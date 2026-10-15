// bots/whatsapp/main.go — Bot WhatsApp via whatsmeow, bridge para o Hermes Agent.
//
// Ouve mensagens em grupos e chats diretos, filtra por números autorizados,
// grava em logs/whatsapp-inbox.jsonl e lê respostas de logs/whatsapp-outbox.jsonl.
//
// Env vars (em scripts/.env ou processo):
//   WHATSAPP_GROUP_JID       — JID(s) do(s) grupo(s) (ex: 1234567890-1234567890@g.us)
//   WHATSAPP_ALLOWED_NUMBERS — números (país+DDD sem formatação) autorizados a comandar
//   WHATSAPP_BOT_NUMBER      — número do bot (ex: 553182377181) para detectar menções
//   WHATSAPP_STORE_PATH      — caminho do SQLite store (default: bots/whatsapp/store.db)
//
// Uso:
//   go run ./bots/whatsapp/                 # inicia o bot (QR code na primeira vez)
//   go run ./bots/whatsapp/ --pair-code 553182377181  # código pra digitar no app
//   go run ./bots/whatsapp/ --list-groups   # lista grupos (para achar o JID)
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/skip2/go-qrcode"
	_ "modernc.org/sqlite"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
)

const (
	envPath        = "scripts/.env"
	defaultStorePath = "bots/whatsapp/store.db"
	qrPath         = "bots/whatsapp/qr-code.png"
	inboxPath      = "logs/whatsapp-inbox.jsonl"
	outboxPath     = "logs/whatsapp-outbox.jsonl"
	sentLog        = "logs/whatsapp-outbox-sent.jsonl"
	offsetFile     = "bots/whatsapp/.whatsapp-outbox-offset"
)

// whatsappInboxEntry é o formato gravado no inbox JSONL.
type whatsappInboxEntry struct {
	RecebidoEm string `json:"recebido_em"`
	ID         string `json:"id"`
	Grupo      string `json:"grupo"`
	De         string `json:"de"`
	Numero     string `json:"numero"`
	Texto      string `json:"texto"`
	IsGroup    bool   `json:"is_group"`
}

// whatsappOutboxEntry é o formato lido do outbox JSONL.
type whatsappOutboxEntry struct {
	Texto string `json:"texto"`
	Grupo string `json:"grupo"`
}

func carregarEnv() {
	f, err := os.Open(envPath)
	if err != nil {
		return
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), "\"")
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

func appendJSONL(path string, data []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("mkdir %s: %w", dir, err)
	}
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.Write(append(data, '\n'))
	return err
}

// grupoAlvo retorna a lista de JIDs de grupos alvo.
func grupoAlvo() ([]types.JID, error) {
	raw := os.Getenv("WHATSAPP_GROUP_JID")
	if raw == "" {
		return nil, fmt.Errorf("WHATSAPP_GROUP_JID não definido em scripts/.env")
	}
	var jids []types.JID
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		jid, err := types.ParseJID(part)
		if err != nil {
			return nil, fmt.Errorf("JID inválido '%s': %w", part, err)
		}
		jids = append(jids, jid)
	}
	return jids, nil
}

// allowedNumbers retorna o set de números autorizados.
func allowedNumbers() map[string]bool {
	raw := os.Getenv("WHATSAPP_ALLOWED_NUMBERS")
	if raw == "" {
		return map[string]bool{}
	}
	m := make(map[string]bool)
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			m[part] = true
		}
	}
	return m
}

// botNumber retorna o número do bot (ex: 553182377181).
func botNumber() string {
	return os.Getenv("WHATSAPP_BOT_NUMBER")
}

// isMencionado verifica se o bot foi mencionado na mensagem do grupo.
func isMencionado(msg *events.Message) bool {
	botNum := botNumber()
	if botNum == "" {
		return true
	}
	// Verifica menções no ExtendedTextMessage
	if ext := msg.Message.GetExtendedTextMessage(); ext != nil {
		ctxInfo := ext.GetContextInfo()
		for _, jid := range ctxInfo.GetMentionedJID() {
			if strings.Contains(jid, botNum) {
				return true
			}
		}
	}
	// Fallback: verifica se o texto menciona o número
	texto := msg.Message.GetConversation()
	if texto == "" {
		texto = msg.Message.GetExtendedTextMessage().GetText()
	}
	return strings.Contains(texto, botNum)
}

// gerarQR salva a imagem do QR code e retorna o caminho.
func gerarQR(data string) (string, error) {
	png, err := qrcode.Encode(data, qrcode.Medium, 512)
	if err != nil {
		return "", fmt.Errorf("encode QR: %w", err)
	}
	if err := os.WriteFile(qrPath, png, 0644); err != nil {
		return "", err
	}
	return qrPath, nil
}

// listarGrupos lista todos os grupos que o bot participa.
func listarGrupos(client *whatsmeow.Client) error {
	if !client.WaitForConnection(15 * time.Second) {
		return fmt.Errorf("timeout esperando conexão")
	}
	groups, err := client.GetJoinedGroups(context.Background())
	if err != nil {
		return fmt.Errorf("erro listando grupos: %w", err)
	}
	fmt.Println("┌─────────────────────────────────────────────────────────────")
	fmt.Println("│ Grupos disponíveis para o bot:")
	fmt.Println("├─────────────────────────────────────────────────────────────")
	for _, g := range groups {
		name := g.Name
		if name == "" {
			name = "(sem nome)"
		}
		fmt.Printf("│ • %-30s %s\n", truncate(name, 30), g.JID.String())
	}
	fmt.Println("└─────────────────────────────────────────────────────────────")
	fmt.Println("\nCopie um JID acima e cole em WHATSAPP_GROUP_JID em scripts/.env")
	return nil
}

// lerOutbox lê linhas do outbox a partir do offset.
func lerOutbox(offset int64) ([]whatsappOutboxEntry, error) {
	f, err := os.Open(outboxPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	var entries []whatsappOutboxEntry
	lineNum := int64(0)
	for scanner.Scan() {
		lineNum++
		if lineNum <= offset {
			continue
		}
		var entry whatsappOutboxEntry
		if err := json.Unmarshal(scanner.Bytes(), &entry); err != nil {
			continue
		}
		if entry.Texto == "" {
			continue
		}
		entries = append(entries, entry)
	}
	return entries, nil
}

// pollOutbox lê respostas do outbox e envia via WhatsApp.
func pollOutbox(client *whatsmeow.Client, grupos []types.JID, stop <-chan struct{}, wg *sync.WaitGroup) {
	defer wg.Done()
	offset := int64(0)
	if data, err := os.ReadFile(offsetFile); err == nil {
		if n, err := strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64); err == nil {
			offset = n
		}
	}
	ctx := context.Background()
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			entries, err := lerOutbox(offset)
			if err != nil {
				continue
			}
			for _, entry := range entries {
				jid := grupos[0]
				if entry.Grupo != "" {
					if parsed, err := types.ParseJID(entry.Grupo); err == nil {
						jid = parsed
					}
				}
				msg := &waE2E.Message{Conversation: proto.String(entry.Texto)}
				resp, err := client.SendMessage(ctx, jid, msg)
				if err != nil {
					fmt.Printf("❌ Erro ao enviar: %v\n", err)
					continue
				}
				fmt.Printf("📤 Enviado para %s: %s\n", jid.String(), truncate(entry.Texto, 80))
				sentEntry := map[string]any{
					"enviado_em": time.Now().Format(time.RFC3339),
					"para":       jid.String(),
					"id":         string(resp.ID),
					"texto":      entry.Texto,
				}
				if data, err := json.Marshal(sentEntry); err == nil {
					appendJSONL(sentLog, data)
				}
				offset++
				os.WriteFile(offsetFile, []byte(strconv.FormatInt(offset, 10)), 0644)
			}
		case <-stop:
			return
		}
	}
}

// handleMessage processa uma mensagem recebida.
func handleMessage(msg *events.Message, client *whatsmeow.Client, grupos []types.JID, allowed map[string]bool) {
	if msg.Info.IsFromMe {
		return
	}

	chat := msg.Info.Chat
	sender := msg.Info.Sender
	senderNum := sender.User
	isGroup := chat.Server == types.GroupServer

	// Resolve LID → telefone (WhatsApp manda LID em vez de número)
	if !isGroup && sender.Server == types.HiddenUserServer {
		if pnr, err := client.Store.LIDs.GetPNForLID(context.Background(), sender); err == nil {
			senderNum = pnr.User
		}
	}

	// Filtra: grupo ou DM
	if isGroup {
		// Em grupo: verifica se é grupo alvo E mencionou o bot
		isTargetGroup := false
		for _, g := range grupos {
			if chat == g {
				isTargetGroup = true
				break
			}
		}
		if !isTargetGroup {
			return
		}
		if !isMencionado(msg) {
			return
		}
		// Se allowedNumbers não está vazio, verifica se o remetente é autorizado
		if len(allowed) > 0 && !allowed[senderNum] {
			return
		}
	} else {
		// DM: verifica se número é autorizado
		if len(allowed) > 0 && !allowed[senderNum] {
			fmt.Printf("🔒 Mensagem ignorada de %s (não autorizado)\n", senderNum)
			return
		}
	}

	// Extrai texto
	texto := msg.Message.GetConversation()
	if texto == "" {
		texto = msg.Message.GetExtendedTextMessage().GetText()
	}
	if texto == "" {
		texto = "[mensagem não-texto]"
	}

	// Formata remetente
	de := msg.Info.PushName
	if de == "" {
		de = senderNum
	} else {
		de = fmt.Sprintf("%s (%s)", de, senderNum)
	}

	entry := whatsappInboxEntry{
		RecebidoEm: time.Now().Format(time.RFC3339),
		ID:         string(msg.Info.ID),
		Grupo:      chat.String(),
		De:         de,
		Numero:     senderNum,
		Texto:      texto,
		IsGroup:    isGroup,
	}
	if data, err := json.Marshal(entry); err == nil {
		if err := appendJSONL(inboxPath, data); err != nil {
			fmt.Printf("❌ Erro gravando inbox: %v\n", err)
		}
	}
	fmt.Printf("📩 [%s] %s: %s\n", entry.RecebidoEm, de, truncate(texto, 120))

	// Envia acknowledgment
	ackMsg := &waE2E.Message{Conversation: proto.String("✅ Recebi sua mensagem! Anotei aqui e já resolvo. 📋")}
	go func() {
		if _, err := client.SendMessage(context.Background(), chat, ackMsg); err != nil {
			fmt.Printf("❌ Erro no ack: %v\n", err)
		}
	}()
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

func mapKeys(m map[string]bool) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func main() {
	carregarEnv()

	listGroups := false
	pairPhone := ""
	args := os.Args[1:]
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--list-groups":
			listGroups = true
		case "--pair-code":
			if i+1 < len(args) {
				i++
				pairPhone = args[i]
			} else {
				fmt.Println("Uso: --pair-code <número-do-telefone>")
				os.Exit(1)
			}
		}
	}

	grupos, err := grupoAlvo()
	if err != nil {
		fmt.Println("⚠️  " + err.Error())
		fmt.Println("💡 Use --list-groups para ver os grupos disponíveis (após o pairing).")
		fmt.Println("💡 Ou defina WHATSAPP_GROUP_JID no scripts/.env")
	}
	allowed := allowedNumbers()

	storePathVal := os.Getenv("WHATSAPP_STORE_PATH")
	if storePathVal == "" {
		storePathVal = defaultStorePath
	}

	ctx := context.Background()
	database, err := sqlstore.New(ctx, "sqlite", fmt.Sprintf("file:%s?_foreign_keys=true&_busy_timeout=30000", storePathVal), nil)
	if err != nil {
		fmt.Printf("❌ Erro ao abrir store: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	device, err := database.GetFirstDevice(ctx)
	if err != nil {
		fmt.Printf("❌ Erro ao obter dispositivo: %v\n", err)
		os.Exit(1)
	}

	// Logger nulo — mantém silencioso, logs via stdout
	client := whatsmeow.NewClient(device, nil)

	// Channel pra detectar completion via PairSuccess event
	pairingDone := make(chan struct{})

	// Handler de eventos
	client.AddEventHandler(func(evt interface{}) {
		switch e := evt.(type) {
		case *events.Message:
			isGroupMsg := e.Info.Chat.Server == types.GroupServer
			if grupos != nil || !isGroupMsg {
				handleMessage(e, client, grupos, allowed)
			} else {
				texto := e.Message.GetConversation()
				if texto == "" {
					texto = e.Message.GetExtendedTextMessage().GetText()
				}
				fmt.Printf("📩 [debug] %s: %s\n", e.Info.Chat.String(), truncate(texto, 100))
			}
		case *events.PairSuccess:
			fmt.Println("✅ Pairing concluído! JID:", e.ID, "Platform:", e.Platform)
			close(pairingDone)
		case *events.Disconnected:
			fmt.Println("🔄 Desconectado, reconectando em 5s...")
			time.Sleep(5 * time.Second)
			go client.Connect()
		case *events.Connected:
			fmt.Println("🔗 Conectado ao WhatsApp")
		}
	})

	if listGroups {
		fmt.Println("🔗 Conectando ao WhatsApp (sessão salva no store)...")
		go client.Connect()
		if !client.WaitForConnection(15 * time.Second) {
			fmt.Println("❌ Timeout conectando — pairing necessário. Rode sem --list-groups primeiro.")
			os.Exit(1)
		}
		if err := listarGrupos(client); err != nil {
			fmt.Printf("❌ Erro: %v\n", err)
			os.Exit(1)
		}
		client.Disconnect()
		return
	}

	// Check se já emparelado usando o device do store (não IsLoggedIn — só seta após Connect)
	alreadyPaired := device != nil && device.ID != nil && device.ID.User != ""
	if pairPhone != "" {
		fmt.Printf("📱 Gerando código de emparelhamento para %s...\n", pairPhone)
		// GetQRChannel deve ser chamado ANTES de Connect (whatsmeow requirement)
		qrChan, err := client.GetQRChannel(context.Background())
		if err != nil {
			fmt.Printf("❌ Erro ao iniciar: %v\n", err)
			os.Exit(1)
		}
		go client.Connect()
		// Drain QR channel em background — pairing response via PairSuccess handler
		go func() {
			for evt := range qrChan {
				fmt.Printf("  [QR evento: %s]\n", evt.Event)
			}
		}()
		fmt.Println("📶 Conectando ao WhatsApp...")
		time.Sleep(3 * time.Second)
		code, err := client.PairPhone(ctx, pairPhone, false, whatsmeow.PairClientChrome, "Chrome (Windows)")
		if err != nil {
			fmt.Printf("❌ Erro no pair code: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("📱 Código de emparelhamento: %s\n", code)
		fmt.Println("   1. Abra WhatsApp no celular")
		fmt.Println("   2. Settings → Linked Devices → Enter Code")
		fmt.Println("   3. Digite o código acima")
		fmt.Println("   Pode levar alguns segundos para o pairing completar...")

		// Wait for PairSuccess event (or timeout 160s — pair code validity)
		select {
		case <-pairingDone:
			fmt.Println("✅ Pairing concluído! Store salvo.")
		case <-time.After(160 * time.Second):
			fmt.Println("⏰ Timeout do pairing (160s)")
			client.Disconnect()
			os.Exit(1)
		}
	} else if !alreadyPaired {
		qrChan, err := client.GetQRChannel(context.Background())
		if err != nil {
			fmt.Printf("❌ Erro ao iniciar QR channel: %v\n", err)
			os.Exit(1)
		}
		go client.Connect()
		fmt.Println("📱 Aguarde — QR Code sendo gerado...")
		go func() {
			for evt := range qrChan {
				switch {
				case evt.Event == whatsmeow.QRChannelEventCode:
					path, err := gerarQR(evt.Code)
					if err != nil {
						fmt.Printf("❌ Erro gerando QR: %v\n", err)
						continue
					}
					fmt.Printf("📷 QR code salvo em: MEDIA:%s\n", path)
					fmt.Printf("   Escaneie com o WhatsApp no celular (válido por %.0fs)\n", evt.Timeout.Seconds())
				case evt.Event == whatsmeow.QRChannelEventError:
					fmt.Printf("❌ Erro no pairing: %v\n", evt.Error)
				case evt.Event == "success":
					fmt.Println("✅ Pairing concluído!")
				case evt.Event == "timeout":
					fmt.Println("⏰ Timeout no pairing — execute de novo")
				}
			}
		}()
	} else {
		fmt.Println("🔑 Já emparelhado — conectando...")
		go client.Connect()
		// Fetch LID mappings for allowed numbers (para resolver LIDs em DMs)
		go func() {
			if !client.WaitForConnection(15 * time.Second) {
				return
			}
			var jids []types.JID
			for _, num := range mapKeys(allowed) {
				if jid, err := types.ParseJID(num); err == nil {
					jids = append(jids, jid)
				}
			}
			if len(jids) > 0 {
				client.GetUserInfo(ctx, jids)
				fmt.Println("📋 LIDs mapeados para contatos autorizados")
			}
			// Fetch group metadata for target groups (sync "Trenzim" etc)
			for _, g := range grupos {
				if info, err := client.GetGroupInfo(ctx, g); err == nil {
					fmt.Printf("👥 Grupo sincronizado: %s (%s)\n", info.Name, g.String())
				} else {
					fmt.Printf("⚠️  Não foi sincronizar grupo %s: %v\n", g.String(), err)
				}
			}
		}()
	}

	// Inicia poller de outbox
	var wg sync.WaitGroup
	stopOutbox := make(chan struct{})
	if grupos != nil {
		wg.Add(1)
		go pollOutbox(client, grupos, stopOutbox, &wg)
	}

	// Heartbeat
	var heartbeatCount int64
	go func() {
		t := time.NewTicker(30 * time.Second)
		defer t.Stop()
		for range t.C {
			if client.IsLoggedIn() {
				count := atomic.AddInt64(&heartbeatCount, 1)
				fmt.Printf("💓 whatsapp-bot: vivo (%d) - conectado\n", count)
			}
		}
	}()

	fmt.Println("🚀 Bot WhatsApp ativo. Pressione Ctrl+C para parar.")
	if len(allowed) > 0 {
		fmt.Printf("   Números autorizados: %v\n", mapKeys(allowed))
	}
	if grupos != nil {
		for _, g := range grupos {
			fmt.Printf("   Grupo alvo: %s\n", g.String())
		}
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	close(stopOutbox)
	wg.Wait()
	client.Disconnect()
	fmt.Println("\n👋 Bot WhatsApp desconectado.")
}
