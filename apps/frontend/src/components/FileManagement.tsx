import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UploadedFile } from "./ChatSidebar";
import type { AddDocumentRequest, AddDocumentResponse } from "@monorepo/shared";

type FileManagementProps = {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
};

const FileManagement = ({ files, onFilesChange }: FileManagementProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    const uploadedFilesList: UploadedFile[] = [];
    
    for (const file of newFiles) {
      try {
        const text = await file.text();
        
        const requestBody: AddDocumentRequest = {
          content: text,
          metadata: {
            source: file.name,
            uploadedAt: new Date().toISOString(),
            size: file.size,
            type: file.type,
          },
        };
        
        const response = await fetch('/api/documents/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AddDocumentResponse = await response.json();
        
        if (!data.success || !data.documentId) {
          throw new Error('Invalid response from backend');
        }

        const uploadedFile: UploadedFile = {
          id: data.documentId,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          uploadedAt: new Date().toLocaleDateString("pl-PL"),
        };

        uploadedFilesList.push(uploadedFile);
        
        toast({
          title: "Plik przesłany",
          description: `${file.name} został dodany do bazy RAG`,
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        toast({
          title: "Błąd przesyłania",
          description: `Nie udało się przesłać pliku ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    if (uploadedFilesList.length > 0) {
      onFilesChange((prev) => [...prev, ...uploadedFilesList]);
    }
  }, [onFilesChange, toast]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      setIsUploading(true);
      await handleFiles(droppedFiles);
      setIsUploading(false);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setIsUploading(true);
      await handleFiles(selectedFiles);
      setIsUploading(false);
    }
  }, [handleFiles]);

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter((file) => file.id !== id));
    toast({
      title: "Plik usunięty",
      description: "Plik został pomyślnie usunięty",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 transition-all duration-300
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-muted-foreground"
          }
        `}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-secondary rounded-xl">
            <Upload className="w-12 h-12 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium mb-2">
              Upuść pliki tutaj, aby je dodać
            </p>
            <p className="text-sm text-muted-foreground">
              Lub kliknij przycisk poniżej, aby wybrać pliki
            </p>
          </div>
          <label htmlFor="file-upload">
            <Button type="button" className="gap-2" asChild disabled={isUploading}>
              <span>
                <Upload className="w-4 h-4" />
                {isUploading ? "Przesyłanie..." : "Wybierz pliki z dysku"}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
        </div>
      </div>

      {/* Uploaded Files List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <File className="w-5 h-5 text-primary" />
            Przesłane pliki ({files.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {files.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nie przesłano jeszcze żadnych plików
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="p-4 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-secondary rounded-lg group-hover:bg-background transition-colors">
                    <File className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.uploadedAt}</span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        Przetworzony
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManagement;
