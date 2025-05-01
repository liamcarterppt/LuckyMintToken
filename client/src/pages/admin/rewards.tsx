import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CircleDollarSign, Search, RefreshCw, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layout/AdminLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Manual Reward Modal Form Component
interface ManualRewardFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RewardTransaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  referenceId?: number;
  status: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    walletAddress?: string;
  };
}

interface DashboardStats {
  pendingRewards: number;
  distributedRewards: number;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function ManualRewardForm({ isOpen, onClose }: ManualRewardFormProps) {
  const [formData, setFormData] = useState({
    userId: "",
    amount: 100,
    reason: "Manual distribution",
  });

  const { toast } = useToast();

  // Reset form when modal opens
  const resetForm = () => {
    setFormData({
      userId: "",
      amount: 100,
      reason: "Manual distribution",
    });
  };

  // Create manual reward mutation
  const { mutate: createReward, isPending } = useMutation({
    mutationFn: async () => {
      // Format the number fields
      const dataToSend = {
        ...formData,
        userId: parseInt(formData.userId),
        amount: Number(formData.amount),
      };

      return apiRequest("/api/admin/rewards/manual", {
        method: "POST",
        data: dataToSend,
      });
    },
    onSuccess: () => {
      // Show success toast and close modal
      toast({
        title: "Reward sent successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reward",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.userId || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(parseInt(formData.userId))) {
      toast({
        title: "Validation Error",
        description: "User ID must be a number",
        variant: "destructive",
      });
      return;
    }

    if (Number(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    createReward();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Manual Reward</DialogTitle>
          <DialogDescription>
            Directly send LKMT tokens to a user as a manual reward
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="userId">User ID *</Label>
            <Input
              id="userId"
              type="number"
              value={formData.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
              placeholder="Enter user ID"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (LKMT) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="any"
              value={formData.amount}
              onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
              placeholder="100"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              placeholder="Reason for manual reward"
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send Reward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRewards() {
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  
  // Get dashboard stats for reward totals
  const { data: statsData } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      return apiRequest("/api/admin/stats");
    },
  });

  const stats: DashboardStats = {
    pendingRewards: statsData?.pendingRewards || 0,
    distributedRewards: statsData?.distributedRewards || 0,
  };
  
  // Get pending rewards
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/rewards/pending"],
    queryFn: async () => {
      return apiRequest("/api/admin/rewards/pending");
    },
  });
  
  const pendingRewards: RewardTransaction[] = data?.pendingRewards || [];
  
  // Filter rewards by search term
  const filteredRewards = searchTerm 
    ? pendingRewards.filter(reward => 
        (reward.user?.username && reward.user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        reward.id.toString().includes(searchTerm) ||
        reward.userId.toString().includes(searchTerm)
      )
    : pendingRewards;
  
  // Process rewards mutation
  const { mutate: processRewards, isPending: isProcessing } = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/rewards/process", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Rewards processing initiated",
        description: "Pending rewards are being processed",
        variant: "success",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process rewards",
        variant: "destructive",
      });
    },
  });
  
  return (
    <AdminLayout title="Rewards Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rewards Management</h1>
          <p className="text-muted-foreground">
            Process pending rewards and send manual rewards
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setIsRewardModalOpen(true)}
        >
          <PlusCircle size={18} /> Manual Reward
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Rewards</CardTitle>
            <CardDescription>Total tokens waiting to be distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingRewards} LKMT</div>
          </CardContent>
          <CardFooter>
            <Button 
              className="gap-2 w-full" 
              onClick={() => processRewards()}
              disabled={isProcessing || pendingRewards.length === 0}
            >
              <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} /> 
              {isProcessing ? "Processing..." : "Process Rewards"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Distributed Rewards</CardTitle>
            <CardDescription>Total tokens distributed to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.distributedRewards} LKMT</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Rewards</CardTitle>
          <CardDescription>
            Rewards waiting to be processed and sent to user wallets
          </CardDescription>
          
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading rewards...</div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-4">
              {searchTerm ? "No rewards match your search" : "No pending rewards"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>{reward.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {reward.user?.username || `User #${reward.userId}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {reward.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CircleDollarSign className="h-4 w-4 text-primary" />
                        <span>{reward.amount} LKMT</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {reward.type.charAt(0).toUpperCase() + reward.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          reward.status === "pending" ? "outline" :
                          reward.status === "processing" ? "secondary" :
                          reward.status === "completed" ? "success" :
                          "destructive"
                        }
                      >
                        {reward.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(reward.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Manual Reward Modal */}
      <ManualRewardForm
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
      />
    </AdminLayout>
  );
}