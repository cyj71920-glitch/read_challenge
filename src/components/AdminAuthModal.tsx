import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  savedPassword?: string;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  savedPassword = '1234',
  onToast,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetPassword = savedPassword || '1234';
    if (password === targetPassword) {
      onToast('success', '관리자 인증 성공', '관리자 모드로 전환되었습니다.');
      setPassword('');
      onSuccess();
    } else {
      setErrorMsg('비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
      onToast('error', '인증 실패', '관리자 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-w-md w-full overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-black">교사용 관리자 로그인</h3>
              <p className="text-xs font-bold text-slate-500">지정된 비밀번호를 입력해주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-black bg-slate-100 hover:bg-red-100 transition"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Info notice */}
        <div className="bg-[#FFFBEB] p-3.5 rounded-2xl border-2 border-black text-xs font-bold text-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 font-black text-black">
            <Lock className="w-4 h-4 text-[#FF6B00]" />
            <span>도서관 관리자 전용 보안 영역</span>
          </div>
          <p className="text-slate-600 pl-5 text-[11px]">
            학생 명부 관리, 게시글/댓글 삭제, 월별 챌린지 미션 설정, 구글 시트 연동 기능을 이용할 수 있습니다.
          </p>
          <p className="text-[#FF6B00] pl-5 text-[11px] font-black">
            💡 초기 기본 비밀번호: <code className="bg-yellow-200 px-1 py-0.5 rounded border border-black text-black">1234</code> (로그인 후 변경 가능)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-black">
              관리자 비밀번호 입력
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="비밀번호를 입력하세요 (기본: 1234)"
                autoFocus
                className="w-full pl-10 pr-11 py-3 rounded-xl border-2 border-black bg-white text-sm font-black text-black focus:ring-2 focus:ring-[#FFD100] focus:bg-yellow-50/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-black"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs font-black text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-slate-100 text-xs font-black text-black transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl border-2 border-black bg-[#4ADE80] hover:bg-[#3ecf73] text-black text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>관리자 로그인</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
