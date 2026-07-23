import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Dropdown, Input, Loader, Modal, StatusBadge, FileDropZone, UploadProgressDisplay } from '@components/common';
import { useProjects } from '@hooks/useProjects';
import { useProjectStore } from '@store/projectStore';
import { useUserStore } from '@store/userStore';
import { projectApi } from '@services/projectApi';
import { modelApi } from '@services/modelApi';
import { ROUTES } from '@constants/routes';
import { formatBytes, formatRelativeDate } from '@utils/format';
import { resolveServerUrl } from '@utils/resolveServerUrl';
import { pickPrimaryModelFile } from '@utils/pickPrimaryModelFile';
import { PROJECT_CATEGORIES, categoryLabel } from '@constants/projectCategories';
import type { Project, ProjectCategory, ProjectStatus, UploadProgress, ProcessingStep, ModelFormat } from '@app-types/project.types';
import { CreateProjectWizard } from './CreateProjectWizard';

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready', label: 'Ready' },
  { value: 'failed', label: 'Failed' },
];

const CATEGORY_FILTERS: { value: ProjectCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...PROJECT_CATEGORIES,
];

export default function DashboardProjects() {
  const { projects, isLoading } = useProjects();
  const currentUser = useUserStore((state) => state.user);
  const removeProject = useProjectStore((state) => state.removeProject);
  const shareWithClient = useProjectStore((state) => state.shareWithClient);
  const setModelUrl = useProjectStore((state) => state.setModelUrl);
  const updateProjectStore = useProjectStore((state) => state.updateProject);

  // Tab View state: 'projects' | 'models'
  const [activeTab, setActiveTab] = useState<'projects' | 'models'>('projects');

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');

  // Modal / Interaction states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [linkingProject, setLinkingProject] = useState<Project | null>(null);
  const [modelUrlInput, setModelUrlInput] = useState('');

  // Replace Model flow state
  const [replacingProject, setReplacingProject] = useState<Project | null>(null);
  const [replaceProgress, setReplaceProgress] = useState<UploadProgress | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        categoryLabel(project.category).toLowerCase().includes(query) ||
        (project.clientName && project.clientName.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [projects, search, statusFilter, categoryFilter]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      try {
        await projectApi.remove(pendingDelete.id);
      } catch (err) {
        console.warn('Remote project deletion failed, proceeding with local deletion:', err);
      }
      removeProject(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openShareModal = (project: Project) => {
    setSharingProject(project);
    setShareEmail(project.clientEmail ?? '');
  };

  const handleShare = () => {
    if (!sharingProject || !shareEmail.trim()) return;
    shareWithClient(sharingProject.id, shareEmail.trim());
    setSharingProject(null);
    setShareEmail('');
  };

  const openLinkModelModal = (project: Project) => {
    setLinkingProject(project);
    setModelUrlInput(project.modelUrl ?? '');
    setPickError(null);
  };

  const handleLinkModel = async () => {
    if (!linkingProject || !modelUrlInput.trim()) return;
    const targetProject = linkingProject;
    const url = modelUrlInput.trim();
    setModelUrl(targetProject.id, url);
    setLinkingProject(null);
    setModelUrlInput('');
    try {
      await projectApi.update(targetProject.id, { modelUrl: url, status: 'ready' });
    } catch (err) {
      console.error('Failed to update project modelUrl on backend:', err);
    }
  };

  const handlePickLocalFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0 || !linkingProject) return;

    const primary = pickPrimaryModelFile(files);
    if (!primary) {
      setPickError('Select a .glb, .gltf, .obj, or .fbx file.');
      return;
    }
    setPickError(null);

    const targetProject = linkingProject;
    setLinkingProject(null);
    setModelUrlInput('');

    setReplaceProgress({
      fileName: primary.name,
      percent: 0,
      status: 'uploading',
      uploadedBytes: 0,
      totalBytes: primary.size,
      speed: 0,
      remainingMs: 0,
    });

    try {
      const response = await modelApi.upload(primary, (progressEvent) => {
        const total = progressEvent.total ?? primary.size;
        const loaded = progressEvent.loaded;
        const percent = Math.min(100, Math.round((loaded / total) * 100));
        setReplaceProgress((prev) => (prev ? { ...prev, percent, uploadedBytes: loaded, totalBytes: total } : null));
      });

      const originalSize = response.originalSize || primary.size;
      const isFormat = primary.name.split('.').pop()?.toLowerCase() as ModelFormat;

      const updatedFields: Partial<Project> = {
        modelUrl: response.modelUrl,
        sizeBytes: originalSize,
        originalSize,
        optimizedSize: originalSize,
        modelFormat: isFormat,
        thumbnailUrl: response.thumbnailUrl ?? targetProject.thumbnailUrl,
        status: 'ready',
        modelStatus: 'ready',
      };

      updateProjectStore(targetProject.id, updatedFields);
      await projectApi.update(targetProject.id, updatedFields);

      setReplaceProgress({
        fileName: primary.name,
        percent: 100,
        status: 'complete',
      });

      setTimeout(() => {
        setReplaceProgress(null);
      }, 1200);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setReplaceProgress({
        fileName: primary.name,
        percent: 0,
        status: 'error',
        error: err?.message || 'Could not upload model file to backend server.',
      });
    }
  };

  // Replace Model flow
  const handleReplaceModelAccepted = async (files: File[]) => {
    const primaryFile = files[0];
    if (!primaryFile || !replacingProject) return;

    // Validate characters
    const invalidCharRegex = /[#%&{}\\<>*?/$!'":@+`|=]/;
    if (invalidCharRegex.test(primaryFile.name)) {
      setReplaceProgress({
        fileName: primaryFile.name,
        percent: 0,
        status: 'error',
        error: 'Filename contains invalid characters. Please rename the file first.',
      });
      return;
    }

    const steps: ProcessingStep[] = [
      { label: 'Optimizing Model…', status: 'pending' },
      { label: 'Compressing Mesh…', status: 'pending' },
      { label: 'Compressing Textures…', status: 'pending' },
      { label: 'Generating Thumbnail…', status: 'pending' },
      { label: 'Extracting Metadata…', status: 'pending' },
      { label: 'Preparing Viewer…', status: 'pending' },
    ];

    setReplaceProgress({
      fileName: primaryFile.name,
      percent: 0,
      status: 'uploading',
      uploadedBytes: 0,
      totalBytes: primaryFile.size,
      speed: 0,
      remainingMs: 0,
      processingSteps: steps,
    });

    const startTime = Date.now();

    try {
      // Real backend upload
      const response = await modelApi.upload(primaryFile, (progressEvent) => {
        const total = progressEvent.total ?? primaryFile.size;
        const loaded = progressEvent.loaded;
        const percent = (loaded / total) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? loaded / elapsed : 0;
        const remainingBytes = total - loaded;
        const remainingMs = speed > 0 ? (remainingBytes / speed) * 1000 : 0;

        setReplaceProgress((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            percent,
            uploadedBytes: loaded,
            totalBytes: total,
            speed,
            remainingMs,
          };
        });
      });

      setReplaceProgress((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'processing',
          percent: 100,
          processingSteps: prev.processingSteps?.map((s, i) =>
            i === 0 ? { ...s, status: 'active' } : s,
          ),
        };
      });

      const pipelineSteps = [...steps];
      for (let i = 0; i < pipelineSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 650));
        const currentStep = pipelineSteps[i];
        if (currentStep) currentStep.status = 'complete';
        const nextStep = pipelineSteps[i + 1];
        if (i < pipelineSteps.length - 1 && nextStep) {
          nextStep.status = 'active';
        }
        setReplaceProgress((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            processingSteps: [...pipelineSteps],
          };
        });
      }

      const originalSize = response.originalSize || primaryFile.size;
      const isFormat = primaryFile.name.split('.').pop()?.toLowerCase() as ModelFormat;

      // Update project store
      const updatedFields: Partial<Project> = {
        modelUrl: response.modelUrl,
        sizeBytes: originalSize,
        originalSize,
        optimizedSize: undefined,
        modelFormat: isFormat,
        thumbnailUrl: response.thumbnailUrl ?? replacingProject.thumbnailUrl,
        status: 'ready',
        modelStatus: 'ready',
      };

      updateProjectStore(replacingProject.id, updatedFields);

      // Persist to backend DB
      try {
        await projectApi.update(replacingProject.id, updatedFields);
      } catch (err) {
        console.error('Failed to persist project model URL update to backend:', err);
      }

      setReplaceProgress((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'complete',
          percent: 100,
        };
      });

      setTimeout(() => {
        setReplacingProject(null);
        setReplaceProgress(null);
      }, 1000);

    } catch (err) {
      console.error('Model replacement failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not upload replacement model file.';
      setReplaceProgress({
        fileName: primaryFile.name,
        percent: 0,
        status: 'error',
        error: errorMessage,
      });
    }
  };

  const handleDownloadModel = (project: Project) => {
    if (!project.modelUrl) return;
    // Create direct anchor element and download the linked GLB/model
    const link = document.createElement('a');
    link.href = project.modelUrl;
    link.download = `${project.name.replace(/\s+/g, '_')}_model.${project.modelFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8">
      {/* Top section heading and create action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">Dashboard Console</h1>
          <p className="mt-1 text-xs text-text-secondary">Control visualization assets, projects, and role client mappings.</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsWizardOpen(true)}>
          New Project
        </Button>
      </div>

      {/* Tab Switchers */}
      <div className="mt-6 flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-display text-sm font-medium transition-all ${
            activeTab === 'projects'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Projects Layout ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 font-display text-sm font-medium transition-all ${
            activeTab === 'models'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Model Assets ({projects.filter((p) => p.modelUrl).length})
        </button>
      </div>

      {/* Filters options row */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name, client, space…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-64"
        />
        <Dropdown
          trigger={
            <Button variant="secondary" size="md">
              {CATEGORY_FILTERS.find((filter) => filter.value === categoryFilter)?.label} ▾
            </Button>
          }
          items={CATEGORY_FILTERS.map((filter) => ({ value: filter.value, label: filter.label }))}
          onSelect={(value) => setCategoryFilter(value as ProjectCategory | 'all')}
        />
        <Dropdown
          trigger={
            <Button variant="secondary" size="md">
              {STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label} ▾
            </Button>
          }
          items={STATUS_FILTERS.map((filter) => ({ value: filter.value, label: filter.label }))}
          onSelect={(value) => setStatusFilter(value as ProjectStatus | 'all')}
        />
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center py-12">
          <Loader />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel mt-6 rounded-2xl p-10 text-center">
          <p className="text-sm text-text-secondary">
            {projects.length === 0
              ? 'No records found — click "New Project" to configure assets.'
              : 'No matching items matches filters.'}
          </p>
        </div>
      ) : activeTab === 'projects' ? (
        /* PROJECTS VIEW */
        <div className="mt-6 overflow-x-auto select-none">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-tertiary">
                <th className="pb-3 font-medium">Visual space</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Assigned Client</th>
                <th className="pb-3 font-medium">Optimized size</th>
                <th className="pb-3 font-medium">Last updated</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="py-3.5 font-medium text-text-primary">
                    <div className="flex items-center gap-3">
                      {project.thumbnailUrl ? (
                        <img
                          src={resolveServerUrl(project.thumbnailUrl)}
                          alt={project.name}
                          className="h-10 w-14 rounded-lg object-cover bg-black border border-border-subtle"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded-lg bg-white/[0.04] border border-dashed border-border-subtle flex items-center justify-center text-[10px] text-text-tertiary font-normal">
                          No Preview
                        </div>
                      )}
                      <div>
                        <p className="text-sm">{project.name}</p>
                        <p className="text-[11px] text-text-tertiary">
                          {project.rooms && project.rooms.length > 0
                            ? `${project.rooms.join(', ')}`
                            : 'No specific room configurations'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-text-secondary">{categoryLabel(project.category)}</td>
                  <td className="py-3.5 text-text-secondary">
                    <p className="font-semibold text-text-primary">{project.clientName || 'Not Assigned'}</p>
                    {project.clientEmail && (
                      <p className="text-xs text-text-tertiary truncate max-w-[170px]">{project.clientEmail}</p>
                    )}
                  </td>
                  <td className="tabular py-3.5 text-text-secondary">
                    {project.optimizedSize ? formatBytes(project.optimizedSize) : formatBytes(project.sizeBytes)}
                  </td>
                  <td className="py-3.5 text-text-secondary">
                    {formatRelativeDate(project.updatedAt)}
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={project.modelStatus || project.status} />
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link to={ROUTES.viewer(project.id)}>
                        <Button variant="ghost" size="sm">
                          View 3D
                        </Button>
                      </Link>
                      <Button variant="secondary" size="sm" onClick={() => openLinkModelModal(project)}>
                        {project.modelUrl ? 'Replace model' : 'Attach model'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openShareModal(project)}>
                        Share
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setPendingDelete(project)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* MODELS VIEW (Suggest Layout in instructions) */
        <div className="mt-6 overflow-x-auto select-none">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-tertiary">
                <th className="pb-3 font-medium">Model Preview</th>
                <th className="pb-3 font-medium">Model Name</th>
                <th className="pb-3 font-medium">Associated Project</th>
                <th className="pb-3 font-medium">Format</th>
                <th className="pb-3 font-medium">Original Size</th>
                <th className="pb-3 font-medium">Optimized Size</th>
                <th className="pb-3 font-medium">Uploaded By</th>
                <th className="pb-3 font-medium">Upload Date</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProjects
                .filter((p) => p.modelUrl)
                .map((project) => {
                  const modelName = project.modelUrl?.split('/').pop()?.split('?')[0] ?? project.name;
                  return (
                    <tr key={project.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="py-3.5">
                        {project.thumbnailUrl ? (
                          <img
                            src={resolveServerUrl(project.thumbnailUrl)}
                            alt={project.name}
                            className="h-10 w-14 rounded-lg object-cover bg-black border border-border-subtle"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-white/[0.04] border border-dashed border-border-subtle flex items-center justify-center text-[10px] text-text-tertiary">
                            No preview
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 font-medium text-text-primary">
                        <p className="truncate max-w-[200px]" title={modelName}>{modelName}</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-text-tertiary mt-0.5">
                          {project.rooms && project.rooms.length > 0 ? project.rooms.join(' | ') : categoryLabel(project.category)}
                        </p>
                      </td>
                      <td className="py-3.5 text-text-secondary font-medium">{project.name}</td>
                      <td className="py-3.5 uppercase font-medium text-text-secondary">{project.modelFormat}</td>
                      <td className="tabular py-3.5 text-text-secondary">
                        {project.originalSize ? formatBytes(project.originalSize) : formatBytes(project.sizeBytes)}
                      </td>
                      <td className="tabular py-3.5 text-emerald-400 font-medium">
                        {project.optimizedSize ? formatBytes(project.optimizedSize) : formatBytes(project.sizeBytes)}
                      </td>
                      <td className="py-3.5 text-text-secondary">{project.uploadedBy ?? currentUser?.name ?? 'Administrator'}</td>
                      <td className="py-3.5 text-text-secondary">{formatRelativeDate(project.createdAt)}</td>
                      <td className="py-3.5">
                        <StatusBadge status={project.modelStatus || project.status} />
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link to={ROUTES.viewer(project.id)}>
                            <Button variant="ghost" size="sm">
                              Preview
                            </Button>
                          </Link>
                          <Button variant="secondary" size="sm" onClick={() => setReplacingProject(project)}>
                            Replace
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => openShareModal(project)}>
                            Assign
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDownloadModel(project)}>
                            Download
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setPendingDelete(project)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Multi-step New Project Creation Wizard overlay component */}
      <CreateProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Replace Model overlay modal */}
      <Modal
        isOpen={!!replacingProject}
        onClose={() => {
          if (replaceProgress?.status !== 'uploading') {
            setReplacingProject(null);
            setReplaceProgress(null);
          }
        }}
        title="Replace Model Asset"
        description={replacingProject ? `Replace 3D asset file assigned to "${replacingProject.name}" with a revised format.` : ''}
      >
        <div className="mt-4">
          {!replaceProgress ? (
            <FileDropZone
              onFilesAccepted={handleReplaceModelAccepted}
              disabled={false}
            />
          ) : (
            <UploadProgressDisplay data={replaceProgress} />
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            variant="ghost"
            disabled={replaceProgress?.status === 'uploading'}
            onClick={() => {
              setReplacingProject(null);
              setReplaceProgress(null);
            }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* DELETE PROJECT OVERLAY */}
      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete Project"
        description={`"${pendingDelete?.name}" will be permanently removed. This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* SHARE PROJECT OVERLAY */}
      <Modal
        isOpen={!!sharingProject}
        onClose={() => setSharingProject(null)}
        title="Share / Assign Client"
        description={`Give a client access to "${sharingProject?.name}" — it'll appear on their My Models page, viewable on-screen or in VR.`}
      >
        <Input
          label="Client email"
          type="email"
          placeholder="client@example.com"
          value={shareEmail}
          onChange={(event) => setShareEmail(event.target.value)}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSharingProject(null)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!shareEmail.trim()} onClick={handleShare}>
            Save Assignments
          </Button>
        </div>
      </Modal>

      {/* LINK URL MODAL */}
      <Modal
        isOpen={!!linkingProject}
        onClose={() => setLinkingProject(null)}
        title="Link Real Model URL"
        description={`Paste a direct link to "${linkingProject?.name}"'s .glb/.gltf/.obj file. Once linked, the viewer loads this URL model.`}
      >
        <Input
          label="Model URL"
          type="url"
          placeholder="https://example.com/models/my-space.glb"
          value={modelUrlInput}
          onChange={(event) => setModelUrlInput(event.target.value)}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setLinkingProject(null)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!modelUrlInput.trim()} onClick={handleLinkModel}>
            Save
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-tertiary">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          Have the file on this device? Preview it right away — this only loads it into this
          browser tab, it isn&apos;t saved or shareable until it's linked by URL.
        </p>
        {pickError && <p className="mt-2 text-xs text-primary">{pickError}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.obj,.bin,.png,.jpg,.jpeg,.webp,.ktx2"
          multiple
          className="hidden"
          onChange={handlePickLocalFile}
        />
        <Button
          variant="outline"
          size="md"
          className="mt-3 w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose a File to Preview
        </Button>
      </Modal>
    </div>
  );
}
