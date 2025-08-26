import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './FileList.scss';

interface File {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: string;
  status: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface FileListProps {
  onFileDeleted?: (fileId: string) => void;
  className?: string;
}

const FileList: React.FC<FileListProps> = ({ onFileDeleted, className = '' }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFiles();
      setFiles(response);
      setError(null);
    } catch (err: any) {
      setError('Ошибка загрузки файлов');
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      await apiService.deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId));
      onFileDeleted?.(fileId);
    } catch (err: any) {
      alert('Ошибка удаления файла');
      console.error('Failed to delete file:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document') || mimeType.includes('text')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  const handleDownload = (file: File) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={`file-list ${className}`}>
        <div className="file-list__loading">Загрузка файлов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`file-list ${className}`}>
        <div className="file-list__error">{error}</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`file-list ${className}`}>
        <div className="file-list__empty">
          <div className="file-list__empty-icon">📁</div>
          <div className="file-list__empty-text">Файлы не найдены</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-list ${className}`}>
      <div className="file-list__header">
        <h3>Мои файлы ({files.length})</h3>
      </div>
      
      <div className="file-list__items">
        {files.map((file) => (
          <div key={file.id} className="file-list__item">
            <div className="file-list__item-icon">
              {getFileIcon(file.mimeType)}
            </div>
            
            <div className="file-list__item-info">
              <div className="file-list__item-name" title={file.originalName}>
                {file.originalName}
              </div>
              <div className="file-list__item-meta">
                <span className="file-list__item-size">
                  {formatFileSize(file.size)}
                </span>
                <span className="file-list__item-date">
                  {formatDate(file.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="file-list__item-actions">
              <button
                className="file-list__action-btn file-list__action-btn--download"
                onClick={() => handleDownload(file)}
                title="Скачать"
              >
                ⬇️
              </button>
              <button
                className="file-list__action-btn file-list__action-btn--delete"
                onClick={() => handleDeleteFile(file.id)}
                title="Удалить"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
