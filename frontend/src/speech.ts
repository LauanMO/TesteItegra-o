import { API_BASE } from './api';

// Fala em mandarim. Estratégia em camadas para funcionar em qualquer máquina:
//  1) TTS online via proxy do backend (Google Translate) — não exige voz zh no SO;
//  2) fallback: Web Speech API nativa, caso o navegador tenha voz em zh.
function speakViaWebSpeech(text: string): boolean {
  if (!('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  const zh = voices.find((v) => v.lang?.toLowerCase().startsWith('zh'));
  const u = new SpeechSynthesisUtterance(text);
  u.lang = zh?.lang || 'zh-CN';
  if (zh) u.voice = zh;
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

export function speak(text: string) {
  if (!text) return;
  const url = `${API_BASE}/tts?lang=zh-CN&text=${encodeURIComponent(text)}`;
  const audio = new Audio(url);
  audio.play().catch(() => {
    // Sem internet/bloqueado → tenta a voz nativa do navegador.
    if (!speakViaWebSpeech(text)) {
      console.warn('[MandaRim] Não foi possível reproduzir a pronúncia.');
    }
  });
}
