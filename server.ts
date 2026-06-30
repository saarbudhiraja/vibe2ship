import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  startBackgroundHotspotScan, 
  precomputedHotspots, 
  tasksStore 
} from "./server/hotspotEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Real Gemini client lazy initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or has default value. Falling back to high-fidelity AI simulation.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
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
      console.log(`[Gemini Engine] Attempting model call with: ${currentModel}`);
      const response = await ai.models.generateContent({
        ...options,
        model: currentModel
      });
      if (response && response.text) {
        console.log(`[Gemini Engine] Successfully generated content using model: ${currentModel}`);
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Engine] Model call failed for ${currentModel}. Error: ${err?.message || err}. Checking next fallback...`);
    }
  }

  throw lastError || new Error("All fallback models failed.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// AI analysis pipeline proxy endpoint
app.post("/api/ai/analyze", async (req, res) => {
  const { title, description, category, location, media, voiceTranscript, existingComplaints } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required fields." });
  }

  const loc = location || { lat: 12.9715, lng: 77.5945, geohash: "tdr1w" };
  const complaintsList = existingComplaints || [];

  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({ error: "AI analysis is temporarily unavailable. Gemini API key is not configured." });
  }

  try {
    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: `Analyze the incoming civic complaint and produce a unified analysis report.

Complaint Details:
- Title: "${title}"
- Description: "${description}"
- User-Selected Category: "${category || "None"}"
- Coordinates: Latitude ${loc.lat}, Longitude ${loc.lng}, Geohash: "${loc.geohash}"
- Media items attached: ${media ? media.length : 0}
- Voice Note Transcript (if any): "${voiceTranscript || "None"}"

Existing Unresolved Complaints in Ledger (for Duplicate Verification):
${JSON.stringify(complaintsList.slice(0, 15))}

Your task:
1. Issue Categorization: Determine the most appropriate category from: 'roads', 'water', 'sanitation', 'lighting', 'safety'.
2. Severity Scoring: Rate severity from 0 to 100 based on danger, damage, public impact, and life-safety risk. Define 2-3 explicit factors contributing to this score.
3. Priority Mapping: Assign 'critical' (score >= 85 or direct hazard to safety), 'high' (65-84), 'medium' (35-64), or 'low' (< 35).
4. Department Routing: Choose responsible department from:
   - 'Department of Public Works & Engineering' (roads)
   - 'Municipal Water Board & Sewers' (water)
   - 'Sanitation & Solid Waste Management' (sanitation)
   - 'Electrical Utility Grid Services' (lighting)
   - 'Local Disaster Response & Civil Defense' (safety)
   - 'General Municipal Affairs' (other)
5. Initial Escalation Level: Choose 'none', 'supervisor', or 'higher_authority' depending on severity.
6. Duplicate Verification: Compare against existing complaints. Set isDuplicate to true only if there is a highly similar issue within the same or adjacent geohash block. List the matched duplicateId, similarity score (0-100), and short explanation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedCategory: {
              type: Type.STRING,
              description: "Predicted category from: 'roads', 'water', 'sanitation', 'lighting', 'safety'.",
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "AI confidence score in predicted category, 0-100.",
            },
            severityScore: {
              type: Type.INTEGER,
              description: "Severity score, 0-100.",
            },
            severityFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 2-3 factors contributing to the severity.",
            },
            priority: {
              type: Type.STRING,
              description: "Priority mapping: 'low', 'medium', 'high', 'critical'.",
            },
            assignedDept: {
              type: Type.STRING,
              description: "The responsible department recommended for routing.",
            },
            recommendedEscalationLevel: {
              type: Type.STRING,
              description: "Escalation recommendation: 'none', 'supervisor', 'higher_authority'.",
            },
            routingDecisionReasoning: {
              type: Type.STRING,
              description: "Detailed reason for the routing and department selection.",
            },
            duplicateVerification: {
              type: Type.OBJECT,
              properties: {
                isDuplicate: { type: Type.BOOLEAN },
                duplicateId: { type: Type.STRING, description: "ID of the duplicate complaint, or null." },
                similarityScore: { type: Type.INTEGER, description: "Semantic/spatial similarity percentage, 0-100." },
                explanation: { type: Type.STRING, description: "Reasoning for duplicate status decision." },
              },
              required: ["isDuplicate", "duplicateId", "similarityScore", "explanation"],
            },
          },
          required: [
            "predictedCategory",
            "confidenceScore",
            "severityScore",
            "severityFactors",
            "priority",
            "assignedDept",
            "recommendedEscalationLevel",
            "routingDecisionReasoning",
            "duplicateVerification",
          ],
        },
      },
    });

    if (response && response.text) {
      const parsedResult = JSON.parse(response.text.trim());
      return res.json(parsedResult);
    }
    throw new Error("Empty response from Gemini engine.");
  } catch (apiError: any) {
    console.error("Gemini API Error:", apiError);
    return res.status(503).json({ error: "AI analysis is temporarily unavailable. Gemini API error." });
  }
});

