import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Sign up with email and password
export async function signUp(email: string, password: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}

// Get user role
export async function getUserRole(): Promise<'admin' | 'user' | null> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return null;
  }

  // TODO: Implement role checking logic using Firestore
  // This will be implemented once we have the user collection structure set up
  return 'user';
}

// Check if user has admin privileges
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}