import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, Award, Camera, Lock, Clock, AlertCircle } from 'lucide-react';
import { ChallengeMonthInfo } from '../types';
import { CHALLENGE_MONTHS } from '../data/challenges';
import { getChallengeMonthStatus } from '../utils/challengeDate';

interface ChallengeBannerProps {
  currentMonth: number | 'all';
  onOpenSubmitModal: () => void;
  postCount: number;
  challenges?: ChallengeMonthInfo[];
  previewAllMonths?: boolean;
  onTogglePreviewAll?: () => void;
  isAdmin?: boolean;
}

export const ChallengeBanner: React.FC<ChallengeBannerProps> = ({
  currentMonth,
  onOpenSubmitModal,
  postCount,
  challenges = CHALLENGE_MONTHS,
  previewAllMonths = false,
  onTogglePreviewAll,
  isAdmin = false,
}) => {
  const activeMonthNum = typeof currentMonth === 'number' ? currentMonth : 9;
  const challenge: ChallengeMonthInfo =
    challenges.find((m) => m.month === activeMonthNum) || challenges[0];

  // Evaluate dynamic status
  const statusInfo = getChallengeMonthStatus(challenge);
  const isPreviewMode = previewAllMonths && isAdmin;
  const effectiveStatus = isPreviewMode ? 'active' : statusInfo.status;

  const getThemeColor = () => {
    switch (challenge.month) {
      case 9:
        return 'bg-[#4ADE80] text-black';
      case 10:
        return 'bg-[#FF6B00] text-white';
      case 11:
        return 'bg-[#3B82F6] text-white';
      case 12:
        return 'bg-[#8B5CF6] text-white';
      default:
        return 'bg-[#FFD100] text-black';
    }
  };

  // 1. UPCOMING / LOCKED STATE (Before the 1st of that month)
  if (effectiveStatus === 'upcoming') {
    return (
      <div
        id="challenge-locked-banner"
        className="rounded-[2rem] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-7 relative overflow-hidden h-full flex flex-col justify-between"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          <div className="xl:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-[#FFD100] border-2 border-black">
                <Lock className="w-3.5 h-3.5" />
                {challenge.month}월 챌린지 (공개 대기 중)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#FFD100] text-black border-2 border-black">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                오픈 일정: {statusInfo.dateRangeText}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black flex items-center gap-3">
                <span>🔒 {challenge.month}월 챌린지</span>
              </h2>
              <p className="text-sm sm:text-base font-extrabold text-[#FF6B00] mt-1">
                {challenge.month}월 1일이 되면 어떤 신나는 독서 미션인지 전격 공개됩니다! 🎁
              </p>
            </div>

            <div className="bg-[#FFFBEB] p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                {statusInfo.explanation} <br />
                {challenge.month}월 챌린지가 열리기 전까지, 지금 오픈 중인 <strong>진행 중인 챌린지</strong>에 참여하여 우리 반 달리기 점수를 미리 올려보세요!
              </p>
            </div>
          </div>

          <div className="xl:col-span-4 bg-slate-900 rounded-3xl p-5 border-4 border-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="inline-flex p-2.5 rounded-2xl bg-[#FFD100] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Lock className="w-7 h-7 text-black" />
              </div>
              <h3 className="text-lg font-black text-white">{challenge.month}월 미션 비밀보관</h3>
              <p className="text-xs font-bold text-slate-300">
                {challenge.month}월 1일 00시에 자동 오픈됩니다!
              </p>
            </div>

            <div className="py-2.5 px-3 rounded-2xl bg-slate-800 border-2 border-black text-white flex items-center justify-around">
              <div>
                <p className="text-[10px] font-bold text-slate-400">오픈 일정</p>
                <p className="text-sm font-black text-[#FFD100]">{challenge.month}월 1일 ~ 말일</p>
              </div>
            </div>

            <div className="py-2 text-xs font-bold text-slate-300 bg-slate-800/80 rounded-xl border border-slate-700">
              🔒 {challenge.month}월 1일부터 글/사진 등록 가능
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLOSED STATE (Past month: submissions locked, past posts viewable)
  if (effectiveStatus === 'closed') {
    return (
      <div
        id="challenge-closed-banner"
        className="rounded-[2rem] bg-amber-50 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-7 relative overflow-hidden h-full flex flex-col justify-between"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          <div className="xl:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-200 text-amber-900 border-2 border-black">
                <Clock className="w-3.5 h-3.5 text-amber-800" />
                {challenge.month}월 챌린지 (기간 종료 ⏰)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white text-black border-2 border-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                기존 인증글 열람 가능
              </span>
              <span className="text-xs font-bold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-slate-300">
                운영 기간: {statusInfo.dateRangeText}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black flex items-center gap-3">
                <span>{challenge.month}월 챌린지 : &lt;{challenge.title}&gt;</span>
              </h2>
              <p className="text-sm sm:text-base font-extrabold text-amber-800 mt-1">
                {challenge.subtitle}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                📌 <strong>{challenge.month}월 챌린지 접수 기간이 마감되었습니다.</strong> <br />
                친구들이 작성한 독서 소감과 멋진 사진들은 아래 피드에서 언제든지 자유롭게 감상하고 응원 댓글을 달 수 있습니다. (신규 글 등록은 마감되었습니다.)
              </p>
            </div>

            {/* Mission outline for historical review */}
            <p className="text-xs font-bold text-slate-600">
              미션 내용: {challenge.missionDescription}
            </p>
          </div>

          <div className="xl:col-span-4 bg-slate-800 rounded-3xl p-5 border-4 border-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="inline-flex p-2.5 rounded-2xl bg-amber-400 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Award className="w-7 h-7 text-black" />
              </div>
              <h3 className="text-lg font-black text-white">{challenge.month}월 챌린지 완료 🏆</h3>
              <p className="text-xs font-bold text-slate-300">
                총 {postCount}명의 친구들이 참여했습니다!
              </p>
            </div>

            <div className="py-2.5 px-3 rounded-2xl bg-white border-2 border-black text-black flex items-center justify-around shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <p className="text-[10px] font-bold text-slate-500">{challenge.month}월 참여 글</p>
                <p className="text-xl font-black text-[#FF6B00]">{postCount}건</p>
              </div>
              <div className="w-0.5 h-6 bg-slate-300" />
              <div>
                <p className="text-[10px] font-bold text-slate-500">지급 배지</p>
                <p className="text-xs font-black text-black">{challenge.badge}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full py-2.5 px-3 rounded-xl bg-slate-700 text-slate-300 font-black text-xs border-2 border-slate-600 flex items-center justify-center gap-2 select-none">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>접수 마감 (아래 피드에서 글 열람 가능)</span>
              </div>
              {isAdmin && (
                <p className="text-[10px] font-bold text-yellow-300">
                  💡 관리자 모드에서 상시 오픈으로 변경할 수 있습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ACTIVE STATE (Currently open for submissions: 1st ~ last day of month)
  return (
    <div
      id="challenge-open-banner"
      className="rounded-[2rem] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 relative overflow-hidden h-full flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Top Badges (Screen 1) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black border-2 border-black bg-[#4ADE80] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {challenge.month}월 챌린지 (진행 중 🔥)
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-[#FFD100] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Award className="w-3.5 h-3.5 text-[#FF6B00]" />
            획득 배지: {challenge.badge || '📖 첫문장 탐험가'}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-[#BAE6FD] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span>📅 {challenge.month}월 1일 ~ {challenge.month}월 30일까지 접수</span>
          </span>
        </div>

        {/* Title and Subtitle */}
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black flex items-center gap-3">
            <span>{challenge.month}월 챌린지 : &lt;{challenge.title}&gt;</span>
          </h2>
          <p className="text-base sm:text-lg font-black text-[#FF6B00] mt-1.5">
            {challenge.subtitle}
          </p>
        </div>

        {/* Mission Description Box */}
        <div className="bg-[#FFFBEB] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm sm:text-base font-black text-slate-900 leading-relaxed">
            {challenge.missionDescription}
          </p>
        </div>

        {/* Tips / Rules (Screen 1 - 3 columns) */}
        {challenge.tips && challenge.tips.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs sm:text-sm font-black text-black flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
              {challenge.month}월 챌린지 참여 꿀팁
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm font-black text-slate-800">
              {challenge.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-start gap-2"
                >
                  <span className="text-[#FF6B00] font-black shrink-0">{idx + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Action Row */}
      <div className="pt-4 flex justify-end">
        <button
          id="banner-btn-submit"
          onClick={onOpenSubmitModal}
          className="inline-flex items-center gap-2 bg-[#4ADE80] hover:bg-[#3ecf73] text-black px-6 py-3 rounded-2xl text-sm sm:text-base font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>{challenge.month}월 챌린지 참여하기 📷</span>
        </button>
      </div>
    </div>
  );
};

