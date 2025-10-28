import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Files, LogOut } from "lucide-react";
import ChatView from "@/components/ChatView";
import FileManagement from "@/components/FileManagement";

type View = "chat" | "files";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<View>("chat");
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-gradient">RAG Assistant</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={activeView === "chat" ? "default" : "ghost"}
                onClick={() => setActiveView("chat")}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Czat
              </Button>
              <Button
                variant={activeView === "files" ? "default" : "ghost"}
                onClick={() => setActiveView("files")}
                className="gap-2"
              >
                <Files className="w-4 h-4" />
                Zarządzanie plikami
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Wyloguj</span>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="container mx-auto px-4 py-2 flex gap-2">
            <Button
              variant={activeView === "chat" ? "default" : "ghost"}
              onClick={() => setActiveView("chat")}
              className="flex-1 gap-2"
              size="sm"
            >
              <MessageSquare className="w-4 h-4" />
              Czat
            </Button>
            <Button
              variant={activeView === "files" ? "default" : "ghost"}
              onClick={() => setActiveView("files")}
              className="flex-1 gap-2"
              size="sm"
            >
              <Files className="w-4 h-4" />
              Pliki
            </Button>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 container mx-auto p-4 animate-fade-in">
        {activeView === "chat" ? <ChatView /> : <FileManagement />}
      </main>
    </div>
  );
};

export default Dashboard;
