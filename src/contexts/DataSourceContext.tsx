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
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  setDoc,
  limit,
} from 'firebase/firestore';
import { Database } from 'lucide-react';
import { getFirebaseForSource } from '@/lib/firebase-manager';

export interface EnrichedDataSource extends DataSource {
  lastUpdatedAt: number;
  newItemsCount: number;
}

interface DashboardSettings {
  defaultDataSourceId: string | null;
}

interface DataSourceContextType {
  dataSources: EnrichedDataSource[];
  addDataSource: (source: Omit<DataSource, 'id'>) => void;
  updateDataSource: (
    sourceId: string,
    updatedSource: Omit<DataSource, 'id'>
  ) => void;
  deleteDataSource: (sourceId: string) => void;
  activeDataSource: EnrichedDataSource | null;
  setActiveDataSource: (source: EnrichedDataSource | null) => void;
  defaultDataSourceId: string | null;
  setDefaultDataSource: (sourceId: string) => void;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined
);

const SETTINGS_DOC_ID = 'default-settings';

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [dataSources, setDataSources] = useState<EnrichedDataSource[]>([]);
  const [activeDataSource, setActiveDataSourceState] =
    useState<EnrichedDataSource | null>(null);
  const [defaultDataSourceId, setDefaultDataSourceId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [viewTimestamps, setViewTimestamps] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    try {
      const storedTimestamps = localStorage.getItem('viewTimestamps');
      if (storedTimestamps) {
        setViewTimestamps(JSON.parse(storedTimestamps));
      }
    } catch (e) {
      console.error('Could not parse view timestamps from local storage', e);
    }
  }, []);

  // Listen for data source changes from Firestore and sort them
  useEffect(() => {
    const q = query(
      collection(db, 'dataSources'),
      orderBy('lastUpdatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const sourcesFromDb: Omit<EnrichedDataSource, 'newItemsCount'>[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          sourcesFromDb.push({
            id: doc.id,
            name: data.name,
            collectionPath: data.collection,
            firebaseConfig: data.config
              ? JSON.stringify(data.config, null, 2)
              : '{}',
            fieldUsername: data.fieldUsername,
            fieldPassword: data.fieldPassword,
            fieldCreatedAt: data.fieldCreatedAt,
            displayPin: data.displayPin,
            fieldPin: data.fieldPin,
            lastUpdatedAt:
              (data.lastUpdatedAt as Timestamp)?.toMillis() || 0,
          });
        });

        setDataSources((prevSources) => {
          return sourcesFromDb.map((source) => {
            const existing = prevSources.find((s) => s.id === source.id);
            return {
              ...source,
              newItemsCount: existing?.newItemsCount || 0,
            };
          });
        });

        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching data sources:', error);
        toast({
          variant: 'destructive',
          title: 'Firestore Error',
          description:
            'Could not load data sources. Check console for details.',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const sourceIds = useMemo(
    () => dataSources.map((s) => s.id).join(','),
    [dataSources]
  );

  // Set up listeners for each source to detect new submissions
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    dataSources.forEach((source) => {
      const firebase = getFirebaseForSource(source);
      if (!firebase) return;
      const { firestore } = firebase;

      // Query for documents that might be new
      const q = query(
        collection(firestore, source.collectionPath),
        orderBy(source.fieldCreatedAt, 'desc'),
        limit(50) // Check the latest 50 docs for performance
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites) return;

          const lastViewedTimestamp = viewTimestamps[source.id] || 0;
          let newItemsCount = 0;
          let latestTimestampMillis = 0;

          snapshot.forEach((doc) => {
            const docData = doc.data();
            if (docData && docData[source.fieldCreatedAt]) {
              const docTimestamp = (
                docData[source.fieldCreatedAt] as Timestamp
              ).toMillis();
              if (docTimestamp > lastViewedTimestamp) {
                newItemsCount++;
              }
              if (docTimestamp > latestTimestampMillis) {
                latestTimestampMillis = docTimestamp;
              }
            }
          });

          setDataSources((prev) =>
            prev.map((s) =>
              s.id === source.id ? { ...s, newItemsCount } : s
            )
          );

          if (
            latestTimestampMillis > 0 &&
            latestTimestampMillis > source.lastUpdatedAt
          ) {
            const mainDbDocRef = doc(db, 'dataSources', source.id);
            updateDoc(mainDbDocRef, {
              lastUpdatedAt: Timestamp.fromMillis(latestTimestampMillis),
            });
          }
        },
        (err) => {
          console.error(
            `Error listening to source: ${source.name} (${source.id})`,
            err
          );
        }
      );
      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [sourceIds, viewTimestamps]);

  // Listen for settings changes and set initial active data source
  useEffect(() => {
    const settingsDocRef = doc(db, 'Dashboard-settings', SETTINGS_DOC_ID);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      let newDefaultId: string | null = null;
      if (docSnap.exists()) {
        const settings = docSnap.data() as DashboardSettings;
        newDefaultId = settings.defaultDataSourceId;
        setDefaultDataSourceId(newDefaultId);
      }

      if (dataSources.length > 0 && !activeDataSource) {
        const sourceToActivate =
          dataSources.find((ds) => ds.id === newDefaultId) || dataSources[0];
        if (sourceToActivate) {
          setActiveDataSourceState(sourceToActivate);
        }
      }
    });

    return () => unsubscribe();
  }, [dataSources, activeDataSource]);

  const addDataSource = async (source: Omit<DataSource, 'id'>) => {
    try {
      const firestoreDoc = {
        name: source.name,
        config: JSON.parse(source.firebaseConfig),
        collection: source.collectionPath,
        fieldUsername: source.fieldUsername,
        fieldPassword: source.fieldPassword,
        fieldCreatedAt: source.fieldCreatedAt,
        displayPin: source.displayPin,
        fieldPin: source.fieldPin || '',
        lastUpdatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'dataSources'), firestoreDoc);
      toast({
        title: 'Success!',
        description: `Data source "${source.name}" has been added.`,
      });
    } catch (error: any) {
      console.error('Error adding data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to add data source: ${error.message}`,
      });
    }
  };

  const updateDataSource = async (
    sourceId: string,
    updatedSourceData: Omit<DataSource, 'id'>
  ) => {
    const docRef = doc(db, 'dataSources', sourceId);
    try {
      const firestoreDoc = {
        name: updatedSourceData.name,
        config: JSON.parse(updatedSourceData.firebaseConfig),
        collection: updatedSourceData.collectionPath,
        fieldUsername: updatedSourceData.fieldUsername,
        fieldPassword: updatedSourceData.fieldPassword,
        fieldCreatedAt: updatedSourceData.fieldCreatedAt,
        displayPin: updatedSourceData.displayPin,
        fieldPin: updatedSourceData.fieldPin || '',
        lastUpdatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, firestoreDoc);
      toast({
        title: 'Success!',
        description: `Data source "${updatedSourceData.name}" has been updated.`,
      });
    } catch (error: any) {
      console.error('Error updating data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update data source: ${error.message}`,
      });
    }
  };

  const deleteDataSource = async (sourceId: string) => {
    const sourceName = dataSources.find((ds) => ds.id === sourceId)?.name;
    const docRef = doc(db, 'dataSources', sourceId);
    try {
      await deleteDoc(docRef);
      toast({
        title: 'Source Deleted',
        description: `Data source "${sourceName}" has been deleted.`,
      });
      if (activeDataSource?.id === sourceId) {
        setActiveDataSourceState(dataSources[0] || null);
      }
      if (defaultDataSourceId === sourceId) {
        await setDefaultDataSource(''); // Unset default
      }
    } catch (error: any) {
      console.error('Error deleting data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete data source: ${error.message}`,
      });
    }
  };

  const setDefaultDataSource = async (sourceId: string) => {
    const settingsDocRef = doc(db, 'Dashboard-settings', SETTINGS_DOC_ID);
    try {
      await setDoc(
        settingsDocRef,
        { defaultDataSourceId: sourceId || null },
        { merge: true }
      );
      if (sourceId) {
        const source = dataSources.find((s) => s.id === sourceId);
        toast({
          title: 'Default Source Set!',
          description: `"${
            source?.name || 'None'
          }" will now be loaded by default.`,
        });
      }
    } catch (error: any) {
      console.error('Error setting default data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to set default: ${error.message}`,
      });
    }
  };

  const handleSetActiveDataSource = useCallback(
    (source: EnrichedDataSource | null) => {
      if (source) {
        const now = Date.now();
        const newTimestamps = { ...viewTimestamps, [source.id]: now };
        setViewTimestamps(newTimestamps);
        try {
          localStorage.setItem('viewTimestamps', JSON.stringify(newTimestamps));
        } catch (e) {
          console.error('Failed to write to local storage', e);
        }

        // Reset newItemsCount for the active source
        setDataSources((prevSources) =>
          prevSources.map((s) =>
            s.id === source.id ? { ...s, newItemsCount: 0 } : s
          )
        );
      }
      setActiveDataSourceState(source);
    },
    [viewTimestamps]
  );

  const contextValue = useMemo(
    () => ({
      dataSources: dataSources,
      addDataSource,
      updateDataSource,
      deleteDataSource,
      activeDataSource,
      setActiveDataSource: handleSetActiveDataSource,
      defaultDataSourceId,
      setDefaultDataSource,
    }),
    [
      dataSources,
      activeDataSource,
      defaultDataSourceId,
      handleSetActiveDataSource,
    ]
  );

  return (
    <DataSourceContext.Provider value={contextValue}>
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center">
          <Database className="h-12 w-12 animate-pulse text-primary" />
        </div>
      ) : (
        children
      )}
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

    