import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Building2,
  Cpu,
  Layers,
  Sparkles,
  CreditCard,
  PhoneCall,
  Check
} from 'lucide-react';
import { BRAND_CONFIG } from '../../constants/brand';
import { UserProfile } from '../../types/corban';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  initialErrorMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  initialErrorMessage
}) => {
  const [email, setEmail] = useState<string>('tomsilvaconsignado@gmail.com');
  const [password, setPassword] = useState<string>('Corvexa@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);

  // Quick credentials picker for authorized roles
  const handleSelectQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLockoutMinutes(null);
    setRemainingAttempts(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail / usuário e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (rememberMe && data.token) {
          localStorage.setItem('corvexa_session_token', data.token);
        } else {
          sessionStorage.setItem('corvexa_session_token', data.token);
        }
        onLoginSuccess(data.user, data.token);
      } else {
        if (response.status === 429) {
          setLockoutMinutes(data.lockoutMinutes || 15);
          setErrorMessage(data.error || 'Conta temporariamente bloqueada por excesso de tentativas.');
        } else {
          setErrorMessage(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
          if (typeof data.remainingAttempts === 'number') {
            setRemainingAttempts(data.remainingAttempts);
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Falha na comunicação com o servidor de autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#051026] flex flex-col lg:flex-row items-stretch overflow-x-hidden selection:bg-cyan-500 selection:text-white font-sans">
      
      {/* =========================================================================
          LEFT PANE: CORVEXA Visual Showcase & Financial Illustration
          Inspired by image_6ad9e745.png (digital tablet, secure padlock, cards, chart)
          ========================================================================= */}
      <div className="relative flex-1 bg-gradient-to-br from-[#051026] via-[#0A2647] to-[#04122E] p-8 lg:p-14 flex flex-col justify-between text-white overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        
        {/* Ambient Glows and Geometric Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle Geometric Grid */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00A3FF_1px,transparent_1px)] [background-size:24px_24px]"
        />

        {/* 1. Top Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="bg-white rounded-xl p-2 px-3 shadow-lg shadow-blue-950/50 flex items-center justify-center shrink-0 border border-white/20">
            <img 
              src={BRAND_CONFIG.logo.url} 
              alt={BRAND_CONFIG.logo.alt} 
              className="h-8 md:h-9 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-black tracking-wider text-white">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                CORBAN PRO
              </span>
            </div>
            <p className="text-xs text-cyan-200/90 font-medium">
              {BRAND_CONFIG.slogan}
            </p>
          </div>
        </div>

        {/* 2. Central Banking & Security Composition (Isometric SVG & Vector Art) */}
        <div className="relative z-10 my-8 lg:my-auto flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          
          {/* Main Visual Card Container */}
          <div className="relative w-full aspect-[4/3] max-w-[420px] flex items-center justify-center">
            
            {/* Background Digital Canvas Card */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/20 via-slate-900/60 to-cyan-900/30 border border-cyan-500/30 backdrop-blur-md shadow-2xl p-6 flex flex-col justify-between overflow-hidden">
              
              {/* Top card bar */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-[11px] font-semibold text-cyan-200">
                    SISTEMA OPERACIONAL ATIVO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  RES. BACEN 3.954
                </span>
              </div>

              {/* Central Tablet & Security Lock Visual (Faithful to reference image) */}
              <div className="relative flex items-center justify-center py-4">
                
                {/* Banknotes behind tablet */}
                <div className="absolute -top-3 left-10 transform -rotate-12 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg w-28 h-14 border border-emerald-400/40 shadow-lg opacity-80 flex items-center justify-center text-white text-[11px] font-black tracking-widest font-mono">
                  R$ 100
                </div>
                <div className="absolute -top-1 left-20 transform rotate-6 bg-gradient-to-r from-emerald-700 to-teal-600 rounded-lg w-28 h-14 border border-emerald-400/30 shadow-md opacity-70 flex items-center justify-center text-white text-[11px] font-black tracking-widest font-mono">
                  R$ 50
                </div>

                {/* Digital Tablet Device */}
                <div className="relative w-44 h-56 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 p-2.5 shadow-2xl border-2 border-slate-700/80 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  
                  {/* Tablet Speaker/Camera */}
                  <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
                  
                  {/* Tablet Screen */}
                  <div className="w-full h-[calc(100%-20px)] rounded-xl bg-gradient-to-b from-[#0260E8] to-[#0A2647] p-3 flex flex-col items-center justify-between text-center relative overflow-hidden border border-cyan-400/30 shadow-inner">
                    
                    {/* Screen glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/30 rounded-full blur-xl pointer-events-none" />

                    <div className="text-[9px] font-mono tracking-wider text-cyan-200 uppercase font-semibold">
                      Formalização 100% Segura
                    </div>

                    {/* Padlock Icon (as featured in reference) */}
                    <div className="relative my-auto flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <Lock className="w-7 h-7 text-cyan-300" />
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-white tracking-wide">
                        Assinatura Digital
                      </span>
                      <span className="text-[8px] text-cyan-200">
                        Biometria Facial Integrada
                      </span>
                    </div>

                    {/* Progress Bar inside tablet */}
                    <div className="w-full bg-slate-900/60 rounded-full h-1.5 overflow-hidden border border-cyan-400/20">
                      <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-4/5 animate-pulse" />
                    </div>
                  </div>

                  {/* Tablet Home Bar */}
                  <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mt-1.5" />
                </div>

                {/* Digital Stylus Pen (from reference) */}
                <div className="absolute right-6 top-8 w-3 h-48 bg-gradient-to-b from-slate-200 via-white to-slate-400 rounded-full transform rotate-24 shadow-xl border border-slate-300 flex flex-col items-center justify-between py-2">
                  <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full mb-1" />
                </div>

                {/* Credit Card Floating (from reference) */}
                <div className="absolute -bottom-2 -left-3 w-40 h-24 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 p-2.5 shadow-2xl border border-cyan-400/40 transform rotate-6 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    {/* Chip */}
                    <div className="w-6 h-4.5 rounded-sm bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-600/60 flex items-center justify-center">
                      <div className="w-3 h-2 border-t border-b border-amber-700/60" />
                    </div>
                    {/* Contactless waves */}
                    <div className="text-cyan-300 text-[10px] font-mono">
                      )))
                    </div>
                  </div>
                  <div className="font-mono text-[9px] text-slate-300 tracking-widest">
                    •••• •••• •••• 4819
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono">
                    <span className="text-white font-bold">CORVEXA CARD</span>
                    <div className="flex -space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                      <div className="w-3 h-3 rounded-full bg-amber-400 opacity-80" />
                    </div>
                  </div>
                </div>

                {/* Financial Growth Bar Chart with Arrows (from reference) */}
                <div className="absolute -bottom-3 -right-2 bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 border border-cyan-500/40 shadow-xl flex items-end gap-1.5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-6 bg-cyan-500 rounded-t-sm" />
                    <span className="text-[7px] text-slate-400 font-mono">INSS</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-10 bg-blue-500 rounded-t-sm" />
                    <span className="text-[7px] text-slate-400 font-mono">SIAPE</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-14 bg-emerald-400 rounded-t-sm" />
                    <span className="text-[7px] text-slate-400 font-mono">FGTS</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-3 h-18 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-t-sm" />
                    <span className="text-[7px] text-slate-400 font-mono">PORT</span>
                  </div>
                  {/* Upward Growth Arrow */}
                  <div className="ml-1 flex flex-col items-center text-emerald-400 font-bold text-[9px]">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>+28%</span>
                  </div>
                </div>

              </div>

              {/* Bottom Card Footer */}
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Esteira Integrada 17 Etapas</span>
                <span className="text-cyan-300 font-bold font-mono">100% Digital & Auditado</span>
              </div>
            </div>
          </div>

          {/* Core Strengths Badges */}
          <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-[420px]">
            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-cyan-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-white leading-tight">Criptografia AES-256</div>
                <div className="text-[9px] text-slate-400">Proteção LGPD & Sigilo</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-white leading-tight">Conectores Oficiais</div>
                <div className="text-[9px] text-slate-400">Dataprev, Serpro & Bancos</div>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Institution Note */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/60">
          <p className="text-[11px]">
            © 2026 {BRAND_CONFIG.legalName}
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-slate-200 transition-colors">Termos de Uso</span>
            <span className="hover:text-slate-200 transition-colors">Política de Privacidade</span>
            <span className="text-cyan-400 font-mono">v{BRAND_CONFIG.version}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: High-Converting Authentication Form
          ========================================================================= */}
      <div className="w-full lg:w-[480px] xl:w-[540px] bg-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 shadow-2xl relative z-20">
        
        {/* Top Header inside Login Form */}
        <div className="w-full max-w-md mx-auto">
          
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Acesso Restrito a Operadores Credenciados</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bem-vindo ao CORVEXA
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Informe suas credenciais para acessar o painel de correspondente bancário.
            </p>
          </div>

          {/* Success Toast */}
          {successToast && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="leading-relaxed font-medium">{successToast}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-red-900 mb-0.5">Falha de Autenticação</span>
                {errorMessage}
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <span className="block mt-1 font-semibold text-red-700">
                    Restam {remainingAttempts} tentativa(s) antes do bloqueio temporário.
                  </span>
                )}
                {lockoutMinutes && (
                  <span className="block mt-1 font-semibold text-red-700">
                    Tempo estimado de desbloqueio: {lockoutMinutes} minutos.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Field: Email / User */}
            <div>
              <label 
                htmlFor="user-email"
                className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                E-mail ou Usuário
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="user-email"
                  type="text"
                  required
                  autoComplete="username"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: tomsilvaconsignado@gmail.com"
                  className="w-full pl-10 pr-3 py-3 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0260E8] focus:border-[#0260E8] transition-all font-mono"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="user-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#0260E8] hover:text-[#0047b3] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0260E8] focus:border-[#0260E8] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#0260E8] rounded border-slate-300 focus:ring-[#0260E8] cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Manter conectado neste dispositivo seguro
                </span>
              </label>
            </div>

            {/* Primary Action Button (ENTRAR) */}
            <button
              type="submit"
              disabled={isLoading || (lockoutMinutes !== null && lockoutMinutes > 0)}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0260E8] via-[#054db6] to-[#0A2647] hover:from-[#0052cc] hover:to-[#051026] text-white font-bold text-sm shadow-lg shadow-blue-700/20 hover:shadow-xl hover:shadow-blue-700/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando com Servidor...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ENTRAR NO SISTEMA</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Account Picker for Fast Evaluation & Operators */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Acessos Credenciados (Demonstração & Testes)
              </span>
              <span className="text-[10px] text-slate-400">Clique para preencher</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('tomsilvaconsignado@gmail.com', 'Corvexa@2026')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 truncate">
                  Tomás Silva
                </div>
                <div className="text-[9px] text-slate-500 flex items-center justify-between">
                  <span>Operador Sênior</span>
                  <span className="font-mono text-blue-600">tomsilva...</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin@corvexa.com.br', 'Corvexa@2026')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 truncate">
                  Carlos Eduardo
                </div>
                <div className="text-[9px] text-slate-500 flex items-center justify-between">
                  <span>Admin Master</span>
                  <span className="font-mono text-blue-600">admin@...</span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Institutional Support & Security Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 text-center w-full max-w-md mx-auto">
          <p className="text-xs text-slate-500 mb-2">
            Precisa de ajuda ou suporte técnico credenciado?
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-700">
            <a 
              href={`mailto:${BRAND_CONFIG.supportEmail}`}
              className="text-[#0260E8] hover:underline flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{BRAND_CONFIG.supportEmail}</span>
            </a>
            <span className="text-slate-300">•</span>
            <a 
              href="https://wa.me/5551987654321?text=Suporte%20Acesso%20CORVEXA" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline flex items-center gap-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Suporte WhatsApp</span>
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Sessões gravadas e auditadas em conformidade com a LGPD e Bacen.</span>
          </div>
        </div>

      </div>

      {/* Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={email}
        onSuccessReset={(msg) => {
          setSuccessToast(msg);
          setErrorMessage(null);
        }}
      />

    </div>
  );
};
