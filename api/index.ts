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

    if (connectionString) {
      const insertQuery = `
        INSERT INTO acessos_feedback (nome, feedback, data_acesso, horario_acesso)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nome, feedback, data_acesso, horario_acesso, created_at;
      `;
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

// =========================================================================
// ROTA DO DASHBOARD EMBUTIDA (Resolve o problema do Vercel não ler o HTML)
// =========================================================================
app.get(['/dashboard', '/dashboard.html'], (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard Administrativo | Registos PostgreSQL</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; min-height: 100vh; display: flex; flex-direction: column; }
        header { background-color: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 1rem 1.5rem; }
        .header-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: #0f172a; }
        .brand-icon { width: 2.5rem; height: 2.5rem; border-radius: 8px; background-color: #0284c7; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .brand-info h1 { font-size: 1.25rem; font-weight: 800; margin: 0;}
        .brand-info span { font-size: 0.8rem; color: #64748b; }
        .nav-actions { display: flex; gap: 0.75rem; }
        .btn { padding: 0.55rem 1.15rem; font-size: 0.88rem; font-weight: 700; border-radius: 8px; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; font-family: inherit;}
        .btn-outline { background-color: #ffffff; border: 1px solid #cbd5e1; color: #334155; }
        .btn-success { background-color: #059669; color: white; }
        main { flex: 1; max-width: 1200px; width: 100%; margin: 0 auto; padding: 2rem 1.5rem; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
        .stats-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem 1.75rem; display: flex; align-items: center; gap: 1rem; }
        .stats-number { font-size: 2rem; font-weight: 800; color: #0284c7; }
        .table-container { background: white; border-radius: 10px; border: 2px solid #0f172a; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background: #0f172a; color: white; padding: 1rem; }
        td { padding: 1rem; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;}
        .td-nome { font-weight: 700; min-width: 180px; }
        @media print {
          header, .nav-actions, footer, .stats-card, .page-title p { display: none !important; }
          body { background: white !important; }
          .table-container { border: 2px solid black !important; }
          th { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div id="dashboardContent">
        <header>
          <div class="header-container">
            <a href="/" class="brand">
              <div class="brand-icon">📊</div>
              <div class="brand-info"><h1>Dashboard de Feedbacks</h1><span>Painel Administrativo com PostgreSQL</span></div>
            </a>
            <div class="nav-actions">
              <a href="/" class="btn btn-outline">← Voltar à Calculadora</a>
              <button onclick="carregarFeedbacks()" class="btn btn-outline">🔄 Atualizar</button>
              
              <!-- AQUI ESTÁ O NOVO BOTÃO DE PDF -->
              <button onclick="window.print()" class="btn btn-success">📥 Baixar Relatório (PDF)</button>
              
            </div>
          </div>
        </header>
        <main>
          <div class="page-header">
            <div class="page-title">
              <h2>Registos Armazenados no PostgreSQL</h2>
              <p>Dados consultados em tempo real através da rota /api/feedbacks</p>
            </div>
            <div class="stats-card">
              <div class="stats-number" id="totalCount">0</div>
              <div style="font-size: 0.85rem; font-weight: 700; color: #475569;">TOTAL DE FEEDBACKS</div>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th style="width: 25%">Nome</th><th style="width: 15%">Data</th><th style="width: 15%">Horário</th><th style="width: 45%">Feedback</th></tr></thead>
              <tbody id="tabelaBody"><tr><td colspan="4" style="text-align:center; padding: 2rem; color: #0284c7; font-weight: 700;">Consultando banco de dados...</td></tr></tbody>
            </table>
          </div>
        </main>
      </div>
      <script>
        const SENHA = "admin";
        if(prompt("Acesso Administrativo - Senha:") !== SENHA) window.location.href = "/";
        else carregarFeedbacks();

        async function carregarFeedbacks() {
          try {
            const res = await fetch('/api/feedbacks');
            const data = await res.json();
            document.getElementById('totalCount').textContent = data.length || 0;
            const tbody = document.getElementById('tabelaBody');
            if(data.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Nenhum feedback.</td></tr>';
            else {
              tbody.innerHTML = data.map(item => \`<tr>
                <td class="td-nome">\${item.nome.replace(/</g, "&lt;")}</td>
                <td style="font-family: monospace;">\${item.data_acesso || item.data}</td>
                <td style="font-family: monospace;">\${item.horario_acesso || item.horario}</td>
                <td>\${item.feedback.replace(/</g, "&lt;")}</td>
              </tr>\`).join('');
            }
          } catch(e) { document.getElementById('tabelaBody').innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>'; }
        }
      </script>
    </body>
    </html>
  `);
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