import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  console.log("🔍 Verificando modelos disponíveis para sua chave...");
  
  try {
    // Tenta listar os modelos (a SDK pode variar, vamos tentar listagem direta via REST se falhar)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("\n✅ Modelos encontrados:");
      data.models.forEach((m: any) => {
        // Filtra apenas modelos que parecem gerar conteúdo
        if (m.supportedGenerationMethods?.includes("generateContent")) {
            console.log(`- ${m.name.replace('models/', '')}`);
        }
      });
    } else {
      console.log("❌ Nenhum modelo encontrado ou erro de permissão.");
      console.log(data);
    }
  } catch (error) {
    console.error("❌ Erro ao listar modelos:", error);
  }
};

main();