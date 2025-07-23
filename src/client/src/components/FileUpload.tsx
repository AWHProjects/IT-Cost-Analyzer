import React, { useState, useCallback } from 'react';
import { uploadAPI } from '../services/api';

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
}

type FileType = 'invoice' | 'usage-report' | 'license-export' | 'vendor-data';

interface UploadFile {
  file: File;
  type: FileType;
  metadata: Record<string, string>;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onUploadError }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  }, []);

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map(file => ({
      file,
      type: 'invoice', // Default type
      metadata: {},
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileType = (index: number, type: FileType) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, type } : file
    ));
  };

  const updateFileMetadata = (index: number, key: string, value: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { 
        ...file, 
        metadata: { ...file.metadata, [key]: value }
      } : file
    ));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (index: number) => {
    const fileToUpload = files[index];
    if (!fileToUpload) return;

    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, status: 'uploading' as const, progress: 0 } : file
    ));

    try {
      let result;
      
      switch (fileToUpload.type) {
        case 'invoice':
          result = await uploadAPI.uploadInvoice(fileToUpload.file, fileToUpload.metadata);
          break;
        case 'usage-report':
          result = await uploadAPI.uploadUsageReport(fileToUpload.file, fileToUpload.metadata);
          break;
        case 'license-export':
          result = await uploadAPI.uploadLicenseExport(fileToUpload.file, fileToUpload.metadata);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      setFiles(prev => prev.map((file, i) => 
        i === index ? { 
          ...file, 
          status: 'completed' as const, 
          progress: 100 
        } : file
      ));

      onUploadComplete?.(result);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      
      setFiles(prev => prev.map((file, i) => 
        i === index ? { 
          ...file, 
          status: 'error' as const, 
          error: errorMessage 
        } : file
      ));

      onUploadError?.(errorMessage);
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.status === 'pending');

    for (const { index } of pendingFiles) {
      await uploadFile(index);
    }
  };

  const getFileTypeOptions = () => [
    { value: 'invoice', label: 'Invoice' },
    { value: 'usage-report', label: 'Usage Report' },
    { value: 'license-export', label: 'License Export' },
    { value: 'vendor-data', label: 'Vendor Data' }
  ];

  const getMetadataFields = (type: FileType) => {
    switch (type) {
      case 'invoice':
        return [
          { key: 'vendor', label: 'Vendor', placeholder: 'e.g., Microsoft' },
          { key: 'period', label: 'Period', placeholder: 'e.g., 2024-01' },
          { key: 'description', label: 'Description', placeholder: 'Optional description' }
        ];
      case 'usage-report':
        return [
          { key: 'application', label: 'Application', placeholder: 'e.g., Slack' },
          { key: 'reportType', label: 'Report Type', placeholder: 'e.g., Monthly Usage' },
          { key: 'dateRange', label: 'Date Range', placeholder: 'e.g., 2024-01 to 2024-03' }
        ];
      case 'license-export':
        return [
          { key: 'source', label: 'Source', placeholder: 'e.g., Admin Portal' },
          { key: 'exportDate', label: 'Export Date', placeholder: 'e.g., 2024-03-15' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">File Upload</h2>
        <p className="text-gray-600">Upload invoices, usage reports, and other SaaS data files</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf,.csv,.xlsx,.xls,.json"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, CSV, Excel, and JSON files up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Files to Upload</h3>
            <button
              onClick={uploadAllFiles}
              disabled={files.every(f => f.status !== 'pending')}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload All
            </button>
          </div>

          <div className="space-y-4">
            {files.map((file, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{file.file.name}</h4>
                    <p className="text-sm text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={file.type}
                      onChange={(e) => updateFileType(index, e.target.value as FileType)}
                      className="input-field text-sm"
                      disabled={file.status === 'uploading' || file.status === 'completed'}
                    >
                      {getFileTypeOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={file.status === 'uploading'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {getMetadataFields(file.type).map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={file.metadata[field.key] || ''}
                        onChange={(e) => updateFileMetadata(index, field.key, e.target.value)}
                        className="input-field text-sm"
                        disabled={file.status === 'uploading' || file.status === 'completed'}
                      />
                    </div>
                  ))}
                </div>

                {/* Status and Progress */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <span className="text-sm text-gray-500">Ready to upload</span>
                    )}
                    {file.status === 'uploading' && (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-600">Uploading...</span>
                      </>
                    )}
                    {file.status === 'completed' && (
                      <>
                        <div className="w-4 h-4 text-green-600">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-green-600">Upload completed</span>
                      </>
                    )}
                    {file.status === 'error' && (
                      <>
                        <div className="w-4 h-4 text-red-600">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-red-600">{file.error}</span>
                      </>
                    )}
                  </div>

                  {file.status === 'pending' && (
                    <button
                      onClick={() => uploadFile(index)}
                      className="btn-primary text-sm"
                    >
                      Upload
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;