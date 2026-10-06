import { Post, StudentRosterItem, GasConfig, ChallengeMonthInfo } from '../types';

export const api = {
  // Posts
  async getPosts(params?: {
    month?: number | string;
    grade?: number | string;
    classNum?: number | string;
    search?: string;
  }): Promise<Post[]> {
    const query = new URLSearchParams();
    if (params?.month !== undefined && params.month !== 'all') query.set('month', String(params.month));
    if (params?.grade !== undefined && params.grade !== 'all') query.set('grade', String(params.grade));
    if (params?.classNum !== undefined && params.classNum !== 'all') query.set('classNum', String(params.classNum));
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/posts?${query.toString()}`);
    if (!res.ok) throw new Error('게시글을 불러오는데 실패했습니다.');
    const data = await res.json();
    return Array.isArray(data) ? data : data.posts || [];
  },
async getNewPosts(after: string, month?: number): Promise<Post[]> {
  const query = new URLSearchParams();

  query.set('after', after);
  if (month !== undefined) {
    query.set('month', String(month));
  }

  const res = await fetch(`/api/posts?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('새 게시글을 불러오는데 실패했습니다.');
  }

  const data = await res.json();

  return Array.isArray(data)
    ? data
    : data.posts || [];
},
  // Admin Password
  async getAdminPassword(): Promise<string> {
    try {
      const res = await fetch('/api/admin/password');

      if (!res.ok) {
        throw new Error('관리자 비밀번호를 불러오는데 실패했습니다.');
      }

      const data = await res.json();

      return String(data.password || '1234');
    } catch (error) {
      console.warn('관리자 비밀번호 불러오기 실패:', error);

      // 서버 연결이 안 될 경우 기존 브라우저 저장값 사용
      try {
        return localStorage.getItem('library_admin_password') || '1234';
      } catch {
        return '1234';
      }
    }
  },

  async saveAdminPassword(newPassword: string): Promise<boolean> {
    const password = String(newPassword).trim();

    if (password.length !== 4) {
      throw new Error('관리자 비밀번호는 4자리로 입력해주세요.');
    }

    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || '관리자 비밀번호 저장에 실패했습니다.'
        );
      }

      // 현재 브라우저에서도 바로 사용할 수 있도록 임시 저장
      try {
        localStorage.setItem('library_admin_password', password);
      } catch {}

      return true;
    } catch (error) {
      console.error('관리자 비밀번호 저장 실패:', error);

      // 서버 저장에 실패한 경우 현재 브라우저에만 저장
      try {
        localStorage.setItem('library_admin_password', password);
      } catch {}

      throw error;
    }
  },

  async createPost(postData: Partial<Post>): Promise<Post> {
    const newPost: Post = {
      id: postData.id || `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      grade: Number(postData.grade) || 1,
      classNum: Number(postData.classNum) || 1,
      studentNum: Number(postData.studentNum) || 1,
      studentName: (postData.studentName || '').trim(),
      bookTitle: (postData.bookTitle || '').trim(),
      bookAuthor: postData.bookAuthor ? postData.bookAuthor.trim() : undefined,
      content: (postData.content || '').trim(),
      imageUrl: postData.imageUrl || '',
      month: Number(postData.month) || 9,
      challengeTitle: postData.challengeTitle || '첫문장 챌린지',
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      syncedToGas: false,
      password: postData.password ? String(postData.password).trim() : '1234',
    };

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    });

    let json: any = {};
    try {
      json = await res.json();
    } catch {}

    if (!res.ok || json?.success !== true) {
      throw new Error(
        json?.message ||
        json?.error ||
        '글이 스프레드시트에 저장되지 않았습니다. 잠시 후 다시 시도해주세요.'
      );
    }

    return json.post || newPost;
  },

  async verifyPostPassword(id: string, password: string): Promise<{ success: boolean; matched: boolean; message?: string }> {
    const res = await fetch(`/api/posts/${id}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success !== true || data?.matched !== true) {
      return {
        success: false,
        matched: false,
        message: data?.message || '비밀번호 확인에 실패했습니다.',
      };
    }

    return data;
  },

  async updatePost(
    id: string,
    updateData: Partial<Post> & { newPassword?: string },
    password?: string,
    isAdmin?: boolean
  ): Promise<Post> {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateData, password, isAdmin }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success !== true || !data?.post) {
      throw new Error(data?.message || '글 수정에 실패했습니다.');
    }

    return data.post;
  },

  async deletePost(id: string, password?: string, isAdmin?: boolean): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, isAdmin }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success !== true) {
      throw new Error(data?.message || '게시글 삭제에 실패했습니다.');
    }

    return data;
  },

  async likePost(id: string): Promise<Post> {
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        return json.post || json;
      }
    } catch {}
    const current = await this.getPosts();
    const target = current.find((p) => p.id === id);
    if (target) {
      target.likes += 1;
      localStorage.setItem('reading_challenge_posts', JSON.stringify(current));
      return target;
    }
    throw new Error('게시글을 찾을 수 없습니다.');
  },

  async addComment(id: string, text: string, author: string): Promise<Post> {
    const newComment = {
      id: `c_${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/posts/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComment),
      });
      if (res.ok) {
        const json = await res.json();
        return json.post || json;
      }
    } catch {}

    const current = await this.getPosts();
    const target = current.find((p) => p.id === id);
    if (target) {
      target.comments = [...target.comments, newComment];
      localStorage.setItem('reading_challenge_posts', JSON.stringify(current));
      return target;
    }
    throw new Error('게시글을 찾을 수 없습니다.');
  },

  async deleteComment(postId: string, commentId: string): Promise<Post> {
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        return json.post || json;
      }
    } catch {}

    const current = await this.getPosts();
    const target = current.find((p) => p.id === postId);
    if (target) {
      target.comments = target.comments.filter((c) => c.id !== commentId);
      localStorage.setItem('reading_challenge_posts', JSON.stringify(current));
      return target;
    }
    throw new Error('게시글을 찾을 수 없습니다.');
  },

async getRoster(): Promise<StudentRosterItem[]> {
  try {
    const res = await fetch('/api/roster');

    if (res.ok) {
      const json = await res.json();
      return Array.isArray(json) ? json : json.roster || [];
    }
  } catch (error) {
    console.warn('학생 명부 불러오기 실패:', error);
  }

  // 서버 연결이 안 될 경우 기존 브라우저 저장 데이터 사용
  try {
    const local = localStorage.getItem('reading_challenge_roster');

    if (local) {
      return JSON.parse(local);
    }
  } catch (error) {
    console.warn('로컬 학생 명부 불러오기 실패:', error);
  }

  return [];
},

async saveRoster(students: StudentRosterItem[]): Promise<StudentRosterItem[]> {
  const res = await fetch('/api/roster', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ students }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.message || '학생 명부 저장에 실패했습니다.'
    );
  }

  // 브라우저에도 백업 저장
  try {
    localStorage.setItem(
      'reading_challenge_roster',
      JSON.stringify(students)
    );
  } catch (error) {
    console.warn('학생 명부 로컬 백업 저장 실패:', error);
  }

  return students;
},
  async getGasConfig(): Promise<GasConfig> {
    try {
      const res = await fetch('/api/gas/config');
      if (res.ok) {
        const json = await res.json();
        if (json && json.webAppUrl) {
          localStorage.setItem('library_gas_config', JSON.stringify(json));
          return json;
        }
      }
    } catch {}
    const local = localStorage.getItem('library_gas_config');
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return {
      webAppUrl: '',
      adminEmail: 'cyj71920@gmail.com',
      sheetName: '독서챌린지_제출기록',
      autoEmailAlert: true,
    };
  },

  async saveGasConfig(config: GasConfig): Promise<GasConfig> {
    try {
      localStorage.setItem('library_gas_config', JSON.stringify(config));
    } catch {}
    try {
      const res = await fetch('/api/gas/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        return data.config || config;
      }
    } catch {}
    return config;
  },

  async syncToGoogleSheets(data: {
    webAppUrl: string;
    sheetName?: string;
    posts: Post[];
  }): Promise<{ success: boolean; count: number; message?: string }> {
    if (!data.webAppUrl || !data.webAppUrl.startsWith('http')) {
      throw new Error('올바른 Google Apps Script Web App URL을 설정해주세요.');
    }
    try {
      const res = await fetch('/api/gas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webAppUrl: data.webAppUrl,
          sheetName: data.sheetName || '독서챌린지_제출기록',
          posts: data.posts,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, count: json.count || data.posts.length, message: '구글 시트 동기화 완료' };
      }
    } catch {}
    try {
      await fetch(data.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncPosts',
          sheetName: data.sheetName || '독서챌린지_제출기록',
          posts: data.posts,
        }),
      });
      return { success: true, count: data.posts.length, message: '브라우저 직접 전송 완료' };
    } catch (err: any) {
      throw new Error('구글 시트 전송 실패: ' + (err.message || '네트워크 오류'));
    }
  },

  async getChallenges(): Promise<ChallengeMonthInfo[]> {
    try {
      const res = await fetch('/api/challenges');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          return data.challenges;
        }
      }
    } catch {}
    const local = localStorage.getItem('library_challenges');
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return [];
  },

  async saveChallenges(challenges: ChallengeMonthInfo[]): Promise<ChallengeMonthInfo[]> {
    try {
      const res = await fetch('/api/challenges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenges }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.challenges)) {
          localStorage.setItem('library_challenges', JSON.stringify(data.challenges));
          return data.challenges;
        }
      }
    } catch {}
    localStorage.setItem('library_challenges', JSON.stringify(challenges));
    return challenges;
  },

  async resetChallenges(): Promise<ChallengeMonthInfo[]> {
    try {
      const res = await fetch('/api/challenges/reset', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.challenges)) {
          localStorage.setItem('library_challenges', JSON.stringify(data.challenges));
          return data.challenges;
        }
      }
    } catch {}
    localStorage.removeItem('library_challenges');
    return [];
  },

  async sendTeacherEmailAlert(data: {
    adminEmail: string;
    month: number;
    unsubmittedCount: number;
    submittedCount: number;
  }): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/admin/email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return res.json();
    } catch {}
    return { success: true };
  },
};
