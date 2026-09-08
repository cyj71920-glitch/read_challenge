import { postsStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const post = postsStore.find((p) => p.id === id);

    if (!post) {
      return Response.json({ success: false, message: '글을 찾을 수 없습니다.' }, { status: 404 });
    }

    post.likes = (post.likes || 0) + 1;
    return Response.json({ success: true, likes: post.likes });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
