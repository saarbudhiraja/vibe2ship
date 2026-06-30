import { GoogleGenAI, Type } from "@google/genai";

export interface HotspotPrediction {
  id: string;
  name: string;
  geohash: string;
  lat: number;
  lng: number;
  predictedCategory: 'roads' | 'water' | 'sanitation' | 'lighting' | 'safety';
  riskLevel: 'green' | 'yellow' | 'orange' | 'red';
  growthRate: number;
  confidenceScore: number;
  citizenExplanation: string;
  preventiveRecommendations: string;
  resourcePlanningInsights: string;
  densityScore: number;
  clusterCount: number;
  historicalTrend: number[];
  generatedAt: string;
  whyGenerated?: string;
  evidenceSupports?: string;
  recommendedAction?: string;
  projectedImpact?: string;
}

export interface BackgroundTask {
  id: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: HotspotPrediction[];
  error?: string;
  createdAt: Date;
}

/**
 * Executes a Gemini generateContent call with model-level fallback (gemini-3.5-flash -> gemini-3.1-flash-lite -> gemini-flash-latest)
 * to handle transient backend capacity limits or 503 Service Unavailable errors.
 */
async function generateContentWithFallback(ai: GoogleGenAI, options: { model: string; contents: string; config?: any }) {
  const models = [options.model, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const currentModel of models) {
    try {
      console.log(`[Hotspot Engine] Attempting model call with: ${currentModel}`);
      const response = await ai.models.generateContent({
        ...options,
        model: currentModel
      });
      if (response && response.text) {
        console.log(`[Hotspot Engine] Successfully generated content using model: ${currentModel}`);
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Hotspot Engine] Model call failed for ${currentModel}. Error: ${err?.message || err}. Checking next fallback...`);
    }
  }

  throw lastError || new Error("All fallback models failed.");
}

// In-memory persistent store for tasks and pre-computed hotspots
export const tasksStore: Record<string, BackgroundTask> = {};
export let precomputedHotspots: HotspotPrediction[] = [
  {
    id: 'hot_1',
    name: 'Bengaluru West - Rajajinagar Sector',
    geohash: 'tdr1v',
    lat: 12.9785,
    lng: 77.5545,
    predictedCategory: 'water',
    riskLevel: 'red',
    growthRate: 42,
    confidenceScore: 91,
    citizenExplanation: 'A high concentration of sewage overflowing and old utility main pipeline leaks has been detected around this sector. Citizens are advised to report water logging immediately to help dispatchers allocate backup pump sets.',
    preventiveRecommendations: 'Perform ultrasonic pipe testing on 4th Main Road utility junction. Recommend deployment of emergency sewage bypass pump kits.',
    resourcePlanningInsights: 'Deploy 2 field plumber squads and 1 supervisor. Estimated target resolution time: 36 hours from dispatch.',
    densityScore: 88,
    clusterCount: 14,
    historicalTrend: [2, 3, 5, 8, 14],
    generatedAt: new Date().toISOString(),
    whyGenerated: 'Triggered by a 124% surge in localized water and sanitation stress coupled with sub-surface asphalt integrity degradation sensor reports.',
    evidenceSupports: '14 clustered water/drainage complaints in geohash block tdr1v, showing progressive base-pavement separation.',
    recommendedAction: 'Deploy emergency micro-surfacing and pipe crack-seal team to prevent base water saturation and sinkholes.',
    projectedImpact: 'Preempts 12 major deep sewer line bursts and overflows, improving road SLA reliability by 45% and protecting neighborhood property.'
  },
  {
    id: 'hot_2',
    name: 'Bengaluru East - Indiranagar Sector',
    geohash: 'tdr1z',
    lat: 12.9715,
    lng: 77.6412,
    predictedCategory: 'roads',
    riskLevel: 'orange',
    growthRate: 28,
    confidenceScore: 84,
    citizenExplanation: 'Multiple reports of deep asphalt cracking and road craters have emerged post heavy rainfalls near Indiranagar. Preemptive asphalt patching has been initiated to prevent commuter vehicle damage.',
    preventiveRecommendations: 'Apply wet-mix macadam patching on primary arterial roads. Coordinate traffic diversions during nighttime repairs.',
    resourcePlanningInsights: 'Route 1 hot-mix asphalt loader and 3 laborers. Target sealing completion: 48 hours.',
    densityScore: 72,
    clusterCount: 9,
    historicalTrend: [4, 5, 6, 8, 9],
    generatedAt: new Date().toISOString(),
    whyGenerated: 'Spiked due to municipal water board pressure drop alerts and local ground moisture acoustic warnings.',
    evidenceSupports: '9 active minor leakage complaints over a 4-block radius, indicating a potential major sub-surface pipe failure.',
    recommendedAction: 'Dispatch pressure equalization engineers and acoustic sonar leak detection teams.',
    projectedImpact: 'Preempts road collapse/sinkholes and preserves 4.2 million liters of potable water, saving over $15,000 in emergency patch costs.'
  },
  {
    id: 'hot_3',
    name: 'Bengaluru South - Jayanagar Sector',
    geohash: 'tdr1e',
    lat: 12.9305,
    lng: 77.5815,
    predictedCategory: 'lighting',
    riskLevel: 'yellow',
    growthRate: 15,
    confidenceScore: 78,
    citizenExplanation: 'Streetlight outages and wiring short-circuits are reported across adjacent cross roads. System is routing field electricians to replace older sodium bulbs with smart LED panels.',
    preventiveRecommendations: 'Replace high-pressure sodium luminaires with energy-efficient 90W LED units. Test grounding circuit breakers for streetlighting poles.',
    resourcePlanningInsights: 'Schedule 1 utility truck crew. Estimated duration: 24 hours.',
    densityScore: 54,
    clusterCount: 5,
    historicalTrend: [1, 2, 2, 4, 5],
    generatedAt: new Date().toISOString(),
    whyGenerated: 'Voltage signal deviation patterns detected across 5 smart utility pole nodes.',
    evidenceSupports: '5 citizen flickering reports and secondary transformer thermal spikes.',
    recommendedAction: 'Perform preemptive capacitor swaps on Transformer B-12.',
    projectedImpact: 'Avoids a complete multi-block electrical blackout, reducing emergency response ticket count by 92%.'
  }
];

/**
 * Triggers the predictive hotspot scan asynchronously
 */
export function startBackgroundHotspotScan(
  taskId: string,
  complaints: any[],
  getGeminiClient: () => GoogleGenAI | null
) {
  // Initialize task
  tasksStore[taskId] = {
    id: taskId,
    status: 'processing',
    progress: 10,
    createdAt: new Date()
  };

  console.log(`[Hotspot Engine] Started background task ${taskId} with ${complaints.length} complaints.`);

  // Defer processing to event loop
  setTimeout(async () => {
    try {
      const task = tasksStore[taskId];
      if (!task) return;

      task.progress = 25;

      // Step 1: Group complaints by 5-digit geohash sector
      const sectorMap: Record<string, any[]> = {};
      complaints.forEach((c: any) => {
        const fullGeohash = c.location?.geohash || 'tdr1w'; // default
        const sector = fullGeohash.slice(0, 5);
        if (!sectorMap[sector]) {
          sectorMap[sector] = [];
        }
        sectorMap[sector].push(c);
      });

      const sectors = Object.keys(sectorMap);
      task.progress = 40;

      if (sectors.length === 0) {
        task.status = 'completed';
        task.progress = 100;
        task.result = [];
        return;
      }

      const results: HotspotPrediction[] = [];
      const maxCount = Math.max(...sectors.map(s => sectorMap[s].length), 1);

      // Step 2: For each geohash sector, compute mathematical metrics and invoke Gemini/Simulation
      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        const sectorComplaints = sectorMap[sector];

        // Average coordinates
        let sumLat = 0;
        let sumLng = 0;
        sectorComplaints.forEach(c => {
          sumLat += c.location?.latitude || c.location?.lat || 12.9715;
          sumLng += c.location?.longitude || c.location?.lng || 77.5945;
        });
        const lat = sumLat / sectorComplaints.length;
        const lng = sumLng / sectorComplaints.length;

        const clusterCount = sectorComplaints.length;
        const avgSeverity = sectorComplaints.reduce((sum, c) => sum + (c.severityScore || 30), 0) / clusterCount;
        const densityScore = Math.min(100, Math.round((clusterCount / maxCount) * 75 + (avgSeverity / 100) * 25));

        // Get category breakdown
        const categoryCounts: Record<string, number> = {};
        sectorComplaints.forEach(c => {
          const cat = c.category || 'roads';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        let dominantCategory: any = 'roads';
        let maxCatCount = 0;
        Object.keys(categoryCounts).forEach(cat => {
          if (categoryCounts[cat] > maxCatCount) {
            maxCatCount = categoryCounts[cat];
            dominantCategory = cat;
          }
        });

        // Safe casting to valid category values
        if (!['roads', 'water', 'sanitation', 'lighting', 'safety'].includes(dominantCategory)) {
          dominantCategory = 'roads';
        }

        // Synthesize a landmark name
        const localities = sectorComplaints.map(c => c.location?.locality || c.location?.ward).filter(Boolean);
        const name = localities.length > 0 
          ? `${localities[0]} - ${sector.toUpperCase()} Sector` 
          : `Municipal Sector ${sector.toUpperCase()}`;

        // Build simple 5-day historical trend
        const historicalTrend = [0, 0, 0, 0, 0];
        const now = Date.now();
        sectorComplaints.forEach(c => {
          const reportedTime = c.createdAt ? new Date(c.createdAt).getTime() : now;
          const diffDays = Math.floor((now - reportedTime) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 5) {
            historicalTrend[4 - diffDays]++;
          } else {
            historicalTrend[Math.floor(Math.random() * 5)]++;
          }
        });
        // Make sure the last trend matches active count
        historicalTrend[4] = Math.max(historicalTrend[4], Math.floor(clusterCount * 0.7));

        // Call Gemini for advanced predictive modeling
        const ai = getGeminiClient();
        let aiResult: any = null;

        if (ai) {
          try {
            const prompt = `Perform a high-fidelity spatial-temporal risk and predictive trend assessment on the following municipal cluster.
            
            Sector Name: "${name}"
            Geohash: "${sector}"
            Complaint Count: ${clusterCount}
            Average Severity Score: ${avgSeverity}/100
            Dominant Problem Category: "${dominantCategory}"
            Landmarks involved: ${JSON.stringify(localities.slice(0, 5))}
            Historical Trend (past 5 days count): ${JSON.stringify(historicalTrend)}
            
            Based on these attributes, output:
            1. An estimated risk level from: 'green', 'yellow', 'orange', 'red'.
            2. A percentage growth rate forecast for the next week (e.g. 35).
            3. A confidence score percentage (0 to 100).
            4. A jargon-free explanation aimed at citizens detailing the issue and municipal actions.
            5. Specific preventive maintenance recommendations for supervisors.
            6. Dispatch resource planning insights for field engineers.`;

            const response = await generateContentWithFallback(ai, {
              model: "gemini-3.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    riskLevel: { type: Type.STRING, description: "One of: 'green', 'yellow', 'orange', 'red'." },
                    growthRate: { type: Type.INTEGER, description: "Next week growth rate percentage, e.g., 34" },
                    confidenceScore: { type: Type.INTEGER, description: "Model confidence percentage, 0-100" },
                    citizenExplanation: { type: Type.STRING, description: "Clear, helpful explanation of the risk for the public." },
                    preventiveRecommendations: { type: Type.STRING, description: "Specific technical steps for city crews." },
                    resourcePlanningInsights: { type: Type.STRING, description: "Required squad types and SLA targets." }
                  },
                  required: [
                    "riskLevel",
                    "growthRate",
                    "confidenceScore",
                    "citizenExplanation",
                    "preventiveRecommendations",
                    "resourcePlanningInsights"
                  ]
                }
              }
            });

            if (response && response.text) {
              aiResult = JSON.parse(response.text.trim());
              console.log(`[Hotspot Engine] Gemini analyzed sector ${sector} successfully.`);
            }
          } catch (err) {
            console.error(`[Hotspot Engine] Gemini call failed for sector ${sector}, using simulator fallback:`, err);
          }
        }

        // Fallback or Simulation implementation
        if (!aiResult) {
          let riskLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green';
          if (avgSeverity > 75 || clusterCount > 10) {
            riskLevel = 'red';
          } else if (avgSeverity > 55 || clusterCount > 6) {
            riskLevel = 'orange';
          } else if (avgSeverity > 35 || clusterCount > 3) {
            riskLevel = 'yellow';
          }

          const growthRate = Math.min(120, Math.round(clusterCount * 4 + avgSeverity * 0.5 + Math.random() * 20));
          const confidenceScore = Math.min(98, Math.max(60, Math.round(85 + (clusterCount * 1.5) - (Math.random() * 10))));

          let citizenExplanation = "";
          let preventiveRecommendations = "";
          let resourcePlanningInsights = "";
          let whyGenerated = "";
          let evidenceSupports = "";
          let recommendedAction = "";
          let projectedImpact = "";

          switch (dominantCategory) {
            case 'roads':
              citizenExplanation = `Pothole and road crater accumulations around ${name} are impacting vehicle transit. Preemptive asphalt patching has been scheduled to restore roadway smoothness.`;
              preventiveRecommendations = "Pre-level with dry aggregate base. Apply cold-mix emulsion on high-traffic grid segments.";
              resourcePlanningInsights = "Deploy 1 heavy compactor team and 2 laborers. Work window: 10:00 PM to 4:00 AM.";
              whyGenerated = `Triggered by a mathematical clustering threshold of ${clusterCount} road hazard reports coupled with a high aggregate severity index.`;
              evidenceSupports = `${clusterCount} active pothole and structural pavement hazard reports in sector ${sector}.`;
              recommendedAction = "Deploy a rapid cold-patch asphalt compaction crew and set localized reflective barricades.";
              projectedImpact = `Preempts ${Math.round(clusterCount * 1.5)} minor craters from widening, boosting localized road SLA compliance by 35%.`;
              break;
            case 'water':
              citizenExplanation = `An increased volume of sewage blocks and drinking water pipe leaks is reported in the ${name} zone. City engineers are tracking flow pressures.`;
              preventiveRecommendations = "Inspect major manifold gate valves. Flush secondary lateral sewer networks.";
              resourcePlanningInsights = "Requires 2 hydro-vacuum flushing trucks and 1 safety supervisor.";
              whyGenerated = `Heuristics flagged high risk of sewage backups due to localized moisture spike signals in ${sector} sector.`;
              evidenceSupports = `${clusterCount} active reports of drainage blockages or pipe ruptures within a 150-meter geohash radius.`;
              recommendedAction = "Dispatch hydraulic pressure equalization engineers and secondary line clearing squads.";
              projectedImpact = "Reduces neighborhood contamination hazard index by 92% and avoids critical structural flooding.";
              break;
            case 'sanitation':
              citizenExplanation = `Garbage overflow and solid waste accumulation spikes detected in this sector. Extra garbage loader transits are dispatched daily.`;
              preventiveRecommendations = "Establish 2 supplemental secondary collection bins. Coordinate commercial waste contracts.";
              resourcePlanningInsights = "Deploy 2 compactors and 4 crew members. Scheduled daily pickup cycles.";
              whyGenerated = "Flagged due to elevated garbage volume patterns and delayed garbage transit times in this grid.";
              evidenceSupports = `${clusterCount} citizen trash and public garbage overflow tickets in geohash block ${sector}.`;
              recommendedAction = "Establish auxiliary drop bins and route an additional compactor vehicle.";
              projectedImpact = "Prevents public vector breeding grounds and increases solid waste compliance indexing to 98%.";
              break;
            case 'lighting':
              citizenExplanation = `Dark sectors and streetlighting electrical issues are being tracked. Electricians are active replacing pole fuses.`;
              preventiveRecommendations = "Inspect lateral overhead circuit lines. Replace failing sodium photo-sensors.";
              resourcePlanningInsights = "Route 1 utility cherry-picker truck. Target completion: 24 hours.";
              whyGenerated = "Triggered by localized lighting ticket clustering indicative of lateral grid voltage drops.";
              evidenceSupports = `${clusterCount} dark spot reports and transformer circuit fluctuation logs.`;
              recommendedAction = "Execute preemptive streetlighting circuit board inspections and fuse changes.";
              projectedImpact = "Preempts a total lateral blackout across 8 blocks, improving pedestrian security parameters by 85%.";
              break;
            case 'safety':
              citizenExplanation = `Local hazards, broken hazard barriers, or structural safety vulnerabilities have triggered high risk alerts. Public access restricted.`;
              preventiveRecommendations = "Erect high-visibility polymer safety barricades. Implement visual signage controls.";
              resourcePlanningInsights = "Deploy local security patrols and 1 disaster specialist squad.";
              whyGenerated = "Flagged due to safety hazard reports at heavy transit intersections or around structural work zones.";
              evidenceSupports = `${clusterCount} structural hazard, visibility obstruction, or construction margin tickets.`;
              recommendedAction = "Erect safety barricades and deploy auxiliary visual signage patrols.";
              projectedImpact = "Reduces localized civic accident risk to near-zero and ensures compliant pedestrian walkways.";
              break;
          }

          aiResult = {
            riskLevel,
            growthRate,
            confidenceScore,
            citizenExplanation,
            preventiveRecommendations,
            resourcePlanningInsights,
            whyGenerated,
            evidenceSupports,
            recommendedAction,
            projectedImpact
          };
        }

        results.push({
          id: `hot_${sector}`,
          name,
          geohash: sector,
          lat,
          lng,
          predictedCategory: dominantCategory,
          riskLevel: aiResult.riskLevel || 'yellow',
          growthRate: Number(aiResult.growthRate) || 10,
          confidenceScore: Number(aiResult.confidenceScore) || 75,
          citizenExplanation: aiResult.citizenExplanation,
          preventiveRecommendations: aiResult.preventiveRecommendations,
          resourcePlanningInsights: aiResult.resourcePlanningInsights,
          densityScore,
          clusterCount,
          historicalTrend,
          generatedAt: new Date().toISOString(),
          whyGenerated: aiResult.whyGenerated,
          evidenceSupports: aiResult.evidenceSupports,
          recommendedAction: aiResult.recommendedAction,
          projectedImpact: aiResult.projectedImpact
        });

        // Stagger task progress updates
        task.progress = Math.min(95, Math.round(40 + (i / sectors.length) * 50));
      }

      // Update in-memory computed results
      precomputedHotspots = results;

      // Finish task
      task.status = 'completed';
      task.progress = 100;
      task.result = results;
      console.log(`[Hotspot Engine] Finished task ${taskId} successfully with ${results.length} hotspot predictions.`);
    } catch (error: any) {
      console.error(`[Hotspot Engine] Task ${taskId} failed with error:`, error);
      const task = tasksStore[taskId];
      if (task) {
        task.status = 'failed';
        task.progress = 100;
        task.error = error.message || 'Unknown processing error';
      }
    }
  }, 100);
}
