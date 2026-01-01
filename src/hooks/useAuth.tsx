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
    // Look up the email for this username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .maybeSingle();
    
    if (profileError || !profile) {
      return { error: new Error('Invalid login credentials') };
    }

    // Get the user's email from auth.users via the admin API won't work client-side
    // Instead, we need to look up via a different method
    // Since we store the generated email pattern, we can try that first
    // But for existing users with real emails, we need to check
    
    // Try the generated email pattern first
    const generatedEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@muscleforge.local`;
    
    let { error } = await supabase.auth.signInWithPassword({
      email: generatedEmail,
      password,
    });
    
    // If that fails, try to find the actual email (for legacy accounts)
    if (error) {
      // For legacy accounts, the username might be "Mike" but email is "mike@gilmore.cc"
      // We need to try common patterns or use the actual stored email
      // Since we can't query auth.users directly, we'll try the legacy email patterns
      
      // Check if username looks like an email (for david@goggins.com case)
      if (username.includes('@')) {
        const { error: emailError } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });
        if (!emailError) {
          return { error: null };
        }
      }
      
      // For the Mike case, try mike@gilmore.cc pattern
      // This is a known migration case - we'll need to handle this specially
      const lowerUsername = username.toLowerCase();
      const legacyEmails = [
        `${lowerUsername}@gilmore.cc`,
        `${lowerUsername}@goggins.com`,
      ];
      
      for (const tryEmail of legacyEmails) {
        const { error: tryError } = await supabase.auth.signInWithPassword({
          email: tryEmail,
          password,
        });
        if (!tryError) {
          return { error: null };
        }
      }
    }
    
    return { error: error as Error | null };
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
