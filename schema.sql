-- Script SQL para criação da tabela de feedbacks no PostgreSQL
-- Projeto: Calculadora de Hidratação Diária

CREATE TABLE IF NOT EXISTS acessos_feedback (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    feedback TEXT NOT NULL,
    data_acesso VARCHAR(20) NOT NULL,
    horario_acesso VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices opcionais para otimização de consultas e relatórios
CREATE INDEX IF NOT EXISTS idx_acessos_feedback_data ON acessos_feedback(data_acesso);
CREATE INDEX IF NOT EXISTS idx_acessos_feedback_created_at ON acessos_feedback(created_at DESC);

-- Registros iniciais de demonstração (opcional)
INSERT INTO acessos_feedback (nome, feedback, data_acesso, horario_acesso)
VALUES 
  ('Mariana Silva', 'Excelente calculadora! A meta diária foi muito clara e prática.', '11/10/2026', '09:14:22'),
  ('Carlos Eduardo', 'Gostei muito da divisão em turnos e das dicas de hidratação.', '11/10/2026', '10:45:08')
ON CONFLICT DO NOTHING;
