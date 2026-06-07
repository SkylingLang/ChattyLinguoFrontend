import { useEffect, useRef, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loaderRef.current()
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((nextError: unknown) => {
        if (alive) setError(nextError instanceof Error ? nextError.message : 'Something went wrong');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // The caller controls reloads through deps while loaderRef keeps the latest function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, error, loading };
}
