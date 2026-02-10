
import { GoogleGenAI, Type } from "@google/genai";
import { KPI, ProjectContext, EpicStory, KPIThreshold } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safeParse = (text: string | undefined) => {
  if (!text) return null;
  try {
    // Remove any potential markdown code blocks if the model ignores the mime type config
    const cleanJson = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON Parsing Error:", e, "Raw Text:", text);
    return null;
  }
};

export const getKPIRecommendations = async (context: ProjectContext, domainName: string, domainContext?: string) => {
  const prompt = `Recommend 6 key business KPIs for a project with the following context:
  Project Name: ${context.name}
  Project Type: ${context.type}
  Domain: ${domainName}
  Domain Context: ${domainContext || 'Standard industry practice'}
  Project Description: ${context.description}

  Return the response as a JSON array of objects with these keys: kpi_name, description, formula, input_metrics, owner, business_goal_relation, north_star_alignment.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            kpi_name: { type: Type.STRING },
            description: { type: Type.STRING },
            formula: { type: Type.STRING },
            input_metrics: { type: Type.STRING },
            owner: { type: Type.STRING },
            business_goal_relation: { type: Type.STRING },
            north_star_alignment: { type: Type.STRING }
          },
          required: ["kpi_name", "description", "formula", "input_metrics", "owner", "business_goal_relation", "north_star_alignment"]
        }
      }
    }
  });

  return safeParse(response.text) || [];
};

export const getThresholdBaselines = async (selectedKPIs: KPI[], domain: string) => {
  const prompt = `Based on the following selected KPIs for a ${domain} project, suggest realistic threshold defaults.
  KPIs: ${JSON.stringify(selectedKPIs.map(k => ({ name: k.kpi_name, desc: k.description })))}

  Return the response as a JSON array of KPIThreshold objects. 
  Keep values realistic for a standard mid-market company.
  Keys: kpi_name, target_value, warning_threshold, failure_threshold, threshold_type ('>' or '<'), alert_priority (High, Medium, Low), alert_frequency (Daily, Weekly).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            kpi_name: { type: Type.STRING },
            target_value: { type: Type.NUMBER },
            warning_threshold: { type: Type.NUMBER },
            failure_threshold: { type: Type.NUMBER },
            threshold_type: { type: Type.STRING },
            alert_priority: { type: Type.STRING },
            alert_frequency: { type: Type.STRING }
          },
          required: ["kpi_name", "target_value", "warning_threshold", "failure_threshold", "threshold_type", "alert_priority", "alert_frequency"]
        }
      }
    }
  });

  return safeParse(response.text) || [];
};

export const getExecutiveAnalysis = async (kpiData: any[]) => {
  const prompt = `As a Senior Business Analyst, analyze the following extracted KPI data and thresholds.
  Data: ${JSON.stringify(kpiData)}
  
  Generate a concise executive-level analysis.
  Return exactly 3 Key Insights and 2 Strategic Recommendations.
  
  Strictly follow this JSON structure: { "insights": [{ "title": string, "detail": string, "priority": "good" | "warning" | "critical" }], "recommendations": [{ "title": string, "detail": string, "impact": string }] }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ["title", "detail", "priority"]
            }
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                impact: { type: Type.STRING }
              },
              required: ["title", "detail", "impact"]
            }
          }
        },
        required: ["insights", "recommendations"]
      }
    }
  });

  return safeParse(response.text) || { insights: [], recommendations: [] };
};

export const getPrioritizedBacklog = async (
  context: ProjectContext, 
  stories: EpicStory[], 
  method: 'RICE' | 'MoSCoW',
  marketContext: string
) => {
  const prompt = `Prioritize the following product backlog using the ${method} method.
  Context: ${JSON.stringify(context)}
  Market Context: ${marketContext}
  Backlog Items: ${JSON.stringify(stories.map(s => ({ id: s.id, title: s.title, description: s.description })))}

  Return a JSON array. If RICE, include: id, score. If MoSCoW, include: id, bucket, reasoning.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return safeParse(response.text) || [];
};

export const chatWithKPIAgent = async (history: any[], userMessage: string, kpiContext: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a KPI Intelligence Chatbot for Executives. 
      Context: ${kpiContext}. 
      Use the structure: 🔍 KPI Insight | KPI: [Name] | Status: [Status] | Trend: [Trend] | Insight: [Explanation] | Recommended Actions: [List].
      ZERO HALLUCINATION POLICY. If data is missing for a metric, say: "I cannot provide an analysis for [Metric] as it is not present in the current data source."`
    }
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
};

export const generateLighthouseReport = async (urls: string[]) => {
  const prompt = `Simulate a Lighthouse audit for: ${urls.join(', ')}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING },
            device: { type: Type.STRING },
            performance: { type: Type.NUMBER },
            accessibility: { type: Type.NUMBER },
            seo: { type: Type.NUMBER },
            lcp: { type: Type.NUMBER },
            recommendation: { type: Type.STRING }
          },
          required: ["url", "device", "performance", "accessibility", "seo", "lcp", "recommendation"]
        }
      }
    }
  });
  return safeParse(response.text) || [];
};
