import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { Post, StudentRosterItem, GasConfig, ChallengeMonthInfo } from './src/types.js';
import { postsStore, rosterStore, challengesStore, gasConfigStore, syncPostToGas } from './src/lib/serverStore.js';
import { CHALLENGE_MONTHS } from './src/data/challenges.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const getGasUrl = () =>
  gasConfigStore.webAppUrl ||
  process.env.GAS_WEB_APP_URL ||
  '';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------- API ROUTES ----------------
// Admin Password
app.get('/api/admin/password', async (req, res) => {
  try {
const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.json({
        success: true,
        password: '1234',
      });
    }

    const response = await fetch(
      gasUrl + '?action=getAdminPassword'
    );

    const data = await response.json();

    res.json({
      success: true,
      password: String(data.password || '1234'),
    });
  } catch (error: any) {
    console.error('관리자 비밀번호 불러오기 실패:', error);

    res.status(500).json({
      success: false,
      message: '관리자 비밀번호를 불러오지 못했습니다.',
      password: '1234',
    });
  }
});

app.post('/api/admin/password', async (req, res) => {
  try {
    const password = String(req.body.password || '').trim();

    if (password.length !== 4) {
      return res.status(400).json({
        success: false,
        message: '관리자 비밀번호는 4자리로 입력해주세요.',
      });
    }

const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveAdminPassword',
        password: password,
      }),
    });

    const responseText = await response.text();

let data: any;

try {
  data = JSON.parse(responseText);
} catch {
  console.error(
    'GAS가 JSON이 아닌 응답을 반환했습니다:',
    response.status,
    responseText.substring(0, 300)
  );

  return res.status(502).json({
    success: false,
    message: 'Google Apps Script가 일시적으로 정상 응답하지 않았습니다.',
  });
}

if (!response.ok || !data.success) {
      return res.status(500).json({
        success: false,
        message: data.message || '관리자 비밀번호 저장에 실패했습니다.',
      });
    }

    res.json({
      success: true,
      message: '관리자 비밀번호가 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('관리자 비밀번호 저장 실패:', error);

    res.status(500).json({
      success: false,
      message: '관리자 비밀번호 저장에 실패했습니다.',
    });
  }
});

