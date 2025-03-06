// background.js

// 초기 설치 시 기본 설정
chrome.runtime.onInstalled.addListener(() => {
    // 초기 설정 값 (API 키 포함)
    const defaultSettings = {
        translationApiKey: '', // Microsoft Translator API 키
        autoTranslatePrompt: true
    };

    chrome.storage.local.set(defaultSettings, () => {
        console.log('초기 설정 완료');
    });
});

// 저장된 API 키 확인 및 로깅 함수
function logStoredApiKey() {
    chrome.storage.local.get(['translationApiKey'], (result) => {
        console.log('현재 저장된 API 키:', result.translationApiKey || '없음');
    });
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // API 키 저장 요청 처리
    if (request.action === 'setApiKey') {
        chrome.storage.local.set({ 
            translationApiKey: request.apiKey 
        }, () => {
            console.log('API 키 저장됨:', request.apiKey);
            
            // 저장 직후 확인
            chrome.storage.local.get(['translationApiKey'], (result) => {
                console.log('저장 후 확인:', result.translationApiKey);
                
                // 저장 성공 여부 확인
                if (result.translationApiKey === request.apiKey) {
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: '저장 실패' });
                }
            });
        });
        
        // 비동기 응답을 위해 true 반환
        return true;
    }

    // API 키 조회 요청 처리
    if (request.action === 'getApiKey') {
        chrome.storage.local.get(['translationApiKey'], (result) => {
            sendResponse({ 
                apiKey: result.translationApiKey || '' 
            });
        });
        
        // 비동기 응답을 위해 true 반환
        return true;
    }
});

// 디버깅용 이벤트 리스너 (필요시 제거 가능)
chrome.runtime.onInstalled.addListener(logStoredApiKey);