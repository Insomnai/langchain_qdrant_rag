import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Source = {
  content: string;
  metadata: Record<string, any>;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  chatId: string;
};

type ChatMessagesProps = {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

const ChatMessages = ({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
}: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5 text-primary" />
                )}
              </div>
              <div
                className={`flex-1 space-y-2 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-4 rounded-xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="inline-block space-y-1 text-sm">
                    <p className="text-muted-foreground font-medium">Źródła ({message.sources.length}):</p>
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-background rounded text-xs"
                      >
                        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground mb-1">
                            {source.metadata?.source || `Dokument ${idx + 1}`}
                          </p>
                          <p className="text-muted-foreground line-clamp-2">
                            {source.content.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="bg-secondary p-4 rounded-xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadaj pytanie..."
            className="resize-none min-h-[60px] max-h-[200px]"
            disabled={isLoading}
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
