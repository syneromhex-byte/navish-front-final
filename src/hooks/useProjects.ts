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
        if (!isMounted) return;
        if (!Array.isArray(data)) {
          setError('Could not load projects.');
          return;
        }
        setProjects(data);
      })
      .catch((err) => {
        if (isMounted) setError(getApiErrorMessage(err, 'Could not load projects.'));
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
