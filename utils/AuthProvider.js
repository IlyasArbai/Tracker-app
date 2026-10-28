import { createContext, useContext, useEffect, useState } from 'react';

import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync('accessToken');

        setSession(token);
      } catch (error) {
        console.error('Could not restore session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Call this after your backend successfully authenticates the user.
  async function signIn(accessToken) {
    await SecureStore.setItemAsync('accessToken', accessToken);
    setSession(accessToken);
  }

  // Clear the local session when the user logs out.
  async function signOut() {
    await SecureStore.deleteItemAsync('accessToken');
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session),
        isLoading,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
