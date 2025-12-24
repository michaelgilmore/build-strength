import { Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Muscle Forge" }: HeaderProps) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-fire flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-display text-gradient-fire">{title}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
