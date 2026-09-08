import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Send,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  Edit3,
} from 'lucide-react';
import { Post } from '../types';
import confetti from 'canvas-confetti';
import { ConfirmModal } from './ConfirmModal';

interface FeedViewProps {
  posts: Post[];
  selectedGrade: string;
  onChangeGrade: (grade: string) => void;
  selectedClass: string;
  onChangeClass: (classNum: string) => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, text: string, authorName: string) => void;
  isAdmin: boolean;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onOpenSubmitModal: () => void;
  onOpenEditModal?: (post: Post) => void;
  onSelectImageZoom: (imageUrl: string, title: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  selectedGrade,
  onChangeGrade,
  selectedClass,
  onChangeClass,
  searchQuery,
  onChangeSearch,
  onLikePost,
  onAddComment,
  isAdmin,
  onDeletePost,
  onDeleteComment,
  onOpenSubmitModal,
  onOpenEditModal,
  onSelectImageZoom,
}) => {
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentAuthors, setCommentAuthors] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // In-App Confirm Modal State (Non-blocking in iframes)
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

  const handleLike = (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onLikePost(postId);
    setLikedPosts((prev) => ({ ...prev, [postId]: true }));

    // Confetti burst on heart click
    try {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 20,
        spread: 50,
        origin: { x, y },
        colors: ['#EF4444', '#FFD100', '#FF6B00', '#4ADE80'],
      });
    } catch {
      // fallback
    }
  };

  const togglePostContentExpansion = (postId: string) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const author = commentAuthors[postId]?.trim() || '친구';
    onAddComment(postId, text, author);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'likes') {
      return b.likes - a.likes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch {
      return '최근';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar (Vibrant Neo-Brutalist) */}
      <div className="bg-white rounded-[2rem] p-5 sm:p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-posts-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="학생 이름, 책 제목, 감상평 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-black bg-slate-50 text-xs sm:text-sm font-black focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FFD100] transition"
            />
            {searchQuery && (
              <button
                onClick={() => onChangeSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-black bg-[#FFD100] px-2 py-0.5 rounded-md border border-black"
              >
                지우기
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-black shrink-0">정렬:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl border-2 border-black text-xs font-black">
              <button
                id="sort-btn-newest"
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === 'newest'
                    ? 'bg-[#FFD100] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                최신순
              </button>
              <button
                id="sort-btn-likes"
                onClick={() => setSortBy('likes')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  sortBy === 'likes'
                    ? 'bg-[#FF6B00] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                인기순 (❤️)
              </button>
            </div>
          </div>
        </div>

        {/* Middle School Grade & Class Filter Chips (1~3학년, 1~4반) */}
        <div className="pt-3 border-t-2 border-dashed border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 font-black text-black mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>학년 (중학교 1~3):</span>
          </div>

          <button
            id="filter-grade-all"
            onClick={() => onChangeGrade('all')}
            className={`px-3 py-1.5 rounded-xl font-black transition-all border-2 border-black ${
              selectedGrade === 'all'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            전체 학년
          </button>

          {[1, 2, 3].map((g) => (
            <button
              key={g}
              id={`filter-grade-${g}`}
              onClick={() => onChangeGrade(String(g))}
              className={`px-3 py-1.5 rounded-xl font-black transition-all border-2 border-black ${
                selectedGrade === String(g)
                  ? 'bg-[#4ADE80] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-yellow-100'
              }`}
            >
              {g}학년
            </button>
          ))}

          <div className="w-0.5 h-5 bg-black mx-1 hidden sm:block" />

          {/* Class filter (1~4반) */}
          <div className="flex items-center gap-1 font-black text-black mr-1 mt-1 sm:mt-0">
            <span>반 (1~4반):</span>
          </div>

          <button
            id="filter-class-all"
            onClick={() => onChangeClass('all')}
            className={`px-2.5 py-1.5 rounded-xl font-black transition-all border-2 border-black ${
              selectedClass === 'all'
                ? 'bg-[#3B82F6] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black hover:bg-blue-50'
            }`}
          >
            전체 반
          </button>

          {[1, 2, 3, 4].map((c) => (
            <button
              key={c}
              id={`filter-class-${c}`}
              onClick={() => onChangeClass(String(c))}
              className={`px-2.5 py-1.5 rounded-xl font-black transition-all border-2 border-black ${
                selectedClass === String(c)
                  ? 'bg-[#3B82F6] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-blue-50'
              }`}
            >
              {c}반
            </button>
          ))}
        </div>
      </div>

      {/* Feed Cards Grid (Screen 2: 2-column wide layout) */}
      {sortedPosts.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-lg mx-auto my-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFD100] text-black border-2 border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-black">등록된 챌린지 글이 없습니다</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
              선택한 조건의 글이 없거나 아직 참여하지 않았습니다. 내가 첫 번째 주자로 참여해보세요!
            </p>
          </div>
          <button
            onClick={onOpenSubmitModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#4ADE80] text-black font-black text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] active:translate-y-[2px] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>첫 챌린지 인증샷 올리기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
          {sortedPosts.map((post) => {
            const isCommentsOpen = activeCommentPostId === post.id;
            const isHeartLiked = likedPosts[post.id];
            const isExpanded = !!expandedPosts[post.id];

            return (
              <article
                key={post.id}
                id={`post-card-${post.id}`}
                className="bg-white rounded-[2rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Header */}
                <div className="p-4 flex items-center justify-between border-b-2 border-black bg-white">
                  <div className="flex items-center gap-3">
                    {/* Grade/Class avatar pill */}
                    <div className="w-10 h-10 rounded-xl bg-[#FFD100] border-2 border-black flex items-center justify-center text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {post.grade}-{post.classNum}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-black">
                          {post.studentName}
                        </span>
                        <span className="text-[11px] font-black text-black bg-[#4ADE80] px-2 py-0.5 rounded-md border border-black">
                          {post.grade}학년 {post.classNum}반 {post.studentNum}번
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <span className="text-[#FF6B00] font-black">{post.month}월 {post.challengeTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions in Card Header: Edit (with password) & Admin Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenEditModal && (
                      <button
                        id={`btn-edit-${post.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditModal(post);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-[#FFFBEB] hover:bg-[#FEF3C7] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition"
                        title="비밀번호를 입력하여 글 수정하기"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>수정</span>
                      </button>
                    )}

                    {/* Admin Delete button for Post */}
                    {isAdmin && onDeletePost && (
                      <button
                        id={`btn-delete-${post.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModalState({
                            isOpen: true,
                            title: '게시글 삭제 확인 (관리자)',
                            message: `${post.grade}학년 ${post.classNum}반 ${post.studentName} 학생의 '${post.bookTitle}' 인증글을 삭제하시겠습니까?`,
                            subMessage: '삭제 후에는 해당 글과 작성된 댓글이 모두 삭제되며 복구할 수 없습니다.',
                            confirmLabel: '게시글 삭제',
                            isDestructive: true,
                            onConfirm: () => {
                              onDeletePost(post.id);
                            },
                          });
                        }}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-xl border-2 border-black bg-white hover:bg-red-50 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition"
                        title="관리자 게시글 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo (Instagram Feed View) */}
                <div
                  className="relative aspect-4/3 bg-black overflow-hidden cursor-pointer border-b-2 border-black"
                  onClick={() => onSelectImageZoom(post.imageUrl, `${post.studentName} - ${post.bookTitle}`)}
                >
                  <img
                    src={post.imageUrl}
                    alt={`${post.bookTitle} 인증샷`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Challenge Badge Overlay */}
                  <div className="absolute top-3 left-3 bg-black text-white text-[11px] font-black px-3 py-1 rounded-full border-2 border-white flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 text-[#FFD100]" />
                    <span>{post.month}월: {post.challengeTitle}</span>
                  </div>
                </div>

                {/* Actions Row (Like, Comment, Share) */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        id={`btn-like-${post.id}`}
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition transform active:scale-95 ${
                          isHeartLiked || post.likes > 0
                            ? 'bg-[#EF4444] text-white'
                            : 'bg-white text-black hover:bg-red-50'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isHeartLiked || post.likes > 0 ? 'fill-white text-white' : 'text-black'
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>

                      <button
                        id={`btn-comment-toggle-${post.id}`}
                        onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition ${
                          isCommentsOpen ? 'bg-[#FFD100] text-black' : 'bg-white text-black hover:bg-yellow-50'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>댓글 {post.comments.length}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('챌린지 링크가 복사되었습니다!');
                      }}
                      className="p-1.5 rounded-xl border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition"
                      title="공유하기"
                    >
                      <Share2 className="w-3.5 h-3.5 text-black" />
                    </button>
                  </div>

                  {/* Book Title & Author */}
                  <div className="bg-[#FFFBEB] p-2.5 rounded-xl border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <BookOpen className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="font-black text-xs text-black truncate">
                      {post.bookTitle}
                    </span>
                    {post.bookAuthor && (
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">
                        ({post.bookAuthor})
                      </span>
                    )}
                  </div>

                  {/* Student Content / Reflection (Click to Expand Full Text) */}
                  <div
                    onClick={() => togglePostContentExpansion(post.id)}
                    className="cursor-pointer group/text bg-slate-50 hover:bg-yellow-50/50 p-2.5 rounded-xl border border-slate-300 hover:border-black transition"
                    title="클릭하여 감상평 전체 보기 / 접기"
                  >
                    <p
                      className={`text-xs sm:text-sm font-bold text-slate-800 leading-relaxed transition-all ${
                        isExpanded ? 'line-clamp-none' : 'line-clamp-3'
                      }`}
                    >
                      {post.content}
                    </p>
                    <div className="mt-1 flex items-center justify-end text-[11px] font-black text-blue-600 group-hover/text:text-blue-800 select-none">
                      {isExpanded ? (
                        <span className="flex items-center gap-0.5">
                          <span>내용 접기</span>
                          <ChevronUp className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <span>전체 내용 더보기</span>
                          <ChevronDown className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Peer Comments Section */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t-2 border-black space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-[#3B82F6]" />
                          친구들의 댓글 ({post.comments.length})
                        </span>
                      </div>

                      {/* Comments List */}
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                        {post.comments.length === 0 ? (
                          <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 text-center">
                            <p className="text-slate-500 font-bold text-[11px]">
                              아직 댓글이 없습니다. 첫 번째 응원 댓글을 남겨보세요! ✨
                            </p>
                          </div>
                        ) : (
                          post.comments.map((c) => (
                            <div
                              key={c.id}
                              className="bg-slate-50 p-2.5 rounded-xl border-2 border-black text-xs space-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <div className="flex items-center justify-between font-black text-black">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-[#FFD100] text-black px-1.5 py-0.2 rounded border border-black text-[10px]">
                                    {c.author}
                                  </span>
                                  {c.gradeClass && (
                                    <span className="text-[10px] text-slate-500 font-bold">
                                      ({c.gradeClass})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    {formatDate(c.createdAt)}
                                  </span>
                                  {/* Admin Comment Deletion Button */}
                                  {isAdmin && onDeleteComment && (
                                    <button
                                      onClick={() => {
                                        setConfirmModalState({
                                          isOpen: true,
                                          title: '댓글 삭제 확인 (관리자)',
                                          message: `'${c.author}' 님의 댓글을 삭제하시겠습니까?`,
                                          confirmLabel: '댓글 삭제',
                                          isDestructive: true,
                                          onConfirm: () => {
                                            onDeleteComment(post.id, c.id);
                                          },
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-100 transition"
                                      title="관리자 댓글 삭제"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-800 font-bold text-xs pl-1">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Peer Comment Form: Name and Content input */}
                      <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="space-y-1.5 pt-1">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={commentAuthors[post.id] || ''}
                            onChange={(e) =>
                              setCommentAuthors((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="내 이름 (예: 김민준)"
                            className="w-1/3 px-2.5 py-1.5 text-xs font-black rounded-xl border-2 border-black bg-white focus:outline-none focus:bg-yellow-50"
                            required
                          />
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="응원 댓글 내용을 입력하세요..."
                            className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-black bg-white focus:outline-none focus:bg-yellow-50"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-[#4ADE80] text-black px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#3ecf73] transition shrink-0 flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>등록</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Non-blocking iframe-safe Confirm Modal */}
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
