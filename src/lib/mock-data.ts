import type { DataSource, DataItem } from './types';

// --- MOCK DATA SOURCES ---

export const initialDataSources: DataSource[] = [
  {
    id: 'bpwccul',
    name: 'BPWCCUL',
    collectionPath: 'users',
    firebaseConfig: JSON.stringify(
      {
        apiKey: 'AIzaSyDrbOFdO7rsFpV0DcnJO413u_e5wbZComE',
        authDomain: 'cooptimal-cb9de.firebaseapp.com',
        projectId: 'cooptimal-cb9de',
      },
      null,
      2
    ),
    fieldUsername: 'username',
    fieldPassword: 'access',
    fieldCreatedAt: 'createdAt',
    displayPin: true,
    fieldPin: 'pin',
  },
  {
    id: 'another-source',
    name: 'Another Source',
    collectionPath: 'customers',
    firebaseConfig: JSON.stringify(
      {
        apiKey: 'AIzaSyCIgcHwkimZvOjtmKI8mT5EUvBfkUOV8Y0',
        authDomain: 'dashboard-settings-bf761.firebaseapp.com',
        projectId: 'dashboard-settings-bf761',
      },
      null,
      2
    ),
    fieldUsername: 'email',
    fieldPassword: 'password',
    fieldCreatedAt: 'joinedAt',
    displayPin: false,
  },
];

// --- MOCK DATA ITEMS ---

function createRandomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createRandomUser(id: number, source: DataSource): DataItem {
  const date = new Date(
    Date.now() - id * 24 * 60 * 60 * 1000 - Math.random() * 1000 * 60 * 60 * 24
  );
  const dataItem: DataItem = {
    id: `doc_${id}`,
    username: `${createRandomString(6)}_${createRandomString(4)}`,
    createdAt: {
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    },
  };

  if (source.fieldPassword === 'access') {
    dataItem.access = createRandomString(16);
  } else {
    dataItem.password = createRandomString(12);
  }

  if (source.displayPin) {
    dataItem.pin = Math.floor(1000 + Math.random() * 9000).toString();
  }

  return dataItem;
}

const mockDataItems: Record<string, DataItem[]> = {
  bpwccul: Array.from({ length: 153 }, (_, i) =>
    createRandomUser(i, initialDataSources[0])
  ),
  'another-source': Array.from({ length: 78 }, (_, i) =>
    createRandomUser(i, initialDataSources[1])
  ),
};

// Add a function to add new data to simulate real-time updates
export function addNewMockDataItem(sourceId: string) {
  const source = initialDataSources.find((s) => s.id === sourceId);
  if (!source || !mockDataItems[sourceId]) return;

  const newItem = createRandomUser(
    mockDataItems[sourceId].length,
    source
  );
  newItem.createdAt.seconds = Math.floor(Date.now() / 1000); // make it brand new
  mockDataItems[sourceId].unshift(newItem);
}

// --- MOCK API ---

interface FetchDataParams {
  sourceId: string;
  page: number;
  limit: number;
  searchQuery: string;
}

interface FetchDataResponse {
  data: DataItem[];
  totalPages: number;
  totalCount: number;
}

export const fetchData = (
  params: FetchDataParams
): Promise<FetchDataResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { sourceId, page, limit, searchQuery } = params;
      let sourceData = mockDataItems[sourceId] || [];

      // 1. Filter by search query
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        sourceData = sourceData.filter((item) => {
          const createdAtDate = new Date(item.createdAt.seconds * 1000);
          return (
            item.username.toLowerCase().includes(lowercasedQuery) ||
            (item.access &&
              item.access.toLowerCase().includes(lowercasedQuery)) ||
            (item.password &&
              item.password.toLowerCase().includes(lowercasedQuery)) ||
            (item.pin && item.pin.includes(lowercasedQuery)) ||
            createdAtDate.toLocaleString().toLowerCase().includes(lowercasedQuery)
          );
        });
      }

      // 2. Paginate
      const totalCount = sourceData.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = sourceData.slice(startIndex, endIndex);

      resolve({
        data: paginatedData,
        totalPages,
        totalCount
      });
    }, 500 + Math.random() * 500); // Simulate network latency
  });
};
