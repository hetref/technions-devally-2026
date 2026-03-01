"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const RAZORPAY_CLIENT_ID = "SLeScip97TQvDd";
const RAZORPAY_REDIRECT_URI = "http://localhost:3000/api/razorpay/callback";
const RAZORPAY_AUTH_URL = "https://auth.razorpay.com/authorize";

/**
 * Generates a cryptographically secure random state string.
 * Stores it in sessionStorage so the callback can verify it.
 */
function generateAndStoreState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const state = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  sessionStorage.setItem("razorpay_oauth_state", state);
  return state;
}

export default function ConnectRazorpay({ isConnected = false, accountId = null }) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(isConnected);
  const [connectedAccountId, setConnectedAccountId] = useState(accountId);

  // Sync prop changes (e.g. after page refresh with fresh data)
  useEffect(() => {
    setConnected(isConnected);
    setConnectedAccountId(accountId);
  }, [isConnected, accountId]);

  // Check URL params on mount for post-callback state verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const razorpayConnected = params.get("razorpay_connected");
    const returnedState = params.get("state");
    const razorpayError = params.get("razorpay_error");

    if (razorpayError) {
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (razorpayConnected === "true") {
      // Validate state matches what we stored
      const storedState = sessionStorage.getItem("razorpay_oauth_state");
      if (storedState && returnedState === storedState) {
        setConnected(true);
        sessionStorage.removeItem("razorpay_oauth_state");
        sessionStorage.removeItem("razorpay_oauth_uid");
      }
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    setLoading(true);

    const state = generateAndStoreState();

    // Also store the user's UID so the callback knows which user initiated OAuth
    sessionStorage.setItem("razorpay_oauth_uid", user.uid);

    // Set a cookie so the server-side callback can identify the user
    document.cookie = `rzp_uid=${user.uid}; path=/; max-age=600; SameSite=Lax`;

    const params = new URLSearchParams({
      client_id: RAZORPAY_CLIENT_ID,
      response_type: "code",
      redirect_uri: RAZORPAY_REDIRECT_URI,
      scope: "read_write",
      state,
    });

    // Redirect the browser to Razorpay authorization page
    window.location.href = `${RAZORPAY_AUTH_URL}?${params.toString()}`;
  };

  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-800 dark:text-green-300">
              Razorpay Account Connected
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your Razorpay account is linked. Transactions and payment links are
              enabled.
            </p>
            {connectedAccountId && (
              <p className="text-xs text-green-500 dark:text-green-500 mt-1 font-mono">
                Account ID: {connectedAccountId}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className="border-green-300 text-green-700 dark:text-green-400"
          >
            Active
          </Badge>
        </div>

        <Button variant="outline" size="sm" onClick={handleConnect}>
          <Link2 className="h-4 w-4 mr-2" />
          Re-authorize
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Benefits */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Why connect?
        </h3>
        <ul className="space-y-2 text-sm">
          {[
            "View transactions directly on your Thikana dashboard",
            "Generate shareable payment links for customers",
            "Secure OAuth 2.0 — we never see your Razorpay password",
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Connect button */}
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="gap-2"
        size="lg"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        {loading ? "Redirecting…" : "Connect Razorpay Account"}
      </Button>

      <p className="text-xs text-muted-foreground">
        You will be redirected to Razorpay to authorize Thikana. After approval
        you&apos;ll return here automatically.
      </p>
    </div>
  );
}
