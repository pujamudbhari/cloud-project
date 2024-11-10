import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../lib/userStore";
import { auth, db } from "../../../lib/firebase";
import { Button, Form, Modal, Stack } from "react-bootstrap";
import { toast } from "react-toastify";
import useFriendsStore from "../../../lib/friendStore";
import { debugErrorMap } from "firebase/auth";

const AddUser = ({ show, handleClose }) => {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const currentUser = auth.currentUser;
  const { addFriend } = useFriendsStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      console.log("users", userRef);

      const q = query(
        userRef,
        where("usernameLowercase", "==", username.toLowerCase())
      );
      console.log(q);

      const querySnapShot = await getDocs(q);
      console.log(querySnapShot);
      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
      } else {
        toast.warn("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const createTypingStatusDocument = async (chatId, username) => {
    const typingStatusRef = doc(db, "typingStatus", chatId);

    // Initialize typing status for the chat
    await setDoc(typingStatusRef, {
      chatId,
      username,
      isTyping: false,
    });
  };

  // Modified:

  const newHandleAdd = async () => {
    const friendId = user.id;

    try {
      // Make sure `currentUser` exists
      if (!currentUser) throw new Error("User not authenticated");

      await addFriend(currentUser.uid, friendId);

      // Show success message
      toast.success(`Friend added successfully!`);
    } catch (error) {
      console.error("Error adding friend:", error);

      // Show error message
      toast.error(`Failed to add friend: ${error.message}`, {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
      toast.success("User added successfully");
      handleClose();
    } catch (err) {
      console.log(err);
      toast.error("Oops! Something went wrong");
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSearch}>
          <Stack direction="horizontal" gap={2}>
            <Form.Control
              type="text"
              placeholder="Username"
              name="username"
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit">Search</Button>
          </Stack>
        </form>
        {user && (
          <Stack
            direction="horizontal"
            className="my-2 justify-content-between"
          >
            <Stack direction="horizontal" className="my-2 " gap={2}>
              <img src={user.avatar || "./avatar.png"} alt="" />
              <span>{user.username}</span>
            </Stack>
            <Button onClick={newHandleAdd}>Add User</Button>
          </Stack>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AddUser;
