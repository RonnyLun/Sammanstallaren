import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, FileIcon, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onChange: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  error?: string;
}

export function FileUpload({ 
  label, 
  onChange, 
  accept = ".pdf,.doc,.docx", 
  maxSize = 2 * 1024 * 1024, // 2MB default
  multiple = false,
  error
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Filen ${file.name} är för stor. Maximal storlek är ${maxSize / 1024 / 1024}MB`;
    }
    
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const acceptedTypes = accept.split(',');
    if (!acceptedTypes.some(type => type.trim() === fileExtension)) {
      return `Filen ${file.name} är inte en godkänd filtyp`;
    }
    
    return null;
  };

  const handleFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    if (!multiple) {
      setSelectedFiles(validFiles.slice(0, 1));
      onChange(validFiles.slice(0, 1));
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      onChange([...selectedFiles, ...validFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [multiple, selectedFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    
    // Reset the input value so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  }, [multiple, selectedFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      onChange(newFiles);
      return newFiles;
    });
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-[#006EC2] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <Upload className={`w-6 h-6 mx-auto mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />
        <div className="text-sm text-gray-600">
          <span className="text-blue-600 hover:underline">Välj fil</span>
          {' '}eller dra och släpp den här
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Tillåtna filtyper: PDF och Word
          <br />
          Max filstorlek: {maxSize / 1024 / 1024} MB
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          aria-label={label}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <FileIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                aria-label={`Ta bort ${file.name}`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}