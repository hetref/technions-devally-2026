import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const getFollowers = async (userId) => {
    try {
        const followersRef = collection(db, "users", userId, "followers");
        const followersSnapshot = await getDocs(followersRef);

        const followingRef = collection(db, "users", userId, "following");
        const followingSnapshot = await getDocs(followingRef);
        const followingIds = new Set(followingSnapshot.docs.map((d) => d.id));

        // Use doc.id (the document ID IS the follower's uid)
        const promises = followersSnapshot.docs.map(async (followerDoc) => {
            const followerUid = followerDoc.id;
            try {
                const userRef = doc(db, "users", followerUid);
                const userSnapshot = await getDoc(userRef);
                const userData = userSnapshot.exists() ? userSnapshot.data() : {};
                return {
                    uid: followerUid,
                    ...userData,
                    isFollowing: followingIds.has(followerUid),
                };
            } catch (err) {
                console.warn("Error fetching follower data for", followerUid, err);
                return { uid: followerUid, isFollowing: followingIds.has(followerUid) };
            }
        });

        const res = await Promise.all(promises);
        console.log("Follower RES", res);
        return res;
    } catch (error) {
        console.error("Error fetching followers:", error);
        throw error;
    }
};

const getFollowing = async (userId) => {
    try {
        const followingRef = collection(db, "users", userId, "following");
        const snapshot = await getDocs(followingRef);

        // Use doc.id (the document ID IS the followed user's uid)
        const promises = snapshot.docs.map(async (followDoc) => {
            const followedUid = followDoc.id;
            try {
                // Try users collection first
                const userRef = doc(db, "users", followedUid);
                const userSnapshot = await getDoc(userRef);

                if (userSnapshot.exists()) {
                    return { uid: followedUid, ...userSnapshot.data() };
                }

                // Also try businesses collection
                const bizRef = doc(db, "businesses", followedUid);
                const bizSnapshot = await getDoc(bizRef);

                if (bizSnapshot.exists()) {
                    const bizData = bizSnapshot.data();
                    return {
                        uid: followedUid,
                        businessName: bizData.businessName || bizData.business_name || bizData.name,
                        username: bizData.username,
                        profilePic: bizData.profilePic || bizData.profileImage,
                        business_type: bizData.businessType || bizData.business_type,
                        ...bizData,
                    };
                }

                // Return minimal data if neither doc exists
                return { uid: followedUid, businessName: "Unknown", username: followedUid };
            } catch (err) {
                console.warn("Error fetching user data for", followedUid, err);
                return { uid: followedUid, businessName: "Unknown", username: followedUid };
            }
        });

        const res = await Promise.all(promises);
        console.log("Following RES", res);
        return res;
    } catch (error) {
        console.error("Error fetching following:", error);
        throw error;
    }
};

export { getFollowers, getFollowing };