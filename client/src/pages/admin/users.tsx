import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Edit, 
  Trash2, 
  Gift, 
  Ban,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rewardAmount, setRewardAmount] = useState('');
  
  // Fetch users with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/users', page, pageSize, searchQuery],
  });
  
  const users = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  // Open reward modal for a user
  const openRewardModal = (user: any) => {
    setSelectedUser(user);
    setRewardAmount('');
    setRewardModalOpen(true);
  };
  
  // Open edit modal for a user
  const openEditModal = (user: any) => {
    setSelectedUser({ ...user });
    setEditModalOpen(true);
  };
  
  // Open delete modal for a user
  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };
  
  // Handle sending reward to a user
  const handleSendReward = async () => {
    if (!selectedUser || !rewardAmount || isNaN(Number(rewardAmount))) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid reward amount.",
      });
      return;
    }
    
    try {
      await apiRequest('POST', `/api/admin/users/${selectedUser.id}/reward`, {
        amount: Number(rewardAmount),
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      toast({
        title: "Reward sent",
        description: `${rewardAmount} $LKMT has been sent to ${selectedUser.username}.`,
      });
      
      setRewardModalOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send reward",
        description: error.message || "An error occurred while sending the reward.",
      });
    }
  };
  
  // Handle updating a user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest('PATCH', `/api/admin/users/${selectedUser.id}`, selectedUser);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      toast({
        title: "User updated",
        description: `${selectedUser.username}'s information has been updated.`,
      });
      
      setEditModalOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message || "An error occurred while updating the user.",
      });
    }
  };
  
  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest('DELETE', `/api/admin/users/${selectedUser.id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      toast({
        title: "User deleted",
        description: `${selectedUser.username} has been deleted from the system.`,
      });
      
      setDeleteModalOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description: error.message || "An error occurred while deleting the user.",
      });
    }
  };
  
  // Toggle user ban status
  const toggleBanUser = async (user: any) => {
    try {
      await apiRequest('PATCH', `/api/admin/users/${user.id}/ban`, {
        banned: !user.isBanned,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      toast({
        title: user.isBanned ? "User unbanned" : "User banned",
        description: `${user.username} has been ${user.isBanned ? 'unbanned' : 'banned'}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message || "An error occurred while updating user status.",
      });
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <Card className="bg-card border-white/10 mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage users and their rewards</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/40" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 bg-background/50 border-white/10 w-full sm:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !users.length ? (
            <div className="text-center py-8 text-foreground/60">
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-background/20">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Telegram</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id} className="border-b border-white/5 hover:bg-white/5">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} 
                                alt={user.username} 
                              />
                              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-foreground/60">ID: {user.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.telegramUsername ? (
                            <div className="flex items-center gap-1">
                              <svg 
                                viewBox="0 0 24 24" 
                                className="h-4 w-4 fill-current text-foreground/60"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.77 7.67c-.12 1.23-.64 5.57-1.06 8.35-.15.82-.7 1.16-1.15 1.19-.98.06-1.73-.75-2.68-1.47-.93-.72-1.47-1.14-2.36-1.84-.98-.79-.35-1.21.21-1.91.15-.18 2.66-2.48 2.7-2.69.01-.05.01-.26-.1-.37-.11-.11-.32-.07-.46-.04-.2.05-3.31 2.07-4.7 3.05-.4.25-.78.37-1.12.37-.38 0-.75-.16-1.11-.31-.85-.35-1.64-.52-1.8-.55-.76-.11-.67-.95.32-1.44l7.17-3.14c.86-.38 3.88-1.62 4.05-1.68 1.2-.33 2.21.28 1.93 1.27l-.01.02z" />
                              </svg>
                              <span>@{user.telegramUsername}</span>
                            </div>
                          ) : (
                            <span className="text-foreground/40">Not connected</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.walletAddress ? (
                            <span className="font-mono text-xs">
                              {`${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`}
                            </span>
                          ) : (
                            <span className="text-foreground/40">Not connected</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.lkmtBalance} $LKMT</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.isAdmin && (
                              <Badge variant="outline" className="bg-primary/10 text-primary">
                                Admin
                              </Badge>
                            )}
                            {user.isBanned && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                Banned
                              </Badge>
                            )}
                            {!user.isAdmin && !user.isBanned && (
                              <Badge variant="outline" className="bg-success/10 text-success">
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-white/10">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRewardModal(user)}>
                                <Gift className="h-4 w-4 mr-2" />
                                Send Reward
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleBanUser(user)}>
                                {user.isBanned ? (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Unban User
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4 mr-2" />
                                    Ban User
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => openDeleteModal(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-foreground/70">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 p-0 border-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8 w-8 p-0 border-white/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Send Reward Modal */}
      <Dialog open={rewardModalOpen} onOpenChange={setRewardModalOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Reward</DialogTitle>
            <DialogDescription>
              Send $LKMT tokens to {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                className="col-span-3 bg-background/50 border-white/10"
                placeholder="Enter $LKMT amount"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRewardModalOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={handleSendReward}>Send Reward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                className="col-span-3 bg-background/50 border-white/10"
                value={selectedUser?.username || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <Input
                id="balance"
                type="number"
                className="col-span-3 bg-background/50 border-white/10"
                value={selectedUser?.lkmtBalance || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, lkmtBalance: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Admin
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch 
                  checked={selectedUser?.isAdmin || false} 
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isAdmin: checked })}
                />
                <Label>Grant admin privileges</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              User: <span className="font-bold">{selectedUser?.username}</span>
            </p>
            {selectedUser?.lkmtBalance > 0 && (
              <p className="text-foreground/70 text-sm mt-2">
                This user has {selectedUser.lkmtBalance} $LKMT tokens which will be lost.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
