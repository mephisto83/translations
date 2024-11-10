// script.ts

import * as fs from 'fs';
import fetch from 'node-fetch';

// Type definitions
interface TranslationEntry {
    id: number;
    defaultTitle: string;
    [key: string]: any;
}

interface Translations {
    [category: string]: {
        [text: string]: TranslationEntry;
    };
}

interface NewText {
    text: string;
    category: string;
}

const memory: {
    [sourceText: string]: {
        [sourceLang: string]: {
            [targetLang: string]: string;
        };
    };
} = {};

// TranslationService function
function TranslationService(
    sourceText: string,
    sourceLang: string,
    targetLang: string
): Promise<string> {
    if (
        memory[sourceText] &&
        memory[sourceText][sourceLang] &&
        memory[sourceText][sourceLang][targetLang]
    ) {
        return Promise.resolve(memory[sourceText][sourceLang][targetLang]);
    }
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        sourceText
    )}`;
    return fetch(url)
        .then((res) => res.json())
        .then((translation) => {
            memory[sourceText] = memory[sourceText] || {};
            memory[sourceText][sourceLang] = memory[sourceText][sourceLang] || {};
            if (translation[0] && translation[0].map) {
                memory[sourceText][sourceLang][targetLang] = translation[0]
                    .map((t: any) => t[0])
                    .join(' ');

                return memory[sourceText][sourceLang][targetLang];
            }
            throw 'oops'
        })
        .catch((e) => {
            console.error(e);
            return '';
        });
}


// Process new texts
async function processNewTexts(filePath: string) {
    for (const item of newTexts) {
        const { text, category } = item;

        // Ensure category exists
        if (!translations[category]) {
            translations[category] = {};
        }
        if (!text) {
            continue;
        }

        // Initialize the entry with default values
        translations[category][text] = translations[category][text] || {
            id: Date.now(),
            defaultTitle: text,
        };

        const entry = translations[category][text];

        console.log(`text: ${text}`);
        // Translate missing languages
        // const translationPromises = targetLanguages.map(
        for (let i = 0; i < targetLanguages.length; i++) {
            let lang = targetLanguages[i];
            if (!entry[lang]) {
                console.log(`lang ${lang}, text: ${text}`);

                const translatedText = await TranslationService(text, 'en', lang);
                entry[lang] = translatedText;
                // Rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        // Wait for all translations to complete for the current text
    }

    // Write back the updated translations
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 4), 'utf-8');
}
const translations_json = 'C:\\dev\\expressivefeeling\\titles.json';
const new_texts = 'C:\\dev\\expressivefeeling\\titlesnew.json';
// New texts to be translated
const newTexts: NewText[] = JSON.parse(
    fs.readFileSync(new_texts, 'utf-8')
)

// Load existing translations
const translations: Translations = JSON.parse(
    fs.readFileSync(translations_json, 'utf-8')
);
// Get list of target languages from existing translations
let targetLanguages: string[] = [];
if (Object.keys(translations).length > 0) {
    const firstCategory = Object.keys(translations)[0];
    const firstText = Object.keys(translations[firstCategory])[0];
    const firstEntry = translations[firstCategory][firstText];
    targetLanguages = Object.keys(firstEntry).filter(
        (lang) => lang !== 'id' && lang !== 'defaultTitle'
    );
} else {
    // Default languages if translations are empty
    targetLanguages = ['en', 'fr', 'es', 'de', 'no', 'ko'];
}

// Execute the function
processNewTexts(translations_json).catch((error) => console.error(error));
