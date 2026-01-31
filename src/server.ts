import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3333;

// Middlewares
app.use(cors()); // Permite que o frontend React acesse este backend
app.use(express.json());

// Rota de Teste (Health Check)
app.get('/', (req, res) => {
  res.json({ status: 'Iasmin Backend Online 🌶️' });
});

// --- Futuras Rotas ---
// app.use('/api/auth', authRoutes);
// app.use('/api/gallery', galleryRoutes);
// app.use('/api/stories', storiesRoutes);

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});