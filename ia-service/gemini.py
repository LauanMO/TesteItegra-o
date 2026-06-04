"""Integração com o Gemini (google-genai) + gerador mock para rodar sem chave.

Cada função retorna um dict pronto para resposta da API, incluindo o campo
``source``: ``"gemini"`` quando veio do modelo, ou ``"mock"`` quando a chave
não está configurada (ou o modelo falhou).
"""
import json
import os
import random

from pydantic import BaseModel

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Pool de significados em português para montar distratores no modo mock.
_DISTRACTOR_POOL = [
    "água", "comer", "casa", "amigo", "livro", "professor", "comprar",
    "grande", "pequeno", "bonito", "quente", "frio", "hoje", "amanhã",
    "dinheiro", "escola", "trabalho", "feliz", "ver", "falar", "dormir",
    "carro", "telefone", "computador", "cachorro", "gato", "chá", "maçã",
]


def gemini_available() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


_client = None


def _get_client():
    """Cria (uma vez) o client do Gemini. Retorna None se não houver chave."""
    global _client
    if not gemini_available():
        return None
    if _client is None:
        from google import genai

        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


# ----------------------------------------------------------------------------
# Exercício de múltipla escolha
# ----------------------------------------------------------------------------
class _ExerciseSchema(BaseModel):
    question: str
    options: list[str]
    answer: str


def _normalize_options(options: list[str], answer: str) -> list[str]:
    """Garante 4 opções únicas contendo a resposta correta."""
    opts = [o.strip() for o in options if o and o.strip()]
    if answer not in opts:
        opts.insert(0, answer)
    # remove duplicatas preservando ordem
    seen, unique = set(), []
    for o in opts:
        if o.lower() not in seen:
            seen.add(o.lower())
            unique.append(o)
    # completa até 4 com distratores do pool
    pool = [d for d in _DISTRACTOR_POOL if d.lower() not in seen]
    random.shuffle(pool)
    while len(unique) < 4 and pool:
        unique.append(pool.pop())
    unique = unique[:4]
    random.shuffle(unique)
    return unique


def generate_exercise(word: str, pinyin: str = "", meaning: str = "") -> dict:
    client = _get_client()
    base_word = {"hanzi": word, "pinyin": pinyin, "translation": meaning}

    if client is not None:
        try:
            from google.genai import types

            prompt = (
                "Você é um professor de mandarim para falantes de português do Brasil. "
                "Crie UM exercício de múltipla escolha sobre o significado da palavra chinesa abaixo.\n"
                f"Palavra (hanzi): {word}\n"
                f"Pinyin: {pinyin}\n"
                f"Significado correto (pt-BR): {meaning}\n\n"
                "Regras:\n"
                "- A pergunta deve ser em português e perguntar o significado da palavra.\n"
                "- Forneça exatamente 4 opções em português, plausíveis e distintas.\n"
                "- 'answer' deve ser EXATAMENTE igual a uma das opções e corresponder ao significado correto.\n"
            )
            resp = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=_ExerciseSchema,
                    # Desliga o "thinking" do 2.5-flash: tarefa simples, latência menor.
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            data = json.loads(resp.text)
            answer = data.get("answer") or meaning
            options = _normalize_options(data.get("options", []), answer)
            return {
                "type": "multiple_choice",
                "question": data.get("question") or f'O que significa "{word}" ({pinyin})?',
                "options": options,
                "answer": answer if answer in options else options[0],
                "word": base_word,
                "source": "gemini",
            }
        except Exception as err:  # noqa: BLE001 — cai no mock em qualquer falha
            print(f"[gemini] falha ao gerar exercício, usando mock: {err}")

    # ---- mock ----
    answer = meaning or word
    options = _normalize_options([answer], answer)
    return {
        "type": "multiple_choice",
        "question": f'O que significa "{word}" ({pinyin})?',
        "options": options,
        "answer": answer if answer in options else options[0],
        "word": base_word,
        "source": "mock",
    }


# ----------------------------------------------------------------------------
# Frase de exemplo (flashcard)
# ----------------------------------------------------------------------------
class _FlashcardSchema(BaseModel):
    sentence: str
    pinyin: str
    translation: str


def generate_flashcard(word: str) -> dict:
    client = _get_client()

    if client is not None:
        try:
            from google.genai import types

            prompt = (
                "Você é um professor de mandarim. Crie UMA frase curta e simples em "
                f"mandarim (nível HSK 1-2) que utilize a palavra '{word}'.\n"
                "Retorne: a frase em hanzi (sentence), o pinyin da frase (pinyin) e a "
                "tradução para o português do Brasil (translation)."
            )
            resp = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=_FlashcardSchema,
                    # Desliga o "thinking" do 2.5-flash: tarefa simples, latência menor.
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            data = json.loads(resp.text)
            return {
                "word": word,
                "sentence": data.get("sentence", ""),
                "pinyin": data.get("pinyin", ""),
                "translation": data.get("translation", ""),
                "source": "gemini",
            }
        except Exception as err:  # noqa: BLE001
            print(f"[gemini] falha ao gerar flashcard, usando mock: {err}")

    # ---- mock ----
    return {
        "word": word,
        "sentence": f"这是{word}。",
        "pinyin": "",
        "translation": f'Frase de exemplo com "{word}" (configure GEMINI_API_KEY para gerar com IA).',
        "source": "mock",
    }
