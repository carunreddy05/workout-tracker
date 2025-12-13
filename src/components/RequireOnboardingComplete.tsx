import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';

type OnboardingStatus = 'loading' | 'needs_onboarding' | 'complete';

export default function RequireOnboardingComplete({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus('loading');
      return;
    }

    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const snapshot = await getDoc(profileRef);
        const data = snapshot.data() as { onboardingCompleted?: boolean } | undefined;

        if (!cancelled) {
          if (data?.onboardingCompleted) {
            setStatus('complete');
          } else {
            setStatus('needs_onboarding');
          }
        }
      } catch {
        if (!cancelled) {
          setStatus('needs_onboarding');
        }
      }
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <p className="text-sm text-zinc-400">Preparing your dashboard…</p>
      </div>
    );
  }

  if (status === 'needs_onboarding') {
    return (
      <Navigate
        to="/onboarding/goals"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}

