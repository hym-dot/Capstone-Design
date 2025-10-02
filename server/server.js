const express = require('express');
const cors = require('cors');
const db = require('./database.js');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// URL의 특징을 분석하는 자동 분석 함수
function analyzeUrlHeuristically(urlString) {
  // IP 주소 형식인지 확인하는 정규식
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  // 만약 입력값이 순수 IP 주소 형태이면, URL 분석을 하지 않고 통과시킴
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

// API 로직: '타입'에 상관없이 '값'을 분석
app.post('/api/check', (req, res) => {
  const { type, value } = req.body;

  // 1. 수동 DB에서 먼저 확인 (타입과 값이 일치하는 경우)
  db.get("SELECT * FROM items WHERE type = ? AND value = ?", [type, value], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      return res.json({ isBlacklisted: true, reason: '사용자가 직접 등록한 블랙리스트 항목입니다.' });
    }

    // 2. DB에 없으면, '타입'에 상관없이 '값' 자체를 자동 분석
    const heuristicReason = analyzeUrlHeuristically(value);
    if (heuristicReason) {
      // 자동 분석에서 걸리면 위험하다고 응답
      return res.json({ isBlacklisted: true, reason: heuristicReason });
    }

    // 3. 모든 검사를 통과하면 안전하다고 응답
    res.json({ isBlacklisted: false });
  });
});

// 나머지 API들
app.get('/api/blacklist', (req, res) => {
    db.all("SELECT * FROM items ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.post('/api/blacklist', (req, res) => {
    db.run("INSERT INTO items (type, value) VALUES (?, ?)", [req.body.type, req.body