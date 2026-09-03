import { describe, it, expect } from "vitest";

describe("geração e padronização de alertas e mensagens contextuais para WhatsApp / Redes", () => {
  it("monta mensagem estruturada com formatação do WhatsApp e links oficiais", () => {
    const tipo = "licenciamento";
    const titulo = "Pauta de Licença de Operação — Complexo Minas-Rio";
    const orgao = "Conceição do Mato Dentro, MG";
    const num = "Processo COPAM nº 0842/2026";
    const link = "https://controlepopular.com.br/ambiental/licenciamento";
    const resumo = "Reunião de julgamento da pauta na próxima terça-feira com alto potencial poluidor.";

    const emojis: Record<string, string> = {
      licenciamento: "🌿 *ALERTA DE LICENCIAMENTO AMBIENTAL*",
      contato: "📞 *CANAL INSTITUCIONAL & CONTATOS ÚTEIS*",
      contrato: "💼 *ALERTA DE CONTRATO PÚBLICO*",
    };

    const header = emojis[tipo];
    const texto = `${header}
📍 *Território / Órgão:* ${orgao}
📌 *Assunto:* ${titulo}
🔢 *Identificação Oficial:* ${num}

🔎 *Detalhes para fiscalização:*
${resumo}

🔗 *Confira o documento e os dados oficiais no portal:*
${link}`;

    expect(texto).toContain("🌿 *ALERTA DE LICENCIAMENTO AMBIENTAL*");
    expect(texto).toContain(orgao);
    expect(texto).toContain(num);
    expect(texto).toContain(link);
    expect(texto).toContain(resumo);
  });

  it("inclui telefones e contatos de denúncia quando fornecidos", () => {
    const telefones = ["Disque Denúncia: 181", "Ouvidoria MPMG: 127"];
    const bloco = `📞 *Telefones e Contatos para Acionar:*\n${telefones.map((t) => `• ${t}`).join("\n")}`;

    expect(bloco).toContain("Disque Denúncia: 181");
    expect(bloco).toContain("Ouvidoria MPMG: 127");
  });
});
