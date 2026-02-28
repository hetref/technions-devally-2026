import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Resolves the true business ID for a product.
 * Helpful for distinguishing if a product belongs to a standalone user or a business/member.
 */
export const resolveBusinessId = (businessId, product) => {
    if (businessId) return businessId;
    if (product?.businessId) return product.businessId;
    // Fallback if the user's root UID is technically their business ID
    if (product?.userId) return product.userId;

    return "unknown";
};

/**
 * Fetches the actual name of the business from Firestore for display in the Cart.
 */
export async function getBusinessName(businessId) {
    if (!businessId || businessId === "unknown") return "Store";

    try {
        const businessDoc = await getDoc(doc(db, "businesses", businessId));
        if (businessDoc.exists() && businessDoc.data().businessName) {
            return businessDoc.data().businessName;
        }

        // Check users collection in case it's a standalone user acting as a business
        const userDoc = await getDoc(doc(db, "users", businessId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data.businessName || data.displayName || data.username || "Store";
        }

        return "Store";
    } catch (error) {
        console.error("Error fetching business name:", error);
        return "Store";
    }
}
