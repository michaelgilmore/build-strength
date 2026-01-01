import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Mail, Lock, User, Loader2, AtSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import loginBg from "@/assets/login-bg.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username must be 30 characters or less"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type ViewMode = "login" | "signup" | "forgot";

export default function Auth() {
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotResult, setForgotResult] = useState<{ type: "success" | "error"; message: string; tempPassword?: string } | null>(null);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (viewMode === "login") {
        loginSchema.parse({ username, password });
      } else if (viewMode === "signup") {
        signupSchema.parse({
          username,
          password,
          displayName: displayName || undefined,
          email: email || undefined,
        });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (viewMode === "login") {
        const { error } = await signIn(username, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid username or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "Ready to crush your workout.",
          });
        }
      } else if (viewMode === "signup") {
        const { error } = await signUp(username, password, displayName, email || undefined);
        if (error) {
          if (error.message.includes("already registered") || error.message.includes("Username already taken")) {
            toast({
              title: "Account Exists",
              description: "This username is already taken. Try a different one.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Iron Forge. Time to lift!",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotUsername.trim()) {
      setForgotResult({ type: "error", message: "Please enter your username" });
      return;
    }

    const answerNum = parseInt(forgotAnswer, 10);
    if (isNaN(answerNum)) {
      setForgotResult({ type: "error", message: "Please enter a number" });
      return;
    }

    setLoading(true);
    setForgotResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-temp-password", {
        body: { username: forgotUsername.trim(), answer: answerNum },
      });

      if (error) {
        setForgotResult({ type: "error", message: "Failed to process request. Please try again." });
        return;
      }

      if (data.success && data.tempPassword) {
        setForgotResult({ 
          type: "success", 
          message: "Your password has been reset!",
          tempPassword: data.tempPassword
        });
      } else if (data.error === "Username not found") {
        setForgotResult({ type: "error", message: "Username not found. Please check and try again." });
      } else if (data.error === "Incorrect answer") {
        setForgotResult({ type: "error", message: "Incorrect answer. Please try again." });
      } else {
        setForgotResult({ type: "error", message: data.error || "Something went wrong. Please try again." });
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setForgotResult({ type: "error", message: "Failed to process request. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const switchToView = (mode: ViewMode) => {
    setViewMode(mode);
    setErrors({});
    setForgotResult(null);
    setForgotUsername("");
    setForgotAnswer("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-background/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-2xl bg-gradient-fire flex items-center justify-center mb-4 shadow-fire"
          >
            <Dumbbell className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-display text-gradient-fire">Muscle Forge</h1>
          <p className="text-muted-foreground mt-2">Fulfill your potential</p>
        </div>

        {/* Auth Form */}
        <AnimatePresence mode="wait">
          {viewMode === "forgot" ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="card-intense p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => switchToView("login")}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <h2 className="text-2xl font-display text-foreground">Forgot Password</h2>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      value={forgotUsername}
                      onChange={(e) => {
                        setForgotUsername(e.target.value);
                        setForgotResult(null);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">How many roads must a man walk down?</label>
                  <Input
                    type="number"
                    placeholder="Enter your answer"
                    value={forgotAnswer}
                    onChange={(e) => {
                      setForgotAnswer(e.target.value);
                      setForgotResult(null);
                    }}
                  />
                </div>

                {forgotResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg text-sm ${
                      forgotResult.type === "success"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}
                  >
                    <p>{forgotResult.message}</p>
                    {forgotResult.tempPassword && (
                      <p className="mt-2 font-mono text-lg font-bold">{forgotResult.tempPassword}</p>
                    )}
                  </motion.div>
                )}

                <Button type="submit" variant="fire" size="lg" className="w-full mt-6" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => switchToView("login")}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to <span className="text-primary font-semibold">Sign in</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="card-intense p-6"
            >
              <h2 className="text-2xl font-display text-foreground mb-6 text-center">
                {viewMode === "login" ? "Welcome Back" : "Create Account"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {viewMode === "signup" && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Your name (optional)"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.displayName && <p className="text-destructive text-sm">{errors.displayName}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.username && <p className="text-destructive text-sm">{errors.username}</p>}
                </div>

                {viewMode === "signup" && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Email (optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>

                <Button type="submit" variant="fire" size="lg" className="w-full mt-6" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : viewMode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button
                  onClick={() => switchToView(viewMode === "login" ? "signup" : "login")}
                  className="text-muted-foreground hover:text-primary transition-colors block w-full"
                >
                  {viewMode === "login" ? (
                    <>
                      Don't have an account? <span className="text-primary font-semibold">Sign up</span>
                    </>
                  ) : (
                    <>
                      Already have an account? <span className="text-primary font-semibold">Sign in</span>
                    </>
                  )}
                </button>
                {viewMode === "login" && (
                  <button
                    onClick={() => switchToView("forgot")}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
