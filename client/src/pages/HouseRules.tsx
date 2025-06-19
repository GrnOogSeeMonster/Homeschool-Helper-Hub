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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Shield, Clock, Utensils, Bed, Tv, Book, Users, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { insertHouseRuleSchema } from "@shared/schema";

const houseRuleSchema = insertHouseRuleSchema;

type HouseRuleFormData = z.infer<typeof houseRuleSchema>;

export default function HouseRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const form = useForm<HouseRuleFormData>({
    resolver: zodResolver(houseRuleSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      priority: "medium",
      tags: [],
    },
  });

  const { data: houseRules = [], isLoading } = useQuery({
    queryKey: ["/api/house-rules", { search: searchTerm, category: selectedCategory !== "all" ? selectedCategory : undefined }],
    enabled: !!user,
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: HouseRuleFormData) => {
      if (editingRule) {
        await apiRequest("PATCH", `/api/house-rules/${editingRule.id}`, data);
      } else {
        await apiRequest("POST", "/api/house-rules", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/house-rules"] });
      toast({
        title: "Success",
        description: editingRule ? "House rule updated successfully!" : "House rule created successfully!",
      });
      form.reset();
      setEditingRule(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save house rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      await apiRequest("DELETE", `/api/house-rules/${ruleId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/house-rules"] });
      toast({
        title: "Rule deleted",
        description: "House rule has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete house rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: HouseRuleFormData) => {
    // Convert tags string to array if needed
    const processedData = {
      ...data,
      tags: typeof data.tags === 'string' ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : data.tags || [],
    };
    createRuleMutation.mutate(processedData);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    form.reset({
      title: rule.title,
      description: rule.description,
      category: rule.category,
      priority: rule.priority,
      tags: rule.tags || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (ruleId: number) => {
    if (confirm("Are you sure you want to delete this house rule?")) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const filteredRules = houseRules.filter((rule: any) => {
    const matchesSearch = rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || rule.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const ruleCategories = [
    { value: "all", label: "All Categories" },
    { value: "screen_time", label: "Screen Time", icon: Tv },
    { value: "kitchen", label: "Kitchen Rules", icon: Utensils },
    { value: "bedtime", label: "Bedtime", icon: Bed },
    { value: "chores", label: "Chores", icon: Shield },
    { value: "homework", label: "Homework", icon: Book },
    { value: "family_time", label: "Family Time", icon: Users },
    { value: "general", label: "General", icon: Shield },
  ];

  const getCategoryIcon = (category: string) => {
    const categoryInfo = ruleCategories.find(cat => cat.value === category);
    const IconComponent = categoryInfo?.icon || Shield;
    return <IconComponent className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      screen_time: "border-l-blue-500",
      kitchen: "border-l-green-500",
      bedtime: "border-l-purple-500",
      chores: "border-l-orange-500",
      homework: "border-l-red-500",
      family_time: "border-l-pink-500",
      general: "border-l-gray-500",
    };
    return colors[category] || "border-l-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const groupedRules = ruleCategories.slice(1).map(category => ({
    ...category,
    rules: filteredRules.filter((rule: any) => rule.category === category.value)
  })).filter(group => group.rules.length > 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">House Rules & Guidelines</h1>
          <p className="text-muted-foreground">
            Manage family rules and guidelines for a harmonious household
          </p>
        </div>
        {user?.role === 'parent' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-primary to-secondary"
                onClick={() => {
                  setEditingRule(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Edit House Rule" : "Create House Rule"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Screen Time Limits" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detailed rule description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                              {ruleCategories.slice(1).map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., weekdays, weekend, bedtime" 
                            value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRuleMutation.isPending}>
                      {createRuleMutation.isPending ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search rules and guidelines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ruleCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-blue-500">{filteredRules.length}</h3>
            <p className="text-muted-foreground">Total Rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Filter className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-green-500">{groupedRules.length}</h3>
            <p className="text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-purple-500">
              {filteredRules.filter((rule: any) => rule.priority === 'high').length}
            </h3>
            <p className="text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* House Rules */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : groupedRules.length > 0 ? (
        <div className="space-y-6">
          {groupedRules.map((group) => (
            <Card key={group.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <group.icon className="h-5 w-5" />
                  {group.label}
                  <Badge variant="secondary">{group.rules.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.rules.map((rule: any) => (
                    <Card key={rule.id} className={`border-l-4 ${getCategoryColor(rule.category)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(rule.category)}
                            <h3 className="font-semibold text-sm">{rule.title}</h3>
                          </div>
                          {user?.role === 'parent' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(rule)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(rule.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {rule.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className={`text-xs ${getPriorityColor(rule.priority)}`}>
                            {rule.priority} priority
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Updated {format(new Date(rule.updatedAt), 'MMM d')}
                          </span>
                        </div>
                        
                        {rule.tags && rule.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rule.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {rule.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{rule.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedCategory !== "all" ? "No rules found" : "No house rules yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Create your first house rule to establish family guidelines."
              }
            </p>
            {user?.role === 'parent' && !searchTerm && selectedCategory === "all" && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
