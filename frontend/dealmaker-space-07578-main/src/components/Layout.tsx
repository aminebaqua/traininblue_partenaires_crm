import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, CheckSquare, DollarSign, UserCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/leads", label: "Leads", icon: Users },
    { path: "/deals", label: "Deals", icon: Briefcase },
    { path: "/tasks", label: "Actions", icon: CheckSquare },
    { path: "/commissions", label: "Commissions", icon: DollarSign },
    { path: "/profile", label: "Profil", icon: UserCircle },
  ];

  const handleLogout = async () => {
    try {
      // تسجيل الخروج من Supabase إذا مستخدم
      await supabase.auth.signOut();


      // أو لحذف كل شيء دفعة واحدة
      localStorage.clear();

      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border shadow-elegant">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground">Traininblue</h1>
          <p className="text-sm text-sidebar-foreground/80 mt-1">Partners</p>
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <button
            className="w-full text-left text-sidebar-foreground hover:bg-sidebar-accent/50 px-3 py-2 rounded-lg flex items-center"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
};

export default Layout;
