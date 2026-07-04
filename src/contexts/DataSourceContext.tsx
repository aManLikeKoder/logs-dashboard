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
  where,
  getCountFromServer,
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
  addDataSource: (source: Omit<DataSource, 'id'>) => Promise<boolean>;
  updateDataSource: (
    sourceId: string,
    updatedSource: Omit<DataSource, 'id'>
  ) => Promise<boolean>;
  deleteDataSource: (sourceId: string) => Promise<boolean>;
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
  const [timestampsHydrated, setTimestampsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedTimestamps = localStorage.getItem('viewTimestamps');
      if (storedTimestamps) {
        setViewTimestamps(JSON.parse(storedTimestamps));
      }
    } catch (e) {
      console.error('Could not parse view timestamps from local storage', e);
    } finally {
      setTimestampsHydrated(true);
    }
  }, []);

  const updateViewTimestamp = useCallback(
    (sourceId: string, timestamp: number) => {
      setViewTimestamps((currentTimestamps) => {
        if (
          sourceId in currentTimestamps &&
          currentTimestamps[sourceId] >= timestamp
        ) {
          return currentTimestamps;
        }

        const updatedTimestamps = {
          ...currentTimestamps,
          [sourceId]: timestamp,
        };

        try {
          localStorage.setItem(
            'viewTimestamps',
            JSON.stringify(updatedTimestamps)
          );
        } catch (error) {
          console.error('Failed to write view timestamps to local storage', error);
        }

        return updatedTimestamps;
      });
    },
    []
  );

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
          // Preserve the newItemsCount from the client-side state
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

  const sourceListenerKey = useMemo(
    () =>
      dataSources
        .map((source) =>
          JSON.stringify({
            id: source.id,
            collectionPath: source.collectionPath,
            fieldCreatedAt: source.fieldCreatedAt,
            firebaseConfig: source.firebaseConfig,
          })
        )
        .sort()
        .join('|'),
    [dataSources]
  );

  // Listen only for the newest record, then use an aggregate query for an
  // exact unread count without downloading every new document.
  useEffect(() => {
    if (!timestampsHydrated) return;

    const unsubscribers: (() => void)[] = [];
    const countRequestVersions = new Map<string, number>();
    const latestKnownTimestamps = new Map(
      dataSources.map((source) => [source.id, source.lastUpdatedAt])
    );
    let cancelled = false;

    const setNewItemsCount = (sourceId: string, count: number) => {
      if (cancelled) return;

      setDataSources((currentDataSources) =>
        currentDataSources.map((source) =>
          source.id === sourceId && source.newItemsCount !== count
            ? { ...source, newItemsCount: count }
            : source
        )
      );
    };

    dataSources.forEach((source) => {
      const firebase = getFirebaseForSource(source);
      if (!firebase) {
        console.error(
          `Could not get Firebase instance for ${source.name}, skipping listener.`
        );
        return;
      }
      const { firestore } = firebase;

      const q = query(
        collection(firestore, source.collectionPath),
        orderBy(source.fieldCreatedAt, 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.metadata.hasPendingWrites) return;

          const newestDocument = snapshot.docs[0];
          const createdAtField = newestDocument?.data()[source.fieldCreatedAt];
          const latestTimestampMillis =
            createdAtField && typeof createdAtField.toMillis === 'function'
              ? (createdAtField as Timestamp).toMillis()
              : 0;

          const latestKnownTimestamp =
            latestKnownTimestamps.get(source.id) || 0;
          if (
            latestTimestampMillis > 0 &&
            latestTimestampMillis > latestKnownTimestamp
          ) {
            latestKnownTimestamps.set(source.id, latestTimestampMillis);
            updateDoc(doc(db, 'dataSources', source.id), {
              lastUpdatedAt: Timestamp.fromMillis(latestTimestampMillis),
            }).catch((error) => {
              console.error(
                `Failed to update lastUpdatedAt for ${source.name}`,
                error
              );
            });
          }

          const lastViewedTimestamp = viewTimestamps[source.id];

          // Existing records establish the initial baseline and are not
          // incorrectly presented as new the first time this browser visits.
          if (lastViewedTimestamp === undefined) {
            updateViewTimestamp(
              source.id,
              latestTimestampMillis
            );
            setNewItemsCount(source.id, 0);
            return;
          }

          // Records arriving while the source is open are already visible.
          if (activeDataSource?.id === source.id) {
            if (latestTimestampMillis > 0) {
              updateViewTimestamp(source.id, latestTimestampMillis);
            }
            setNewItemsCount(source.id, 0);
            return;
          }

          if (
            latestTimestampMillis === 0 ||
            latestTimestampMillis <= lastViewedTimestamp
          ) {
            setNewItemsCount(source.id, 0);
            return;
          }

          const requestVersion =
            (countRequestVersions.get(source.id) || 0) + 1;
          countRequestVersions.set(source.id, requestVersion);

          try {
            const newRecordsQuery = query(
              collection(firestore, source.collectionPath),
              where(
                source.fieldCreatedAt,
                '>',
                Timestamp.fromMillis(lastViewedTimestamp)
              )
            );
            const countSnapshot = await getCountFromServer(newRecordsQuery);

            if (
              !cancelled &&
              countRequestVersions.get(source.id) === requestVersion
            ) {
              setNewItemsCount(source.id, countSnapshot.data().count);
            }
          } catch (error) {
            console.error(
              `Failed to count new records for ${source.name} (${source.id})`,
              error
            );
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

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sourceListenerKey,
    viewTimestamps,
    activeDataSource?.id,
    timestampsHydrated,
    updateViewTimestamp,
  ]);

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
      return true;
    } catch (error: any) {
      console.error('Error adding data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to add data source: ${error.message}`,
      });
      return false;
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
      return true;
    } catch (error: any) {
      console.error('Error updating data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update data source: ${error.message}`,
      });
      return false;
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
        const nextSource =
          dataSources.find((dataSource) => dataSource.id !== sourceId) || null;
        setActiveDataSourceState(nextSource);
      }
      if (defaultDataSourceId === sourceId) {
        await setDefaultDataSource(''); // Unset default
      }
      return true;
    } catch (error: any) {
      console.error('Error deleting data source: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete data source: ${error.message}`,
      });
      return false;
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
        updateViewTimestamp(source.id, source.lastUpdatedAt || 0);

        // Reset newItemsCount for the active source
        setDataSources((prevSources) =>
          prevSources.map((s) =>
            s.id === source.id ? { ...s, newItemsCount: 0 } : s
          )
        );
      }
      setActiveDataSourceState(source);
    },
    [updateViewTimestamp]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div
          className="flex h-screen w-full flex-col items-center justify-center gap-3 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Database className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-sm">Loading data sources…</p>
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
