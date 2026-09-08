import { postsStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { text, authorName } = await request.json();
    const post = postsStore.find((p) => p.id === id);

    if (!post) {
      return Response.json({ success: false, message: '글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!post.comments) post.comments = [];

    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: String(authorName || '익명').trim(),
      text: String(text || '').trim(),
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment);
    return Response.json({ success: true, comment: newComment });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
