# 🚀 배포 가이드

## 📋 목차
1. [서버 배포 (Cloudtype)](#1-서버-배포-cloudtype)
2. [클라이언트 배포 (Vercel)](#2-클라이언트-배포-vercel)
3. [Notion에 임베드하기](#3-notion에-임베드하기)

---

## 1. 서버 배포 (Cloudtype)

### 단계별 가이드:

1. **Cloudtype 가입**
   - [cloudtype.io](https://cloudtype.io) 접속
   - GitHub 계정으로 로그인
   - 무료 크레딧으로 시작 가능! ✨

2. **새 프로젝트 생성**
   - "새 프로젝트" 버튼 클릭
   - GitHub 저장소 연결 (Capstone-Design)
   - 저장소 선택 후 "다음" 클릭

3. **서비스 설정**
   ```
   프로젝트 이름: phishing-blocker-server
   브랜치: main
   루트 디렉토리: server
   빌드 명령어: npm install
   실행 명령어: npm start
   포트: 3001
   ```

4. **환경 변수 설정**
   - "환경 변수" 탭에서 추가:
   ```
   NODE_ENV=production
   CLIENT_URL=https://your-vercel-url.vercel.app
   ```
   (CLIENT_URL은 2단계 완료 후 입력)

5. **배포 완료**
   - "배포" 버튼 클릭
   - 배포 완료까지 약 2-3분 소요
   - 배포 후 URL 복사 (예: `https://port-3001-phishing-blocker.app.cloudtype.app`)

---

## 2. 클라이언트 배포 (Vercel)

### 단계별 가이드:

1. **Vercel 가입**
   - [vercel.com](https://vercel.com) 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택 (Capstone-Design)
   - "Import" 클릭

3. **프로젝트 설정**
   ```
   Framework Preset: Create React App
   Root Directory: client
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **환경 변수 설정** (중요!)
   - "Environment Variables" 섹션에서 추가:
   ```
   Name: REACT_APP_API_URL
   Value: https://port-3001-phishing-blocker.app.cloudtype.app
   ```
   (위 Value는 1단계에서 받은 Cloudtype 서버 URL을 입력)

5. **배포 완료**
   - "Deploy" 클릭
   - 배포 완료까지 약 1-2분 소요
   - 배포 후 URL 복사 (예: `https://phishing-blocker.vercel.app`)

---

## 3. Notion에 임베드하기

### 방법 1: 임베드 블록 사용 (추천)

1. **Notion 페이지 열기**
   - 임베드하고 싶은 Notion 페이지 열기

2. **임베드 블록 추가**
   - `/embed` 입력하거나
   - 페이지에서 `/` 입력 후 "Embed" 선택

3. **URL 입력**
   - 2단계에서 받은 Vercel URL 입력
   - 예: `https://phishing-blocker.vercel.app`

4. **크기 조정**
   - 임베드 블록을 드래그하여 크기 조정
   - 전체 화면으로 보려면 임베드 블록을 페이지 전체 너비로 확장

### 방법 2: 링크 미리보기

1. **링크 붙여넣기**
   - Notion 페이지에 Vercel URL 붙여넣기
   
2. **미리보기 생성**
   - "Create bookmark" 또는 "Create embed" 선택
   - "Create embed" 선택 시 페이지 내에서 바로 볼 수 있음

### 방법 3: 전체 페이지 임베드

```
1. Notion 페이지에서 "/embed" 입력
2. Vercel URL 입력
3. 임베드 블록을 전체 너비로 확장
4. 높이를 충분히 늘려서 스크롤 없이 볼 수 있도록 조정
```

---

## 📱 배포 후 확인사항

### 서버 상태 확인
```
https://your-server-url.onrender.com/api/blacklist
```
위 URL에 접속하여 JSON 데이터가 반환되는지 확인

### 클라이언트 상태 확인
- Vercel URL에 접속
- 주소를 입력하여 서버와 통신이 되는지 확인

---

## 🔧 문제 해결

### CORS 에러 발생 시
서버의 `server.js`에서 CORS 설정 확인:
```javascript
app.use(cors({
  origin: 'https://your-vercel-url.vercel.app',
  credentials: true
}));
```

### Cloudtype 무료 플랜
- 월 $5 무료 크레딧 제공
- 한국 서버로 빠른 응답 속도
- GitHub 푸시 시 자동 재배포
- Sleep 모드 없음 (항상 활성)

### Vercel 무료 플랜
- 무제한 대역폭
- 100GB 대역폭/월
- 자동 HTTPS 제공

---

## 💡 추가 팁

### 커스텀 도메인 연결
- Vercel/Cloudtype 모두 커스텀 도메인 연결 가능
- DNS 설정을 통해 본인의 도메인 사용 가능

### 자동 배포 설정
- GitHub에 push하면 자동으로 배포됨
- main 브랜치에 merge 시 자동 업데이트

---

## 📞 지원

문제가 발생하면:
1. Cloudtype 로그 확인: 프로젝트 → 로그
2. Vercel 로그 확인: Dashboard → Deployments → Logs
3. 브라우저 개발자 도구 콘솔 확인 (F12)
