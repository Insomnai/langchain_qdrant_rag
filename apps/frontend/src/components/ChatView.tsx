import { useState, useEffect } from "react";
import ChatSidebar, { Chat, UploadedFile } from "./ChatSidebar";
import ChatMessages, { Message } from "./ChatMessages";
import SourcesSidebar from "./SourcesSidebar";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type ChatViewProps = {
  availableFiles: UploadedFile[];
};

const ChatView = ({ availableFiles }: ChatViewProps) => {
  const { toast } = useToast();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Load sessions from backend on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await api.chat.getSessions();
      
      if (response.success && response.sessions) {
        const formattedChats: Chat[] = response.sessions.map((session: any) => ({
          id: session.id,
          name: session.title || 'Nowa rozmowa',
          createdAt: new Date(session.created_at).toLocaleDateString("pl-PL"),
          documentIds: [],
        }));
        
        setChats(formattedChats);
        
        // Set first chat as active if exists
        if (formattedChats.length > 0 && !activeChat) {
          setActiveChat(formattedChats[0].id);
        } else if (formattedChats.length === 0) {
          // Create initial chat if none exist
          handleChatCreate("Czat domyślny");
        }
      }
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować historii czatów",
        variant: "destructive",
      });
      
      // Create initial chat on error
      handleChatCreate("Czat domyślny");
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await api.chat.getMessages(sessionId);
      
      if (response.success && response.messages) {
        const formattedMessages: Message[] = response.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources || [],
          chatId: sessionId,
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować wiadomości",
        variant: "destructive",
      });
    }
  };

  const handleChatCreate = async (name: string) => {
    try {
      const response = await api.chat.createSession(name);
      
      if (response.success && response.session) {
        const newChat: Chat = {
          id: response.session.id,
          name: name,
          createdAt: new Date(response.session.created_at).toLocaleDateString("pl-PL"),
          documentIds: [],
        };
        
        setChats((prev) => [newChat, ...prev]);
        setActiveChat(newChat.id);
        setMessages([]);
        
        toast({
          title: "Czat utworzony",
          description: `Pomyślnie utworzono czat "${name}"`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć czatu",
        variant: "destructive",
      });
    }
  };

  const handleChatDelete = async (chatId: string) => {
    if (chats.length === 1) {
      toast({
        title: "Nie można usunąć",
        description: "Musisz mieć przynajmniej jeden czat",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.chat.deleteSession(chatId);
      
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      
      if (activeChat === chatId) {
        const remainingChats = chats.filter((c) => c.id !== chatId);
        setActiveChat(remainingChats[0]?.id || null);
      }

      toast({
        title: "Czat usunięty",
        description: "Czat został pomyślnie usunięty",
      });
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć czatu",
        variant: "destructive",
      });
    }
  };

  const handleChatDocumentsUpdate = (chatId: string, documentIds: string[]) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, documentIds } : chat
      )
    );
    
    toast({
      title: "Dokumenty zaktualizowane",
      description: `Przypisano ${documentIds.length} dokument(ów) do czatu`,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeChat) return;

    const questionText = input;
    setInput("");
    setIsLoading(true);

    // Optimistic UI update
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: questionText,
      chatId: activeChat,
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await api.chat.sendMessage(activeChat, questionText, 3);
      
      if (response.success && response.message) {
        // Remove temp message and add real messages
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== tempUserMessage.id);
          return [
            ...filtered,
            {
              id: `user-${Date.now()}`,
              role: "user",
              content: questionText,
              chatId: activeChat,
            },
            {
              id: response.message.id,
              role: "assistant",
              content: response.message.content,
              sources: response.message.sources || [],
              chatId: activeChat,
            },
          ];
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove temp message
      setMessages((prev) => prev.filter(m => m.id !== tempUserMessage.id));
      
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać wiadomości",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeChatMessages = messages.filter((m) => m.chatId === activeChat);

  if (isLoadingSessions) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Ładowanie czatów...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-[320px_1fr_320px] gap-4 p-4">
      <ChatSidebar
        chats={chats}
        activeChat={activeChat || ""}
        onChatSelect={setActiveChat}
        onChatCreate={handleChatCreate}
        onChatDelete={handleChatDelete}
        onChatDocumentsUpdate={handleChatDocumentsUpdate}
        availableFiles={availableFiles}
      />

      <ChatMessages
        messages={activeChatMessages}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
      />

      <SourcesSidebar
        messages={activeChatMessages.filter((m) => m.role === "assistant")}
      />
    </div>
  );
};

export default ChatView;
