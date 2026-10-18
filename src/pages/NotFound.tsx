import GlassIcon from "@/components/GlassIcon";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PhysicsBackground from "@/components/PhysicsBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid relative">
      <PhysicsBackground />
      <div className="glass-panel relative mx-4 max-w-md p-8 text-center sm:p-12">
        <GlassIcon name="practice" tone="violet" className="mx-auto mb-6" /><h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
