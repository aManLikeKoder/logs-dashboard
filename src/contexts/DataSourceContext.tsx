'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import type { DataSource } from '@/lib/types';
import { initialDataSources, addNewMockDataItem } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface DataSourceContextType {
  dataSources: DataSource[];
  addDataSource: (source: Omit<DataSource, 'id'>) => void;
  activeDataSource: DataSource | null;
  setActiveDataSource: (source: DataSource | null) => void;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined
);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] =
    useState<DataSource[]>(initialDataSources);
  const [activeDataSource, setActiveDataSource] =
    useState<DataSource | null>(null);
  const { toast } = useToast();

  const addDataSource = (source: Omit<DataSource, 'id'>) => {
    const newSource: DataSource = {
      ...source,
      id: source.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
    };
    setDataSources((prev) => [...prev, newSource]);
    toast({
      title: 'Success!',
      description: `Data source "${newSource.name}" has been added.`,
    });
  };

  // Simulate new data being added to the active source
  useEffect(() => {
    if (!activeDataSource) return;

    const interval = setInterval(() => {
      // Add new data with a 30% chance every 5 seconds
      if (Math.random() < 0.3) {
        addNewMockDataItem(activeDataSource.id);
        // In a real app, you'd trigger a re-fetch here.
        // For our mock, the new data is added, and a manual refresh will show it.
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeDataSource]);

  return (
    <DataSourceContext.Provider
      value={{
        dataSources,
        addDataSource,
        activeDataSource,
        setActiveDataSource,
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
