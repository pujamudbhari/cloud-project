import useFriendsStore from "../../lib/friendStore";
import "./userList.css";

const UserList = ({ user, currentUser }) => {
  const { setActiveFriend } = useFriendsStore();
  return (
    <div className="userList" onClick={() => setActiveFriend(user)}>
      <div className="item">
        <img src={user?.avatar || "./avatar.png"} />
        <div className="texts">
          <span>{user.username}</span>
          <p className="text-secondary">
            {user?.lastMessage?.senderId === currentUser.uid
              ? user?.lastMessage?.text
                ? user?.lastMessage?.text
                : user?.lastMessage?.imageUrl
                ? "Photo"
                : "Start conversation here!"
              : user?.lastMessage?.translatedText
              ? user?.lastMessage?.translatedText
              : user?.lastMessage?.imageUrl
              ? "Photo"
              : "Start conversation here!"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserList;
