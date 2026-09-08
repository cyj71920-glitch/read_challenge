export type ChallengeStatusType = 'active' | 'closed' | 'upcoming';
export type AdminOverrideType = 'auto' | 'force_open' | 'force_closed' | 'force_hidden';

export interface ChallengeMonthInfo {
  month: number; // 9, 10, 11, 12 etc.
  title: string; // e.g. "첫문장 챌린지"
  subtitle: string;
  theme: string;
  badge: string;
  iconName: string;
  color: {
    bg: string;
    border: string;
    text: string;
    light: string;
    gradient: string;
  };
  missionDescription: string;
  tips: string[];
  sampleImage: string;
  missionKeywords?: string[]; // For 12월 보물찾기
  isOpen?: boolean; // 레거시 호환용
  unlockDate?: string; // 예: "9월 1일", "10월 1일"
  adminOverride?: AdminOverrideType; // 관리자 모드 수동 제어 ('auto' | 'force_open' | 'force_closed' | 'force_hidden')
}

export interface CommentItem {
  id: string;
  author: string;
  gradeClass?: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  grade: number; // 학년 (1~3)
  classNum: number; // 반 (1~4)
  studentNum: number; // 번호 (1~50)
  studentName: string; // 이름
  bookTitle: string; // 도서명
  bookAuthor?: string; // 저자
  content: string; // 내용 및 소감
  imageUrl: string; // 이미지 Data URL(Base64) 또는 이미지 링크 URL
  month: number; // 챌린지 월 (9, 10, 11, 12)
  challengeTitle: string; // "첫문장 챌린지" 등
  likes: number;
  comments: CommentItem[];
  createdAt: string;
  syncedToGas?: boolean;
  isDeleted?: boolean;
  password?: string; // 4자리 숫자 비밀번호 (학생 본인 글 수정용)
}

export interface StudentRosterItem {
  id: string;
  grade: number;
  classNum: number;
  studentNum: number;
  name: string;
  hasSubmittedCurrentMonth?: boolean;
  submissionCount?: number;
  submittedMonths?: number[];
  lastSubmittedAt?: string;
}

export interface ClassRaceItem {
  grade: number;
  classNum: number;
  classLabel: string; // e.g. "1학년 1반"
  totalStudents: number;
  submittedCount: number;
  participationRate: number; // 0 ~ 100%
  rank: number;
  mascotName: string;
  mascotEmoji: string;
  mascotColor: string;
  distancePercent: number;
  isTopRank?: boolean;
  speed?: 'normal' | 'fast' | 'turbo';
}

export interface GasConfig {
  webAppUrl: string;
  adminEmail: string;
  sheetName: string;
  autoEmailAlert: boolean;
  lastSyncedAt?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
