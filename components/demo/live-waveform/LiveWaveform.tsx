/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useState } from 'react';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useAgent } from '@/lib/state';

export default function LiveWaveform() {
  const { volume, connected } = useLiveAPIContext();
  const { current } = useAgent();
  const [activeLevels, setActiveLevels] = useState<number[]>([0.3, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5]);

  useEffect(() => {
    if (!connected) {
      setActiveLevels([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
      return;
    }

    if (volume > 0.02) {
      const factor = Math.min(Math.max(volume * 4, 0.3), 1.8);
      setActiveLevels([
        0.3 + Math.random() * 0.6 * factor,
        0.5 + Math.random() * 0.8 * factor,
        0.7 + Math.random() * 1.0 * factor,
        0.4 + Math.random() * 0.7 * factor,
        0.6 + Math.random() * 0.9 * factor,
        0.4 + Math.random() * 0.7 * factor,
        0.3 + Math.random() * 0.6 * factor,
      ]);
    } else {
      const interval = setInterval(() => {
        setActiveLevels([
          0.3 + Math.sin(Date.now() / 180) * 0.1,
          0.4 + Math.cos(Date.now() / 220) * 0.15,
          0.5 + Math.sin(Date.now() / 260) * 0.2,
          0.4 + Math.cos(Date.now() / 200) * 0.15,
          0.5 + Math.sin(Date.now() / 240) * 0.15,
          0.3 + Math.cos(Date.now() / 190) * 0.1,
          0.3 + Math.sin(Date.now() / 210) * 0.1,
        ]);
      }, 90);
      return () => clearInterval(interval);
    }
  }, [volume, connected]);

  const barColor = current?.bodyColor || '#ff4600';

  return (
    <div className="ios-live-waveform-container" style={{ '--accent-color': barColor } as any}>
      <div className="ios-waveform-bars">
        {activeLevels.map((lvl, idx) => (
          <div
            key={idx}
            className="ios-wave-bar"
            style={{
              height: `${Math.max(8, lvl * 32)}px`,
              backgroundColor: barColor,
              opacity: connected ? (volume > 0.02 ? 1 : 0.8) : 0.4,
              boxShadow: `0 0 10px ${barColor}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
