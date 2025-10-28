import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
};

const FileManagement = () => {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "dokument_przykładowy.pdf",
      size: "2.4 MB",
      uploadedAt: "2024-01-15",
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: new Date().toLocaleDateString("pl-PL"),
    }));

    setFiles((prev) => [...prev, ...uploadedFiles]);
    toast({
      title: "Pliki przesłane",
      description: `Pomyślnie przesłano ${newFiles.length} plik(ów)`,
    });
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
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
            <Button type="button" className="gap-2" asChild>
              <span>
                <Upload className="w-4 h-4" />
                Wybierz pliki z dysku
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
