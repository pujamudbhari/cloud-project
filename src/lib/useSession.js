import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const useSession = () => {
  async function addToActiveSession() {
    var sesID = gen();
    localStorage.setItem("userID", sesID);
    await setDoc(doc(db, "sessions", auth.currentUser.uid), {
      sessionId: sesID,
    });
  }

  function gen() {
    var buf = new Uint8Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0];
  }

  return { addToActiveSession };
};
