import { useState } from "react";
import ChatSidebar, { Chat, UploadedFile } from "./ChatSidebar";
import ChatMessages, { Message } from "./ChatMessages";
import SourcesSidebar from "./SourcesSidebar";
import { useToast } from "@/hooks/use-toast";

const ChatView = () => {
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

  // Available files (shared from FileManagement - in real app would be in global state)
  const [availableFiles] = useState<UploadedFile[]>([
    {
      id: "f1",
      name: "dokument_przykładowy.pdf",
      size: "2.4 MB",
      uploadedAt: "2024-01-15",
    },
  ]);

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

    const currentChat = chats.find((c) => c.id === activeChat);
    const chatDocuments = availableFiles.filter((f) =>
      currentChat?.documentIds.includes(f.id)
    );

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      chatId: activeChat,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Symulacja odpowiedzi AI
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "To jest przykładowa odpowiedź wygenerowana przez model RAG. W rzeczywistej aplikacji tutaj pojawi się odpowiedź oparta na Twoich dokumentach.",
        sources: chatDocuments.length > 0 
          ? chatDocuments.map((doc) => doc.name)
          : ["dokument_A.pdf", "strona_B.docx"],
        chatId: activeChat,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
