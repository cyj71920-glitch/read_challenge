import { postsStore, gasConfigStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty
    }

    const { webAppUrl, sheetName } = body;
    const targetUrl = webAppUrl || gasConfigStore.webAppUrl;
    const targetSheet = sheetName || gasConfigStore.sheetName || '독서챌린지_제출기록';

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return Response.json(
        {
          success: false,
          message: 'Google Apps Script 웹앱 배포 URL이 설정되지 않았습니다. 관리자 페이지에서 URL을 입력하세요.',
        },
        { status: 400 }
      );
    }

    const activePosts = postsStore.filter((p) => !p.isDeleted);

    const payload = {
      action: 'batchSync',
      sheetName: targetSheet,
      posts: activePosts.map((p) => ({
        id: p.id,
        grade: p.grade,
        classNum: p.classNum,
        studentNum: p.studentNum,
        studentName: p.studentName,
        bookTitle: p.bookTitle,
        bookAuthor: p.bookAuthor || '',
        content: p.content,
        imageUrl: p.imageUrl || '',
        month: p.month,
        challengeTitle: p.challengeTitle || '',
        likes: p.likes || 0,
        createdAt: p.createdAt,
      })),
      adminEmail: gasConfigStore.adminEmail,
    };

    const gasRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (gasRes.ok) {
      activePosts.forEach((p) => {
        p.syncedToGas = true;
      });
      return Response.json({
        success: true,
        syncedCount: activePosts.length,
        message: `구글 스프레드시트에 총 ${activePosts.length}건의 독서 인증 기록이 성공적으로 동기화되었습니다!`,
      });
    } else {
      const errText = await gasRes.text();
      return Response.json(
        {
          success: false,
          message: `GAS 웹앱 응답 오류 (${gasRes.status}): ${errText}`,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message || 'GAS 동기화 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
