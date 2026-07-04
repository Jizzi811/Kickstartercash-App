"""AI capability taxonomy for the BrandMind Provider Gateway.

Every provider adapter declares which of these it supports, and every business
call asks the gateway for a *capability* (not a provider). This is what lets the
platform switch providers with a single config change.
"""

CHAT = "chat"                         # text conversation / completion
VISION = "vision"                     # image understanding (image-in, text-out)
IMAGE = "image"                       # image generation (text-in, image-out)
EMBEDDINGS = "embeddings"             # vector embeddings
SPEECH_TO_TEXT = "speech_to_text"     # audio-in, text-out (transcription)
TEXT_TO_SPEECH = "text_to_speech"     # text-in, audio-out
STRUCTURED_OUTPUT = "structured_output"  # JSON / schema-constrained output

ALL_CAPABILITIES = [
    CHAT, VISION, IMAGE, EMBEDDINGS,
    SPEECH_TO_TEXT, TEXT_TO_SPEECH, STRUCTURED_OUTPUT,
]

# Human labels (DE/EN) for the admin UI.
CAPABILITY_LABELS = {
    CHAT: {"de": "Chat", "en": "Chat"},
    VISION: {"de": "Bildverständnis", "en": "Vision"},
    IMAGE: {"de": "Bildgenerierung", "en": "Image Generation"},
    EMBEDDINGS: {"de": "Embeddings", "en": "Embeddings"},
    SPEECH_TO_TEXT: {"de": "Spracherkennung", "en": "Speech-to-Text"},
    TEXT_TO_SPEECH: {"de": "Sprachausgabe", "en": "Text-to-Speech"},
    STRUCTURED_OUTPUT: {"de": "Strukturierte Ausgabe", "en": "Structured Output"},
}

# Canonical "tasks" the platform routes. Each maps to a capability and can have a
# preferred provider/model in the gateway config (e.g. chat→Claude, image→GPT).
TASKS = {
    "chat":          {"capability": CHAT,               "de": "Chat / Text",        "en": "Chat / Text"},
    "structured":    {"capability": STRUCTURED_OUTPUT,  "de": "Strukturierte Ausgabe", "en": "Structured Output"},
    "vision":        {"capability": VISION,             "de": "Bildanalyse",        "en": "Image Analysis"},
    "image":         {"capability": IMAGE,              "de": "Bildgenerierung",    "en": "Image Generation"},
    "video_prompt":  {"capability": CHAT,               "de": "Video-Prompt",       "en": "Video Prompt"},
    "embeddings":    {"capability": EMBEDDINGS,         "de": "Embeddings",         "en": "Embeddings"},
    "tts":           {"capability": TEXT_TO_SPEECH,     "de": "Sprachausgabe",      "en": "Text-to-Speech"},
    "stt":           {"capability": SPEECH_TO_TEXT,     "de": "Transkription",      "en": "Transcription"},
}
