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
    <div className="container mx-auto py-[15px] pb-8">
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

      <Tabs
        orientation="vertical"
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col md:flex-row gap-8 mt-6"
      >
        {/* Left Sidebar (Tabs) */}
        <div className="w-full md:w-1/4 h-fit md:sticky md:top-[120px]">
          <TabsList className="flex flex-col w-full h-auto bg-transparent space-y-2 p-0">
            {userRole !== "member" && (
              <>
                <TabsTrigger 
                  value="basic-info" 
                  className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl text-gray-600 data-[state=active]:text-blue-600 transition-all font-medium"
                >
                  <User className="h-5 w-5 mr-3" />
                  Basic Information
                </TabsTrigger>
                
                <TabsTrigger 
                  value="razorpay-connect" 
                  className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl text-gray-600 data-[state=active]:text-blue-600 transition-all font-medium"
                >
                  <Link2 className="h-5 w-5 mr-3" />
                  Connect Razorpay
                </TabsTrigger>
              </>
            )}
            <TabsTrigger 
              value="business-info" 
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl text-gray-600 data-[state=active]:text-blue-600 transition-all font-medium"
            >
              <Building className="h-5 w-5 mr-3" />
              Business Information
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Right Content */}
        <div className="w-full md:w-3/4">
          <TabsContent value="basic-info" className="mt-0 outline-none animate-in fade-in-50">
            <BasicInfoForm />
          </TabsContent>
          
          <TabsContent value="razorpay-connect" className="mt-0 outline-none animate-in fade-in-50">
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 pb-6">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-600" />
                  Connect Razorpay
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Link your Razorpay account via OAuth to enable transactions and payment links.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ConnectRazorpay
                  isConnected={businessActivity?.razorpayConnected}
                  accountId={businessActivity?.razorpayAccountId}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="business-info" className="mt-0 outline-none animate-in fade-in-50">
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 pb-6">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-600" />
                  Business Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {userRole === "member"
                    ? "View information about the business."
                    : "Manage detailed information about your business."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <BusinessInfoForm
                  readOnly={userRole === "member"}
                  businessId={userRole === "member" ? businessId : null}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
