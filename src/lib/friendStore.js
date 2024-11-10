import { create } from "zustand";
import { db } from "./firebase"; 
import {
  doc,
  getDoc,
  onSnapshot,
  arrayUnion,
  updateDoc,
  writeBatch,
  arrayRemove,
} from "firebase/firestore";

const useFriendsStore = create((set) => ({
  friends: [], // State to hold friends list
  isLoading: true,
  activeFriend: null,
  setActiveFriend: (friend) => {
    set({ activeFriend: friend });
  },

  // Load friends from Firestore
  loadFriends: (userId) => {
    const userDocRef = doc(db, "users", userId);

    onSnapshot(userDocRef, async (docSnapshot) => {
      const data = docSnapshot.data();

      if (data && data.friends) {
        const friendIds = data.friends; // Array of friend userIds
        try {
          // Fetch details for each friend
          const promises = friendIds.map(async (friendId) => {
            const friendDocRef = doc(db, "users", friendId);
            const friendDocSnap = await getDoc(friendDocRef);

            if (friendDocSnap.exists()) {
              return { id: friendId, ...friendDocSnap.data() };
            } else {
              return null;
            }
          });

          const friendsData = (await Promise.all(promises)).filter(Boolean); // Filter out any null results
          set({ friends: friendsData, isLoading: false });
        } catch (error) {
          console.error("Error loading friend details:", error);
          set({ friends: [], isLoading: false }); // Handle any error scenarios
        }
      }
    });
  },

  // Add friends in both
  addFriend: async (userId, friendId) => {
    const userDocRef = doc(db, "users", userId);
    const friendDocRef = doc(db, "users", friendId);

    try {
      // Use a Firestore batch to update both users in a single operation
      const batch = writeBatch(db);

      // Add friendId to the user's friends array
      batch.update(userDocRef, {
        friends: arrayUnion(friendId),
      });

      // Add userId to the friend's friends array
      batch.update(friendDocRef, {
        friends: arrayUnion(userId),
      });

      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  },

  blockUser: async (userId, friendUserId) => {
    const userDocRef = doc(db, "users", userId);

    try {
      await updateDoc(userDocRef, {
        blocked: arrayUnion(friendUserId), // Add the blocked user to the blocked array
      });
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  },

  unblockUser: async (userId, blockedUserId) => {
    const userDocRef = doc(db, "users", userId);

    try {
      await updateDoc(userDocRef, {
        blocked: arrayRemove(blockedUserId), // Remove the blocked user from the blocked array
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  },
}));

// Function to check if a user is blocked

export const IsBlocked = async (userId, friendId) => {
  if (!friendId || !userId) {
    return false; // Return false if any ID is missing
  }

  const userDocRef = doc(db, "users", userId); // Get the document for the current user
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    return userData.blocked.includes(friendId); // Check if friendId is in the blocked array of userId
  }

  return false; // Default to not blocked if user data does not exist
};

export default useFriendsStore;
