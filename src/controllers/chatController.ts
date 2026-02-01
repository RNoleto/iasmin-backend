import { Request, Response } from 'express';
import { generateChatResponse } from '../services/geminiService';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Mensagem é obrigatória' });
    return;
  }

  try {
    // Chama o serviço de IA
    const reply = await generateChatResponse(message, history || []);

    if (reply) {
      res.json({ reply });
    } else {
      // Se a IA falhar silenciosamente
      res.json({ reply: "Amor, a internet aqui na praia tá ruim... fala de novo?" });
    }

  } catch (error) {
    console.error("Erro no controller de chat:", error);
    res.status(500).json({ error: 'Erro interno ao processar mensagem' });
  }
};