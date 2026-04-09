import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session) => {
      if (!session?.user) {
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem('civicdesk_user');
        }
        return;
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('role, department, office_location')
          .eq('email', session.user.email)
          .maybeSingle();

        const userData = {
          email: session.user.email,
          id: session.user.id,
          role: data?.role || 'citizen',
          department: data?.department,
          office_location: data?.office_location,
        };
        if (!cancelled) {
          setUser(userData);
          localStorage.setItem('civicdesk_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.error('Session sync error:', err);
        if (!cancelled) setUser(null);
      }
    };

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await applySession(session);
      if (!cancelled) setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (email, password) => {
    try {
      const { data: { user: authUser }, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) return { success: false, message: signupError.message };
      if (!authUser) return { success: false, message: 'Signup failed' };

      const { error: insertError } = await supabase.from('users').insert([
        {
          email,
          role: 'citizen',
        },
      ]);

      if (insertError && insertError.code !== '23505') {
        console.error('Insert error:', insertError);
      }

      return { success: true, message: 'Signup successful. Please check your email to confirm.' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const login = async (email, password) => {
    try {
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) return { success: false, message: signInError.message };
      if (!authUser) return { success: false, message: 'Login failed' };

      let role = 'citizen';
      let department = null;
      let office_location = null;

      try {
        const { data, error: roleError } = await supabase
          .from('users')
          .select('role, department, office_location')
          .eq('email', email)
          .maybeSingle();

        if (data) {
          role = data.role || 'citizen';
          department = data.department;
          office_location = data.office_location;
        } else if (roleError && roleError.code !== 'PGRST116') {
          console.error('Role query error:', roleError);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      }

      const userData = {
        email,
        id: authUser.id,
        role,
        department,
        office_location,
      };

      setUser(userData);
      localStorage.setItem('civicdesk_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    localStorage.removeItem('civicdesk_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
