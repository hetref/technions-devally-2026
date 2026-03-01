"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, MessagesSquare, Filter, ChevronDown, TicketIcon, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";

export default function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false);
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { filterTickets(); }, [tickets, searchTerm, statusFilter, priorityFilter, ticketTypeFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }
      const ticketsRef = collection(db, "users", user.uid, "tickets");
      const q = query(ticketsRef, orderBy("updatedAt", "desc"));
      const ticketsSnapshot = await getDocs(q);
      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAtDate: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()) : new Date(),
        updatedAtDate: doc.data().updatedAt ? new Date(doc.data().updatedAt.toDate()) : new Date(),
      }));
      setTickets(ticketsData);
      setFilteredTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) => t.subject?.toLowerCase().includes(term) || t.message?.toLowerCase().includes(term) ||
          t.userName?.toLowerCase().includes(term) || t.userEmail?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") filtered = filtered.filter((t) => t.priority === priorityFilter);
    if (ticketTypeFilter === "business") filtered = filtered.filter((t) => t.isBusinessQuery === true);
    else if (ticketTypeFilter === "customer") filtered = filtered.filter((t) => !t.isBusinessQuery);
    setFilteredTickets(filtered);
  };

  const handleOpenTicket = async (ticket) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const ticketRef = doc(db, "users", user.uid, "tickets", ticket.id);
      const ticketDoc = await getDoc(ticketRef);
      if (ticketDoc.exists()) {
        setSelectedTicket({
          id: ticketDoc.id, ...ticketDoc.data(),
          createdAtDate: ticketDoc.data().createdAt ? new Date(ticketDoc.data().createdAt.toDate()) : new Date(),
          updatedAtDate: ticketDoc.data().updatedAt ? new Date(ticketDoc.data().updatedAt.toDate()) : new Date(),
        });
        setTicketDetailsOpen(true);
      }
    } catch (error) {
      toast.error("Failed to open ticket details");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid, "tickets", ticketId), { status: newStatus, updatedAt: serverTimestamp() });
      toast.success(`Ticket status updated to ${newStatus}`);
      const updated = tickets.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t);
      setTickets(updated);
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status: newStatus });
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid, "tickets", ticketId), { priority: newPriority, updatedAt: serverTimestamp() });
      toast.success(`Ticket priority updated to ${newPriority}`);
      const updated = tickets.map((t) => t.id === ticketId ? { ...t, priority: newPriority } : t);
      setTickets(updated);
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, priority: newPriority });
    } catch (error) {
      toast.error("Failed to update ticket priority");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) { toast.error("Please enter a reply message"); return; }
    setReplying(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const ticketRef = doc(db, "users", user.uid, "tickets", selectedTicket.id);
      const newMessage = { text: replyText, sender: "business", timestamp: new Date(), userName: user.displayName || user.email };
      const messages = selectedTicket.messages || [];
      const updatedMessages = [...messages, newMessage];
      const newStatus = selectedTicket.status === "open" ? "in-progress" : selectedTicket.status;
      await updateDoc(ticketRef, { messages: updatedMessages, status: newStatus, updatedAt: serverTimestamp() });
      setSelectedTicket({ ...selectedTicket, messages: updatedMessages, status: newStatus, updatedAtDate: new Date() });
      setTickets(tickets.map((t) => t.id === selectedTicket.id ? { ...t, messages: updatedMessages, status: newStatus } : t));
      setReplyText("");
      toast.success("Reply sent successfully");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const renderStatusBadge = (status) => {
    const colors = {
      open: "bg-blue-100 text-blue-800 border border-blue-400",
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-400",
      "in-progress": "bg-purple-100 text-purple-800 border border-purple-400",
      resolved: "bg-green-100 text-green-800 border border-green-400",
      closed: "bg-gray-100 text-gray-800 border border-gray-400",
    };
    if (!status) return null;
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const renderPriorityBadge = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800 border border-blue-400",
      medium: "bg-yellow-100 text-yellow-800 border border-yellow-400",
      high: "bg-orange-100 text-orange-800 border border-orange-400",
      urgent: "bg-red-100 text-red-800 border border-red-400",
    };
    if (!priority) return null;
    return <Badge className={colors[priority] || "bg-gray-100 text-gray-800"}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>;
  };

  const formatDate = (date) => date ? date.toLocaleString() : "N/A";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Support Tickets</span>
            <Button size="sm" onClick={fetchTickets} disabled={loading} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>Manage customer support tickets and inquiries.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={ticketTypeFilter} onValueChange={setTicketTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <TicketIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Ticket Type</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="customer">Customer Tickets</SelectItem>
                  <SelectItem value="business">Business Queries</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="text-sm">Status</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  <span className="text-sm">Priority</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12"><Loader /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No tickets found.</div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-xl p-4 space-y-2 hover:shadow-md cursor-pointer transition-all hover:border-primary/30"
                  onClick={() => handleOpenTicket(ticket)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h3 className="font-medium text-sm sm:text-base">{ticket.subject}</h3>
                    {renderStatusBadge(ticket.status)}
                  </div>
                  <div className="flex flex-wrap items-center text-xs text-gray-500 gap-2">
                    <span className="truncate max-w-[200px]">From: {ticket.userName || ticket.userEmail || "Unknown User"}</span>
                    {ticket.isBusinessQuery && <Badge className="bg-purple-100 text-purple-800 border border-purple-400 text-xs">Business Query</Badge>}
                    {ticket.category && <Badge className="bg-gray-100 text-gray-800 border border-gray-400 text-xs">{ticket.category}</Badge>}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{ticket.ticketId || ticket.id?.substring(0, 8)}...</span>
                      {renderPriorityBadge(ticket.priority)}
                      <span className="flex items-center gap-1">
                        <MessagesSquare className="h-3 w-3" />
                        <span>{ticket.messages?.length || 1}</span>
                      </span>
                    </div>
                    <div className="text-xs">Updated: {formatDate(ticket.updatedAtDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">Showing {filteredTickets.length} of {tickets.length} tickets</div>
        </CardFooter>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={ticketDetailsOpen} onOpenChange={setTicketDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto rounded-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap justify-between items-center gap-2 pt-2">
                  <span>{selectedTicket.subject}</span>
                  {renderStatusBadge(selectedTicket.status)}
                </DialogTitle>
                <DialogDescription>From: {selectedTicket.userName || selectedTicket.userEmail || "Unknown User"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {renderPriorityBadge(selectedTicket.priority)}
                      <Select value={selectedTicket.priority} onValueChange={(v) => handlePriorityChange(selectedTicket.id, v)}>
                        <SelectTrigger className="h-7 text-xs border-dashed w-20"><span>Change</span></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStatusBadge(selectedTicket.status)}
                      <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                        <SelectTrigger className="h-7 text-xs border-dashed w-20"><span>Change</span></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <div className="text-sm mt-1">{formatDate(selectedTicket.createdAtDate)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ticket ID</Label>
                    <div className="text-sm mt-1 truncate">{selectedTicket.ticketId || selectedTicket.id}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Conversation</h4>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{selectedTicket.userName || "Customer"}</span>
                        <span className="text-gray-500">{formatDate(selectedTicket.createdAtDate)}</span>
                      </div>
                      <p className="text-sm">{selectedTicket.message}</p>
                    </div>
                    {selectedTicket.messages?.slice(1).map((msg, index) => (
                      <div key={index} className={`rounded-lg p-3 ${msg.sender === "business" ? "bg-blue-50 ml-4" : "bg-muted mr-4"}`}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{msg.sender === "business" ? "You" : msg.userName || "Customer"}</span>
                          <span className="text-gray-500">{formatDate(msg.timestamp ? new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp) : new Date())}</span>
                        </div>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {!["resolved", "closed"].includes(selectedTicket.status) ? (
                  <div>
                    <Label htmlFor="reply" className="text-sm font-medium">Reply</Label>
                    <Textarea id="reply" placeholder="Type your reply..." className="mt-1" rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} disabled={replying} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">This ticket is {selectedTicket.status}. No further replies can be added.</div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setTicketDetailsOpen(false)} size="sm">Close</Button>
                {!["resolved", "closed"].includes(selectedTicket.status) && (
                  <Button onClick={handleReplySubmit} disabled={replying || !replyText.trim()} size="sm">
                    {replying ? "Sending..." : "Send Reply"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
