/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Sunrise,
  AlarmClock,
  AlertTriangle,
  User,
  Send,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Estado da Calculadora
  const [peso, setPeso] = useState<string>('70');
  const [resultado, setResultado] = useState<{
    litros: string;
    ml: number;
    copos: number;
  } | null>(null);

  // Estado do Formulário de Feedback
  const [nome, setNome] = useState<string>('');
  const [feedbackTexto, setFeedbackTexto] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // Calcula valor inicial padrão de 70kg
  useEffect(() => {
    calcularAgua('70');
  }, []);

  // Função de cálculo de água: peso * 35 ml
  const calcularAgua = (pesoValor?: string) => {
    const valor = parseFloat(pesoValor !== undefined ? pesoValor : peso);
    if (isNaN(valor) || valor <= 0) {
      alert('Por favor, insira um peso válido maior que zero (ex.: 70).');
      return;
    }

    const totalMl = Math.round(valor * 35);
    const litros = (totalMl / 1000).toFixed(2).replace('.', ',');
    const copos = Math.round(totalMl / 250);

    setResultado({
      litros,
      ml: totalMl,
      copos
    });
  };

  // Submissão do Feedback via rota POST /api/feedback (PostgreSQL)
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !feedbackTexto.trim()) {
      alert('Por favor, preencha o seu nome e o que achou da ferramenta.');
      return;
    }

    setEnviando(true);
    setSucessoMsg(null);
    setErroMsg(null);

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();

    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    const payload = {
      nome: nome.trim(),
      feedback: feedbackTexto.trim(),
      data_acesso: `${dia}/${mes}/${ano}`,
      horario_acesso: `${horas}:${minutos}:${segundos}`
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao enviar feedback.');
      }

      const resData = await response.json();
      setNome('');
      setFeedbackTexto('');
      setSucessoMsg(resData.message || 'Feedback enviado com sucesso!');
    } catch (err: any) {
      console.error('Erro na submissão:', err);
      setErroMsg(err.message || 'Não foi possível enviar o feedback. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const pesoNum = parseFloat(peso) || 70;
  const porcentagemGarrafa = Math.min(Math.max((pesoNum / 120) * 100, 25), 90);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Barra Superior / Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zona 1: Brand title */}
          <a href="#" className="flex items-center gap-2.5 text-slate-900 whitespace-nowrap shrink-0 group">
            <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white shadow-xs group-hover:bg-sky-700 transition-colors">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              Calculadora de Hidratação Diária
            </span>
          </a>

          {/* Zona 2: Links de navegação */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#calculadora" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Calculadora
            </a>
            <a href="#dicas" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Dicas Saudáveis
            </a>
            <a href="#feedback" className="hover:text-sky-700 transition-colors whitespace-nowrap shrink-0">
              Deixe o seu Feedback
            </a>
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Cabeçalho */}
        <section className="text-center max-w-3xl mx-auto mb-10 pt-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight text-balance mb-4 leading-tight">
            Calculadora de Hidratação Diária
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-6">
            A água é essencial para manter a saúde e o bem-estar: ela regula a temperatura do corpo,
            lubrifica articulações, transporta nutrientes celulares e previne a fadiga.
            Descubra a quantidade de água recomendada com base no seu peso corporal utilizando a fórmula de <strong>35 ml por kg</strong>.
          </p>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-left flex items-start gap-3.5 shadow-xs">
            <div className="p-2 bg-sky-600 text-white rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sky-950 mb-0.5">
                Importância da Hidratação para a Saúde
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-normal">
                A ingestão hídrica consistente atua na prevenção primária de sobrecargas renais, desidratação crônica e desequilíbrios metabólicos na rotina diária.
              </p>
            </div>
          </div>
        </section>

        {/* Grade da Calculadora e Visualizador */}
        <div id="calculadora" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* Card Principal da Calculadora */}
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  ⚖️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Cálculo Personalizado
                  </h2>
                  <p className="text-xs text-slate-500">
                    Insira o seu peso corporal atual em quilogramas (kg)
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                Fórmula: 35 ml / kg
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                calcularAgua();
              }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="peso-input" className="block text-sm font-bold text-slate-800 mb-2">
                  O seu Peso em Quilogramas (kg):
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    id="peso-input"
                    type="number"
                    min="10"
                    max="300"
                    step="0.5"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ex.: 70"
                    required
                    className="w-full h-14 pl-4 pr-16 text-2xl font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-base font-extrabold text-slate-400">kg</span>
                  </div>
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">Pesos frequentes:</span>
                  {[50, 60, 70, 80, 90, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setPeso(String(v));
                        calcularAgua(String(v));
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      {v} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Calcular Água Ideal */}
              <button
                type="submit"
                className="w-full min-h-[54px] bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-extrabold text-lg rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-200"
              >
                <Droplets className="w-5 h-5" />
                Calcular Água Ideal
              </button>
            </form>

            {/* Destaque do Resultado */}
            {resultado && (
              <div
                className="mt-8 p-6 rounded-xl bg-gradient-to-br from-sky-50 via-sky-100 to-sky-50 border-2 border-sky-300 text-center animate-fade-in"
                role="region"
                aria-live="polite"
              >
                <span className="text-xs font-extrabold text-sky-800 uppercase tracking-wider block mb-1">
                  Meta Hídrica Diária Recomendada
                </span>
                
                <div className="text-3xl sm:text-4xl font-extrabold text-sky-950 mb-1 tracking-tight">
                  Deve beber <span className="text-sky-600 underline decoration-sky-400">{resultado.litros} Litros</span> por dia
                </div>

                <p className="text-sm font-semibold text-slate-700 mb-4">
                  Cálculo preciso: <strong>{resultado.ml.toLocaleString('pt-BR')} ml</strong> de água pura todos os dias.
                </p>

                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-sky-200 text-sky-800 font-bold text-sm shadow-2xs">
                  <span>🥤</span>
                  <span>Equivalente a cerca de {resultado.copos} copos de 250ml</span>
                </div>
              </div>
            )}
          </div>

          {/* Card Visualizador de Garrafa e Distribuição */}
          <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Capacidade e Equilíbrio Hídrico
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Distribuição ideal ao longo das atividades do seu dia
            </p>

            <div className="relative my-2 flex flex-col items-center">
              <div className="w-12 h-3.5 bg-sky-800 rounded-t-md"></div>
              <div className="w-8 h-4 bg-sky-100 border-x-2 border-sky-700"></div>
              <div className="w-28 h-56 rounded-2xl border-4 border-sky-700 bg-sky-50 relative overflow-hidden shadow-inner flex flex-col justify-end">
                <div className="absolute inset-y-0 right-1 flex flex-col justify-between py-4 text-[9px] font-mono text-slate-400 select-none">
                  <span>Max</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                </div>

                <div
                  className="w-full bg-gradient-to-t from-sky-600 to-sky-400 transition-all duration-700 relative"
                  style={{ height: `${porcentagemGarrafa}%` }}
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-white/40"></div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-sm font-extrabold text-sky-900 block">
                {resultado ? `${resultado.litros} Litros / dia` : 'Meta: 35 ml por kg'}
              </span>
              <span className="text-xs text-slate-500">
                Mantenha a garrafa sempre por perto
              </span>
            </div>

            {/* Distribuição por Período */}
            <div className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-2">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-200">
                Sugestão de Distribuição:
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                  <strong>Manhã:</strong> Ao acordar & almoço
                </span>
                <span className="font-bold font-mono">
                  {resultado ? `${Math.round(resultado.ml * 0.35)} ml` : '~850 ml'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  <strong>Tarde:</strong> Trabalho & estudo
                </span>
                <span className="font-bold font-mono">
                  {resultado ? `${Math.round(resultado.ml * 0.45)} ml` : '~1.100 ml'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <strong>Noite:</strong> Até 2h antes de dormir
                </span>
                <span className="font-bold font-mono">
                  {resultado ? `${Math.round(resultado.ml * 0.20)} ml` : '~500 ml'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secção de Dicas e Alertas Estáticos */}
        <section id="dicas" className="mb-16">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💡</span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Dicas e Alertas para uma Hidratação Eficiente
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              Três hábitos simples recomendados para assegurar a sua meta com facilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dica 1 */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl mb-4">
                  🌅
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Beba um copo ao acordar
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Após 6 a 8 horas de repouso sem ingestão de líquidos, o corpo acorda naturalmente desidratado. Beber 250 a 300 ml logo ao despertar ativa o metabolismo, estimula o sistema gastrointestinal e limpa resíduos celulares.
                </p>
              </div>
            </div>

            {/* Dica 2 */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-2xl mb-4">
                  ⚠️
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Não espere ter sede
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A sede é um alarme biológico tardio disparado pelo cérebro quando o corpo já perdeu cerca de 1% a 2% do seu peso em líquidos. Beba água fracionada de forma contínua para evitar queda de rendimento e dores de cabeça.
                </p>
              </div>
            </div>

            {/* Dica 3 */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center text-2xl mb-4">
                  ⏰
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Use alarmes no telemóvel
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Na agitação da rotina diária, é fácil esquecer de beber água. Configurar alarmes ou lembretes a cada 60 a 90 minutos transforma a ingestão de água num reflexo automático e sem esforço.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Secção de Feedback (Título atualizado, Tabela oculta, envio com fetch para PostgreSQL) */}
        <section id="feedback" className="pt-6 border-t-2 border-slate-200 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Deixe o seu Feedback
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Compartilhe a sua experiência e ajude-nos a aprimorar a ferramenta. Os dados são enviados e armazenados com segurança no nosso servidor PostgreSQL.
            </p>
          </div>

          {/* Formulário de Feedback */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              <div>
                <label htmlFor="nome-feedback" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Nome:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    id="nome-feedback"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite o seu nome"
                    required
                    className="w-full h-12 pl-11 pr-4 text-base font-medium text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="texto-feedback" className="block text-sm font-bold text-slate-800 mb-1.5">
                  O que achou da ferramenta?
                </label>
                <textarea
                  id="texto-feedback"
                  rows={4}
                  value={feedbackTexto}
                  onChange={(e) => setFeedbackTexto(e.target.value)}
                  placeholder="Conte-nos o que achou da calculadora..."
                  required
                  className="w-full p-3.5 text-base font-medium text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 transition-all resize-y"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  disabled={enviando}
                  className="min-h-[48px] px-8 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold text-base rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {enviando ? 'Enviando...' : 'Registar Acesso'}
                </button>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Data e horário registrados automaticamente</span>
                </div>
              </div>
            </form>

            {/* Mensagem limpa de sucesso exigida */}
            {sucessoMsg && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex items-center gap-3 text-base font-bold animate-fade-in shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>Feedback enviado com sucesso!</span>
              </div>
            )}

            {erroMsg && (
              <div className="mt-5 p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-center gap-3 text-sm font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{erroMsg}</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-700">
            Calculadora de Hidratação Diária · Aplicação Full-Stack com PostgreSQL
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 text-slate-400">
            <span>Saúde e Bem-Estar</span>
            <span>·</span>
            <span>Node.js & Express</span>
            <span>·</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
