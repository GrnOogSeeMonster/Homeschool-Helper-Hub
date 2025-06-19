import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Edit, Camera, Heart, Frown, MessageSquare, Star, Trophy, Calendar, CheckSquare } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional(),
  age: z.number().min(1).max(100).optional(),
  grade: z.string().optional(),
  bio: z.string().optional(),
  preferences: z.object({
    likes: z.string().optional(),
    dislikes: z.string().optional(),
    favoriteSubjects: z.string().optional(),
    hobbies: z.string().optional(),
    goals: z.string().optional(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      bio: "",
      preferences: {
        likes: "",
        dislikes: "",
        favoriteSubjects: "",
        hobbies: "",
        goals: "",
      },
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/profile/stats"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      await apiRequest("POST", "/api/profile/avatar", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleEditProfile = () => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        age: profile.age,
        grade: profile.grade || "",
        bio: profile.bio || "",
        preferences: {
          likes: profile.preferences?.likes || "",
          dislikes: profile.preferences?.dislikes || "",
          favoriteSubjects: profile.preferences?.favoriteSubjects || "",
          hobbies: profile.preferences?.hobbies || "",
          goals: profile.preferences?.goals || "",
        },
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-yellow-100 text-yellow-800",
      parent: "bg-blue-100 text-blue-800",
      guardian: "bg-purple-100 text-purple-800",
      child: "bg-green-100 text-green-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Mock stats for display
  const mockStats = {
    totalPoints: 145,
    completedTasks: 23,
    currentStreak: 5,
    upcomingTasks: 3,
    achievements: 8,
    weeklyProgress: 85,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        <Button onClick={handleEditProfile}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploadAvatarMutation.isPending}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <Badge className={getRoleBadge(profile?.role)}>
                  {profile?.role || 'Member'}
                </Badge>
                {profile?.age && (
                  <p className="text-sm text-muted-foreground">
                    Age: {profile.age}
                    {profile?.grade && ` • Grade: ${profile.grade}`}
                  </p>
                )}
                {profile?.email && (
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                )}
              </div>

              {profile?.bio && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground italic">
                    "{profile.bio}"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-500">{userStats?.totalPoints || mockStats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckSquare className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-500">{userStats?.completedTasks || mockStats.completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-500">{userStats?.currentStreak || mockStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-500">{userStats?.upcomingTasks || mockStats.upcomingTasks}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.preferences?.likes && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Likes & Interests
                  </h4>
                  <p className="text-sm text-muted-foreground">{profile.preferences.likes}</p>
                </div>
              )}

              {profile?.preferences?.dislikes && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Frown className="h-4 w-4 text-orange-500" />
                    Dislikes & Challenges
                  </h4>
                  <p className="text-sm text-muted-foreground">{profile.preferences.dislikes}</p>
                </div>
              )}

              {profile?.preferences?.favoriteSubjects && (
                <div>
                  <h4 className="font-semibold mb-2">Favorite Subjects</h4>
                  <p className="text-sm text-muted-foreground">{profile.preferences.favoriteSubjects}</p>
                </div>
              )}

              {profile?.preferences?.hobbies && (
                <div>
                  <h4 className="font-semibold mb-2">Hobbies</h4>
                  <p className="text-sm text-muted-foreground">{profile.preferences.hobbies}</p>
                </div>
              )}

              {profile?.preferences?.goals && (
                <div>
                  <h4 className="font-semibold mb-2">Goals</h4>
                  <p className="text-sm text-muted-foreground">{profile.preferences.goals}</p>
                </div>
              )}

              {!profile?.preferences?.likes && !profile?.preferences?.favoriteSubjects && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No personal information added yet.</p>
                  <Button variant="outline" onClick={handleEditProfile} className="mt-2">
                    Add Information
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Age" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5th Grade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us a bit about yourself..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Preferences */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Personal Preferences</h4>
                
                <FormField
                  control={form.control}
                  name="preferences.likes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Likes & Interests</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Things you enjoy, hobbies, favorite activities..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences.dislikes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dislikes & Challenges</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Things you find difficult or don't enjoy..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences.favoriteSubjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Favorite Subjects</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your favorite school subjects or learning topics..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences.hobbies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hobbies</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your hobbies and recreational activities..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences.goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals & Aspirations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What you want to achieve or learn..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}