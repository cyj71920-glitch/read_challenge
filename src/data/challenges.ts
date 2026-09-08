import { ChallengeMonthInfo, Post, StudentRosterItem } from '../types';

export const CHALLENGE_MONTHS: ChallengeMonthInfo[] = [
  {
    month: 9,
    title: '첫문장 챌린지',
    subtitle: '책의 첫 문장을 찍어 올리고 마음에 와닿은 이유를 남겨보세요!',
    theme: '첫 문장의 설렘',
    badge: '📖 첫문장 탐험가',
    iconName: 'BookOpen',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      light: 'bg-emerald-100',
      gradient: 'from-emerald-500 to-teal-600',
    },
    missionDescription: '지금 읽고 있는 책의 첫 페이지, 가장 강렬하게 시작하는 첫 문장을 스마트폰으로 찰칵 찍어 업로드해주세요! 왜 이 문장이 끌렸는지 한 줄 소감도 함께 적어주세요.',
    tips: [
      '글자가 또렷하게 보이도록 밝은 곳에서 촬영하세요.',
      '도서명과 작가 이름을 정확히 적어주세요.',
      '첫 문장을 읽고 느낀 첫 느낌을 솔직하게 표현해보세요.',
    ],
    sampleImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    isOpen: true,
    unlockDate: '9월 1일',
  },
  {
    month: 10,
    title: '책표지 따라하기 챌린지',
    subtitle: '책 표지의 일러스트나 주인공 포즈를 싱크로율 100%로 재현해보세요!',
    theme: '표지 코스프레 & 명장면',
    badge: '🎭 표지 싱크로율 99%',
    iconName: 'Sparkles',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      light: 'bg-amber-100',
      gradient: 'from-amber-500 to-orange-600',
    },
    missionDescription: '좋아하는 책 표지의 그림이나 주인공 표정, 손짓, 구도를 직접 따라 하여 나만의 재치 있는 인증샷을 찍어 올려보세요! 친구와 함께 소품을 활용해도 좋아요.',
    tips: [
      '책 표지와 내 포즈가 나란히 보이게 구도를 잡아보세요.',
      '과장된 표정이나 재미있는 소품을 활용하면 인기 만점!',
      '어떤 책을 골랐는지 이유를 적어주면 더욱 좋아요.',
    ],
    sampleImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    isOpen: false,
    unlockDate: '10월 1일',
  },
  {
    month: 11,
    title: '독서 명당 챌린지',
    subtitle: '나만의 비밀 아지트나 기분 좋은 장소에서 책 읽는 모습을 자랑해보세요!',
    theme: '나만의 힐링 스팟',
    badge: '🛋️ 독서 명당 마스터',
    iconName: 'MapPin',
    color: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-700',
      light: 'bg-sky-100',
      gradient: 'from-sky-500 to-blue-600',
    },
    missionDescription: '학교 도서관 구석 소파, 햇살 드는 교실 창가, 가을 낙엽이 쌓인 벤치 등 내가 가장 집중해서 책을 읽을 수 있는 명당에서 독서하는 모습을 찍어 공유해주세요!',
    tips: [
      '장소의 분위기와 책이 함께 어우러지게 찍어보세요.',
      '이 장소를 독서 명당으로 추천하는 특별한 이유를 적어주세요.',
      '안전하고 편안한 장소에서 촬영해주세요.',
    ],
    sampleImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80',
    isOpen: false,
    unlockDate: '11월 1일',
  },
  {
    month: 12,
    title: '보물찾기 챌린지',
    subtitle: '이 달의 미션 단어가 쏙 들어간 책 속 문장을 찾아 사진으로 포착하세요!',
    theme: '책 속 단어 탐정',
    badge: '🔎 단어 보물 사냥꾼',
    iconName: 'Search',
    color: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      light: 'bg-rose-100',
      gradient: 'from-rose-500 to-pink-600',
    },
    missionDescription: '12월의 보물 단어 [희망, 겨울, 선물, 용기, 별빛] 중 하나 이상이 들어간 책의 페이지를 찾아 손가락으로 가리키거나 밑줄을 치고 인증샷을 올려주세요!',
    missionKeywords: ['희망', '겨울', '선물', '용기', '별빛', '따뜻함', '꿈'],
    tips: [
      '미션 단어가 선명하게 보이도록 손가락이나 펜으로 가리켜보세요.',
      '그 문장이 들어간 앞뒤 맥락이나 내 생각을 함께 나눠보세요.',
      '보물 단어를 찾은 책의 쪽수(페이지)도 함께 적어주세요.',
    ],
    sampleImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    isOpen: false,
    unlockDate: '12월 1일',
  },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    grade: 1,
    classNum: 2,
    studentNum: 14,
    studentName: '김민준',
    bookTitle: '어린 왕자',
    bookAuthor: '생텍쥐페리',
    content: '‘여섯 살 적에 나는 원시림에 대한 책에서 기막힌 그림 하나를 보았다.’ 첫 문장을 읽자마자 보아뱀 그림 이야기에 푹 빠졌습니다! 어른들의 굳어버린 시선과 대비되는 순수한 마음이 잘 드러나서 너무 인상 깊어요.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    month: 9,
    challengeTitle: '첫문장 챌린지',
    likes: 18,
    comments: [
      {
        id: 'c1',
        author: '이지우',
        gradeClass: '1학년 2반',
        text: '민준아 사진 진짜 깔끔하게 잘 찍었다! 어린 왕자 나도 좋아해~',
        createdAt: '2026-09-02T10:15:00Z',
      },
      {
        id: 'c2',
        author: '박서연',
        gradeClass: '1학년 1반',
        text: '1학년 2반 달리기 1등으로 달려보자 🏃‍♂️ 우리 1반도 질 수 없지!',
        createdAt: '2026-09-02T11:00:00Z',
      },
    ],
    createdAt: '2026-09-01T09:30:00Z',
    syncedToGas: true,
    password: '1234',
  },
  {
    id: 'post-2',
    grade: 1,
    classNum: 1,
    studentNum: 5,
    studentName: '박서연',
    bookTitle: '모모',
    bookAuthor: '미하엘 엔데',
    content: '‘옛날 아주 옛날, 사람들이 아직 전혀 다른 언어로 말하던 시절에도…’ 시간을 훔치는 도둑들의 이야기가 흥미진진해요. 남의 이야기에 귀 기울여주는 모모처럼 저도 친구들의 이야기에 귀 기울이는 사람이 되고 싶어요.',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    month: 9,
    challengeTitle: '첫문장 챌린지',
    likes: 24,
    comments: [
      {
        id: 'c3',
        author: '최현우',
        gradeClass: '1학년 1반',
        text: '우와 모모 책 두껍던데 서연이 대단하다! 1반 파이팅!',
        createdAt: '2026-09-03T14:20:00Z',
      },
    ],
    createdAt: '2026-09-03T08:10:00Z',
    syncedToGas: true,
    password: '1234',
  },
  {
    id: 'post-3',
    grade: 2,
    classNum: 3,
    studentNum: 21,
    studentName: '정도윤',
    bookTitle: '불편한 편의점',
    bookAuthor: '김호연',
    content: '편의점 야외 테이블에서 옥수수 수염차 마시면서 책 표지 속 독고 아저씨 포즈 그대로 따라 해봤습니다! ㅋㅋㅋ 싱크로율 어떤가요? 마음이 따뜻해지는 소설이라 꼭 읽어보길 추천합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    month: 10,
    challengeTitle: '책표지 따라하기 챌린지',
    likes: 35,
    comments: [
      {
        id: 'c4',
        author: '강하은',
        gradeClass: '2학년 3반',
        text: '도윤이 포즈 미쳤다 ㅋㅋㅋ 3반 질 수 없지 우리도 올리자!',
        createdAt: '2026-10-05T16:00:00Z',
      },
      {
        id: 'c4-2',
        author: '이도현',
        gradeClass: '2학년 4반',
        text: '싱크로율 100% 인정합니다 ㅋㅋㅋ',
        createdAt: '2026-10-05T17:20:00Z',
      },
    ],
    createdAt: '2026-10-04T15:45:00Z',
    syncedToGas: true,
    password: '1234',
  },
  {
    id: 'post-4',
    grade: 2,
    classNum: 4,
    studentNum: 8,
    studentName: '윤서아',
    bookTitle: '아몬드',
    bookAuthor: '손원평',
    content: '주인공 윤재의 무표정한 옆모습 표지를 똑같이 흉내 내보았습니다. 감정을 느끼지 못하는 주인공의 마음을 책을 읽으며 이해해보는 중입니다. 타인의 감정에 공감하는 것이 얼마나 소중한지 깊이 깨달았어요.',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    month: 10,
    challengeTitle: '책표지 따라하기 챌린지',
    likes: 29,
    comments: [
      {
        id: 'c4-3',
        author: '김하늘',
        gradeClass: '2학년 4반',
        text: '서아야 표정 연기 진짜 대박이다! 아몬드 인생책이야',
        createdAt: '2026-10-08T15:10:00Z',
      },
    ],
    createdAt: '2026-10-08T13:20:00Z',
    syncedToGas: true,
    password: '1234',
  },
  {
    id: 'post-5',
    grade: 3,
    classNum: 2,
    studentNum: 11,
    studentName: '송유진',
    bookTitle: '달러구트 꿈 백화점',
    bookAuthor: '이미예',
    content: '학교 도서관 2층 햇살 드는 창가 코너 자리입니다. 은은한 햇빛 받으며 꿈 백화점 이야기를 읽으니 저도 단잠에 빠지는 기분이에요 ☀️💤 도서관에서 제일 아늑한 자리라 추천합니다!',
    imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80',
    month: 11,
    challengeTitle: '독서 명당 챌린지',
    likes: 42,
    comments: [
      {
        id: 'c5',
        author: '김민지',
        gradeClass: '3학년 2반',
        text: '유진아, 그 창가 자리 진짜 명당이지! 사진 분위기 좋다 📚',
        createdAt: '2026-11-03T11:30:00Z',
      },
    ],
    createdAt: '2026-11-02T10:00:00Z',
    syncedToGas: true,
    password: '1234',
  },
  {
    id: 'post-6',
    grade: 3,
    classNum: 1,
    studentNum: 3,
    studentName: '한재원',
    bookTitle: '나의 라임오렌지나무',
    bookAuthor: 'J.M. 바스콘셀로스',
    content: '12월 보물 단어 [희망]을 142쪽에서 발견했습니다! “제제에게 뽀르뚜까 아저씨는 커다란 희망이자 빛이었다.” 마음이 뭉클해지는 문장입니다. 올겨울 따뜻한 위로가 되어준 책이에요.',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    month: 12,
    challengeTitle: '보물찾기 챌린지',
    likes: 31,
    comments: [
      {
        id: 'c6',
        author: '임윤아',
        gradeClass: '3학년 1반',
        text: '나의 라임오렌지나무 진짜 명작이지 ㅠㅠ 재원이 단어 잘 찾았네!',
        createdAt: '2026-12-04T17:00:00Z',
      },
    ],
    createdAt: '2026-12-04T16:15:00Z',
    syncedToGas: true,
    password: '1234',
  },
];

