import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // No Vite, usamos import.meta.env.VITE_API_KEY
  // Certifique-se de adicionar VITE_API_KEY nas variáveis de ambiente do Vercel
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    console.warn("VITE_API_KEY não encontrada. Verifique suas variáveis de ambiente no Vercel.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

export const generateBusinessInsight = async (contextData: string): Promise<string> => {
  const client = getClient();

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Atue como um consultor sênior de gestão para gráficas e e-commerce.
        Analise os dados fornecidos abaixo em formato JSON e forneça um relatório conciso e acionável.
        
        DADOS DO NEGÓCIO:
        ${contextData}

        Seu relatório deve conter:
        1. Análise de Rentabilidade (Lucro vs Custos).
        2. Identificação de gargalos ou estoques críticos.
        3. 3 Sugestões práticas para aumentar a margem de lucro ou reduzir desperdício.
        4. Uma análise sobre a performance operacional se houver dados.

        Use formatação Markdown (negrito, listas) para facilitar a leitura. Seja direto.
      `,
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique se a chave VITE_API_KEY está configurada no Vercel.";
  }
};

export const suggestProductDescription = async (productName: string, materials: string[]): Promise<string> => {
    const client = getClient();
  
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Crie uma descrição curta, vendedora e otimizada para SEO de marketplace para um produto gráfico chamado "${productName}".
        Insumos usados: ${materials.join(', ')}.
        Foque em qualidade e durabilidade. Máximo 300 caracteres.`
      });
  
      return response.text || "";
    } catch (error) {
      console.error(error);
      return "";
    }
};