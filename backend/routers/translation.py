"""Translation-specific router for direct translation API access."""
from fastapi import APIRouter
from services.translation_service import translate_text, detect_language

router = APIRouter(prefix="/translate", tags=["Translation"])


@router.post("/")
async def translate(text: str, source_lang: str = None, target_lang: str = "en"):
    """Translate text between languages with nuance detection."""
    if not source_lang:
        source_lang = await detect_language(text)
    
    result = await translate_text(text, source_lang, target_lang)
    
    return {
        "original": text,
        "source_language": source_lang,
        "target_language": target_lang,
        **result
    }


@router.post("/detect")
async def detect(text: str):
    """Detect the language of text."""
    lang = await detect_language(text)
    
    lang_names = {
        "en": "English", "hi": "Hindi", "pt": "Portuguese",
        "ja": "Japanese", "es": "Spanish", "ko": "Korean",
        "fr": "French", "de": "German", "zh": "Chinese",
        "ar": "Arabic", "ru": "Russian", "it": "Italian",
        "nl": "Dutch", "pl": "Polish", "tr": "Turkish",
        "vi": "Vietnamese", "th": "Thai", "sv": "Swedish"
    }
    
    return {
        "text": text,
        "language_code": lang,
        "language_name": lang_names.get(lang, lang)
    }


@router.get("/languages")
async def supported_languages():
    """Get list of supported languages."""
    return {
        "languages": [
            {"code": "en", "name": "English", "flag": "🇺🇸"},
            {"code": "hi", "name": "Hindi", "flag": "🇮🇳"},
            {"code": "pt", "name": "Portuguese", "flag": "🇧🇷"},
            {"code": "ja", "name": "Japanese", "flag": "🇯🇵"},
            {"code": "es", "name": "Spanish", "flag": "🇪🇸"},
            {"code": "ko", "name": "Korean", "flag": "🇰🇷"},
            {"code": "fr", "name": "French", "flag": "🇫🇷"},
            {"code": "de", "name": "German", "flag": "🇩🇪"},
            {"code": "zh", "name": "Chinese", "flag": "🇨🇳"},
            {"code": "ar", "name": "Arabic", "flag": "🇸🇦"},
            {"code": "ru", "name": "Russian", "flag": "🇷🇺"},
            {"code": "it", "name": "Italian", "flag": "🇮🇹"},
            {"code": "nl", "name": "Dutch", "flag": "🇳🇱"},
            {"code": "pl", "name": "Polish", "flag": "🇵🇱"},
            {"code": "tr", "name": "Turkish", "flag": "🇹🇷"},
            {"code": "vi", "name": "Vietnamese", "flag": "🇻🇳"},
            {"code": "th", "name": "Thai", "flag": "🇹🇭"},
            {"code": "sv", "name": "Swedish", "flag": "🇸🇪"},
            {"code": "sw", "name": "Swahili", "flag": "🇰🇪"},
            {"code": "bn", "name": "Bengali", "flag": "🇧🇩"}
        ]
    }
