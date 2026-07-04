'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { BlogPost } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Save,
  AlertCircle, Loader2, Clock, TrendingUp, Feather, BookOpen,
} from 'lucide-react';

interface PostForm {
  title: string; slug: string; content: string; excerpt: string;
  cover_image_url: string; author_name: string; category: string;
  tags: string; status: 'draft' | 'published'; is_featured: boolean;
}

const EMPTY_FORM: PostForm = {
  title: '', slug: '', content: '', excerpt: '',
  cover_image_url: '', author_name: '', category: '',
  tags: '', status: 'draft', is_featured: false,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'archived'>('published');
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
    else { toast.success(post.status === 'published' ? 'Unpublished.' : 'Published.'); fetchPosts(); }
  };

  const published = posts.filter((p) => p.status === 'published');
  const drafts = posts.filter((p) => p.status === 'draft');
  const archived = posts.filter((p) => p.status !== 'published' && p.status !== 'draft');
  const totalViews = posts.reduce((s, p) => s + (p.view_count ?? 0), 0);
  const totalWords = posts.reduce((s, p) => s + Math.floor((p.content?.length || 0) / 5), 0);
  const tabPosts = activeTab === 'published' ? published : activeTab === 'drafts' ? drafts : archived;
  const allCategories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  const criticalDrafts = drafts.slice(0, 3);

  return (
    <div className="space-y-5 pb-10">
      {/* ── 4-stat row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL WORDS', value: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}K` : String(totalWords) },
          { label: 'PUBLISHED', value: published.length },
          { label: 'TOTAL VIEWS', value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews) },
          { label: 'DRAFTS', value: drafts.length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + CTA ── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([
            { id: 'published', label: 'PUBLISHED', count: published.length },
            { id: 'drafts',    label: 'DRAFTS',    count: drafts.length },
            { id: 'archived',  label: 'ARCHIVED',  count: archived.length },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold tracking-wider transition-all ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold tracking-wide transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> + WRITE NEW POST
        </button>
      </div>

      {/* ── Two-column: posts + right panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Posts list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-200">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : tabPosts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No posts here yet.</p>
              <button type="button" onClick={openCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                Write First Post
              </button>
            </div>
          ) : (
            tabPosts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group flex">
                {/* Left image */}
                <div className="w-36 flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 relative">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover_image_url} alt="" className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[120px]">
                      <Feather className="w-8 h-8 text-blue-300" />
                    </div>
                  )}
                </div>
                {/* Right content */}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    {post.category && (
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-blue-100 text-blue-700 rounded uppercase">{post.category}</span>
                    )}
                    <span className="text-[10px] text-gray-400">{timeAgo(post.published_at ?? post.created_at)}</span>
                    {post.is_featured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 group-hover:text-blue-700 transition-colors line-clamp-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed flex-1">{post.excerpt}</p>
                  )}
                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count.toLocaleString()}</span>
                      <span>by {post.author_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => togglePublish(post)} title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${post.status === 'published' ? 'hover:bg-amber-100 text-gray-400 hover:text-amber-600' : 'hover:bg-blue-100 text-gray-400 hover:text-blue-600'}`}>
                        {post.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => openEdit(post)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(post)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Traffic Velocity */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Traffic Velocity</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-end gap-1 h-14">
              {(() => {
                if (posts.length === 0) return <div className="w-full flex items-center justify-center text-xs text-gray-300">No posts yet</div>;
                const byDay = Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (11 - i));
                  const ds = d.toISOString().slice(0, 10);
                  return posts.filter(p => p.created_at?.slice(0, 10) === ds).length;
                });
                const maxVal = Math.max(...byDay, 1);
                return byDay.map((v, i) => (
                  <div key={i} className={`flex-1 rounded-sm ${i >= 9 ? 'bg-blue-500' : 'bg-blue-100'}`} style={{ height: `${Math.max(8, Math.round(v / maxVal * 100))}%` }} />
                ));
              })()}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2"><span>30d ago</span><span>Today</span></div>
          </div>

          {/* Topic Distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase block mb-3">Topic Distribution</span>
            <div className="flex flex-wrap gap-2">
              {allCategories.length > 0
                ? allCategories.map((cat) => (
                    <span key={cat} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">{cat}</span>
                  ))
                : <span className="text-xs text-gray-400">No categories yet</span>
              }
            </div>
          </div>

          {/* Critical Drafts */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">Critical Drafts</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            {criticalDrafts.length > 0 ? (
              <div className="space-y-2">
                {criticalDrafts.map((post) => (
                  <button key={post.id} type="button" onClick={() => openEdit(post)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">{post.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(post.created_at)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No critical drafts</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-12 px-4 pb-8 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <Feather className="w-5 h-5" />
                <h2 className="text-lg font-bold">{editPost ? 'Edit Post' : 'New Blog Post'}</h2>
              </div>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close modal" className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{formError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { label: 'Title *', field: 'title', span: 2, placeholder: 'Post title', mono: false },
                  { label: 'Slug *', field: 'slug', span: 2, placeholder: 'url-friendly-slug', mono: true },
                  { label: 'Author Name *', field: 'author_name', span: 1, placeholder: 'Author name', mono: false },
                  { label: 'Category', field: 'category', span: 1, placeholder: 'e.g. Technology', mono: false },
                  { label: 'Cover Image URL', field: 'cover_image_url', span: 2, placeholder: 'https://...', mono: false },
                ] as const).map(({ label, field, span, placeholder, mono }) => (
                  <div key={field} className={span === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{label}</label>
                    <input value={form[field] as string} onChange={(e) => handleFormChange(field, e.target.value)}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition-all ${mono ? 'font-mono' : ''}`}
                      placeholder={placeholder} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Excerpt</label>
                  <textarea value={form.excerpt} onChange={(e) => handleFormChange('excerpt', e.target.value)} rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white resize-none"
                    placeholder="Short description..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Content *</label>
                  <textarea value={form.content} onChange={(e) => handleFormChange('content', e.target.value)} rows={10}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white resize-y"
                    placeholder="Full post content..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={(e) => handleFormChange('tags', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white"
                    placeholder="tech, innovation, africa" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</label>
                  <select value={form.status} onChange={(e) => handleFormChange('status', e.target.value as 'draft' | 'published')} aria-label="Post status"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={(e) => handleFormChange('is_featured', e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
                  <label htmlFor="is_featured" className="text-sm text-amber-800 font-medium">
                    <Star className="w-3.5 h-3.5 inline mr-1 fill-amber-400 text-amber-400" /> Mark as featured
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-md">
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
            <p className="text-sm text-gray-600 mb-1 line-clamp-1">"{deleteTarget.title}"</p>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Keep it</button>
              <button type="button" onClick={() => handleDelete(deleteTarget)} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors">Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
