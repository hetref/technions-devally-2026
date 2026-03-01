import { getDoc, doc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CryptoJS from "crypto-js";
import Razorpay from "razorpay";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key";

/**
 * Resolve a userId that could be either a Firebase UID or a username
 * Returns { uid, userData } or null
 */
async function resolveUser(userId) {
  // First, try direct document lookup (Firebase UID)
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { uid: userDocSnap.id, userData: userDocSnap.data() };
    }
  } catch (e) {
    console.log("Direct doc lookup failed for:", userId);
  }

  // If not found, try querying by username field
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { uid: userDoc.id, userData: userDoc.data() };
    }
  } catch (e) {
    console.log("Username query failed for:", userId);
  }

  return null;
}

export async function POST(req) {
  try {
    console.log("Create product order API called");
    const body = await req.json();
    console.log("Request body:", body);

    const { userId, amount } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Valid amount is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating order for user ${userId} with amount ${amount}`);

    // Helper: create Razorpay order with given credentials
    const createOrderWithCredentials = async (keyId, keySecret) => {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
        notes: { userId, businessId: userId },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        keyId: keyId,
      };
    };

    // Step 1: Resolve the userId (could be username OR Firebase UID)
    const resolved = await resolveUser(userId);

    if (resolved) {
      const { uid, userData } = resolved;
      console.log(`Resolved user: ${userId} -> UID: ${uid}`);

      // Step 2: Try business-specific Razorpay credentials
      if (
        userData.razorpayInfo &&
        userData.razorpayInfo.razorpayKeyId &&
        userData.razorpayInfo.razorpayKeySecret
      ) {
        try {
          const decryptedKeyId = CryptoJS.AES.decrypt(
            userData.razorpayInfo.razorpayKeyId,
            ENCRYPTION_KEY
          ).toString(CryptoJS.enc.Utf8);

          const decryptedKeySecret = CryptoJS.AES.decrypt(
            userData.razorpayInfo.razorpayKeySecret,
            ENCRYPTION_KEY
          ).toString(CryptoJS.enc.Utf8);

          if (decryptedKeyId && decryptedKeySecret) {
            console.log("Using business-specific Razorpay credentials");
            const order = await createOrderWithCredentials(
              decryptedKeyId,
              decryptedKeySecret
            );
            return new Response(JSON.stringify(order), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (decryptError) {
          console.error(
            "Error with business Razorpay keys:",
            decryptError.message
          );
          console.log("Falling back to system credentials");
        }
      } else {
        console.log("No business Razorpay credentials found for this user");
      }
    } else {
      console.log(`Could not resolve user: ${userId}`);
    }

    // Step 3: Fallback to system/default Razorpay credentials
    console.log("Using fallback system Razorpay credentials");

    const systemKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const systemKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!systemKeyId || !systemKeySecret) {
      console.error("System Razorpay credentials not configured");
      return new Response(
        JSON.stringify({
          error:
            "Payment system not configured. Please add your Razorpay keys in Settings > Payment Settings.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const order = await createOrderWithCredentials(
        systemKeyId,
        systemKeySecret
      );
      return new Response(
        JSON.stringify({ ...order, isSystemOrder: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (systemOrderError) {
      console.error(
        "Error creating order with system credentials:",
        systemOrderError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to create payment order. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