// 1. Posts Endpoints
app.get('/api/posts', async (req, res) => {
  try {
const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.json({ posts: [], total: 0 });
    }

    const { month, grade, classNum, search, after, viewerId } = req.query;

    // GAS에도 필터 조건을 그대로 전달한다.
    // GAS가 month/after를 처리하면 Vercel까지 전체 게시글을 가져오지 않아도 된다.
    const gasQuery = new URLSearchParams();
    if (month && month !== 'all') {
      gasQuery.set('month', String(month));
    }
    if (after) {
      gasQuery.set('after', String(after));
    }
    if (viewerId) {
      gasQuery.set('viewerId', String(viewerId));
    }

    const gasRequestUrl = gasQuery.toString()
      ? `${gasUrl}?${gasQuery.toString()}`
      : gasUrl;

    const response = await fetch(gasRequestUrl, {
      cache: 'no-store',
    });
    const data = await response.json();

    let list = Array.isArray(data.posts) ? data.posts : [];

    // 실시간 확인용:
    // 특정 시간 이후에 작성된 새 글만 반환
    if (after) {
      const afterTime = new Date(String(after)).getTime();

      list = list.filter((p: Post) => {
        const createdTime = new Date(p.createdAt).getTime();
        return createdTime > afterTime;
      });
    }

    if (month && month !== 'all') {
      list = list.filter((p: Post) => p.month === Number(month));
    }

    if (grade && grade !== 'all') {
      list = list.filter((p: Post) => p.grade === Number(grade));
    }

    if (classNum && classNum !== 'all') {
      list = list.filter((p: Post) => p.classNum === Number(classNum));
    }

    if (search) {
      const q = String(search).toLowerCase();

      list = list.filter(
        (p: Post) =>
          p.studentName.toLowerCase().includes(q) ||
          p.bookTitle.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.bookAuthor && p.bookAuthor.toLowerCase().includes(q))
      );
    }

    list.sort(
      (a: Post, b: Post) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    const postsWithImageUrls = list.map((p: Post) => {
  const rawImageUrl = String(p.imageUrl || '');
  const match = String(p.id).match(/^gas-row-(\d+)$/);

  // 새 방식: GAS가 Drive의 일반 URL을 반환하면 브라우저가
  // Vercel을 거치지 않고 해당 URL에서 이미지를 직접 받는다.
  if (/^https?:\/\//i.test(rawImageUrl)) {
    return {
      ...p,
      imageUrl: rawImageUrl,
    };
  }

  // 기존 Base64 방식과의 호환:
  // 아직 마이그레이션되지 않은 과거 행만 기존 이미지 프록시를 사용한다.
  return {
    ...p,
    imageUrl:
      rawImageUrl && match
        ? `/api/posts/${match[1]}/image`
        : '',
  };
});

res.setHeader('Cache-Control', 'no-store');
res.json({
  posts: postsWithImageUrls,
  total: postsWithImageUrls.length,
});
  } catch (error: any) {
    console.error('Google Sheets posts load failed:', error);

    res.status(500).json({
      success: false,
      error: error?.message || String(error),
      posts: [],
      total: 0,
    });
  }
});
app.get('/api/posts/:id/edit-history', async (req, res) => {
  try {
    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        history: [],
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const targetUrl =
      gasUrl +
      '?action=getPostEditHistory&id=' +
      encodeURIComponent(req.params.id);

    const response = await fetch(targetUrl, {
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success !== true) {
      return res.status(502).json({
        success: false,
        history: [],
        message:
          data?.message ||
          '게시글 수정 이력을 불러오지 못했습니다.',
      });
    }

    res.setHeader('Cache-Control', 'no-store');

    return res.json({
      success: true,
      history: Array.isArray(data.history)
        ? data.history
        : [],
    });
  } catch (error: any) {
    console.error('게시글 수정 이력 조회 실패:', error);

    return res.status(500).json({
      success: false,
      history: [],
      message: '게시글 수정 이력 조회 중 오류가 발생했습니다.',
    });
  }
});

app.get('/api/posts/:postId/comments/:commentId/edit-history', async (req, res) => {
  try {
    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        history: [],
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const targetUrl =
      gasUrl +
      '?action=getCommentEditHistory&postId=' +
      encodeURIComponent(req.params.postId) +
      '&commentId=' +
      encodeURIComponent(req.params.commentId);

    const response = await fetch(targetUrl, {
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success !== true) {
      return res.status(502).json({
        success: false,
        history: [],
        message:
          data?.message ||
          '댓글 수정 이력을 불러오지 못했습니다.',
      });
    }

    res.setHeader('Cache-Control', 'no-store');

    return res.json({
      success: true,
      history: Array.isArray(data.history)
        ? data.history
        : [],
    });
  } catch (error: any) {
    console.error('댓글 수정 이력 조회 실패:', error);

    return res.status(500).json({
      success: false,
      history: [],
      message: '댓글 수정 이력 조회 중 오류가 발생했습니다.',
    });
  }
});

app.get('/api/posts/:row/image', async (req, res) => {
  try {
    const row = req.params.row;

    const gasUrl =
      gasConfigStore.webAppUrl ||
      process.env.GAS_WEB_APP_URL ||
      '';

    if (!gasUrl) {
      return res.status(404).send('Image not found');
    }

    const response = await fetch(
      `${gasUrl}?action=getPostImage&row=${encodeURIComponent(row)}`
    );

    const data = await response.json();

    if (!data.success || !data.imageUrl) {
      return res.status(404).send('Image not found');
    }

    const imageUrl = String(data.imageUrl);

    if (imageUrl.startsWith('data:image/')) {
      const matches = imageUrl.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
      );

      if (!matches) {
        return res.status(400).send('Invalid image');
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Cache-Control',
        'public, max-age=86400, s-maxage=86400'
      );

      return res.send(buffer);
    }

    return res.redirect(imageUrl);

  } catch (error) {
    console.error('Image load failed:', error);
    return res.status(500).send('Image load failed');
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const postData = req.body;
    const targetMonth = Number(postData.month) || 9;

    // Monthly submission window enforcement:
    // Only 1st to last day of that month allowed, unless admin overridden
    if (!postData.isAdmin) {
      const challenge = challengesStore.find((c) => c.month === targetMonth);
      const override = challenge?.adminOverride || 'auto';
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;

      if (override === 'force_closed') {
        return res.status(400).json({
          success: false,
          message: `${targetMonth}월 챌린지는 마감되어 더 이상 글을 올릴 수 없습니다. (조회만 가능)`,
        });
      } else if (override === 'force_hidden') {
        return res.status(400).json({
          success: false,
          message: `${targetMonth}월 챌린지는 아직 공개되지 않았습니다.`,
        });
      } else if (override === 'auto') {
        if (targetMonth < currentMonthNum) {
          return res.status(400).json({
            success: false,
            message: `${targetMonth}월 챌린지는 기간이 마감되어 더 이상 글을 올릴 수 없습니다. (기존 인증글 열람만 가능)`,
          });
        } else if (targetMonth > currentMonthNum) {
          return res.status(400).json({
            success: false,
            message: `${targetMonth}월 챌린지는 ${targetMonth}월 1일에 자동 공개되며, ${targetMonth}월 1일부터 글을 올릴 수 있습니다.`,
          });
        }
      }
    }

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      grade: Number(postData.grade) || 1,
      classNum: Number(postData.classNum) || 1,
      studentNum: Number(postData.studentNum) || 1,
      studentName: String(postData.studentName).trim(),
      bookTitle: String(postData.bookTitle).trim(),
      bookAuthor: postData.bookAuthor ? String(postData.bookAuthor).trim() : undefined,
      content: String(postData.content).trim(),
      imageUrl: postData.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      month: targetMonth,
      challengeTitle: postData.challengeTitle || '첫문장 챌린지',
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      syncedToGas: false,
      password: postData.password ? String(postData.password).trim() : '1234',
    };

    const synced = await syncPostToGas(newPost);

    if (!synced) {
      return res.status(502).json({
        success: false,
        message: '글이 스프레드시트에 저장되지 않았습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    postsStore.unshift(newPost);

    return res.status(201).json({
      success: true,
      post: newPost,
      message: '글이 안전하게 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('Post creation error:', error);
    res.status(500).json({ success: false, error: error.message || '글 등록 실패' });
  }
});

// Student post edit actions are persisted through Google Apps Script.
app.post('/api/posts/:id/verify-password', async (req, res) => {
  try {
    const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.status(500).json({ success: false, matched: false, message: 'Google Apps Script 연결이 설정되지 않았습니다.' });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verifyPostPassword',
        id: req.params.id,
        ...req.body,
      }),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(data?.success ? 200 : 400).json(data);
  } catch (error: any) {
    console.error('게시글 확인 실패:', error);
    return res.status(500).json({ success: false, matched: false, message: '게시글 확인 중 오류가 발생했습니다.' });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    if (req.body?.isAdmin) {
      return res.status(403).json({ success: false, message: '관리자는 게시글 수정 기능을 사용하지 않습니다.' });
    }

    const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.status(500).json({ success: false, message: 'Google Apps Script 연결이 설정되지 않았습니다.' });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updatePost',
        id: req.params.id,
        ...req.body,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!data?.success || !data?.post) {
      return res.status(400).json({
        success: false,
        message: data?.message || '게시글 수정에 실패했습니다.',
      });
    }

    return res.json(data);
  } catch (error: any) {
    console.error('게시글 수정 실패:', error);
    return res.status(500).json({ success: false, message: '게시글 수정 중 오류가 발생했습니다.' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.status(500).json({ success: false, message: 'Google Apps Script 연결이 설정되지 않았습니다.' });
    }

    const action = req.body?.isAdmin ? 'deletePost' : 'deletePostStudent';

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        id: req.params.id,
        ...req.body,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!data?.success) {
      return res.status(400).json({
        success: false,
        message: data?.message || '게시글 삭제에 실패했습니다.',
      });
    }

    return res.json(data);
  } catch (error: any) {
    console.error('게시글 삭제 실패:', error);
    return res.status(500).json({ success: false, message: '게시글 삭제 중 오류가 발생했습니다.' });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'likePost',
        id: req.params.id,
        viewerId: req.body?.viewerId,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success !== true) {
      return res.status(400).json({
        success: false,
        message: data?.message || '좋아요 저장에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      id: req.params.id,
      likes: Number(data.likes) || 0,
      liked: data.liked === true,
    });
  } catch (error: any) {
    console.error('좋아요 저장 실패:', error);

    return res.status(500).json({
      success: false,
      message: '좋아요 저장 중 오류가 발생했습니다.',
    });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addComment',
        id: req.params.id,
        author: req.body?.author,
        text: req.body?.text,
        gradeClass: req.body?.gradeClass || '',
        password: req.body?.password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success !== true || !Array.isArray(data?.comments)) {
      return res.status(400).json({
        success: false,
        message: data?.message || '댓글 저장에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      id: req.params.id,
      comment: data.comment,
      comments: data.comments,
    });
  } catch (error: any) {
    console.error('댓글 저장 실패:', error);

    return res.status(500).json({
      success: false,
      message: '댓글 저장 중 오류가 발생했습니다.',
    });
  }
});

app.put('/api/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateComment',
        id: req.params.postId,
        commentId: req.params.commentId,
        text: req.body?.text,
        password: req.body?.password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success !== true || !Array.isArray(data?.comments)) {
      return res.status(400).json({
        success: false,
        message: data?.message || '댓글 수정에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      comments: data.comments,
    });
  } catch (error: any) {
    console.error('댓글 수정 실패:', error);

    return res.status(500).json({
      success: false,
      message: '댓글 수정 중 오류가 발생했습니다.',
    });
  }
});

