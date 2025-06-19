import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Users, 
  Shield, 
  CheckSquare,
  Menu,
  LogOut,
  Settings,
  User
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/chores", label: "Chores", icon: CheckSquare },
  { path: "/homework", label: "Homework", icon: BookOpen },
  { path: "/schedule", label: "Schedule", icon: Calendar },
  { path: "/family-events", label: "Family Events", icon: Users },
  { path: "/rewards", label: "Rewards", icon: Trophy },
  { path: "/house-rules", label: "House Rules", icon: Shield },
  { path: "/profile", label: "My Profile", icon: User },
];

const parentNavigationItems = [
  { path: "/parent-admin", label: "Parent Admin", icon: Settings },
  { path: "/family-management", label: "Family Management", icon: Users },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <h3 className="text-white text-xl font-bold mb-0 flex items-center gap-2">
          <Home className="h-6 w-6" />
          Helper Hub
        </h3>
        <p className="text-white/70 text-sm">Family Organization Made Easy</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "nav-link-active text-white shadow-md"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={onNavigate}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              </li>
            );
          })}
          
          {/* Parent Admin Section */}
          {(user?.role === 'admin' || user?.role === 'parent') && (
            <>
              <li className="mt-6 mb-2">
                <div className="px-4 py-2 text-white/60 text-xs uppercase tracking-wider font-semibold">
                  Administration
                </div>
              </li>
              {parentNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <a
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "nav-link-active text-white shadow-md"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                        onClick={onNavigate}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-3 text-white">
          <Avatar>
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-white text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-white/70 text-sm capitalize">{user?.role}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 bg-background border-b">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4 mr-2" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 sidebar">
            <SidebarContent onNavigate={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 sidebar">
        <SidebarContent />
      </div>
    </>
  );
}
