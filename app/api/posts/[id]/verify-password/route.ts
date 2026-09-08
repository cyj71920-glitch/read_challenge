import { postsStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { password } = await request.json();
    const post = postsStore.find((p) => p.id === id);

    if (!post) {
      return Response.json(
        { success: false, matched: false, message: '해당 글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const storedPw = post.password || '1234';
    const inputPw = String(password || '').trim();

    if (storedPw === inputPw) {
      return Response.json({ success: true, matched: true, message: '비밀번호가 일치합니다.' });
    } else {
      return Response.json(
        { success: false, matched: false, message: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
