"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";
import BasicInfoForm from "@/components/BasicInfoForm";
import BusinessInfoForm from "@/components/BusinessInfoForm";
import ConnectRazorpay from "@/components/ConnectRazorpay";
import toast from "react-hot-toast";
import {
  AlertCircle,
  User,
  Building,
  Link2,
  Activity,
} from "lucide-react";
import Loader from "@/components/Loader";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic-info");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [businessActivity, setBusinessActivity] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role || "user");

          // If user is a member, set the active tab to business-info and store the businessId
          if (userData.role === "member" && userData.businessId) {
            setActiveTab("business-info");
            setBusinessId(userData.businessId);
          }

          // Load business activity data
          setBusinessActivity({
            totalPosts: userData.totalPosts || 0,
            totalProducts: userData.totalProducts || 0,
            followers: userData.followers?.length || 0,
            following: userData.following?.length || 0,
            razorpayConnected: !!userData.razorpayConnected,
            razorpayAccountId: userData.razorpayAccountId || null,
            createdAt: userData.createdAt || null,
          });
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const handleTabChange = (value) => {
    // If user is a member, only allow access to business-info tab
    if (userRole === "member" && value !== "business-info") {
      toast.error("As a member, you can only view business information");
      return;
    }
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-[30px] flex justify-center items-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-[15px]">
      {/* Header */}
      <div className="flex flex-col space-y-1 mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Update your account and business settings.
        </p>
      </div>

      {userRole === "member" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
            <span className="font-medium">Member Access:</span>
            <span className="ml-1">
              As a member, you can view business information but cannot modify
              settings.
            </span>
          </div>
        </div>
      )}

      {/* Tabs root — layout is handled by the inner flex wrapper,
          so the component's own flex-col orientation doesn't interfere. */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Content area — left / main */}
          <div className="flex-1 min-w-0 order-2 md:order-1">
            <TabsContent value="basic-info" className="mt-0">
              <BasicInfoForm />
            </TabsContent>

            <TabsContent value="razorpay-connect" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Connect Razorpay</CardTitle>
                  <CardDescription>
                    Link your Razorpay account via OAuth to enable transaction
                    viewing and payment link generation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConnectRazorpay
                    isConnected={businessActivity?.razorpayConnected}
                    accountId={businessActivity?.razorpayAccountId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business-info" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    {userRole === "member"
                      ? "View information about the business."
                      : "Manage detailed information about your business."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BusinessInfoForm
                    readOnly={userRole === "member"}
                    businessId={userRole === "member" ? businessId : null}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Business Activity</CardTitle>
                  <CardDescription>
                    A quick overview of your business presence on Thikana.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {businessActivity ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: "Posts", value: businessActivity.totalPosts },
                        {
                          label: "Products",
                          value: businessActivity.totalProducts,
                        },
                        {
                          label: "Followers",
                          value: businessActivity.followers,
                        },
                        {
                          label: "Following",
                          value: businessActivity.following,
                        },
                        {
                          label: "Razorpay",
                          value: businessActivity.razorpayConnected
                            ? "Connected"
                            : "Not Connected",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border p-4 text-center"
                        >
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No activity data yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Sidebar navigation — right */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 order-1 md:order-2">
            <div className="md:sticky md:top-[90px]">
              <TabsList className="flex flex-row md:flex-col w-full h-auto bg-muted/50 rounded-xl p-2 gap-1 overflow-x-auto md:overflow-x-visible">
                {userRole !== "member" && (
                  <>
                    <TabsTrigger
                      value="basic-info"
                      className="w-full justify-start gap-2 px-3 py-2.5 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Basic Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="razorpay-connect"
                      className="w-full justify-start gap-2 px-3 py-2.5 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Link2 className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">
                        Connect Razorpay
                      </span>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger
                  value="business-info"
                  className="w-full justify-start gap-2 px-3 py-2.5 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Building className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Business Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="w-full justify-start gap-2 px-3 py-2.5 text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Activity className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
