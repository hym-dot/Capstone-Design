# 배포 빠른 시작 가이드

## 🎯 간단 요약

### 1️⃣ 서버 배포 (Cloudtype)
1. [cloudtype.io](https://cloudtype.io) → 로그인
2. "새 프로젝트" 클릭
3. GitHub 저장소 연결
4. 루트 디렉토리: `server` 입력
5. 빌드: `npm install`, 실행: `npm start`, 포트: `3001`
6. 배포 → URL 복사! 📋

### 2️⃣ 클라이언트 배포 (Vercel)
1. [vercel.com](https://vercel.com) → 로그인
2. "New Project" → GitHub 저장소 선택
3. Root Directory: `client` 입력
4. **환경 변수 추가:**
   - Name: `REACT_APP_API_URL`
   - Value: `서버 URL` (1단계에서 복사한 URL)
5. Deploy → URL 복사! 📋

### 3️⃣ Notion에 추가
1. Notion 페이지 열기
2. `/embed` 입력
3. Vercel URL 붙여넣기
4. 완료! 🎉

---

## 📱 Notion 활용 팁

### 바로가기 버튼 만들기
```
1. Notion에 버튼 블록 추가 (/button)
2. 버튼 이름: "🚨 피싱 탐지 시스템 열기"
3. 동작: "Open link"
4. URL: Vercel 배포 URL 입력
```

### 임베드로 페이지에 직접 표시
```
1. /embed 입력
2. Vercel URL 붙여넣기
3. 임베드 블록 크기 조정 (전체 너비 추천)
4. 높이 조정 (약 800px 이상 추천)
```

---

## 자세한 내용은 DEPLOYMENT.md 참고!
