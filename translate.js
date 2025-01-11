// Google Translate API Key
const apiKey = 'AIzaSyB70xFVF0-huiWyPSlniSkb8J1LK-0tGeg'; // הכנס כאן את מפתח ה-API שלך

// פונקציה לתרגום טקסט בודד
async function translateText(text, targetLanguage) {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                target: targetLanguage,
                source: 'en' // שפת המקור
            })
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error('Error translating text:', errorResponse.error.message);
            return text; // מחזיר את הטקסט המקורי במקרה של שגיאה
        }

        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Error with translation API:', error.message);
        return text; // מחזיר את הטקסט המקורי במקרה של שגיאה
    }
}

// פונקציה לתרגום כל הטקסטים בדף
async function translatePage(targetLanguage) {
    const elements = document.querySelectorAll('[data-translate]');
    for (const element of elements) {
        const originalText = element.getAttribute('data-translate');
        const translatedText = await translateText(originalText, targetLanguage);
        element.textContent = translatedText;
    }
}

// פונקציה לחיבור כפתורי השפות
function setupLanguageButtons() {
    const buttons = document.querySelectorAll('#language-buttons button');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const language = button.getAttribute('data-lang');
            await translatePage(language);
        });
    });
}

// תרגום ברירת מחדל לאנגלית בזמן טעינת הדף
window.onload = async () => {
    setupLanguageButtons();
    await translatePage('en');
};