app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const action =
      req.body?.isAdmin === true
        ? 'deleteCommentAdmin'
        : 'deleteCommentStudent';

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        id: req.params.postId,
        commentId: req.params.commentId,
        password: req.body?.password || '',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success !== true || !Array.isArray(data?.comments)) {
      return res.status(400).json({
        success: false,
        message: data?.message || '댓글 삭제에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      comments: data.comments,
    });
  } catch (error: any) {
    console.error('댓글 삭제 실패:', error);

    return res.status(500).json({
      success: false,
      message: '댓글 삭제 중 오류가 발생했습니다.',
    });
  }
});

// 4. Student Roster Management & Status Cross-Check
app.get('/api/roster', async (req, res) => {
  const { grade, classNum, currentMonth } = req.query;
  const selectedMonth = currentMonth ? Number(currentMonth) : 9;

  try {

    // Google Apps Script에서 저장된 학생 명부 불러오기
const gasUrl = getGasUrl();
    let rosterFromGas: StudentRosterItem[] = [];

    if (gasUrl) {
      const response = await fetch(gasUrl + '?action=getRoster');

      if (response.ok) {
        const data = await response.json();

        if (data.success && Array.isArray(data.roster)) {
          rosterFromGas = data.roster;
        }
      }
    }

    // GAS에 명부가 없으면 현재 서버 메모리 명부 사용
    const baseRoster =
      rosterFromGas.length > 0 ? rosterFromGas : rosterStore;

    const activePosts = postsStore.filter(p => !p.isDeleted);

    const enrichedRoster = baseRoster.map(student => {
      const studentSubmissions = activePosts.filter(p =>
        p.grade === student.grade &&
        p.classNum === student.classNum &&
        (
          p.studentNum === student.studentNum ||
          p.studentName.trim() === student.name.trim()
        )
      );

      const submittedMonths = Array.from(
        new Set(studentSubmissions.map(p => p.month))
      );

      const hasSubmittedCurrent = studentSubmissions.some(
        p => p.month === selectedMonth
      );

      const lastSub = studentSubmissions[0];

      return {
        ...student,
        submissionCount: studentSubmissions.length,
        submittedMonths,
        hasSubmittedCurrentMonth: hasSubmittedCurrent,
        lastSubmittedAt: lastSub ? lastSub.createdAt : undefined,
      };
    });

    let filtered = enrichedRoster;

    if (grade && grade !== 'all') {
      filtered = filtered.filter(
        s => s.grade === Number(grade)
      );
    }

    if (classNum && classNum !== 'all') {
      filtered = filtered.filter(
        s => s.classNum === Number(classNum)
      );
    }

    res.json({
      roster: filtered,
      totalCount: filtered.length,
      submittedCount: filtered.filter(
        s => s.hasSubmittedCurrentMonth
      ).length,
      unsubmittedCount: filtered.filter(
        s => !s.hasSubmittedCurrentMonth
      ).length,
    });
  } catch (error) {
    console.error('학생 명부 불러오기 실패:', error);

    // GAS 연결에 문제가 있어도 기존 서버 명부로 동작하도록 유지
    const activePosts = postsStore.filter(p => !p.isDeleted);

    const fallbackRoster = rosterStore.map(student => {
      const studentSubmissions = activePosts.filter(p =>
        p.grade === student.grade &&
        p.classNum === student.classNum &&
        (
          p.studentNum === student.studentNum ||
          p.studentName.trim() === student.name.trim()
        )
      );

      const submittedMonths = Array.from(
        new Set(studentSubmissions.map(p => p.month))
      );

      const hasSubmittedCurrent = studentSubmissions.some(
        p => p.month === selectedMonth
      );

      const lastSub = studentSubmissions[0];

      return {
        ...student,
        submissionCount: studentSubmissions.length,
        submittedMonths,
        hasSubmittedCurrentMonth: hasSubmittedCurrent,
        lastSubmittedAt: lastSub ? lastSub.createdAt : undefined,
      };
    });

    res.json({
      roster: fallbackRoster,
      totalCount: fallbackRoster.length,
      submittedCount: fallbackRoster.filter(
        s => s.hasSubmittedCurrentMonth
      ).length,
      unsubmittedCount: fallbackRoster.filter(
        s => !s.hasSubmittedCurrentMonth
      ).length,
    });
  }
});

