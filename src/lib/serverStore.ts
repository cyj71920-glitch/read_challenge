import { INITIAL_POSTS, INITIAL_STUDENTS_ROSTER, CHALLENGE_MONTHS } from '../data/challenges.js';
import { Post, StudentRosterItem, GasConfig, ChallengeMonthInfo } from '../types.js';
import fs from 'fs';
import path from 'path';

// 로컬 파일 백업 경로 (서버 디스크에 영구 저장)
const DATA_FILE_PATH = path.join(process.cwd(), 'posts_backup.json');

// 파일에서 게시글 불러오기 함수
function loadPostsFromFile(): Post[] | null {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load posts from file:', e);
  }
  return null;
}

// 파일에 게시글 저장하기 함수
export function savePostsToFile(posts: Post[]) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save posts to file:', e);
  }
}

// Global in-memory storage (singleton instance across Next.js and Express)
const globalStore = global as unknown as {
  __postsStore?: Post[];
  __rosterStore?: StudentRosterItem[];
  __challengesStore?: ChallengeMonthInfo[];
  __gasConfigStore?: GasConfig;
};

// 파일에 저장된 데이터가 있다면 우선적으로 불러오고, 없으면 INITIAL_POSTS 사용
const initialLoadedPosts = loadPostsFromFile() || [...INITIAL_POSTS];

export const postsStore: Post[] = globalStore.__postsStore || (globalStore.__postsStore = initialLoadedPosts);
export const rosterStore: StudentRosterItem[] = globalStore.__rosterStore || (globalStore.__rosterStore = [...INITIAL_STUDENTS_ROSTER]);
export const challengesStore: ChallengeMonthInfo[] = globalStore.__challengesStore || (globalStore.__challengesStore = [...CHALLENGE_MONTHS]);
export const gasConfigStore: GasConfig = globalStore.__gasConfigStore || (globalStore.__gasConfigStore = {
  webAppUrl: process.env.GAS_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbxPxYe9MphIUysGQZInyk8iwetU5qXnDpwcUn5Z5kaQSLUWYXoe7YKiEtdsZpJTg98/exec',
  adminEmail: process.env.ADMIN_EMAIL || 'cyj71920@gmail.com',
  sheetName: '독서챌린지_제출기록',
  autoEmailAlert: true,
});

/**
 * Syncs a student submission to Google Apps Script Web App (Google Sheets)
 * Supports full post data including student info and Base64 image URL.
 */
export async function syncPostToGas(post: Post, config: GasConfig = gasConfigStore): Promise<boolean> {
  if (!config.webAppUrl || !config.webAppUrl.startsWith('http')) {
    return false;
  }

  try {
    const payload = {
      action: 'submitPost',
      sheetName: config.sheetName || '독서챌린지_기록',
      post: {
        id: post.id,
        grade: post.grade,
        classNum: post.classNum,
        studentNum: post.studentNum,
        studentName: post.studentName,
        bookTitle: post.bookTitle,
        bookAuthor: post.bookAuthor || '',
        content: post.content,
        imageUrl: post.imageUrl || '',
        month: post.month,
        challengeTitle: post.challengeTitle || '',
        likes: post.likes || 0,
        createdAt: post.createdAt,
      },
      adminEmail: config.adminEmail,
      sendEmail: config.autoEmailAlert,
    };

    const res = await fetch(config.webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      post.syncedToGas = true;
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Google Apps Script sync failed (will rely on client fallback):', error);
    return false;
  }
}