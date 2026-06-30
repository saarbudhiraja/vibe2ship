import { HotspotRepository } from '../repositories/hotspot_repository';
import { HotspotEntity } from '../entities/hotspot';

export class GetPredictiveHotspotsUseCase {
  constructor(private hotspotRepository: HotspotRepository) {}

  /**
   * Fetches the current set of spatial hotspots.
   */
  async execute(): Promise<HotspotEntity[]> {
    return this.hotspotRepository.getHotspots();
  }

  /**
   * Launches an asynchronous prediction scan, then polls the task status until completion.
   * Calls a callback to update progress along the way.
   */
  async runPredictiveScanWithPolling(
    complaints: any[],
    onProgress: (progress: number, statusText: string) => void
  ): Promise<HotspotEntity[]> {
    onProgress(5, 'Preemptive ML Engine: Registering predictive spatial-temporal task...');
    
    // 1. Trigger background scan
    const triggerResult = await this.hotspotRepository.triggerPredictiveScan(complaints);
    const taskId = triggerResult.taskId;

    onProgress(15, `Preemptive ML Engine: Background task registered with ID: ${taskId}`);

    // 2. Poll until task is completed or failed
    return new Promise<HotspotEntity[]>((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await this.hotspotRepository.getScanStatus(taskId);
          
          if (status.status === 'completed') {
            clearInterval(interval);
            onProgress(100, 'Preemptive ML Engine: Spatial risk layers aggregated successfully!');
            resolve(status.result || []);
          } else if (status.status === 'failed') {
            clearInterval(interval);
            reject(new Error(status.error || 'Spatial analytics pipeline computation failed'));
          } else {
            // Processing
            const progress = status.progress || Math.min(95, 15 + attempts * 8);
            let statusText = 'Preemptive ML Engine: Aggregating temporal trends & category histories...';
            if (progress > 50) {
              statusText = 'Preemptive ML Engine: Executing cognitive Gemini trend analysis...';
            }
            onProgress(progress, statusText);
          }
        } catch (error) {
          // If polling fails temporarily, retry up to 5 times
          if (attempts > 15) {
            clearInterval(interval);
            reject(error);
          }
        }
      }, 1000); // Poll every 1s
    });
  }
}
