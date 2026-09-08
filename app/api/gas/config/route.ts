import { gasConfigStore } from '@/src/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    config: gasConfigStore,
    isConfigured: !!gasConfigStore.webAppUrl,
  });
}

export async function POST(request: Request) {
  try {
    const { webAppUrl, adminEmail, sheetName, autoEmailAlert } = await request.json();

    if (webAppUrl !== undefined) gasConfigStore.webAppUrl = String(webAppUrl).trim();
    if (adminEmail !== undefined) gasConfigStore.adminEmail = String(adminEmail).trim();
    if (sheetName !== undefined) gasConfigStore.sheetName = String(sheetName).trim();
    if (autoEmailAlert !== undefined) gasConfigStore.autoEmailAlert = Boolean(autoEmailAlert);

    return Response.json({
      success: true,
      config: gasConfigStore,
      message: '구글 스프레드시트 연동 설정이 성공적으로 저장되었습니다.',
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || '설정 저장 실패' },
      { status: 500 }
    );
  }
}
