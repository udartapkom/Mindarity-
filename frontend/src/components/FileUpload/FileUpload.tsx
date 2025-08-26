import React, { useState, useRef } from 'react';
import apiService from '../../services/api';
import './FileUpload.scss';

interface FileUploadProps {
  onUploadSuccess?: (file: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // в байтах
  allowedTypes?: string[];
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB по умолчанию
  allowedTypes = [],
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Проверяем размер файла
    if (file.size > maxFileSize) {
      return `Файл слишком большой. Максимальный размер: ${formatFileSize(maxFileSize)}`;
    }

    // Проверяем тип файла
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.uploadLargeFile(formData, (progress: number) => {
        setUploadProgress(progress);
      });

      onUploadSuccess?.(response);
      setUploadProgress(100);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка загрузки файла';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`file-upload__drop-zone ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept={allowedTypes.join(',')}
        />
        
        <div className="file-upload__content">
          {isUploading ? (
            <div className="file-upload__progress">
              <div className="file-upload__progress-bar">
                <div 
                  className="file-upload__progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="file-upload__progress-text">
                Загрузка... {uploadProgress}%
              </div>
            </div>
          ) : (
            <>
              <div className="file-upload__icon">📁</div>
              <div className="file-upload__text">
                <strong>Перетащите файл сюда</strong> или нажмите для выбора
              </div>
              <div className="file-upload__hint">
                Максимальный размер: {formatFileSize(maxFileSize)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