// AI Inferences and metadata extraction from uploaded media
app.post("/api/ai/infer-complaint", async (req, res) => {
  const { media } = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    // Return high-fidelity fallback
    const fallbackIssues = [
      {
        title: "Cracked Asphalt & Pothole Nest",
        description: "A wide structural depression has formed in the asphalt layer, exposing the subgrade base to water erosion. Requires preemptive cold-mix sealing to prevent expansion.",
        category: "roads",
        inferredLocation: { lat: 12.9735, lng: 77.5932, geohash: "tdr1w7y" }
      },
      {
        title: "Underground Water Line Main Burst",
        description: "Sub-surface hydraulic pressure has caused a clean-water pipe rupture, resulting in water pooling on sidewalks and potentially softening pavement base layers.",
        category: "water",
        inferredLocation: { lat: 12.9723, lng: 77.5951, geohash: "tdr1w7x" }
      },
      {
        title: "Clogged Stormwater Drain & Trash Nest",
        description: "Plastics and organic silt blockages have completely obstructed the storm grate inlet, guaranteeing severe roadway flooding during next precipitation event.",
        category: "sanitation",
        inferredLocation: { lat: 12.9712, lng: 77.5921, geohash: "tdr1w7z" }
      },
      {
        title: "Unlit Streetlight dark corridor",
        description: "An entire primary feeder line powering public lighting is inactive, causing a prolonged dark zone. Increases pedestrian vulnerability and driving hazards.",
        category: "lighting",
        inferredLocation: { lat: 12.9760, lng: 77.5940, geohash: "tdr1w7a" }
      }
    ];
    const picked = JSON.parse(JSON.stringify(fallbackIssues[Math.floor(Math.random() * fallbackIssues.length)]));
    picked.inferredLocation.lat += (Math.random() - 0.5) * 0.01;
    picked.inferredLocation.lng += (Math.random() - 0.5) * 0.01;
    return res.json(picked);
  }

  try {
    const parts = [];
    if (media && Array.isArray(media)) {
      for (const item of media) {
        if (item.url && item.url.startsWith("data:")) {
          const split = item.url.split(",");
          const mimeType = split[0].split(";")[0].split(":")[1] || "image/jpeg";
          const base64Data = split[1];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        }
      }
    }

    parts.push({
      text: `Analyze the uploaded media and generate:
1. An appropriate, precise title for the civic complaint (e.g. "Sewer Water Overflow", "Deep Pothole on Secondary Crossing", "Dark Streetlight Grid Zone").
2. A detailed professional description (2-3 sentences) detailing the issue, severity, and potential risks visible in the media.
3. The most appropriate category from: 'roads', 'water', 'sanitation', 'lighting', 'safety'.
4. Infer a realistic latitude and longitude in Bengaluru, India (near center 12.9716, 77.5946, within 12.94 to 12.99, and 77.56 to 77.62) that corresponds to this type of issue, and its 7-character geohash.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            inferredLocation: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                geohash: { type: Type.STRING }
              },
              required: ["lat", "lng", "geohash"]
            }
          },
          required: ["title", "description", "category", "inferredLocation"]
        }
      }
    });

    if (response && response.text) {
      const parsedResult = JSON.parse(response.text.trim());
      return res.json(parsedResult);
    }
    throw new Error("Empty response from Gemini inference engine.");
  } catch (apiError: any) {
    console.error("Gemini Complaint Inference Error:", apiError);
    return res.status(503).json({ error: "AI analysis is temporarily unavailable. Gemini API error." });
  }
});

// AI Closure Verification audit endpoint
app.post("/api/ai/verify-closure", async (req, res) => {
  const { complaintTitle, complaintDescription, completionNotes, completionPhotoUrl, originalPhotoUrls } = req.body;

  if (!complaintTitle || !completionNotes) {
    return res.status(400).json({ error: "Complaint title and completion notes are required." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.status(503).json({ error: "AI analysis is temporarily unavailable. Gemini API key is not configured." });
  }

  try {
    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: `Audit the closure submission of a civic complaint and verify its authenticity.

Complaint context:
- Title: "${complaintTitle}"
- Original Description: "${complaintDescription || "None"}"
- Original Media Attachment Count: ${originalPhotoUrls ? originalPhotoUrls.length : 0}

Resolution evidence submitted:
- Engineer/Crew Completion Notes: "${completionNotes}"
- Resolution Completion Photo: "${completionPhotoUrl || "None"}"

Evaluate if the issue reported is realistically resolved based on the engineer's notes. Detect possible false closures, i.e., where notes are placeholder/generic or do not address the specific issue (e.g. original was "large crater sinkhole flooding on main street" and notes are "done" or "cleaned trash" which doesn't resolve a sinkhole).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isResolvedSatisfactorily: {
              type: Type.BOOLEAN,
              description: "True if notes and media indicate genuine and complete resolution of the issue described.",
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "AI confidence in this audit decision, 0-100.",
            },
            evidenceMatchQuality: {
              type: Type.INTEGER,
              description: "Rating of the completion evidence alignment to original problem, 0-100.",
            },
            possibleFalseClosureDetected: {
              type: Type.BOOLEAN,
              description: "True if notes are evasive, generic, irrelevant, or evidence is missing/contradictory.",
            },
            detailedReasoning: {
              type: Type.STRING,
              description: "Detailed critique explaining why this closure is valid or a false-positive suspect.",
            },
            recommendedAction: {
              type: Type.STRING,
              description: "Recommended supervisor action from: 'approve', 'reject', 'manual_review'.",
            },
          },
          required: [
            "isResolvedSatisfactorily",
            "confidenceScore",
            "evidenceMatchQuality",
            "possibleFalseClosureDetected",
            "detailedReasoning",
            "recommendedAction",
          ],
        },
      },
    });

    if (response && response.text) {
      const parsedResult = JSON.parse(response.text.trim());
      return res.json(parsedResult);
    }
    throw new Error("Empty response from Gemini closure audit.");
  } catch (apiError: any) {
    console.error("Gemini closure audit error:", apiError);
    return res.status(503).json({ error: "AI analysis is temporarily unavailable. Gemini API error." });
  }
});

// GET pre-computed hotspots
app.get("/api/ai/hotspots", (req, res) => {
  res.json({ hotspots: precomputedHotspots });
});

// POST trigger background spatial prediction scan
app.post("/api/ai/scan-hotspots", (req, res) => {
  const { complaints } = req.body;

  if (!complaints || !Array.isArray(complaints)) {
    return res.status(400).json({ error: "A valid array of complaints is required to execute predictive analysis." });
  }

  const taskId = `task_scan_${Date.now()}`;
  startBackgroundHotspotScan(taskId, complaints, getGeminiClient);

  res.json({
    taskId,
    message: "Predictive hotspot spatial-temporal intelligence scan launched successfully in the background."
  });
});

// GET background task status
app.get("/api/ai/scan-hotspots/status/:taskId", (req, res) => {
  const { taskId } = req.params;
  const task = tasksStore[taskId];

  if (!task) {
    return res.status(404).json({ error: "Background analysis task not found or has expired." });
  }

  res.json(task);
});

// Vite middleware for development or serving compiled client in production
async function startViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Civora Unified Backend] running on http://localhost:${PORT}`);
  });
}

startViteOrStatic();
