'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  Query,
  DocumentData,
  Timestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { useDataSources } from '@/contexts/DataSourceContext';
import Welcome from './Welcome';
import DataTable from './DataTable';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RefreshCw, Search, Loader2, Menu, AlertTriangle } from 'lucide-react';
import type { DataItem } from '@/lib/types';
import { useSidebar } from '@/components/ui/sidebar';
import { getFirebaseForSource } from '@/lib/firebase-manager';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { toast } = useToast();

  const [data, setData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageToLastDoc, setPageToLastDoc] = useState<
    Record<number, DocumentData>
  >({});
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const ITEMS_PER_PAGE = 20;

  const fetchSourceData = useCallback(async () => {
    if (!activeDataSource) return;
    
    setIsLoading(true);
    setError(null);

    const firebase = getFirebaseForSource(activeDataSource);
    if (!firebase) {
      setError(`Failed to initialize Firebase for ${activeDataSource.name}. Please check the configuration.`);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: `Could not connect to Firebase for "${activeDataSource.name}".`,
      });
      setIsLoading(false);
      setData([]);
      return;
    }
    const { firestore } = firebase;

    try {
      let baseQuery: Query<DocumentData> = collection(firestore, activeDataSource.collectionPath);

      if (debouncedSearchQuery) {
        // Firestore doesn't support case-insensitive or partial searches on the backend easily.
        // This is a prefix search. For full-text search, a dedicated service is recommended.
        baseQuery = query(
          baseQuery,
          where(activeDataSource.fieldUsername, '>=', debouncedSearchQuery),
          where(activeDataSource.fieldUsername, '<=', debouncedSearchQuery + '\uf8ff')
        );
      }
      
      const countSnapshot = await getCountFromServer(baseQuery);
      const count = countSnapshot.data().count;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      
      let finalQuery = query(baseQuery, orderBy(activeDataSource.fieldCreatedAt, 'desc'), limit(ITEMS_PER_PAGE));
      
      if (currentPage > 1 && pageToLastDoc[currentPage - 1]) {
        finalQuery = query(finalQuery, startAfter(pageToLastDoc[currentPage - 1]));
      }

      const querySnapshot = await getDocs(finalQuery);
      
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      if (lastVisibleDoc) {
        setPageToLastDoc(prev => ({...prev, [currentPage]: lastVisibleDoc}));
      }

      const newData: DataItem[] = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        const createdAt = docData[activeDataSource.fieldCreatedAt];
        const createdAtObj =
          createdAt instanceof Timestamp
            ? { seconds: createdAt.seconds, nanoseconds: createdAt.nanoseconds }
            : { seconds: 0, nanoseconds: 0 };

        return {
          id: doc.id,
          username: docData[activeDataSource.fieldUsername] || 'N/A',
          createdAt: createdAtObj,
          ...docData,
        };
      });

      setData(newData);

    } catch (err: any) {
      console.error('Failed to fetch data', err);
      const errorMessage = err.message || 'An unknown error occurred.';
      setError(`Failed to fetch data: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Data Fetch Error',
        description: `Could not fetch data from collection "${activeDataSource.collectionPath}". Check permissions and path.`,
      });
      setData([]);
    } finally {
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDataSource, currentPage, debouncedSearchQuery, toast]);

  useEffect(() => {
    // Reset pagination when search or source changes
    setCurrentPage(1);
    setPageToLastDoc({});
  }, [debouncedSearchQuery, activeDataSource]);

  useEffect(() => {
    if (activeDataSource) {
      fetchSourceData();
    } else {
        setData([]);
        setError(null);
    }
  }, [activeDataSource, currentPage, fetchSourceData]);
  
  const dataKey = useMemo(() => `${activeDataSource?.id}-${debouncedSearchQuery}-${currentPage}`, [activeDataSource, debouncedSearchQuery, currentPage]);

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
              placeholder="Search by username (prefix)..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchSourceData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
            <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
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
