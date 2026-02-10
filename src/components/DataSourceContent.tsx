'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDataSources } from '@/contexts/DataSourceContext';
import Welcome from './Welcome';
import DataTable from './DataTable';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RefreshCw, Search, Loader2, Menu } from 'lucide-react';
import { fetchData } from '@/lib/mock-data';
import type { DataItem } from '@/lib/types';
import { useSidebar } from '@/components/ui/sidebar';

const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function DataSourceContent() {
  const { activeDataSource } = useDataSources();
  const { toggleSidebar } = useSidebar();
  const [data, setData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ITEMS_PER_PAGE = 20;

  const fetchSourceData = useCallback(async (isManualRefresh = false) => {
    if (!activeDataSource) return;
    if (isManualRefresh) {
        setIsRefreshing(true);
    } else {
        setIsLoading(true);
    }
    
    try {
      const result = await fetchData({
        sourceId: activeDataSource.id,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        searchQuery: debouncedSearchQuery,
      });
      setData(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to fetch data', error);
      // Handle error with a toast
    } finally {
        if(isManualRefresh) {
            setIsRefreshing(false);
        } else {
            setIsLoading(false);
        }
    }
  }, [activeDataSource, currentPage, debouncedSearchQuery]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on search
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (activeDataSource) {
      fetchSourceData();
    } else {
        setData([]);
    }
  }, [activeDataSource, currentPage, fetchSourceData]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (!activeDataSource) return;

    const intervalId = setInterval(() => {
        fetchSourceData(true); // Perform a "silent" refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [activeDataSource, fetchSourceData]);

  const dataKey = useMemo(() => activeDataSource?.id ?? 'none', [activeDataSource]);

  if (!activeDataSource) {
    return <Welcome />;
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6 lg:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleSidebar}
            >
                <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {activeDataSource.name}
            </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchSourceData(true)} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            key={dataKey}
            data={data}
            source={activeDataSource}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>
    </div>
  );
}
