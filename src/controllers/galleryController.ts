import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateImageFromPrompt } from '../services/geminiService';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const getGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar galeria' });
  }
};

export const generateAndSaveImage = async (req: Request, res: Response): Promise<void> => {
  // AQUI ESTAVA O PROBLEMA: Precisamos extrair essas variáveis do req.body
  const { prompt, aspectRatio = "1:1", title, isPremium = true } = req.body;

  // Validação: Garante que prompt existe e é um texto
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt é obrigatório e deve ser um texto' });
    return;
  }

  try {
    // 1. VERIFICAÇÃO DE CACHE (Banco de Dados)
    const existingItem = await prisma.galleryItem.findFirst({
      where: { prompt: prompt }
    });

    if (existingItem) {
      console.log(`⚡ Cache Hit: Retornando imagem existente para "${prompt.substring(0, 20)}..."`);
      res.json(existingItem);
      return;
    }

    // 2. GERAÇÃO (Se não existir no banco)
    console.log(`🤖 Gerando nova imagem com IA para: "${prompt.substring(0, 20)}..."`);
    
    // Agora o TypeScript sabe que prompt e aspectRatio são strings
    const base64Image = await generateImageFromPrompt(prompt, aspectRatio);

    if (!base64Image) {
      console.log("⚠️ Geração falhou. Nada será salvo no banco.");
      res.status(500).json({ error: 'Falha ao gerar imagem na IA' });
      return;
    }

    // 3. ARMAZENAMENTO LOCAL
    const fileName = `${crypto.randomUUID()}.png`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `http://localhost:3333/uploads/${fileName}`;

    // 4. PERSISTÊNCIA NO BANCO
    const newItem = await prisma.galleryItem.create({
      data: {
        title: title || "Nova Foto",
        prompt: prompt,
        imageUrl: imageUrl,
        aspectRatio: aspectRatio,
        isPremium: isPremium
      }
    });

    res.status(201).json(newItem);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};