# ✈ AI 여행 플래너 - 여행 플래너

React + Firebase로 만든 한국 여행 일정 계획 웹사이트입니다.

## ✨ 주요 기능

- 🗺️ **3단계 여행 계획**: 지역 → 기간 → 테마 순서로 직관적인 여행 계획
- 🔐 **회원 인증**: 이메일/비밀번호 + 구글 소셜 로그인
- 💾 **여행 일정 저장**: Firebase Firestore에 개인별 여행 데이터 저장
- 📱 **완벽 반응형**: 데스크톱, 태블릿, 모바일 모두 지원
- 🎨 **모던한 디자인**: 깔끔한 UI/UX와 부드러운 애니메이션

## 🛠️ 기술 스택

- **프론트엔드**: React 18, React Router v6, Vite
- **백엔드**: Firebase (Authentication, Firestore)
- **스타일링**: Pure CSS with CSS Variables

## 📦 설치 및 실행

### 1. 패키지 설치
```bash
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성
2. **Authentication** 활성화
   - 이메일/비밀번호 로그인 활성화
   - Google 로그인 활성화 (선택사항)
3. **Firestore Database** 생성 (테스트 모드로 시작)
4. 프로젝트 설정 → 웹 앱 추가 → 설정 정보 복사

### 3. Firebase 설정 적용

`src/firebase/config.js` 파일을 열어서 본인의 Firebase 설정으로 교체:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Firestore 보안 규칙 설정

Firebase 콘솔 → Firestore Database → 규칙 탭에서 아래 규칙 적용:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /trips/{tripId} {
      // 본인이 작성한 여행만 읽기/수정/삭제 가능
      allow read, update, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      // 로그인한 사용자만 새 여행 작성 가능
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### 6. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
travel-planner/
├── public/
├── src/
│   ├── components/        # 재사용 컴포넌트
│   │   ├── Header.jsx
│   │   └── Header.css
│   ├── context/           # React Context
│   │   └── AuthContext.jsx
│   ├── firebase/          # Firebase 설정
│   │   └── config.js
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── HomePage.jsx       # 랜딩 페이지
│   │   ├── LoginPage.jsx      # 로그인
│   │   ├── SignupPage.jsx     # 회원가입
│   │   ├── PlannerPage.jsx    # 3단계 여행 만들기
│   │   ├── MyTripsPage.jsx    # 내 여행 목록
│   │   └── TripDetailPage.jsx # 여행 상세 보기
│   ├── styles/
│   │   └── global.css     # 전역 스타일 (CSS 변수)
│   ├── App.jsx            # 라우팅 설정
│   └── main.jsx           # 진입점
├── index.html
├── package.json
└── vite.config.js
```

## 🎯 페이지별 흐름

1. **홈 (`/`)** - 서비스 소개 및 시작하기 버튼
2. **회원가입 (`/signup`)** - 이메일/구글로 가입
3. **로그인 (`/login`)** - 이메일/구글로 로그인
4. **여행 만들기 (`/planner`)** - 3단계 진행:
   - Step 1: 지역 선택 (전국 17개 시도)
   - Step 2: 여행 기간 (당일/1박2일/2박3일)
   - Step 3: 테마 선택 (2개 이상, 최대 4개)
5. **내 여행 (`/my-trips`)** - 저장된 여행 목록
6. **여행 상세 (`/trip/:id`)** - 선택한 여행의 상세 정보

## 💡 데이터 구조 (Firestore)

`trips` 컬렉션에 저장되는 문서 구조:
```javascript
{
  userId: "사용자 UID",
  title: "여행 제목",
  regions: ["부산", "경남"],
  duration: "2n3d",
  durationLabel: "2박 3일",
  themes: ["mountain", "cafe"],
  themeLabels: ["산", "카페"],
  createdAt: Timestamp
}
```

## 🎨 커스터마이징

`src/styles/global.css`의 CSS 변수를 수정해서 색상 테마 변경 가능:
```css
:root {
  --color-primary: #1a1a1a;
  --color-accent: #00C4A7;  /* 메인 액센트 색상 */
  --color-secondary: #5B8CFF;
  /* ... */
}
```

## 📝 라이선스

자유롭게 사용하세요!
