const TECHNOLOGIES = [
  'Babylon.js',
  'WebXR',
  'WebGPU',
  'PBR Materials',
  'Draco Compression',
  'KTX2 Textures',
  'Physics Engine',
  'Real-Time GI',
];

export function TechnologyStrip() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-text-tertiary">
          Powered By
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TECHNOLOGIES.map((tech) => (
            <span
              key={tech}
              className="font-display text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
