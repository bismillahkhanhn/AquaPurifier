import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

const USERS_COLLECTION = 'users';

function sanitizeProfile(data: Partial<UserProfile>): Partial<UserProfile> {
  const allowed: Partial<UserProfile> = {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName || data.name || '',
    name: data.displayName || data.name || '',
    phoneNumber: data.phoneNumber || '',
    role: data.role,
    dealerStatus: data.dealerStatus,
    accountStatus: data.accountStatus,
    companyName: data.companyName || '',
    gstNumber: data.gstNumber || '',
    savedAddresses: Array.isArray(data.savedAddresses) ? data.savedAddresses : [],
  };
  Object.keys(allowed).forEach((key) => {
    if (allowed[key as keyof UserProfile] === undefined) {
      delete allowed[key as keyof UserProfile];
    }
  });
  return allowed;
}

export async function createUserProfile(
  uid: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, uid);
  const payload = {
    ...sanitizeProfile({ ...profile, uid }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(ref, payload, { merge: false });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (data.uid !== uid || !['customer', 'dealer', 'admin'].includes(data.role)) {
    throw new Error('Your account profile is invalid or does not match your sign-in. Contact support.');
  }
  if (data.role !== 'admin') {
    const validAccountStatuses = ['active', 'pending', 'suspended'];
    const validDealerStatuses = ['none', 'pending', 'approved', 'rejected'];
    if (!validAccountStatuses.includes(data.accountStatus) ||
      !validDealerStatuses.includes(data.dealerStatus)) {
      throw new Error('Your account status is invalid. Contact support.');
    }
    if (data.role === 'customer' &&
      (data.dealerStatus !== 'none' || data.accountStatus !== 'active')) {
      throw new Error('Your customer account status is invalid. Contact support.');
    }
    if (data.role === 'dealer' && data.dealerStatus === 'approved' &&
      data.accountStatus !== 'active') {
      throw new Error('Your dealer approval status is inconsistent. Contact support.');
    }
  }
  return data as UserProfile;
}

export async function ensureUserProfile(
  uid: string,
  profile: Partial<UserProfile>
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) return existing;
  await createUserProfile(uid, profile);
  const created = await getUserProfile(uid);
  if (!created) {
    throw new Error('Profile creation failed after authentication.');
  }
  return created;
}

export async function updateUserProfile(
  uid: string,
  updates: Pick<UserProfile, 'displayName' | 'phoneNumber' | 'savedAddresses'>
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    ...updates,
    name: updates.displayName,
    updatedAt: new Date().toISOString(),
  });
}
