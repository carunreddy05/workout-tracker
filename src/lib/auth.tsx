import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function normalizeIdentifier(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { email: '', displayNameHint: '' };
  }

  if (trimmed.includes('@')) {
    const namePart = trimmed.split('@')[0] || trimmed;
    return { email: trimmed, displayNameHint: namePart };
  }

  const safeName = trimmed.toLowerCase();
  const syntheticEmail = `${safeName}@trackfit.local`;

  return {
    email: syntheticEmail,
    displayNameHint: trimmed,
  };
}

