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

    const response = await fetch(gasUrl);
    const data = await response.json();

    let list = Array.isArray(data.posts) ? data.posts : [];

    const { month, grade, classNum, search, after } = req.query;

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
  const match = String(p.id).match(/^gas-row-(\d+)$/);

  return {
    ...p,
    imageUrl:
      p.imageUrl && match
        ? `/api/posts/${match[1]}/image`
        : '',
  };
});

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
// 기존 게시글의 압축된 사진을 Google Sheets에 저장
app.post('/api/posts/:row/image', async (req, res) => {
  try {
    const row = Number(req.params.row);
    const imageUrl = String(req.body.imageUrl || '');

    if (!row || row < 2) {
      return res.status(400).json({
        success: false,
        message: '올바르지 않은 행 번호입니다.',
      });
    }

    if (!imageUrl.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: '올바른 이미지 데이터가 아닙니다.',
      });
    }

    const gasUrl = getGasUrl();

    if (!gasUrl) {
      return res.status(500).json({
        success: false,
        message: 'Google Apps Script 주소가 설정되지 않았습니다.',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updatePostImage',
        row: row,
        imageUrl: imageUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(500).json({
        success: false,
        message:
          data.message ||
          data.error ||
          '압축된 사진을 저장하지 못했습니다.',
      });
    }

    return res.json({
      success: true,
      row: row,
    });

  } catch (error: any) {
    console.error('기존 사진 저장 실패:', error);

    return res.status(500).json({
      success: false,
      message: error?.message || '기존 사진 저장에 실패했습니다.',
    });
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

    postsStore.unshift(newPost);

    // Sync to Google Apps Script Web App if URL is configured (including photo imageUrl)
if (gasConfigStore.webAppUrl) {
  const synced = await syncPostToGas(newPost);

  if (!synced) {
    console.warn('Google Sheets sync failed.');
  }
}

res.status(201).json({ success: true, post: newPost });
  } catch (error: any) {
    console.error('Post creation error:', error);
    res.status(500).json({ success: false, error: error.message || '글 등록 실패' });
  }
});

// Verify post password (for student author self-editing)
app.post('/api/posts/:id/verify-password', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const post = postsStore.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ success: false, matched: false, message: '해당 글을 찾을 수 없습니다.' });
  }

  const storedPw = post.password || '1234';
  const inputPw = String(password || '').trim();

  if (storedPw === inputPw) {
    return res.json({ success: true, matched: true, message: '비밀번호가 일치합니다.' });
  } else {
    return res.status(401).json({ success: false, matched: false, message: '비밀번호가 일치하지 않습니다.' });
  }
});

// Update post (requires matching password or admin authorization)
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { password, isAdmin, updateData } = req.body;
  const post = postsStore.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ success: false, message: '해당 글을 찾을 수 없습니다.' });
  }

  // Check authorization
  if (!isAdmin) {
    const storedPw = post.password || '1234';
    const inputPw = String(password || '').trim();
    if (storedPw !== inputPw) {
      return res.status(403).json({ success: false, message: '비밀번호가 일치하지 않아 수정할 수 없습니다.' });
    }
  }

  // Update allowed fields
  if (updateData) {
    if (updateData.bookTitle !== undefined) post.bookTitle = String(updateData.bookTitle).trim();
    if (updateData.bookAuthor !== undefined) post.bookAuthor = updateData.bookAuthor ? String(updateData.bookAuthor).trim() : undefined;
    if (updateData.content !== undefined) post.content = String(updateData.content).trim();
    if (updateData.imageUrl !== undefined && updateData.imageUrl) post.imageUrl = updateData.imageUrl;
    if (updateData.studentName !== undefined) post.studentName = String(updateData.studentName).trim();
    if (updateData.grade !== undefined) post.grade = Number(updateData.grade);
    if (updateData.classNum !== undefined) post.classNum = Number(updateData.classNum);
    if (updateData.studentNum !== undefined) post.studentNum = Number(updateData.studentNum);
    if (updateData.newPassword !== undefined && String(updateData.newPassword).trim().length === 4) {
      post.password = String(updateData.newPassword).trim();
    }
  }

  res.json({ success: true, post, message: '글이 성공적으로 수정되었습니다.' });
});

app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const { password, isAdmin } = req.body || {};

  const targetIndex = postsStore.findIndex((p) => p.id === id);

  if (targetIndex !== -1) {
    const post = postsStore[targetIndex];

    if (!isAdmin && password) {
      const storedPw = post.password || '1234';

      if (storedPw !== String(password).trim()) {
        return res.status(403).json({
          success: false,
          message: '비밀번호가 일치하지 않습니다.',
        });
      }
    }

    postsStore.splice(targetIndex, 1);
  }

  try {
const gasUrl = getGasUrl();
    if (gasUrl) {
      const gasResponse = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deletePost',
          id,
        }),
      });

      const gasData = await gasResponse.json();

      if (!gasResponse.ok || !gasData.success) {
        console.warn('GAS 게시글 삭제 실패:', gasData);
      }
    }
  } catch (error) {
    console.warn('GAS 게시글 삭제 요청 실패:', error);
  }

  res.json({
    success: true,
    message: '글이 성공적으로 삭제되었습니다.',
  });
});

app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const post = postsStore.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ success: false, message: '게시글이 존재하지 않습니다.' });
  }
  post.likes += 1;
  res.json({ success: true, likes: post.likes });
});

app.post('/api/posts/:id/comment', (req, res) => {
  const { id } = req.params;
  const { author, text, gradeClass } = req.body;
  const post = postsStore.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ success: false, message: '게시글이 존재하지 않습니다.' });
  }
  const newComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    author: author || '친구',
    gradeClass: gradeClass || '',
    text: text || '',
    createdAt: new Date().toISOString(),
  };
  post.comments.push(newComment);
  res.json({ success: true, comments: post.comments });
});

app.delete('/api/posts/:postId/comments/:commentId', (req, res) => {
  const { postId, commentId } = req.params;
  const post = postsStore.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ success: false, message: '게시글이 존재하지 않습니다.' });
  }
  const cIndex = post.comments.findIndex((c) => c.id === commentId);
  if (cIndex === -1) {
    return res.status(404).json({ success: false, message: '해당 댓글을 찾을 수 없습니다.' });
  }
  post.comments.splice(cIndex, 1);
  res.json({ success: true, comments: post.comments });
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