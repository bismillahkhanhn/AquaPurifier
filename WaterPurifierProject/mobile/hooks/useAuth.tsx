import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/user';
import { UserProfile } from '../types';
import { registerForPushNotifications } from '../services/notifications';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  profileError: '',
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setProfileError('');
      return;
    }
    try {
      const data = await getUserProfile(currentUser.uid);
      if (data?.accountStatus === 'suspended') {
        setProfile(null);
        setProfileError('This account has been suspended. Contact support for assistance.');
      } else {
        setProfile(data);
      }
      if (!data) {
        setProfileError('Your account profile is missing from Firestore. Complete registration or contact support.');
      } else if (data.accountStatus !== 'suspended') {
        setProfileError('');
        registerForPushNotifications(currentUser.uid).catch((error) => {
          console.warn('Push notification registration failed', error);
        });
      }
    } catch (error) {
      console.warn('Failed to load user profile', error);
      setProfile(null);
      const code = error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : '';
      setProfileError(
        code === 'permission-denied'
          ? 'Firebase denied profile access. Confirm the published Firestore rules and Firebase project.'
          : error instanceof Error
            ? error.message
            : 'Unable to load your account profile.'
      );
    }
  };

  const refreshProfile = async () => {
    await loadProfile(auth.currentUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      await loadProfile(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