export const INITIAL_STUDENTS_ROSTER: StudentRosterItem[] = [
  // 1학년 1반
  { id: 's-1-1-1', grade: 1, classNum: 1, studentNum: 1, name: '강동원' },
  { id: 's-1-1-2', grade: 1, classNum: 1, studentNum: 2, name: '김태리' },
  { id: 's-1-1-3', grade: 1, classNum: 1, studentNum: 3, name: '박보검' },
  { id: 's-1-1-4', grade: 1, classNum: 1, studentNum: 4, name: '송혜교' },
  { id: 's-1-1-5', grade: 1, classNum: 1, studentNum: 5, name: '박서연' },
  { id: 's-1-1-6', grade: 1, classNum: 1, studentNum: 6, name: '이도현' },
  // 1학년 2반
  { id: 's-1-2-1', grade: 1, classNum: 2, studentNum: 1, name: '고윤정' },
  { id: 's-1-2-2', grade: 1, classNum: 2, studentNum: 2, name: '김선호' },
  { id: 's-1-2-3', grade: 1, classNum: 2, studentNum: 3, name: '남주혁' },
  { id: 's-1-2-14', grade: 1, classNum: 2, studentNum: 14, name: '김민준' },
  { id: 's-1-2-5', grade: 1, classNum: 2, studentNum: 5, name: '신세경' },
  // 1학년 3반
  { id: 's-1-3-1', grade: 1, classNum: 3, studentNum: 1, name: '배수지' },
  { id: 's-1-3-2', grade: 1, classNum: 3, studentNum: 2, name: '서인국' },
  { id: 's-1-3-3', grade: 1, classNum: 3, studentNum: 3, name: '유승호' },
  { id: 's-1-3-4', grade: 1, classNum: 3, studentNum: 4, name: '이종석' },
  { id: 's-1-3-5', grade: 1, classNum: 3, studentNum: 5, name: '한소희' },
  // 1학년 4반
  { id: 's-1-4-1', grade: 1, classNum: 4, studentNum: 1, name: '안효섭' },
  { id: 's-1-4-2', grade: 1, classNum: 4, studentNum: 2, name: '이지은' },
  { id: 's-1-4-3', grade: 1, classNum: 4, studentNum: 3, name: '정해인' },
  { id: 's-1-4-4', grade: 1, classNum: 4, studentNum: 4, name: '임윤아' },
  // 2학년 1반
  { id: 's-2-1-1', grade: 2, classNum: 1, studentNum: 1, name: '공유' },
  { id: 's-2-1-2', grade: 2, classNum: 2, studentNum: 2, name: '김지원' },
  { id: 's-2-1-3', grade: 2, classNum: 1, studentNum: 3, name: '손석구' },
  { id: 's-2-1-4', grade: 2, classNum: 1, studentNum: 4, name: '박서준' },
  // 2학년 2반
  { id: 's-2-2-1', grade: 2, classNum: 2, studentNum: 1, name: '김다미' },
  { id: 's-2-2-2', grade: 2, classNum: 2, studentNum: 2, name: '류준열' },
  { id: 's-2-2-3', grade: 2, classNum: 2, studentNum: 3, name: '박은빈' },
  { id: 's-2-2-4', grade: 2, classNum: 2, studentNum: 4, name: '변우석' },
  // 2학년 3반
  { id: 's-2-3-1', grade: 2, classNum: 3, studentNum: 1, name: '김우빈' },
  { id: 's-2-3-2', grade: 2, classNum: 3, studentNum: 2, name: '문가영' },
  { id: 's-2-3-3', grade: 2, classNum: 3, studentNum: 3, name: '박형식' },
  { id: 's-2-3-21', grade: 2, classNum: 3, studentNum: 21, name: '정도윤' },
  // 2학년 4반
  { id: 's-2-4-1', grade: 2, classNum: 4, studentNum: 1, name: '차은우' },
  { id: 's-2-4-2', grade: 2, classNum: 4, studentNum: 2, name: '김하늘' },
  { id: 's-2-4-8', grade: 2, classNum: 4, studentNum: 8, name: '윤서아' },
  { id: 's-2-4-4', grade: 2, classNum: 4, studentNum: 4, name: '신혜선' },
  // 3학년 1반
  { id: 's-3-1-1', grade: 3, classNum: 1, studentNum: 1, name: '김수현' },
  { id: 's-3-1-2', grade: 3, classNum: 1, studentNum: 2, name: '문채원' },
  { id: 's-3-1-3', grade: 3, classNum: 1, studentNum: 3, name: '한재원' },
  { id: 's-3-1-4', grade: 3, classNum: 1, studentNum: 4, name: '이민호' },
  // 3학년 2반
  { id: 's-3-2-1', grade: 3, classNum: 2, studentNum: 1, name: '강하늘' },
  { id: 's-3-2-2', grade: 3, classNum: 2, studentNum: 2, name: '김유정' },
  { id: 's-3-2-11', grade: 3, classNum: 2, studentNum: 11, name: '송유진' },
  { id: 's-3-2-4', grade: 3, classNum: 2, studentNum: 4, name: '조인성' },
  // 3학년 3반
  { id: 's-3-3-1', grade: 3, classNum: 3, studentNum: 1, name: '전지현' },
  { id: 's-3-3-2', grade: 3, classNum: 3, studentNum: 2, name: '한지민' },
  { id: 's-3-3-3', grade: 3, classNum: 3, studentNum: 3, name: '김민지' },
  // 3학년 4반
  { id: 's-3-4-1', grade: 3, classNum: 4, studentNum: 1, name: '이병헌' },
  { id: 's-3-4-2', grade: 3, classNum: 4, studentNum: 2, name: '손예진' },
  { id: 's-3-4-3', grade: 3, classNum: 4, studentNum: 3, name: '현빈' },
];

