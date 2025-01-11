// Google Translate API Key
const apiKey = 'AIzaSyB70xFVF0-huiWyPSlniSkb8J1LK-0tGeg'; // החלף את YOUR_API_KEY במפתח ה-API שלך

// רשימת תגיות HTML שמכילות טקסט שנרצה לתרגם
const TEXT_ELEMENTS = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'a', 'button', 'label',
    'li', 'td', 'th', 'title', 'option'
];

// שמירת התרגומים במטמון (cache)
const translationCache = new Map();

// פונקציה לתרגום טקסט בודד
async function translateText(text, targetLanguage) {
    // אם הטקסט ריק או מספר, נחזיר אותו כמו שהוא
    if (!text || !text.trim() || !isNaN(text)) {
        return text;
    }
    
    // בדיקה אם התרגום קיים במטמון
    const cacheKey = `${text}:${targetLanguage}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                target: targetLanguage,
                source: 'auto'
            })
        });

        if (!response.ok) {
            console.error('Translation error:', await response.text());
            return text;
        }

        const data = await response.json();
        const translatedText = data.data.translations[0].translatedText;
        
        // שמירת התרגום במטמון
        translationCache.set(cacheKey, translatedText);
        
        return translatedText;
    } catch (error) {
        console.error('Translation API error:', error);
        return text;
    }
}

// פונקציה לבדיקה האם אלמנט מכיל רק טקסט
function hasOnlyText(element) {
    return Array.from(element.childNodes)
        .every(node => node.nodeType === Node.TEXT_NODE);
}

// פונקציה לתרגום אלמנט ותתי-האלמנטים שלו
async function translateElement(element, targetLanguage) {
    // אם האלמנט הוא תיבת טקסט או תיבת סיסמה, נדלג עליו
    if (element.tagName === 'INPUT' && 
        (element.type === 'text' || element.type === 'password')) {
        return;
    }

    // אם יש לאלמנט תכונת 'contenteditable', נדלג עליו
    if (element.getAttribute('contenteditable') === 'true') {
        return;
    }

    // אם האלמנט מכיל רק טקסט ויש לו תוכן
    if (hasOnlyText(element) && element.textContent.trim()) {
        const originalText = element.textContent;
        const translatedText = await translateText(originalText, targetLanguage);
        if (translatedText !== originalText) {
            element.textContent = translatedText;
        }
    } else {
        // תרגום תתי-האלמנטים
        for (const childNode of element.childNodes) {
            if (childNode.nodeType === Node.ELEMENT_NODE) {
                await translateElement(childNode, targetLanguage);
            } else if (childNode.nodeType === Node.TEXT_NODE && childNode.textContent.trim()) {
                const translatedText = await translateText(childNode.textContent, targetLanguage);
                if (translatedText !== childNode.textContent) {
                    childNode.textContent = translatedText;
                }
            }
        }
    }
}

// פונקציה לתרגום כל הדף
async function translatePage(targetLanguage) {
    console.log(`Starting translation to ${targetLanguage}...`);
    
    // מעבר על כל האלמנטים שמכילים טקסט
    for (const selector of TEXT_ELEMENTS) {
        const elements = document.getElementsByTagName(selector);
        for (const element of elements) {
            await translateElement(element, targetLanguage);
        }
    }
    
    console.log('Translation completed!');
}

// פונקציה להגדרת כפתורי השפה
function setupLanguageButtons() {
    const buttons = document.querySelectorAll('#language-buttons button');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const language = button.getAttribute('data-lang');
            
            // הוספת אינדיקציה חזותית
            document.body.style.cursor = 'wait';
            buttons.forEach(btn => btn.disabled = true);
            
            try {
                await translatePage(language);
            } finally {
                // החזרת המצב הרגיל
                document.body.style.cursor = 'default';
                buttons.forEach(btn => btn.disabled = false);
            }
        });
    });
}

// הוספת סגנונות לכפתורי השפה
const style = document.createElement('style');
style.textContent = `
    #language-buttons {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background-color: white;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    #language-buttons button {
        margin: 5px;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        background-color: white;
        transition: all 0.3s ease;
    }

    #language-buttons button:hover {
        background-color: #f0f0f0;
    }

    #language-buttons button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// הפעלת הקוד כשהדף נטען
document.addEventListener('DOMContentLoaded', setupLanguageButtons);

// גיבוי במקרה שהדף כבר נטען
if (document.readyState === 'complete') {
    setupLanguageButtons();
}
