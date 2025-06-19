import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, Plus, Edit, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const quickTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["task", "homework", "chore"]),
  category: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  points: z.number().min(0).default(5),
});

const quickEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventDate: z.string(),
  allDay: z.boolean().default(false),
  category: z.string().optional(),
  color: z.string().optional(),
});

type QuickTaskFormData = z.infer<typeof quickTaskSchema>;
type QuickEventFormData = z.infer<typeof quickEventSchema>;

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<Date | null>(null);

  const taskForm = useForm<QuickTaskFormData>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "task",
      category: "",
      priority: "medium",
      points: 5,
    },
  });

  const eventForm = useForm<QuickEventFormData>({
    resolver: zodResolver(quickEventSchema),
    defaultValues: {
      title: "",
      description: "",
      allDay: false,
      category: "",
      color: "#3b82f6",
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks", { assignedTo: user?.id }],
    enabled: !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: QuickTaskFormData) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      taskForm.reset();
      setIsTaskDialogOpen(false);
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: QuickEventFormData) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      eventForm.reset();
      setIsEventDialogOpen(false);
    },
  });

  const handleTaskSubmit = (data: QuickTaskFormData) => {
    const taskData = {
      ...data,
      dueDate: selectedDayForAdd ? selectedDayForAdd.toISOString() : data.dueDate,
    };
    createTaskMutation.mutate(taskData);
  };

  const handleEventSubmit = (data: QuickEventFormData) => {
    const eventData = {
      ...data,
      eventDate: selectedDayForAdd ? selectedDayForAdd.toISOString() : data.eventDate,
    };
    createEventMutation.mutate(eventData);
  };

  const handleAddToDay = (day: Date, type: 'task' | 'event') => {
    setSelectedDayForAdd(day);
    if (type === 'task') {
      taskForm.setValue('dueDate', format(day, 'yyyy-MM-dd'));
      setIsTaskDialogOpen(true);
    } else {
      eventForm.setValue('eventDate', format(day, 'yyyy-MM-dd'));
      setIsEventDialogOpen(true);
    }
  };

  // Generate calendar view
  const getCalendarDays = () => {
    if (view === 'week') {
      const weekStart = startOfWeek(selectedDate);
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  };

  const getItemsForDay = (day: Date) => {
    const dayTasks = tasks.filter((task: any) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), day);
    });

    const dayEvents = events.filter((event: any) => {
      return isSameDay(new Date(event.eventDate), day);
    });

    return { tasks: dayTasks, events: dayEvents };
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setSelectedDate(addDays(selectedDate, direction === 'next' ? 7 : -7));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      setSelectedDate(newDate);
    }
  };

  const getTodayStats = () => {
    const today = new Date();
    const { tasks: todayTasks } = getItemsForDay(today);
    const completed = todayTasks.filter((task: any) => task.completed).length;
    const total = todayTasks.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const todayStats = getTodayStats();
  const calendarDays = getCalendarDays();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Personal Schedule</h1>
          <p className="text-muted-foreground">
            View your daily and weekly tasks and events in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Today: {todayStats.completed}/{todayStats.total} tasks completed
          </Badge>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-green-500">{todayStats.completed}</h3>
            <p className="text-muted-foreground">Completed Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-orange-500">{todayStats.total - todayStats.completed}</h3>
            <p className="text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-blue-500">{Math.round(todayStats.percentage)}%</h3>
            <p className="text-muted-foreground">Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'week' | 'month')}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="month">Month View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-32 text-center">
              {view === 'week' 
                ? `${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d, yyyy')}`
                : format(selectedDate, 'MMMM yyyy')
              }
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, index) => {
                  const { tasks: dayTasks, events: dayEvents } = getItemsForDay(day);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border rounded-lg ${
                        isCurrentDay ? 'bg-primary/10 border-primary' : 'bg-card'
                      }`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isCurrentDay ? 'text-primary' : 'text-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.slice(0, 2).map((task: any) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${
                              task.completed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.title}
                          </div>
                        ))}
                        
                        {dayEvents.slice(0, 1).map((event: any) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate bg-purple-100 text-purple-800"
                          >
                            {event.title}
                          </div>
                        ))}
                        
                        {(dayTasks.length + dayEvents.length) > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{(dayTasks.length + dayEvents.length) - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, index) => {
                  const { tasks: dayTasks, events: dayEvents } = getItemsForDay(day);
                  const isCurrentDay = isToday(day);
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-16 p-1 border rounded ${
                        isCurrentDay ? 'bg-primary/10 border-primary' : 
                        isCurrentMonth ? 'bg-card' : 'bg-muted/50'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${
                        isCurrentDay ? 'text-primary' : 
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      {(dayTasks.length > 0 || dayEvents.length > 0) && (
                        <div className="flex gap-1">
                          {dayTasks.length > 0 && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                          {dayEvents.length > 0 && (
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Today's Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const { tasks: todayTasks } = getItemsForDay(new Date());
              return todayTasks.length > 0 ? (
                <div className="space-y-3">
                  {todayTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.completed ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <div>
                          <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {task.type} • {format(new Date(task.dueDate), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      {task.points && (
                        <Badge variant="secondary">+{task.points} pts</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No tasks scheduled for today</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const { events: todayEvents } = getItemsForDay(new Date());
              return todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event: any) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }}></div>
                        <h3 className="font-medium">{event.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.eventDate), 'h:mm a')} • {event.category}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No events scheduled for today</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
