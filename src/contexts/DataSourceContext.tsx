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
import { initialDataSources } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

export interface EnrichedDataSource extends DataSource {
  lastUpdatedAt: number;
}

interface DataSourceContextType {
  dataSources: EnrichedDataSource[];
  addDataSource: (source: Omit<DataSource, 'id'>) => void;
  activeDataSource: EnrichedDataSource | null;
  setActiveDataSource: (source: EnrichedDataSource | null) => void;
  defaultDataSourceId: string | null;
  setDefaultDataSource: (sourceId: string) => void;
  updateSourceTimestamp: (sourceId: string) => void;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined
);

const DEFAULT_DATA_SOURCE_ID_KEY = 'defaultDataSourceId';
const DATA_SOURCES_KEY = 'dataSources';


export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<EnrichedDataSource[]>(() => {
    try {
        const savedSources = localStorage.getItem(DATA_SOURCES_KEY);
        if (savedSources) {
            return JSON.parse(savedSources);
        }
    } catch (e) {
        console.error("Failed to parse data sources from localStorage", e);
    }
    return initialDataSources
      .map((ds, index) => ({
        ...ds,
        lastUpdatedAt: Date.now() - index * 1000 * 60, 
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
    try {
        localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(dataSources));
    } catch(e) {
        console.error("Failed to save data sources to localStorage", e);
    }
  }, [dataSources]);


  useEffect(() => {
    const savedDefaultId = localStorage.getItem(DEFAULT_DATA_SOURCE_ID_KEY);
    if (savedDefaultId) {
      setDefaultDataSourceId(savedDefaultId);
      const defaultSource = dataSources.find((ds) => ds.id === savedDefaultId);
      if (defaultSource && !activeDataSource) {
        setActiveDataSourceState(defaultSource);
      }
    } else if (dataSources.length > 0 && !activeDataSource) {
        // If no default is set, activate the most recently updated one.
        const sorted = [...dataSources].sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
        setActiveDataSourceState(sorted[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on initial mount

  const addDataSource = (source: Omit<DataSource, 'id'>) => {
    const newSource: EnrichedDataSource = {
      ...source,
      id: source.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      lastUpdatedAt: Date.now(),
    };
    setDataSources((prev) => [newSource, ...prev]);
    setActiveDataSourceState(newSource); // Make the new source active
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
      setActiveDataSourceState(source);
    },
    []
  );

  const updateSourceTimestamp = (sourceId: string) => {
    setDataSources(prev => prev.map(ds => 
        ds.id === sourceId ? {...ds, lastUpdatedAt: Date.now()} : ds
    ));
  };

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
        updateSourceTimestamp
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
