// background.js로부터 메시지를 수신하여 경고 팝업을 띄웁니다.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "displayWarning" && request.isPhishing) {
        displayWarningPopup(request.reason);
        sendResponse({ status: "warning displayed" });
    }
    // 페이지가 안전하다는 메시지를 받으면 팝업을 제거합니다.
    if (request.action === "removeWarning" && !request.isPhishing) {
        removeWarningPopup();
        sendResponse({ status: "warning removed" });
    }
});

function displayWarningPopup(reason) {
    // 이미 팝업이 있다면 다시 생성하지 않습니다.
    if (document.getElementById('phishing-warning-popup')) {
        // 이미 있는 팝업의 내용을 업데이트할 수 있습니다.
        const reasonElement = document.getElementById('phishing-warning-reason');
        if (reasonElement) {
            reasonElement.textContent = reason;
        }
        return;
    }

    const popupOverlay = document.createElement('div');
    popupOverlay.id = 'phishing-warning-popup';
    popupOverlay.style.position = 'fixed';
    popupOverlay.style.top = '0';
    popupOverlay.style.left = '0';
    popupOverlay.style.width = '100vw';
    popupOverlay.style.height = '100vh';
    popupOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popupOverlay.style.zIndex = '999999'; // 모든 요소 위에 표시
    popupOverlay.style.display = 'flex';
    popupOverlay.style.justifyContent = 'center';
    popupOverlay.style.alignItems = 'center';
    popupOverlay.style.fontFamily = 'sans-serif';

    const popupContent = document.createElement('div');
    popupContent.style.backgroundColor = '#fff';
    popupContent.style.padding = '40px';
    popupContent.style.borderRadius = '10px';
    popupContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    popupContent.style.textAlign = 'center';
    popupContent.style.maxWidth = '500px';
    popupContent.style.color = '#333';

    const warningIcon = document.createElement('img');
    warningIcon.src = chrome.runtime.getURL('images/icon48.png'); // 확장 프로그램의 아이콘 사용
    warningIcon.style.width = '60px';
    warningIcon.style.height = '60px';
    warningIcon.style.marginBottom = '20px';

    const title = document.createElement('h1');
    title.style.color = '#dc3545';
    title.style.fontSize = '2.2em';
    title.style.marginBottom = '15px';
    title.textContent = '🚨 위험! 피싱 사이트 감지';

    const mainMessage = document.createElement('p');
    mainMessage.style.fontSize = '1.1em';
    mainMessage.style.lineHeight = '1.6';
    mainMessage.style.marginBottom = '25px';
    mainMessage.textContent = '현재 접속을 시도한 사이트는 사용자의 개인정보를 탈취하기 위한 피싱 사이트로 의심되어 차단되었습니다.';

    const reasonBox = document.createElement('div');
    reasonBox.style.backgroundColor = '#f8f9fa';
    reasonBox.style.border = '1px solid #dee2e6';
    reasonBox.style.borderRadius = '6px';
    reasonBox.style.padding = '15px';
    reasonBox.style.marginBottom = '30px';
    reasonBox.style.textAlign = 'left';

    const reasonTitle = document.createElement('strong');
    reasonTitle.style.display = 'block';
    reasonTitle.style.fontSize = '0.9em';
    reasonTitle.style.color = '#555';
    reasonTitle.style.marginBottom = '5px';
    reasonTitle.textContent = '탐지된 이유:';

    const reasonDetail = document.createElement('p');
    reasonDetail.id = 'phishing-warning-reason';
    reasonDetail.style.fontSize = '1em';
    reasonDetail.style.color = '#dc3545';
    reasonDetail.style.margin = '0';
    reasonDetail.style.fontWeight = 'bold';
    reasonDetail.textContent = reason; // 백그라운드에서 받은 이유

    reasonBox.appendChild(reasonTitle);
    reasonBox.appendChild(reasonDetail);

    const closeButton = document.createElement('button');
    closeButton.style.backgroundColor = '#dc3545';
    closeButton.style.color = 'white';
    closeButton.style.padding = '12px 30px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.fontSize = '1.1em';
    closeButton.style.cursor = 'pointer';
    closeButton.style.transition = 'background-color 0.2s';
    closeButton.textContent = '확인하고 닫기';
    closeButton.addEventListener('mouseover', () => closeButton.style.backgroundColor = '#c82333');
    closeButton.addEventListener('mouseout', () => closeButton.style.backgroundColor = '#dc3545');
    closeButton.addEventListener('click', () => {
        // 팝업을 닫고, 백그라운드 스크립트에 닫았음을 알릴 수 있습니다.
        removeWarningPopup();
        chrome.runtime.sendMessage({ action: "warningClosed" });
        // 사용자가 확인을 누르면 현재 탭을 닫거나 안전한 페이지로 리다이렉트할 수 있습니다.
        // 예를 들어, 탭 닫기: window.close(); (크롬 정책상 모든 탭을 닫을 수는 없습니다.)
        // 또는 안전한 페이지로 이동: window.location.href = "https://www.google.com";
    });

    popupContent.appendChild(warningIcon);
    popupContent.appendChild(title);
    popupContent.appendChild(mainMessage);
    popupContent.appendChild(reasonBox);
    popupContent.appendChild(closeButton);
    popupOverlay.appendChild(popupContent);

    document.body.appendChild(popupOverlay);

    // 경고 팝업이 뜰 때 스크롤을 막고, 페이지 콘텐츠를 비활성화
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden'; // html 태그 스크롤도 막음

    // 기타 페이지 상호작용 비활성화 (선택 사항)
    // 문서의 모든 요소에 pointer-events: none; 을 적용하여 클릭 방지
    // 이 방법은 복잡할 수 있으므로, 단순 팝업 오버레이로 충분할 수 있습니다.
}

function removeWarningPopup() {
    const popupOverlay = document.getElementById('phishing-warning-popup');
    if (popupOverlay) {
        popupOverlay.remove();
        document.body.style.overflow = ''; // 스크롤 복원
        document.documentElement.style.overflow = ''; // 스크롤 복원
    }
}