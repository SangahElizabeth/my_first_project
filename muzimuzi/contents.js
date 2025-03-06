// 기본 유틸리티 함수
const Utils = {
    createPopup(title, content) {
        const popup = document.createElement('div');
        popup.className = 'muzimuzi-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h3>${title}</h3>
                <button class="close-btn">×</button>
            </div>
            <div class="popup-body">${content}</div>
        `;
        
        const closeBtn = popup.querySelector('.close-btn');
        closeBtn.onclick = () => popup.remove();
        
        document.body.appendChild(popup);
        return popup;
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    },

    // 크롬 스토리지에서 API 키 가져오기
    async getApiKey() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['translationApiKey'], (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result.translationApiKey || '');
                }
            });
        });
    }
};

// 번역 모듈
const TranslationModule = {
    async translate(text) {
        try {
            // API 키 가져오기
            const apiKey = await Utils.getApiKey();
            if (!apiKey) {
                throw new Error('Microsoft Translator API 키가 설정되지 않았습니다.');
            }

            const endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=ko';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([{ 'text': text }])
            });

            if (!response.ok) {
                throw new Error('번역 API 요청 실패');
            }

            const data = await response.json();
            return data[0].translations[0].text;
        } catch (error) {
            console.error('번역 오류:', error);
            return '번역에 실패했습니다: ' + error.message;
        }
    }
};

// 메인 기능
function setupTranslation() {
    // Gmail 메일 본문 찾기
    function findMailBody() {
        const selectors = [
            '.a3s.aiL', 
            '.ii.gt.a3s.aiL', 
            'div[data-message-id] .a3s'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.innerText.trim().length > 50) {
                return element;
            }
        }
        return null;
    }

    // 번역 프롬프트 생성
    function createTranslationPrompt() {
        const mailBody = findMailBody();
        if (!mailBody) return;

        const prompt = Utils.createPopup(
            '번역', 
            `
            <p>이 메일을 번역하시겠습니까?</p>
            <div>
                <button id="translateYes">예</button>
                <button id="translateNo">아니오</button>
            </div>
            `
        );

        prompt.querySelector('#translateYes').onclick = async () => {
            prompt.remove();
            
            // 로딩 표시
            const loadingPopup = Utils.createPopup('번역 중', '번역 진행 중입니다...');
            
            try {
                const text = mailBody.innerText;
                const translatedText = await TranslationModule.translate(text);
                
                // 로딩 팝업 제거
                loadingPopup.remove();
                
                // 번역 결과 표시
                Utils.createPopup('번역 결과', `
                    <div class="translation-result">
                        <h4>원문</h4>
                        <p class="original-text">${text}</p>
                        <h4>번역</h4>
                        <p class="translated-text">${translatedText}</p>
                    </div>
                `);
            } catch (error) {
                // 로딩 팝업 제거
                loadingPopup.remove();
                
                // 오류 알림
                Utils.showNotification(`번역 중 오류 발생: ${error.message}`, 'error');
            }
        };

        prompt.querySelector('#translateNo').onclick = () => prompt.remove();
    }

    // URL 변경 감지
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.host === 'mail.google.com') {
                createTranslationPrompt();
            }
        }
    });

    observer.observe(document, { 
        subtree: true, 
        childList: true 
    });
}

// 초기화
function initialize() {
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .muzimuzi-popup { 
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 9999;
            max-width: 90%;
            width: 500px;
        }
        .muzimuzi-popup .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .muzimuzi-popup .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
        }
        .translation-result .original-text,
        .translation-result .translated-text {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px;
            background: #333;
            color: white;
            border-radius: 4px;
            z-index: 10000;
        }
        .notification.error {
            background: #ff4444;
        }
    `;
    document.head.appendChild(style);

    // 번역 기능 설정
    setupTranslation();
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);