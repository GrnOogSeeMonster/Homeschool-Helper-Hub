import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Eye, Trophy, Calendar, CheckCircle } from "lucide-react";
import { useState } from "react";
import { insertTaskSchema } from "@shared/schema";

const quickTaskSchema = insertTaskSchema.extend({
  dueDate: z.string().optional(),
});

type QuickTaskFormData = z.infer<typeof quickTaskSchema>;

export default function ParentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const form = useForm<QuickTaskFormData>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "chore",
      category: "cleaning",
      assignedTo: "",
      points: 25,
      priority: "medium",
      recurring: false,
    },
  });

  // Only show for parents
  if (user?.role !== 'parent') {
    return null;
  }

  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ["/api/family/members"],
    enabled: !!user?.familyId,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: QuickTaskFormData) => {
      const taskData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      await apiRequest("POST", "/api/tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task assigned",
        description: "Task has been successfully assigned to family member.",
      });
      form.reset();
      setIsTaskDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: QuickTaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const children = familyMembers.filter((member: any) => member.role === 'child');

  const getChildStats = (childId: string) => {
    const childTasks = allTasks.filter((task: any) => task.assignedTo === childId);
    const completedTasks = childTasks.filter((task: any) => task.completed);
    const totalTasks = childTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = childTasks.filter((task: any) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    const todayCompleted = todayTasks.filter((task: any) => task.completed);

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      completionRate,
      todayTasks: todayTasks.length,
      todayCompleted: todayCompleted.length,
    };
  };

  return (
    <Card className="task-card">
      <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Parent Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : children.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Family Members</h3>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Assign Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Quick Task Assignment</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Clean room" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select child" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {children.map((child: any) => (
                                  <SelectItem key={child.id} value={child.id}>
                                    {child.firstName} {child.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="chore">Chore</SelectItem>
                                  <SelectItem value="homework">Homework</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createTaskMutation.isPending}>
                          {createTaskMutation.isPending ? "Assigning..." : "Assign Task"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child: any) => {
                const stats = getChildStats(child.id);
                return (
                  <Card key={child.id} className="border shadow-sm">
                    <CardContent className="p-6 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-3">
                        <AvatarImage src={child.profileImageUrl} />
                        <AvatarFallback className="bg-primary text-white text-lg">
                          {child.firstName?.[0]}{child.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold text-lg">
                        {child.firstName} {child.lastName}
                      </h3>
                      
                      <div className="space-y-3 mt-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overall Progress</span>
                            <span>{Math.round(stats.completionRate)}%</span>
                          </div>
                          <Progress 
                            value={stats.completionRate} 
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-muted rounded-lg p-2">
                            <div className="font-semibold text-blue-600">{stats.todayCompleted}/{stats.todayTasks}</div>
                            <div className="text-xs text-muted-foreground">Today</div>
                          </div>
                          <div className="bg-muted rounded-lg p-2">
                            <div className="font-semibold text-green-600">{child.points || 0}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                        </div>

                        <div className="flex gap-1 justify-center">
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {stats.completedTasks} completed
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            form.setValue('assignedTo', child.id);
                            setIsTaskDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedChild(child.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No children in the family yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