app.post('/api/roster', async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: '학생 명부 데이터가 올바르지 않습니다.',
      });
    }

    const normalizedStudents: StudentRosterItem[] = students.map(
      (s, idx) => ({
        id:
          s.id ||
          `s-${s.grade}-${s.classNum}-${s.studentNum || idx + 1}`,
        grade: Number(s.grade) || 1,
        classNum: Number(s.classNum) || 1,
        studentNum: Number(s.studentNum) || idx + 1,
        name: String(s.name || '').trim(),
      })
    );

    // 서버 메모리에도 즉시 반영
    rosterStore.length = 0;
    rosterStore.push(...normalizedStudents);

    // Google Apps Script에도 영구 저장
const gasUrl = getGasUrl();
    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 연결이 설정되지 않았습니다.',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveRoster',
        students: normalizedStudents,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(500).json({
        success: false,
        message:
          data.message ||
          data.error ||
          'Google Sheets에 학생 명부를 저장하지 못했습니다.',
      });
    }

    res.json({
      success: true,
      count: normalizedStudents.length,
    });
  } catch (error) {
    console.error('학생 명부 저장 실패:', error);

    res.status(500).json({
      success: false,
      message: '학생 명부 저장에 실패했습니다.',
    });
  }
});
// 5. GAS Web App Configuration & Webhook Proxy
app.get('/api/gas/config', (req, res) => {
  res.json(gasConfigStore);
});

