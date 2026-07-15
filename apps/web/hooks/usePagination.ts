import { useState, useMemo } from 'react';

export const usePagination = <T>(items: T[], pageSize: number) => {
  const [page, setPage] = useState(1);
  const [prevLength, setPrevLength] = useState(items.length);

  if (items.length !== prevLength) {
    setPrevLength(items.length);
    setPage(1);
  }

  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    return items.slice((page - 1) * pageSize, page * pageSize);
  }, [items, page, pageSize]);

  const goNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goPrev = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  return {
    page,
    totalPages,
    paginatedItems,
    setPage,
    goNext,
    goPrev,
  };
};
