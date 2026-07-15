import { useState, useEffect, useCallback } from 'react';

export const useUrlTab = <T extends string>(
  defaultTab: T,
  validTabs: readonly T[]
): [T, (newTab: T) => void] => {
  const [tab, setTab] = useState<T>(defaultTab);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab') as T;
    if (validTabs.includes(t)) {
      setTab(t);
    }
  }, [validTabs]);

  const handleTabChange = useCallback((newTab: T) => {
    setTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url.pathname + url.search);
  }, []);

  return [tab, handleTabChange];
};
