"use client";

import { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import imageCompression from "browser-image-compression";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  FileText, 
  FileSpreadsheet, 
  File
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  path?: string;
  currentImage?: string;
  label?: string;
  className?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

export function FileUploader({ 
  onUploadComplete, 
  path = "uploads", 
  currentImage, 
  label = "Upload File",
  className,
  multiple = false,
  accept = "image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxSizeMB = 300 // Support up to 300MB
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (type: string) => type.startsWith("image/");
  const isPdf = (type: string) => type === "application/pdf";
  const isExcel = (type: string) => type.includes("excel") || type.includes("spreadsheetml");

  const getFileIcon = (type: string) => {
    if (isImage(type)) return <ImageIcon className="w-8 h-8 text-primary" />;
    if (isPdf(type)) return <FileText className="w-8 h-8 text-red-500" />;
    if (isExcel(type)) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (!multiple) {
      const selectedFile = selectedFiles[0];
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File is too large. Maximum size is ${maxSizeMB}MB`);
        return;
      }

      setFile(selectedFile);
      
      if (isImage(selectedFile.type) && selectedFile.size < 20 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }

      await handleUpload(selectedFile);
    } else {
      // Multiple files upload
      setUploading(true);
      setProgress(0);
      let successCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name} is too large. Skipping.`);
          continue;
        }

        try {
          const url = await new Promise<string | null>((resolve, reject) => {
            const uploadLogic = async () => {
              try {
                let blob: Blob = file;
                if (isImage(file.type) && file.size > 1 * 1024 * 1024 && file.size < 50 * 1024 * 1024) {
                  const options = { maxSizeMB: 2, maxWidthOrHeight: 2560, useWebWorker: true };
                  blob = await imageCompression(file, options).catch(() => file);
                }

                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
                const storageRef = ref(storage, `${path}/${fileName}`);
                const uploadTask = uploadBytesResumable(storageRef, blob);

                uploadTask.on("state_changed", 
                  (snapshot) => {
                    const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(fileProgress);
                  },
                  (err) => reject(err),
                  async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                  }
                );
              } catch (err) {
                reject(err);
              }
            };
            uploadLogic();
          });

          if (url) {
            onUploadComplete(url);
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setUploading(false);
      setProgress(0);
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload) return;

    setUploading(true);
    setProgress(0);

    try {
      let blob: Blob = fileToUpload;

      if (isImage(fileToUpload.type) && fileToUpload.size > 1 * 1024 * 1024) {
        if (fileToUpload.size < 50 * 1024 * 1024) {
          toast.info("Optimizing image...");
          const options = {
            maxSizeMB: 2, 
            maxWidthOrHeight: 2560,
            useWebWorker: true,
          };
          try {
            blob = await imageCompression(fileToUpload, options);
          } catch (e) {
            console.warn("Compression failed, uploading original", e);
            blob = fileToUpload;
          }
        }
      }

      const fileName = `${Date.now()}-${fileToUpload.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storageRef = ref(storage, `${path}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          toast.error("Upload failed: " + error.message);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadURL);
          if (isImage(fileToUpload.type)) {
            setPreview(downloadURL);
          }
          setUploading(false);
          toast.success(`${fileToUpload.name} uploaded successfully`);
        }
      );
    } catch (error) {
      console.error("Process error:", error);
      toast.error("Process failed");
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    onUploadComplete("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && <label className="text-xs font-bold uppercase text-muted-foreground">{label}</label>}
      
      <div 
        className={cn(
          "relative group border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 flex flex-col items-center justify-center min-h-[140px] bg-muted/30 hover:bg-muted/50",
          uploading ? "border-primary/50" : "border-border hover:border-primary/50"
        )}
      >
        {(preview || (file && !isImage(file.type)) || (!file && currentImage)) ? (
          <div className="relative w-full flex flex-col items-center justify-center p-4">
            {(preview || (currentImage && (isImage(file?.type || "image/") || !file))) ? (
              (isImage(file?.type || "") || (!file && currentImage && (currentImage.match(/\.(jpg|jpeg|png|gif|webp|avif)/i)))) ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                  <Image 
                    src={preview || currentImage || "" as any} 
                    alt="Preview" 
                    fill 
                    className={cn("object-cover transition-opacity duration-300", uploading ? "opacity-40" : "opacity-100")} 
                    unoptimized={true}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {getFileIcon(file?.type || (currentImage || ""))}
                  <span className="text-xs font-medium text-center truncate max-w-[200px]">
                    {file ? file.name : "Current File"}
                  </span>
                  {!file && currentImage && (
                    <a href={currentImage} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                      View File
                    </a>
                  )}
                </div>
              )
            ) : null}

            {!uploading && (
              <button 
                onClick={(e) => { e.preventDefault(); clearFile(); }}
                className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-md rounded-full text-muted-foreground hover:text-destructive transition-colors shadow-sm z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <span className="text-xs font-bold text-white drop-shadow-md">{Math.round(progress)}%</span>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              Images, PDFs, or Spreadsheets supported (Max {maxSizeMB}MB)
            </p>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept={accept} 
          multiple={multiple}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className="text-primary flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {progress === 100 ? "Finalizing..." : "Uploading..."}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
