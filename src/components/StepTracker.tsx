'use client';

import { useStore } from '@/store';
import { Lot, Gamme } from '@/types';

interface StepTrackerProps {
  gamme: Gamme | undefined;
  lot?: Lot | null;
}

export default function StepTracker({ gamme, lot }: StepTrackerProps) {
  const { getAtelier } = useStore();

  if (!gamme) return null;

  const ci = lot ? lot.currentStepIndex : 0;

  return (
    <div className="step-tracker">
      {gamme.steps.map((sid, idx) => {
        const at = getAtelier(sid);
        let st = 'pending';
        if (lot) {
          if (lot.status === 'bloque' && idx === ci) st = 'blocked';
          else if (idx < ci) st = 'done';
          else if (idx === ci) st = 'active';
        }
        return (
          <div className="step-node" key={sid}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className={`step-circle ${st === 'done' ? 'done' : st === 'active' ? 'active' : st === 'blocked' ? 'blocked' : ''}`}>
                {st === 'done' ? '✓' : st === 'blocked' ? '✗' : String(idx + 1)}
              </div>
              <div className="step-label">{at ? at.name : sid}</div>
            </div>
            {idx < gamme.steps.length - 1 && (
              <div className={`step-line${idx < ci ? ' done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
