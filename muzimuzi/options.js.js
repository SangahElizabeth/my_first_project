// options.js
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // 저장된 API 키 불러오기
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        apiKeyInput.value = response.apiKey || '';
    });

    // 저장 버튼 클릭 이벤트
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();

        // API 키 유효성 검사 (기본적인 형식 확인)
        if (!apiKey) {
            showStatus('API 키를 입력해주세요.', 'error');
            return;
        }

        // API 키 저장 메시지 전송
        chrome.runtime.sendMessage({ 
            action: 'setApiKey', 
            apiKey: apiKey 
        }, (response) => {
            console.log('저장 응답:', response);
            
            if (response && response.success) {
                // 성공 메시지 표시
                showStatus('API 키가 성공적으로 저장되었습니다.', 'success');
                
                // 1초 후 실제 저장 확인
                setTimeout(() => {
                    chrome.runtime.sendMessage({ action: 'getApiKey' }, (checkResponse) => {
                        console.log('저장 후 확인:', checkResponse.apiKey);
                        if (checkResponse.apiKey !== apiKey) {
                            showStatus('API 키 저장에 문제가 있습니다.', 'error');
                        }
                    });
                }, 1000);
            } else {
                // 실패 메시지 표시
                showStatus('API 키 저장에 실패했습니다.', 'error');
            }
        });
    });

    // 상태 메시지 표시 함수
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
        
        // 3초 후 상태 메시지 제거
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3000);
    }
});