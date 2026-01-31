import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const IASMIN_VISUAL_DNA = `Real-life Brazilian woman, 27 years old, tanned skin, hazel eyes, wavy dark brown hair, beauty mark above lip. 
STYLE: Smartphone selfie, candid, natural lighting. 
LOCATION: Balneário Camboriú.`;

// Função auxiliar para pausar o código (Dormir)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateImageFromPrompt = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  const finalPrompt = `${IASMIN_VISUAL_DNA} ${prompt} Realistic photo.`;
  
  // Vamos tentar até 3 vezes se der erro de limite (429)
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 [Tentativa ${attempt}/${maxRetries}] Gerando: "${prompt.substring(0, 15)}..."`);

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: finalPrompt }] },
        config: {
          // "as any" corrige os erros de tipagem do TS
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ] as any,
          imageConfig: {
            // @ts-ignore
            aspectRatio: aspectRatio,
          },
        },
      });

      const candidate = response.candidates?.[0];
      // @ts-ignore
      const imageBase64 = candidate?.content?.parts?.[0]?.inlineData?.data;

      if (imageBase64) {
        console.log(`✨ [SUCESSO] Imagem gerada!`);
        return imageBase64;
      }
      
      console.error("❌ Resposta vazia da IA.");
      return null;

    } catch (error: any) {
      // Se o erro for 429 (Limite excedido), esperamos e tentamos de novo
      if (error.status === 429) {
        console.warn(`⏳ Limite da API atingido (429). Aguardando 12 segundos antes de tentar de novo...`);
        await sleep(12000); // Espera 12 segundos (o suficiente para resetar o limite por minuto)
        continue; // Volta para o início do loop
      }

      // Se for outro erro (ex: bloqueio de segurança), mostramos e paramos
      console.error("❌ [ERRO FINAL API]:", JSON.stringify(error, null, 2));
      if (error.response?.candidates?.[0]?.finishReason) {
         console.error("🚫 MOTIVO BLOQUEIO:", error.response.candidates[0].finishReason);
      }
      return null;
    }
  }

  return null;
};