import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Puxa a variável correta do Vercel
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// 2. Configura a ligação com SSL obrigatório para o Neon
const poolConfig = connectionString
  ? { connectionString, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.SQL_HOST || 'localhost',
      port: Number(process.env.SQL_PORT) || 5432,
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || 'postgres',
      database: process.env.SQL_DB_NAME || 'postgres',
    };

const pool = new Pool(poolConfig);

// Removemos o "isPostgresConnected" e o "initDatabase()" porque em Serverless (Vercel)
// não podemos depender de estados assíncronos globais. O sistema tem de conectar na hora!

/* ==========================================
   ROTAS DE API DO BACKEND
========================================== */

app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { nome, feedback } = req.body;

    if (!nome || !feedback) {
      return res.status(400).json({ error: 'Os campos "nome" e "feedback" são obrigatórios.' });
    }

    const agora = new Date();
    const data_acesso = req.body.data_acesso || `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
    const horario_acesso = req.body.horario_acesso || `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;

    // 3. Força SEMPRE a ligar ao banco de dados (ignorando a memória temporária)
    if (connectionString) {
      const insertQuery = `
        INSERT INTO acessos_feedback (nome, feedback, data_acesso, horario_acesso)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome, feedback, data_acesso, horario_acesso, created_at;
      `;
      
      // O 'await' obriga o servidor a esperar que o dado entre no Neon!
      const result = await pool.query(insertQuery, [nome.trim(), feedback.trim(), data_acesso, horario_acesso]);

      return res.status(201).json({
        success: true,
        message: 'Feedback enviado com sucesso para o PostgreSQL!',
        data: result.rows[0],
      });
    } else {
      return res.status(500).json({ error: 'Servidor na nuvem está sem a variável POSTGRES_URL.' });
    }
  } catch (err: any) {
    console.error('Erro ao inserir feedback:', err);
    return res.status(500).json({ error: 'Erro ao gravar no banco de dados Neon.', details: err.message });
  }
});

app.get('/api/feedbacks', async (_req: Request, res: Response) => {
  try {
    if (connectionString) {
      const selectQuery = `
        SELECT id, nome, feedback, data_acesso, horario_acesso, created_at
        FROM acessos_feedback
        ORDER BY id DESC;
      `;
      const result = await pool.query(selectQuery);
      return res.json(result.rows);
    } else {
      return res.json([]);
    }
  } catch (err: any) {
    console.error('Erro ao consultar feedbacks:', err);
    return res.status(500).json({ error: 'Erro ao consultar o banco de dados Neon.', details: err.message });
  }
});

// Integração com Vite (para testar localmente, se necessário)
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, '../dist')));
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
}

if (!process.env.VERCEL) {
  setupVite();
}

export default app;