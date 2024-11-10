import React, { useEffect, useRef, useState } from "react";
import useChatStore from "../../lib/chatStore";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { auth, storage } from "../../lib/firebase";
import useFriendsStore, { IsBlocked } from "../../lib/friendStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useUserStore } from "../../lib/userStore";
import translateText from "../../utils/googleTranslate";

const Chat = ({ friend }) => {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { currentUser } = useUserStore();
  const [spinnerLoad, setSpinnerLoad] = useState(false);
  const { activeFriend } = useFriendsStore();
  const chatContainerRef = useRef(null);
  const isLoadingMore = useRef(false);
  const audioRef = useRef(new Audio("/notification.mp3"));
  const lastMessageRef = useRef(null); // Track the last message ID or timestamp
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  const {
    messages,
    loadInitialMessages,
    sendMessage,
    loadMoreMessages,
    setTypingStatus,
    stopTyping,
    listenToTypingStatus,
    typingStatus,
  } = useChatStore();
  const currUser = auth.currentUser;

  const handleEmoji = (e) => {
    setNewMessage((prev) => prev + e.emoji);
    setOpen(false);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (friend) {
      loadInitialMessages(currUser, friend);
      listenToTypingStatus(currUser.uid, friend.id);
    }
  }, [loadInitialMessages, currUser, friend, listenToTypingStatus]);

  useEffect(() => {
    if (!isLoadingMore.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Play sound and show notification on new message
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      // Check if the latest message is from the friend and different from the last tracked message
      if (
        latestMessage.senderId !== currUser.uid &&
        latestMessage.timestamp !== lastMessageRef.current
      ) {
        audioRef.current.play();
        toast.info("New message received!");
        lastMessageRef.current = latestMessage.timestamp; // Update last message ref
      }
    }
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setTypingStatus(currUser.uid, friend.id, currentUser.username);
      setIsTyping(true);
    }

    // Reset typing timeout each time the user types
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping(currUser.uid, friend.id);
      setIsTyping(false);
    }, 1500); // Adjust the delay as needed
  };

  const handleSendMessage = async () => {
    const userBlocked = await IsBlocked(currUser.uid, friend.id);
    const friendBlocked = await IsBlocked(friend.id, currUser.uid);

    if (userBlocked) {
      toast.error("You need to unblock the user before sending a message.");
      return;
    } else if (friendBlocked) {
      toast.error(
        "You cannot send a message. You might be blocked by the other user."
      );
      return;
    }

    if (image) {
      setUploading(true);
      try {
        const imageRef = ref(storage, `images/${currUser.uid}/${image.name}`);
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);

        sendMessage(currUser.uid, friend.id, null, null, imageUrl);
        setImage(null);
        setNewMessage("");
        stopTyping(currUser.uid, friend.id);
        setIsTyping(false);
      } catch (error) {
        toast.error("Image upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    } else {
      let translatedMessage;
      console.log(activeFriend?.language);
      if (activeFriend?.language) {
        translatedMessage = await translateText(
          newMessage,
          activeFriend?.language
        );
        console.log("translatedMessage", translatedMessage);
      }
      sendMessage(
        currUser.uid,
        friend.id,
        newMessage,
        translatedMessage ? translatedMessage : newMessage,
        ""
      );
      setNewMessage("");
      stopTyping(currUser.uid, friend.id); // Stop typing status after message is sent
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current.scrollTop === 0) {
      isLoadingMore.current = true;
      setSpinnerLoad(true);
      const previousScrollHeight = chatContainerRef.current.scrollHeight;
      loadMoreMessages(currUser, friend);

      setTimeout(() => {
        const currentScrollHeight = chatContainerRef.current.scrollHeight;
        chatContainerRef.current.scrollTop =
          currentScrollHeight - previousScrollHeight;
        isLoadingMore.current = false;
        setSpinnerLoad(false);
      }, 200);
    }
  };

  return friend ? (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={friend?.avatar || "./avatar.png"} />{" "}
          <div className="texts">
            <span>{friend ? friend.username : "User"}</span>
            <p>you are now on chat</p>
          </div>
        </div>
        <div className="icons">
          <FontAwesomeIcon icon="fa-solid fa-phone" size="lg" />
          <FontAwesomeIcon icon="fa-solid fa-video" size="lg" />
          <FontAwesomeIcon icon="fa-solid fa-circle-info" size="lg" />
        </div>
      </div>
      {spinnerLoad && (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status"></div>
        </div>
      )}
      <div className="center" ref={chatContainerRef} onScroll={handleScroll}>
        {messages?.map((message, index) => (
          <div
            className={`message ${
              message.senderId === currUser.uid ? "own" : ""
            }`}
            key={index}
          >
            {message.senderId !== currUser.uid && (
              <img src={friend?.avatar || "./avatar.png"} />
            )}
            <div className="texts">
              {message.imageUrl ? (
                <img src={message.imageUrl} alt="Sent" className="sent-image" />
              ) : (
                <p>
                  {message?.senderId === currUser?.uid
                    ? message?.text
                    : message?.translatedText
                    ? message.translatedText
                    : message?.text}
                </p>
              )}
              <span>
                {new Date(message.timestamp).toLocaleDateString()}{" "}
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="typing-status">
        {/* <span>{friend.username}</span> */}
        {typingStatus?.isTyping &&
          typingStatus.typistUsername === friend.username && (
            <div className="typing-indicator">
              <span className="typing-text">{friend.username} is typing</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <div className="bottom">
          <div className="icons">
            <div className="emoji">
              <img
                src="./emoji1.png"
                alt="Emoji"
                onClick={() => setOpen((prev) => !prev)}
              />
              <div className="picker">
                <EmojiPicker open={open} onEmojiClick={handleEmoji} />
              </div>
            </div>
            <label htmlFor="imageInput">
              <img src="/gallery.png" alt="Image" />
            </label>
            <input
              type="file"
              id="imageInput"
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <img src="/images.png" alt="translate" />
          <input
            type="text"
            placeholder="type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            disabled={uploading}
          />
          {image && <p>{image.name}</p>}
          <button type="submit" className="sendButton" disabled={uploading}>
            {uploading ? "Uploading..." : image ? "Send Image" : "Send"}
          </button>
        </div>
      </form>
    </div>
  ) : (
    <div></div>
  );
};

export default Chat;
