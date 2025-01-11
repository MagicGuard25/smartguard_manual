// Google Translate API Key
const apiKey = 'YAIzaSyB70xFVF0-huiWyPSlniSkb8J1LK-0tGeg'; // החלף את YOUR_API_KEY במפתח ה-API שלך

// רשימת תגיות HTML שצריך לתרגם
const TRANSLATABLE_ELEMENTS = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'a', 'button', 'label',
    'li', 'td', 'th', 'caption', 'strong',
    '.title', '.subtitle', '.content', '.menu-item',
    '[role="heading"]', '[aria-label]'
];

// מטמון תרגומים
const translationCache = new Map();

// פונקציה לתרגום טקסט
async function translateText(text, targetLanguage) {
    if (!text || !text.trim() || !isNaN(text)) {
        return text;
    }

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
        translationCache.set(cacheKey, translatedText);
        return translatedText;
    } catch (error) {
        console.error('Translation API error:', error);
        return text;
    }
}

// בדיקה האם אלמנט צריך להיות מתורגם
function shouldTranslateElement(element) {
    // רשימת מחלקות ותגיות שלא צריך לתרגם
    const excludeClasses = ['no-translate', 'code', 'pre'];
    const excludeTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'INPUT', 'TEXTAREA'];

    if (excludeTags.includes(element.tagName)) return false;
    if (element.classList && excludeClasses.some(cls => element.classList.contains(cls))) return false;
    if (element.getAttribute('contenteditable') === 'true') return false;
    if (element.hasAttribute('no-translate')) return false;

    return true;
}

// פונקציה לתרגום אלמנט בודד
async function translateElement(element, targetLanguage) {
    if (!shouldTranslateElement(element)) return;

    // תרגום תכונות
    const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
    for (const attr of attributes) {
        if (element.hasAttribute(attr)) {
            const translated = await translateText(element.getAttribute(attr), targetLanguage);
            element.setAttribute(attr, translated);
        }
    }

    // תרגום טקסט
    for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                const translated = await translateText(text, targetLanguage);
                if (translated !== text) {
                    node.textContent = node.textContent.replace(text, translated);
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            await translateElement(node, targetLanguage);
        }
    }
}

// פונקציה למעקב אחרי שינויים בדף
function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const currentLang = localStorage.getItem('selectedLanguage');
                        if (currentLang && shouldTranslateElement(node)) {
                            translateElement(node, currentLang);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    return observer;
}

// פונקציה לתרגום כל הדף
async function translatePage(targetLanguage) {
    console.log(`Starting translation to ${targetLanguage}...`);
    
    try {
        const elements = document.querySelectorAll(TRANSLATABLE_ELEMENTS.join(', '));
        for (const element of elements) {
            await translateElement(element, targetLanguage);
        }
        
        localStorage.setItem('selectedLanguage', targetLanguage);
        console.log('Translation completed!');
    } catch (error) {
        console.error('Translation failed:', error);
    }
}

// הוספת כפתורי שפה אם הם לא קיימים
function addLanguageButtons() {
    if (!document.getElementById('language-buttons')) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.id = 'language-buttons';
        buttonsDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background-color: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        const languages = [
            { code: 'en', name: 'English' },
            { code: 'he', name: 'עברית' },
            { code: 'es', name: 'Español' },
            { code: 'ru', name: 'Русский' },
            { code: 'ar', name: 'العربية' }
        ];

        languages.forEach(lang => {
            const button = document.createElement('button');
            button.setAttribute('data-lang', lang.code);
            button.textContent = lang.name;
            button.style.cssText = `
                margin: 5px;
                padding: 8px 12px;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
                background-color: white;
                transition: all 0.3s ease;
            `;
            button.addEventListener('click', async () => {
                const buttons = document.querySelectorAll('#language-buttons button');
                buttons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                });
                document.body.style.cursor = 'wait';
                
                try {
                    await translatePage(lang.code);
                    buttons.forEach(btn => {
                        btn.style.backgroundColor = btn === button ? '#e0e0e0' : 'white';
                        btn.style.fontWeight = btn === button ? 'bold' : 'normal';
                    });
                } finally {
                    buttons.forEach(btn => {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    });
                    document.body.style.cursor = 'default';
                }
            });
            buttonsDiv.appendChild(button);
        });

        document.body.appendChild(buttonsDiv);
    }
}

// הפעלת הקוד
function initialize() {
    addLanguageButtons();
    const observer = observePageChanges();
    
    // טעינת השפה האחרונה שנבחרה
    const lastLanguage = localStorage.getItem('selectedLanguage');
    if (lastLanguage) {
        translatePage(lastLanguage);
    }
}

// הפעלת האתחול כשהדף מוכן
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
