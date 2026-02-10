'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type { DataSource } from '@/lib/types';
import { initialDataSources, addNewMockDataItem } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export interface EnrichedDataSource extends DataSource {
  lastUpdatedAt: number;
  newItemsCount: number;
}

interface DataSourceContextType {
  dataSources: EnrichedDataSource[];
  addDataSource: (source: Omit<DataSource, 'id'>) => void;
  activeDataSource: EnrichedDataSource | null;
  setActiveDataSource: (source: EnrichedDataSource | null) => void;
  defaultDataSourceId: string | null;
  setDefaultDataSource: (sourceId: string) => void;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined
);

const DEFAULT_DATA_SOURCE_ID_KEY = 'defaultDataSourceId';

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<EnrichedDataSource[]>(() => {
    return initialDataSources
      .map((ds, index) => ({
        ...ds,
        lastUpdatedAt: Date.now() - index * 1000 * 60, // Stagger timestamps for initial sort
        newItemsCount: 0,
      }))
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  });
  const [activeDataSource, setActiveDataSourceState] =
    useState<EnrichedDataSource | null>(null);
  const [defaultDataSourceId, setDefaultDataSourceId] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    const savedDefaultId = localStorage.getItem(DEFAULT_DATA_SOURCE_ID_KEY);
    if (savedDefaultId) {
      setDefaultDataSourceId(savedDefaultId);
      const defaultSource = dataSources.find((ds) => ds.id === savedDefaultId);
      if (defaultSource && !activeDataSource) {
        setActiveDataSourceState(defaultSource);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

  const addDataSource = (source: Omit<DataSource, 'id'>) => {
    const newSource: EnrichedDataSource = {
      ...source,
      id: source.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      lastUpdatedAt: Date.now(),
      newItemsCount: 0,
    };
    setDataSources((prev) => [...prev, newSource]);
    toast({
      title: 'Success!',
      description: `Data source "${newSource.name}" has been added.`,
    });
  };

  const setDefaultDataSource = (sourceId: string) => {
    localStorage.setItem(DEFAULT_DATA_SOURCE_ID_KEY, sourceId);
    setDefaultDataSourceId(sourceId);
    const source = dataSources.find((s) => s.id === sourceId);
    toast({
      title: 'Default Source Set!',
      description: `"${
        source?.name
      }" will now be loaded by default.`,
    });
  };

  const handleSetActiveDataSource = useCallback(
    (source: EnrichedDataSource | null) => {
      if (source) {
        setDataSources((prev) =>
          prev.map((ds) =>
            ds.id === source.id ? { ...ds, newItemsCount: 0 } : ds
          )
        );
      }
      setActiveDataSourceState(source);
    },
    []
  );

  // Simulate new data being added to random sources
  useEffect(() => {
    if (dataSources.length === 0) return;

    const interval = setInterval(() => {
      // Add new data with a 30% chance every 5 seconds
      if (Math.random() < 0.3) {
        const sourceToUpdateIndex = Math.floor(
          Math.random() * dataSources.length
        );
        const sourceToUpdate = dataSources[sourceToUpdateIndex];

        if (!sourceToUpdate) return;

        addNewMockDataItem(sourceToUpdate.id);

        setDataSources((prev) => {
          return prev.map((ds) => {
            if (ds.id === sourceToUpdate.id) {
              const isCurrentlyActive = activeDataSource?.id === ds.id;
              return {
                ...ds,
                lastUpdatedAt: Date.now(),
                newItemsCount: isCurrentlyActive ? 0 : ds.newItemsCount + 1,
              };
            }
            return ds;
          });
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dataSources, activeDataSource]);

  const sortedDataSources = useMemo(() => {
    return [...dataSources].sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  }, [dataSources]);

  return (
    <DataSourceContext.Provider
      value={{
        dataSources: sortedDataSources,
        addDataSource,
        activeDataSource,
        setActiveDataSource: handleSetActiveDataSource,
        defaultDataSourceId,
        setDefaultDataSource,
      }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSources() {
  const context = useContext(DataSourceContext);
  if (context === undefined) {
    throw new Error('useDataSources must be used within a DataSourceProvider');
  }
  return context;
}
