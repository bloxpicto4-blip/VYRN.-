import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../brand/Logo';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(identifier, password);
      } else {
        await register({ username, email, password, displayName });
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية التحقق. يرجى التأكد من صحة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillAdmin = () => {
    setMode('login');
    setIdentifier('boda');
    setPassword('abdo');
  };

  return (
    <div
      onClick={onClose}
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#1C1E19] border border-[#2E3129] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-right"
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-[#F2EBDD]/60 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <Logo size="md" showWordmark={true} className="justify-center" />
          <h3 className="text-lg font-bold font-mono text-[#F2EBDD]">
            {mode === 'login' ? 'تسجيل الدخول إلى VYRN' : 'إنشاء حساب جديد في VYRN'}
          </h3>
          <p className="text-xs text-[#F2EBDD]/60">
            للوصول إلى المفضلة، التعليقات، والإصدارات الخاصة بالأعضاء.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-[#141512] border border-[#272922] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-[#FF5A1F] text-white font-bold' : 'text-[#F2EBDD]/60 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-[#FF5A1F] text-white font-bold' : 'text-[#F2EBDD]/60 hover:text-white'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-300 font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'login' ? (
            <div>
              <label className="block text-[#F2EBDD]/60 mb-1 font-mono">اسم المستخدم أو البريد الإلكتروني</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F2EBDD]/40" />
                <input
                  type="text"
                  required
                  value={identifier || ''}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="boda أو اسم المستخدم..."
                  className="w-full bg-[#141512] border border-[#2B2D26] focus:border-[#FF5A1F] rounded-lg pr-9 pl-3 py-2 text-[#F2EBDD] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[#F2EBDD]/60 mb-1 font-mono">اسم المستخدم (Username) *</label>
                <input
                  type="text"
                  required
                  value={username || ''}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: tarek_design"
                  className="w-full bg-[#141512] border border-[#2B2D26] rounded-lg p-2 text-[#F2EBDD]"
                />
              </div>
              <div>
                <label className="block text-[#F2EBDD]/60 mb-1 font-mono">الاسم المعروض (Display Name)</label>
                <input
                  type="text"
                  value={displayName || ''}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: طارق المهندس"
                  className="w-full bg-[#141512] border border-[#2B2D26] rounded-lg p-2 text-[#F2EBDD]"
                />
              </div>
              <div>
                <label className="block text-[#F2EBDD]/60 mb-1 font-mono">البريد الإلكتروني *</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F2EBDD]/40" />
                  <input
                    type="email"
                    required
                    value={email || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#141512] border border-[#2B2D26] rounded-lg pr-9 pl-3 py-2 text-[#F2EBDD]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[#F2EBDD]/60 mb-1 font-mono">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F2EBDD]/40" />
              <input
                type="password"
                required
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141512] border border-[#2B2D26] focus:border-[#FF5A1F] rounded-lg pr-9 pl-3 py-2 text-[#F2EBDD] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#FF5A1F] hover:bg-[#FF3300] disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-md shadow-[#FF5A1F]/20"
          >
            {isSubmitting ? 'جاري التحقق...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
          </button>
        </form>

        {/* Quick Admin Helper Button */}
        {mode === 'login' && (
          <div className="pt-2 border-t border-[#262822] text-center">
            <button
              onClick={handleFillAdmin}
              className="text-[11px] font-mono text-[#D7FF38] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>تعبئة بيانات حساب الإدارة (boda / abdo)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
