const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const axios = require('axios'); // 외부 API 요청을 위한 axios 추가

const app = express();
const port = 3001;

// 1. 원격 블랙리스트 URL 정의
const BLACKLIST_URL = 'https://raw.githubusercontent.com/lyb5382/phishguard-db-manager/main/blacklist.json';

// 2. 원격 블랙리스트를 메모리에 저장할 변수 (캐시)
let remoteBlacklist = [];

// 3. 원격 블랙리스트를 가져와 캐시를 업데이트하는 함수
async function fetchRemoteBlacklist() {
  try {
    console.log('Fetching remote blacklist...');
    const response = await axios.get(BLACKLIST_URL);

    // 데이터 형식이 { "urls": [{ "url": "..." }] } 일 것을 예상하고 url 값만 추출
    if (response.data && Array.isArray(response.data.urls)) {
      remoteBlacklist = response.data.urls.map(item => item.url);
      console.log(`✅ Successfully fetched ${remoteBlacklist.length} items from remote blacklist.`);
    } else {
      console.warn('⚠️ Remote blacklist format is not as expected or is empty.');
      remoteBlacklist = [];
    }
  } catch (error) {
    console.error('❌ Error fetching remote blacklist:', error.message);
  }
}

app.use(cors());
app.use(express.json());

// URL의 특징을 분석하는 자동 분석 함수 (기존 코드와 동일)
function analyzeUrlHeuristically(urlString) {
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipRegex.test(urlString)) {
    return null;
  }

  try {
    if (!urlString.startsWith('http')) {
      urlString = 'http://' + urlString;
    }
    const urlObject = new URL(urlString);
    const hostname = urlObject.hostname.replace('www.', '');
    const pathname = urlObject.pathname;

    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return "IP 주소를 직접 사용하는 의심스러운 주소 형식입니다.";
    }
    if (/\d/.test(hostname.split('.')[0]) && /[a-zA-Z]/.test(hostname)) {
      return "URL에 숫자와 문자가 섞여 있어 오타를 유도할 수 있습니다.";
    }
    if (hostname.split('.').length > 4) {
      return "URL의 구조가 비정상적으로 복잡합니다 (점이 너무 많음).";
    }
    const suspiciousTlds = ['.top', '.xyz', '.biz', '.club', '.work', '.link', '.info'];
    if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
      return "피싱에 자주 사용되는 의심스러운 도메인(.xyz, .top 등)을 사용합니다.";
    }
    const dangerousExtensions = ['.exe', '.zip', '.rar', '.scr', '.js', '.vbs'];
    if (dangerousExtensions.some(ext => pathname.toLowerCase().endsWith(ext))) {
      return "악성코드를 다운로드할 수 있는 위험한 파일(.exe, .zip 등)이 주소에 포함되어 있습니다.";
    }
    const loginKeywords = ['login', 'signin', 'pw', 'password', 'authenticate', 'verify'];
    if (urlObject.protocol === 'http:' && loginKeywords.some(key => urlString.includes(key))) {
      return "로그인 페이지임에도 불구하고 보안(HTTPS) 연결이 사용되지 않았습니다.";
    }
    if (urlString.length > 100) {
      return "진짜 주소를 숨기려는 의도가 의심되는 비정상적으로 긴 주소입니다.";
    }
    const phishingKeywords = ['secure', 'account', 'update', 'bank', 'service'];
    if (phishingKeywords.some(keyword => hostname.includes(keyword))) {
      return `'${hostname}'처럼 계정 정보를 요구하는 키워드가 포함되어 있습니다.`;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 4. API 로직 수정: 원격 블랙리스트 확인 기능 추가
app.post('/api/check', (req, res) => {
  const { type, value } = req.body;
  if (!value) {
    return res.status(400).json({ error: '값이 비어있습니다.' });
  }

  // 1. 수동 DB에서 먼저 확인
  db.get("SELECT * FROM items WHERE type = ? AND value = ?", [type, value], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      return res.json({ isBlacklisted: true, reason: '사용자가 직접 등록한 블랙리스트 항목입니다.' });
    }

    // 2. 원격 블랙리스트에서 확인 (새로 추가된 로직)
    if (remoteBlacklist.includes(value)) {
      return res.json({ isBlacklisted: true, reason: '외부 기관에 의해 등록된 피싱 사이트입니다.' });
    }

    // 3. DB에 없으면, 자동 분석
    const heuristicReason = analyzeUrlHeuristically(value);
    if (heuristicReason) {
      return res.json({ isBlacklisted: true, reason: heuristicReason });
    }

    // 4. 모든 검사를 통과하면 안전
    res.json({ isBlacklisted: false });
  });
});

// 블랙리스트 전체 목록 가져오기 (기존 코드와 동일)
app.get('/api/blacklist', (req, res) => {
  db.all("SELECT * FROM items ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// 블랙리스트에 새 항목 추가하기 (기존 코드와 동일)
app.post('/api/blacklist', (req, res) => {
  const { type, value } = req.body;
  if (!type || !value) {
    return res.status(400).json({ error: '타입(type)과 값(value)을 모두 입력해야 합니다.' });
  }

  db.run("INSERT INTO items (type, value) VALUES (?, ?)", [type, value], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, type, value });
  });
});

// 블랙리스트 항목 삭제하기 (기존 코드와 동일)
app.delete('/api/blacklist/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM items WHERE id = ?", id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '해당 ID를 찾을 수 없습니다.' });
    }
    res.status(200).json({ message: '성공적으로 삭제되었습니다.' });
  });
});


// 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);

  // 5. 서버 시작 시 즉시 원격 블랙리스트를 가져옴
  fetchRemoteBlacklist();

  // 6. 주기적으로 (예: 6시간마다) 목록을 자동 갱신
  setInterval(fetchRemoteBlacklist, 6 * 60 * 60 * 1000);
});