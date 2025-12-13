import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';

type UnitOption = 'kg' | 'lb' | 'km' | 'mi';

export default function OnboardingSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weightUnit, setWeightUnit] = useState<UnitOption>('kg');
  const [distanceUnit, setDistanceUnit] = useState<UnitOption>('km');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const persistAndFinish = async () => {
    setError(null);
    try {
      setSaving(true);
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(
        profileRef,
        {
          units: {
            weight: weightUnit,
            distance: distanceUnit,
          },
          onboardingCompleted: true,
        },
        { merge: true },
      );
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Unable to save your preferences right now. Please try again.');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#020f09] to-black px-3 py-3 text-zinc-100">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-w-sm flex-col sm:max-w-md">
        <div className="flex min-h-0 flex-1 flex-col rounded-[38px] border border-emerald-500/25 bg-gradient-to-b from-[#07130e] via-[#050b09] to-black p-6 shadow-[0_26px_80px_rgba(0,0,0,0.9)]">
          <div className="mb-4 flex items-center justify-between text-xs text-emerald-100/80">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-emerald-200/80 hover:text-emerald-100"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
            >
              Skip
            </button>
          </div>

          <div className="mb-5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.3em] text-emerald-300/80">
            <span>Step 3 of 3</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-6 rounded-full bg-emerald-400" />
              <span className="h-1.5 w-6 rounded-full bg-emerald-400" />
              <span className="h-1.5 w-6 rounded-full bg-emerald-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Final Touches</h1>
            <p className="text-sm text-emerald-100/80">
              Customize Trackfit to match your goals and personal preferences.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
                Measurement Units
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <span className="text-xs text-emerald-100/90">Weight</span>
                  <div className="flex gap-2 rounded-full bg-zinc-900/70 p-1">
                    {(['kg', 'lb'] as UnitOption[]).map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setWeightUnit(unit)}
                        className={[
                          'min-w-[3rem] rounded-full px-3 py-1 text-xs font-semibold',
                          weightUnit === unit
                            ? 'bg-emerald-400 text-emerald-950'
                            : 'text-emerald-100/70',
                        ].join(' ')}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <span className="text-xs text-emerald-100/90">Distance</span>
                  <div className="flex gap-2 rounded-full bg-zinc-900/70 p-1">
                    {(['mi', 'km'] as UnitOption[]).map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setDistanceUnit(unit)}
                        className={[
                          'min-w-[3rem] rounded-full px-3 py-1 text-xs font-semibold',
                          distanceUnit === unit
                            ? 'bg-emerald-400 text-emerald-950'
                            : 'text-emerald-100/70',
                        ].join(' ')}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={persistAndFinish}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-semibold text-emerald-950 shadow-[0_20px_60px_rgba(34,197,94,0.6)] transition hover:shadow-[0_24px_70px_rgba(34,197,94,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Starting…' : 'Start Tracking'}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
