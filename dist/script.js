"use strict";
// script.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const memory = {};
// TranslationService function
function TranslationService(sourceText, sourceLang, targetLang) {
    if (memory[sourceText] &&
        memory[sourceText][sourceLang] &&
        memory[sourceText][sourceLang][targetLang]) {
        return Promise.resolve(memory[sourceText][sourceLang][targetLang]);
    }
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(sourceText)}`;
    return (0, node_fetch_1.default)(url)
        .then((res) => res.json())
        .then((translation) => {
        memory[sourceText] = memory[sourceText] || {};
        memory[sourceText][sourceLang] = memory[sourceText][sourceLang] || {};
        console.log(translation);
        if (translation[0] && translation[0].map) {
            memory[sourceText][sourceLang][targetLang] = translation[0]
                .map((t) => t[0])
                .join(' ');
            return memory[sourceText][sourceLang][targetLang];
        }
        throw 'oops';
    })
        .catch((e) => {
        console.error(e);
        return '';
    });
}
// Process new texts
async function processNewTexts(filePath) {
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
const newTexts = JSON.parse(fs.readFileSync(new_texts, 'utf-8'));
// Load existing translations
const translations = JSON.parse(fs.readFileSync(translations_json, 'utf-8'));
// Get list of target languages from existing translations
let targetLanguages = [];
if (Object.keys(translations).length > 0) {
    const firstCategory = Object.keys(translations)[0];
    const firstText = Object.keys(translations[firstCategory])[0];
    const firstEntry = translations[firstCategory][firstText];
    targetLanguages = Object.keys(firstEntry).filter((lang) => lang !== 'id' && lang !== 'defaultTitle');
}
else {
    // Default languages if translations are empty
    targetLanguages = ['en', 'fr', 'es', 'de', 'no', 'ko'];
}
// Execute the function
processNewTexts(translations_json).catch((error) => console.error(error));
