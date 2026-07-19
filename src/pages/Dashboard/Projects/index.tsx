import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dropdown, Input, Loader, Modal, StatusBadge } from '@components/common';
import { useProjects } from '@hooks/useProjects';
import { useProjectStore } from '@store/projectStore';
import { useLocalModelStore } from '@store/localModelStore';
import { projectApi } from '@services/projectApi';
import { ROUTES } from '@constants/routes';
import { formatBytes, formatRelativeDate } from '@utils/format';
import { pickPrimaryModelFile } from '@utils/pickPrimaryModelFile';
import { PROJECT_CATEGORIES, categoryLabel } from '@constants/projectCategories';
import type { Project, ProjectCategory, ProjectStatus } from '@app-types/project.types';

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
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const removeProject = useProjectStore((state) => state.removeProject);
  const addProject = useProjectStore((state) => state.addProject);
  const shareWithClient = useProjectStore((state) => state.shareWithClient);
  const setModelUrl = useProjectStore((state) => state.setModelUrl);
  const setPendingLocalModel = useLocalModelStore((state) => state.setPending);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [linkingProject, setLinkingProject] = useState<Project | null>(null);
  const [modelUrlInput, setModelUrlInput] = useState('');
  const [pickError, setPickError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<ProjectCategory>('kitchen');
  const [newProjectClientName, setNewProjectClientName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.name.toLowerCase().includes(query) ||
        categoryLabel(project.category).toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [projects, search, statusFilter, categoryFilter]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await projectApi.remove(pendingDelete.id);
      removeProject(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setNewProjectName('');
    setNewProjectCategory('kitchen');
    setNewProjectClientName('');
    setIsCreateOpen(true);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const project = addProject({
      name: newProjectName.trim(),
      category: newProjectCategory,
      clientName: newProjectClientName,
    });
    setIsCreateOpen(false);
    openLinkModelModal(project);
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

  const handleLinkModel = () => {
    if (!linkingProject || !modelUrlInput.trim()) return;
    setModelUrl(linkingProject.id, modelUrlInput.trim());
    setLinkingProject(null);
    setModelUrlInput('');
  };

  // No file storage exists yet — there's nowhere to upload a file *to*, so
  // this loads it straight into this browser tab's viewer instead. It won't
  // survive a reload and can't be shared with a client this way; use "Link
  // Model" with a URL for that. Multi-select so a .gltf's sibling .bin/
  // texture files can come along — without them, referenced textures and
  // geometry can't resolve and the model loads dark/incomplete.
  const handlePickLocalFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0 || !linkingProject) return;

    const primary = pickPrimaryModelFile(files);
    if (!primary) {
      setPickError('Select a .glb, .gltf, or .obj file.');
      return;
    }
    setPickError(null);
    setPendingLocalModel(linkingProject.id, primary, files);
    const projectId = linkingProject.id;
    setLinkingProject(null);
    setModelUrlInput('');
    navigate(ROUTES.viewer(projectId));
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Projects</h1>
        <Button variant="primary" size="md" onClick={openCreateModal}>
          New Project
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or category…"
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
              ? 'No projects yet — create one to get started.'
              : 'No projects match your filters.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-tertiary">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Client</th>
                <th className="pb-3 font-medium">Format</th>
                <th className="pb-3 font-medium">Size</th>
                <th className="pb-3 font-medium">Updated</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td className="py-3 font-medium text-text-primary">
                    <p>{project.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {project.modelUrl ? 'Model linked' : 'No model linked yet'}
                    </p>
                  </td>
                  <td className="py-3 text-text-secondary">{categoryLabel(project.category)}</td>
                  <td className="py-3 text-text-secondary">
                    <p>{project.clientName}</p>
                    {project.clientEmail && (
                      <p className="text-xs text-text-tertiary">Shared with {project.clientEmail}</p>
                    )}
                  </td>
                  <td className="py-3 uppercase text-text-secondary">{project.modelFormat}</td>
                  <td className="tabular py-3 text-text-secondary">
                    {formatBytes(project.sizeBytes)}
                  </td>
                  <td className="py-3 text-text-secondary">
                    {formatRelativeDate(project.updatedAt)}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={ROUTES.viewer(project.id)}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button variant="secondary" size="sm" onClick={() => openLinkModelModal(project)}>
                        {project.modelUrl ? 'Change Model' : 'Link Model'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openShareModal(project)}>
                        {project.clientEmail ? 'Reshare' : 'Share with Client'}
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
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Project"
        description="Name it and pick the room category — you'll link the model file next."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Project name"
            placeholder="e.g. Lakeview Kitchen Remodel"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Category</span>
            <Dropdown
              trigger={
                <Button variant="secondary" size="md">
                  {categoryLabel(newProjectCategory)} ▾
                </Button>
              }
              items={PROJECT_CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              }))}
              onSelect={(value) => setNewProjectCategory(value as ProjectCategory)}
            />
          </div>
          <Input
            label="Client name (optional)"
            placeholder="e.g. Priya Raman"
            value={newProjectClientName}
            onChange={(event) => setNewProjectClientName(event.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!newProjectName.trim()}
            onClick={handleCreateProject}
          >
            Create &amp; Link Model
          </Button>
        </div>
      </Modal>

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

      <Modal
        isOpen={!!sharingProject}
        onClose={() => setSharingProject(null)}
        title="Share with Client"
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
            Share
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!linkingProject}
        onClose={() => setLinkingProject(null)}
        title="Link Real Model"
        description={`Paste a direct link to "${linkingProject?.name}"'s .glb/.gltf/.obj file. Once linked, the viewer loads the real model — with material, lighting, environment, walk, and VR support.`}
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
          browser tab, it isn&apos;t saved or shareable until it's linked by URL above. A single
          .glb works on its own — for .gltf, select its .bin file and texture images too.
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
