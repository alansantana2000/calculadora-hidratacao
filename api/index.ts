import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do pool de conexão com o PostgreSQL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
  : {
      host: process.env.SQL_HOST || process.env.PGHOST || 'localhost',
      port: Number(process.env.SQL_PORT || process.env.PGPORT) || 5432,
      user: process.env.SQL_USER || process.env.PGUSER || 'postgres',
      password: process.env.SQL_PASSWORD || process.env.PGPASSWORD || 'postgres',
      database: process.env.SQL_DB_NAME || process.env.PGDATABASE || 'postgres',
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Estado de conexão do PostgreSQL
let isPostgresConnected = false;

// Fallback em memória para garantir funcionamento e testes mesmo sem PostgreSQL local iniciado
interface FeedbackRecord {
  id: number;
  nome: string;
  feedback: string;
  data_acesso: string;
  horario_acesso: string;
  created_at: string;
}

const memoryFeedbacks: FeedbackRecord[] = [
  {
    id: 1,
    nome: 'Mariana Silva',
    feedback: 'Excelente calculadora! A meta diária foi muito clara e prática.',
    data_acesso: '11/10/2026',
    horario_acesso: '09:14:22',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    nome: 'Carlos Eduardo',
    feedback: 'Gostei muito da divisão em turnos e das dicas de hidratação.',
    data_acesso: '11/10/2026',
    horario_acesso: '10:45:08',
    created_at: new Date().toISOString(),
  },
];

// Inicialização da tabela no PostgreSQL
async function initDatabase() {
  try {
    const client = await pool.connect();
    isPostgresConnected = true;
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso.');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS acessos_feedback (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        feedback TEXT NOT NULL,
        data_acesso VARCHAR(20) NOT NULL,
        horario_acesso VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);
    console.log('✅ Tabela "acessos_feedback" verificada/criada no PostgreSQL.');
    client.release();
  } catch (err: any) {
    isPostgresConnected = false;
    console.warn('⚠️ PostgreSQL não está acessível no momento:', err.message);
    console.log('ℹ️ Operando com repositório em memória para desenvolvimento e testes.');
  }
}

// Inicia a checagem da base de dados
initDatabase();

/* ==========================================
   ROTAS DE API DO BACKEND
========================================== */

/**
 * POST /api/feedback
 */
app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { nome, feedback } = req.body;

    if (!nome || !feedback) {
      return res.status(400).json({ error: 'Os campos "nome" e "feedback" são obrigatórios.' });
    }

    const agora = new Date();
    const data_acesso = req.body.data_acesso || `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
    const horario_acesso = req.body.horario_acesso || `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;

    // 🔥 MUDA AQUI: Ignora o isPostgresConnected e força o servidor a esperar pelo Banco de Dados!
    if (connectionString) {
      const insertQuery = `
        INSERT INTO acessos_feedback (nome, feedback, data_acesso, horario_acesso)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome, feedback, data_acesso, horario_acesso, created_at;
      `;
      // O pool.query obriga o Vercel a aguardar a conexão ao Neon
      const result = await pool.query(insertQuery, [nome.trim(), feedback.trim(), data_acesso, horario_acesso]);

      return res.status(201).json({
        success: true,
        message: 'Feedback enviado com sucesso para o PostgreSQL!',
        data: result.rows[0],
      });
    } else {
      // Fallback em memória (só usado se estiver a testar localmente sem banco)
      const novoRegistro: FeedbackRecord = {
        id: memoryFeedbacks.length > 0 ? Math.max(...memoryFeedbacks.map((f) => f.id)) + 1 : 1,
        nome: nome.trim(),
        feedback: feedback.trim(),
        data_acesso,
        horario_acesso,
        created_at: new Date().toISOString(),
      };
      memoryFeedbacks.unshift(novoRegistro);
      return res.status(201).json({ success: true, message: 'Enviado para a memória', data: novoRegistro });
    }
  } catch (err: any) {
    console.error('Erro ao inserir feedback:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao gravar feedback.', details: err.message });
  }
});

/**
 * GET /api/feedbacks
 */
app.get('/api/feedbacks', async (_req: Request, res: Response) => {
  try {
    // 🔥 MUDA AQUI: Força a consulta direta ao Banco de Dados
    if (connectionString) {
      const selectQuery = `
        SELECT id, nome, feedback, data_acesso, horario_acesso, created_at
        FROM acessos_feedback
        ORDER BY id DESC;
      `;
      const result = await pool.query(selectQuery);
      return res.json(result.rows);
    } else {
      return res.json(memoryFeedbacks);
    }
  } catch (err: any) {
    console.error('Erro ao consultar feedbacks:', err);
    return res.status(500).json({ error: 'Erro ao consultar feedbacks no banco de dados.', details: err.message });
  }
});

// Rota para a página de Dashboard separada
app.get(['/dashboard', '/dashboard.html'], (_req: Request, res: Response) => {
  const dashboardPath = path.resolve(__dirname, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    return res.sendFile(dashboardPath);
  }
  return res.status(404).send('Página dashboard.html não encontrada.');
});

// Integração com Vite (desenvolvimento vs produção)
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Full-Stack rodando na porta ${PORT} (http://localhost:${PORT})`);
    console.log(`📊 Dashboard disponível em: http://localhost:${PORT}/dashboard.html`);
  });
}

// Inicia servidor apenas fora do ambiente serverless Vercel
if (!process.env.VERCEL) {
  setupVite();
}

export default app;
