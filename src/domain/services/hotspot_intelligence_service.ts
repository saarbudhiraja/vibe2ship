import { HotspotEntity } from '../entities/hotspot';

export class HotspotIntelligenceService {
  /**
   * Performs client-side heuristic cluster calculation. This acts as the pure business-logic domain validator,
   * grouping complaints and deriving density metrics, historical time-series trends, and dominant types.
   */
  public calculateClusters(complaints: any[]): {
    geohashSector: string;
    lat: number;
    lng: number;
    clusterCount: number;
    densityScore: number;
    dominantCategory: 'roads' | 'water' | 'sanitation' | 'lighting' | 'safety';
    averageSeverity: number;
    historicalTrend: number[];
    complaintIds: string[];
  }[] {
    const groupings: Record<string, any[]> = {};

    complaints.forEach(complaint => {
      // Use 5-character geohash as sector grid (represents ~4.9km x 4.9km)
      const fullGeohash = complaint.location?.geohash || '';
      const sector = fullGeohash.slice(0, 5) || 'unmapped';
      
      if (!groupings[sector]) {
        groupings[sector] = [];
      }
      groupings[sector].push(complaint);
    });

    const sectors = Object.keys(groupings).filter(s => s !== 'unmapped');
    if (sectors.length === 0) return [];

    // Find maximum cluster count for normalization of densityScore
    const maxCount = Math.max(...sectors.map(s => groupings[s].length), 1);

    return sectors.map(sector => {
      const items = groupings[sector];
      
      // Calculate average coordinates
      let sumLat = 0;
      let sumLng = 0;
      items.forEach(c => {
        sumLat += c.location?.latitude || c.location?.lat || 0;
        sumLng += c.location?.longitude || c.location?.lng || 0;
      });
      const avgLat = sumLat / items.length;
      const avgLng = sumLng / items.length;

      // Determine dominant category
      const categoryCounts: Record<string, number> = {};
      items.forEach(c => {
        const cat = c.category || 'roads';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      
      let dominantCategory: 'roads' | 'water' | 'sanitation' | 'lighting' | 'safety' = 'roads';
      let maxCatCount = 0;
      (Object.keys(categoryCounts) as any[]).forEach(cat => {
        if (categoryCounts[cat] > maxCatCount) {
          maxCatCount = categoryCounts[cat];
          dominantCategory = cat;
        }
      });

      // Calculate average severity
      const sumSeverity = items.reduce((sum, c) => sum + (c.severityScore || 30), 0);
      const avgSeverity = sumSeverity / items.length;

      // Calculate density score (0 - 100)
      const densityScore = Math.min(100, Math.round((items.length / maxCount) * 80 + (avgSeverity / 100) * 20));

      // Synthesize past 5 days of activity as historical trend
      const dailyTrend = [0, 0, 0, 0, 0];
      const now = Date.now();
      items.forEach(c => {
        const createdAt = c.createdAt ? new Date(c.createdAt).getTime() : now;
        const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 5) {
          dailyTrend[4 - diffDays] += 1;
        } else {
          // Default background activity weight
          dailyTrend[Math.floor(Math.random() * 5)] += 1;
        }
      });

      return {
        geohashSector: sector,
        lat: avgLat,
        lng: avgLng,
        clusterCount: items.length,
        densityScore,
        dominantCategory,
        averageSeverity: avgSeverity,
        historicalTrend: dailyTrend,
        complaintIds: items.map(c => c.id)
      };
    });
  }

  /**
   * Derives responsible department predicted for a category.
   */
  public getResponsibleDepartment(category: string): string {
    switch (category) {
      case 'roads':
        return 'Department of Public Works & Engineering';
      case 'water':
        return 'Municipal Water Board & Sewers';
      case 'sanitation':
        return 'Sanitation & Solid Waste Management';
      case 'lighting':
        return 'Electrical Utility Grid Services';
      case 'safety':
      default:
        return 'Local Disaster Response & Civil Defense';
    }
  }
}
