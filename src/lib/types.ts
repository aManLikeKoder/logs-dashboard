export interface DataSource {
  id: string;
  name: string;
  collectionPath: string;
  firebaseConfig: string; // Stored as JSON string
  fieldUsername: string;
  fieldPassword: 'password' | 'access';
  fieldCreatedAt: string;
  displayPin: boolean;
  fieldPin?: string;
}

export interface DataItem {
  id: string;
  username: string;
  access?: string;
  password?: string;
  pin?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}
