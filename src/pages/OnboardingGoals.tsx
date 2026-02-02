import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';

const GOALS = [
  { id: 'build_muscle', title: 'Build Muscle', subtitle: 'Gain strength and mass' },
  { id: 'lose_weight', title: 'Lose Weight', subtitle: 'Burn fat and lean out' },
  { id: 'improve_endurance', title: 'Improve Endurance', subtitle: 'Run further and faster' },
  { id: 'stay_active', title: 'Stay Active', subtitle: 'Keep your body moving' },
] as const;

export default function OnboardingGoals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['build_muscle']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(goal => goal !== id) : [...prev, id],
    );
  };

  const handleContinue = async () => {
    if (!selectedGoals.length) {
      setError('Choose at least one goal to continue.');
      return;
    }

    setError(null);
    try {
      setSaving(true);
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(
        profileRef,
        {
          goals: selectedGoals,
          onboardingCompleted: false,
        },
        { merge: true },
      );
      navigate('/onboarding/setup', { replace: true });
    } catch {
      setError('Unable to save goals right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/onboarding/setup', { replace: true });
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
            <span>Step 2 of 3</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-6 rounded-full bg-emerald-400" />
              <span className="h-1.5 w-6 rounded-full bg-emerald-400" />
              <span className="h-1.5 w-6 rounded-full bg-emerald-800/60" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              What is your primary goal?
            </h1>
            <p className="text-sm text-emerald-100/80">
              This helps us tailor your workout plan. You can select more than one.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {GOALS.map(goal => {
              const active = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={[
                    'flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition',
                    active
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/10 bg-black/40 hover:border-emerald-500/40',
                  ].join(' ')}
                >
                  <div>
                    <p
                      className={[
                        'text-sm font-semibold',
                        active ? 'text-emerald-300' : 'text-emerald-50',
                      ].join(' ')}
                    >
                      {goal.title}
                    </p>
                    <p className="text-xs text-emerald-100/80">{goal.subtitle}</p>
                  </div>
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full border',
                      active
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                        : 'border-white/15 bg-black/40 text-transparent',
                    ].join(' ')}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-semibold text-emerald-950 shadow-[0_20px_60px_rgba(34,197,94,0.6)] transition hover:shadow-[0_24px_70px_rgba(34,197,94,0.8)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Continue'}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
