import React, { useState, useMemo } from 'react';
import { Trophy, Flame, Sparkles, Flag, Award, RefreshCw, Volume2, PartyPopper, Zap } from 'lucide-react';
import { Post, StudentRosterItem, ClassRaceItem } from '../types';
import { CLASS_MASCOTS } from '../data/challenges';
import confetti from 'canvas-confetti';

interface ClassRaceTrackProps {
  posts: Post[];
  roster: StudentRosterItem[];
  currentMonth: number | 'all';
  onOpenSubmitModal: () => void;
}

export const ClassRaceTrack: React.FC<ClassRaceTrackProps> = ({
  posts,
  roster,
  currentMonth,
  onOpenSubmitModal,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [cheerCount, setCheerCount] = useState(142);
  const [turboBoost, setTurboBoost] = useState(false);

  // Compute participation metrics per class
  const raceData: ClassRaceItem[] = useMemo(() => {
    const classMap = new Map<string, { grade: number; classNum: number; total: number; submitted: number }>();

    // Seed classes from roster
    roster.forEach((student) => {
      const key = `${student.grade}-${student.classNum}`;
      if (!classMap.has(key)) {
        classMap.set(key, { grade: student.grade, classNum: student.classNum, total: 0, submitted: 0 });
      }
      const entry = classMap.get(key)!;
      entry.total += 1;
    });

    if (classMap.size === 0) {
      for (let g = 1; g <= 3; g++) {
        for (let c = 1; c <= 4; c++) {
          classMap.set(`${g}-${c}`, { grade: g, classNum: c, total: 20, submitted: 0 });
        }
      }
    }

    const activePosts = posts.filter(
      (p) => !p.isDeleted && (currentMonth === 'all' || p.month === currentMonth)
    );

    classMap.forEach((val, classKey) => {
      const [g, c] = classKey.split('-').map(Number);
      const classPosts = activePosts.filter((p) => p.grade === g && p.classNum === c);
      const uniqueSubmitters = new Set(classPosts.map((p) => `${p.studentNum}_${p.studentName.trim()}`));
      val.submitted = uniqueSubmitters.size;
    });

    const list: ClassRaceItem[] = [];
    classMap.forEach(({ grade, classNum, total, submitted }) => {
      if (selectedGrade !== 'all' && grade !== selectedGrade) return;

      const totalCount = Math.max(total, 5);
      const rate = Math.min(100, Math.round((submitted / totalCount) * 100));
      const distance = Math.max(6, Math.min(88, 6 + rate * 0.82));
      const mascot = CLASS_MASCOTS[classNum] || {
        name: `${classNum}반 주자`,
        emoji: '🏃',
        color: 'text-amber-600 bg-amber-100 border-amber-300',
      };

      list.push({
        grade,
        classNum,
        classLabel: `${grade}학년 ${classNum}반`,
        totalStudents: totalCount,
        submittedCount: submitted,
        participationRate: rate,
        rank: 1,
        mascotName: mascot.name,
        mascotEmoji: mascot.emoji,
        mascotColor: mascot.color,
        distancePercent: distance,
      });
    });

    list.sort((a, b) => b.participationRate - a.participationRate || b.submittedCount - a.submittedCount);
    list.forEach((item, index) => {
      item.rank = index + 1;
      item.isTopRank = index === 0 && item.submittedCount > 0;
    });

    return list;
  }, [posts, roster, currentMonth, selectedGrade]);

  const topClass = raceData[0];

  const triggerCheerCelebration = (e: React.MouseEvent) => {
    setCheerCount((c) => c + 1);
    setTurboBoost(true);
    setTimeout(() => setTurboBoost(false), 1500);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { x, y },
      colors: ['#FFD100', '#FF6B00', '#4ADE80', '#3B82F6', '#EF4444'],
    });
  };

  return (
    <div className="space-y-6">
      {/* Race Track Header & Stadium Atmosphere */}
      <div className="rounded-[2rem] bg-[#3B82F6] text-white p-6 sm:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-black text-[#FFD100] border-2 border-white">
              <Flame className="w-4 h-4 text-[#FFD100] animate-pulse" />
              <span>실시간 애니메이션 달리기 경기장</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🏃‍♂️ 우리 반 독서 달리기 그랑프리!</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-blue-100">
              우리 반 친구들이 독서 챌린지 인증 글을 올릴 때마다 결승선을 향해 신나게 발을 굴리며 달립니다!
            </p>
          </div>

          {/* Action cheering button & Live Top Rank Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-cheer-stadium"
              onClick={triggerCheerCelebration}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-black text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] transition-all ${
                turboBoost ? 'bg-[#EF4444] text-white scale-105' : 'bg-[#FFD100] hover:bg-[#ffe043]'
              }`}
            >
              <Zap className="w-4 h-4 text-[#FF6B00]" />
              <span>부스터 응원하기! 📣 ({cheerCount}회)</span>
            </button>

            <button
              onClick={onOpenSubmitModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black font-black text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] transition-all"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>우리 반 달리기 점수 올리기 📸</span>
            </button>
          </div>
        </div>

        {/* Grade Filter Bar */}
        <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-black">학년 경기장 선택:</span>
            <div className="flex bg-white p-1 rounded-xl border-2 border-black">
              <button
                id="race-grade-all"
                onClick={() => setSelectedGrade('all')}
                className={`px-3 py-1 rounded-lg font-black transition-all ${
                  selectedGrade === 'all'
                    ? 'bg-[#FF6B00] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-black hover:bg-yellow-100'
                }`}
              >
                전체 반 통합
              </button>
              {[1, 2, 3].map((g) => (
                <button
                  key={g}
                  id={`race-grade-${g}`}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1 rounded-lg font-black transition-all ${
                    selectedGrade === g
                      ? 'bg-[#FF6B00] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-black hover:bg-yellow-100'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {topClass && (
            <div className="flex items-center gap-2 bg-white text-black px-3.5 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-black">
              <Trophy className="w-4 h-4 text-[#FF6B00] animate-bounce" />
              <span>현재 1등 질주:</span>
              <span className="text-[#FF6B00] font-black">{topClass.classLabel}</span>
              <span>({topClass.participationRate}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Stadium Athletics Track Visual Field */}
      <div className="bg-white rounded-[2rem] p-5 sm:p-7 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        {/* Track Top Banner & Finish Line marker */}
        <div className="flex justify-between items-center text-xs font-black text-black px-4 py-2.5 bg-[#FFD100] rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <span>🏁 출발선 (START LINE)</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline text-black/60">25% 반환</span>
            <span className="hidden sm:inline text-black">50% 스퍼트 지점 🏃</span>
            <span className="hidden sm:inline text-black/60">75% 막판질주</span>
            <div className="flex items-center gap-1.5 bg-[#EF4444] text-white px-3 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-ribbon">
              <Flag className="w-4 h-4 text-white" />
              <span>결승선 100% (GOAL)</span>
            </div>
          </div>
        </div>

        {/* Lanes List */}
        <div className="space-y-3.5">
          {raceData.map((item) => {
            const isFirst = item.rank === 1 && item.submittedCount > 0;
            const isSecond = item.rank === 2 && item.submittedCount > 0;
            const isThird = item.rank === 3 && item.submittedCount > 0;
            const isMoving = item.participationRate > 0;

            return (
              <div
                key={`${item.grade}-${item.classNum}`}
                id={`race-lane-${item.grade}-${item.classNum}`}
                className={`relative rounded-2xl p-3.5 sm:p-4 border-2 border-black transition-all ${
                  isFirst
                    ? 'bg-[#FFFBEB] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-[#FFD100]'
                    : 'bg-slate-50'
                }`}
              >
                {/* Lane Info Header */}
                <div className="flex items-center justify-between mb-2 text-xs font-black">
                  <div className="flex items-center gap-2">
                    {/* Rank Badge */}
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border border-black ${
                        isFirst
                          ? 'bg-[#FFD100] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : isSecond
                          ? 'bg-slate-200 text-black'
                          : isThird
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-white text-slate-700'
                      }`}
                    >
                      {item.rank}
                    </span>

                    <span className="font-black text-sm text-black">
                      {item.classLabel}
                    </span>

                    <span className="text-xs text-slate-600 font-bold">
                      ({item.mascotName} {item.mascotEmoji})
                    </span>

                    {isFirst && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#EF4444] text-white border border-black px-2.5 py-0.5 rounded-full animate-pulse">
                        <Flame className="w-3 h-3 text-white" />
                        선두 질주 중! 🔥
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs font-bold">
                      제출 <strong className="text-black">{item.submittedCount}명</strong> / {item.totalStudents}명
                    </span>
                    <span
                      className={`font-black text-sm px-2.5 py-0.5 rounded-lg border border-black ${
                        isFirst
                          ? 'bg-[#4ADE80] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black'
                      }`}
                    >
                      {item.participationRate}%
                    </span>
                  </div>
                </div>

                {/* Track Lane Graphic with Animated Running Mascot - Slim graph & fully visible runner */}
                <div className="relative pt-10 pb-2 px-4 sm:px-6 overflow-visible">
                  {/* Slim Stadium Track Bar */}
                  <div className="relative h-5 sm:h-6 bg-[#CBD5E1] rounded-full border-2 border-black overflow-hidden shadow-inner flex items-center">
                    {/* Track Surface Center Dashed Line */}
                    <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-400 opacity-70 pointer-events-none" />

                    {/* Colored Progress Fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFirst ? 'bg-[#4ADE80]' : 'bg-[#3B82F6]'
                      }`}
                      style={{ width: `${Math.max(4, item.participationRate)}%` }}
                    />
                  </div>

                  {/* Start Marker on Track */}
                  <div className="absolute left-1 sm:left-2 bottom-2 sm:bottom-2 text-[9px] font-black text-slate-400 pointer-events-none">
                    START
                  </div>

                  {/* Goal Flag on Track */}
                  <div className="absolute right-1 sm:right-2 bottom-1.5 sm:bottom-1.5 flex items-center gap-1 z-10 pointer-events-none">
                    <Flag className="w-5 h-5 text-[#EF4444] animate-bounce" />
                    <span className="text-[9px] font-black text-red-600 bg-white/95 px-1 py-0.2 rounded border border-red-300 shadow-sm hidden sm:inline">
                      GOAL
                    </span>
                  </div>

                  {/* Animated Runner Mascot - Positioned above the slim track with zero clipping */}
                  <div
                    className="absolute top-0 transition-all duration-700 ease-out z-20 pointer-events-auto"
                    style={{
                      left: `calc(20px + ${Math.min(94, Math.max(0, item.participationRate))} * (100% - 64px) / 100)`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="flex flex-col items-center select-none">
                      {/* Speech Bubble on Top */}
                      {isFirst ? (
                        <div className="mb-1 bg-[#FFD100] text-black font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md whitespace-nowrap border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                          1등 질주! 🏃‍♂️💨
                        </div>
                      ) : isMoving ? (
                        <div className="mb-1 bg-white text-black font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                          달리는 중! 🔥
                        </div>
                      ) : (
                        <div className="mb-1 text-[9px] font-bold text-slate-400 opacity-80 whitespace-nowrap">
                          출발 대기
                        </div>
                      )}

                      {/* Mascot Card with Sprint Animation */}
                      <div className="relative flex items-center justify-center">
                        {isMoving && (
                          <span className="absolute -left-4 top-1 text-sm sm:text-base animate-dust pointer-events-none">
                            💨
                          </span>
                        )}

                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl border-2 border-black transform transition cursor-pointer ${
                            isFirst
                              ? 'bg-[#FFD100] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-2 ring-amber-400'
                              : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          } ${isMoving ? 'animate-runner' : ''} ${
                            turboBoost ? 'animate-runner-fast scale-110' : ''
                          }`}
                          title={`${item.classLabel} (${item.participationRate}%)`}
                        >
                          <span className="leading-none">{item.mascotEmoji}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Podium & Class Cheer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {raceData.slice(0, 3).map((item, index) => {
          const medals = ['🥇 1위 (금메달)', '🥈 2위 (은메달)', '🥉 3위 (동메달)'];
          const bgColors = ['bg-[#FFD100]', 'bg-white', 'bg-[#FF6B00] text-white'];

          return (
            <div
              key={item.classLabel}
              className={`rounded-[2rem] p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3 ${bgColors[index]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 rounded-full border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {medals[index]}
                </span>
                <span className="text-3xl animate-runner">{item.mascotEmoji}</span>
              </div>

              <div>
                <h3 className="text-xl font-black">{item.classLabel}</h3>
                <p className="text-xs font-bold opacity-90">
                  {item.mascotName} • 총 {item.totalStudents}명 중 {item.submittedCount}명 제출
                </p>
              </div>

              {/* Progress mini bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-black">
                  <span>참여율</span>
                  <span>{item.participationRate}%</span>
                </div>
                <div className="w-full bg-white h-3 rounded-full border-2 border-black overflow-hidden">
                  <div
                    className="bg-[#4ADE80] h-full transition-all duration-500"
                    style={{ width: `${item.participationRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
