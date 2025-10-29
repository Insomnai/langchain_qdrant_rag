import { useState } from "react";
import ChatSidebar, { Chat, UploadedFile } from "./ChatSidebar";
import ChatMessages, { Message } from "./ChatMessages";
import SourcesSidebar from "./SourcesSidebar";
import { useToast } from "@/hooks/use-toast";
import type { ChatResponse, ChatRequest } from "@monorepo/shared";

type ChatViewProps = {
  availableFiles: UploadedFile[];
};

const ChatView = ({ availableFiles }: ChatViewProps) => {
  const { toast } = useToast();
  
  // Chats management
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      name: "Czat domyślny",
      createdAt: new Date().toLocaleDateString("pl-PL"),
      documentIds: [],
    },
  ]);
  const [activeChat, setActiveChat] = useState("1");

  // Messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Witaj! Jestem asystentem RAG. Mogę odpowiadać na pytania na podstawie przesłanych przez Ciebie dokumentów. Jak mogę Ci pomóc?",
      chatId: "1",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter messages for active chat
  const activeChatMessages = messages.filter((m) => m.chatId === activeChat);

  const handleChatCreate = (name: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toLocaleDateString("pl-PL"),
      documentIds: [],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChat(newChat.id);
    
    // Add welcome message for new chat
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Witaj w nowym czacie! Mogę odpowiadać na pytania na podstawie przypisanych dokumentów. Jak mogę Ci pomóc?",
      chatId: newChat.id,
    };
    setMessages((prev) => [...prev, welcomeMessage]);
    
    toast({
      title: "Czat utworzony",
      description: `Pomyślnie utworzono czat "${name}"`,
    });
  };

  const handleChatDelete = (chatId: string) => {
    if (chats.length === 1) {
      toast({
        title: "Nie można usunąć",
        description: "Musisz mieć przynajmniej jeden czat",
        variant: "destructive",
      });
      return;
    }

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessages((prev) => prev.filter((m) => m.chatId !== chatId));

    if (activeChat === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      setActiveChat(remainingChats[0].id);
    }

    toast({
      title: "Czat usunięty",
      description: "Czat został pomyślnie usunięty",
    });
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
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      chatId: activeChat,
    };

    setMessages((prev) => [...prev, userMessage]);
    const questionText = input;
    setInput("");
    setIsLoading(true);

    try {
      const requestBody: ChatRequest = {
        question: questionText,
        k: 3
      };
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (!data.answer) {
        throw new Error('Invalid response from backend: missing answer field');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        chatId: activeChat,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling chat API:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Przepraszam, wystąpił błąd podczas przetwarzania Twojego pytania. Upewnij się, że backend działa i masz skonfigurowane klucze API w pliku .env",
        chatId: activeChat,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Błąd połączenia",
        description: "Nie udało się połączyć z backendem RAG",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-[320px_1fr_320px] gap-4 p-4">
      {/* Chat Sidebar */}
      <div className="rounded-lg overflow-hidden shadow-sm">
        <ChatSidebar
          chats={chats}
          activeChat={activeChat}
          onChatSelect={setActiveChat}
          onChatCreate={handleChatCreate}
          onChatDelete={handleChatDelete}
          onChatDocumentsUpdate={handleChatDocumentsUpdate}
          availableFiles={availableFiles}
        />
      </div>

      {/* Main Chat Area */}
      <div className="rounded-lg overflow-hidden shadow-sm">
        <ChatMessages
          messages={activeChatMessages}
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSend={handleSend}
        />
      </div>

      {/* Sources Sidebar - Desktop Only */}
      <div className="hidden lg:block rounded-lg overflow-hidden shadow-sm">
        <SourcesSidebar messages={activeChatMessages} />
      </div>
    </div>
  );
};

export default ChatView;
