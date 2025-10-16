// background.js 내에서 탭 업데이트 감지 로직
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // URL 변경이 완료되었을 때만 검사
    if (changeInfo.status === 'complete' && tab.url) {
        // HTTP/HTTPS URL만 처리
        if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
            console.log(`Checking URL: ${tab.url}`);

            // TODO: 서버 API를 호출하여 해당 URL이 블랙리스트에 있는지 확인합니다.
            // 이 부분은 기존 서버 연동 로직을 사용하시면 됩니다.
            // 예시:
            try {
                const response = await fetch('http://localhost:3000/api/check', { // 서버 주소를 맞게 변경하세요
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type: 'url', value: tab.url }) // 'url' 타입으로 보낼 수 있도록 서버 API 수정 필요
                });
                const data = await response.json();

                if (data.isBlacklisted) {
                    console.warn(`Phishing site detected: ${tab.url} - Reason: ${data.reason}`);
                    // content.js에 메시지를 보내 경고 팝업을 띄웁니다.
                    chrome.tabs.sendMessage(tabId, {
                        action: "displayWarning",
                        isPhishing: true,
                        reason: data.reason || "알 수 없는 피싱 사이트"
                    }).catch(error => console.error("Error sending message to content.js:", error));

                    // 탭 아이콘 변경 (선택 사항)
                    chrome.action.setIcon({ tabId: tabId, path: "images/icon48_red.png" }); // 위험 아이콘 필요
                } else {
                    console.log(`Safe site: ${tab.url}`);
                    // 팝업이 떠있다면 제거하도록 메시지 전송 (safe로 돌아왔을 경우)
                    chrome.tabs.sendMessage(tabId, {
                        action: "removeWarning",
                        isPhishing: false
                    }).catch(error => console.error("Error sending message to content.js to remove warning:", error));

                    // 탭 아이콘 원래대로 복원 (선택 사항)
                    chrome.action.setIcon({ tabId: tabId, path: "images/icon48.png" });
                }
            } catch (error) {
                console.error("Error checking URL with backend:", error);
                // 오류 발생 시 팝업 제거
                chrome.tabs.sendMessage(tabId, {
                    action: "removeWarning",
                    isPhishing: false
                }).catch(error => console.error("Error sending message to content.js to remove warning on error:", error));
            }
        }
    }
});

// 팝업이 닫혔다는 메시지를 받으면, 해당 탭의 상태를 처리 (선택 사항)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "warningClosed") {
        console.log("Warning popup was closed by user.");
        // 여기서 탭을 닫거나, 다른 안전한 페이지로 리다이렉트하는 등의 추가 동작을 할 수 있습니다.
        // 예를 들어, 탭 닫기:
        // if (sender.tab && sender.tab.id) {
        //    chrome.tabs.remove(sender.tab.id);
        // }
    }
});

// 팝업 스크립트 (popup.js)에서 현재 탭의 URL을 확인하는 요청을 보낼 때
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkCurrentTab") {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const currentUrl = tabs[0].url;
                if (currentUrl.startsWith('http://') || currentUrl.startsWith('https://')) {
                    try {
                        const response = await fetch('http://localhost:3000/api/check', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'url', value: currentUrl })
                        });
                        const data = await response.json();
                        sendResponse({ isBlacklisted: data.isBlacklisted, reason: data.reason });
                    } catch (error) {
                        console.error("Error checking URL from popup:", error);
                        sendResponse({ isBlacklisted: false, reason: "URL 검사 중 오류 발생" });
                    }
                } else {
                    sendResponse({ isBlacklisted: false, reason: "유효하지 않은 URL 형식" });
                }
            } else {
                sendResponse({ isBlacklisted: false, reason: "현재 탭 URL을 가져올 수 없습니다." });
            }
        });
        return true; // 비동기 응답을 위해 true 반환
    }
});