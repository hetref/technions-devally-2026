"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Minus, Plus, ShoppingCart, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { recordPurchase, updateProduct, deleteProduct } from "@/lib/inventory-operations";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/CartContext";
import { usePathname, useParams } from "next/navigation";
import { resolveBusinessId, getBusinessName } from "@/lib/business-utils";

/**
 * ProductDialog - A component for displaying and interacting with product details
 *
 * @param {Object} props - Component props
 * @param {Object} props.product - The product data to display
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when closing the dialog
 * @param {string} props.userId - The ID of the current user
 * @param {Object} props.userData - The current user's data
 * @param {string} props.userType - The type of user (customer or business)
 * @param {Function} props.onEditProduct - Function to call when editing a product
 * @param {Function} props.onDeleteProduct - Function to call when deleting a product
 */
export default function ProductDialog({
  product,
  isOpen,
  onClose,
  userId,
  userData,
  userType = "customer",
  onEditProduct,
  onDeleteProduct,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProduct, setEditableProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [businessName, setBusinessName] = useState("Store");
  const { addToCart } = useCart();
  const pathname = usePathname();
  const params = useParams();

  // Calculate total price based on quantity
  const totalPrice = () => (product?.price * quantity).toFixed(2);

  // Extract business ID from URL parameters - optimized for the current route structure
  const extractBusinessId = () => {
    // First, try to get the username from route parameters (most common case)
    if (params?.username) {
      console.log("Extracted business ID from route parameter:", params.username);
      return params.username;
    }

    // Extract from pathname segments as fallback
    if (pathname) {
      console.log("Current pathname:", pathname);
      const segments = pathname.split("/").filter(Boolean);

      // Handle different profile route patterns
      if (segments.length >= 1) {
        // For routes like /[username] or /[username]/... 
        // The username is typically the first segment after the initial route parts
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          // Skip common route segments that aren't usernames
          if (!['portal', 'profile', 'business-profile', 'products', 'services'].includes(segment)) {
            // This could be a username/business ID
            console.log("Extracted business ID from pathname segment:", segment);
            return segment;
          }
        }
      }
    }

    // Use business utilities to resolve the business ID
    const resolvedId = resolveBusinessId(product?.businessId, product);
    console.log("Using resolved business ID:", resolvedId);
    return resolvedId;
  };

  // Get the business ID
  const businessId = extractBusinessId();

  // Initialize editable product when product changes or editing mode is toggled
  useEffect(() => {
    if (product && isEditing) {
      setEditableProduct({
        ...product,
      });
    }
  }, [product, isEditing]);

  // Fetch business name when component mounts or business ID changes
  useEffect(() => {
    const fetchBusinessNameData = async () => {
      if (businessId) {
        try {
          const name = await getBusinessName(businessId);
          setBusinessName(name);
          console.log("Fetched business name:", name, "for business ID:", businessId);
        } catch (error) {
          console.error("Error fetching business name:", error);
          setBusinessName("Store");
        }
      }
    };

    fetchBusinessNameData();
  }, [businessId]);

  // Helper: send invoice to server and trigger download (do not open a preview)
  async function sendInvoiceAndDownload(invoice, buyerEmail) {
    try {
      const resp = await fetch('/api/invoice/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice, buyerEmail, download: true }),
      });
      const data = await resp.json();

      if (data?.pdfBase64) {
        // create blob from base64 PDF and trigger download
        const binary = atob(data.pdfBase64);
        const len = binary.length;
        const buffer = new Uint8Array(len);
        for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceId || Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Invoice downloaded');
        return;
      }

      if (data?.invoiceHtml) {
        // fallback: download HTML file
        const blob = new Blob([data.invoiceHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceId || Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Invoice downloaded (HTML)');
        return;
      }

      if (data?.warning) {
        console.warn('Invoice send warning:', data.warning);
        toast.success('Invoice processed (check email or downloads)');
      } else if (data?.ok) {
        toast.success('Invoice emailed successfully');
      } else {
        toast.success('Invoice processed');
      }
    } catch (err) {
      console.warn('Failed to send/download invoice:', err);
      toast.error('Failed to download invoice. Email may still be sent.');
    }
  }

  // Open Razorpay payment gateway
  const openRazorpayPaymentGateway = (order, keyId, amount) => {
    console.log("Opening Razorpay payment gateway with order:", order);

    if (typeof window === "undefined" || !window.Razorpay) {
      console.error("Razorpay script not loaded");
      toast.error("Payment gateway is not available. Please try again later.");
      return;
    }

    const options = {
      key: keyId,
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      name: userData?.name || "Thikana Portal",
      description: `Purchase: ${product?.name}`,
      order_id: order.orderId,
      handler: async function (response) {
        try {
          // Record the purchase in Firebase
          await recordPurchase(userId, product.id, quantity, product.price);

          // Update product quantity in Firebase
          updateProductQuantity(product.id, product.quantity - quantity);

          // Compute GST breakdown and show invoice
          const unitPrice = Number(product.price || 0);
          const subtotal = unitPrice * quantity;
          const gstRate = Number(product.gst ?? product.gst_rate ?? 0);
          const gstAmount = subtotal * (gstRate / 100);
          const sgstAmount = gstAmount / 2;
          const cgstAmount = gstAmount / 2;
          const total = subtotal + gstAmount;

          // Prepare invoice item
          // Ensure buyerName prefers current auth user information
          const buyerName = (userData && (userData.name || userData.displayName || userData.email)) || (auth.currentUser && (auth.currentUser.displayName || auth.currentUser.email)) || 'Customer';
          const invoice = {
            invoiceId: response.razorpay_payment_id || `INV-${Date.now()}`,
            businessName: businessName || 'Seller',
            buyerName,
            items: [{ name: product.name || 'Product', qty: quantity, unit: unitPrice }],
            subtotal,
            gstRate,
            sgstAmount,
            cgstAmount,
            total,
          };

          // Trigger download of PDF (or HTML fallback) and attempt to email in background
          await sendInvoiceAndDownload(invoice, userData?.email);

          toast.success("Payment successful!");
          onClose();
        } catch (error) {
          console.error("Error recording purchase:", error);
          toast.error("Failed to record purchase. Please contact support.");
        }
      },
      prefill: {
        name: userData?.name || "",
        email: userData?.email || "",
        contact: userData?.phone || "",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Update product quantity in Firebase after purchase
  const updateProductQuantity = async (productId, newQuantity) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        quantity: newQuantity,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating product quantity:", error);
    }
  };

  // Handle "Buy Now" button click
  const handleBuyNow = async () => {
    if (!userId) {
      toast.error("Please log in to make a purchase");
      return;
    }

    setIsLoading(true);
    try {
      console.log(
        `Starting buy now for product ${product.id} with price ${totalPrice()} from business ${businessId}`
      );
      // Razorpay flow commented out for now — simulate direct purchase
      // // Calculate total amount including GST
      // const unitPrice = Number(product.price || 0);
      // const subtotal = unitPrice * quantity;
      // const gstRate = Number(product.gst ?? product.gst_rate ?? 0);
      // const gstAmount = subtotal * (gstRate / 100);
      // const totalAmount = subtotal + gstAmount;
      //
      // // Original: create order and open Razorpay
      // const order = await createRazorpayOrder(businessId, totalAmount.toFixed(2));
      // openRazorpayPaymentGateway(order, order.keyId, totalAmount);
      //
      // Direct purchase: record purchase and generate invoice
      const unitPrice = Number(product.price || 0);
      const subtotal = unitPrice * quantity;
      const gstRate = Number(product.gst ?? product.gst_rate ?? 0);
      const gstAmount = subtotal * (gstRate / 100);
      const sgstAmount = gstAmount / 2;
      const cgstAmount = gstAmount / 2;
      const totalAmount = subtotal + gstAmount;

      // Record purchase in Firestore
      await recordPurchase(userId, product.id, quantity, product.price);
      // Update product quantity
      await updateProductQuantity(product.id, product.quantity - quantity);

      // Prepare invoice
      // Ensure buyerName prefers current auth user information
      const buyerName = (userData && (userData.name || userData.displayName || userData.email)) || (auth.currentUser && (auth.currentUser.displayName || auth.currentUser.email)) || 'Customer';
      const invoice = {
        invoiceId: `INV-${Date.now()}`,
        businessName: businessName || 'Seller',
        buyerName,
        items: [{ name: product.name || 'Product', qty: quantity, unit: unitPrice }],
        subtotal,
        gstRate,
        sgstAmount,
        cgstAmount,
        total: totalAmount,
      };

      // Download invoice (PDF if available) and attempt to email in background
      await sendInvoiceAndDownload(invoice, userData?.email);

      toast.success("Purchase completed (payment bypassed)");
      onClose();
    } catch (error) {
      console.error("Error handling buy now:", error);
      toast.error(
        error.message || "Failed to process payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Add to Cart" button click
  const handleAddToCart = async () => {
    if (!auth.currentUser) {
      toast.error("Please log in to make a purchase");
      return;
    }

    console.log("Starting handleAddToCart");

    if (product.quantity < quantity) {
      toast.error(`Sorry, only ${product.quantity} items available`);
      return;
    }

    try {
      console.log("Business ID for cart:", businessId);
      console.log("Business name for cart:", businessName);

      // Make sure the product has all required properties
      const productToAdd = {
        id: product.id,
        name: product.name || "Unknown Product",
        price: product.price || 0,
        imageUrl: product.imageUrl || null,
        quantity: quantity,
        businessId: businessId,
        businessName: businessName,
      };

      console.log("Adding to cart:", {
        product: productToAdd,
        quantity,
        businessId,
        businessName,
      });

      // Check if addToCart function is available
      if (typeof addToCart !== "function") {
        console.error("addToCart is not a function", addToCart);
        toast.error(
          "Cart functionality is not available. Please try again later."
        );
        return;
      }

      // Let the CartContext use auth.currentUser.uid
      const result = await addToCart(productToAdd, quantity, businessId);

      if (result) {
        toast.success("Product added to cart!");
        onClose();
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error in handleAddToCart:", error);
      toast.error("Error: " + (error.message || "Unknown error"));
    }
  };

  // Handle saving product changes
  const handleSaveChanges = async () => {
    if (!editableProduct) return;

    setIsLoading(true);
    try {
      // Read HSN/GST from either legacy UI fields (hsn/gst) or canonical ones
      const hsnValue = (editableProduct.hsn || editableProduct.hsn_or_sac_code || "").toString().trim();
      const gstValue = editableProduct.gst ?? editableProduct.gst_rate;

      // Validate
      const hsnValid = /^\d{1,8}$/.test(hsnValue);
      const allowedGst = [0, 5, 12, 18, 28];
      const gstValid = allowedGst.includes(gstValue);

      if (!hsnValid) {
        toast.error("Please enter a valid HSN/SAC code (1 to 8 digits)");
        setIsLoading(false);
        return;
      }

      if (!gstValid) {
        toast.error("Please select a valid GST rate");
        setIsLoading(false);
        return;
      }

      // Build normalized payload including HSN/GST and SGST/CGST rates
      const sgstRate = gstValue === null || gstValue === undefined ? null : Number((gstValue / 2).toFixed(2));
      const cgstRate = sgstRate;

      const toSave = {
        ...editableProduct,
        hsn: hsnValue,
        gst: gstValue === null ? null : Number(gstValue),
        sgst: sgstRate,
        cgst: cgstRate,
      };

      // Determine owner ID for product storage. Products are stored under users/{ownerId}/products.
      const ownerId = editableProduct.businessId ?? editableProduct.userId ?? userId ?? businessId;
      console.log('Saving product to ownerId:', ownerId, 'payload:', toSave);

      await updateProduct(ownerId, toSave, imageFile);

      // Also ensure the top-level products collection has the HSN/GST fields
      try {
        if (toSave.id) {
          await setDoc(doc(db, "products", toSave.id), {
            hsn: toSave.hsn,
            gst: toSave.gst,
          }, { merge: true });
        }
      } catch (err) {
        console.warn('Failed to update root products doc (non-fatal):', err);
      }
      toast.success("Product updated successfully");
      setIsEditing(false);
      // If onEditProduct callback exists, call it to refresh the product list
      if (typeof onEditProduct === 'function') {
        onEditProduct(toSave);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: open printable invoice window (user can print to PDF)
  function openInvoiceWindow({ invoiceId, businessName, buyerName, items, subtotal, gstRate, sgstAmount, cgstAmount, total }) {
    const html = `
      <html>
      <head>
        <title>Invoice ${invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f7f7f7; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h2>Invoice ${invoiceId}</h2>
        <div><strong>Seller:</strong> ${businessName}</div>
        <div><strong>Buyer:</strong> ${buyerName || 'Customer'}</div>
        <hr/>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit</th><th class="right">Amount</th></tr>
          </thead>
          <tbody>
            ${items.map(it => `<tr><td>${it.name}</td><td class="right">${it.qty}</td><td class="right">${it.unit.toFixed(2)}</td><td class="right">${(it.unit * it.qty).toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div style="margin-top:12px; text-align:right;">
          <div>Subtotal: ₹${subtotal.toFixed(2)}</div>
          <div>SGST: ₹${sgstAmount.toFixed(2)}</div>
          <div>CGST: ₹${cgstAmount.toFixed(2)}</div>
          <h3>Total: ₹${total.toFixed(2)}</h3>
        </div>
        <script>window.onload = function(){ window.print(); }</script>
      </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      console.warn('Unable to open invoice window (popup blocked)');
    }
  }

  // Handle product update
  const handleProductUpdated = (updatedProduct) => {
    if (typeof onEditProduct === 'function') {
      onEditProduct(updatedProduct);
    }
    setIsEditing(false);
    toast.success("Product updated successfully");
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!product || !product.id) return;

    setIsDeleting(true);
    try {
      await deleteProduct(userId, product.id, product.imageUrl);
      toast.success("Product deleted successfully");
      // If onDeleteProduct callback exists, call it to update the UI
      if (typeof onDeleteProduct === 'function') {
        onDeleteProduct(product.id);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    // Reset quantity when dialog opens with a new product
    if (isOpen) {
      setQuantity(1);
      setIsEditing(false);
    }
  }, [isOpen, product]);

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        aria-describedby="product-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {!isEditing ? (
              <>
                {product.name}
                {userType === "business" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      title="Edit product"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDeleteProduct}
                      disabled={isDeleting}
                      title="Delete product"
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full">
                <Label htmlFor="product-name" className="mb-1">
                  Product Name
                </Label>
                <Input
                  id="product-name"
                  value={editableProduct?.name || ""}
                  onChange={(e) =>
                    setEditableProduct({
                      ...editableProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            )}
          </DialogTitle>
          <DialogDescription id="product-dialog-description">
            {isEditing
              ? "Edit product details"
              : "View product details and manage your purchase"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 justify-center w-full">
          <div className="w-full flex items-center justify-center">
            {isEditing ? (
              <div className="w-full">
                <Label htmlFor="product-image" className="mb-1">
                  Product Image
                </Label>
                <Input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mb-2"
                />
                {(product.imageUrl || imageFile) && (
                  <div className="mt-2 relative w-full h-48">
                    <Image
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : product.imageUrl || "/placeholder-product.jpg"
                      }
                      alt="Product image preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <Image
                src={product.imageUrl || "/placeholder-product.jpg"}
                alt={`${product.name} product image`}
                width={300}
                height={300}
                className="w-full h-64 object-contain rounded"
                priority
              />
            )}
          </div>

          {!isEditing ? (
            <>
              <p className="text-lg text-gray-800">
                {product.description || "No description available"}
              </p>
              <p className="font-bold text-xl text-center">₹{totalPrice()}</p>

              {/* Stock information */}
              <p className="text-sm text-gray-500 text-center">
                {product.quantity > 0
                  ? `${product.quantity} in stock`
                  : "Out of stock"}
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-description">Description</Label>
                <Input
                  id="product-description"
                  value={editableProduct?.description || ""}
                  onChange={(e) =>
                    setEditableProduct({
                      ...editableProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full mb-2"
                />
              </div>
              <div>
                <Label htmlFor="product-price">Price (₹)</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editableProduct?.price || 0}
                  onChange={(e) =>
                    setEditableProduct({
                      ...editableProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="w-full mb-2"
                />
              </div>
              <div>
                <Label htmlFor="product-quantity">Quantity in Stock</Label>
                <Input
                  id="product-quantity"
                  type="number"
                  min="0"
                  value={editableProduct?.quantity || 0}
                  onChange={(e) =>
                    setEditableProduct({
                      ...editableProduct,
                      quantity: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* HSN / SAC and GST Rate fields (auto-filled by AI, editable) */}
              <div>
                <Label htmlFor="product-hsn">HSN / SAC Code</Label>
                <Input
                  id="product-hsn"
                  value={editableProduct?.hsn || ""}
                  onChange={(e) =>
                    setEditableProduct({
                      ...editableProduct,
                      hsn: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="Enter HSN/SAC code (1-8 digits)"
                  className="w-full mb-2"
                />
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">GST Rate</div>
                  <select
                    value={editableProduct?.gst ?? ""}
                    onChange={(e) =>
                      setEditableProduct({
                        ...editableProduct,
                        gst: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="bg-white border rounded px-2 py-1"
                  >
                    <option value="">Select rate</option>
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>

                  {/* Manual-only mode: no AI confidence badge */}
                  <div />
                </div>
              </div>
            </div>
          )}

          {/* Quantity section for customers */}
          {userType === "customer" && product.quantity > 0 && !isEditing && (
            <div className="flex items-center justify-center">
              <label htmlFor="quantity" className="mr-2 text-lg">
                Quantity:
              </label>
              <button
                type="button"
                onClick={() =>
                  setQuantity((prevQuantity) => Math.max(1, prevQuantity - 1))
                }
                className="border rounded p-1 mr-2"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                id="quantity"
                value={quantity}
                min="1"
                max={product.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setQuantity(Math.min(product.quantity, Math.max(1, val)));
                  }
                }}
                className="border rounded p-1 w-[80px] text-center"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((prevQuantity) =>
                    Math.min(product.quantity, prevQuantity + 1)
                  )
                }
                className="border rounded p-1 ml-2"
                disabled={quantity >= product.quantity}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Buttons section - only shown to customers, not businesses */}
          {userType === "customer" && !isEditing && (
            <div className="flex gap-4">
              {product.quantity === 0 ? (
                <Button className="flex-1 w-full" disabled>
                  Out of Stock
                </Button>
              ) : (
                <>
                  <Button
                    className="flex-1"
                    onClick={handleBuyNow}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Buy Now"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={isLoading}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </>
              )}
            </div>
          )}

          {/* For business users in edit mode, show save button */}
          {userType === "business" && isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveChanges}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}