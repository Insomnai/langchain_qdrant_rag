import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
export type Chat = {
  id: string;
  name: string;
  createdAt: string;
  documentIds: string[];
};
export type UploadedFile = {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
};
type ChatSidebarProps = {
  chats: Chat[];
  activeChat: string;
  onChatSelect: (chatId: string) => void;
  onChatCreate: (name: string) => void;
  onChatDelete: (chatId: string) => void;
  onChatDocumentsUpdate: (chatId: string, documentIds: string[]) => void;
  availableFiles: UploadedFile[];
};
const ChatSidebar = ({
  chats,
  activeChat,
  onChatSelect,
  onChatCreate,
  onChatDelete,
  onChatDocumentsUpdate,
  availableFiles
}: ChatSidebarProps) => {
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [selectedChatForDocs, setSelectedChatForDocs] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const handleCreateChat = () => {
    if (newChatName.trim()) {
      onChatCreate(newChatName.trim());
      setNewChatName("");
      setIsNewChatDialogOpen(false);
    }
  };
  const handleOpenDocumentsDialog = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChatForDocs(chatId);
      setSelectedDocuments(chat.documentIds);
      setIsDocumentsDialogOpen(true);
    }
  };
  const handleSaveDocuments = () => {
    if (selectedChatForDocs) {
      onChatDocumentsUpdate(selectedChatForDocs, selectedDocuments);
      setIsDocumentsDialogOpen(false);
      setSelectedChatForDocs(null);
      setSelectedDocuments([]);
    }
  };
  const toggleDocument = (docId: string) => {
    setSelectedDocuments(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
  };
  return <>
      <div className="h-full bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button onClick={() => setIsNewChatDialogOpen(true)} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Nowy czat
          </Button>
        </div>

        {/* Chats List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1 mx-[12px]">
            {chats.map(chat => <ContextMenu key={chat.id}>
                <ContextMenuTrigger>
                  <div onClick={() => onChatSelect(chat.id)} className={`
                      p-3 rounded-lg cursor-pointer transition-all border
                      ${activeChat === chat.id ? "bg-primary/10 border-primary/18" : "border-transparent hover:bg-secondary/80"}
                    `}>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{chat.createdAt}</span>
                          {chat.documentIds.length > 0 && <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {chat.documentIds.length}
                              </span>
                            </>}
                        </div>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleOpenDocumentsDialog(chat.id)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Zarządzaj dokumentami
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onChatDelete(chat.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Usuń czat
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>)}
          </div>
        </ScrollArea>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy czat</DialogTitle>
            <DialogDescription>
              Podaj nazwę dla nowego czatu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chat-name">Nazwa czatu</Label>
              <Input id="chat-name" placeholder="np. Projekt A, Dokumentacja techniczna..." value={newChatName} onChange={e => setNewChatName(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter") handleCreateChat();
            }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChatDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleCreateChat} disabled={!newChatName.trim()}>
              Utwórz czat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={isDocumentsDialogOpen} onOpenChange={setIsDocumentsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Zarządzaj dokumentami czatu</DialogTitle>
            <DialogDescription>
              Wybierz dokumenty, które będą dostępne dla tego czatu
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {availableFiles.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  Brak dostępnych plików. Przejdź do zakładki "Zarządzanie plikami",
                  aby dodać dokumenty.
                </div> : availableFiles.map(file => <div key={file.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => toggleDocument(file.id)}>
                    <Checkbox checked={selectedDocuments.includes(file.id)} onCheckedChange={() => toggleDocument(file.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.uploadedAt}</span>
                      </div>
                    </div>
                  </div>)}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSaveDocuments}>
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
};
export default ChatSidebar;