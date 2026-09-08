import { postsStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { password, isAdmin, updateData } = body;

    const post = postsStore.find((p) => p.id === id);
    if (!post) {
      return Response.json({ success: false, message: '해당 글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!isAdmin) {
      const storedPw = post.password || '1234';
      const inputPw = String(password || '').trim();
      if (storedPw !== inputPw) {
        return Response.json({ success: false, message: '비밀번호가 일치하지 않아 수정할 수 없습니다.' }, { status: 403 });
      }
    }

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

    return Response.json({ success: true, post, message: '글이 성공적으로 수정되었습니다.' });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty body
    }
    const { password, isAdmin } = body;

    const targetIndex = postsStore.findIndex((p) => p.id === id);
    if (targetIndex === -1) {
      return Response.json({ success: false, message: '해당 글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const post = postsStore[targetIndex];
    if (!isAdmin) {
      const storedPw = post.password || '1234';
      const inputPw = String(password || '').trim();
      if (storedPw !== inputPw) {
        return Response.json({ success: false, message: '비밀번호가 일치하지 않아 삭제할 수 없습니다.' }, { status: 403 });
      }
    }

    post.isDeleted = true;
    return Response.json({ success: true, message: '글이 안전하게 삭제되었습니다.' });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
