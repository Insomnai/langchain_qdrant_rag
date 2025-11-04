import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie pola",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.auth.login(email, password);
      
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        
        toast({
          title: "Zalogowano!",
          description: `Witaj, ${response.user.username}!`,
        });
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Błąd logowania",
        description: error.message || "Nieprawidłowy email lub hasło",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-card rounded-2xl border border-border hover-glow">
              <Bot className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-gradient">RAG Assistant</span>
          </h1>
          <p className="text-muted-foreground">Zaloguj się do swojego konta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-8 space-y-6 hover-glow">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="Wprowadź hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                'Zaloguj'
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Dane domyślne: admin@example.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
