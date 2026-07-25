import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Modal, Textarea, UploadProgressDisplay } from '@components/common';
import { usePortfolioStore } from '@store/portfolioStore';
import type { PortfolioItem } from '@store/portfolioStore';
import { modelApi } from '@services/modelApi';
import { formatBytes } from '@utils/format';
import { ROUTES } from '@constants/routes';

export default function DashboardPortfolio() {
  const { items, addItem, updateItem, removeItem } = usePortfolioStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Residential');
  const [description, setDescription] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sizeBytes, setSizeBytes] = useState<number | undefined>();
  const [format, setFormat] = useState<string | undefined>('glb');

  // Upload states
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    percent: number;
    status: 'uploading' | 'complete' | 'error';
    error?: string;
  } | null>(null);

  const resetForm = () => {
    setTitle('');
    setCategory('Residential');
    setDescription('');
    setModelUrl('');
    setThumbnailUrl('');
    setIsPublic(true);
    setSizeBytes(undefined);
    setFormat('glb');
    setEditingItem(null);
    setUploadProgress(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setDescription(item.description);
    setModelUrl(item.modelUrl || '');
    setThumbnailUrl(item.thumbnailUrl || '');
    setIsPublic(item.isPublic);
    setSizeBytes(item.sizeBytes);
    setFormat(item.format);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>, fileType: '3d' | 'thumbnail') => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const file = files[0];
    if (!file) return;

    setUploadProgress({
      fileName: file.name,
      percent: 0,
      status: 'uploading',
    });

    try {
      if (fileType === 'thumbnail' || file.type.startsWith('image/')) {
        // For thumbnails, directly convert to a compressed base64 string to avoid backend model processing
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const MAX_WIDTH = 600;
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        setThumbnailUrl(base64Url);
        setUploadProgress({ fileName: file.name, percent: 100, status: 'complete' });
        setTimeout(() => setUploadProgress(null), 1200);
        return;
      }

      // For 3D models, use the backend API
      let uploadedUrl = '';
      let thumbUrl = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      try {
        const response = await modelApi.upload(file, (progressEvent) => {
          const total = progressEvent.total ?? file.size;
          const loaded = progressEvent.loaded;
          const percent = Math.min(100, Math.round((loaded / total) * 100));
          setUploadProgress((prev) => (prev ? { ...prev, percent } : null));
        });
        uploadedUrl = response.modelUrl;
        if (response.thumbnailUrl) thumbUrl = response.thumbnailUrl;
      } catch (err: any) {
        console.warn('Backend upload failed, using local object URL fallback:', err);
        setUploadProgress((prev) => (prev ? { ...prev, percent: 100 } : null));
        uploadedUrl = URL.createObjectURL(file);
      }

      setModelUrl(uploadedUrl);
      setSizeBytes(file.size);
      setFormat(ext);
      if (thumbUrl) setThumbnailUrl(thumbUrl);

      setUploadProgress({
        fileName: file.name,
        percent: 100,
        status: 'complete',
      });

      setTimeout(() => setUploadProgress(null), 1200);
    } catch (err: any) {
      setUploadProgress({
        fileName: file.name,
        percent: 0,
        status: 'error',
        error: err?.message || 'Upload failed.',
      });
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (editingItem) {
      updateItem(editingItem.id, {
        title,
        category,
        description,
        modelUrl: modelUrl.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        sizeBytes,
        format,
        isPublic,
      });
    } else {
      addItem({
        title,
        category,
        description,
        modelUrl: modelUrl.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        sizeBytes,
        format,
        isPublic,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Portfolio Showcase</h1>
          <p className="mt-1 text-xs text-text-tertiary">
            Manage public & client-accessible 3D model showcases and VR walkthrough experiences.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenAddModal}>
          + New Portfolio Showcase
        </Button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search portfolio items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <div className="flex items-center gap-2">
          {['All', 'Residential', 'Commercial', 'Interior', 'Hospitality'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={
                cat === selectedCategory
                  ? 'rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white'
                  : 'rounded-full border border-border-subtle px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary'
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ITEMS LIST */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel mt-8 rounded-2xl p-12 text-center">
          <p className="text-sm text-text-secondary">No portfolio items added yet.</p>
          <Button variant="secondary" className="mt-4" onClick={handleOpenAddModal}>
            Add First Showcase
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between group">
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-hover">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-text-tertiary">
                      No Preview
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {item.isPublic ? (
                      <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        Public
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        Draft
                      </span>
                    )}

                    {item.modelUrl && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        3D/VR Enabled
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{item.category}</span>
                  <h3 className="mt-1 font-display text-lg font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{item.description}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between text-xs text-text-tertiary mb-3">
                  <span>Size: {formatBytes(item.sizeBytes)}</span>
                  <span>Format: {(item.format || 'glb').toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {item.modelUrl && (
                      <>
                        <Link to={ROUTES.viewer(item.id)}>
                          <Button variant="ghost" size="sm">
                            View 3D
                          </Button>
                        </Link>
                        <Link to={ROUTES.viewer(item.id)}>
                          <Button variant="primary" size="sm">
                            VR Mode
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(item)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeItem(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Portfolio Showcase' : 'Add New Portfolio Showcase'}
        description="Upload 3D model & VR files to display in the public & client portfolio."
      >
        <div className="flex flex-col gap-4">
          <Input label="Showcase Title" placeholder="e.g. Modern Villa Interior" value={title} onChange={(e) => setTitle(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Interior">Interior</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Landscape">Landscape</option>
            </select>
          </div>

          <Textarea label="Description" placeholder="Tell clients about this 3D & VR space design..." value={description} onChange={(e) => setDescription(e.target.value)} />

          {/* 3D MODEL UPLOAD */}
          <div className="rounded-xl border border-border-subtle bg-surface-hover/30 p-3.5">
            <p className="text-xs font-semibold text-text-primary">1. 3D & VR Model (.glb, .gltf)</p>
            <div className="mt-2 flex items-center gap-3">
              <label className="cursor-pointer rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-active">
                Upload File
                <input type="file" accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={(e) => handleFileUpload(e, '3d')} />
              </label>
              {modelUrl && <span className="text-xs text-emerald-400">✓ Model Attached</span>}
            </div>
          </div>

          {uploadProgress && (
            <UploadProgressDisplay
              data={{
                fileName: uploadProgress.fileName,
                percent: uploadProgress.percent,
                status: uploadProgress.status === 'uploading' ? 'uploading' : uploadProgress.status === 'complete' ? 'complete' : 'error',
                error: uploadProgress.error,
              }}
            />
          )}

          {/* THUMBNAIL IMAGE UPLOAD */}
          <div className="rounded-xl border border-border-subtle bg-surface-hover/30 p-3.5">
            <p className="text-xs font-semibold text-text-primary">2. Cover Thumbnail Image (.png, .jpg, .webp)</p>
            <div className="mt-2 flex items-center gap-3">
              <label className="cursor-pointer rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-active">
                Upload Image
                <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} />
              </label>
              {thumbnailUrl && (
                <div className="flex items-center gap-2">
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="h-8 w-12 rounded object-cover border border-border-subtle" />
                  <span className="text-xs text-primary">✓ Attached</span>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer mt-1">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded border-border-subtle text-primary focus:ring-primary" />
            Make Visible to Clients on Public Portfolio Page
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!title.trim()} onClick={handleSave}>
              Save Portfolio Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
