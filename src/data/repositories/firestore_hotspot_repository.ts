import { HotspotRepository } from '../../domain/repositories/hotspot_repository';
import { HotspotEntity } from '../../domain/entities/hotspot';

export class FirestoreHotspotRepository implements HotspotRepository {
  private baseUrl = '/api/ai';

  async getHotspots(): Promise<HotspotEntity[]> {
    try {
      const res = await fetch(`${this.baseUrl}/hotspots`);
      if (!res.ok) {
        throw new Error('Failed to retrieve hotspot predictions');
      }
      const data = await res.json();
      return data.hotspots || [];
    } catch (error) {
      console.error('Error in FirestoreHotspotRepository.getHotspots:', error);
      throw error;
    }
  }

  async triggerPredictiveScan(complaints: any[]): Promise<{ taskId: string; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/scan-hotspots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaints })
      });
      if (!res.ok) {
        throw new Error('Failed to trigger predictive hotspot scan');
      }
      return await res.json();
    } catch (error) {
      console.error('Error in FirestoreHotspotRepository.triggerPredictiveScan:', error);
      throw error;
    }
  }

  async getScanStatus(taskId: string): Promise<{
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: HotspotEntity[];
    error?: string;
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/scan-hotspots/status/${taskId}`);
      if (!res.ok) {
        throw new Error(`Failed to check scan status for task ${taskId}`);
      }
      return await res.json();
    } catch (error) {
      console.error('Error in FirestoreHotspotRepository.getScanStatus:', error);
      throw error;
    }
  }
}
