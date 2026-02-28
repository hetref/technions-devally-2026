import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { encodeGeohash } from "@/lib/geohash";

/**
 * Call when a business sets or updates their location during registration or profile update.
 * Writes to both `businesses/{businessId}` and `location_index/{geohashCell}`.
 */
export async function registerBusinessLocation(businessId, businessData, lat, lon) {
  const geohashCell = encodeGeohash(lat, lon);

  await Promise.all([
    setDoc(
      doc(db, "businesses", businessId),
      {
        ...businessData,
        location: { latitude: lat, longitude: lon },
        postCount: businessData.postCount ?? 0,
        lastPostedAt: businessData.lastPostedAt ?? null,
      },
      { merge: true }
    ),
    setDoc(
      doc(db, "location_index", geohashCell),
      { business_ids: arrayUnion(businessId) },
      { merge: true }
    ),
  ]);
}

/**
 * Call when a business creates a post.
 * Creates the post document and increments business counters atomically.
 */
export async function createPostWithCounters(businessId, postData) {
  await Promise.all([
    addDoc(collection(db, "posts"), {
      uid: businessId,
      likeCount: 0,
      createdAt: serverTimestamp(),
      ...postData,
    }),
    updateDoc(doc(db, "businesses", businessId), {
      postCount: increment(1),
      lastPostedAt: serverTimestamp(),
    }),
  ]);
}

/**
 * Call when a business deletes a post.
 * Removes the post and decrements the business counter.
 */
export async function deletePostWithCounters(businessId, postId) {
  await Promise.all([
    deleteDoc(doc(db, "posts", postId)),
    updateDoc(doc(db, "businesses", businessId), {
      postCount: increment(-1),
    }),
  ]);
}

/**
 * Call when a business changes their location.
 * Updates the business document and migrates the location_index entries.
 */
export async function updateBusinessLocation(businessId, oldLat, oldLon, newLat, newLon) {
  const oldCell = encodeGeohash(oldLat, oldLon);
  const newCell = encodeGeohash(newLat, newLon);

  const writes = [
    updateDoc(doc(db, "businesses", businessId), {
      location: { latitude: newLat, longitude: newLon },
    }),
  ];

  if (oldCell !== newCell) {
    writes.push(
      updateDoc(doc(db, "location_index", oldCell), {
        business_ids: arrayRemove(businessId),
      }),
      setDoc(
        doc(db, "location_index", newCell),
        { business_ids: arrayUnion(businessId) },
        { merge: true }
      )
    );
  }

  await Promise.all(writes);
}
