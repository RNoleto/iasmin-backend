import { Request, Response } from 'express';
import { generateAudio } from '../services/geminiService';

export const sendAudio = async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ error: 'Texto é obrigatório' });
    return;
  }

  try {
    // Limpa o texto de asteriscos (ações) para não ler "risos" em voz alta de forma estranha
    // Ex: "Oi *sorriso*" vira apenas "Oi"
    const cleanText = text.replace(/\*.*?\*/g, '').trim();

    if (!cleanText) {
        res.status(400).json({ error: 'Texto vazio após limpeza' });
        return;
    }

    const audioBase64 = await generateAudio(cleanText);

    if (audioBase64) {
      res.json({ audio: audioBase64 });
    } else {
      res.status(500).json({ error: "Falha ao gerar áudio" });
    }

  } catch (error) {
    console.error("Erro no controller de áudio:", error);
    res.status(500).json({ error: 'Erro interno' });
  }
};