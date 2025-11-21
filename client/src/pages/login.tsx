import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface LoginProps {
  onLogin: (username: string) => void;
  isLoading?: boolean;
}

export default function Login({ onLogin, isLoading = false }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    onLogin(username);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-card to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4"
      >
        <Card className="p-8 space-y-6 backdrop-blur-sm bg-card/80 border border-border/50">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">🎵</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Audio Editor</h1>
            <p className="text-sm text-muted-foreground">Professional audio editing in your browser</p>
          </motion.div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                data-testid="input-username"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
                className="h-10"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                data-testid="alert-error"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10"
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-muted/30 border border-muted/50 text-xs text-muted-foreground space-y-2"
            data-testid="info-demo"
          >
            <p className="font-semibold">Demo Credentials:</p>
            <p>Username: <span className="font-mono text-foreground">demo</span></p>
            <p>Password: <span className="font-mono text-foreground">password</span></p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-2 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1">
              <span className="text-primary">✓</span> 8 Audio Effects
            </div>
            <div className="flex items-center gap-1">
              <span className="text-primary">✓</span> Multi-track
            </div>
            <div className="flex items-center gap-1">
              <span className="text-primary">✓</span> Live Editing
            </div>
            <div className="flex items-center gap-1">
              <span className="text-primary">✓</span> Export WAV/MP3
            </div>
          </motion.div>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          No account needed - demo login available
        </motion.p>
      </motion.div>
    </div>
  );
}
