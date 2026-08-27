import { useEffect, useState } from 'react';
import { projectApi } from '@services/projectApi';
import { useProjectStore } from '@store/projectStore';
import { getApiErrorMessage } from '@utils/apiError';

export function useProjects() {
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const setLoading = useProjectStore((state) => state.setLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    projectApi
      .list()
      .then((data) => {
        // Merge API fetched data with existing local projects to avoid wiping locally created items
        const existingProjects = useProjectStore.getState().projects;
        const mergedMap = new Map<string, typeof data[0]>();
        existingProjects.forEach((p) => {
          const cleanUrl = p.modelUrl?.includes('example.com') || p.modelUrl?.startsWith('blob:') ? undefined : p.modelUrl;
          mergedMap.set(p.id, { ...p, modelUrl: cleanUrl });
        });
        data.forEach((p) => {
          const cleanUrl = p.modelUrl?.includes('example.com') || p.modelUrl?.startsWith('blob:') ? undefined : p.modelUrl;
          mergedMap.set(p.id, { ...p, modelUrl: cleanUrl });
        });
        setProjects(Array.from(mergedMap.values()));
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, 'Could not load remote projects. Operating in local mode.'));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setProjects, setLoading]);

  return { projects, isLoading, error };
}
