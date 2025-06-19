import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, AlertTriangle, Plus, Gift, Trophy, Bell, Settings, Star, Target, BookOpen, Heart } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";

const rewardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  pointsRequired: z.number().min(1, "Points must be at least 1"),
  category: z.string(),
  isActive: z.boolean().default(true),
});

const reminderSchema = z.object({
  type: z.string(),
  message: z.string().min(1, "Message is required"),
  frequency: z.string(),
  timeOfDay: z.string(),
  isActive: z.boolean().default(true),
});

type RewardFormData = z.infer<typeof rewardSchema>;
type ReminderFormData = z.infer<typeof reminderSchema>;

export default function ParentAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  const rewardForm = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      title: "",
      description: "",
      pointsRequired: 10,
      category: "achievement",
      isActive: true,
    },
  });

  const reminderForm = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: "task_reminder",
      message: "",
      frequency: "daily",
      timeOfDay: "09:00",
      isActive: true,
    },
  });

  // Mock data for family members and analytics
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["/api/family/members"],
    enabled: !!user,
  });

  const { data: childAnalytics = [] } = useQuery({
    queryKey: ["/api/analytics/children"],
    enabled: !!user,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["/api/rewards/system"],
    enabled: !!user,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["/api/reminders"],
    enabled: !!user,
  });

  const createRewardMutation = useMutation({
    mutationFn: async (data: RewardFormData) => {
      await apiRequest("POST", "/api/rewards/system", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/system"] });
      toast({
        title: "Success",
        description: "Reward created successfully!",
      });
      rewardForm.reset();
      setIsRewardDialogOpen(false);
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      await apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder created successfully!",
      });
      reminderForm.reset();
      setIsReminderDialogOpen(false);
    },
  });

  const handleRewardSubmit = (data: RewardFormData) => {
    createRewardMutation.mutate(data);
  };

  const handleReminderSubmit = (data: ReminderFormData) => {
    createReminderMutation.mutate(data);
  };

  // Mock child data with strengths and areas for improvement
  const mockChildren = [
    {
      id: "1",
      name: "Emma",
      age: 12,
      points: 145,
      streak: 5,
      strengths: ["Math", "Organization", "Time Management"],
      needsHelp: ["Science Lab Reports", "Creative Writing"],
      recentAchievements: ["Completed all math homework this week", "Helped with dinner 3 times"],
      weeklyProgress: 85,
      avatar: "👧",
    },
    {
      id: "2", 
      name: "Jake",
      age: 9,
      points: 89,
      streak: 3,
      strengths: ["Art", "Reading", "Problem Solving"],
      needsHelp: ["Room Organization", "Morning Routine"],
      recentAchievements: ["Read 2 books this week", "Finished art project"],
      weeklyProgress: 72,
      avatar: "👦",
    },
  ];

  const mockRewards = [
    { id: 1, title: "Extra Screen Time", points: 25, category: "privilege", active: true },
    { id: 2, title: "Choose Family Movie", points: 50, category: "choice", active: true },
    { id: 3, title: "Stay Up Late Friday", points: 75, category: "privilege", active: true },
    { id: 4, title: "$5 Allowance Bonus", points: 100, category: "money", active: true },
  ];

  if (user?.role !== 'parent') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">This section is only available to parents.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Parent Administrator</h1>
          <p className="text-muted-foreground">
            Manage your family's learning journey and track everyone's progress
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="rules">House Rules</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-blue-500">{mockChildren.length}</h3>
                <p className="text-muted-foreground">Children</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-green-500">
                  {Math.round(mockChildren.reduce((acc, child) => acc + child.weeklyProgress, 0) / mockChildren.length)}%
                </h3>
                <p className="text-muted-foreground">Avg Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-yellow-500">
                  {mockChildren.reduce((acc, child) => acc + child.points, 0)}
                </h3>
                <p className="text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-orange-500">
                  {mockChildren.filter(child => child.weeklyProgress < 75).length}
                </h3>
                <p className="text-muted-foreground">Need Attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={() => setActiveTab("rewards")} className="h-20 flex-col">
                  <Gift className="h-6 w-6 mb-2" />
                  Manage Rewards
                </Button>
                <Button onClick={() => setActiveTab("reminders")} variant="outline" className="h-20 flex-col">
                  <Bell className="h-6 w-6 mb-2" />
                  Set Reminders
                </Button>
                <Button onClick={() => setActiveTab("rules")} variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  House Rules
                </Button>
                <Button onClick={() => setActiveTab("children")} variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  View Children
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Children Tab */}
        <TabsContent value="children" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockChildren.map((child) => (
              <Card key={child.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{child.avatar}</span>
                    <div>
                      <h3 className="text-xl">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">Age {child.age}</p>
                    </div>
                    <div className="ml-auto">
                      <ProgressRing progress={child.weeklyProgress} size={60} />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-500">{child.points}</p>
                      <p className="text-sm text-muted-foreground">Points</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{child.streak}</p>
                      <p className="text-sm text-muted-foreground">Day Streak</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-500">{child.weeklyProgress}%</p>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {child.strengths.map((strength) => (
                        <Badge key={strength} variant="secondary" className="bg-green-100 text-green-800">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      Needs Help With
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {child.needsHelp.map((area) => (
                        <Badge key={area} variant="outline" className="border-orange-300 text-orange-600">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      Recent Wins
                    </h4>
                    <ul className="text-sm space-y-1">
                      {child.recentAchievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Reward System Management</h2>
            <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reward
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Reward</DialogTitle>
                </DialogHeader>
                <Form {...rewardForm}>
                  <form onSubmit={rewardForm.handleSubmit(handleRewardSubmit)} className="space-y-4">
                    <FormField
                      control={rewardForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Extra Screen Time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={rewardForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Optional description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={rewardForm.control}
                        name="pointsRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Required</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={rewardForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="privilege">Privilege</SelectItem>
                                <SelectItem value="choice">Choice</SelectItem>
                                <SelectItem value="money">Money</SelectItem>
                                <SelectItem value="activity">Activity</SelectItem>
                                <SelectItem value="treat">Treat</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRewardMutation.isPending}>
                        {createRewardMutation.isPending ? "Creating..." : "Create Reward"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{reward.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{reward.category}</p>
                    </div>
                    <Badge variant={reward.active ? "default" : "secondary"}>
                      {reward.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-500">{reward.points} pts</span>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Reminder System</h2>
            <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Reminder</DialogTitle>
                </DialogHeader>
                <Form {...reminderForm}>
                  <form onSubmit={reminderForm.handleSubmit(handleReminderSubmit)} className="space-y-4">
                    <FormField
                      control={reminderForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reminder Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="task_reminder">Task Reminder</SelectItem>
                              <SelectItem value="homework_due">Homework Due</SelectItem>
                              <SelectItem value="chore_reminder">Chore Reminder</SelectItem>
                              <SelectItem value="event_notification">Event Notification</SelectItem>
                              <SelectItem value="achievement_celebration">Achievement Alert</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={reminderForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Reminder message..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={reminderForm.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reminderForm.control}
                        name="timeOfDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createReminderMutation.isPending}>
                        {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reminder Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Set up SMS and email reminders for your family. Configure default reminder times and preferences.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Default Reminder Times</h4>
                    <div className="space-y-2 text-sm">
                      <div>Morning Tasks: 8:00 AM</div>
                      <div>Homework Reminder: 4:00 PM</div>
                      <div>Evening Chores: 6:00 PM</div>
                      <div>Bedtime Prep: 8:00 PM</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Notification Methods</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">In-app notifications</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">Email reminders</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm">SMS notifications</span>
                      </label>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* House Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>House Rules Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage your family's house rules and guidelines. You can add, edit, or remove rules as needed.
              </p>
              <Button onClick={() => window.location.href = '/house-rules'}>
                <Settings className="h-4 w-4 mr-2" />
                Manage House Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}