app.post('/api/gas/config', (req, res) => {
  const { webAppUrl, adminEmail, sheetName, autoEmailAlert } = req.body;
  if (webAppUrl !== undefined) gasConfigStore.webAppUrl = String(webAppUrl).trim();
  if (adminEmail !== undefined) gasConfigStore.adminEmail = String(adminEmail).trim();
  if (sheetName !== undefined) gasConfigStore.sheetName = String(sheetName).trim();
  if (autoEmailAlert !== undefined) gasConfigStore.autoEmailAlert = Boolean(autoEmailAlert);
  gasConfigStore.lastSyncedAt = new Date().toISOString();
  res.json({ success: true, config: gasConfigStore });
});

app.post('/api/gas/test-webhook', async (req, res) => {
  const { webAppUrl } = req.body;
  const targetUrl = webAppUrl || gasConfigStore.webAppUrl;

  if (!targetUrl) {
    return res.status(400).json({ success: false, message: 'Google Apps Script Web App URL을 입력해주세요.' });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ping',
        testTime: new Date().toISOString(),
        adminEmail: gasConfigStore.adminEmail,
      }),
    });

    const data = await response.text();
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      json = { raw: data };
    }

    res.json({ success: true, message: 'GAS Web App 통신 성공!', data: json });
  } catch (err: any) {
    console.error('GAS webhook test failed:', err);
    res.status(500).json({ success: false, message: '연결 실패: ' + (err.message || '네트워크 오류') });
  }
});

