import React from 'react';
import { BookOpen, Trophy, PlusCircle, ShieldCheck, Flame, Calendar, LayoutGrid, Lock, Clock, CheckCircle2, Radio } from 'lucide-react';
import { ChallengeMonthInfo } from '../types';
import { CHALLENGE_MONTHS } from '../data/challenges';
import { getChallengeMonthStatus } from '../utils/challengeDate';

interface NavbarProps {
  currentMonth: number | 'all';
  onSelectMonth: (month: number | 'all') => void;
  activeView: 'feed' | 'race' | 'admin';
  onSelectView: (view: 'feed' | 'race' | 'admin') => void;
  onOpenSubmitModal: () => void;
  totalSubmissions: number;
  challenges?: ChallengeMonthInfo[];
  previewAllMonths?: boolean;
  isAdminAuthenticated?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onSelectMonth,
  activeView,
  onSelectView,
  onOpenSubmitModal,
  totalSubmissions,
  challenges = CHALLENGE_MONTHS,
  previewAllMonths = false,
  isAdminAuthenticated = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFD100] border-b-4 border-black shadow-[0_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Top Banner & Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectView('feed')}
          >
            <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center justify-center transform hover:rotate-3 transition">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF6B00]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-black leading-tight text-black flex flex-col justify-center">
                  <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wider">
                    창녕중
                  </span>
                  <span className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black">
                    독서 챌린지
                  </span>
                </h1>
                <div className="hidden sm:flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />
                      누적 {totalSubmissions}건 도전 중
                    </span>
                    {/* Real-time sync badge */}
                    <span
                      className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      title="다른 친구들이 올린 사진과 글이 실시간으로 자동 동기화됩니다."
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ADE80]"></span>
                      </span>
                      <span>실시간 라이브 연동</span>
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-black/75 hidden md:block mt-0.5">
                매월 1일~말일 자동 진행되는 독서 미션 & 실시간 반별 달리기!
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View switcher buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="nav-btn-feed"
                onClick={() => onSelectView('feed')}
                className={`p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all cursor-pointer ${
                  activeView === 'feed'
                    ? 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#FFD100] text-black hover:bg-white/60'
                }`}
                title="피드 보기"
              >
                <LayoutGrid className="w-5 h-5 text-black" />
              </button>

              <button
                id="nav-btn-race"
                onClick={() => onSelectView('race')}
                className={`relative flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all cursor-pointer ${
                  activeView === 'race'
                    ? 'bg-[#FFD100] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black'
                    : 'bg-[#FFD100] text-black hover:bg-white/60 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <Trophy className="w-4 h-4 text-black" />
                <span>경기장 순위</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </button>

              <button
                id="nav-btn-admin"
                onClick={() => onSelectView('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#FF6B00] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e05e00]'
                }`}
                title={isAdminAuthenticated ? '관리자 모드 (인증됨)' : '관리자 모드 (비밀번호 로그인 필요)'}
              >
                <Lock className="w-4 h-4 text-white" />
                <span>관리자</span>
              </button>
            </div>

            {/* Submission CTA Button */}
            <button
              id="nav-btn-submit-post"
              onClick={onOpenSubmitModal}
              className="flex items-center gap-1.5 bg-[#4ADE80] hover:bg-[#3ecf73] text-black px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>사진 올리기 📸</span>
            </button>
          </div>
        </div>

        {/* Monthly Challenge Tabs Bar */}
        <div className="py-2.5 border-t-2 border-black/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-xs font-black text-black shrink-0 mr-1 pl-1">
            <Calendar className="w-4 h-4 text-black" />
            <span>월별 챌린지:</span>
          </div>

          <button
            id="month-tab-all"
            onClick={() => onSelectMonth('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black shrink-0 border-2 border-black transition-all cursor-pointer ${
              currentMonth === 'all'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            }`}
          >
            전체 보기
          </button>

          {challenges.map((ch) => {
            const isSelected = currentMonth === ch.month;
            const statusInfo = getChallengeMonthStatus(ch);
            const isPreview = previewAllMonths && isAdminAuthenticated;
            const status = isPreview ? 'active' : statusInfo.status;

            return (
              <button
                key={ch.month}
                id={`month-tab-${ch.month}`}
                onClick={() => onSelectMonth(ch.month)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black shrink-0 border-2 border-black transition-all cursor-pointer ${
                  status === 'active'
                    ? 'bg-[#4ADE80] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    : isSelected
                    ? 'bg-amber-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black'
                    : 'bg-white text-black hover:bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {status === 'active' && <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />}
                {status === 'closed' && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                {status === 'upcoming' && <Lock className="w-3.5 h-3.5 text-black" />}
                
                <span>{ch.month}월</span>
                
                <span className="text-[11px] font-black">
                  {status === 'active' ? '진행중' : status === 'closed' ? '마감' : '1일 공개'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
