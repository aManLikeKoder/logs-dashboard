export interface DataSource {
  id: string;
  name: string;
  collectionPath: string;
  firebaseConfig: string; // Stored as JSON string
  fieldUsername: string;
  fieldPassword: string;
  fieldCreatedAt: string;
  displayPin: boolean;
  fieldPin?: string;
}

export interface DataItem {
  id: string;
  username: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  [key: string]: any;
}
