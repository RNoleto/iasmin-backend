import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { getGallery, generateAndSaveImage } from './controllers/galleryController';
import { sendMessage } from './controllers/chatController';
import { sendAudio } from './controllers/audioController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// 📂 Servir arquivos estáticos (Imagens salvas localmente)
// Isso permite acessar http://localhost:3333/uploads/imagem.png
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.get('/', (req, res) => { res.json({ status: 'Iasmin Backend Online 🌶️' }); });

// Rotas da Galeria
app.get('/api/gallery', getGallery); // Lista as fotos
app.post('/api/gallery/generate', generateAndSaveImage); // Gera ou recupera do banco

// Rota do Chat
app.post('/api/chat/message', sendMessage);
app.post('/api/audio/generate', sendAudio);

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
  console.log(`📂 Armazenamento: http://localhost:${PORT}/uploads`);
});