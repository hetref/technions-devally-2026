import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  query,
  orderBy
} from "firebase/firestore";

// ==========================================
// WEBSITE OPERATIONS
// ==========================================

export const getWebsite = async (businessId, websiteId) => {
  try {
    const websiteRef = doc(db, "businesses", businessId, "websites", websiteId);
    const snap = await getDoc(websiteRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Error fetching website:", error);
    throw error;
  }
};

export const createWebsite = async (businessId, websiteData) => {
  try {
    const websitesRef = collection(db, "businesses", businessId, "websites");
    const docRef = await addDoc(websitesRef, {
      ...websiteData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...websiteData };
  } catch (error) {
    console.error("Error creating website:", error);
    throw error;
  }
};

export const updateWebsiteSettings = async (businessId, websiteId, updates) => {
  try {
    const websiteRef = doc(db, "businesses", businessId, "websites", websiteId);
    await updateDoc(websiteRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating website settings:", error);
    throw error;
  }
};

// ==========================================
// PAGE OPERATIONS
// ==========================================

export const getWebsitePages = async (businessId, websiteId) => {
  try {
    const pagesRef = collection(db, "businesses", businessId, "websites", websiteId, "pages");
    const q = query(pagesRef, orderBy("sortOrder", "asc"));
    const snap = await getDocs(q);
    
    const pages = [];
    snap.forEach((doc) => {
      pages.push({ id: doc.id, ...doc.data() });
    });
    return pages;
  } catch (error) {
    console.error("Error fetching website pages:", error);
    throw error;
  }
};

export const getPage = async (businessId, websiteId, pageId) => {
  try {
    const pageRef = doc(db, "businesses", businessId, "websites", websiteId, "pages", pageId);
    const snap = await getDoc(pageRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error("Error fetching page:", error);
    throw error;
  }
};

export const createPage = async (businessId, websiteId, pageData) => {
  try {
    const pagesRef = collection(db, "businesses", businessId, "websites", websiteId, "pages");
    const docRef = await addDoc(pagesRef, {
      ...pageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...pageData };
  } catch (error) {
    console.error("Error creating page:", error);
    throw error;
  }
};

export const savePageLayout = async (businessId, websiteId, pageId, layout) => {
  try {
    const pageRef = doc(db, "businesses", businessId, "websites", websiteId, "pages", pageId);
    await updateDoc(pageRef, {
      layout,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving page layout:", error);
    throw error;
  }
};
