import { useEffect } from "react";
import { useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function InviteAccept() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["/api/invite/", token],
    queryFn: async () => {
      const res = await fetch(`/api/invite/${token}`);
      if (!res.ok) throw new Error("Invalid invite");
      return res.json();
    },
  });

  const form = useForm<{ firstName: string; lastName: string; email: string }>();

  useEffect(() => {
    if (data) {
      form.reset({ firstName: data.firstName ?? "", lastName: data.lastName ?? "", email: data.email ?? "" });
    }
  }, [data, form]);

  const acceptMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiRequest("POST", `/api/invite/${token}/accept`, payload);
    },
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  if (isLoading) return <div className="p-6">Loading invite…</div>;
  if (!data) return <div className="p-6">Invite not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">Complete Your Account</h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => acceptMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={acceptMutation.isPending}>
                {acceptMutation.isPending ? "Saving..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


