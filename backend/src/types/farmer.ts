export type FarmerStoryEntry = {
  id: string;
  farmerId: string;
  title: string;
  content: string;
  labels: string[];
  media?: Array<{
    type: 'image' | 'video' | 'audio' | 'link' | 'text';
    url?: string;
    cover?: string;
    title?: string;
    description?: string;
  }>;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type FarmerStoryOverview = {
  farmerId: string;
  farmName: string;
  heroImage?: string;
  region?: string;
  storyHeadline?: string;
  storyContent?: string;
  storyHighlights?: string[];
  storyGallery?: Array<{
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }>;
  certifications?: Array<{
    title: string;
    issuer?: string;
    issuedAt?: string;
    credentialUrl?: string;
  }>;
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
  media?: FarmerStoryEntry['media'];
  publishedAt?: string;
};
