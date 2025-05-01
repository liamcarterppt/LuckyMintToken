import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2, PlusCircle, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/layout/AdminLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Task Modal Form Component
interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: Task | null;
}

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  reward: number;
  requiredProof?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task Completions Modal
interface TaskCompletionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
}

interface TaskCompletion {
  id: number;
  userId: number;
  taskId: number;
  proof: string | null;
  status: string;
  completedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    telegramUsername?: string;
    walletAddress?: string;
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function TaskForm({ isOpen, onClose, taskToEdit }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "social",
    reward: 50,
    requiredProof: "",
    isActive: true,
  });

  const { toast } = useToast();

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData({
          title: taskToEdit.title,
          description: taskToEdit.description,
          type: taskToEdit.type,
          reward: taskToEdit.reward,
          requiredProof: taskToEdit.requiredProof || "",
          isActive: taskToEdit.isActive,
        });
      } else {
        // Reset form for new task
        setFormData({
          title: "",
          description: "",
          type: "social",
          reward: 50,
          requiredProof: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, taskToEdit]);

  // Create/update task mutation
  const { mutate: saveTask, isPending } = useMutation({
    mutationFn: async () => {
      // Format the number fields
      const dataToSend = {
        ...formData,
        reward: Number(formData.reward),
      };

      if (taskToEdit) {
        // Update existing task
        return apiRequest(`/api/admin/tasks/${taskToEdit.id}`, {
          method: "PATCH",
          data: dataToSend,
        });
      } else {
        // Create new task
        return apiRequest("/api/admin/tasks", {
          method: "POST",
          data: dataToSend,
        });
      }
    },
    onSuccess: () => {
      // Show success toast and close modal
      toast({
        title: `Task ${taskToEdit ? "updated" : "created"} successfully`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${taskToEdit ? "update" : "create"} task`,
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.title.length < 3) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.description.length < 10) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    saveTask();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit
              ? "Update the details of this task"
              : "Fill in the details to create a new task for users"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Task Title"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Task description"
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reward">Reward (LKMT) *</Label>
              <Input
                id="reward"
                type="number"
                min="1"
                value={formData.reward}
                onChange={(e) => handleChange("reward", parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="requiredProof">Required Proof</Label>
            <Input
              id="requiredProof"
              value={formData.requiredProof}
              onChange={(e) => handleChange("requiredProof", e.target.value)}
              placeholder="What proof is required (if any)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(value) => handleChange("isActive", value)}
            />
            <Label htmlFor="isActive">Task is active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : taskToEdit ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskCompletionsModal({ isOpen, onClose, taskId }: TaskCompletionsModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { toast } = useToast();
  
  // Get task completions
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/tasks/completions", taskId, statusFilter],
    queryFn: async () => {
      if (!taskId) return { completions: [] };
      
      const endpoint = `/api/admin/tasks/${taskId}/completions${
        statusFilter !== "all" ? `?status=${statusFilter}` : ""
      }`;
      
      return apiRequest(endpoint);
    },
    enabled: !!taskId && isOpen,
  });
  
  const completions: TaskCompletion[] = data?.completions || [];
  
  // Verify task completion mutation
  const { mutate: verifyCompletion } = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/admin/tasks/completion/${id}`, {
        method: "PATCH",
        data: { status },
      });
    },
    onSuccess: () => {
      toast({
        title: "Task completion status updated",
        variant: "success",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/tasks/completions", taskId] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task completion status",
        variant: "destructive",
      });
    },
  });
  
  // Handle verify/reject
  const handleStatusChange = (id: number, status: "verified" | "rejected") => {
    verifyCompletion({ id, status });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Completions</DialogTitle>
          <DialogDescription>
            Review and verify user task completions
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <Label htmlFor="statusFilter">Filter by Status</Label>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">Loading completions...</div>
        ) : completions.length === 0 ? (
          <div className="text-center py-4">No task completions found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completions.map((completion) => (
                <TableRow key={completion.id}>
                  <TableCell>
                    <div className="font-medium">{completion.user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {completion.user.telegramUsername ? `@${completion.user.telegramUsername}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        completion.status === "verified"
                          ? "success"
                          : completion.status === "rejected"
                          ? "destructive"
                          : completion.status === "pending"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {completion.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {completion.proof ? (
                      <div className="max-w-[250px] break-words">
                        {completion.proof}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No proof provided</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(completion.createdAt)}
                  </TableCell>
                  <TableCell>
                    {completion.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleStatusChange(completion.id, "verified")}
                        >
                          <Check className="h-4 w-4" /> Verify
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleStatusChange(completion.id, "rejected")}
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTasks() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isCompletionsModalOpen, setIsCompletionsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get all tasks
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/tasks"],
    queryFn: async () => {
      return apiRequest("/api/admin/tasks");
    },
  });
  
  const tasks: Task[] = data?.tasks || [];
  
  // Delete task mutation
  const { mutate: deleteTask } = useMutation({
    mutationFn: async (taskId: number) => {
      return apiRequest(`/api/admin/tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Task deleted successfully",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });
  
  // Handle edit task
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  
  // Handle delete task
  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask(taskId);
    }
  };
  
  // Handle view completions
  const handleViewCompletions = (taskId: number) => {
    setSelectedTaskId(taskId);
    setIsCompletionsModalOpen(true);
  };
  
  return (
    <AdminLayout title="Tasks Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks Management</h1>
          <p className="text-muted-foreground">
            Create, edit and manage tasks for your users
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
        >
          <PlusCircle size={18} /> Add New Task
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-4">No tasks found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.description.substring(0, 40)}
                        {task.description.length > 40 ? "..." : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.type}</Badge>
                    </TableCell>
                    <TableCell>{task.reward} LKMT</TableCell>
                    <TableCell>
                      <Badge
                        variant={task.isActive ? "success" : "secondary"}
                      >
                        {task.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(task.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCompletions(task.id)}
                        >
                          Completions
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Task Create/Edit Modal */}
      <TaskForm
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      
      {/* Task Completions Modal */}
      <TaskCompletionsModal
        isOpen={isCompletionsModalOpen}
        onClose={() => setIsCompletionsModalOpen(false)}
        taskId={selectedTaskId}
      />
    </AdminLayout>
  );
}