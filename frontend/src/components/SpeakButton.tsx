import { speak } from '../speech';
import './SpeakButton.css';

type Size = 'sm' | 'md' | 'lg';

// Botão de pronúncia estilo Duolingo: um ícone de volume que fala o texto ao clicar.
export function SpeakButton({ text, size = 'md' }: { text: string; size?: Size }) {
  return (
    <button
      type="button"
      className={`speaker speaker-${size}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={`Ouvir pronúncia de ${text}`}
      title="Ouvir"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" />
        <path
          d="M16 8.5a4 4 0 0 1 0 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18.7 6a7 7 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
