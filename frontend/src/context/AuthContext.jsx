import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
        });
        // We do not cleanup the snapshot listener here because it needs to stay alive
        // for the duration of the auth session. It will be torn down on logout/unmount.
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const docRef = doc(db, "users", userCredential.user.uid);
    const docSnap = await getDoc(docRef);
    const userData = docSnap.exists() ? docSnap.data() : {};
    setUser({ uid: userCredential.user.uid, email: userCredential.user.email, ...userData });
    navigate("/dashboard");
  };

  const register = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = {
      name,
      email,
      createdAt: new Date().toISOString()
    };
    // Save to Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    setUser({ uid: userCredential.user.uid, ...newUser });
    navigate("/dashboard");
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/login");
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

