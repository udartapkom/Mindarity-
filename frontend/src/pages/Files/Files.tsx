import React, { useState } from 'react';
import FileUpload from '../../components/FileUpload/FileUpload';
import FileList from '../../components/FileList/FileList';
import './Files.scss';

const Files: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadSuccess = (_file: any) => {
    setUploadSuccess(true);
    setShowUpload(false);
    // Обновляем список файлов через небольшой delay
    setTimeout(() => {
      setUploadSuccess(false);
    }, 3000);
  };

  const handleUploadError = (error: string) => {
    alert(`Ошибка загрузки: ${error}`);
  };

  const handleFileDeleted = (fileId: string) => {
    console.log('File deleted:', fileId);
  };

  return (
    <div className="files-page">
      <div className="files-page__header">
        <h1>Управление файлами</h1>
        <button
          className="btn btn--primary"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Скрыть загрузку' : 'Загрузить файл'}
        </button>
      </div>

      {uploadSuccess && (
        <div className="files-page__success">
          ✅ Файл успешно загружен!
        </div>
      )}

      {showUpload && (
        <div className="files-page__upload-section">
          <h2>Загрузка файла</h2>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            maxFileSize={100 * 1024 * 1024} // 100MB
            allowedTypes={[
              'image/*',
              'video/*',
              'audio/*',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/plain',
              'application/json',
              'application/xml',
              'application/zip',
              'application/x-rar-compressed',
              'application/x-7z-compressed'
            ]}
          />
        </div>
      )}

      <div className="files-page__list-section">
        <FileList onFileDeleted={handleFileDeleted} />
      </div>
    </div>
  );
};

export default Files;