export const SAMPLE_ROSTER: StudentRosterItem[] = INITIAL_STUDENTS_ROSTER;

export const CLASS_MASCOTS: Record<number, { name: string; emoji: string; color: string }> = {
  1: { name: '번개 치타', emoji: '🐆', color: 'text-amber-600 bg-amber-100 border-amber-300' },
  2: { name: '열정 토끼', emoji: '🐇', color: 'text-rose-600 bg-rose-100 border-rose-300' },
  3: { name: '비상 독수리', emoji: '🦅', color: 'text-blue-600 bg-blue-100 border-blue-300' },
  4: { name: '포효 사자', emoji: '🦁', color: 'text-orange-600 bg-orange-100 border-orange-300' },
};

export const GAS_SCRIPT_TEMPLATE = `/**
 * [창녕중학교 월별 독서 챌린지] Google Apps Script (GAS Web App)
 * 
 * [설치 및 배포 안내]
 * 1. 스프레드시트 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 스크립트 전체를 복사하여 붙여넣기
 * 3. [배포] > [새 배포] 클릭
 *    - 유형 선택: [웹 앱]
 *    - 설명: 독서 챌린지 연동
 *    - 다음 사용자로서 실행: '나'
 *    - 액세스 권한: '모든 사용자(Anyone)' (※ 학생 인증 및 다이렉트 통신을 위해 필수)
 * 4. [배포] 버튼을 누르고 권한 승인 완료 후 발급된 '웹 앱 URL'을 복사하여
 *    관리자 대시보드 [Google Apps Script Web App URL]에 저장하세요.
 */

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawData);
    var action = data.action || "submitPost";

    if (action === "submitPost") {
      return handleSinglePost(data);
    } else if (action === "syncPosts") {
      return handleBulkPosts(data);
    } else if (action === "ping") {
      return createJsonResponse({ status: "success", message: "GAS Web App 정상 연결됨" });
    }

    return createJsonResponse({ status: "unknown_action" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "창녕중학교 독서 챌린지 GAS Web App",
    time: new Date().toISOString()
  });
}

// 1. 단일 학생 인증글 + 사진 등록
function handleSinglePost(data) {
  var post = data.post || data;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = data.sheetName || "독서챌린지_제출기록";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  setupSheetHeaders(sheet);

  var photoUrl = processPhoto(post.imageUrl, post);
  var row = sheet.getLastRow() + 1;
  var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    nowStr,
    (post.month || "") + "월",
    post.challengeTitle || "",
    (post.grade || "") + "학년",
    (post.classNum || "") + "반",
    (post.studentNum || "") + "번",
    post.studentName || "",
    post.bookTitle || "",
    post.bookAuthor || "",
    post.content || "",
    photoUrl,
    photoUrl && photoUrl.indexOf("http") === 0 ? '=IMAGE("' + photoUrl + '")' : ""
  ]);

  // 행 높이 적절하게 조정
  sheet.setRowHeight(row, 45);

  return createJsonResponse({ status: "success", message: "시트 기록 완료", photoUrl: photoUrl });
}

// 2. 다수 인증글 일괄 동기화 (Bulk Sync)
function handleBulkPosts(data) {
  var posts = data.posts || [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = data.sheetName || "독서챌린지_제출기록";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  setupSheetHeaders(sheet);

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var photoUrl = processPhoto(post.imageUrl, post);
    var nowStr = post.createdAt ? Utilities.formatDate(new Date(post.createdAt), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss") : Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      nowStr,
      (post.month || "") + "월",
      post.challengeTitle || "",
      (post.grade || "") + "학년",
      (post.classNum || "") + "반",
      (post.studentNum || "") + "번",
      post.studentName || "",
      post.bookTitle || "",
      post.bookAuthor || "",
      post.content || "",
      photoUrl,
      photoUrl && photoUrl.indexOf("http") === 0 ? '=IMAGE("' + photoUrl + '")' : ""
    ]);
  }

  return createJsonResponse({ status: "success", count: posts.length });
}

// 시트 첫 행 헤더 구성
function setupSheetHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "제출일시", "챌린지월", "챌린지명", "학년", "반", "번호", "학생이름", "도서명", "저자", "글 내용 및 소감", "사진 링크", "사진 미리보기"
    ]);
    var headerRange = sheet.getRange("A1:L1");
    headerRange.setBackground("#FFD100").setFontColor("#000000").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(10, 260); // 글 내용 너비
    sheet.setColumnWidth(11, 200); // 사진 링크 너비
    sheet.setColumnWidth(12, 100); // 사진 미리보기 너비
  }
}

// 사진 처리: Base64 이미지인 경우 Google Drive에 저장 후 공개 링크 반환
function processPhoto(imageUrl, post) {
  if (!imageUrl) return "";

  // 이미 일반 웹 URL 링크인 경우
  if (imageUrl.indexOf("http://") === 0 || imageUrl.indexOf("https://") === 0) {
    return imageUrl;
  }

  // Base64 이미지 데이터인 경우
  if (imageUrl.indexOf("data:image") === 0) {
    try {
      var parts = imageUrl.split(",");
      var header = parts[0];
      var base64Data = parts[1];
      var mimeType = header.split(";")[0].split(":")[1] || "image/jpeg";
      var decoded = Utilities.base64Decode(base64Data);

      var folderName = "창녕중_독서챌린지_사진";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var fileName = "독서_" + (post.month || "챌린지") + "월_" + (post.grade || "1") + "-" + (post.classNum || "1") + "_" + (post.studentName || "학생") + "_" + new Date().getTime() + ".jpg";
      var blob = Utilities.newBlob(decoded, mimeType, fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // Google Drive 직링크 생성
      return "https://drive.google.com/uc?export=view&id=" + file.getId();
    } catch (e) {
      Logger.log("Drive 저장 예외: " + e.toString());
      return "[사진 업로드 완료 (크기: " + Math.round(imageUrl.length / 1024) + "KB)]";
    }
  }

  return "";
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;
