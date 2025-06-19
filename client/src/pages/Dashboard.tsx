import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import TaskCard from "@/components/TaskCard";
import CommentSection from "@/components/CommentSection";
import FileUpload from "@/components/FileUpload";
import ProgressRing from "@/components/ProgressRing";
import ParentDashboard from "@/components/ParentDashboard";
import { Calendar, Trophy, Star, Flame, CheckCircle, Clock, Plus } from "lucide-react";
import { format, addDays, startOfWeek, isToday } from "date-fns";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DashboardStats {
  todayTasks: { completed: number; total: number };
  weekTasks: { completed: number; total: number };
  achievements: number;
  familyRank: number;
  upcomingEvents: any[];
  recentAchievements: any[];
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: todayTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks", { assignedTo: user?.id, type: "all" }],
    enabled: isAuthenticated && !!user,
  });

  const { data: recentComments = [] } = useQuery({
    queryKey: ["/api/comments", { contextType: "general" }],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const todayProgress = stats?.todayTasks ? (stats.todayTasks.completed / Math.max(stats.todayTasks.total, 1)) * 100 : 0;
  const weekProgress = stats?.weekTasks ? (stats.weekTasks.completed / Math.max(stats.weekTasks.total, 1)) * 100 : 0;

  // Generate week view
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName || 'there'}! 🌟
          </h1>
          <p className="text-muted-foreground mt-1">
            You have {stats?.todayTasks.total - stats?.todayTasks.completed || 0} tasks due today and {stats?.upcomingEvents.length || 0} upcoming family events this week.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="points-display bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full font-semibold">
            <Trophy className="inline h-4 w-4 mr-2" />
            {user?.points || 0} Points
          </div>
          <div className="streak-counter bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-semibold">
            <Flame className="inline h-4 w-4 mr-2" />
            {user?.streak || 0} Day Streak
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="task-card">
          <CardContent className="p-6 text-center">
            <ProgressRing progress={todayProgress} className="mx-auto mb-3" />
            <h6 className="text-muted-foreground mb-1">Today's Tasks</h6>
            <h4 className="text-2xl font-bold text-primary">
              {stats?.todayTasks.completed || 0}/{stats?.todayTasks.total || 0}
            </h4>
          </CardContent>
        </Card>

        <Card className="task-card">
          <CardContent className="p-6 text-center">
            <div className="w-15 h-15 bg-accent text-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h6 className="text-muted-foreground mb-1">This Week</h6>
            <h4 className="text-2xl font-bold text-accent">
              {stats?.weekTasks.completed || 0}/{stats?.weekTasks.total || 0}
            </h4>
          </CardContent>
        </Card>

        <Card className="task-card">
          <CardContent className="p-6 text-center">
            <div className="w-15 h-15 bg-secondary text-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <Trophy className="h-8 w-8" />
            </div>
            <h6 className="text-muted-foreground mb-1">Achievements</h6>
            <h4 className="text-2xl font-bold text-yellow-600">{stats?.achievements || 0}</h4>
          </CardContent>
        </Card>

        <Card className="task-card">
          <CardContent className="p-6 text-center">
            <div className="w-15 h-15 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <Star className="h-8 w-8" />
            </div>
            <h6 className="text-muted-foreground mb-1">Family Rank</h6>
            <h4 className="text-2xl font-bold text-orange-600">#{stats?.familyRank || 1}</h4>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <Card className="task-card">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Today's Tasks
                </CardTitle>
                <Badge variant="secondary">{(stats?.todayTasks.total || 0) - (stats?.todayTasks.completed || 0)} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No tasks for today. Great job!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="task-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                stats.upcomingEvents.map((event: any) => (
                  <div key={event.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      <span className="font-medium text-sm">
                        {format(new Date(event.eventDate), 'EEEE')}
                      </span>
                    </div>
                    <p className="text-sm ml-4">{event.title}</p>
                    <p className="text-xs text-muted-foreground ml-4">
                      {event.category} • {format(new Date(event.eventDate), 'h:mm a')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="task-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recentAchievements && stats.recentAchievements.length > 0 ? (
                stats.recentAchievements.map((achievement: any) => (
                  <div key={achievement.id} className="badge-achievement bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-semibold">
                    <Trophy className="inline h-4 w-4 mr-1" />
                    {achievement.title}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">Complete tasks to earn achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Calendar */}
      <Card className="task-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-1" />
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-muted-foreground mb-2 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`calendar-day w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    isToday(day)
                      ? 'bg-primary text-white'
                      : 'hover:bg-primary/10 hover:text-primary'
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Upload & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FileUpload />
        <CommentSection contextType="general" />
      </div>

      {/* Parent Dashboard */}
      {user?.role === 'parent' && <ParentDashboard />}

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
