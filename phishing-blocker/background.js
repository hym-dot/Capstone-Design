// ... (checkManualBlacklist, checkHeuristics 함수는 그대로 둡니다) ...

// 메인 이벤트: 사용자가 탭을 업데이트할 때마다 실행
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 탭이 로딩을 시작할 때 '검정 화면' 표시
    if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
        chrome.tabs.sendMessage(tabId, { status: 'checking' });
    }

    // 탭 로딩이 완료되었을 때 최종 판단
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        const currentUrl = new URL(tab.url).hostname.replace('www.', '');
        let warningReason = null;
        let isSafe = true;

        checkManualBlacklist(currentUrl, (isBlacklisted, reason) => {
            if (isBlacklisted) {
                warningReason = reason;
                isSafe = false;
            } else {
                warningReason = checkHeuristics(tab.url);
                if (warningReason) {
                    isSafe = false;
                }
            }

            if (!isSafe) {
                // 위험 사이트: 빨간 화면 표시 및 알림
                chrome.tabs.sendMessage(tabId, { status: 'danger' });
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon128.png',
                    title: '🚨 피싱 사이트 의심 경고!',
                    message: `이유: ${warningReason}`,
                    priority: 2
                });
            } else {
                // 정상 사이트: 초록 화면 표시
                chrome.tabs.sendMessage(tabId, { status: 'safe' });
            }
        });
    }
});