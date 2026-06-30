export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  description?: string;
  codeSnippet?: string;
}

export interface CollectionField {
  name: string;
  type: string;
  description: string;
  isNullable?: boolean;
}

export interface FirestoreCollection {
  name: string;
  path: string;
  description: string;
  fields: CollectionField[];
  securityRulesSummary: string;
}

export interface AIPipeline {
  name: string;
  model: string;
  description: string;
  systemInstruction: string;
  responseSchema?: string;
}

export interface GeohashDemoPoint {
  id: string;
  lat: number;
  lng: number;
  geohash: string;
  label: string;
  isDuplicate: boolean;
  parentId?: string;
}
