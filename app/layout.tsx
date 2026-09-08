import React from 'react';
import '../src/index.css';
export const metadata = {
  title: '창녕중학교 월별 독서 챌린지',
  description: '중학교 학생들이 책을 읽고 매월 독서 챌린지 인증 글과 사진을 등록하여 우리 반 마스코트와 함께 달리는 실시간 독서 챌린지 웹앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-[#FFFDF5] text-black antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
