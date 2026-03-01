import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

/**
 * Razorpay OAuth 2.0 Callback
 *
 * Flow:
 * 1. User clicks "Connect Razorpay" → browser redirects to Razorpay auth page
 * 2. User authorises → Razorpay redirects here with `code` + `state`
 * 3. We verify `state`, exchange `code` for tokens, persist them, then redirect
 *    the user back to their settings page.
 */

const RAZORPAY_CLIENT_ID = "SLeScip97TQvDd";
const RAZORPAY_CLIENT_SECRET = "Wbg4DBZHy8s5VUOvikrLGV9P";
const RAZORPAY_REDIRECT_URI = "http://localhost:3000/api/razorpay/callback";
const RAZORPAY_TOKEN_URL = "https://auth.razorpay.com/token";

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

      // 1. Save credentials on the user document (quick access from anywhere)
      await adminDb
        .collection("users")
        .doc(userId)
        .set(
          {
            razorpayAccountId: razorpay_account_id,
            razorpayConnected: true,
            updatedAt: now,
          },
          { merge: true }
        );

      // 2. Save full token details in a dedicated collection keyed by userId
      //    This keeps sensitive tokens out of the main user doc and makes
      //    them easy to query / refresh from any service.
      await adminDb
        .collection("razorpayAccounts")
        .doc(userId)
        .set(
          {
            userId,
            razorpayAccountId: razorpay_account_id,
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenType: token_type,
            expiresIn: expires_in,
            expiresAt,
            publicToken: public_token || null,
            connectedAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
    } else {
      // Fallback: log a warning. In production, always resolve the user.
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
