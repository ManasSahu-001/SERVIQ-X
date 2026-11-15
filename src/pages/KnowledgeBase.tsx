import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { KnowledgeDocument } from '../types';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { DocumentUploadModal } from '../components/knowledge-base/DocumentUploadModal';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  BookOpen,
  Search,
  UploadCloud,
  FileText,
  Trash2,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const KnowledgeBase: React.FC = () => {
  const { success, error } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeBaseService.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load KB docs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    const handleUpdate = () => loadDocuments();
    window.addEventListener('deskpilot_kb_updated', handleUpdate);
    return () => window.removeEventListener('deskpilot_kb_updated', handleUpdate);
  }, [loadDocuments]);

  const categories = [
    'All',
    'Refund Policy',
    'Shipping Policy',
    'Payment Policy',
    'Product Information',
    'Frequently Asked Questions',
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCat = categoryFilter === 'All' ? true : doc.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [documents, categoryFilter, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    try {
      await knowledgeBaseService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      success(`Document "${name}" removed from knowledge base.`);
    } catch {
      error('Failed to delete document.');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#FFB33F]" />
              Knowledge Base
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Manage the information your AI agent uses to assist customers.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload Document
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#14141B] border border-[#292932] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFB33F]/10 border border-[#FFB33F]/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#FFB33F]" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Total Indexed Docs</div>
              <div className="text-xl font-bold text-white">{documents.length} Files</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#14141B] border border-[#292932] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">RAG Vector Status</div>
              <div className="text-xl font-bold text-emerald-400">100% Synced</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#14141B] border border-[#292932] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Estimated Tokens</div>
              <div className="text-xl font-bold text-white">
                {documents.reduce((acc, d) => acc + (d.tokensCount || 0), 0).toLocaleString()} tokens
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#191920] border border-[#292932] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === c
                      ? 'bg-[#FFB33F] text-black font-semibold'
                      : 'bg-[#191920] text-gray-300 hover:text-white border border-[#292932]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Table / Grid */}
        <div className="bg-[#14141B] border border-[#292932] rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#191920] border-b border-[#292932] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Document Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Tokens</th>
                <th className="py-3.5 px-4">Uploaded</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292932]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading knowledge documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Database className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#FFB33F]" />
                    <p className="text-sm text-white font-semibold mb-1">No documents found</p>
                    <p className="text-xs text-gray-500 mb-4">
                      {searchQuery || categoryFilter !== 'All'
                        ? 'No indexed documents match your search criteria.'
                        : 'Upload policy documents to empower DeskPilot with domain knowledge.'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {(searchQuery || categoryFilter !== 'All') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('All');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#191920] border border-[#292932] text-gray-300 hover:text-white"
                        >
                          Reset Filters
                        </button>
                      )}
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FFB33F] text-black hover:bg-[#F5A623]"
                      >
                        Upload Document
                      </button>
                    </div>
                  </td>
                </tr>

              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#191920] border border-[#292932] flex items-center justify-center text-[#FFB33F] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-sm">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase font-mono">
                            {doc.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#191920] border border-[#292932] text-gray-300">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 font-mono">{doc.size}</td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono">
                      {doc.tokensCount ? doc.tokensCount.toLocaleString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{doc.uploadedAt}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        title="Delete document"
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploaded={() => loadDocuments()}
        />
      </div>
    </DashboardLayout>
  );
};
