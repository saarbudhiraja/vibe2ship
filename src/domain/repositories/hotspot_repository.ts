import { HotspotEntity } from '../entities/hotspot';

export interface HotspotRepository {
  /**
   * Retrieves all pre-computed hotspot predictions from durable storage.
   */
  getHotspots(): Promise<HotspotEntity[]>;

  /**
   * Triggers an asynchronous spatial-temporal background scan over complaint histories.
   * Returns immediately with a task token to avoid blocking.
   */
  triggerPredictiveScan(complaints: any[]): Promise<{ taskId: string; message: string }>;

  /**
   * Checks the status and retrieves the versioned intelligence payload of a background task.
   */
  getScanStatus(taskId: string): Promise<{
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: HotspotEntity[];
    error?: string;
  }>;
}
