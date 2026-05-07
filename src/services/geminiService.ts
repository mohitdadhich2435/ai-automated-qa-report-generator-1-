/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function analyzeWebsite(input: { images?: string[], content?: any }) {
  const ai = getAI();
  
  const prompt = `You are a professional Website QA Auditor. 
Analyze the provided website data and generate a SIMPLE, CLEAN, and CLIENT-FRIENDLY QA audit report.
Avoid highly technical engineering jargon (e.g., instead of "DOM depth", use "layout complexity"). 
Focus on practical insights for a business owner or store manager.

The report MUST follow this exact Markdown structure:

# QA Audit Report

## Section 1: Critical Issues
(Focus on 3-5 high-priority issues that block users or hurt trust)
- **Issue**: [Name of the issue]
- **Impact**: [How this hurts the business or user]
- **Recommendation**: [Clear, simple step to fix it]

## Section 2: UI/UX Observations
(Practical feedback on colors, fonts, buttons, and how easy the site is to use)

## Section 3: Conversion Improvements
(Simple suggestions to help get more sales or signups)

## Section 4: Overall Summary
(A friendly 2-3 sentence summary of the site's health)

---

Part 2: Visual Score Data
At the VERY END, provide a JSON block enclosed in <DATA> tags.
{
  "healthScore": 0-100,
  "metrics": {
    "ux": 0-100,
    "ui": 0-100,
    "conversion": 0-100,
    "mobile": 0-100
  },
  "severityData": [{"level": "Critical", "count": X}, {"level": "High", "count": Y}, {"level": "Suggestion", "count": Z}],
  "chartData": [{"name": "UX", "value": X}, {"name": "UI", "value": Y}, {"name": "Sales", "value": Z}]
}
</DATA>

Be professional, concise, and helpful.`;

  const contents: any[] = [{ parts: [{ text: prompt }] }];

  if (input.images && input.images.length > 0) {
    input.images.forEach(base64 => {
      contents[0].parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64 }
      });
    });
  }

  if (input.content) {
    contents[0].parts.push({ text: `Website Crawl Data: ${JSON.stringify(input.content)}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to generate report. Please verify your input and try again.");
  }
}
