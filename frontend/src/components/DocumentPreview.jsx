import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, FileText, Image, Film, Music } from "lucide-react";

const getFileIcon = (fileType) => {
  if (!fileType) return FileText;
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Film;
  if (fileType.startsWith('audio/')) return Music;
  return FileText;
};

const isPreviewable = (fileType, fileName) => {
  if (!fileType && !fileName) return false;
  const type = fileType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';
  
  // Images
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) {
    return 'image';
  }
  
  // PDFs
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  
  // Videos
  if (type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(name)) {
    return 'video';
  }
  
  // Audio
  if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) {
    return 'audio';
  }
  
  return false;
};

export const DocumentPreview = ({ 
  open, 
  onOpenChange, 
  document 
}) => {
  const [loading, setLoading] = useState(true);
  
  if (!document) return null;
  
  const previewType = isPreviewable(document.file_type, document.file_name);
  const FileIcon = getFileIcon(document.file_type);

  const renderPreview = () => {
    if (!previewType) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Preview not available
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            This file type cannot be previewed in the browser.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <a href={document.file_url} download={document.file_name}>
                <Download className="w-4 h-4 mr-2" /> Download
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
              </a>
            </Button>
          </div>
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return (
          <div className="flex items-center justify-center min-h-[300px] bg-muted rounded-lg p-4">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
            <img
              src={document.file_url}
              alt={document.file_name}
              className="max-w-full max-h-[60vh] object-contain rounded-lg"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[70vh] bg-muted rounded-lg overflow-hidden">
            <iframe
              src={`${document.file_url}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={document.file_name}
              onLoad={() => setLoading(false)}
            />
          </div>
        );

      case 'video':
        return (
          <div className="w-full bg-black rounded-lg overflow-hidden">
            <video
              controls
              className="w-full max-h-[60vh]"
              onLoadedData={() => setLoading(false)}
            >
              <source src={document.file_url} type={document.file_type} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Music className="w-16 h-16 text-primary mb-4" />
            <p className="text-lg font-medium text-foreground mb-4">
              {document.file_name}
            </p>
            <audio
              controls
              className="w-full max-w-md"
              onLoadedData={() => setLoading(false)}
            >
              <source src={document.file_url} type={document.file_type} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="font-['Merriweather'] flex items-center gap-2">
            <FileIcon className="w-5 h-5" />
            {document.file_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderPreview()}
        </div>

        {/* Document info */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {document.description && (
              <p><span className="font-medium">Description:</span> {document.description}</p>
            )}
            {document.category && (
              <p><span className="font-medium">Category:</span> {document.category}</p>
            )}
            {document.uploaded_at && (
              <p><span className="font-medium">Uploaded:</span> {new Date(document.uploaded_at).toLocaleDateString()}</p>
            )}
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button asChild size="sm">
              <a href={document.file_url} download={document.file_name}>
                <Download className="w-4 h-4 mr-2" /> Download
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;
