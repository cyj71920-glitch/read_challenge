import React, { useState, useMemo } from 'react';
import { Trophy, Flame, Sparkles, Flag, PartyPopper, ChevronRight, Maximize2 } from 'lucide-react';
import { Post, StudentRosterItem, ClassRaceItem } from '../types';
import { CLASS_MASCOTS } from '../data/challenges';
import confetti from 'canvas-confetti';

interface MiniRaceWidgetProps {
  posts: Post[];
  roster: StudentRosterItem[];
  currentMonth: number | 'all';
  onExpandFullRace: () => void;
  onOpenSubmitModal: () => void;
}

export const MiniRaceWidget: React.FC<MiniRaceWidgetProps> = ({
  posts,
  roster,
  currentMonth,
  onExpandFullRace,
  onOpenSubmitModal,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [isCheering, setIsCheering] = useState<boolean>(false);
  const [cheerTaps, setCheerTaps] = useState<number>(38);

  // Compute participation metrics per class
  const raceData: ClassRaceItem[] = useMemo(() => {
    const classMap = new Map<string, { grade: number; classNum: number; total: number; submitted: number }>();

    roster.forEach((student) => {
      const key = `${student.grade}-${student.classNum}`;
      if (!classMap.has(key)) {
        classMap.set(key, { grade: student.grade, classNum: student.classNum, total: 0, submitted: 0 });
      }
      classMap.get(key)!.total += 1;
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
      const distance = Math.max(10, Math.min(88, 10 + rate * 0.78));
      const mascot = CLASS_MASCOTS[classNum] || {
        name: `${classNum}반 주자`,
        emoji: '🏃',
        color: 'text-amber-600 bg-amber-100 border-amber-300',
      };

      list.push({
        grade,
        classNum,
        classLabel: `${grade}-${classNum}반`,
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

  const topRunner = raceData[0];

  const handleCheer = (e: React.MouseEvent) => {
    setCheerTaps((c) => c + 1);
    setIsCheering(true);
    setTimeout(() => setIsCheering(false), 800);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { x, y },
      colors: ['#FFD100', '#FF6B00', '#4ADE80', '#3B82F6', '#EF4444'],
    });
  };

  return (
    <aside
      id="side-mini-race-track"
      className="bg-white rounded-[2rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col transition-all h-full"
    >
      {/* Widget Header */}
      <div className="bg-[#3B82F6] text-white p-3.5 sm:p-4 border-b-4 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFD100] text-black border-2 border-black flex items-center justify-center text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
            🏃
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                실시간 반별 달리기
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            <p className="text-[11px] font-bold text-blue-100">
              인증샷 등록 시 즉시 전진! 💨
            </p>
          </div>
        </div>

        <button
          onClick={onExpandFullRace}
          className="bg-white hover:bg-yellow-100 text-black p-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
          title="큰 경기장으로 보기"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Grade Selector Strip */}
      <div className="bg-[#FFFBEB] px-3 py-2 border-b-2 border-black flex items-center justify-between text-[11px] font-black">
        <span className="text-black flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-[#FF6B00]" />
          학년:
        </span>
        <div className="flex bg-white rounded-lg p-0.5 border border-black gap-0.5">
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
              selectedGrade === 'all'
                ? 'bg-[#FF6B00] text-white'
                : 'text-black hover:bg-yellow-50'
            }`}
          >
            전체
          </button>
          {[1, 2, 3].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                selectedGrade === g
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-black hover:bg-yellow-50'
              }`}
            >
              {g}학년
            </button>
          ))}
        </div>
      </div>

      {/* Animated Mini Running Track Field */}
      <div className="p-3 space-y-2.5 max-h-[350px] overflow-y-auto bg-[#F8FAFC] flex-1">
        {/* Track ruler */}
        <div className="flex justify-between items-center text-[10px] font-black text-slate-600 px-2 py-1 bg-slate-200 rounded-lg border border-slate-400">
          <span>🏁 START</span>
          <span className="text-slate-400">50%</span>
          <span className="flex items-center gap-0.5 text-red-600">
            <Flag className="w-3 h-3 text-red-500" />
            GOAL
          </span>
        </div>

        {/* Lanes */}
        <div className="space-y-2">
          {raceData.slice(0, 7).map((item) => {
            const isFirst = item.rank === 1 && item.submittedCount > 0;
            const isMoving = item.participationRate > 0;

            return (
              <div
                key={`${item.grade}-${item.classNum}`}
                className={`rounded-xl border-2 border-black p-2 transition-all ${
                  isFirst
                    ? 'bg-[#FFFBEB] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white'
                }`}
              >
                {/* Lane Top info */}
                <div className="flex items-center justify-between text-[11px] font-black mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black border border-black ${
                        item.rank === 1
                          ? 'bg-[#FFD100] text-black'
                          : item.rank === 2
                          ? 'bg-slate-300 text-black'
                          : item.rank === 3
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-black">{item.classLabel}</span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {item.mascotName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {item.submittedCount}/{item.totalStudents}명
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-black text-[11px] border border-black ${
                        isFirst ? 'bg-[#4ADE80] text-black' : 'bg-slate-100 text-black'
                      }`}
                    >
                      {item.participationRate}%
                    </span>
                  </div>
                </div>

                {/* Animated Track Graphic with Prominent Character - Slim & Unclipped */}
                <div className="relative pt-6 pb-1 px-3 overflow-visible">
                  {/* Slim Track Lane */}
                  <div className="relative h-4 bg-slate-200 rounded-full border border-black overflow-hidden shadow-inner flex items-center">
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-400 opacity-50 pointer-events-none" />
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFirst ? 'bg-[#4ADE80]' : 'bg-[#3B82F6]'
                      }`}
                      style={{ width: `${Math.max(5, item.participationRate)}%` }}
                    />
                  </div>

                  {/* Goal Flag */}
                  <div className="absolute right-1 bottom-1 flex items-center pointer-events-none z-10">
                    <Flag className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                  </div>

                  {/* Running Animated Mascot & Dust - Positioned above track with zero clipping */}
                  <div
                    className="absolute top-0 transition-all duration-700 ease-out z-20 pointer-events-auto"
                    style={{
                      left: `calc(14px + ${Math.min(94, Math.max(0, item.participationRate))} * (100% - 44px) / 100)`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="relative flex items-center">
                      {/* Dust cloud behind runner */}
                      {isMoving && (
                        <span className="absolute -left-3 top-0.5 text-xs animate-dust pointer-events-none select-none">
                          💨
                        </span>
                      )}

                      {/* Animated Mascot with Running Sprint Animation */}
                      <div
                        className={`w-7 h-7 rounded-lg border border-black flex items-center justify-center text-base shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform ${
                          isFirst ? 'bg-[#FFD100] ring-1 ring-[#FF6B00]' : 'bg-white'
                        } ${isMoving ? 'animate-runner' : ''} ${
                          isCheering ? 'animate-runner-fast scale-110' : ''
                        }`}
                        title={`${item.classLabel} (${item.participationRate}%)`}
                      >
                        <span className="select-none leading-none">{item.mascotEmoji}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Widget Footer Actions */}
      <div className="p-3 bg-[#FFD100] border-t-2 border-black space-y-2">
        <div className="flex gap-2">
          <button
            id="btn-mini-cheer"
            onClick={handleCheer}
            className="flex-1 py-2 px-2.5 rounded-xl bg-white hover:bg-yellow-50 text-black text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center justify-center gap-1"
          >
            <PartyPopper className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>응원 ({cheerTaps})</span>
          </button>

          <button
            onClick={onOpenSubmitModal}
            className="flex-1 py-2 px-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>달리기 UP!</span>
          </button>
        </div>

        <button
          onClick={onExpandFullRace}
          className="w-full text-center text-[11px] font-black text-black/80 hover:text-black flex items-center justify-center gap-1 py-1 hover:underline transition"
        >
          <span>경기장 전체 순위 & 시상대 보기</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
