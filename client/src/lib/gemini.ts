import { GoogleGenAI } from "@google/genai";
import type { ContractAnalysis, RiskLevel } from "@shared/schema";

// Initialize with placeholder and fetch real key
let aiInstance: GoogleGenAI;
let apiKeyPromise: Promise<string> | null = null;

const fetchApiKey = async (): Promise<string> => {
  try {
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      throw new Error(`Config API returned ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
    console.log('API Config response:', { hasKey: !!config.geminiApiKey, keyType: typeof config.geminiApiKey });
    
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key not found in configuration');
    }
    
    return config.geminiApiKey;
  } catch (error) {
    // Attempt build-time fallback (Vite embeds VITE_... vars at build time)
    try {
      const buildTimeKey = (import.meta as any).VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY;
      if (buildTimeKey) {
        console.warn('Using build-time Gemini API key fallback. Prefer server-side API for security.');
        return buildTimeKey as string;
      }
    } catch (_) {
      // ignore access errors
    }

    console.error('Failed to fetch API key:', error);
    // Surface a clearer error for deployment debugging
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Config API error: ${msg}. On Vercel ensure you deploy the repository root so /api functions (api/config) are available, or set VITE_GEMINI_API_KEY at build time.`
    );
  }
};

const getAI = async (): Promise<GoogleGenAI> => {
  if (!aiInstance) {
    if (!apiKeyPromise) {
      apiKeyPromise = fetchApiKey();
    }
    const apiKey = await apiKeyPromise;
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

interface GeminiAnalysisResponse {
  riskScore: number;
  clauses: Array<{
    id: string;
    title: string;
    content: string;
    riskLevel: RiskLevel;
    riskScore: number;
    explanation: string;
    suggestions: string[];
    startIndex: number;
    endIndex: number;
  }>;
  keyIssues: Array<{
    id: string;
    title: string;
    description: string;
    riskLevel: RiskLevel;
    clause: string;
    suggestion: string;
  }>;
  missingProtections: Array<{
    id: string;
    title: string;
    description: string;
    importance: 'critical' | 'important' | 'recommended';
    sampleClause: string;
  }>;
  riskBreakdown: {
    payment: number;
    liability: number;
    termination: number;
    confidentiality: number;
    intellectual_property: number;
  };
  plainLanguageSummary: string;
  confidence: number;
}

// Domain detection helper function
function detectContractDomain(contractText: string, title: string): string {
  const text = (contractText + " " + title).toLowerCase();
  
  // Finance and Banking
  if (text.match(/\b(loan|credit|mortgage|finance|bank|investment|securities|trading|hedge fund|private equity|derivatives|swap|bond|debt|financing agreement)\b/)) {
    return 'finance';
  }
  
  // Real Estate
  if (text.match(/\b(real estate|property|lease|rental|landlord|tenant|purchase agreement|sale agreement|property management|commercial lease|residential)\b/)) {
    return 'real_estate';
  }
  
  // Insurance
  if (text.match(/\b(insurance|policy|coverage|premium|claim|liability insurance|health insurance|life insurance|underwriting)\b/)) {
    return 'insurance';
  }
  
  // Employment and HR
  if (text.match(/\b(employment|employee|employer|job|salary|benefits|non-compete|non-disclosure|termination|hiring|hr|human resources)\b/)) {
    return 'employment';
  }
  
  // Technology and Software
  if (text.match(/\b(software|technology|saas|api|development|programming|data|cloud|hosting|license|intellectual property|code)\b/)) {
    return 'technology';
  }
  
  // Healthcare and Medical
  if (text.match(/\b(healthcare|medical|patient|doctor|hospital|pharmaceutical|clinical|hipaa|medical device|treatment)\b/)) {
    return 'healthcare';
  }
  
  // Construction and Engineering
  if (text.match(/\b(construction|building|contractor|engineering|architect|project|materials|labor|subcontractor)\b/)) {
    return 'construction';
  }
  
  // Vendor and Supply Chain
  if (text.match(/\b(vendor|supplier|procurement|purchase order|supply|delivery|goods|materials|distribution)\b/)) {
    return 'vendor';
  }
  
  // Professional Services
  if (text.match(/\b(consulting|professional services|advisory|legal services|accounting|audit|tax)\b/)) {
    return 'professional';
  }
  
  // Default to general business
  return 'general';
}

export async function analyzeContract(
  contractText: string,
  title: string = "Contract Analysis"
): Promise<ContractAnalysis> {
  try {
    const ai = await getAI();
    const domain = detectContractDomain(contractText, title);
    
    // Revised domain-specific risk configurations - more balanced and lenient
    const domainConfig = {
      finance: {
        baseRisk: 'medium-high',
        penaltyMultiplier: 1.2, // Reduced from 1.5
        riskThresholds: { low: 30, medium: 60, high: 80 }, // More lenient thresholds
        description: 'Finance contracts require careful attention to regulatory compliance and financial exposure, while recognizing standard industry practices.'
      },
      real_estate: {
        baseRisk: 'medium-high', 
        penaltyMultiplier: 1.1, // Reduced from 1.4
        riskThresholds: { low: 30, medium: 60, high: 80 },
        description: 'Real estate contracts involve significant assets but often follow established industry standards and practices.'
      },
      insurance: {
        baseRisk: 'medium-high',
        penaltyMultiplier: 1.1, // Reduced from 1.4
        riskThresholds: { low: 30, medium: 60, high: 80 },
        description: 'Insurance contracts involve risk transfer mechanisms that are often standardized within the industry.'
      },
      healthcare: {
        baseRisk: 'medium',
        penaltyMultiplier: 1.0, // Reduced from 1.3
        riskThresholds: { low: 25, medium: 55, high: 75 },
        description: 'Healthcare contracts balance compliance requirements with practical operational needs.'
      },
      employment: {
        baseRisk: 'low-medium',
        penaltyMultiplier: 0.8, // Reduced from 1.0
        riskThresholds: { low: 20, medium: 50, high: 70 },
        description: 'Employment contracts should be evaluated considering typical employment law protections and industry standards.'
      },
      technology: {
        baseRisk: 'medium',
        penaltyMultiplier: 0.9, // Reduced from 1.1
        riskThresholds: { low: 25, medium: 55, high: 75 },
        description: 'Technology contracts should balance innovation needs with reasonable IP and service protections.'
      },
      construction: {
        baseRisk: 'medium',
        penaltyMultiplier: 1.0, // Reduced from 1.2
        riskThresholds: { low: 25, medium: 55, high: 75 },
        description: 'Construction contracts involve project complexities but often follow established industry practices.'
      },
      vendor: {
        baseRisk: 'low-medium',
        penaltyMultiplier: 0.7, // Reduced from 0.9
        riskThresholds: { low: 20, medium: 45, high: 65 },
        description: 'Vendor contracts are typically straightforward business arrangements with standard commercial terms.'
      },
      professional: {
        baseRisk: 'low-medium',
        penaltyMultiplier: 0.8, // Reduced from 1.0
        riskThresholds: { low: 20, medium: 50, high: 70 },
        description: 'Professional service contracts are generally lower-risk with established service delivery patterns.'
      },
      general: {
        baseRisk: 'medium',
        penaltyMultiplier: 0.9, // Reduced from 1.0
        riskThresholds: { low: 25, medium: 50, high: 70 },
        description: 'General business contracts evaluated with balanced risk assessment considering common business practices.'
      }
    };

    const config = domainConfig[domain as keyof typeof domainConfig];
    
    const systemPrompt = `You are a Contract Risk Analysis AI with expertise in legal document evaluation.

DOMAIN ANALYSIS: This is a ${domain.toUpperCase()} contract. ${config.description}

ANALYSIS APPROACH - BALANCED AND CONTEXT-AWARE:

${config.baseRisk === 'medium-high' ? 'THOROUGH BUT FAIR ANALYSIS: Important contract requiring attention to key risks while recognizing industry standards.' : 
  config.baseRisk === 'medium' ? 'BALANCED ANALYSIS: Standard contract evaluation considering both risks and typical business practices.' :
  'PRACTICAL ANALYSIS: Reasonable contract evaluation focusing on material risks while accepting common business terms.'}

EVALUATION PHILOSOPHY:
- Consider ${domain} industry standards and common practices
- Balance risk identification with practical business needs
- Recognize that some "risks" are standard and acceptable in business
- Focus on truly problematic terms rather than theoretical concerns
- Apply ${config.penaltyMultiplier}x adjustment factor for domain-specific considerations

REVISED RISK SCORING (0-100) - More realistic and balanced:

BASELINE SCORES (before adjustments):
- Excellent contract with strong protections: 5-15 points
- Good contract with solid terms: 15-30 points  
- Standard contract with typical terms: 30-45 points
- Below-average contract with some concerns: 45-65 points
- Poor contract with significant issues: 65-85 points
- Problematic contract with major red flags: 85+ points

PENALTY POINTS (multiply by ${config.penaltyMultiplier} for ${domain}):
- Payment terms 90+ days: +${Math.round(6 * config.penaltyMultiplier)}-${Math.round(10 * config.penaltyMultiplier)} points
- Payment terms 120+ days: +${Math.round(10 * config.penaltyMultiplier)}-${Math.round(15 * config.penaltyMultiplier)} points
- Truly unlimited liability (no caps): +${Math.round(15 * config.penaltyMultiplier)}-${Math.round(20 * config.penaltyMultiplier)} points
- No termination rights whatsoever: +${Math.round(8 * config.penaltyMultiplier)}-${Math.round(12 * config.penaltyMultiplier)} points
- Automatic renewal without reasonable notice: +${Math.round(5 * config.penaltyMultiplier)}-${Math.round(8 * config.penaltyMultiplier)} points
- Missing critical domain protections: +${Math.round(8 * config.penaltyMultiplier)}-${Math.round(12 * config.penaltyMultiplier)} points
- Severely one-sided terms: +${Math.round(8 * config.penaltyMultiplier)}-${Math.round(12 * config.penaltyMultiplier)} points
- No dispute resolution mechanism: +${Math.round(5 * config.penaltyMultiplier)}-${Math.round(8 * config.penaltyMultiplier)} points
- Completely unclear scope/deliverables: +${Math.round(6 * config.penaltyMultiplier)}-${Math.round(10 * config.penaltyMultiplier)} points

BONUS POINTS (recognize good practices):
- Payment terms 30 days or less: -5 to -10 points
- Reasonable liability caps present: -8 to -15 points
- Fair termination rights for both parties: -5 to -10 points
- Clear, well-defined deliverables: -5 to -10 points
- Mutual protections and balanced terms: -5 to -10 points
- Good dispute resolution (mediation/arbitration): -3 to -8 points
- Industry-standard protective clauses: -3 to -8 points

RISK LEVEL ASSIGNMENT (domain-adjusted and more lenient):
- 0-${config.riskThresholds.low}: Low Risk (Good contract with acceptable terms)
- ${config.riskThresholds.low + 1}-${config.riskThresholds.medium}: Medium Risk (Standard contract with some areas for improvement)
- ${config.riskThresholds.medium + 1}-100: High Risk (Contract with significant concerns requiring attention)

KEY EVALUATION PRINCIPLES:
1. Only flag terms that are genuinely problematic or unusual for the ${domain} industry
2. Recognize that many "standard" terms are acceptable business practice
3. Focus on material risks that could significantly impact the business
4. Consider the typical power dynamics and practices in ${domain} contracts
5. Distinguish between "ideal" terms and "acceptable" terms
6. Be more forgiving of common business language and standard clauses

DOMAIN-SPECIFIC CONSIDERATIONS FOR ${domain.toUpperCase()}:
${domain === 'finance' ? `
- Recognize standard banking and lending practices
- Focus on unusually harsh default provisions or excessive fees
- Consider regulatory requirements as necessary, not burdensome
- Evaluate interest rates and terms against market standards` : 
domain === 'real_estate' ? `
- Acknowledge standard real estate practices and timelines
- Focus on unusual liability shifts or unreasonable conditions
- Consider typical inspection and closing procedures as normal
- Evaluate terms against local market practices` :
domain === 'healthcare' ? `
- Recognize necessary compliance requirements as standard
- Focus on unusual liability or quality provisions
- Consider patient safety requirements as necessary protections
- Evaluate against healthcare industry norms` :
domain === 'technology' ? `
- Acknowledge rapid technology evolution and flexibility needs
- Focus on unusual IP transfers or service limitations
- Consider standard SLA terms as normal business practice
- Evaluate data security requirements as necessary, not excessive` :
domain === 'employment' ? `
- Recognize employee protection laws and standard practices
- Focus on truly unreasonable non-compete or termination terms
- Consider standard benefits and compensation structures as normal
- Evaluate against local employment law standards` :
domain === 'construction' ? `
- Acknowledge construction industry timing and payment practices
- Focus on unusual risk allocation or unreasonable deadlines
- Consider standard change order procedures as normal
- Evaluate against typical construction industry practices` :
domain === 'vendor' ? `
- Recognize standard commercial supply relationships
- Focus on unusual payment terms or delivery requirements
- Consider typical vendor protection clauses as standard
- Evaluate against common B2B commercial practices` :
domain === 'professional' ? `
- Acknowledge standard professional service arrangements
- Focus on unusual scope limitations or liability issues
- Consider professional standards and ethics requirements as normal
- Evaluate against typical consulting and service practices` :
`- Apply general business contract standards
- Focus on genuinely problematic or one-sided terms
- Consider common commercial practices as acceptable
- Evaluate against reasonable business expectations`}

MISSING PROTECTIONS - Only suggest truly important additions:
${domain === 'finance' ? `
- Focus only on critical regulatory compliance gaps
- Essential financial risk protections missing
- Unusual exposure to market or credit risks` : 
domain === 'real_estate' ? `
- Focus on significant property risk gaps
- Essential title and environmental protections missing
- Unusual liability exposures for property transactions` :
domain === 'healthcare' ? `
- Critical patient safety or privacy gaps only
- Essential compliance protections missing
- Unusual professional liability exposures` :
domain === 'technology' ? `
- Critical IP or data security gaps only
- Essential service level protections missing
- Unusual technology liability exposures` :
domain === 'employment' ? `
- Significant employee rights gaps only
- Essential workplace protections missing
- Unusual employment liability issues` :
`Standard business protections that are genuinely missing and important`}

TONE AND APPROACH:
- Use constructive, balanced language
- Acknowledge when terms are "typical" or "standard" even if not ideal
- Distinguish between "could be improved" and "problematic"
- Focus recommendations on material improvements
- Recognize business realities and common practices

Return analysis as JSON with this structure:
{
  "riskScore": number (typically 20-50 for most contracts, with only genuinely problematic contracts scoring 70+),
  "clauses": [{"id": "clause_X", "title": "Specific Clause Name", "content": "exact contract text", "riskLevel": "low|medium|high", "riskScore": number, "explanation": "balanced explanation noting if terms are standard or problematic", "suggestions": ["practical improvements"], "startIndex": 100, "endIndex": 200}],
  "keyIssues": [{"id": "issue_X", "title": "Key Risk Area", "description": "business impact explanation focusing on material concerns", "riskLevel": "low|medium|high", "clause": "related clause name", "suggestion": "practical negotiation point"}],
  "missingProtections": [{"id": "missing_X", "title": "Important Missing Protection", "description": "why this protection matters for ${domain} contracts", "importance": "critical|important|recommended", "sampleClause": "suggested protective language"}],
  "riskBreakdown": {"payment": number, "liability": number, "termination": number, "confidentiality": number, "intellectual_property": number},
  "plainLanguageSummary": "Balanced summary acknowledging both strengths and areas for improvement in this ${domain} contract",
  "confidence": 0.85
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: `Analyze this contract for legal risks and issues. Focus on material concerns while recognizing industry standards and common business practices:\n\nContract Title: ${title}\n\nContract Text:\n${contractText}`,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const analysisData: GeminiAnalysisResponse = JSON.parse(rawJson);

    return {
      id: crypto.randomUUID(),
      title,
      content: contractText,
      ...analysisData,
      analysisDate: new Date(),
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // For demo purposes, if API fails, create a meaningful error message
    if (error instanceof Error && error.message.includes('500')) {
      throw new Error('Gemini API is currently experiencing issues. This might be due to API quota limits, incorrect configuration, or temporary service issues. Please check your Gemini API key in Replit Secrets and try again later.');
    }
    
    throw new Error(`Failed to analyze contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function askContractQuestion(
  contractText: string,
  question: string
): Promise<string> {
  try {
    const ai = await getAI();
    
    const systemPrompt = `You are a Contract Risk Analysis AI specializing in contract Q&A.
    
    Your job is to answer questions about contracts clearly and accurately, with a balanced perspective.
    
    Rules:
    - Answer in plain English that non-lawyers can understand
    - Always reference specific clauses when relevant
    - If you're unsure, say so clearly
    - Focus only on what's actually in the contract
    - Provide practical, actionable insights that consider business realities
    - Keep legal jargon to a minimum
    - Distinguish between ideal terms and acceptable business practices
    - Consider industry standards when evaluating contract terms`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: `Contract:\n${contractText}\n\nQuestion: ${question}`,
    });

    return response.text || "I couldn't provide an answer to your question.";
  } catch (error) {
    console.error('Gemini Q&A error:', error);
    throw new Error(`Failed to answer question: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
