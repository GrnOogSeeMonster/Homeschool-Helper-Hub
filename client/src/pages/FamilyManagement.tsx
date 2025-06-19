import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Edit, Trash2, Mail, Key, UserPlus, Crown, Shield, Baby } from "lucide-react";

const familyMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional(),
  role: z.enum(["admin", "parent", "guardian", "child"]),
  age: z.number().min(1).max(100).optional(),
  grade: z.string().optional(),
  preferences: z.object({
    likes: z.string().optional(),
    dislikes: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

type FamilyMemberFormData = z.infer<typeof familyMemberSchema>;

export default function FamilyManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const form = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "child",
      preferences: {
        likes: "",
        dislikes: "",
        notes: "",
      },
    },
  });

  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ["/api/family/members"],
    enabled: !!user,
  });

  const { data: familyInfo } = useQuery({
    queryKey: ["/api/family/info"],
    enabled: !!user,
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: FamilyMemberFormData) => {
      if (editingMember) {
        await apiRequest("PATCH", `/api/family/members/${editingMember.id}`, data);
      } else {
        await apiRequest("POST", "/api/family/members", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      toast({
        title: "Success",
        description: editingMember ? "Family member updated successfully!" : "Family member added successfully!",
      });
      form.reset();
      setEditingMember(null);
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save family member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/family/members/${memberId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      toast({
        title: "Member removed",
        description: "Family member has been removed from the family.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove family member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("POST", `/api/family/members/${memberId}/invite`, {});
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Login credentials have been sent to the family member.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FamilyMemberFormData) => {
    createMemberMutation.mutate(data);
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    form.reset({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      age: member.age,
      grade: member.grade,
      preferences: {
        likes: member.preferences?.likes || "",
        dislikes: member.preferences?.dislikes || "",
        notes: member.preferences?.notes || "",
      },
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (memberId: string) => {
    if (confirm("Are you sure you want to remove this family member?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleSendInvite = (memberId: string) => {
    sendInviteMutation.mutate(memberId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "parent":
      case "guardian":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "child":
        return <Baby className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
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

  const canManage = user?.role === 'admin' || user?.role === 'parent';

  if (!canManage) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">This section is only available to family administrators and parents.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Family Management</h1>
          <p className="text-muted-foreground">
            Manage your family members, roles, and access permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-primary to-secondary"
              onClick={() => {
                setEditingMember(null);
                form.reset();
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Family Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Family Member</DialogTitle>
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
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="guardian">Guardian</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                {/* Personal Preferences */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Personal Information</h4>
                  
                  <FormField
                    control={form.control}
                    name="preferences.likes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Likes & Interests</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Things they enjoy, hobbies, favorite activities..." 
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
                            placeholder="Things they struggle with or dislike..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferences.notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Private notes for parents/guardians..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMemberMutation.isPending}>
                    {createMemberMutation.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Family Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {familyInfo?.name || "Your Family"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {familyMembers.filter((m: any) => ['admin', 'parent', 'guardian'].includes(m.role)).length}
              </p>
              <p className="text-sm text-muted-foreground">Adults</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {familyMembers.filter((m: any) => m.role === 'child').length}
              </p>
              <p className="text-sm text-muted-foreground">Children</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {familyMembers.filter((m: any) => m.email && !m.hasLoggedIn).length}
              </p>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {familyMembers.filter((m: any) => m.hasLoggedIn).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {familyMembers.map((member: any) => (
            <Card key={member.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.profileImageUrl} />
                      <AvatarFallback>
                        {member.firstName?.[0]}{member.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.firstName} {member.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <Badge className={getRoleBadge(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                </div>

                {member.age && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Age: </span>
                    <span className="text-sm">{member.age}</span>
                    {member.grade && (
                      <>
                        <span className="text-sm text-muted-foreground"> • Grade: </span>
                        <span className="text-sm">{member.grade}</span>
                      </>
                    )}
                  </div>
                )}

                {member.preferences?.likes && (
                  <div className="mb-2">
                    <p className="text-sm font-medium">Likes:</p>
                    <p className="text-xs text-muted-foreground">{member.preferences.likes}</p>
                  </div>
                )}

                {member.preferences?.dislikes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Dislikes:</p>
                    <p className="text-xs text-muted-foreground">{member.preferences.dislikes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  {member.email && !member.hasLoggedIn && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleSendInvite(member.id)}
                      disabled={sendInviteMutation.isPending}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Invite
                    </Button>
                  )}
                  
                  {member.id !== user?.id && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(member.id)}
                      disabled={deleteMemberMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {member.hasLoggedIn && (
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                    Active User
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Family Member</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Same form fields as add dialog */}
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

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
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
                      <FormLabel>Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5th Grade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Personal Preferences */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Personal Information</h4>
                
                <FormField
                  control={form.control}
                  name="preferences.likes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Likes & Interests</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Things they enjoy, hobbies, favorite activities..." 
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
                          placeholder="Things they struggle with or dislike..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Private notes for parents/guardians..." 
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
                <Button type="submit" disabled={createMemberMutation.isPending}>
                  {createMemberMutation.isPending ? "Updating..." : "Update Member"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}