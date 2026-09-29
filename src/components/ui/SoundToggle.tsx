import { useEffect, useState } from 'react';
import { sound } from '../../lib/sound';
import { SOUND } from '../../content/copy';

/** Botão de onda no canto inferior esquerdo. Desligado por padrão. */
export function SoundToggle() {
  const [on, setOn] = useState(sound.isEnabled());
  useEffect(() => sound.subscribe(setOn), []);
  return (
    <button
      type="button"
      className="sound-btn"
      aria-pressed={on}
      aria-label={on ? SOUND.disable : SOUND.enable}
      title={on ? SOUND.disable : SOUND.enable}
      onClick={() => {
        void sound.toggle();
      }}
    >
      <span className="wave" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
