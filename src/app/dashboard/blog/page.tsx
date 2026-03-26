'use client';

import { useState, useEffect, useCallback } from 'react';
import { CardContent } from '@/components/ui/Card';
import api, { BlogPost } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star,
  Search, Newspaper, Loader2, X, Save, AlertCircle,
  CheckCircle, Clock, BookOpen, Tag, TrendingUp, Feather,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface PostForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  author_name: string;
  category: string;
  tags: string;
  status: 'draft' | 'published';
  is_featured: boolean;
}

const EMPTY_FORM: PostForm = {
  title: '', slug: '', content: '', excerpt: '',
  cover_image_url: '', author_name: '', category: '',
  tags: '', status: 'draft', is_featured: false,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ─── Category color map ─────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  technology: 'bg-blue-100 text-blue-700',
  innovation: 'bg-blue-100 text-blue-700',
  africa: 'bg-amber-100 text-amber-700',
  community: 'bg-blue-100 text-blue-700',
  research: 'bg-blue-100 text-blue-700',
  business: 'bg-blue-100 text-blue-700',
};
function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat?.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
}

/* ─── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({
  post,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  post: BlogPost;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const isPublished = post.status === 'published';
  const initials = post.author_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Cover image / placeholder */}
      <div className="relative h-36 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-hidden flex-shrink-0">
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <BookOpen className="w-12 h-12 text-blue-300" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
            isPublished ? 'bg-blue-500 text-white' : 'bg-amber-400 text-white'
          }`}>
            {isPublished ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        {/* Featured star */}
        {post.is_featured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-400 text-white shadow-sm">
              <Star className="w-3 h-3 fill-white" /> Featured
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category */}
        {post.category && (
          <span className={`self-start px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${categoryColor(post.category)}`}>
            {post.category}
          </span>
        )}

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-700 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{post.excerpt}</p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                <Tag className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-full">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">{initials || '?'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{post.author_name}</p>
              <p className="text-[10px] text-gray-400">{timeAgo(post.published_at ?? post.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-gray-400 text-xs flex-shrink-0">
            <Eye className="w-3 h-3" />
            <span>{post.view_count.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between gap-2">
        <button
          onClick={onTogglePublish}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isPublished
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const result = await api.getBlogPosts();
    if (result.data) setPosts(Array.isArray(result.data) ? result.data : []);
    else if (result.error) toast.error(result.error);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openCreate = () => { setEditPost(null); setForm(EMPTY_FORM); setFormError(''); setShowModal(true); };
  const openEdit = (post: BlogPost) => {
    setEditPost(post);
    setForm({
      title: post.title, slug: post.slug, content: post.content,
      excerpt: post.excerpt, cover_image_url: post.cover_image_url ?? '',
      author_name: post.author_name, category: post.category,
      tags: post.tags?.join(', ') ?? '', status: post.status, is_featured: post.is_featured,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (field: keyof PostForm, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && !editPost) updated.slug = slugify(value as string);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim() || !form.author_name.trim()) {
      setFormError('Title, slug, content, and author are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), cover_image_url: form.cover_image_url || null };
    const result = editPost ? await api.updateBlogPost(editPost.slug, payload) : await api.createBlogPost(payload);
    if (result.error) { setFormError(result.error); }
    else { toast.success(editPost ? 'Post updated.' : 'Post created.'); setShowModal(false); fetchPosts(); }
    setSaving(false);
  };

  const handleDelete = async (post: BlogPost) => {
    await api.deleteBlogPost(post.slug);
    toast.success('Post deleted.');
    setDeleteTarget(null);
    fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    const result = post.status === 'published' ? await api.unpublishBlogPost(post.slug) : await api.publishBlogPost(post.slug);
    if (result.error) toast.error(result.error);
    else { toast.success(post.status === 'published' ? 'Post unpublished.' : 'Post published.'); fetchPosts(); }
  };

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.author_name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || p.status === statusFilter;
    return matchQ && matchS;
  });

  const published = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;
  const totalViews = posts.reduce((s, p) => s + (p.view_count ?? 0), 0);
  return (
    <div className="space-y-6 pb-10">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 px-4 sm:px-6 lg:px-8 py-8 rounded-b-3xl shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 left-20 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Feather className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Blog Management</h1>
            </div>
            <p className="text-blue-100 text-sm ml-13 pl-0.5">
              Create and manage articles published on the Mansa website
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:bg-blue-50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" /> Write New Post
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Posts', value: posts.length, icon: <Newspaper className="w-5 h-5" />, bg: 'from-blue-500 to-blue-600', card: 'from-blue-50 to-blue-100', text: 'text-blue-900', sub: 'text-blue-600' },
          { label: 'Published', value: published, icon: <CheckCircle className="w-5 h-5" />, bg: 'from-blue-500 to-blue-600', card: 'from-blue-50 to-blue-100', text: 'text-blue-900', sub: 'text-blue-600' },
          { label: 'Drafts', value: drafts, icon: <Clock className="w-5 h-5" />, bg: 'from-amber-400 to-amber-500', card: 'from-amber-50 to-amber-100', text: 'text-amber-900', sub: 'text-amber-600' },
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, bg: 'from-blue-800 to-blue-900', card: 'from-blue-100 to-blue-200', text: 'text-blue-900', sub: 'text-blue-700' },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.card} rounded-2xl border-none shadow-sm p-3 sm:p-4 flex items-center justify-between gap-3`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${s.sub}`}>{s.label}</p>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            </div>
            <div className={`w-11 h-11 bg-gradient-to-br ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
          />
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? `All (${posts.length})` : s === 'published' ? `Published (${published})` : `Drafts (${drafts})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Posts grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
          <p className="text-sm font-medium">Loading posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
            <Feather className="w-9 h-9 text-blue-300" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-1">
            {search || statusFilter !== 'all' ? 'No posts match your filters' : 'No posts yet'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {search || statusFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Start writing your first article for the Mansa community.'}
          </p>
          {!(search || statusFilter !== 'all') && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" /> Write First Post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={() => openEdit(post)}
              onDelete={() => setDeleteTarget(post)}
              onTogglePublish={() => togglePublish(post)}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-12 px-4 pb-8 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 my-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <Feather className="w-5 h-5" />
                <h2 className="text-lg font-bold">{editPost ? 'Edit Post' : 'New Blog Post'}</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Title *', field: 'title', span: 2, placeholder: 'Post title', mono: false },
                  { label: 'Slug *', field: 'slug', span: 2, placeholder: 'url-friendly-slug', mono: true },
                  { label: 'Author Name *', field: 'author_name', span: 1, placeholder: 'Author name', mono: false },
                  { label: 'Category', field: 'category', span: 1, placeholder: 'e.g. Technology', mono: false },
                  { label: 'Cover Image URL', field: 'cover_image_url', span: 2, placeholder: 'https://...', mono: false },
                ].map(({ label, field, span, placeholder, mono }) => (
                  <div key={field} className={span === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{label}</label>
                    <input
                      value={form[field as keyof PostForm] as string}
                      onChange={(e) => handleFormChange(field as keyof PostForm, e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition-all ${mono ? 'font-mono' : ''}`}
                      placeholder={placeholder}
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Excerpt</label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => handleFormChange('excerpt', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition-all resize-none"
                    placeholder="Short description shown on blog listing..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Content * (HTML or plain text)</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => handleFormChange('content', e.target.value)}
                    rows={10}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition-all resize-y"
                    placeholder="Full post content..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Tags (comma-separated)</label>
                  <input
                    value={form.tags}
                    onChange={(e) => handleFormChange('tags', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition-all"
                    placeholder="tech, innovation, africa"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => handleFormChange('status', e.target.value as 'draft' | 'published')}
                    aria-label="Post status"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition-all"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={form.is_featured}
                    onChange={(e) => handleFormChange('is_featured', e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <label htmlFor="is_featured" className="text-sm text-amber-800 font-medium">
                    <Star className="w-3.5 h-3.5 inline mr-1 fill-amber-400 text-amber-400" />
                    Mark as featured — appears in the trending section on the website
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editPost ? 'Save Changes' : 'Publish Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete this post?</h3>
            <p className="text-sm font-medium text-gray-600 mb-1 line-clamp-1">"{deleteTarget.title}"</p>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone and will remove the post from the website.</p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
