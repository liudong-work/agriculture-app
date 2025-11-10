export type FarmerStoryMedia = {
  type: 'image' | 'video' | 'audio' | 'link' | 'text';
  url?: string;
  cover?: string;
  title?: string;
  description?: string;
};

export type FarmerCertification = {
  title: string;
  issuer?: string;
  issuedAt?: string;
  credentialUrl?: string;
};

export type FarmerStoryOverview = {
  farmerId: string;
  farmName: string;
  heroImage?: string | null;
  region?: string | null;
  storyHeadline?: string | null;
  storyContent?: string | null;
  storyHighlights?: string[];
  storyGallery?: Array<{
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }>;
  certifications?: FarmerCertification[];
};

export type FarmerStoryEntry = {
  id: string;
  farmerId: string;
  title: string;
  content: string;
  labels: string[];
  media?: FarmerStoryMedia[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type FarmerStoryResponse = {
  overview: FarmerStoryOverview | null;
  stories: FarmerStoryEntry[];
};

export type UpdateFarmerStoryPayload = Partial<{
  heroImage: string;
  region: string;
  storyHeadline: string;
  storyContent: string;
  storyHighlights: string[];
  storyGallery: FarmerStoryOverview['storyGallery'];
  certifications: FarmerStoryOverview['certifications'];
}>;

export type CreateFarmerStoryEntryPayload = {
  title: string;
  content: string;
  labels?: string[];
  media?: FarmerStoryMedia[];
  publishedAt?: string;
};
