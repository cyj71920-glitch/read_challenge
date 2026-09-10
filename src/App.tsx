import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ChallengeBanner } from './components/ChallengeBanner';
import { FeedView } from './components/FeedView';
import { ClassRaceTrack } from './components/ClassRaceTrack';
import { MiniRaceWidget } from './components/MiniRaceWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ChallengeSubmissionModal } from './components/ChallengeSubmissionModal';
import { EditPostModal } from './components/EditPostModal';
import { Post, StudentRosterItem, ToastMessage, ChallengeMonthInfo } from './types';
import { api } from './services/api';
import { INITIAL_POSTS, SAMPLE_ROSTER, INITIAL_STUDENTS_ROSTER, CHALLENGE_MONTHS } from './data/challenges';
import {
  BookOpen,
  Camera,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Navigation & View states
  const [activeView, setActiveView] = useState<'feed' | 'race' | 'admin'>('feed');
  const [currentMonth, setCurrentMonth] = useState<number | 'all'>(9);
  const [previewAllMonths, setPreviewAllMonths] = useState<boolean>(false);

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('library_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

const [adminPassword, setAdminPassword] = useState<string>('1234');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
 // 서버(GAS)에 저장된 관리자 비밀번호 불러오기
  useEffect(() => {
    const loadAdminPassword = async () => {
      try {
        const password = await api.getAdminPassword();
        setAdminPassword(password);
      } catch (error) {
        console.warn('관리자 비밀번호 불러오기 실패:', error);
      }
    };

    loadAdminPassword();
  }, []);
  // Dynamic Challenge State
  const [challenges, setChallenges] = useState<ChallengeMonthInfo[]>(() => {
    try {
      const saved = localStorage.getItem('library_challenges');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved challenges', e);
    }
    return CHALLENGE_MONTHS;
  });

  const handleUpdateChallenges = async (updated: ChallengeMonthInfo[]) => {
    setChallenges(updated);
    try {
      localStorage.setItem('library_challenges', JSON.stringify(updated));
      await api.saveChallenges(updated);
    } catch (e) {
      console.error('Failed to save challenges to storage/api', e);
    }
  };

  const handleResetChallenges = async () => {
    setChallenges(CHALLENGE_MONTHS);
    try {
      localStorage.setItem('library_challenges', JSON.stringify(CHALLENGE_MONTHS));
      await api.resetChallenges();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRoster = async (newRoster: StudentRosterItem[]) => {
    setRoster(newRoster);
    try {
      await api.saveRoster(newRoster);
    } catch (e) {
      console.error('Failed to save roster to api', e);
    }
  };

  const handleResetRoster = async () => {
    setRoster(INITIAL_STUDENTS_ROSTER);
    try {
      await api.saveRoster(INITIAL_STUDENTS_ROSTER);
    } catch (e) {
      console.error('Failed to reset roster to api', e);
    }
  };

const handleChangeAdminPassword = async (newPw: string) => {
  try {
    await api.saveAdminPassword(newPw);
    setAdminPassword(newPw);
  } catch (error) {
    console.error('관리자 비밀번호 저장 실패:', error);
    throw error;
  }
};

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminAuthModalOpen(false);
    try {
      localStorage.setItem('library_admin_auth', 'true');
    } catch (e) {
      console.error(e);
    }
    setActiveView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('library_admin_auth');
    } catch (e) {
      console.error(e);
    }
    setActiveView('feed');
    addToast('info', '로그아웃 완료', '관리자 모드에서 안전하게 로그아웃되었습니다.');
  };

  const handleSelectView = (view: 'feed' | 'race' | 'admin') => {
    if (view === 'admin') {
      if (!isAdminAuthenticated) {
        setIsAdminAuthModalOpen(true);
        return;
      }
    }
    setActiveView(view);
  };

  // Filters for Feed
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const handleOpenEditModal = (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };
const [isCompressingExistingImages, setIsCompressingExistingImages] = useState(false);

const compressExistingImage = async (
  imageUrl: string
): Promise<{ dataUrl: string; originalSize: number; newSize: number }> => {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error('사진을 불러오지 못했습니다.');
  }

  const blob = await response.blob();
  const originalSize = blob.size;

  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
      img.src = objectUrl;
    });

    let width = img.width;
    let height = img.height;

    const MAX_WIDTH = 700;
    const MAX_HEIGHT = 700;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(
        MAX_WIDTH / width,
        MAX_HEIGHT / height
      );

      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('사진 압축 준비에 실패했습니다.');
    }

    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.68);

    const base64 = dataUrl.split(',')[1] || '';
    const newSize = Math.round(base64.length * 0.75);

    return {
      dataUrl,
      originalSize,
      newSize,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const handleCompressExistingImages = async () => {
  if (isCompressingExistingImages) return;

  const confirmed = window.confirm(
    '기존 게시글 사진을 압축합니다. 백업 시트를 만들어두었는지 확인해주세요. 계속할까요?'
  );

  if (!confirmed) return;

  setIsCompressingExistingImages(true);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  let originalTotal = 0;
  let compressedTotal = 0;

  try {
    const failedRows = new Set([
  17, 18, 19, 23, 24, 26, 29, 31, 35,
  45, 48, 51, 52, 54, 55, 56, 57, 58,
  59, 60, 63, 64, 65, 66, 69, 70, 71, 72
]);
    for (const post of posts) {
      const match = String(post.id).match(/^gas-row-(\d+)$/);

if (!match || !post.imageUrl) {
  continue;
}

const row = Number(match[1]);

if (!failedRows.has(row)) {
  continue;
}

      try {
        const result = await compressExistingImage(post.imageUrl);

        originalTotal += result.originalSize;

        // 압축했는데 오히려 더 커지는 사진은 변경하지 않음
        if (result.newSize >= result.originalSize) {
          compressedTotal += result.originalSize;
          skipCount++;
          continue;
        }

        const saveResponse = await fetch(`/api/posts/${row}/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: result.dataUrl,
          }),
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok || !saveData.success) {
          throw new Error(
            saveData.message || '압축 사진 저장에 실패했습니다.'
          );
        }

        compressedTotal += result.newSize;
        successCount++;

        console.log(
          `사진 압축 완료 - 행 ${row}:`,
          Math.round(result.originalSize / 1024) + 'KB →',
          Math.round(result.newSize / 1024) + 'KB'
        );

        // GAS에 연속 요청을 너무 빠르게 보내지 않음
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`행 ${row} 사진 압축 실패:`, error);
        failCount++;
      }
    }

    const beforeMb = (originalTotal / 1024 / 1024).toFixed(2);
    const afterMb = (compressedTotal / 1024 / 1024).toFixed(2);

    alert(
      `기존 사진 압축 완료!\n\n` +
      `압축 성공: ${successCount}장\n` +
      `변경 불필요: ${skipCount}장\n` +
      `실패: ${failCount}장\n\n` +
      `약 ${beforeMb}MB → ${afterMb}MB`
    );
  } finally {
    setIsCompressingExistingImages(false);
  }
};
  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const knownPostIdsRef = useRef<Set<string>>(new Set());
  const latestPostTimeRef = useRef<string | null>(null);
  const isInitialLoadDoneRef = useRef<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPosts, fetchedRoster, fetchedChallenges] = await Promise.all([
        api.getPosts(),
        api.getRoster(),
        api.getChallenges(),
      ]);
      setPosts(fetchedPosts);

knownPostIdsRef.current = new Set(
  fetchedPosts.map((p) => p.id)
);

// 실시간 새 글 확인을 시작할 기준 시간
latestPostTimeRef.current =
  fetchedPosts.length > 0
    ? fetchedPosts[0].createdAt
    : new Date().toISOString();

setRoster(fetchedRoster);
      if (fetchedChallenges && fetchedChallenges.length > 0) {
        setChallenges(fetchedChallenges);
      }
    } catch (err) {
      console.warn('Fallback to local sample data', err);
      setPosts(INITIAL_POSTS);
      knownPostIdsRef.current = new Set(INITIAL_POSTS.map((p) => p.id));
      setRoster(SAMPLE_ROSTER);
    } finally {
      setIsLoading(false);
      isInitialLoadDoneRef.current = true;
    }
  };

useEffect(() => {
  loadData();

  const intervalId = setInterval(async () => {
    // 학생이 다른 탭을 보고 있으면 불필요한 요청을 하지 않음
    if (document.hidden) {
      return;
    }

    // 최초 데이터 로딩이 아직 끝나지 않았다면 기다림
    if (!isInitialLoadDoneRef.current) {
      return;
    }

    // 최신 게시글 기준 시간이 없다면 기다림
    if (!latestPostTimeRef.current) {
      return;
    }

    try {
      // 전체 게시글이 아니라
      // 마지막으로 확인한 시간 이후의 새 글만 요청
      const newPosts = await api.getNewPosts(
        latestPostTimeRef.current
      );

      if (!Array.isArray(newPosts) || newPosts.length === 0) {
        return;
      }

      setPosts((prevPosts) => {
        const existingIds = new Set(
          prevPosts.map((p) => p.id)
        );

        // 이미 화면에 있는 글은 제외
        const reallyNewPosts = newPosts.filter(
          (p) => !existingIds.has(p.id)
        );

        if (reallyNewPosts.length === 0) {
          return prevPosts;
        }

        // 서버에서 최신순으로 오므로 첫 번째가 가장 최근 글
        const newestOne = reallyNewPosts[0];

        // 다음 확인 때 사용할 최신 시간 갱신
        latestPostTimeRef.current =
          newestOne.createdAt;

        // 새로운 글 알림
        addToast(
          'info',
          '✨ 실시간 새 인증글 도착',
          `${newestOne.grade}학년 ${newestOne.classNum}반 ${newestOne.studentName} 학생의 '${newestOne.bookTitle}' 인증이 도착했습니다!`
        );

        // 새 글을 기존 게시글 맨 앞에 추가
        const merged = [
          ...reallyNewPosts,
          ...prevPosts,
        ];

        knownPostIdsRef.current = new Set(
          merged.map((p) => p.id)
        );

        return merged;
      });
    } catch (err) {
      console.warn(
        '실시간 게시글 확인 실패:',
        err
      );
    }
  }, 10000);

  return () => {
    clearInterval(intervalId);
  };
}, []);

  const handleLikePost = async (postId: string) => {
    try {
      const updated = await api.likePost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
      );
    }
  };

  const handleAddComment = async (postId: string, text: string, authorName: string) => {
    try {
      const updated = await api.addComment(postId, text, authorName);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      addToast('success', '댓글 작성 완료', '따뜻한 응원 댓글이 등록되었습니다.');
    } catch {
      const newComment = {
        id: `c_${Date.now()}`,
        author: authorName,
        text,
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
        )
      );
      addToast('success', '댓글 작성 완료', '따뜻한 응원 댓글이 등록되었습니다.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
      knownPostIdsRef.current.delete(postId);
      return updated;
    });

    try {
      await api.deletePost(postId, undefined, isAdminAuthenticated);
      addToast('info', '삭제 완료', '게시글이 안전하게 삭제되었습니다.');
    } catch (err: any) {
      console.warn('Delete request returned warning:', err);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      addToast('info', '삭제 완료', '게시글이 삭제되었습니다.');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await api.deleteComment(postId, commentId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
            : p
        )
      );
      addToast('info', '댓글 삭제 완료', '댓글이 삭제되었습니다.');
    } catch (err: any) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
            : p
        )
      );
      addToast('info', '댓글 삭제 완료', '댓글이 삭제되었습니다.');
    }
  };

  const monthFilteredPosts = posts.filter((p) => {
    if (p.isDeleted) return false;
    if (currentMonth !== 'all' && p.month !== currentMonth) return false;
    if (selectedGrade !== 'all' && String(p.grade) !== selectedGrade) return false;
    if (selectedClass !== 'all' && String(p.classNum) !== selectedClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStudent = p.studentName.toLowerCase().includes(q);
      const matchBook = p.bookTitle.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      if (!matchStudent && !matchBook && !matchContent) return false;
    }
    return true;
  });

  const activeSubmissionMonth = typeof currentMonth === 'number' ? currentMonth : 9;

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1E293B] flex flex-col font-sans selection:bg-[#FFD100] selection:text-black">
      <Navbar
        currentMonth={currentMonth}
        onSelectMonth={(m) => {
          setCurrentMonth(m);
          if (activeView !== 'feed') setActiveView('feed');
        }}
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        totalSubmissions={posts.filter((p) => !p.isDeleted).length}
        challenges={challenges}
        previewAllMonths={previewAllMonths}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {activeView === 'race' && (
          <ChallengeBanner
            currentMonth={currentMonth}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            postCount={monthFilteredPosts.length}
            challenges={challenges}
            previewAllMonths={previewAllMonths}
            isAdmin={isAdminAuthenticated}
            onTogglePreviewAll={() => {
              setPreviewAllMonths((prev) => !prev);
              addToast(
                'info',
                previewAllMonths ? '🔒 챌린지 잠금 모드 복원' : '🔓 전체 챌린지 미리보기 활성화',
                previewAllMonths
                  ? '매월 1일 오픈 규칙에 따라 잠긴 달이 비공개됩니다.'
                  : '10월~12월 챌린지 미션 내용을 미리 확인할 수 있습니다.'
              );
            }}
          />
        )}

        {activeView === 'feed' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-4 xl:col-span-4 w-full flex flex-col">
                <MiniRaceWidget
                  posts={posts}
                  roster={roster}
                  currentMonth={currentMonth}
                  onExpandFullRace={() => setActiveView('race')}
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                />
              </div>

              <div className="lg:col-span-8 xl:col-span-8 w-full flex flex-col">
                <ChallengeBanner
                  currentMonth={currentMonth}
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                  postCount={monthFilteredPosts.length}
                  challenges={challenges}
                  previewAllMonths={previewAllMonths}
                  isAdmin={isAdminAuthenticated}
                  onTogglePreviewAll={() => {
                    setPreviewAllMonths((prev) => !prev);
                    addToast(
                      'info',
                      previewAllMonths ? '🔒 챌린지 잠금 모드 복원' : '🔓 전체 챌린지 미리보기 활성화',
                      previewAllMonths
                        ? '매월 1일 오픈 규칙에 따라 잠긴 달이 비공개됩니다.'
                        : '10월~12월 챌린지 미션 내용을 미리 확인할 수 있습니다.'
                    );
                  }}
                />
              </div>
            </div>

            <div className="w-full">
              <FeedView
                posts={monthFilteredPosts}
                selectedGrade={selectedGrade}
                onChangeGrade={setSelectedGrade}
                selectedClass={selectedClass}
                onChangeClass={setSelectedClass}
                searchQuery={searchQuery}
                onChangeSearch={setSearchQuery}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                isAdmin={isAdminAuthenticated}
                onDeletePost={handleDeletePost}
                onDeleteComment={handleDeleteComment}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                onOpenEditModal={handleOpenEditModal}
                onSelectImageZoom={(url, title) => setZoomImage({ url, title })}
              />
            </div>
          </div>
        )}

        {activeView === 'race' && (
          <ClassRaceTrack
            posts={posts}
            roster={roster}
            currentMonth={currentMonth}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        )}

        {activeView === 'admin' && (
  <div className="space-y-4">
    <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <button
        type="button"
        onClick={handleCompressExistingImages}
        disabled={isCompressingExistingImages}
        className="px-4 py-2 rounded-xl border-2 border-black font-black bg-yellow-300 hover:bg-yellow-200 disabled:bg-slate-300 disabled:text-slate-500"
      >
        {isCompressingExistingImages
          ? '기존 사진 압축 중...'
          : '기존 사진 압축 실행'}
      </button>

      <p className="mt-2 text-xs font-bold text-slate-600">
        기존 게시글 사진을 최대 700px, JPEG 품질 0.68로 줄여 다시 저장합니다.
      </p>
    </div>

    <AdminDashboard
      posts={posts}
      roster={roster}
      currentMonth={currentMonth}
      challenges={challenges}
      onUpdateChallenges={handleUpdateChallenges}
      onResetChallenges={handleResetChallenges}
      onUpdateRoster={handleUpdateRoster}
      onResetRoster={handleResetRoster}
      onDeletePost={handleDeletePost}
      onDeleteComment={handleDeleteComment}
      onOpenEditPost={handleOpenEditModal}
      onRefreshData={loadData}
      onToast={addToast}
      adminPassword={adminPassword}
      onChangeAdminPassword={handleChangeAdminPassword}
      onLogout={handleAdminLogout}
      previewAllMonths={previewAllMonths}
      onTogglePreviewAll={() => setPreviewAllMonths((p) => !p)}
    />
  </div>
)}
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="floating-btn-submit-post"
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-2 bg-[#4ADE80] hover:bg-[#3ecf73] text-black px-5 py-3 sm:px-6 sm:py-3.5 rounded-full text-sm sm:text-base font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          <span>
            {typeof currentMonth === 'number' ? currentMonth : 9}월 챌린지 참여하기 📷
          </span>
        </button>
      </div>

      <footer className="mt-12 bg-[#FFD100] border-t-4 border-black py-8 px-4 text-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div>
              <p className="font-black text-sm sm:text-base text-black">창녕중학교 월별 독서 챌린지</p>
              <p className="text-black/80 font-bold mt-0.5">
                실시간 독서 챌린지 레이스
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-center md:text-right">
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectView('admin')}
                  className="bg-black hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-full border-2 border-black font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                  <span>관리자 센터 이동</span>
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-full border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminAuthModalOpen(true)}
                className="bg-white hover:bg-yellow-50 px-3.5 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black flex items-center gap-1.5 transition text-slate-800 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>교사용 관리자 로그인</span>
              </button>
            )}

            <p className="text-black/70">
              © 2025 창녕중학교 독서 진흥 프로그램
            </p>
          </div>
        </div>
      </footer>

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        savedPassword={adminPassword}
        onToast={addToast}
      />

      <ChallengeSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitSuccess={(newPost) => {
  setPosts((prevPosts) => {
    const alreadyExists = prevPosts.some(
      (p) => p.id === newPost.id
    );

    if (alreadyExists) {
      return prevPosts;
    }

    return [newPost, ...prevPosts];
  });

  knownPostIdsRef.current.add(newPost.id);

  latestPostTimeRef.current = newPost.createdAt;
}}
        targetMonth={activeSubmissionMonth}
        challenges={challenges}
        onErrorToast={(title, msg) => addToast('error', title, msg)}
        onSuccessToast={(title, msg) => addToast('success', title, msg)}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        post={editingPost}
        isAdmin={isAdminAuthenticated}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPost(null);
        }}
        onUpdateSuccess={handlePostUpdated}
        onDeleteSuccess={handleDeletePost}
        onErrorToast={(title, msg) => addToast('error', title, msg)}
        onSuccessToast={(title, msg) => addToast('success', title, msg)}
      />

      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="bg-white rounded-[2rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full overflow-hidden p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="text-sm font-black text-black">{zoomImage.title}</h3>
              <button
                onClick={() => setZoomImage(null)}
                className="bg-[#FFD100] p-1.5 rounded-xl border-2 border-black text-black hover:bg-red-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-4/3 bg-black rounded-xl overflow-hidden border-2 border-black">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-[#4ADE80]'
                : toast.type === 'error'
                ? 'bg-[#EF4444] text-white'
                : toast.type === 'warning'
                ? 'bg-[#FFD100]'
                : 'bg-[#3B82F6] text-white'
            }`}
          >
            <div className="space-y-0.5">
              <h4 className="text-xs font-black">{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] font-bold opacity-90">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-75 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
