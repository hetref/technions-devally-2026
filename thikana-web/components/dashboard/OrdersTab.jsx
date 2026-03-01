"use client";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Package, Search, ShoppingBag, User, FileText, Star, Clock, CheckCircle,
  XCircle, AlertCircle, Truck, ChefHat, Printer, RefreshCw,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, startAfter, limit, doc, getDoc, updateDoc } from "firebase/firestore";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-hot-toast";
import Loader from "@/components/Loader";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasMore, setHasMore] = useState(true);
  const [lastOrder, setLastOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState("");

  const billRef = useRef();

  // react-to-print v3 API
  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Invoice_${selectedOrder?.orderId || "order"}`,
    onAfterPrint: () => toast.success("Invoice ready!"),
    pageStyle: `@page { size: auto; margin: 20mm; } @media print { body { -webkit-print-color-adjust: exact; } }`,
  });

  useEffect(() => { fetchOrders(); }, [timeFilter, statusFilter]);

  const fetchOrders = async (isLoadMore = false) => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      // Orders are stored in users/{uid}/orders (set by recordPurchase on buyer side)
      // OR in businesses/{uid}/orders (server-side) — we try both
      let ordersQuery = query(
        collection(db, "users", auth.currentUser.uid, "orders"),
        orderBy("timestamp", "desc")
      );

      if (timeFilter !== "all") {
        const now = new Date();
        let startDate = new Date();
        if (timeFilter === "today") startDate.setHours(0, 0, 0, 0);
        else if (timeFilter === "week") startDate.setDate(now.getDate() - 7);
        else if (timeFilter === "month") startDate.setMonth(now.getMonth() - 1);
        ordersQuery = query(ordersQuery, where("timestamp", ">=", startDate));
      }
      if (statusFilter !== "all") {
        ordersQuery = query(ordersQuery, where("status", "==", statusFilter));
      }
      if (isLoadMore && lastOrder) {
        ordersQuery = query(ordersQuery, startAfter(lastOrder), limit(10));
      } else {
        ordersQuery = query(ordersQuery, limit(10));
      }

      const querySnapshot = await getDocs(ordersQuery);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || (doc.data().timestamp ? new Date(doc.data().timestamp) : new Date()),
      }));

      setOrders((prev) => (isLoadMore ? [...prev, ...ordersData] : ordersData));
      setLastOrder(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.orderId?.toLowerCase().includes(searchLower) ||
      order.userId?.toLowerCase().includes(searchLower) ||
      order.businessName?.toLowerCase().includes(searchLower)
    );
  });

  const calculateStats = () => ({
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    completedOrders: orders.filter((o) => o.status === "completed").length,
    totalRevenue: orders.reduce((total, o) => total + (o.amount || 0), 0),
  });

  const stats = calculateStats();

  const getStatusInfo = (status) => {
    const config = {
      pending: { icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100", label: "Pending" },
      confirmed: { icon: CheckCircle, color: "text-blue-600", bgColor: "bg-blue-100", label: "Confirmed" },
      preparing: { icon: ChefHat, color: "text-purple-600", bgColor: "bg-purple-100", label: "Preparing" },
      ready: { icon: Package, color: "text-green-600", bgColor: "bg-green-100", label: "Ready" },
      shipped: { icon: Truck, color: "text-cyan-600", bgColor: "bg-cyan-100", label: "Shipped" },
      completed: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Completed" },
      cancelled: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Cancelled" },
    };
    return config[status] || config.pending;
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newOrderStatus || newOrderStatus === selectedOrder.status) {
      toast.error("Please select a different status"); return;
    }
    try {
      setUpdatingStatus(true);
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id, newStatus: newOrderStatus, businessId: auth.currentUser.uid }),
      });
      if (response.ok) {
        setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: newOrderStatus } : o));
        toast.success(`Order status updated to ${newOrderStatus}`);
        setStatusUpdateDialogOpen(false);
        setSelectedOrder(null);
        setNewOrderStatus("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-muted-foreground", sub: "All time orders" },
          { title: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "text-orange-500", valueColor: "text-orange-600", sub: "Need your attention" },
          { title: "Completed Orders", value: stats.completedOrders, icon: Package, color: "text-green-500", valueColor: "text-green-600", sub: "Successfully delivered" },
          { title: "Total Revenue", value: `₹${stats.totalRevenue.toFixed(2)}`, icon: Star, color: "text-muted-foreground", sub: "Total earnings" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.valueColor || ""}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => fetchOrders()} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Received Orders</CardTitle>
          <CardDescription>Manage and track customer orders for your products</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold">No Orders Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {searchQuery ? "No orders match your search. Try adjusting your filters." : "No orders received yet. Orders will appear here when customers make purchases."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => { setSearchQuery(""); setTimeFilter("all"); setStatusFilter("all"); }} className="mt-4 flex items-center gap-2">
                  <Search className="h-4 w-4" /> Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <Card key={order.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                    <CardHeader className="bg-muted/40 py-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">Order #{order.orderId?.substring(0, 8) || order.id?.substring(0, 8)}...</h3>
                            <Badge variant="outline" className={`${statusInfo.color} ${statusInfo.bgColor} border-0 text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />{statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.timestamp && format(new Date(order.timestamp), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">₹{order.amount?.toFixed(2)}</p>
                          <div className="flex items-center justify-end text-muted-foreground text-xs gap-1">
                            <User className="h-3 w-3" />
                            <span>{order.businessName || order.userId?.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {order.products?.map((product, idx) => (
                          <div key={idx} className="p-4 flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.productName || "Product"} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <h5 className="font-medium text-sm">{product.productName}</h5>
                              <div className="text-xs text-muted-foreground">₹{product.amount?.toFixed(2)} × {product.quantity}</div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">₹{(product.amount * product.quantity)?.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t p-4 bg-muted/20">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-medium">Total</span>
                          <span className="font-semibold">₹{order.amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline" size="sm"
                            className="flex items-center gap-1 flex-1"
                            onClick={() => { setSelectedOrder(order); setBillDialogOpen(true); }}
                          >
                            <FileText className="h-4 w-4" /><span>Invoice</span>
                          </Button>
                          <Button
                            variant="default" size="sm"
                            className="flex items-center gap-1 flex-1"
                            onClick={() => { setSelectedOrder(order); setNewOrderStatus(order.status || "pending"); setStatusUpdateDialogOpen(true); }}
                          >
                            <AlertCircle className="h-4 w-4" /><span>Update Status</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={() => fetchOrders(true)} disabled={loading}>
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Invoice</DialogTitle>
            <DialogDescription>Order #{selectedOrder?.orderId?.substring(0, 8)} details</DialogDescription>
          </DialogHeader>
          <div ref={billRef} className="p-6 bg-white rounded-2xl border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-gray-600 text-lg">Thikana Portal</p>
            </div>
            <div className="flex justify-between mb-8">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900">Invoice To:</h3>
                <p className="text-gray-700 text-sm">Customer: {selectedOrder?.userId?.substring(0, 12)}...</p>
                <p className="text-gray-700 text-sm">Business: {selectedOrder?.businessName || "N/A"}</p>
                <p className="text-gray-700 text-sm">Date: {selectedOrder?.timestamp && format(new Date(selectedOrder.timestamp), "MMM d, yyyy")}</p>
              </div>
              <div className="text-right space-y-1">
                <h3 className="font-bold text-gray-900">Invoice Details:</h3>
                <p className="text-gray-700 text-sm">Invoice #: INV-{selectedOrder?.orderId?.substring(0, 8)}</p>
                <p className="text-gray-700 text-sm">Order #: {selectedOrder?.orderId?.substring(0, 8)}</p>
                <p className="text-gray-700 text-sm">Status: {selectedOrder?.status || "completed"}</p>
              </div>
            </div>
            <table className="w-full mb-8">
              <thead className="border-b-2 border-gray-300">
                <tr>
                  <th className="py-3 text-left font-bold text-gray-900 text-sm">Item</th>
                  <th className="py-3 text-right font-bold text-gray-900 text-sm">Qty</th>
                  <th className="py-3 text-right font-bold text-gray-900 text-sm">Price</th>
                  <th className="py-3 text-right font-bold text-gray-900 text-sm">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedOrder?.products?.map((product, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-gray-700 text-sm">{product.productName}</td>
                    <td className="py-3 text-right text-gray-700 text-sm">{product.quantity}</td>
                    <td className="py-3 text-right text-gray-700 text-sm">₹{product.amount?.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-700 text-sm">₹{(product.amount * product.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 text-right text-gray-900 text-sm">Tax:</td>
                  <td className="py-3 text-right text-gray-900 text-sm">₹0.00</td>
                </tr>
                <tr className="text-base">
                  <td colSpan={3} className="py-3 text-right text-gray-900">Total Amount:</td>
                  <td className="py-3 text-right text-gray-900">₹{selectedOrder?.amount?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="text-center mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="font-bold text-gray-900">Thank you for your business!</p>
              <p className="text-sm text-gray-500 mt-1">Payment via Razorpay · Order ID: {selectedOrder?.orderId?.substring(0, 12)}</p>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setBillDialogOpen(false)} className="rounded-2xl">Close</Button>
            <Button onClick={() => { toast.success("Select 'Save as PDF' in the print dialog."); handlePrint(); }} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Printer className="h-4 w-4" /><span>Print / Download PDF</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>Change the delivery status for Order #{selectedOrder?.orderId?.substring(0, 8)}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newOrderStatus} onValueChange={setNewOrderStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStatusUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={updateOrderStatus} disabled={updatingStatus}>
              {updatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
