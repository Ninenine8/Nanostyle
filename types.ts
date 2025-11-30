export interface ImageAsset {
  id: string;
  url: string; // Can be a remote URL or Base64 data URI
  type: 'person' | 'garment' | 'result';
  isGenerated?: boolean;
  isCustom?: boolean;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  personImage: string;
  garmentImage: string;
  resultImage: string;
}

export enum AppStep {
  SELECT_PERSON = 1,
  SELECT_GARMENT = 2,
  RESULT = 3,
}

export type LoadingState = 'idle' | 'generating_clothes' | 'merging' | 'error';