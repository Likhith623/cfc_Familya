"""Translation service using Google Cloud Translation API v2.

Replaces the old OpenAI-based service. Uses:
  - Google Translate v2 REST API for translation + language detection
  - Regex-based pattern matching for fact extraction (no LLM needed)
"""

import httpx
import json
import re
from typing import Optional
from config import get_settings

settings = get_settings()

# ─── Idioms database for nuance detection ──────────────────────────────────────
COMMON_IDIOMS = {
    "en": {
        "piece of cake": "Something very easy to do",
        "break a leg": "Good luck (used before a performance)",
        "hit the sack": "Go to sleep",
        "under the weather": "Feeling sick or unwell",
        "cost an arm and a leg": "Very expensive",
        "bite the bullet": "To endure a painful experience bravely",
        "spill the beans": "Reveal a secret",
        "let the cat out of the bag": "Accidentally reveal a secret",
        "feeling blue": "Feeling sad",
        "once in a blue moon": "Very rarely",
        "raining cats and dogs": "Raining very heavily",
        "the whole nine yards": "Everything, the full extent",
        "barking up the wrong tree": "Making a wrong assumption",
    },
    "hi": {
        "दाल में कुछ काला है": "Something is suspicious (literally: something black in the lentils)",
        "नौ दो ग्यारह होना": "To run away quickly",
        "अपना उल्लू सीधा करना": "To serve one's own interests",
        "आसमान से गिरे खजूर में अटके": "Out of the frying pan, into the fire",
    },
    "pt": {
        "pé na jaca": "To go overboard, especially with drinking",
        "ficar de bode": "To be in a bad mood",
        "dar com os burros n'água": "To fail in an attempt",
        "engolir sapo": "To put up with something unpleasant",
    },
    "ja": {
        "猫の手も借りたい": "So busy you'd even borrow a cat's paw (extremely busy)",
        "花より団子": "Dumplings over flowers (practicality over aesthetics)",
        "七転び八起き": "Fall seven times, get up eight (perseverance)",
    },
    "es": {
        "estar en las nubes": "To be daydreaming (literally: in the clouds)",
        "ser pan comido": "To be very easy (literally: eaten bread)",
        "meter la pata": "To make a blunder",
    },
    "ko": {
        "눈이 높다": "To have high standards (literally: eyes are high)",
        "발이 넓다": "To know many people (literally: feet are wide)",
    },
}

# ─── Language display names ────────────────────────────────────────────────────
LANG_NAMES = {
    "en": "English", "hi": "Hindi", "pt": "Portuguese",
    "ja": "Japanese", "es": "Spanish", "ko": "Korean",
    "fr": "French", "de": "German", "zh": "Chinese",
    "ar": "Arabic", "ru": "Russian", "it": "Italian",
    "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
    "tr": "Turkish", "th": "Thai", "vi": "Vietnamese",
    "nl": "Dutch", "pl": "Polish", "sv": "Swedish",
}

