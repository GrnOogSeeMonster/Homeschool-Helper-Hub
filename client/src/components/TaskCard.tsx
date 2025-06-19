import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CheckCircle, Clock, Calendar, Home, BookOpen, Star } from "lucide-react";
import { format, isToday, isPast } from "date-fns";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string;
    type: string;
    category?: string;
    points?: number;
    dueDate?: string;
    completed: boolean;
    completedAt?: string;
    priority?: string;
  };
}

export default function TaskCard({ task }: TaskCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/tasks/${task.id}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Great job! 🎉",
        description: `You earned ${task.points || 0} points for completing "${task.title}"!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleComplete = (checked: boolean) => {
    if (checked && !task.completed) {
      completeMutation.mutate();
    }
  };

  const getTaskIcon = () => {
    switch (task.type) {
      case "chore":
        return <Home className="h-4 w-4" />;
      case "homework":
        return <BookOpen className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTaskColor = () => {
    if (task.completed) return "bg-green-50 border-green-200";
    if (task.type === "chore") return "bg-blue-50 border-blue-200";
    if (task.type === "homework") return "bg-orange-50 border-orange-200";
    return "bg-gray-50 border-gray-200";
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isDue = task.dueDate && isPast(new Date(task.dueDate)) && !task.completed;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Card className={`task-card ${getTaskColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleComplete}
            disabled={completeMutation.isPending}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getTaskIcon()}
              <h3 className={`font-semibold ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h3>
              {task.priority && (
                <Badge variant="secondary" className={`text-xs ${getPriorityColor()}`}>
                  {task.priority}
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 capitalize">
                {getTaskIcon()}
                {task.type}
                {task.category && ` • ${task.category}`}
              </span>
              
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${
                  isDue ? "text-red-600 font-medium" : 
                  isDueToday ? "text-orange-600 font-medium" : ""
                }`}>
                  <Clock className="h-3 w-3" />
                  {task.completed ? "Completed" : "Due"}: {format(new Date(task.dueDate), "MMM d, h:mm a")}
                </span>
              )}
              
              {task.completed && task.completedAt && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Completed {format(new Date(task.completedAt), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {task.points && task.points > 0 && (
              <Badge className={`${
                task.completed ? "theme-accent" : 
                task.type === "homework" ? "bg-orange-500" : "theme-accent"
              } text-white`}>
                <Star className="h-3 w-3 mr-1" />
                +{task.points} pts
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            
            {task.completed && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
        
        {isDue && !task.completed && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ This task is overdue!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
