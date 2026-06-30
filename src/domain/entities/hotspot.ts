export interface HotspotEntity {
  id: string;
  name: string;
  geohash: string;
  lat: number;
  lng: number;
  predictedCategory: 'roads' | 'water' | 'sanitation' | 'lighting' | 'safety';
  riskLevel: 'green' | 'yellow' | 'orange' | 'red';
  growthRate: number; // week-over-week growth percentage (e.g., +34%)
  confidenceScore: number; // 0-100
  citizenExplanation: string;
  preventiveRecommendations: string;
  resourcePlanningInsights: string;
  densityScore: number; // 0-100 normalized score
  clusterCount: number; // total complaints in cluster
  historicalTrend: number[]; // past 5 days time-series activity
  generatedAt: string; // ISO timestamp
  whyGenerated?: string;
  evidenceSupports?: string;
  recommendedAction?: string;
  projectedImpact?: string;
}
