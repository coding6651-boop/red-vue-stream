import { Video, Upload, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!roleData);
    } else {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 bg-gradient-red rounded-lg flex items-center justify-center shadow-red">
            <Video className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            VideoStream
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Button
                  onClick={() => navigate("/admin")}
                  className="bg-primary hover:bg-primary/90 shadow-red"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-border hover:bg-secondary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 shadow-red"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
