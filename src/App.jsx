import { Login } from "./components/login/login";
import { Signup } from "./components/signup/signup";
import Chat from "./components/Chat/Chat";
import Detail from "./components/Detail/Detail";
import { useUserStore } from "./lib/userStore";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import List from "./components/List/List";
import useFriendsStore from "./lib/friendStore";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faMagnifyingGlass,
  faPhone,
  faVideoCamera,
  faCircleInfo,
  faMicrophone,
  faImage,
  faUserPen,
  faLock,
  faGear,
  faPlus,
  faPhotoFilm,
} from "@fortawesome/free-solid-svg-icons";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { activeFriend, loadFriends } = useFriendsStore();

  library.add(
    faMagnifyingGlass,
    faPhone,
    faVideoCamera,
    faCircleInfo,
    faMicrophone,
    faImage,
    faUserPen,
    faPlus,
    faGear,
    faPhotoFilm,
    faLock
  );

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
      loadFriends(user?.uid);
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading...</div>;
  return (
    <>
      <ToastContainer position="top-right" />
      {currentUser ? (
        <main className="chat-container">
          <div className="container">
            <List />
            <Chat friend={activeFriend} />
            <Detail />
          </div>
        </main>
      ) : (
        <main className="body-wrapper">
          <div className="auth-container">
            <section className="login-section">
              <Login />
            </section>
            <section className="signup-section">
              <Signup />
            </section>
          </div>
        </main>
      )}
    </>
  );
};

export default App;
