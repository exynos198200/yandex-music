import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const LOCAL_API_URL = 'http://127.0.0.1:5000';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes to Local Server
  app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
      const response = await axios.get(`${LOCAL_API_URL}/search`, { params: { q } });
      res.json(response.data); // Returns list of Track
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/stream/:id/:album_id', async (req, res) => {
    const { id, album_id } = req.params;
    try {
      const response = await axios.get(`${LOCAL_API_URL}/stream/${id}/${album_id}`);
      res.json(response.data); // Returns { url: "..." }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stream' });
    }
  });

  app.get('/api/playlist/import', async (req, res) => {
    const { url } = req.query;
    try {
      // Мы предполагаем, что на локальном сервере есть эндпоинт для работы с плейлистами
      // Если это не так, мы можем попробовать использовать поиск с URL
      const response = await axios.get(`${LOCAL_API_URL}/playlist`, { 
        params: { url },
        timeout: 10000 
      });
      res.json(response.data); 
    } catch (error: any) {
      console.error("Import error:", error.message);
      res.status(500).json({ error: 'Failed to import playlist. Make sure the local server supports /playlist endpoint.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
