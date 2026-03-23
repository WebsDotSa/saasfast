// ═══════════════════════════════════════════════════════════════════════════════
// Knowledge Base Management — إدارة قاعدة المعرفة
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  language: string;
  usageCount: number;
  helpfulCount: number;
  createdAt: string;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/ai/knowledge');
      const result = await response.json();
      setDocuments(result.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

    try {
      await fetch(`/api/ai/knowledge?id=${id}`, { method: 'DELETE' });
      setDocuments(documents.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('فشل الحذف');
    }
  };

  const categories = ['all', ...Array.from(new Set(documents.map(d => d.category)))];

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(d => d.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📚 قاعدة المعرفة
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                إدارة المستندات والـ FAQ للوكلاء الذكيين
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              + مستند جديد
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المستندات</p>
                <p className="text-3xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الاستخدامات</p>
                <p className="text-3xl font-bold text-gray-900">
                  {documents.reduce((sum, d) => sum + d.usageCount, 0)}
                </p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">معدل الفائدة</p>
                <p className="text-3xl font-bold text-gray-900">
                  {documents.reduce((sum, d) => sum + d.helpfulCount, 0) > 0
                    ? Math.round(
                        (documents.reduce((sum, d) => sum + d.helpfulCount, 0) /
                          documents.reduce((sum, d) => sum + d.usageCount, 1)) * 100
                      )
                    : 0
                  }%
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'الكل' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              لا توجد مستندات
            </h3>
            <p className="text-gray-600 mb-6">
              ابدأ بإضافة مستندات لقاعدة المعرفة لتحسين إجابات الوكيل الذكي
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              إضافة أول مستند
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={() => handleDelete(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddDocumentModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            fetchDocuments();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Document Card Component
// ───────────────────────────────────────────────────────────────────────────────

function DocumentCard({
  document,
  onDelete,
}: {
  document: Document;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {document.title}
          </h3>
          {document.category && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {document.category}
            </span>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          🗑️
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {document.content.substring(0, 150)}...
      </p>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">👁️ {document.usageCount}</span>
          <span className="text-gray-500">✅ {document.helpfulCount}</span>
        </div>
        <span className="text-gray-400 text-xs">
          {new Date(document.createdAt).toLocaleDateString('ar-SA')}
        </span>
      </div>

      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {document.tags.slice(0, 5).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Add Document Modal
// ───────────────────────────────────────────────────────────────────────────────

function AddDocumentModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    language: 'ar',
    useChunking: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add document');
      }

      onAdded();
    } catch (error) {
      console.error('Error adding document:', error);
      alert('حدث خطأ أثناء إضافة المستند');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">إضافة مستند جديد</h2>
          <p className="text-sm text-gray-500 mt-1">
            أضف معلومات لقاعدة المعرفة لتحسين إجابات الذكاء الاصطناعي
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العنوان *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المحتوى *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="مثال: الفوترة"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوسوم (مفصولة بفاصلة)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="دفع, فاتورة, اشتراك"
                dir="rtl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useChunking"
              checked={formData.useChunking}
              onChange={(e) => setFormData({ ...formData, useChunking: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="useChunking" className="text-sm text-gray-700">
              تقسيم المستند الطويل إلى أجزاء (مستحسن للمستندات الطويلة)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