# ─── Fact extraction patterns (keyword-based, no LLM needed) ───────────────────
FACT_PATTERNS: dict[str, list[str]] = {
    "favorite_food": [
        r"(?:my |i )?(?:favorite|fav|favourite) (?:food|dish|meal|cuisine) (?:is|are|would be) (.+?)(?:\.|!|,|$)",
        r"i (?:love|like|enjoy|prefer) (?:eating|to eat|having) (.+?)(?:\.|!|,|$)",
        r"i (?:really )?(?:love|like|enjoy) (.+?) (?:food|dish|dishes|cuisine)",
        r"nothing beats (.+?) for (?:dinner|lunch|breakfast)",
    ],
    "favorite_color": [
        r"(?:my |i )?(?:favorite|fav|favourite) colou?r (?:is|would be) (.+?)(?:\.|!|,|$)",
    ],
    "hobby": [
        r"(?:my |i )?(?:hobbies?|hobby) (?:is|are|include) (.+?)(?:\.|!|,|$)",
        r"i (?:love|like|enjoy) (?:to )?(.+?)(?:ing)? in my (?:free|spare) time",
        r"i(?:'m| am) (?:really )?(?:into|passionate about) (.+?)(?:\.|!|,|$)",
    ],
    "favorite_movie": [
        r"(?:my |i )?(?:favorite|fav|favourite) (?:movie|film|show|series) (?:is|would be) (.+?)(?:\.|!|,|$)",
    ],
    "favorite_music": [
        r"(?:my |i )?(?:favorite|fav|favourite) (?:music|song|band|artist|singer) (?:is|are|would be) (.+?)(?:\.|!|,|$)",
    ],
    "favorite_place": [
        r"(?:my |i )?(?:favorite|fav|favourite) (?:place|city|country|destination) (?:is|would be) (.+?)(?:\.|!|,|$)",
    ],
    "pet": [
        r"i (?:have|own|got) (?:a |an )?(.+?)(?:named|called) .+?(?:\.|!|,|$)",
        r"my (?:pet|dog|cat|bird|fish|hamster|rabbit) (?:is named|is called|is) (.+?)(?:\.|!|,|$)",
        r"i (?:have|own|got) (?:a |an )?(dog|cat|bird|fish|hamster|rabbit|parrot|turtle)",
    ],
    "family_detail": [
        r"i have (\d+) (?:brothers?|sisters?|siblings?|kids?|children)",
        r"my (?:mom|dad|mother|father|brother|sister|grandma|grandpa) (.+?)(?:\.|!|,|$)",
    ],
    "fear": [
        r"i(?:'m| am) (?:really )?(?:afraid|scared|terrified) of (.+?)(?:\.|!|,|$)",
        r"my (?:biggest )?fear (?:is|would be) (.+?)(?:\.|!|,|$)",
    ],
    "dream": [
        r"my dream (?:is|would be) (?:to )?(.+?)(?:\.|!|,|$)",
        r"i (?:dream|wish|hope) (?:to|of) (.+?)(?:\.|!|,|$)",
    ],
    "cultural_tradition": [
        r"(?:in my (?:culture|country|family)|we) (?:celebrate|have|observe) (.+?)(?:\.|!|,|$)",
    ],
    "daily_routine": [
        r"(?:every|each) (?:morning|evening|day|night) i (.+?)(?:\.|!|,|$)",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
#  Main translation function
# ═══════════════════════════════════════════════════════════════════════════════

async def translate_text(
    text: str,
    source_lang: str,
    target_lang: str,
) -> dict:
    """Translate text with idiom / nuance detection.

    Uses Google Cloud Translation API v2 under the hood.
    """
    if source_lang == target_lang:
        return {
            "translated_text": text,
            "has_idiom": False,
            "idiom_explanation": None,
            "cultural_note": None,
        }

    # Check for idioms in the source text
    idiom_found = None
    idiom_explanation = None
    source_idioms = COMMON_IDIOMS.get(source_lang, {})
    for idiom, explanation in source_idioms.items():
        if idiom.lower() in text.lower():
            idiom_found = idiom
            idiom_explanation = explanation
            break

    # Translate with Google
    translated = await _translate_with_google(text, source_lang, target_lang)

    cultural_note = None
    if idiom_found:
        cultural_note = (
            f'💡 Cultural Note: "{idiom_found}" is an idiom meaning: {idiom_explanation}'
        )

    return {
        "translated_text": translated,
        "has_idiom": idiom_found is not None,
        "idiom_explanation": idiom_explanation,
        "cultural_note": cultural_note,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  Google Cloud Translation API v2  (REST with API key)
# ═══════════════════════════════════════════════════════════════════════════════

GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"
GOOGLE_DETECT_URL = "https://translation.googleapis.com/language/translate/v2/detect"


async def _translate_with_google(
    text: str,
    source_lang: str,
    target_lang: str,
) -> str:
    """Call Google Cloud Translation API v2 to translate text."""
    api_key = settings.GOOGLE_TRANSLATE_API_KEY
    if not api_key:
        return f"[Translation unavailable] {text}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GOOGLE_TRANSLATE_URL,
                params={"key": api_key},
                json={
                    "q": text,
                    "source": source_lang,
                    "target": target_lang,
                    "format": "text",
                },
                timeout=15,
            )

            if resp.status_code == 200:
                data = resp.json()
                translations = data.get("data", {}).get("translations", [])
                if translations:
                    return translations[0].get("translatedText", text)

            print(f"[Google Translate] {resp.status_code}: {resp.text[:200]}")

    except Exception as exc:
        print(f"[Google Translate] Exception: {exc}")

    return f"[Translation pending] {text}"


# ═══════════════════════════════════════════════════════════════════════════════
#  Language detection  (Google Translate v2 /detect)
# ═══════════════════════════════════════════════════════════════════════════════

async def detect_language(text: str) -> str:
    """Detect the language of *text* using Google Translate v2 /detect."""
    api_key = settings.GOOGLE_TRANSLATE_API_KEY
    if not api_key:
        return "en"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GOOGLE_DETECT_URL,
                params={"key": api_key},
                json={"q": text},
                timeout=10,
            )

            if resp.status_code == 200:
                data = resp.json()
                detections = data.get("data", {}).get("detections", [])
                if detections and detections[0]:
                    return detections[0][0].get("language", "en")

    except Exception as exc:
        print(f"[Google Detect] Exception: {exc}")

    return "en"


# ═══════════════════════════════════════════════════════════════════════════════
#  Fact extraction  (regex-based — no LLM needed)
# ═══════════════════════════════════════════════════════════════════════════════

async def extract_facts_from_message(text: str, user_id: str) -> list:
    """Extract personal facts from a chat message using pattern matching.

    Returns a list of dicts: [{"category": "favorite_food", "value": "pizza"}].
    No external API call — works entirely offline with regex patterns.
    """
    facts: list[dict] = []
    text_lower = text.lower().strip()

    for category, patterns in FACT_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                value = match.group(1).strip().rstrip(".,!?")
                if 1 < len(value) < 100:
                    facts.append({"category": category, "value": value})
                break  # one match per category is enough

    return facts


# ═══════════════════════════════════════════════════════════════════════════════
#  Supported languages
# ═══════════════════════════════════════════════════════════════════════════════

def get_supported_languages() -> list[dict]:
    """Return the list of languages Familia supports."""
    return [{"code": code, "name": name} for code, name in LANG_NAMES.items()]
