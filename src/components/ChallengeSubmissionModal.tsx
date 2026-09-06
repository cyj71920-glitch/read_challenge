import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { ChallengeMonthInfo } from '../types';
import { CHALLENGE_MONTHS } from '../data/challenges';
import { api } from '../services/api';
import { getChallengeMonthStatus } from '../utils/challengeDate';
import confetti from 'canvas-confetti';

interface ChallengeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  targetMonth: number;
  challenges?: ChallengeMonthInfo[];
  onErrorToast: (title: string, message?: string) => void;
  onSuccessToast: (title: string, message?: string) => void;
}

export const ChallengeSubmissionModal: React.FC<ChallengeSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  targetMonth,
  challenges = CHALLENGE_MONTHS,
  onErrorToast,
  onSuccessToast,
}) => {
  const [grade, setGrade] = useState<number>(1);
  const [classNum, setClassNum] = useState<number>(1);
  const [studentNum, setStudentNum] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMonth = targetMonth || 9;
  const currentChallenge =
    (challenges || CHALLENGE_MONTHS).find((m) => m.month === activeMonth) || CHALLENGE_MONTHS[0];
  const statusInfo = getChallengeMonthStatus(currentChallenge);

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setStudentNum('');
      setStudentName('');
      setPassword('');
      setShowPassword(false);
      setBookTitle('');
      setBookAuthor('');
      setContent('');
      setImageUrl('');
      setImagePreview('');
    }
  }, [isOpen, activeMonth]);

  if (!isOpen) return null;

  // Handle Image Upload & Compression
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onErrorToast('이미지 파일 오류', 'JPG, PNG, WebP 등 이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(compressedDataUrl);
        setImageUrl(compressedDataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Post Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!statusInfo.canSubmit) {
      onErrorToast('제출 불가', statusInfo.explanation);
      return;
    }

    if (!studentName.trim()) {
      onErrorToast('이름 입력 필요', '학생 이름을 입력해주세요.');
      return;
    }
    if (!studentNum || Number(studentNum) < 1) {
      onErrorToast('번호 입력 필요', '올바른 학생 번호를 입력해주세요.');
      return;
    }
    if (!password || !/^\d{4}$/.test(password)) {
      onErrorToast('비밀번호 오류', '글 수정을 위해 숫자 4자리 비밀번호를 입력해주세요. (예: 1234)');
      return;
    }
    if (!bookTitle.trim()) {
      onErrorToast('도서명 입력 필요', '읽은 책의 제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      onErrorToast('소감/내용 입력 필요', '챌린지 소감이나 사진 속 문장을 적어주세요.');
      return;
    }
    if (!imageUrl) {
      onErrorToast('사진 업로드 필요', '챌린지 인증 사진을 업로드해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPost({
        grade: Number(grade),
        classNum: Number(classNum),
        studentNum: Number(studentNum),
        studentName: studentName.trim(),
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim() || undefined,
        content: content.trim(),
        imageUrl,
        month: activeMonth,
        challengeTitle: currentChallenge.title,
        password: password.trim(),
      });

      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD100', '#FF6B00', '#4ADE80', '#3B82F6', '#EF4444'],
      });

      onSuccessToast('🎉 챌린지 글 등록 완료!', `${grade}학년 ${classNum}반 달리기 점수가 상승했습니다!`);
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      onErrorToast('등록 실패', err.message || '서버 연결에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        id="submission-modal-card"
        className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[92vh] overflow-y-auto border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-slate-900"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#FFD100] px-6 py-4 border-b-4 border-black flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              ✍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-black">
                  {activeMonth}월 챌린지 인증샷 올리기
                </h2>
              </div>
              <p className="text-xs font-bold text-black/80">
                인증샷을 올리면 {activeMonth}월 챌린지에 등록되고 우리 반 달리기 점수가 쑥 올라갑니다!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-black bg-white hover:bg-red-100 p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Challenge Auto-Locked Header Card */}
          <div
            className={`p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2 ${
              statusInfo.canSubmit ? 'bg-[#4ADE80]/20' : 'bg-amber-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-lg border border-black text-xs font-black ${
                    statusInfo.canSubmit ? 'bg-[#4ADE80] text-black' : 'bg-amber-300 text-amber-950'
                  }`}
                >
                  {statusInfo.canSubmit ? '🎯 등록 대상' : '🔒 기간 마감'}
                </span>
                <span className="font-black text-sm text-black">
                  {activeMonth}월 챌린지 : &lt;{currentChallenge.title}&gt;
                </span>
              </div>
              <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-black">
                📅 {statusInfo.dateRangeText}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-700 pl-1">
              📌 {currentChallenge.missionDescription}
            </p>

            {!statusInfo.canSubmit && (
              <div className="mt-2 p-2.5 bg-red-100 border-2 border-red-500 rounded-xl text-xs font-black text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p>{statusInfo.label}</p>
                  <p className="font-medium mt-0.5">{statusInfo.explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* 1. Student Identity Info (Middle School: Grades 1~3, Classes 1~4) */}
          <div className="bg-[#FFFBEB] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
              1. 학생 정보 입력 (중학교 1~3학년, 1~4반)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">학년</label>
                <select
                  id="input-grade"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100]"
                >
                  {[1, 2, 3].map((g) => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">반</label>
                <select
                  id="input-class"
                  value={classNum}
                  onChange={(e) => setClassNum(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100]"
                >
                  {[1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      {c}반
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">번호</label>
                <input
                  id="input-student-num"
                  type="number"
                  min="1"
                  max="50"
                  value={studentNum}
                  onChange={(e) => setStudentNum(e.target.value)}
                  placeholder="예: 14"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">이름</label>
                <input
                  id="input-student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="예: 김민준"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100]"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Post Edit Password (4-digit PIN for Student Self-Edit) */}
          <div className="bg-[#FEF3C7] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#FF6B00]" />
                <span>글 수정용 비밀번호 (숫자 4자리)</span>
                <span className="text-red-500">*</span>
              </label>
              {password.length === 4 && /^\d{4}$/.test(password) ? (
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  4자리 설정 완료
                </span>
              ) : (
                <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-300">
                  {password.length}/4자리
                </span>
              )}
            </div>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-post-password"
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={password}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                  setPassword(val);
                }}
                placeholder="숫자 4자리 입력 (예: 1234)"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100] tracking-widest placeholder:tracking-normal placeholder:font-bold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1"
                tabIndex={-1}
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] font-bold text-slate-700 pl-0.5 flex items-center gap-1">
              <span>💡</span>
              <span>나중에 등록한 글의 내용이나 사진을 바꿀 때 필요합니다. 기억하기 쉬운 4자리 숫자를 입력해주세요.</span>
            </p>
          </div>

          {/* 3. Book Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black mb-1">
                도서명 (책 제목) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-book-title"
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="예: 어린 왕자, 아몬드"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#FFD100]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black mb-1">
                저자 (지은이)
              </label>
              <input
                id="input-book-author"
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="예: 생텍쥐페리 (선택 입력)"
                className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#FFD100]"
              />
            </div>
          </div>

          {/* 3. Photo Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-black uppercase tracking-wider">
              {activeMonth}월 챌린지 인증 사진 업로드 <span className="text-red-500">*</span>
            </label>

            {imagePreview ? (
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-black border-2 border-black">
                <img src={imagePreview} alt="미리보기" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageUrl('');
                  }}
                  className="absolute top-3 right-3 bg-[#FFD100] text-black p-2 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 transition"
                >
                  <X className="w-4 h-4" />
                  <span>사진 바꾸기</span>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-black hover:bg-yellow-50 rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFD100] text-black border-2 border-black flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-black">
                    클릭하거나 사진 파일을 여기로 끌어다 놓으세요
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    스마트폰 촬영 사진, 캡처 화면 (JPG, PNG) 지원
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 4. Content / Reflection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-black uppercase tracking-wider">
              간단한 내용 및 소감 작성 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="input-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="첫 문장 인용, 사진을 찍은 이유, 책에 대한 감상평 등을 자유롭게 적어주세요..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#FFD100] leading-relaxed"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-black font-black hover:bg-slate-100 text-xs sm:text-sm transition"
            >
              취소
            </button>

           <button
  type="submit"
  id="btn-submit-post-final"
  disabled={isSubmitting || !statusInfo.canSubmit}
  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] flex items-center gap-2 transition cursor-pointer ${
    !statusInfo.canSubmit
      ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
      : isSubmitting
      ? 'bg-yellow-300 text-black cursor-wait'
      : 'bg-[#4ADE80] hover:bg-[#3ecf73] text-black'
  }`}
>
  {isSubmitting ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>게시글 등록 중...</span>
    </>
  ) : !statusInfo.canSubmit ? (
    <>
      <Lock className="w-4 h-4" />
      <span>{statusInfo.label} (등록 불가)</span>
    </>
  ) : (
    <>
      <Sparkles className="w-4 h-4" />
      <span>{activeMonth}월 챌린지 등록하기 🚀</span>
    </>
  )}
</button>
          </div>
        </form>
      </div>
    </div>
  );
};
