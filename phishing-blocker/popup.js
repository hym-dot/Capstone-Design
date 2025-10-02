const form = document.getElementById('add-form');
const input = document.getElementById('new-site-input');
const blacklistElem = document.getElementById('blacklist');

// 저장된 블랙리스트를 불러와 화면에 표시
function renderBlacklist() {
    chrome.storage.local.get(['blacklist'], (result) => {
        const list = result.blacklist || [];
        blacklistElem.innerHTML = '';
        list.forEach(site => {
            const li = document.createElement('li');
            li.textContent = site;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '삭제';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteSite(site);

            li.appendChild(deleteBtn);
            blacklistElem.appendChild(li);
        });
    });
}

// 사이트 추가
function addSite(site) {
    chrome.storage.local.get(['blacklist'], (result) => {
        const list = result.blacklist || [];
        if (!list.includes(site)) {
            list.push(site);
            chrome.storage.local.set({ blacklist: list }, renderBlacklist);
        }
    });
}

// 사이트 삭제
function deleteSite(site) {
    chrome.storage.local.get(['blacklist'], (result) => {
        let list = result.blacklist || [];
        list = list.filter(item => item !== site);
        chrome.storage.local.set({ blacklist: list }, renderBlacklist);
    });
}

// 폼 제출 이벤트 처리
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newSite = new URL(input.value).hostname.replace('www.', '');
    if (newSite) {
        addSite(newSite);
        input.value = '';
    }
});

// 팝업이 열릴 때마다 목록을 새로고침
renderBlacklist();