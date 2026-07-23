import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Textarea, FileDropZone, UploadProgressDisplay } from '@components/common';
import { useClientStore } from '@store/clientStore';
import { useProjectStore } from '@store/projectStore';
import { PROJECT_CATEGORIES } from '@constants/projectCategories';
import { modelApi } from '@services/modelApi';
import { projectApi } from '@services/projectApi';
import { formatBytes } from '@utils/format';
import type { Project, ProjectCategory, UploadProgress, ProcessingStep, ModelFormat } from '@app-types/project.types';

import { useClients } from '@hooks/useClients';

export interface CreateProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type StepIdx = 1 | 2 | 3 | 4;

export function CreateProjectWizard({ isOpen, onClose, onSuccess }: CreateProjectWizardProps) {
  const { clients } = useClients();
  const addClientFromRegistration = useClientStore((state) => state.addClientFromRegistration);
  const addProject = useProjectStore((state) => state.addProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const removeProject = useProjectStore((state) => state.removeProject);

  const [step, setStep] = useState<StepIdx>(1);

  // Step 1: Project Information
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectType, setProjectType] = useState<ProjectCategory>('kitchen');
  const [location, setLocation] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Step 2: Select/Create Rooms
  const DEFAULT_ROOMS = [
    { id: 'living', label: 'Living Room' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'dining', label: 'Dining' },
    { id: 'office', label: 'Office' },
    { id: 'outdoor', label: 'Outdoor' },
  ];
  const [rooms, setRooms] = useState<string[]>(['kitchen']);
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [customRooms, setCustomRooms] = useState<{ id: string; label: string }[]>([]);

  // Step 3: Model Upload
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedModelData, setUploadedModelData] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: string;
    storageSaved: number;
    processingTime: string;
    modelUrl: string;
    thumbnailUrl?: string;
    format: ModelFormat;
  } | null>(null);

  // Handle Thumbnail preview
  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(objectUrl);
  }, [thumbnailFile]);

  const toggleRoom = (roomId: string) => {
    setRooms((prev) =>
      prev.includes(roomId) ? prev.filter((r) => r !== roomId) : [...prev, roomId],
    );
  };

  const handleAddCustomRoom = () => {
    const val = customRoomInput.trim();
    if (!val) return;
    const id = `custom-${Date.now().toString(36)}`;
    setCustomRooms((prev) => [...prev, { id, label: val }]);
    setRooms((prev) => [...prev, id]);
    setCustomRoomInput('');
  };

  // Drag and Drop validation of metadata
  const handleModelAccepted = async (files: File[]) => {
    const primaryFile = files[0];
    if (!primaryFile) return;

    // Validate characters
    const invalidCharRegex = /[#%&{}\\<>*?/$!'":@+`|=]/;
    if (invalidCharRegex.test(primaryFile.name)) {
      setUploadProgress({
        fileName: primaryFile.name,
        percent: 0,
        status: 'error',
        error: 'Filename contains invalid characters (e.g. #, %, &, {, }). Please rename the file first.',
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

    setUploadProgress({
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
      // Attempt real backend upload
      const response = await modelApi.upload(primaryFile, (progressEvent) => {
        const total = progressEvent.total ?? primaryFile.size;
        const loaded = progressEvent.loaded;
        const percent = (loaded / total) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? loaded / elapsed : 0;
        const remainingBytes = total - loaded;
        const remainingMs = speed > 0 ? (remainingBytes / speed) * 1000 : 0;

        setUploadProgress((prev) => {
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

      // Once uploaded, run simulated optimization pipeline stages
      setUploadProgress((prev) => {
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

      // Pipeline execution animation
      const pipelineSteps = [...steps];
      for (let i = 0; i < pipelineSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const currentStep = pipelineSteps[i];
        if (currentStep) currentStep.status = 'complete';
        const nextStep = pipelineSteps[i + 1];
        if (i < pipelineSteps.length - 1 && nextStep) {
          nextStep.status = 'active';
        }
        setUploadProgress((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            processingSteps: [...pipelineSteps],
          };
        });
      }

      const originalSize = response.originalSize || primaryFile.size;
      const secondsElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      setUploadedModelData({
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: '0%',
        storageSaved: 0,
        processingTime: `${secondsElapsed}s`,
        modelUrl: response.modelUrl,
        thumbnailUrl: response.thumbnailUrl,
        format: primaryFile.name.split('.').pop()?.toLowerCase() as ModelFormat,
      });

      setUploadProgress((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'complete',
          percent: 100,
        };
      });
    } catch (err: any) {
      console.error('Model upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not upload model file.';
      setUploadProgress({
        fileName: primaryFile.name,
        percent: 0,
        status: 'error',
        error: errorMessage,
      });
    }
  };

  const handleFinish = () => {
    // Create and save final project
    const finalClientName = selectedClientId === 'new' || !selectedClientId
      ? clientName
      : clients.find((c) => c.id === selectedClientId)?.name ?? 'Client';

    const finalClientEmail = selectedClientId === 'new' || !selectedClientId
      ? clientEmail
      : clients.find((c) => c.id === selectedClientId)?.email ?? '';

    // Register new client into client store if email provided
    if (finalClientEmail && (selectedClientId === 'new' || !selectedClientId)) {
      addClientFromRegistration({
        name: finalClientName || 'Client',
        email: finalClientEmail,
      });
    }

    const selectedRoomLabels = [
      ...DEFAULT_ROOMS.filter((r) => rooms.includes(r.id)).map((r) => r.label),
      ...customRooms.filter((r) => rooms.includes(r.id)).map((r) => r.label),
    ];

    const projectPayload: Partial<Project> = {
      name: projectName,
      category: projectType,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      modelUrl: uploadedModelData?.modelUrl ?? undefined,
      sizeBytes: uploadedModelData?.optimizedSize ?? 0,
      originalSize: uploadedModelData?.originalSize ?? undefined,
      optimizedSize: uploadedModelData?.optimizedSize ?? undefined,
      rooms: selectedRoomLabels,
      location: location || undefined,
      description: projectDescription || undefined,
      thumbnailUrl: uploadedModelData?.thumbnailUrl || thumbnailPreview || undefined,
      status: uploadedModelData ? 'ready' : 'draft',
      modelFormat: uploadedModelData?.format ?? 'glb',
    };

    // Create a local draft project immediately so UI updates instantly
    const localProj = addProject({
      name: projectName,
      category: projectType,
      clientName: finalClientName,
    });

    updateProject(localProj.id, projectPayload);

    // Persist to backend API
    projectApi
      .create(projectPayload)
      .then((savedProject) => {
        if (savedProject && savedProject.id) {
          // Deduplicate: Remove the temporary local project and insert the backend version
          removeProject(localProj.id);
          useProjectStore.setState((state) => ({
            projects: [savedProject, ...state.projects.filter((p) => p.id !== localProj.id)],
          }));
        }
      })
      .catch((err: unknown) => {
        console.warn('Remote backend project save failed/bypassed, keeping local draft:', err);
      });

    onSuccess?.();
    handleClose();
  };

  const handleClose = () => {
    // Reset wizard states
    setStep(1);
    setProjectName('');
    setProjectDescription('');
    setSelectedClientId('');
    setClientName('');
    setClientEmail('');
    setProjectType('kitchen');
    setLocation('');
    setThumbnailFile(null);
    setRooms(['kitchen']);
    setCustomRooms([]);
    setUploadProgress(null);
    setUploadedModelData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={handleClose} />

      {/* Main wizard card modal */}
      <div className="glass-panel relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface-2/95 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-8 py-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-text-primary">Create New Project</h2>
            <p className="text-xs text-text-secondary">Enterprise Architectural Visualization Wizard</p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Steps navigation bar */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-white/[0.01] px-12 py-3.5">
          {[
            { id: 1, label: 'Project Info' },
            { id: 2, label: 'Rooms SETUP' },
            { id: 3, label: 'Upload MODEL' },
            { id: 4, label: 'Finish' },
          ].map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  step === s.id
                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                    : step > s.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-text-tertiary'
                }`}
              >
                {step > s.id ? '✓' : s.id}
              </div>
              <span
                className={`text-xs font-medium ${
                  step === s.id ? 'text-primary' : step > s.id ? 'text-emerald-400' : 'text-text-tertiary'
                }`}
              >
                {s.label}
              </span>
              {s.id < 4 && <div className="h-px w-16 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Body content with transition animation */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-2xl"
            >
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <h3 className="font-display text-lg font-medium text-text-primary">Project Information</h3>
                  <p className="text-xs text-text-secondary -mt-3">
                    Start by setting up your project name, metadata, and assigning a client user.
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Project Name"
                      placeholder="e.g. Waterfront Penthouse Living Room"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-secondary">Project Category</span>
                      <select
                        className="h-10 rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-primary"
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value as ProjectCategory)}
                      >
                        {PROJECT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Textarea
                    label="Project Description"
                    placeholder="Provide a detailed description of the architectural layout, textures, and client specs..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-secondary">Assigned Client</span>
                      <select
                        className="h-10 rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-primary"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                      >
                        <option value="">-- Assign a Client --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                        <option value="new">Create & Assign New Client</option>
                      </select>
                    </div>

                    <Input
                      label="Location (Optional)"
                      placeholder="e.g. San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {(selectedClientId === 'new' || !selectedClientId) && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl bg-white/[0.02] p-4 border border-white/[0.05]"
                    >
                      <Input
                        label="New Client Name"
                        placeholder="e.g. Elena Rostova"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                      <Input
                        label="New Client Email"
                        type="email"
                        placeholder="elena@example.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                    </motion.div>
                  )}

                  {/* Thumbnail File picker with preview */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-text-secondary">Project Thumbnail (Optional)</span>
                    <div className="flex items-center gap-4">
                      {thumbnailPreview ? (
                        <div className="relative h-20 w-28 overflow-hidden rounded-xl border border-border-subtle bg-black">
                          <img src={thumbnailPreview} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setThumbnailFile(null)}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-primary"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-20 w-28 items-center justify-center rounded-xl border border-dashed border-border-subtle bg-white/[0.02] text-xs text-text-tertiary">
                          No image
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        id="thumbnail-picker"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setThumbnailFile(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('thumbnail-picker')?.click()}
                      >
                        Choose Thumbnail Image
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-display text-lg font-medium text-text-primary">Select or Create Rooms</h3>
                    <p className="text-xs text-text-secondary">Select all the rooms that belong to this visualization project.</p>
                  </div>

                  {/* Visual Rooms Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {DEFAULT_ROOMS.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => toggleRoom(room.id)}
                        className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all hover:scale-[1.01] ${
                          rooms.includes(room.id)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border-subtle bg-white/[0.02] text-text-primary hover:border-white/20'
                        }`}
                      >
                        <span className="text-sm font-semibold">{room.label}</span>
                        <span className="mt-6 text-[10px] uppercase font-bold tracking-wider opacity-60">
                          {rooms.includes(room.id) ? '✓ Selected' : 'Not setup'}
                        </span>
                      </div>
                    ))}
                    {customRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => toggleRoom(room.id)}
                        className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all hover:scale-[1.01] ${
                          rooms.includes(room.id)
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border-subtle bg-white/[0.02] text-text-primary hover:border-white/20'
                        }`}
                      >
                        <span className="text-sm font-semibold truncate">{room.label}</span>
                        <span className="mt-6 text-[10px] uppercase font-bold tracking-wider opacity-60">
                          {rooms.includes(room.id) ? '✓ Selected' : 'Not setup'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Custom Room Input */}
                  <div className="flex items-end gap-3 rounded-2xl bg-white/[0.02] p-4 border border-white/[0.05]">
                    <div className="flex-1">
                      <Input
                        label="Create Custom Room"
                        placeholder="e.g. Master Closet, Dining Balcony"
                        value={customRoomInput}
                        onChange={(e) => setCustomRoomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomRoom();
                          }
                        }}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddCustomRoom}>
                      Add Room
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-display text-lg font-medium text-text-primary">Upload Model</h3>
                    <p className="text-xs text-text-secondary">Upload a 3D visualization model format file (GLB, GLTF, FBX, OBJ, SKP, etc.).</p>
                  </div>

                  {!uploadProgress ? (
                    <FileDropZone onFilesAccepted={handleModelAccepted} />
                  ) : (
                    <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-6 shadow-xl">
                      <UploadProgressDisplay data={uploadProgress} />
                    </div>
                  )}

                  {uploadedModelData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5"
                    >
                      <div className="flex items-center gap-2 text-emerald-400">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M7 10.5L9.5 13L13.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span className="font-display text-sm font-semibold">Model Upload Report</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                        <div>
                          <p className="text-text-tertiary">File Size</p>
                          <p className="mt-0.5 font-medium text-text-primary">{formatBytes(uploadedModelData.originalSize)}</p>
                        </div>
                        <div>
                          <p className="text-text-tertiary">Processing Time</p>
                          <p className="mt-0.5 font-medium text-text-primary">{uploadedModelData.processingTime}</p>
                        </div>
                        <div>
                          <p className="text-text-tertiary">Format</p>
                          <p className="mt-0.5 font-medium uppercase text-text-primary">{uploadedModelData.format}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-text-primary">Project Successfully Created!</h3>
                  <p className="mt-2 text-sm text-text-secondary max-w-md">
                    The premium architectural visualization space is now configured.
                  </p>

                  <div className="mt-8 w-full rounded-2xl border border-border-subtle bg-white/[0.02] p-6 text-left">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Project Summary</h4>
                    <div className="mt-4 flex flex-col gap-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Project Name</span>
                        <span className="font-medium text-text-primary">{projectName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Client Assignee</span>
                        <span className="font-medium text-text-primary">
                          {selectedClientId === 'new' || !selectedClientId ? clientName : clients.find((c) => c.id === selectedClientId)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Uploaded Model</span>
                        <span className="font-medium text-emerald-400">
                          {uploadedModelData ? `${formatBytes(uploadedModelData.originalSize)} (${uploadedModelData.format.toUpperCase()})` : 'Draft Mode (No Model)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Configured Spaces</span>
                        <span className="font-medium text-text-primary">
                          {rooms.length} room{rooms.length !== 1 ? 's' : ''} set up
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border-subtle px-8 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as StepIdx)}
            disabled={step === 3 && uploadProgress?.status === 'uploading'}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-2">
            {step === 3 && !uploadedModelData && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(4)}
                disabled={uploadProgress?.status === 'uploading'}
              >
                Skip upload
              </Button>
            )}

            {step < 4 ? (
              <Button
                type="button"
                variant="primary"
                disabled={
                  (step === 1 && !projectName.trim()) ||
                  (step === 2 && rooms.length === 0) ||
                  (step === 3 && !uploadedModelData)
                }
                onClick={() => setStep((s) => (s + 1) as StepIdx)}
              >
                Next
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleFinish}>
                Finish &amp; Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
