import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  Mail,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  Trash2,
  Sparkles,
  ArrowRight,
  Eye,
  Edit3,
  Save,
  RotateCcw,
  KeyRound,
  LogOut,
  Sliders,
} from 'lucide-react';
import { Post, StudentRosterItem, GasConfig, ChallengeMonthInfo, AdminOverrideType } from '../types';
import { CHALLENGE_MONTHS, GAS_SCRIPT_TEMPLATE } from '../data/challenges';
import { StudentRosterManager } from './StudentRosterManager';
import { ConfirmModal } from './ConfirmModal';
import { api } from '../services/api';
import { getChallengeMonthStatus } from '../utils/challengeDate';

interface AdminDashboardProps {
  posts: Post[];
  roster: StudentRosterItem[];
  currentMonth: number | 'all';
  challenges: ChallengeMonthInfo[];
  onUpdateChallenges: (updated: ChallengeMonthInfo[]) => void;
  onResetChallenges: () => void;
  onUpdateRoster?: (newRoster: StudentRosterItem[]) => void;
  onResetRoster?: () => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onOpenEditPost?: (post: Post) => void;
  onRefreshData: () => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  adminPassword?: string;
  onChangeAdminPassword?: (newPw: string) => void;
  onLogout?: () => void;
  previewAllMonths?: boolean;
  onTogglePreviewAll?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  posts,
  roster,
  currentMonth,
  challenges,
  onUpdateChallenges,
  onResetChallenges,
  onUpdateRoster,
  onResetRoster,
  onDeletePost,
  onDeleteComment,
  onOpenEditPost,
  onRefreshData,
  onToast,
  adminPassword = '1234',
  onChangeAdminPassword,
  onLogout,
  previewAllMonths = false,
  onTogglePreviewAll,
}) => {
  const [adminTab, setAdminTab] = useState<'overview' | 'challenges' | 'roster' | 'posts' | 'gas'>('overview');
  const [rosterGradeFilter, setRosterGradeFilter] = useState<number | 'all'>('all');
  const [rosterClassFilter, setRosterClassFilter] = useState<number | 'all'>('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'submitted' | 'unsubmitted'>('all');
  const [rosterSearch, setRosterSearch] = useState<string>('');

  const [postsSearch, setPostsSearch] = useState<string>('');
  const [postsGradeFilter, setPostsGradeFilter] = useState<string>('all');
  const [postsMonthFilter, setPostsMonthFilter] = useState<number | 'all'>('all');

  // Challenge Editing State
  const [selectedEditMonth, setSelectedEditMonth] = useState<number>(9);
  const currentEditChallenge = challenges.find((c) => c.month === selectedEditMonth) || challenges[0];

  const [editTitle, setEditTitle] = useState<string>(currentEditChallenge?.title || '');
  const [editSubtitle, setEditSubtitle] = useState<string>(currentEditChallenge?.subtitle || '');
  const [editTheme, setEditTheme] = useState<string>(currentEditChallenge?.theme || '');
  const [editBadge, setEditBadge] = useState<string>(currentEditChallenge?.badge || '');
  const [editIsOpen, setEditIsOpen] = useState<boolean>(currentEditChallenge?.isOpen ?? true);
  const [editAdminOverride, setEditAdminOverride] = useState<AdminOverrideType>(currentEditChallenge?.adminOverride || 'auto');
  const [editUnlockDate, setEditUnlockDate] = useState<string>(currentEditChallenge?.unlockDate || '');
  const [editMissionDesc, setEditMissionDesc] = useState<string>(currentEditChallenge?.missionDescription || '');
  const [editTips, setEditTips] = useState<string[]>(currentEditChallenge?.tips || ['', '', '']);
  const [editSampleImage, setEditSampleImage] = useState<string>(currentEditChallenge?.sampleImage || '');
  const [editKeywords, setEditKeywords] = useState<string>(currentEditChallenge?.missionKeywords?.join(', ') || '');

  // When editMonth changes, sync form state
  const handleSelectEditMonth = (m: number) => {
    setSelectedEditMonth(m);
    const target = challenges.find((c) => c.month === m) || challenges[0];
    if (target) {
      setEditTitle(target.title);
      setEditSubtitle(target.subtitle);
      setEditTheme(target.theme);
      setEditBadge(target.badge);
      setEditIsOpen(target.isOpen ?? (m === 9));
      setEditAdminOverride(target.adminOverride || 'auto');
      setEditUnlockDate(target.unlockDate || `${m}월 1일`);
      setEditMissionDesc(target.missionDescription);
      setEditTips(target.tips && target.tips.length > 0 ? [...target.tips] : ['', '', '']);
      setEditSampleImage(target.sampleImage || '');
      setEditKeywords(target.missionKeywords?.join(', ') || '');
    }
  };

  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedList = challenges.map((c) => {
      if (c.month === selectedEditMonth) {
        return {
          ...c,
          title: editTitle.trim() || `${selectedEditMonth}월 챌린지`,
          subtitle: editSubtitle.trim(),
          theme: editTheme.trim(),
          badge: editBadge.trim(),
          isOpen: editAdminOverride === 'force_open' || (editAdminOverride === 'auto' && editIsOpen),
          adminOverride: editAdminOverride,
          unlockDate: editUnlockDate.trim() || `${selectedEditMonth}월 1일`,
          missionDescription: editMissionDesc.trim(),
          tips: editTips.filter((t) => t.trim().length > 0),
          sampleImage: editSampleImage.trim(),
          missionKeywords: editKeywords
            ? editKeywords.split(',').map((k) => k.trim()).filter(Boolean)
            : undefined,
        };
      }
      return c;
    });

    onUpdateChallenges(updatedList);
    onToast('success', `${selectedEditMonth}월 챌린지 저장 완료!`, '학생용 배너와 미션 안내에 실시간 반영되었습니다.');
  };

  // In-app Confirm Modal State (Non-blocking, iframe-safe)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subMessage?: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleResetSingleMonth = () => {
    const defaultItem = CHALLENGE_MONTHS.find((c) => c.month === selectedEditMonth);
    if (!defaultItem) return;
    setConfirmModalState({
      isOpen: true,
      title: '챌린지 기본값 복원',
      message: `${selectedEditMonth}월 챌린지를 기본 추천 미션으로 복원하시겠습니까?`,
      subMessage: '현재 수정 중인 미션 설명 및 키워드가 초기 권장 미션으로 되돌아갑니다.',
      confirmLabel: '복원하기',
      isDestructive: false,
      onConfirm: () => {
        const updatedList = challenges.map((c) => (c.month === selectedEditMonth ? { ...defaultItem } : c));
        onUpdateChallenges(updatedList);
        handleSelectEditMonth(selectedEditMonth);
        onToast('info', '초기화 완료', `${selectedEditMonth}월 챌린지가 기본값으로 복원되었습니다.`);
      },
    });
  };

  // Password change modal state
  const [isChangePwModalOpen, setIsChangePwModalOpen] = useState<boolean>(false);
  const [currentPwInput, setCurrentPwInput] = useState<string>('');
  const [newPwInput, setNewPwInput] = useState<string>('');
  const [confirmPwInput, setConfirmPwInput] = useState<string>('');
  const [pwError, setPwError] = useState<string>('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');

    if (currentPwInput !== adminPassword) {
      setPwError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPwInput.length < 4) {
      setPwError('새 비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPwInput !== confirmPwInput) {
      setPwError('새 비밀번호와 확인 입력이 일치하지 않습니다.');
      return;
    }

    if (onChangeAdminPassword) {
      onChangeAdminPassword(newPwInput);
      onToast('success', '비밀번호 변경 완료', '새로운 관리자 비밀번호가 저장되었습니다.');
      setIsChangePwModalOpen(false);
      setCurrentPwInput('');
      setNewPwInput('');
      setConfirmPwInput('');
    }
  };

  // GAS Sync State
  const [isSyncingGas, setIsSyncingGas] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [isSavingGasConfig, setIsSavingGasConfig] = useState<boolean>(false);
  const [gasConfig, setGasConfig] = useState<GasConfig>({
    webAppUrl: '',
    adminEmail: 'cyj71920@gmail.com',
    sheetName: '독서챌린지_제출기록',
    autoEmailAlert: true,
  });

  useEffect(() => {
    api.getGasConfig().then((cfg) => {
      if (cfg) {
        setGasConfig(cfg);
      }
    }).catch(() => {});
  }, []);

  const handleSaveGasConfig = async () => {
    setIsSavingGasConfig(true);
    try {
      await api.saveGasConfig(gasConfig);
      onToast('success', '설정 저장 완료', '구글 Apps Script 연동 설정이 안전하게 저장되었습니다.');
    } catch (e: any) {
      onToast('error', '저장 실패', e.message || '설정 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSavingGasConfig(false);
    }
  };

  // Calculate high-level stats
  const stats = useMemo(() => {
    const activePosts = posts.filter((p) => !p.isDeleted);
    const targetMonth = currentMonth === 'all' ? 9 : currentMonth;
    const monthPosts = activePosts.filter((p) => p.month === targetMonth);

    // Unique participants this month
    const monthParticipants = new Set(
      monthPosts.map((p) => `${p.grade}-${p.classNum}-${p.studentNum}-${p.studentName.trim()}`)
    );

    const totalStudents = roster.length > 0 ? roster.length : 180;
    const submittedCount = monthParticipants.size;
    const overallRate = Math.round((submittedCount / totalStudents) * 100);

    return {
      totalSubmissions: activePosts.length,
      currentMonthSubmissions: monthPosts.length,
      currentMonthParticipants: submittedCount,
      totalStudents,
      overallRate,
    };
  }, [posts, roster, currentMonth]);

  // Compute detailed roster with submission status
  const rosterDetailedList = useMemo(() => {
    const activePosts = posts.filter((p) => !p.isDeleted);
    const targetMonth = currentMonth === 'all' ? 9 : currentMonth;

    return roster.map((student) => {
      const studentPosts = activePosts.filter(
        (p) =>
          p.grade === student.grade &&
          p.classNum === student.classNum &&
          (p.studentNum === student.studentNum || p.studentName.trim() === student.name.trim())
      );

      const submittedCurrent = studentPosts.some((p) => p.month === targetMonth);
      const submittedMonths = Array.from(new Set(studentPosts.map((p) => Number(p.month)))).sort((a: number, b: number) => a - b);

      return {
        ...student,
        hasSubmittedCurrentMonth: submittedCurrent,
        submissionCount: studentPosts.length,
        submittedMonths,
        lastSubmittedAt: studentPosts[studentPosts.length - 1]?.createdAt,
      };
    });
  }, [roster, posts, currentMonth]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return rosterDetailedList.filter((item) => {
      if (rosterGradeFilter !== 'all' && item.grade !== rosterGradeFilter) return false;
      if (rosterClassFilter !== 'all' && item.classNum !== rosterClassFilter) return false;
      if (rosterStatusFilter === 'submitted' && !item.hasSubmittedCurrentMonth) return false;
      if (rosterStatusFilter === 'unsubmitted' && item.hasSubmittedCurrentMonth) return false;
      if (rosterSearch.trim()) {
        const query = rosterSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchInfo = `${item.grade}학년 ${item.classNum}반 ${item.studentNum}번`.includes(query);
        if (!matchName && !matchInfo) return false;
      }
      return true;
    });
  }, [rosterDetailedList, rosterGradeFilter, rosterClassFilter, rosterStatusFilter, rosterSearch]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (p.isDeleted) return false;
      if (postsGradeFilter !== 'all' && String(p.grade) !== postsGradeFilter) return false;
      if (postsMonthFilter !== 'all' && p.month !== postsMonthFilter) return false;
      if (postsSearch.trim()) {
        const q = postsSearch.toLowerCase();
        const matchStudent = p.studentName.toLowerCase().includes(q);
        const matchBook = p.bookTitle.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        if (!matchStudent && !matchBook && !matchContent) return false;
      }
      return true;
    });
  }, [posts, postsGradeFilter, postsMonthFilter, postsSearch]);

  // Export CSV
  const handleExportCsv = () => {
    const activePosts = posts.filter((p) => !p.isDeleted);
    const headers = [
      '등록일시',
      '월별챌린지',
      '학년',
      '반',
      '번호',
      '이름',
      '도서명',
      '저자',
      '인증내용',
      '좋아요수',
      '댓글수',
    ];

    const rows = activePosts.map((p) => [
      p.createdAt ? new Date(p.createdAt).toLocaleString('ko-KR') : '',
      `${p.month}월 (${p.challengeTitle || ''})`,
      p.grade,
      p.classNum,
      p.studentNum,
      `"${p.studentName}"`,
      `"${p.bookTitle}"`,
      `"${p.bookAuthor || ''}"`,
      `"${p.content.replace(/"/g, '""')}"`,
      p.likes,
      p.comments ? p.comments.length : 0,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `독서챌린지_전체인증기록_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onToast('success', 'CSV 엑셀 다운로드 완료!', `${activePosts.length}건의 인증 데이터가 저장되었습니다.`);
  };

  // Sync to GAS
  const handleSyncToGas = async () => {
    setIsSyncingGas(true);
    try {
      const activePosts = posts.filter((p) => !p.isDeleted);
      await api.syncToGoogleSheets({
        webAppUrl: gasConfig.webAppUrl,
        sheetName: gasConfig.sheetName,
        posts: activePosts,
      });
      onToast(
        'success',
        '📊 구글 스프레드시트 동기화 성공!',
        `${activePosts.length}건의 챌린지 기록이 전송되었습니다.`
      );
    } catch (err: any) {
      console.error(err);
      onToast('error', '동기화 실패', err.message || '스프레드시트 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSyncingGas(false);
    }
  };

  // Send Email Alert
  const handleSendEmailAlert = async () => {
    setIsSendingEmail(true);
    try {
      const unsubmittedCount = Math.max(0, stats.totalStudents - stats.currentMonthParticipants);
      await api.sendTeacherEmailAlert({
        adminEmail: gasConfig.adminEmail,
        month: currentMonth === 'all' ? 9 : currentMonth,
        unsubmittedCount,
        submittedCount: stats.currentMonthParticipants,
      });

      onToast(
        'success',
        '📧 독서 챌린지 요약 알림 전송 완료!',
        `${gasConfig.adminEmail}로 현황 리포트가 발송되었습니다.`
      );
    } catch (err: any) {
      console.error(err);
      onToast('error', '발송 실패', err.message || '이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Header Card (Vibrant Neo-Brutalist) */}
      <div className="bg-[#FFD100] rounded-[2rem] p-6 sm:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-black text-white">
                <ShieldCheck className="w-4 h-4 text-[#FFD100]" />
                <span>교사용 도서관 관리자 센터 (Admin)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white text-black border-2 border-black">
                <Lock className="w-3 h-3 text-[#FF6B00]" />
                보안 인증됨
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              📚 독서 챌린지 운영 및 학급 참여도 관리
            </h2>
            <p className="text-xs sm:text-sm font-bold text-black/80">
              학생 인증 데이터 관리, 월별 챌린지 미션 커스텀, 미참여 학생 독려 명단 확인 및 구글 시트 연동
            </p>
          </div>

          {/* Admin Header Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Change Password Button */}
            <button
              onClick={() => setIsChangePwModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-yellow-50 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition"
              title="관리자 비밀번호 변경"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>비밀번호 변경</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition"
                title="관리자 로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            )}

            <button
              id="admin-btn-export-csv"
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>엑셀 다운로드</span>
            </button>

            <button
              id="admin-btn-sync-gas"
              onClick={handleSyncToGas}
              disabled={isSyncingGas}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#4ADE80] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
              <span>{isSyncingGas ? '전송 중...' : '구글시트 동기화'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 pt-4 border-t-2 border-black flex flex-wrap gap-2">
          <button
            id="admin-tab-overview"
            onClick={() => setAdminTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all ${
              adminTab === 'overview'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            📊 종합 통계
          </button>

          <button
            id="admin-tab-challenges"
            onClick={() => setAdminTab('challenges')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all ${
              adminTab === 'challenges'
                ? 'bg-[#FF6B00] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            🎨 월별 챌린지 설정/수정
          </button>

          <button
            id="admin-tab-roster"
            onClick={() => setAdminTab('roster')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all ${
              adminTab === 'roster'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            👥 학생 명부 ({roster.length}명)
          </button>

          <button
            id="admin-tab-posts"
            onClick={() => setAdminTab('posts')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all ${
              adminTab === 'posts'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            📝 게시글/댓글 관리 ({posts.length}건)
          </button>

          <button
            id="admin-tab-gas"
            onClick={() => setAdminTab('gas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-black transition-all ${
              adminTab === 'gas'
                ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            ⚙️ Google Sheets 연동
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards (Vibrant Neo-Brutalist Colors) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#4ADE80] rounded-[2rem] p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase bg-white px-2.5 py-1 rounded-md border-2 border-black">
                  전체 누적 인증수
                </span>
                <BookOpen className="w-5 h-5 text-black" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black">{stats.totalSubmissions}건</h3>
                <p className="text-xs font-bold text-black/80 mt-1">학생들의 자발적 참여 누적</p>
              </div>
            </div>

            <div className="bg-[#3B82F6] rounded-[2rem] p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase bg-black text-white px-2.5 py-1 rounded-md border-2 border-white">
                  이번 달 참여 학생
                </span>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black">{stats.currentMonthParticipants}명</h3>
                <p className="text-xs font-bold text-white/80 mt-1">
                  전교생 {stats.totalStudents}명 중 {stats.overallRate}% 달성
                </p>
              </div>
            </div>

            <div className="bg-[#FF6B00] rounded-[2rem] p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase bg-black text-white px-2.5 py-1 rounded-md border-2 border-white">
                  이번 달 미참여 학생
                </span>
                <AlertTriangle className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black">
                  {Math.max(0, stats.totalStudents - stats.currentMonthParticipants)}명
                </h3>
                <p className="text-xs font-bold text-white/80 mt-1">도서관 방문 및 참여 독려 대상</p>
              </div>
            </div>

            <div className="bg-[#8B5CF6] rounded-[2rem] p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase bg-black text-white px-2.5 py-1 rounded-md border-2 border-white">
                  학생 응원 댓글 총계
                </span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black">
                  {posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0)}개
                </h3>
                <p className="text-xs font-bold text-white/80 mt-1">학생 상호 피어 응원 및 교류</p>
              </div>
            </div>
          </div>

          {/* Quick Guide & GAS Status Banner */}
          <div className="bg-white rounded-[2rem] p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black flex items-center gap-2">
                <span>📋 교사용 운영 매뉴얼 가이드</span>
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                1. 학생들은 별도 로그인 없이 <strong>[학년/반/번호/이름]</strong>으로 챌린지 사진을 업로드합니다.
                <br />
                2. 업로드 즉시 반별 달리기 경주 트랙에 실시간 반영되어 학급별 참여율이 계산됩니다.
                <br />
                3. 상단의 <strong>[월별 챌린지 설정/수정]</strong> 탭에서 언제든 새로운 독서 미션과 안내문, 배지를 변경할 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => setAdminTab('challenges')}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#FF6B00] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
            >
              <span>월별 챌린지 수정하기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB: CHALLENGE EDIT & MANAGEMENT */}
      {adminTab === 'challenges' && (
        <div className="space-y-6">
          {/* Month Selector Bar & Preview Toggle */}
          <div className="bg-white rounded-[2rem] p-5 sm:p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-black flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#FF6B00]" />
                <span>월별 챌린지 제목 • 미션 • 안내문 편집기</span>
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                수정하려는 월을 선택하고 내용을 변경한 뒤 저장하면 전체 페이지에 즉시 적용됩니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Month Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border-2 border-black">
                {challenges.map((ch) => (
                  <button
                    key={ch.month}
                    type="button"
                    onClick={() => handleSelectEditMonth(ch.month)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedEditMonth === ch.month
                        ? 'bg-[#FF6B00] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-black hover:bg-yellow-100'
                    }`}
                  >
                    {ch.month}월 {ch.isOpen ? '🔓' : '🔒'}
                  </button>
                ))}
              </div>

              {/* Reset to defaults button */}
              <button
                type="button"
                onClick={handleResetSingleMonth}
                className="px-3 py-1.5 rounded-xl border-2 border-black bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 flex items-center gap-1"
                title="이 달의 추천 기본값으로 복원"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{selectedEditMonth}월 기본값 복원</span>
              </button>
            </div>
          </div>

          {/* Edit Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form: Edit Fields */}
            <form
              onSubmit={handleSaveChallenge}
              className="lg:col-span-7 bg-white rounded-[2rem] p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4"
            >
              <div className="space-y-3 border-b-2 border-black pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-black text-black">
                    ✏️ {selectedEditMonth}월 챌린지 세부 설정 & 기간 제어
                  </span>
                  {(() => {
                    const tempChallenge: ChallengeMonthInfo = {
                      ...(challenges.find((c) => c.month === selectedEditMonth) || challenges[0]),
                      adminOverride: editAdminOverride,
                      isOpen: editIsOpen,
                    };
                    const statusObj = getChallengeMonthStatus(tempChallenge);
                    return (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                        statusObj.status === 'active' ? 'bg-[#4ADE80] text-black' :
                        statusObj.status === 'closed' ? 'bg-amber-300 text-amber-950' : 'bg-slate-800 text-white'
                      }`}>
                        {statusObj.label} ({statusObj.dateRangeText})
                      </span>
                    );
                  })()}
                </div>

                {/* 4-way Admin Override Selector */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-black space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-black">
                      ⏰ 관리자 공개 및 접수 기간 제어:
                    </label>
                    <span className="text-[11px] font-bold text-slate-500">
                      매월 1일~말일 자동 오픈/마감 관리
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`p-2.5 rounded-xl border-2 border-black flex items-start gap-2 cursor-pointer transition ${
                      editAdminOverride === 'auto' ? 'bg-[#FFD100] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-1 ring-black' : 'bg-white hover:bg-yellow-50'
                    }`}>
                      <input
                        type="radio"
                        name="adminOverride"
                        value="auto"
                        checked={editAdminOverride === 'auto'}
                        onChange={() => setEditAdminOverride('auto')}
                        className="mt-0.5 text-black focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className="font-black text-black">🤖 자동 운영 (날짜 기준 권장)</p>
                        <p className="text-[11px] font-medium text-slate-700 mt-0.5 leading-snug">
                          {selectedEditMonth}월 1일 00시에 자동 오픈되며, 1일~말일까지만 글/사진 등록 가능. 다음 달이 되면 마감되어 열람 전용으로 자동 전환됩니다.
                        </p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border-2 border-black flex items-start gap-2 cursor-pointer transition ${
                      editAdminOverride === 'force_open' ? 'bg-[#4ADE80] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-1 ring-black' : 'bg-white hover:bg-emerald-50'
                    }`}>
                      <input
                        type="radio"
                        name="adminOverride"
                        value="force_open"
                        checked={editAdminOverride === 'force_open'}
                        onChange={() => setEditAdminOverride('force_open')}
                        className="mt-0.5 text-black focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className="font-black text-black">🔓 강제 공개 (상시 오픈)</p>
                        <p className="text-[11px] font-medium text-slate-700 mt-0.5 leading-snug">
                          달력 날짜와 상관없이 지금 즉시 학생들에게 전체 공개하고 글/인증사진 등록을 허용합니다.
                        </p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border-2 border-black flex items-start gap-2 cursor-pointer transition ${
                      editAdminOverride === 'force_closed' ? 'bg-amber-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-1 ring-black' : 'bg-white hover:bg-amber-50'
                    }`}>
                      <input
                        type="radio"
                        name="adminOverride"
                        value="force_closed"
                        checked={editAdminOverride === 'force_closed'}
                        onChange={() => setEditAdminOverride('force_closed')}
                        className="mt-0.5 text-black focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className="font-black text-black">🔒 강제 마감 (열람 전용)</p>
                        <p className="text-[11px] font-medium text-slate-700 mt-0.5 leading-snug">
                          신규 글/사진 등록은 차단하고, 기존에 학생들이 올린 인증글 열람 및 응원 댓글만 허용합니다.
                        </p>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border-2 border-black flex items-start gap-2 cursor-pointer transition ${
                      editAdminOverride === 'force_hidden' ? 'bg-slate-800 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-1 ring-black' : 'bg-white hover:bg-slate-100'
                    }`}>
                      <input
                        type="radio"
                        name="adminOverride"
                        value="force_hidden"
                        checked={editAdminOverride === 'force_hidden'}
                        onChange={() => setEditAdminOverride('force_hidden')}
                        className="mt-0.5 text-black focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <p className={`font-black ${editAdminOverride === 'force_hidden' ? 'text-yellow-300' : 'text-black'}`}>
                          🙈 비공개 보관 (잠금 대기)
                        </p>
                        <p className={`text-[11px] font-medium mt-0.5 leading-snug ${editAdminOverride === 'force_hidden' ? 'text-slate-200' : 'text-slate-700'}`}>
                          학생 화면에서 미션 내용을 공개하지 않고 비밀 보관 상태(오픈 예정)로 유지합니다.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black">
                    챌린지 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="예: 첫문장 챌린지"
                    className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-black">
                    오픈 예정일 표시 문구
                  </label>
                  <input
                    type="text"
                    value={editUnlockDate}
                    onChange={(e) => setEditUnlockDate(e.target.value)}
                    placeholder="예: 9월 1일 또는 상시 오픈"
                    className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                  />
                </div>
              </div>

              {/* Theme & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black">
                    테마 / 핵심 키워드
                  </label>
                  <input
                    type="text"
                    value={editTheme}
                    onChange={(e) => setEditTheme(e.target.value)}
                    placeholder="예: 첫 문장의 설렘"
                    className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-black">
                    획득 배지 명칭
                  </label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    placeholder="예: 📖 첫문장 탐험가"
                    className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-black">
                  한 줄 소개 (부제목)
                </label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="예: 책의 첫 문장을 찍어 올리고 마음에 와닿은 이유를 남겨보세요!"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                />
              </div>

              {/* Mission Description */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-black">
                  미션 상세 안내문 (학생들이 읽을 안내 설명) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editMissionDesc}
                  onChange={(e) => setEditMissionDesc(e.target.value)}
                  rows={4}
                  placeholder="학생들이 어떤 사진을 찍어 올려야 하는지 자세하고 친절하게 설명해주세요."
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-medium focus:bg-yellow-50 leading-relaxed"
                  required
                />
              </div>

              {/* Tips */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black">
                  참여 꿀팁 가이드 (3가지)
                </label>
                <div className="space-y-1.5">
                  {editTips.map((tip, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FFD100] border border-black flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={tip}
                        onChange={(e) => {
                          const copy = [...editTips];
                          copy[idx] = e.target.value;
                          setEditTips(copy);
                        }}
                        placeholder={`꿀팁 ${idx + 1} 입력`}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border-2 border-black text-xs font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Image URL */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-black">
                  샘플 대표 예시 이미지 URL
                </label>
                <input
                  type="url"
                  value={editSampleImage}
                  onChange={(e) => setEditSampleImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-black">
                  미션 추천 키워드 (쉼표로 구분, 선택사항)
                </label>
                <input
                  type="text"
                  value={editKeywords}
                  onChange={(e) => setEditKeywords(e.target.value)}
                  placeholder="예: 희망, 겨울, 선물, 용기, 별빛"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold focus:bg-yellow-50"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3ecf73] text-black font-black text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-1px] active:translate-y-[1px] transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-black" />
                  <span>💾 {selectedEditMonth}월 챌린지 설정 저장하기</span>
                </button>
              </div>
            </form>

            {/* Right Column: Live Student Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#FFFBEB] p-4 rounded-[2rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="text-xs font-black text-black flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#FF6B00]" />
                    <span>학생용 화면 실시간 미리보기</span>
                  </span>
                  <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-black">
                    {editIsOpen ? '공개 상태' : '잠금 상태'}
                  </span>
                </div>

                {/* Banner Mini Card Mockup */}
                <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#4ADE80] text-black border border-black">
                      {selectedEditMonth}월 챌린지 {editIsOpen ? '🔥 진행 중' : '🔒 대기'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      배지: {editBadge || '📖 배지'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-black">
                      {editTitle || `${selectedEditMonth}월 챌린지`}
                    </h4>
                    <p className="text-xs font-bold text-[#FF6B00] mt-0.5">
                      {editSubtitle || '챌린지 한줄 소개'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    {editMissionDesc || '미션 설명이 여기에 표시됩니다.'}
                  </p>

                  {/* Tips list */}
                  {editTips.some((t) => t.trim()) && (
                    <div className="space-y-1 text-[11px] text-slate-600 font-bold bg-[#FFFBEB] p-2.5 rounded-xl border border-black/20">
                      <span className="font-black text-black block">💡 챌린지 꿀팁:</span>
                      {editTips.map(
                        (tip, i) =>
                          tip.trim() && (
                            <div key={i} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{tip}</span>
                            </div>
                          )
                      )}
                    </div>
                  )}

                  {/* Sample Image Preview if provided */}
                  {editSampleImage && (
                    <div className="rounded-xl overflow-hidden border-2 border-black aspect-video bg-black">
                      <img
                        src={editSampleImage}
                        alt="샘플 미리보기"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-bold text-slate-600 bg-white p-3 rounded-xl border border-slate-300">
                  💡 <strong>팁:</strong> 월별 챌린지 내용을 저장하면 상단 내비바, 메인 배너, 인증샷 업로드 팝업의 안내문구가 모두 통일되어 적용됩니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROSTER & UN-SUBMITTED FILTER */}
      {adminTab === 'roster' && (
        <StudentRosterManager
          roster={roster}
          posts={posts}
          currentMonth={currentMonth}
          onUpdateRoster={onUpdateRoster || (() => {})}
          onResetRoster={onResetRoster}
          onToast={onToast}
        />
      )}

      {/* TAB 3: POSTS & COMMENTS MANAGEMENT */}
      {adminTab === 'posts' && (
        <div className="bg-white rounded-[2rem] p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-black">
                📝 등록된 게시글 및 댓글 관리 ({filteredPosts.length}건)
              </h3>
              <p className="text-xs font-bold text-slate-500">
                부적절하거나 잘못 등록된 게시글과 학생 댓글을 사서교사 권한으로 즉시 삭제할 수 있습니다.
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={postsGradeFilter}
                onChange={(e) => setPostsGradeFilter(e.target.value)}
                className="bg-white border-2 border-black rounded-lg px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="all">전체 학년</option>
                {[1, 2, 3].map((g) => (
                  <option key={g} value={String(g)}>
                    {g}학년
                  </option>
                ))}
              </select>

              <select
                value={postsMonthFilter}
                onChange={(e) =>
                  setPostsMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-white border-2 border-black rounded-lg px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="all">전체 챌린지</option>
                {challenges.map((c) => (
                  <option key={c.month} value={c.month}>
                    {c.month}월 ({c.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-50 rounded-2xl p-4 border-2 border-black space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black bg-[#FFD100] text-black px-2 py-0.5 rounded border border-black">
                      {post.grade}학년 {post.classNum}반 {post.studentNum}번
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{post.month}월 챌린지</span>
                  </div>

                  <h4 className="font-black text-sm text-black">{post.studentName}</h4>
                  <p className="text-xs font-extrabold text-[#FF6B00]">{post.bookTitle}</p>
                  <p className="text-xs text-slate-700 mt-1 line-clamp-3 leading-relaxed">{post.content}</p>
                </div>

                {/* Photo preview */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-black">
                  <img src={post.imageUrl} alt={post.bookTitle} className="w-full h-full object-cover" />
                </div>

                {/* Comments List if any */}
                {post.comments && post.comments.length > 0 && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-300 space-y-1.5 text-xs">
                    <span className="font-black text-slate-700 text-[11px] block">
                      💬 학생 댓글 ({post.comments.length}개)
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px]"
                        >
                          <div className="truncate mr-1">
                            <span className="font-black text-black mr-1">[{c.author}]</span>
                            <span className="text-slate-700">{c.text}</span>
                          </div>
                          {onDeleteComment && (
                            <button
                              onClick={() => {
                                setConfirmModalState({
                                  isOpen: true,
                                  title: '댓글 삭제 확인',
                                  message: `'${c.author}' 님의 댓글을 삭제하시겠습니까?`,
                                  confirmLabel: '댓글 삭제',
                                  isDestructive: true,
                                  onConfirm: () => {
                                    onDeleteComment(post.id, c.id);
                                    onToast('info', '댓글 삭제 완료', '선택한 댓글이 삭제되었습니다.');
                                  },
                                });
                              }}
                              className="text-red-500 hover:text-red-700 p-0.5 shrink-0"
                              title="댓글 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions for Post: Edit & Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-400 font-bold">
                    ❤️ {post.likes} • 💬 {post.comments.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onOpenEditPost && (
                      <button
                        onClick={() => onOpenEditPost(post)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-black bg-slate-200 hover:bg-yellow-300 px-2 py-1 rounded-lg border border-slate-400 transition"
                        title="관리자 권한으로 게시글 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>수정</span>
                      </button>
                    )}
                    <button
                      id={`btn-admin-del-post-${post.id}`}
                      onClick={() => {
                        setConfirmModalState({
                          isOpen: true,
                          title: '게시글 삭제 확인',
                          message: `'${post.studentName}' 학생의 '${post.bookTitle}' 인증글을 삭제하시겠습니까?`,
                          subMessage: '삭제 후에는 게시글과 댓글이 영구 삭제되며 복구할 수 없습니다.',
                          confirmLabel: '게시글 삭제',
                          isDestructive: true,
                          onConfirm: () => {
                            onDeletePost(post.id);
                          },
                        });
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg border border-red-300 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GAS / GOOGLE SHEETS SETUP */}
      {adminTab === 'gas' && (
        <div className="bg-white rounded-[2rem] p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#4ADE80]" />
              <span>Google Apps Script (GAS) & 스프레드시트 연동 가이드</span>
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              구글 드라이브에서 <strong>Google Sheets</strong>를 생성하고, 아래의 Apps Script 코드를 복사하여 웹앱으로 배포하면 모든 데이터가 실시간 시트로 자동 동기화됩니다.
            </p>
          </div>

          {/* Form Settings */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-black space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  GAS 웹앱 배포 URL (Web App URL)
                </label>
                <input
                  id="gas-url-input"
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={gasConfig.webAppUrl}
                  onChange={(e) => setGasConfig({ ...gasConfig, webAppUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-black rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">
                  담당 교사 알림 수신 이메일
                </label>
                <input
                  id="gas-email-input"
                  type="email"
                  placeholder="cyj71920@gmail.com"
                  value={gasConfig.adminEmail}
                  onChange={(e) => setGasConfig({ ...gasConfig, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-black rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                id="save-gas-config-btn"
                onClick={handleSaveGasConfig}
                disabled={isSavingGasConfig}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingGasConfig ? '저장 중...' : '연동 설정 저장하기'}
              </button>
            </div>
          </div>

          {/* Apps Script Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-black uppercase">
                📋 Google Apps Script (Code.gs) 배포용 전체 코드 복사
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(GAS_SCRIPT_TEMPLATE);
                  onToast('success', 'GAS 전체 코드 복사 완료!', 'Google Apps Script 편집기에 붙여넣고 [웹앱으로 배포]하세요.');
                }}
                className="px-3 py-1.5 bg-[#FFD100] hover:bg-[#ffe040] text-black font-black text-xs rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                전체 코드 복사하기
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono overflow-x-auto border-2 border-black leading-relaxed max-h-96">
{GAS_SCRIPT_TEMPLATE}
            </pre>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isChangePwModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsChangePwModalOpen(false)}
        >
          <div
            className="bg-white rounded-[2rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-w-md w-full overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="text-base font-black text-black flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#FF6B00]" />
                <span>관리자 비밀번호 변경</span>
              </h3>
              <button
                onClick={() => setIsChangePwModalOpen(false)}
                className="p-1 rounded-lg border border-black bg-slate-100 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-black text-black">현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPwInput}
                  onChange={(e) => setCurrentPwInput(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-black text-black">새 비밀번호 (4자 이상)</label>
                <input
                  type="password"
                  value={newPwInput}
                  onChange={(e) => setNewPwInput(e.target.value)}
                  placeholder="새로운 비밀번호 입력"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-black text-black">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPwInput}
                  onChange={(e) => setConfirmPwInput(e.target.value)}
                  placeholder="새로운 비밀번호 다시 입력"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black font-bold"
                  required
                />
              </div>

              {pwError && (
                <p className="text-xs font-black text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{pwError}</span>
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePwModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-slate-100 font-black"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl border-2 border-black bg-[#4ADE80] hover:bg-[#3ecf73] font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  변경 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe In-App Confirmation Modal (Non-blocking in iframes) */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        subMessage={confirmModalState.subMessage}
        confirmLabel={confirmModalState.confirmLabel}
        isDestructive={confirmModalState.isDestructive}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
