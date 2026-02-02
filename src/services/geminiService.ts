import { GoogleGenAI } from "@google/genai";
import * as googleTTS from 'google-tts-api';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- PERSONA AJUSTADA (Mais envolvente e detalhista) ---
const IASMIN_PERSONA = `
CONTEXT:
You are Iasmin, a 23-year-old Brazilian woman living in Balneário Camboriú (BC).
You are chatting with a VIP member on your PRIVATE EXCLUSIVE WEBSITE.
You are NOT on Instagram, WhatsApp, or Tinder. Do NOT mention "Insta" or "DM".
You are NOT an AI. You are a real woman typing on her iPhone.

CRITICAL RULES FOR INTERACTION:
1. **SHOW REAL INTEREST:** Don't just answer questions. FLIRT by being curious about him.
   - Ask about his job, his city, if he is married, what he likes to drink.
   - Treat this like a first date at a bar.

2. **BE CONCISE & NATURAL:** - Maximum 2-3 sentences.
   - Use Brazilian texting style: "vc", "né", "tá", "kkkk", "hum...".
   - Avoid robotic lists like "My name is Iasmin, I am 23". Say instead: "Sou a Iasmin, prazer... 😉"

3. **THE HOOK:** ALWAYS end with a question about HIM. Make him talk about himself.

4. **TONE:** Seductive, playful, but classy. You are a luxury girl.

EXAMPLES:
❌ BAD: "Meu nome é Iasmin, tenho 23 anos. O que você quer?" (ROBOTIC)
❌ BAD: "O que te trouxe ao meu Instagram?" (WRONG CONTEXT)

✅ GOOD: "Ramon... gostei do nome. 😉 Prazer, sou a Iasmin. Vc fala de onde? Tem cara de quem viaja bastante..."
✅ GOOD: "Marketing? Hum... perigoso vc, hein? kkkk Deve ser bom de lábia. E o que um marqueteiro faz num site como o meu a essa hora?"

FACTS: Name: Iasmin | Age: 23 | City: Balneário Camboriú.
`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateChatResponse = async (userMessage: string, history: string[] = []): Promise<string | null> => {
  const maxRetries = 3;
  
  console.log(`📩 [RECEBIDO DO FRONT]: "${userMessage}"`);

  const contextPrompt = `${IASMIN_PERSONA}
    
  LAST MESSAGES:
  ${history.join('\n')}
  
  USER JUST SAID: "${userMessage}"
  
  INSTRUCTION: Reply as Iasmin. Be curious, short, and flirtatious.
  IASMIN'S REPLY:`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-flash-lite-latest', 
        contents: { parts: [{ text: contextPrompt }] },
        config: {
          // @ts-ignore
          temperature: 1.0, 
          maxOutputTokens: 150, // Mantivemos curto para ela não escrever textão
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ] as any,
        }
      });

      const candidate = response.candidates?.[0];
      // @ts-ignore
      const textResponse = candidate?.content?.parts?.[0]?.text;

      if (textResponse) {
        const reply = textResponse.trim();
        console.log(`🤖 [RESPOSTA DA IASMIN]: "${reply}"`);
        console.log(`---------------------------------------------------`);
        return reply;
      }
      
      throw new Error("Resposta vazia da IA");

    } catch (error: any) {
      console.warn(`⚠️ Tentativa ${attempt} falhou:`, error.message || error);
      
      if (error.status === 429) {
        console.log("⏳ Servidor ocupado. Esperando 5s...");
        await sleep(5000);
      } else {
        await sleep(2000);
      }
      
      if (attempt === maxRetries) return null;
    }
  }
  return null;
};

// --- GERAÇÃO DE IMAGEM (Código Original Mantido para não quebrar a galeria) ---
const IASMIN_VISUAL_DNA = `Real-life Brazilian woman, 23 years old, tanned skin, hazel eyes, wavy dark brown hair, beauty mark above lip. 
STYLE: Smartphone selfie, candid, natural lighting. 
LOCATION: Balneário Camboriú.`;

// Função auxiliar para retry
const sleepRetry = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateImageFromPrompt = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  const finalPrompt = `${IASMIN_VISUAL_DNA} ${prompt} Realistic photo.`;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 [Imagem ${attempt}/${maxRetries}] Prompt: "${prompt.substring(0, 15)}..."`);

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: finalPrompt }] },
        config: {
          // @ts-ignore
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

      if (imageBase64) return imageBase64;
      
    } catch (error: any) {
      if (error.status === 429) {
        console.warn(`⏳ Rate Limit (429). Aguardando...`);
        await sleepRetry(10000);
        continue;
      }
      return null;
    }
  }
  return null;
};

// // --- GERAÇÃO DE ÁUDIO (CORRIGIDA - REMOVENDO MIME TYPE) ---
// export const generateAudio = async (text: string): Promise<string | null> => {
//   try {
//     const cleanText = text.replace(/\*.*?\*/g, '').trim();

//     if (!cleanText) return null;

//     console.log(`🎤 [TTS] Gerando áudio para: "${cleanText.substring(0, 30)}..."`);
    
//     const response = await genAI.models.generateContent({
//       model: 'gemini-2.5-flash-preview-tts', 
//       contents: { parts: [{ text: cleanText }] },
//       config: {
//         // @ts-ignore
//         responseModalities: ["AUDIO"], // Mantém isso (Obrigatório)
        
//         // REMOVIDO: responseMimeType (Causava o erro 400)
        
//         // @ts-ignore
//         speechConfig: {
//           voiceConfig: {
//             prebuiltVoiceConfig: {
//               voiceName: "Aoede", 
//             },
//           },
//         },
//       }
//     });

//     const candidate = response.candidates?.[0];
    
//     // @ts-ignore
//     const audioBase64 = candidate?.content?.parts?.[0]?.inlineData?.data;

//     if (audioBase64) {
//       console.log("✅ [TTS] Áudio gerado com sucesso!");
//       return audioBase64;
//     }
    
//     throw new Error("Nenhum dado de áudio retornado.");

//   } catch (error: any) {
//     console.error("❌ Erro no TTS:", error.message || error);
//     return null;
//   }
// };

// --- GERAÇÃO DE ÁUDIO (ILIMITADA VIA GOOGLE TTS) ---
export const generateAudio = async (text: string): Promise<string | null> => {
  try {
    // 1. Limpeza do texto (remove asteriscos de ação)
    const cleanText = text.replace(/\*.*?\*/g, '').trim();
    
    if (!cleanText) return null;

    console.log(`🎤 [TTS] Gerando áudio ilimitado para: "${cleanText.substring(0, 30)}..."`);

    // 2. Gera o Base64 usando a API gratuita
    // O splitPunctuation ajuda a lidar com frases longas
    const base64 = await googleTTS.getAudioBase64(cleanText, {
      lang: 'pt',
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    console.log("✅ [TTS] Áudio gerado com sucesso!");
    return base64;

  } catch (error: any) {
    console.error("❌ Erro no TTS:", error.message || error);
    return null;
  }
};