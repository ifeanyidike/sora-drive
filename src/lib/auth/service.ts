import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { app } from "@/lib/firebase";

export class AuthService {
  private auth;
  private googleProvider;

  constructor() {
    this.auth = getAuth(app);
    this.googleProvider = new GoogleAuthProvider();
  }

  async createUser(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }

  async signOut() {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  getCurrentUser(): Promise<FirebaseUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  getUser() {
    const user = this.auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };
    } else {
      return null;
    }
  }

  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      callback(user);
    });
    return () => unsubscribe();
  }

  getAuthErrorMessage(error: any): string {
    switch (error.code) {
      case "auth/user-not-found":
        return "User not found. Please check your email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/email-already-in-use":
        return "Email already in use. Please use a different email.";
      case "auth/weak-password":
        return "Weak password. Please choose a stronger password. It should be at least 6 characters long.";
      case "auth/invalid-email":
        return "Invalid email format. Please enter a valid email address.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed before completion.";
      case "auth/cancelled-popup-request":
        return "The sign-in operation was cancelled.";
      case "auth/popup-blocked":
        return "Sign-in popup was blocked by the browser.";
      default:
        return "An unknown error occurred. Please try again.";
    }
  }
}

export const authService = new AuthService();
