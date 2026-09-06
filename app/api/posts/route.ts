import { postsStore, challengesStore, gasConfigStore, syncPostToGas } from '@/src/lib/serverStore';
import { Post } from '@/src/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const grade = searchParams.get('grade');
    const classNum = searchParams.get('classNum');
    const search = searchParams.get('search');

    let list = postsStore.filter((p) => !p.isDeleted);

    if (month && month !== 'all') {
      list = list.filter((p) => p.month === Number(month));
    }
    if (grade && grade !== 'all') {
      list = list.filter((p) => p.grade === Number(grade));
    }
    if (classNum && classNum !== 'all') {
      list = list.filter((p) => p.classNum === Number(classNum));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.studentName.toLowerCase().includes(q) ||
          p.bookTitle.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.bookAuthor && p.bookAuthor.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Response.json({ posts: list, total: list.length });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const postData = await request.json();
    const targetMonth = Number(postData.month) || 9;

    // Monthly submission window enforcement
    if (!postData.isAdmin) {
      const challenge = challengesStore.find((c) => c.month === targetMonth);
      const override = challenge?.adminOverride || 'auto';
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;

      if (override === 'force_closed') {
        return Response.json(
          {
            success: false,
            message: `${targetMonth}월 챌린지는 마감되어 더 이상 글을 올릴 수 없습니다. (조회만 가능)`,
          },
          { status: 400 }
        );
      } else if (override === 'force_hidden') {
        return Response.json(
          {
            success: false,
            message: `${targetMonth}월 챌린지는 아직 공개되지 않았습니다.`,
          },
          { status: 400 }
        );
      } else if (override === 'auto') {
        if (targetMonth < currentMonthNum) {
          return Response.json(
            {
              success: false,
              message: `${targetMonth}월 챌린지는 기간이 마감되어 더 이상 글을 올릴 수 없습니다. (기존 인증글 열람만 가능)`,
            },
            { status: 400 }
          );
        } else if (targetMonth > currentMonthNum) {
          return Response.json(
            {
              success: false,
              message: `${targetMonth}월 챌린지는 ${targetMonth}월 1일에 자동 공개되며, ${targetMonth}월 1일부터 글을 올릴 수 있습니다.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const newPost: Post = {
      id: postData.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      grade: Number(postData.grade) || 1,
      classNum: Number(postData.classNum) || 1,
      studentNum: Number(postData.studentNum) || 1,
      studentName: String(postData.studentName || '').trim(),
      bookTitle: String(postData.bookTitle || '').trim(),
      bookAuthor: postData.bookAuthor ? String(postData.bookAuthor).trim() : undefined,
      content: String(postData.content || '').trim(),
      imageUrl:
        postData.imageUrl ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      month: targetMonth,
      challengeTitle: postData.challengeTitle || '첫문장 챌린지',
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      syncedToGas: false,
      password: postData.password ? String(postData.password).trim() : '1234',
    };

    postsStore.unshift(newPost);

    // Sync to Google Apps Script Web App (Sheet and Drive)
    if (gasConfigStore.webAppUrl) {
      syncPostToGas(newPost).catch((err) => {
        console.warn('Background GAS sync error:', err);
      });
    }

    return Response.json({ success: true, post: newPost }, { status: 201 });
  } catch (error: any) {
    console.error('Post creation error:', error);
    return Response.json({ success: false, error: error.message || '글 등록 실패' }, { status: 500 });
  }
}