// Full Batch GAS Sync Proxy (bypasses browser CORS and sends photos to Google Sheets)
app.post('/api/gas/sync', async (req, res) => {
  const { webAppUrl, sheetName, posts } = req.body;
  const targetUrl = webAppUrl || gasConfigStore.webAppUrl;

  if (!targetUrl) {
    return res.status(400).json({ success: false, message: 'Google Apps Script Web App URL을 설정해주세요.' });
  }

  const postsToSend = Array.isArray(posts) && posts.length > 0 ? posts : postsStore.filter((p) => !p.isDeleted);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncPosts',
        sheetName: sheetName || gasConfigStore.sheetName || '독서챌린지_기록',
        posts: postsToSend,
        adminEmail: gasConfigStore.adminEmail,
      }),
    });

    const data = await response.text();
    let json;
    try {
      json = JSON.parse(data);
    } catch {
      json = { raw: data };
    }

    gasConfigStore.lastSyncedAt = new Date().toISOString();
    res.json({ success: true, count: postsToSend.length, data: json });
  } catch (err: any) {
    console.error('GAS sync error:', err);
    res.status(500).json({ success: false, message: '스프레드시트 동기화 실패: ' + (err.message || '네트워크 오류') });
  }
});

// 6. Challenge Configuration Endpoints (Lock/Open/Admin Override)
app.get('/api/challenges', (req, res) => {
  res.json({ challenges: challengesStore });
});

app.put('/api/challenges', (req, res) => {
  const { challenges } = req.body;
  if (Array.isArray(challenges)) {
    challengesStore.length = 0;
    challengesStore.push(...challenges);
  }
  res.json({ success: true, challenges: challengesStore });
});

app.post('/api/challenges/reset', (req, res) => {
  challengesStore.length = 0;
  challengesStore.push(...CHALLENGE_MONTHS);
  res.json({ success: true, challenges: challengesStore });
});

// ---------------- VITE MIDDLEWARE & SERVER STARTUP ----------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // 배포 환경: 빌드된 파일 사용
    const distPath = path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
  const { createServer: createViteServer } = await import('vite');

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);
}

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[독서 챌린지 Full-Stack Server] running on http://localhost:${PORT}`
      );
    });
  }
}

startServer();

export default app;