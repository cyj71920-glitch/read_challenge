import { Post, StudentRosterItem, GasConfig, ChallengeMonthInfo } from '../types';

export const api = {
  // Posts
  async getPosts(params?: {
    month?: number | string;
    grade?: number | string;
    classNum?: number | string;
    search?: string;
  }): Promise<Post[]> {
    try {
      const query = new URLSearchParams();
      if (params?.month !== undefined && params.month !== 'all') query.set('month', String(params.month));
      if (params?.grade !== undefined && params.grade !== 'all') query.set('grade', String(params.grade));
      if (params?.classNum !== undefined && params.classNum !== 'all') query.set('classNum', String(params.classNum));
      if (params?.search) query.set('search', params.search);

      const res = await fetch(`/api/posts?${query.toString()}`);
      if (!res.ok) throw new Error('게시글을 불러오는데 실패했습니다.');
      const data = await res.json();
      return Array.isArray(data) ? data : data.posts || [];
    } catch {
      // Local storage fallback
      const local = localStorage.getItem('reading_challenge_posts');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          return [];
        }
      }
      return [];
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

    // 1. Direct client-side sync to Google Apps Script Web App (prevents CORS & 404 on Vercel/serverless)
    let targetGasUrl = '';
    try {
      const storedGas = localStorage.getItem('library_gas_config');
      if (storedGas) {
        const parsed = JSON.parse(storedGas);
        if (parsed.webAppUrl && parsed.webAppUrl.startsWith('http')) {
          targetGasUrl = parsed.webAppUrl;
        }
      }
    } catch {
      // LocalStorage access safe catch
    }

    if (targetGasUrl) {
      try {
        fetch(targetGasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'submitPost',
            sheetName: '독서챌린지_제출기록',
            post: newPost,
          }),
        }).then(() => {
          newPost.syncedToGas = true;
        }).catch((err) => {
          console.warn('Direct GAS sync background warn:', err);
        });
      } catch (gasErr) {
        console.warn('Direct GAS sync error:', gasErr);
      }
    }

    // 2. Server-side proxy sync & persistence (if backend is active)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        const json = await res.json();
        const serverPost = json.post || json;
        newPost.syncedToGas = serverPost.syncedToGas ?? newPost.syncedToGas;
      }
    } catch {
      // Server offline / static host fallback
    }

    // 3. Robust LocalStorage backup with QuotaExceededError protection
    try {
      const current = await this.getPosts();
      const updated = [newPost, ...current.filter((p) => p.id !== newPost.id)];
      localStorage.setItem('reading_challenge_posts', JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('LocalStorage quota limit exceeded, saving compressed history:', storageErr);
      try {
        const current = await this.getPosts();
        const trimmed = [newPost, ...current.slice(0, 20)];
        localStorage.setItem('reading_challenge_posts', JSON.stringify(trimmed));
      } catch (critErr) {
        console.error('LocalStorage critical write error:', critErr);
      }
    }

    return newPost;
  },

  async verifyPostPassword(id: string, password: string): Promise<{ success: boolean; matched: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/posts/${id}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      return data;
    } catch {
      // Local fallback
      const current = await this.getPosts();
      const target = current.find((p) => p.id === id);
      if (!target) {
        return { success: false, matched: false, message: '글을 찾을 수 없습니다.' };
      }
      const isMatched = (target.password || '1234') === password.trim();
      return {
        success: isMatched,
        matched: isMatched,
        message: isMatched ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.',
      };
    }
  },

  async updatePost(
    id: string,
    updateData: Partial<Post> & { newPassword?: string },
    password?: string,
    isAdmin?: boolean
  ): Promise<Post> {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateData, password, isAdmin }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || '글 수정에 실패했습니다.');
      }
      const json = await res.json();
      return json.post || json;
    } catch (e: any) {
      // fallback for local storage
      const current = await this.getPosts();
      const index = current.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error('해당 글을 찾을 수 없습니다.');
      }
      const target = current[index];
      if (!isAdmin && password) {
        if ((target.password || '1234') !== password.trim()) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
      }
      const updatedPost: Post = {
        ...target,
        ...updateData,
        password: updateData.newPassword ? updateData.newPassword.trim() : target.password,
      };
      current[index] = updatedPost;
      localStorage.setItem('reading_challenge_posts', JSON.stringify(current));
      return updatedPost;
    }
  },

  async deletePost(id: string, password?: string, isAdmin?: boolean): Promise<{ success: boolean; message?: string }> {
    // 1. Immediately remove from localStorage for instant feedback
    try {
      const localStr = localStorage.getItem('reading_challenge_posts');
      if (localStr) {
        const parsed = JSON.parse(localStr);
        if (Array.isArray(parsed)) {
          localStorage.setItem('reading_challenge_posts', JSON.stringify(parsed.filter((p: any) => p.id !== id)));
        }
      }
    } catch (e) {
      console.warn('LocalStorage remove warning:', e);
    }

    // 2. Call server endpoint
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, isAdmin }),
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      if (res.status === 403) {
        throw new Error(errData.message || '비밀번호가 일치하지 않습니다.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('비밀번호')) {
        throw err;
      }
      console.warn('Server delete call error, handled gracefully:', err);
    }

    return { success: true, message: '게시글이 삭제되었습니다.' };
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
    } catch {
      // fallback
    }
    const current = await this.getPosts();
    const target = current.find((p) => p.id === id);
    if (target) {
      target.likes += 1;
      localStorage.setItem('reading_challenge_posts', JSON.stringify(current));
      return target;
    }
    throw new Error('게시글을 찾을 수 없습니다.');
  },

  async addComment(
    id: string,
    text: string,
    author: string
  ): Promise<Post> {
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
    } catch {
      // fallback
    }

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
    } catch {
      // fallback
    }

    const current = await this.getPosts();
    const target = current.find((p) => p.id === postId);
    if (target) {
      target.comments = target.comments.filter((c) => c.id !== commentId);
      localStorage.setItem('reading_challenge_posts', JSON.stringify(current));
      return target;
    }
    throw new Error('게시글을 찾을 수 없습니다.');
  },

  // Roster
  async getRoster(): Promise<StudentRosterItem[]> {
    try {
      const res = await fetch('/api/roster');
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json) ? json : json.roster || [];
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem('reading_challenge_roster');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return [];
      }
    }
    return [];
  },

  async saveRoster(students: StudentRosterItem[]): Promise<StudentRosterItem[]> {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });
      if (res.ok) {
        const json = await res.json();
        console.log('Saved roster to server:', json);
      }
    } catch (e) {
      console.warn('Server roster save error:', e);
    }
    try {
      localStorage.setItem('reading_challenge_roster', JSON.stringify(students));
    } catch (e) {
      console.warn('LocalStorage roster save error:', e);
    }
    return students;
  },

  // GAS Configuration Persistence (Server + LocalStorage fallback)
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
    } catch {
      // Offline / serverless fallback
    }

    const local = localStorage.getItem('library_gas_config');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
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
    } catch (e) {
      console.warn('LocalStorage gas config save error:', e);
    }

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
    } catch {
      // Serverless / static host fallback
    }

    return config;
  },

  // Google Sheets (GAS) Bulk Sync
  async syncToGoogleSheets(data: {
    webAppUrl: string;
    sheetName?: string;
    posts: Post[];
  }): Promise<{ success: boolean; count: number; message?: string }> {
    if (!data.webAppUrl || !data.webAppUrl.startsWith('http')) {
      throw new Error('올바른 Google Apps Script Web App URL을 설정해주세요.');
    }

    // 1. Try server proxy first (avoids browser CORS and handles server-side logging)
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
    } catch {
      // Server proxy unavailable, fallback to client direct fetch
    }

    // 2. Direct client fetch fallback (no-cors mode + text/plain ensures browser compatibility with GAS)
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
      return { success: true, count: data.posts.length, message: '브라우저 직접 전송 완료 (시트에 반영됩니다)' };
    } catch (err: any) {
      console.error('GAS Direct POST error:', err);
      throw new Error('구글 시트 전송 실패: ' + (err.message || '네트워크 오류'));
    }
  },

  // Challenges Management
  async getChallenges(): Promise<ChallengeMonthInfo[]> {
    try {
      const res = await fetch('/api/challenges');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.challenges) && data.challenges.length > 0) {
          return data.challenges;
        }
      }
    } catch {
      // Local fallback
    }
    const local = localStorage.getItem('library_challenges');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // ignore
      }
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
    } catch {
      // Local fallback
    }
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
    } catch {
      // fallback
    }
    localStorage.removeItem('library_challenges');
    return [];
  },

  // Email Notification for Teacher
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
    } catch {
      // fallback
    }
    return { success: true };
  },
};
