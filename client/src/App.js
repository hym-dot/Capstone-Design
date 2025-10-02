import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [type, setType] = useState('ip');
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [blacklist, setBlacklist] = useState([]);
  const [newType, setNewType] = useState('ip');
  const [newValue, setNewValue] = useState('');
  const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
  const [popupMessage, setPopupMessage] = useState(''); // 팝업 메시지

  // 실시간 자동 검사 로직
  useEffect(() => {
    if (!value.trim()) {
      setResult(null);
      setShowPopup(false); // 입력값이 없으면 팝업 닫기
      return;
    }

    const debounceTimer = setTimeout(() => {
      axios.post('/api/check', { type, value })
        .then(response => {
          setResult(response.data);
          if (response.data.isBlacklisted) {
            setPopupMessage(response.data.reason); // 팝업 메시지 설정
            setShowPopup(true); // 팝업 표시
          } else {
            setShowPopup(false); // 안전하면 팝업 닫기
          }
        })
        .catch(error => {
          console.error("실시간 확인 중 오류:", error);
          setShowPopup(false); // 오류 발생 시 팝업 닫기
        });
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [value, type]);

  // 배경색 변경 로직
  useEffect(() => {
    const body = document.body;
    body.classList.remove('status-initial', 'status-safe', 'status-danger');
    if (result === null) {
      body.classList.add('status-initial');
    } else if (result.isBlacklisted) {
      body.classList.add('status-danger');
    } else {
      body.classList.add('status-safe');
    }
  }, [result]);

  const fetchBlacklist = async () => { try { const response = await axios.get('/api/blacklist'); setBlacklist(response.data.data); } catch (error) { console.error("블랙리스트 로딩 실패:", error); } };
  useEffect(() => { fetchBlacklist(); }, []);
  const handleAddItem = async (e) => { e.preventDefault(); if (!newValue) { alert('추가할 값을 입력해주세요.'); return; } try { await axios.post('/api/blacklist', { type: newType, value: newValue }); setNewValue(''); fetchBlacklist(); } catch (error) { alert('추가 실패: ' + (error.response?.data?.error || '서버 오류')); } };
  const handleDeleteItem = async (id) => { if (window.confirm('정말로 삭제하시겠습니까?')) { try { await axios.delete(`/api/blacklist/${id}`); fetchBlacklist(); } catch (error) { alert('삭제 중 오류가 발생했습니다.'); } } };

  const closePopup = () => {
    setShowPopup(false);
    setResult(null);
    setValue('');
  };

  return (
    <div className="container">
      <h1>🚨 블랙리스트 확인 시스템</h1>
      <div className="checker-form">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="ip">IP 주소</option>
          <option value="username">사이트 주소</option>
        </select>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="판단할 주소를 입력하세요 (자동 감지)"
        />
      </div>

      {result !== null && !showPopup && (
        <div className={`result-box ${result.isBlacklisted ? 'blacklisted' : 'clean'}`}>
          {result.isBlacklisted
            ? `🔴 위험: ${result.reason}`
            : `🟢 정상 항목입니다.`}
        </div>
      )}

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <span className="close-btn" onClick={closePopup}>&times;</span>
            </div>
            <div className="popup-body">
              <img src="https://em-content.zobj.net/source/microsoft-teams/337/warning_26a0-fe0f.png" alt="경고" className="warning-icon" />
              <h2>위험! 피싱성 사이트 감지</h2>
              <p className="popup-main-warning">
                현재 접속을 시도한 사이트는 사용자의 개인정보를 탈취하기 위한 피싱 사이트로 의심되어 차단되었습니다.
              </p>
              <div className="popup-reason-box">
                <strong>탐지된 이유:</strong>
                <p className="popup-reason-detail">{popupMessage}</p>
              </div>
            </div>
            <div className="popup-footer">
              <button className="popup-button" onClick={closePopup}>확인</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <h2>블랙리스트 관리</h2>
        <form onSubmit={handleAddItem} className="add-form">
          <select value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="ip">IP 주소</option>
            <option value="username">사이트 주소</option>
          </select>
          <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="블랙리스트에 추가할 값" />
          <button type="submit">추가</button>
        </form>
      </div>

      <div className="blacklist-table">
        <h2>블랙리스트 전체 목록</h2>
        <table>
          <thead><tr><th>타입</th><th>값</th><th>등록일시</th><th>작업</th></tr></thead>
          <tbody>{blacklist.map(item => (<tr key={item.id}><td>{item.type}</td><td>{item.value}</td><td>{item.createdAt}</td><td><button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>삭제</button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

export default App;