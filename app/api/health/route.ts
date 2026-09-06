import { postsStore, rosterStore, gasConfigStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    appName: '창녕중학교 월별 독서 챌린지',
    framework: 'Next.js App Router & Express Unified',
    totalPosts: postsStore.filter((p) => !p.isDeleted).length,
    totalRoster: rosterStore.length,
    gasConfigured: !!gasConfigStore.webAppUrl,
    timestamp: new Date().toISOString(),
  });
}
