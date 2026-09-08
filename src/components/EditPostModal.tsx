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
  Trash2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { Post } from '../types';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { ConfirmModal } from './ConfirmModal';

interface EditPostModalProps {
  isOpen: boolean;
  post: Post | null;
  isAdmin: boolean;
  onClose: () => void;
  onUpdateSuccess: (updatedPost: Post) => void;
  onDeleteSuccess?: (postId: string) => void;
  onErrorToast: (title: string, message?: string) => void;
  onSuccessToast: (title: string, message?: string) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  post,
  isAdmin,
  onClose,
  onUpdateSuccess,
  onDeleteSuccess,
  onErrorToast,
  onSuccessToast,
}) => {
  // Step: 'verify' (PIN entry) or 'edit' (edit form)
  const [step, setStep] = useState<'verify' | 'edit'>('verify');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string>('');

  // Edit form state
  const [grade, setGrade] = useState<number>(1);
  const [classNum, setClassNum] = useState<number>(1);
  const [studentNum, setStudentNum] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen && post) {
      setPasswordInput('');
      setVerifyError('');
      // If admin, skip password verification step directly to edit
      if (isAdmin) {
        setStep('edit');
      } else {
        setStep('verify');
      }

      setGrade(post.grade);
      setClassNum(post.classNum);
      setStudentNum(String(post.studentNum));
      setStudentName(post.studentName);
      setBookTitle(post.bookTitle);
      setBookAuthor(post.bookAuthor || '');
      setContent(post.content);
      setImageUrl(post.imageUrl);
      setImagePreview(post.imageUrl);
      setChangePassword(false);
      setNewPassword('');
      setShowNewPassword(false);
    }
  }, [isOpen, post, isAdmin]);

  // Focus PIN input on open
  useEffect(() => {
    if (isOpen && step === 'verify') {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  if (!isOpen || !post) return null;

  // Handle PIN verification
  const handleVerifyPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput || passwordInput.length !== 4) {
      setVerifyError('숫자 4자리 비밀번호를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    try {
      const res = await api.verifyPostPassword(post.id, passwordInput.trim());
      if (res.matched) {
        setStep('edit');
      } else {
        setVerifyError(res.message || '비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      }
    } catch {
      // Local check fallback
      const stored = post.password || '1234';
      if (stored === passwordInput.trim()) {
        setStep('edit');
      } else {
        setVerifyError('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle image replacement & compression
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

  // Handle post update submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      onErrorToast('이름 입력 필요', '학생 이름을 입력해주세요.');
      return;
    }
    if (!studentNum || Number(studentNum) < 1) {
      onErrorToast('번호 입력 필요', '올바른 학생 번호를 입력해주세요.');
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
      onErrorToast('사진 필요', '챌린지 인증 사진을 등록해주세요.');
      return;
    }
    if (changePassword && (!newPassword || !/^\d{4}$/.test(newPassword))) {
      onErrorToast('새 비밀번호 오류', '변경할 새 비밀번호는 숫자 4자리여야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatePayload: Partial<Post> & { newPassword?: string } = {
        grade: Number(grade),
        classNum: Number(classNum),
        studentNum: Number(studentNum),
        studentName: studentName.trim(),
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim() || undefined,
        content: content.trim(),
        imageUrl,
      };

      if (changePassword && newPassword) {
        updatePayload.newPassword = newPassword.trim();
      }

      const updated = await api.updatePost(
        post.id,
        updatePayload,
        passwordInput.trim() || post.password,
        isAdmin
      );

      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4ADE80', '#3B82F6', '#FFD100'],
      });

      onSuccessToast('수정 완료!', `'${bookTitle}' 글이 성공적으로 수정되었습니다. ✨`);
      onUpdateSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Update post error:', err);
      onErrorToast('수정 실패', err.message || '글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // In-app Confirm Modal State
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);

  // Handle post delete
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deletePost(post.id, passwordInput.trim() || post.password, isAdmin);
      onSuccessToast('삭제 완료', '게시글이 삭제되었습니다.');
      if (onDeleteSuccess) {
        onDeleteSuccess(post.id);
      }
      onClose();
    } catch (err: any) {
      onErrorToast('삭제 실패', err.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        id="edit-post-modal-card"
        className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[92vh] overflow-y-auto border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative text-slate-900"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#FFD100] px-6 py-4 border-b-4 border-black flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {step === 'verify' ? '🔒' : '✏️'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-black">
                {step === 'verify' ? '비밀번호 확인' : '게시글 수정하기'}
              </h2>
              <p className="text-xs font-bold text-black/80">
                {step === 'verify'
                  ? '글을 작성할 때 설정한 4자리 숫자 비밀번호를 입력해주세요'
                  : `${post.studentName} 학생의 독서 챌린지 인증글 수정`}
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

        {/* STEP 1: PASSWORD VERIFY MODAL */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyPassword} className="p-6 space-y-6">
            {/* Target Post Info Badge */}
            <div className="bg-[#FFFBEB] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#FF6B00] text-white px-2 py-0.5 rounded-md text-xs font-black">
                  {post.month}월 챌린지
                </span>
                <span className="font-black text-xs text-slate-600">
                  {post.grade}학년 {post.classNum}반 {post.studentNum}번 {post.studentName}
                </span>
              </div>
              <div className="flex items-center gap-2 font-black text-sm text-black">
                <BookOpen className="w-4 h-4 text-[#FF6B00]" />
                <span>{post.bookTitle}</span>
                {post.bookAuthor && <span className="text-xs text-slate-500 font-bold">({post.bookAuthor})</span>}
              </div>
            </div>

            {/* PIN Entry Field */}
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] border-2 border-black flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-2xl">
                🔑
              </div>
              <div>
                <label className="block text-sm sm:text-base font-black text-black">
                  4자리 숫자 비밀번호 입력
                </label>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  글 작성 시 입력했던 4자리 번호를 입력하면 수정할 수 있습니다.
                </p>
              </div>

              {/* 4-digit input */}
              <div className="max-w-xs mx-auto">
                <div className="relative">
                  <input
                    ref={pinInputRef}
                    id="input-verify-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={passwordInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      setPasswordInput(val);
                      if (verifyError) setVerifyError('');
                      // Auto submit when 4 digits entered
                      if (val.length === 4) {
                        setTimeout(() => {
                          const stored = post.password || '1234';
                          if (stored === val) {
                            setStep('edit');
                          }
                        }, 150);
                      }
                    }}
                    placeholder="••••"
                    className="w-full text-center tracking-[1em] text-2xl font-black py-3 rounded-2xl border-3 border-black bg-white focus:ring-4 focus:ring-[#FFD100] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] placeholder:tracking-normal placeholder:text-slate-300"
                    autoComplete="off"
                  />
                </div>

                {verifyError && (
                  <div className="mt-2 text-xs font-black text-red-600 bg-red-50 p-2 rounded-xl border border-red-300 flex items-center justify-center gap-1.5 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {/* Friendly hint for sample post */}
                <p className="text-[11px] font-bold text-slate-400 mt-2">
                  (💡 초기 샘플 글의 기본 비밀번호는 <span className="font-black text-slate-700">1234</span> 입니다)
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex items-center justify-center gap-3 border-t-2 border-black">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-black font-black hover:bg-slate-100 text-xs sm:text-sm transition"
              >
                취소
              </button>

              <button
                type="submit"
                id="btn-confirm-pin"
                disabled={isVerifying || passwordInput.length !== 4}
                className="px-6 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black text-xs sm:text-sm font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] flex items-center gap-2 transition disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>확인 중...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>확인하고 수정하기</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: EDIT FORM */}
        {step === 'edit' && (
          <form onSubmit={handleUpdateSubmit} className="p-6 space-y-5">
            {/* Target info card */}
            <div className="bg-[#4ADE80]/20 p-3 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#4ADE80] text-black px-2 py-0.5 rounded-lg border border-black text-xs font-black">
                  {post.month}월 챌린지
                </span>
                <span className="text-xs font-black text-black">
                  {post.challengeTitle}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-600">
                작성일: {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>

            {/* 1. Student Identity Info */}
            <div className="bg-[#FFFBEB] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                1. 학생 정보 (중학교 1~3학년, 1~4반)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">학년</label>
                  <select
                    id="edit-input-grade"
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
                    id="edit-input-class"
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
                    id="edit-input-student-num"
                    type="number"
                    min="1"
                    max="50"
                    value={studentNum}
                    onChange={(e) => setStudentNum(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">이름</label>
                  <input
                    id="edit-input-student-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Book Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  도서명 (책 제목) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="edit-input-book-title"
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
                  id="edit-input-book-author"
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="예: 생텍쥐페리"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#FFD100]"
                />
              </div>
            </div>

            {/* 3. Photo Upload / Replacement Area */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-black uppercase tracking-wider">
                챌린지 인증 사진 변경
              </label>

              {imagePreview ? (
                <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-black border-2 border-black">
                  <img src={imagePreview} alt="미리보기" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-3 right-3 bg-[#FFD100] text-black px-3 py-2 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition hover:bg-yellow-400"
                  >
                    <Upload className="w-4 h-4" />
                    <span>새 사진으로 교체</span>
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
                  <p className="text-xs sm:text-sm font-black text-black">
                    새 사진을 선택하거나 파일 끌어다 놓기
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* 4. Content / Reflection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-black uppercase tracking-wider">
                내용 및 소감 수정 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-input-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="첫 문장 인용, 사진을 찍은 이유, 책에 대한 감상평 등을 작성해주세요..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#FFD100] leading-relaxed"
                required
              />
            </div>

            {/* 5. Optional Password Change Section */}
            <div className="bg-[#FEF3C7] p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-black flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-black text-[#FF6B00] focus:ring-[#FFD100]"
                  />
                  <span>비밀번호를 새로 변경하고 싶어요</span>
                </label>
                {changePassword && newPassword.length === 4 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-400">
                    4자리 입력됨
                  </span>
                )}
              </div>

              {changePassword && (
                <div className="pt-1 space-y-1.5">
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={newPassword}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setNewPassword(val);
                      }}
                      placeholder="새로운 4자리 숫자 비밀번호 입력"
                      className="w-full pl-9 pr-10 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#FFD100] tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 pl-1">
                    앞으로는 새로 설정한 비밀번호로 글을 수정할 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Delete Self & Submit */}
            <div className="pt-3 flex items-center justify-between border-t-2 border-black gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={isDeleting || isSubmitting}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-red-100 text-red-600 font-black text-xs sm:text-sm border-2 border-red-400 hover:border-red-600 flex items-center gap-1.5 transition disabled:opacity-50"
                title="이 글 삭제하기"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>글 삭제하기</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-black font-black hover:bg-slate-100 text-xs sm:text-sm transition"
                >
                  취소
                </button>

                <button
                  type="submit"
                  id="btn-submit-edit-final"
                  disabled={isSubmitting || isDeleting}
                  className="px-6 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black text-xs sm:text-sm font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>수정 내용 저장하기 💾</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Non-blocking iframe-safe Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="게시글 삭제 확인"
        message={`'${post.bookTitle}' 인증글을 정말로 삭제하시겠습니까?`}
        subMessage="삭제 후에는 해당 인증글과 댓글이 모두 삭제되며 복구할 수 없습니다."
        confirmLabel="삭제하기"
        isDestructive={true}
        onConfirm={executeDelete}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
