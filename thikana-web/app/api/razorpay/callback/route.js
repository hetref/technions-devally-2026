import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Razorpay OAuth 2.0 Callback
 *
 * Uses the Firestore REST API to persist tokens, bypassing firebase-admin
 * so we don't depend on a service-account key.
 */

const RAZORPAY_CLIENT_ID = "SLeScip97TQvDd";
const RAZORPAY_CLIENT_SECRET = "Wbg4DBZHy8s5VUOvikrLGV9P";
const RAZORPAY_REDIRECT_URI = "http://localhost:3000/api/razorpay/callback";
const RAZORPAY_TOKEN_URL = "https://auth.razorpay.com/token";

const FIREBASE_PROJECT_ID = "technions-thikana";
const FIREBASE_API_KEY = "AIzaSyAmeiJL30TNVLwcdxQeYG-RNmnAQCzmCb4";

// ---- Firestore REST helpers ----
const firestoreUrl = (path) =>
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;

/** Convert a plain JS object to Firestore REST "fields" format */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (typeof value === "number") {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return fields;
}

/** PATCH (merge) a Firestore document via REST */
async function firestoreMerge(collection, docId, data) {
  const fields = toFirestoreFields(data);
  const fieldPaths = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${k}`)
    .join("&");
  const url = `${firestoreUrl(`${collection}/${docId}`)}?${fieldPaths}&key=${FIREBASE_API_KEY}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`Firestore PATCH ${collection}/${docId} failed:`, err);
    throw new Error(`Firestore write failed: ${res.status}`);
  }
  return res.json();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // ---- Handle Razorpay-side errors ----
    if (error) {
      console.error("Razorpay OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/profile/settings?razorpay_error=${encodeURIComponent(
            errorDescription || error
          )}`,
          request.url
        )
      );
    }

    // ---- Validate required params ----
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/profile/settings?razorpay_error=missing_params",
          request.url
        )
      );
    }

    // ---- State validation ----
    // The state was generated client-side and stored in sessionStorage.
    // Because the callback hits the server we can't read sessionStorage here.
    // Instead, we pass the state back to the client which validates it.
    // For server-side validation in production, store the state in a
    // server-side session / cookie before redirect. For now we proceed
    // and let the client verify after redirect.

    // ---- Exchange authorisation code for tokens ----
    const tokenResponse = await fetch(RAZORPAY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: RAZORPAY_CLIENT_ID,
        client_secret: RAZORPAY_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: RAZORPAY_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL(
          `/profile/settings?razorpay_error=${encodeURIComponent(
            tokenData.error_description || tokenData.error || "token_exchange_failed"
          )}`,
          request.url
        )
      );
    }

    // ---- Destructure the token response ----
    const {
      access_token,
      refresh_token,
      token_type,
      expires_in,
      razorpay_account_id,
      public_token,
    } = tokenData;

    // ---- Persist tokens in Firestore ----
    // We need a userId. In production use a verified session cookie / JWT.
    // Here we look for a userId cookie that the frontend can set before redirect,
    // or fall-back to looking up the account by razorpay_account_id.
    //
    // PSEUDO-CODE — replace with your actual authenticated-user resolution:
    //
    //   const userId = await resolveAuthenticatedUserId(request);
    //
    // For the hackathon we read an "rzp_uid" cookie set by the frontend.

    const cookieStore = await cookies();
    const userId = cookieStore.get("rzp_uid")?.value;

    if (userId) {
      const now = new Date().toISOString();
      const expiresAt = Date.now() + expires_in * 1000;

      // 1. Save lightweight flags on the user document
      await firestoreMerge("users", userId, {
        razorpayAccountId: razorpay_account_id,
        razorpayConnected: true,
        updatedAt: now,
      });

      // 2. Save full token details in a dedicated collection
      await firestoreMerge("razorpayAccounts", userId, {
        userId,
        razorpayAccountId: razorpay_account_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenType: token_type,
        expiresIn: expires_in,
        expiresAt,
        publicToken: public_token || "",
        connectedAt: now,
        updatedAt: now,
      });
    } else {
      console.warn(
        "No userId cookie found — tokens returned but NOT persisted.",
        { razorpay_account_id }
      );
    }

    // ---- Redirect back to the settings page with success flag ----
    return NextResponse.redirect(
      new URL(
        `/profile/settings?razorpay_connected=true&state=${state}`,
        request.url
      )
    );
  } catch (err) {
    console.error("Razorpay callback error:", err);
    return NextResponse.redirect(
      new URL(
        "/profile/settings?razorpay_error=internal_error",
        request.url
      )
    );
  }
}
