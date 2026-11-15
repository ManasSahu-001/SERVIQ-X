import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { KnowledgeDocument } from '../../types';
import { knowledgeBaseService } from '../../services/knowledgeBaseService';
import { useToast } from '../../contexts/ToastContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (doc: KnowledgeDocument) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
}) => {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<KnowledgeDocument['category']>('Refund Policy');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const categories: KnowledgeDocument['category'][] = [
    'Refund Policy',
    'Shipping Policy',
    'Payment Policy',
    'Product Information',
    'Frequently Asked Questions',
    'General',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExts = ['.pdf', '.txt'];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      error('Please upload only PDF or TXT files.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      error('File size exceeds 25 MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const uploadedDoc = await knowledgeBaseService.uploadDocument(
        selectedFile,
        category,
        (progress) => setUploadProgress(progress)
      );

      success(`Document "${selectedFile.name}" indexed successfully!`);
      onUploaded(uploadedDoc);
      handleReset();
      onClose();
    } catch {
      error('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) {
          handleReset();
          onClose();
        }
      }}
      title="Upload Knowledge Document"
      description="Add policies, manuals, or FAQs to enhance DeskPilot's AI answers"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Category selector */}
        <div>
          <label className="text-gray-300 font-semibold block mb-1.5">Document Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as KnowledgeDocument['category'])}
            disabled={isUploading}
            className="w-full bg-[#14141B] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#FFB33F]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#FFB33F] bg-[#FFB33F]/5'
              : selectedFile
              ? 'border-emerald-500/50 bg-[#141B15]'
              : 'border-[#292932] bg-[#14141B] hover:border-gray-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-white font-semibold text-sm truncate max-w-xs">
                {selectedFile.name}
              </div>
              <div className="text-gray-400 text-[11px]">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready for AI embedding
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-[#191920] border border-[#292932] text-gray-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-[#FFB33F]" />
              </div>
              <div className="text-white font-medium text-xs">
                Click to browse or drag & drop PDF / TXT
              </div>
              <div className="text-gray-400 text-[11px]">Max file size: 25 MB</div>
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="space-y-1.5 p-3 bg-[#14141B] border border-[#292932] rounded-xl">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-300">Extracting text & generating vector embeddings...</span>
              <span className="font-mono text-[#FFB33F]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#292932] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FFB33F] to-[#F5A623] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#292932]">
          <Button
            variant="secondary"
            size="sm"
            disabled={isUploading}
            onClick={() => {
              handleReset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            onClick={handleUpload}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload & Index
          </Button>
        </div>
      </div>
    </Modal>
  );
};
