import dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ ERRO: GEMINI_API_KEY não encontrada no .env");
    return;
  }

  console.log("🔍 Verificando modelos disponíveis via API direta...");
  
  try {
    // Consulta direta à API do Google sem usar a biblioteca problemática
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.models) {
      console.log("\n✅ MODELOS ENCONTRADOS (Copie um destes):");
      console.log("------------------------------------------------");
      data.models.forEach((m: any) => {
        // Mostra apenas modelos de geração de conteúdo
        if (m.supportedGenerationMethods?.includes("generateContent")) {
            console.log(`🔹 ${m.name.replace('models/', '')}`);
        }
      });
      console.log("------------------------------------------------");
    } else {
      console.log("❌ Nenhum modelo retornado.");
    }
  } catch (error) {
    console.error("❌ Falha ao verificar modelos:", error);
  }
};

main();