"use client"

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection, query, where } from "firebase/firestore";

export default function useGetUser(userId) {
    const [user, setUser] = useState(null);
    useEffect(() => {
        if (!userId) return;

        const unsubscribe = onSnapshot(doc(db, "users", userId), (doc) => {
            if (doc.exists()) {
                setUser(doc.data());
            } else {
                setUser(null);
            }
            console.log("User data:", doc.data());
        });

        return () => unsubscribe();
    }, [userId]);

    return user;
}

export function useGetUserByUsername(username) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!username) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "users"), where("username", "==", username));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                setUser({ ...docSnap.data(), uid: docSnap.id });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [username]);

    return { user, loading };
}
