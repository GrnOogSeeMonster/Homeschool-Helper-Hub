import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  CheckSquare,
  BookOpen,
  Calendar,
  Users,
  Shield,
} from "lucide-react";

interface ActionItem {
  label: string;
  href: string;
  icon: JSX.Element;
  roles?: Array<"admin" | "parent" | "guardian" | "child">;
}

export default function FabMenu() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const role = (user?.role ?? "child") as ActionItem["roles"][number];
  const isParentish = role === "admin" || role === "parent";

  const actions: ActionItem[] = [
    {
      label: "Add Chore",
      href: "/chores",
      icon: <CheckSquare className="h-4 w-4" />,
    },
    {
      label: "Add Homework",
      href: "/homework",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: "Add Event",
      href: "/family-events",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Go to Schedule",
      href: "/schedule",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Manage House Rules",
      href: "/house-rules",
      icon: <Shield className="h-4 w-4" />,
      roles: ["admin", "parent"],
    },
    {
      label: "Manage Family",
      href: "/family-management",
      icon: <Users className="h-4 w-4" />,
      roles: ["admin", "parent"],
    },
  ];

  const visibleActions = actions.filter((a) => !a.roles || (isParentish && a.roles.includes(role)));

  const handleNavigate = (href: string) => {
    setOpen(false);
    // Navigate to the page; those pages already provide creation dialogs
    navigate(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Actions */}
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 ${
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          {visibleActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleNavigate(action.href)}
              className="flex items-center gap-2 bg-white shadow-md hover:shadow-lg rounded-full px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{action.label}</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                {action.icon}
              </span>
            </button>
          ))}
        </div>

        {/* Toggle Button */}
        <Button
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-label="Quick actions"
        >
          <Plus className={`h-6 w-6 transition-transform ${open ? "rotate-45" : "rotate-0"}`} />
        </Button>
      </div>
    </>
  );
}


