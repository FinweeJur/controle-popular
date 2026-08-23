import { ChatbotIaLaboratorio } from "@/app/components/ChatbotIa";

/**
 * Pagina de laboratorio do chatbot IA com RAG local.
 *
 * Nao e uma rota publicada do portal: e um ambiente de teste para validar
 * o pipeline de embeddings + geracao + citacao antes de integrar como
 * degrau 3 do assistente.
 */
export const metadata = {
  title: "Assistente IA — laboratorio | Controle Popular",
  description: "Prova de conceito de chatbot com RAG local sobre normas federais ambientais.",
};

export default function AssistenteIaLabPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-2xl font-bold text-text">Laboratorio do chatbot IA</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-soft">
        Esta pagina so funciona em <code>next dev</code> com o Ollama local rodando
        em <code>http://localhost:11434</code>. O objetivo e testar o pipeline de
        RAG (busca por similaridade + geracao + citacao) antes de decidir o
        deploy em producao.
      </p>

      <div className="mt-8">
        <ChatbotIaLaboratorio />
      </div>
    </main>
  );
}
