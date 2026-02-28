/**
 * seed-posts.mjs
 *
 * Seeds 10 dummy posts (5 per business user) into Firestore,
 * ensures business docs have all fields the Recommendation API needs,
 * populates location_index for geohash proximity queries,
 * and sets up cross-following so the feed has both "followed" and "nearby" posts.
 *
 * Usage:
 *   node seed-posts.mjs
 *
 * Prerequisites:
 *   npm install firebase-admin ngeohash uuid
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import ngeohash from "ngeohash";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Firebase Admin init ──────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(__dirname, "..", "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// ── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_USERS = [
  {
    uid: "l5GRz4Ou3PS32rBo8gQyF3mTQyg2",
    email: "contact@aryanshinde.in",
    businessName: "Aryan's Tech Studio",
    username: "aryantech-82341",
    businessType: "Technology",
    business_type: "Technology",
    adminName: "Aryan Shinde",
    location: { latitude: 18.5204, longitude: 73.8567 }, // Pune centre
    profilePic:
      "https://firebasestorage.googleapis.com/v0/b/recommendation-system-62a42.appspot.com/o/assets%2Favatar.png?alt=media&token=7782c79f-c178-4b02-8778-bb3b93965aa5",
  },
  {
    uid: "9A2G44xiNbYBvZsmOk80Imfcen72",
    email: "my-food@aryanshinde.in",
    businessName: "Aryan's Food Corner",
    username: "aryanfood-59104",
    businessType: "Restaurant",
    business_type: "Restaurant",
    adminName: "Aryan Shinde",
    location: { latitude: 18.5230, longitude: 73.8590 }, // ~300 m away
    profilePic:
      "https://firebasestorage.googleapis.com/v0/b/recommendation-system-62a42.appspot.com/o/assets%2Favatar.png?alt=media&token=7782c79f-c178-4b02-8778-bb3b93965aa5",
  },
];

// Sample image URLs (royalty-free placeholder images)
const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80",
  "https://images.unsplash.com/photo-1432139509613-5c4255a1d769?w=800&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
];

// Posts for Aryan's Tech Studio
const TECH_POSTS = [
  {
    title: "New AI Workshop This Weekend!",
    content:
      "Join us for an intensive hands-on AI/ML workshop this Saturday. We'll cover everything from prompt engineering to building your first neural network. Limited seats available — register now!",
  },
  {
    title: "Our Lab Just Got a Major Upgrade",
    content:
      "We've installed 10 brand new M3 Mac Studios in our co-working space. Whether you're a developer, designer, or content creator — come experience the speed difference.",
  },
  {
    title: "Free Coding Bootcamp for Beginners",
    content:
      "Starting next Monday, a completely free 5-day coding bootcamp covering HTML, CSS, and JavaScript. No prior experience needed. Spread the word!",
  },
  {
    title: "Tech Meetup: React vs Next.js in 2026",
    content:
      "This Thursday at 6 PM — an open panel discussion on the evolving React ecosystem. Pizza and chai on us. RSVP through our page!",
  },
  {
    title: "New High-Speed WiFi Installed",
    content:
      "We've upgraded to a 1 Gbps symmetric fiber connection. Perfect for developers, streamers, and anyone who needs blazing fast internet. Come check it out!",
  },
];

// Posts for Aryan's Food Corner
const FOOD_POSTS = [
  {
    title: "Fresh Paneer Tikka - Today's Special!",
    content:
      "Smoky, juicy paneer tikka straight from the tandoor. Paired with our signature mint chutney and fresh naan. Available for dine-in and takeaway!",
  },
  {
    title: "New Menu Alert: Monsoon Specials",
    content:
      "Introducing our monsoon menu — hot pakoras, masala chai, and corn bhel. Perfect comfort food for rainy days in Pune. Come warm up with us!",
  },
  {
    title: "Weekend Brunch Buffet at Just ₹299",
    content:
      "This Saturday & Sunday, enjoy unlimited brunch with 15+ dishes including parathas, poha, dosa, fresh juices, and desserts. Family-friendly and vegetarian options available.",
  },
  {
    title: "Customer Favourite: Butter Chicken Thali",
    content:
      "Our butter chicken thali has been voted the #1 dish by our regulars. Rich, creamy gravy with tender chicken, served with rice, naan, raita, and salad. Try it today!",
  },
  {
    title: "Late Night Delivery Now Available",
    content:
      "Craving midnight snacks? We now deliver until 1 AM! From rolls and biryani to desserts — order through our page or call us directly. Pune, we've got you covered.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function encodeGeohash(lat, lon, precision = 5) {
  return ngeohash.encode(lat, lon, precision);
}

// ── Seed logic ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const batch = db.batch();
  const locationIndexUpdates = {}; // geohash → [businessId, ...]

  // ── 1. Upsert business documents ──────────────────────────────────────────
  for (const biz of BUSINESS_USERS) {
    const bizRef = db.collection("businesses").doc(biz.uid);

    batch.set(
      bizRef,
      {
        businessName: biz.businessName,
        username: biz.username,
        businessType: biz.businessType,
        business_type: biz.business_type,
        business_categories: [],
        adminName: biz.adminName,
        email: biz.email,
        plan: "free",
        adminId: biz.uid,
        location: biz.location,
        postCount: 5, // we're seeding 5 posts per business
        lastPostedAt: FieldValue.serverTimestamp(),
        profilePic: biz.profilePic,
      },
      { merge: true }
    );

    // ── Also ensure user doc exists with required fields ──────────────────
    const userRef = db.collection("users").doc(biz.uid);
    batch.set(
      userRef,
      {
        businessName: biz.businessName,
        business_type: biz.business_type,
        name: biz.adminName,
        email: biz.email,
        role: "business",
        username: biz.username,
        profilePic: biz.profilePic,
        uid: biz.uid,
        plan: "free",
      },
      { merge: true }
    );

    // ── Collect geohash cells ─────────────────────────────────────────────
    const cell = encodeGeohash(biz.location.latitude, biz.location.longitude);
    if (!locationIndexUpdates[cell]) locationIndexUpdates[cell] = [];
    locationIndexUpdates[cell].push(biz.uid);

    console.log(
      `  ✅ Business: ${biz.businessName} (${biz.uid}) → geohash: ${cell}`
    );
  }

  // ── 2. Set up cross-following so each user sees the other's posts ─────────
  //    user1 follows user2, user2 follows user1
  const user1 = BUSINESS_USERS[0].uid;
  const user2 = BUSINESS_USERS[1].uid;

  batch.set(
    db.collection("users").doc(user1).collection("following").doc(user2),
    { followedAt: FieldValue.serverTimestamp() }
  );
  batch.set(
    db.collection("users").doc(user2).collection("following").doc(user1),
    { followedAt: FieldValue.serverTimestamp() }
  );
  console.log("  ✅ Cross-following set up between both users\n");

  // ── 3. Create posts ───────────────────────────────────────────────────────

  const allPosts = [
    ...TECH_POSTS.map((p, i) => ({ ...p, bizIndex: 0, postIndex: i })),
    ...FOOD_POSTS.map((p, i) => ({ ...p, bizIndex: 1, postIndex: i })),
  ];

  // Distribute posts across the last 5 days with staggered times
  const postTimeOffsets = [4, 18, 32, 56, 80]; // hours ago

  for (const post of allPosts) {
    const biz = BUSINESS_USERS[post.bizIndex];
    const postId = uuidv4();
    const postRef = db.collection("posts").doc(postId);
    const imageUrl = SAMPLE_IMAGES[(post.bizIndex * 5 + post.postIndex) % SAMPLE_IMAGES.length];
    const createdAt = hoursAgo(postTimeOffsets[post.postIndex]);

    batch.set(postRef, {
      uid: biz.uid,
      title: post.title,
      caption: post.title,
      content: post.content,
      mediaUrl: imageUrl,
      imageUrl: imageUrl,
      businessType: biz.businessType,
      likeCount: Math.floor(Math.random() * 80) + 5,
      createdAt: createdAt,
      interactions: {
        likeCount: Math.floor(Math.random() * 80) + 5,
        viewCount: Math.floor(Math.random() * 300) + 50,
        shareCount: Math.floor(Math.random() * 20),
        lastWeekLikes: Math.floor(Math.random() * 30),
        lastWeekViews: Math.floor(Math.random() * 150),
      },
    });

    console.log(
      `  📝 Post: "${post.title}" → ${biz.businessName} (${postId.substring(0, 8)}...)`
    );
  }

  // ── 4. Write location_index documents ─────────────────────────────────────
  for (const [cell, businessIds] of Object.entries(locationIndexUpdates)) {
    const cellRef = db.collection("location_index").doc(cell);
    batch.set(
      cellRef,
      { business_ids: FieldValue.arrayUnion(...businessIds) },
      { merge: true }
    );
    console.log(`\n  📍 location_index/${cell} → [${businessIds.join(", ")}]`);
  }

  // ── 5. Commit everything in one atomic batch ──────────────────────────────
  console.log("\n⏳ Committing batch write to Firestore...");
  await batch.commit();
  console.log("✅ Batch committed successfully!\n");

  // ── 6. Verify by reading back ─────────────────────────────────────────────
  console.log("🔍 Verifying seed data...\n");

  for (const biz of BUSINESS_USERS) {
    const bizDoc = await db.collection("businesses").doc(biz.uid).get();
    if (bizDoc.exists) {
      const data = bizDoc.data();
      console.log(`  ✅ businesses/${biz.uid}:`);
      console.log(`     businessName: ${data.businessName}`);
      console.log(`     businessType: ${data.businessType}`);
      console.log(`     username: ${data.username}`);
      console.log(
        `     location: (${data.location?.latitude}, ${data.location?.longitude})`
      );
      console.log(`     postCount: ${data.postCount}`);
      console.log(`     lastPostedAt: ${data.lastPostedAt?.toDate?.() || data.lastPostedAt}`);
    } else {
      console.log(`  ❌ businesses/${biz.uid} NOT FOUND`);
    }
  }

  // Count posts per user
  for (const biz of BUSINESS_USERS) {
    const postsSnap = await db
      .collection("posts")
      .where("uid", "==", biz.uid)
      .get();
    console.log(
      `\n  📊 ${biz.businessName}: ${postsSnap.size} posts in Firestore`
    );
  }

  // Check location_index
  for (const [cell] of Object.entries(locationIndexUpdates)) {
    const cellDoc = await db.collection("location_index").doc(cell).get();
    if (cellDoc.exists) {
      const ids = cellDoc.data().business_ids || [];
      console.log(`  📍 location_index/${cell}: ${ids.length} businesses`);
    }
  }

  // Check following
  const f1 = await db
    .collection("users")
    .doc(user1)
    .collection("following")
    .get();
  const f2 = await db
    .collection("users")
    .doc(user2)
    .collection("following")
    .get();
  console.log(`\n  👤 User ${user1.substring(0, 8)}... follows ${f1.size} businesses`);
  console.log(`  👤 User ${user2.substring(0, 8)}... follows ${f2.size} businesses`);

  console.log("\n🎉 Seed complete! Your feed should now show posts.\n");
  console.log("Test the API:");
  console.log(
    `  curl "http://localhost:8000/feed/${user1}?lat=18.5204&lon=73.8567&limit=20"`
  );
  console.log(
    `  curl "http://localhost:8000/feed/${user2}?lat=18.5230&lon=73.8590&limit=20"`
  );

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
