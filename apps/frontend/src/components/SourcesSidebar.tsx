import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "./ChatMessages";

type SourcesSidebarProps = {
  messages: Message[];
};

const SourcesSidebar = ({ messages }: SourcesSidebarProps) => {
  return (
    <div className="h-full bg-card p-4">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        Ostatnie źródła
      </h3>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {messages
            .filter((m) => m.sources && m.sources.length > 0)
            .slice(-5)
            .reverse()
            .map((message) =>
              message.sources?.map((source, idx) => (
                <div
                  key={`${message.id}-${idx}`}
                  className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-all">{source}</span>
                  </div>
                </div>
              ))
            )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SourcesSidebar;
