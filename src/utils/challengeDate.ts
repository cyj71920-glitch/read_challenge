import { ChallengeMonthInfo, ChallengeStatusType, AdminOverrideType } from '../types';

export interface ChallengeStatusDetails {
  status: ChallengeStatusType; // 'active' | 'closed' | 'upcoming'
  canSubmit: boolean;
  canViewPosts: boolean;
  canViewMission: boolean;
  label: string;
  badge: string;
  badgeBg: string;
  dateRangeText: string;
  daysRemaining?: number;
  explanation: string;
  isCurrentRealMonth: boolean;
}

/**
 * Returns the last day of a given month in a year (e.g., 30 for Sep, 31 for Oct)
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Evaluates the status of a monthly challenge based on date and admin overrides.
 *
 * Rules:
 * 1. Each challenge is open from the 1st of that month to the last day of that month.
 * 2. Before the 1st of that month: 'upcoming' (hidden / locked, no submissions).
 * 3. During that month (1st ~ last day): 'active' (mission visible, submissions allowed).
 * 4. After that month: 'closed' (past submissions visible, but new submissions locked).
 * 5. Admin override allows manual open, close, or hide for any month.
 */
export function getChallengeMonthStatus(
  challenge: ChallengeMonthInfo,
  simulatedDate: Date = new Date()
): ChallengeStatusDetails {
  const currentYear = simulatedDate.getFullYear();
  const currentMonthNum = simulatedDate.getMonth() + 1; // 1 ~ 12
  const currentDay = simulatedDate.getDate();

  const targetMonth = challenge.month;
  const lastDay = getLastDayOfMonth(currentYear, targetMonth);
  const isCurrentRealMonth = targetMonth === currentMonthNum;

  // 1. Check Admin Manual Override
  const override: AdminOverrideType = challenge.adminOverride || 'auto';

  if (override === 'force_open') {
    return {
      status: 'active',
      canSubmit: true,
      canViewPosts: true,
      canViewMission: true,
      label: `${targetMonth}월 챌린지 진행 중 🔥 (관리자 오픈)`,
      badge: '관리자 상시 오픈',
      badgeBg: 'bg-[#4ADE80] text-black',
      dateRangeText: `${targetMonth}월 1일 ~ ${targetMonth}월 ${lastDay}일 (강제 오픈됨)`,
      daysRemaining: Math.max(0, lastDay - currentDay),
      explanation: '관리자 권한으로 오픈되어 날짜와 상관없이 지금 바로 글과 사진을 등록할 수 있습니다.',
      isCurrentRealMonth,
    };
  }

  if (override === 'force_closed') {
    return {
      status: 'closed',
      canSubmit: false,
      canViewPosts: true,
      canViewMission: true,
      label: `${targetMonth}월 챌린지 마감됨 ⏰ (관리자 잠금)`,
      badge: '관리자 마감 잠금',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      dateRangeText: `${targetMonth}월 1일 ~ ${targetMonth}월 ${lastDay}일 (마감됨)`,
      explanation: '관리자 설정으로 신규 등록이 마감되었습니다. 기존 등록된 글과 사진은 열람 가능합니다.',
      isCurrentRealMonth,
    };
  }

  if (override === 'force_hidden') {
    return {
      status: 'upcoming',
      canSubmit: false,
      canViewPosts: false,
      canViewMission: false,
      label: `${targetMonth}월 챌린지 비공개 🔒 (관리자 설정)`,
      badge: '비공개 잠금',
      badgeBg: 'bg-slate-800 text-white',
      dateRangeText: `${targetMonth}월 1일 공개 예정`,
      explanation: '관리자 설정에 의해 미션 및 글이 비공개 상태로 유지되고 있습니다.',
      isCurrentRealMonth,
    };
  }

  // 2. Automatic Date-Based Evaluation ('auto')
  if (targetMonth < currentMonthNum) {
    // Past month: Posts visible, submissions closed
    return {
      status: 'closed',
      canSubmit: false,
      canViewPosts: true,
      canViewMission: true,
      label: `${targetMonth}월 챌린지 기간 종료 ⏰`,
      badge: '마감됨 (글 열람 가능)',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      dateRangeText: `${targetMonth}월 1일 ~ ${targetMonth}월 ${lastDay}일 (종료)`,
      explanation: `${targetMonth}월 챌린지 기간(${targetMonth}월 1일~${lastDay}일)이 마감되었습니다. 기존 등록된 글과 사진은 계속 감상하실 수 있습니다.`,
      isCurrentRealMonth,
    };
  } else if (targetMonth === currentMonthNum) {
    // Current month: Active and open for submissions!
    const daysLeft = Math.max(0, lastDay - currentDay);
    return {
      status: 'active',
      canSubmit: true,
      canViewPosts: true,
      canViewMission: true,
      label: `${targetMonth}월 챌린지 진행 중 🔥`,
      badge: daysLeft > 0 ? `D-${daysLeft} 참여 가능` : '오늘 마감!',
      badgeBg: 'bg-[#4ADE80] text-black',
      dateRangeText: `${targetMonth}월 1일 ~ ${targetMonth}월 ${lastDay}일까지 접수`,
      daysRemaining: daysLeft,
      explanation: `${targetMonth}월 1일부터 ${lastDay}일까지 챌린지 참여 및 사진 업로드가 진행 중입니다.`,
      isCurrentRealMonth,
    };
  } else {
    // Future month: Locked until the 1st of that month
    return {
      status: 'upcoming',
      canSubmit: false,
      canViewPosts: false,
      canViewMission: false,
      label: `${targetMonth}월 챌린지 오픈 예정 🔒`,
      badge: `${targetMonth}월 1일 자동 공개`,
      badgeBg: 'bg-slate-800 text-[#FFD100]',
      dateRangeText: `${targetMonth}월 1일 ~ ${targetMonth}월 ${lastDay}일`,
      explanation: `${targetMonth}월 1일 00시에 새로운 독서 미션이 자동으로 전격 공개되며, ${targetMonth}월 1일부터 ${lastDay}일까지 참여하실 수 있습니다.`,
      isCurrentRealMonth,
    };
  }
}
