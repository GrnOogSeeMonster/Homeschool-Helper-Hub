import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Medal, Award, Target, Flame, Crown, Gift } from "lucide-react";
import { format } from "date-fns";

export default function Rewards() {
  const { user } = useAuth();

  const { data: achievements = [] } = useQuery({
    queryKey: [`/api/achievements/${user?.id}`],
    enabled: !!user,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["/api/family/members"],
    enabled: !!user?.familyId,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  // Calculate leaderboard
  const leaderboard = familyMembers
    .filter((member: any) => member.role === 'child')
    .map((member: any) => {
      const memberTasks = allTasks.filter((task: any) => task.assignedTo === member.id);
      const completedTasks = memberTasks.filter((task: any) => task.completed);
      const totalPoints = completedTasks.reduce((sum: number, task: any) => sum + (task.points || 0), 0);
      
      return {
        ...member,
        taskCount: completedTasks.length,
        totalPoints,
        completionRate: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Achievement system
  const achievementTypes = [
    {
      id: 'first_task',
      title: 'Getting Started',
      description: 'Complete your first task',
      icon: <Star className="h-6 w-6" />,
      color: 'text-yellow-500',
      requirement: 1,
      type: 'tasks_completed'
    },
    {
      id: 'task_master',
      title: 'Task Master',
      description: 'Complete 10 tasks',
      icon: <Trophy className="h-6 w-6" />,
      color: 'text-blue-500',
      requirement: 10,
      type: 'tasks_completed'
    },
    {
      id: 'streak_starter',
      title: 'Streak Starter',
      description: 'Maintain a 3-day streak',
      icon: <Flame className="h-6 w-6" />,
      color: 'text-orange-500',
      requirement: 3,
      type: 'streak'
    },
    {
      id: 'homework_hero',
      title: 'Homework Hero',
      description: 'Complete 5 homework assignments',
      icon: <Medal className="h-6 w-6" />,
      color: 'text-green-500',
      requirement: 5,
      type: 'homework_completed'
    },
    {
      id: 'chore_champion',
      title: 'Chore Champion',
      description: 'Complete 5 chores',
      icon: <Award className="h-6 w-6" />,
      color: 'text-purple-500',
      requirement: 5,
      type: 'chores_completed'
    },
    {
      id: 'point_collector',
      title: 'Point Collector',
      description: 'Earn 100 points',
      icon: <Target className="h-6 w-6" />,
      color: 'text-red-500',
      requirement: 100,
      type: 'points_earned'
    },
  ];

  // Calculate user progress for each achievement
  const getUserProgress = (achievementType: any) => {
    const userTasks = allTasks.filter((task: any) => task.assignedTo === user?.id && task.completed);
    const userHomework = userTasks.filter((task: any) => task.type === 'homework');
    const userChores = userTasks.filter((task: any) => task.type === 'chore');
    const userPoints = user?.points || 0;
    const userStreak = user?.streak || 0;

    switch (achievementType.type) {
      case 'tasks_completed':
        return Math.min(userTasks.length, achievementType.requirement);
      case 'homework_completed':
        return Math.min(userHomework.length, achievementType.requirement);
      case 'chores_completed':
        return Math.min(userChores.length, achievementType.requirement);
      case 'points_earned':
        return Math.min(userPoints, achievementType.requirement);
      case 'streak':
        return Math.min(userStreak, achievementType.requirement);
      default:
        return 0;
    }
  };

  const getUserRank = () => {
    const userIndex = leaderboard.findIndex((member: any) => member.id === user?.id);
    return userIndex !== -1 ? userIndex + 1 : leaderboard.length;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rewards & Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and celebrate your accomplishments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="points-display">
            <Trophy className="inline h-4 w-4 mr-2" />
            {user?.points || 0} Points
          </div>
          <div className="streak-counter">
            <Flame className="inline h-4 w-4 mr-2" />
            {user?.streak || 0} Day Streak
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-yellow-500">{user?.points || 0}</h3>
            <p className="text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-orange-500">{user?.streak || 0}</h3>
            <p className="text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Medal className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-blue-500">{achievements.length}</h3>
            <p className="text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-purple-500">#{getUserRank()}</h3>
            <p className="text-muted-foreground">Family Rank</p>
          </CardContent>
        </Card>
      </div>

      {/* Family Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Family Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((member: any, index: number) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.firstName} {member.lastName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.taskCount} tasks completed • {Math.round(member.completionRate)}% completion rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{member.totalPoints}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No family members to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievementTypes.map((achievement) => {
              const progress = getUserProgress(achievement);
              const isCompleted = progress >= achievement.requirement;
              const progressPercentage = (progress / achievement.requirement) * 100;

              return (
                <Card key={achievement.id} className={`border-2 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`${achievement.color} ${isCompleted ? 'text-green-600' : ''}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white text-xs">Earned!</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress}/{achievement.requirement}</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-green-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.length > 0 ? (
            <div className="space-y-3">
              {achievements.slice(0, 5).map((achievement: any) => (
                <div key={achievement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Medal className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
              <p>Complete tasks to start earning achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Ideas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-pink-500" />
            Reward Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { points: 50, reward: "Extra 30 minutes screen time", icon: "📱" },
              { points: 100, reward: "Choose family movie night film", icon: "🎬" },
              { points: 150, reward: "Stay up 30 minutes later", icon: "🌙" },
              { points: 200, reward: "Friend sleepover", icon: "🏠" },
              { points: 250, reward: "Choose dinner menu", icon: "🍕" },
              { points: 300, reward: "Special family outing", icon: "🎡" },
            ].map((reward, index) => (
              <Card key={index} className={`border ${
                (user?.points || 0) >= reward.points ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{reward.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{reward.reward}</h3>
                  <Badge 
                    variant={
                      (user?.points || 0) >= reward.points ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {reward.points} points
                  </Badge>
                  {(user?.points || 0) >= reward.points && (
                    <div className="text-xs text-green-600 mt-1 font-medium">Available!</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
