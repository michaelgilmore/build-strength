import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (username: string, password: string, displayName?: string, email?: string) => Promise<{ error: Error | null }>;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, password: string, displayName?: string, email?: string) => {
    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (existingUser) {
      return { error: new Error('Username already taken') };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    // Use a generated email if none provided (Supabase requires email)
    const authEmail = email || `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@muscleforge.local`;
    
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
          username: username,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (username: string, password: string) => {
    const rawUsername = username.trim();

    // Username-first auth: try a list of possible emails for this username.
    // IMPORTANT: do not pre-query `profiles` here (RLS blocks anonymous reads and breaks login).
    const candidateEmails: string[] = [];

    // If the user typed an email, try it directly.
    if (rawUsername.includes("@")) {
      candidateEmails.push(rawUsername);
    }

    // Default generated email pattern (most accounts)
    const cleanedUsername = rawUsername.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanedUsername) {
      candidateEmails.push(`${cleanedUsername}@muscleforge.local`);
    }

    // Known legacy migration patterns
    const lowerUsername = rawUsername.toLowerCase();
    candidateEmails.push(`${lowerUsername}@gilmore.cc`, `${lowerUsername}@goggins.com`);

    let lastError: unknown = null;

    for (const email of Array.from(new Set(candidateEmails))) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        return { error: null };
      }

      lastError = error;
    }

    return {
      error: (lastError as Error) ?? new Error("Invalid login credentials"),
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
