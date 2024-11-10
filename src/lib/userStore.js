import { create } from "zustand";
import { db } from "./firebase"; // Make sure to adjust the import according to your file structure
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { IsBlocked } from "./friendStore";

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  // Fetch user info based on UID
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      const sessionIDSnap = await getDoc(doc(db, "sessions", uid));
      if (docSnap.exists()) {
        const sessionId = localStorage.getItem("userID");
        if (sessionIDSnap?.data()?.sessionId != sessionId) {
          set({ currentUser: null, isLoading: false });
        } else {
          set({ currentUser: docSnap.data(), isLoading: false });
        }
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.log(err);
      set({ currentUser: null, isLoading: false });
    }
  },

  // Function to set current user in the store
  setUser: (user) => set({ currentUser: user, isLoading: false }),
}));
