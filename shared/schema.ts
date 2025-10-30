import { z } from "zod";

export const riskLevels = ['low', 'medium', 'high'] as const;
export type RiskLevel = typeof riskLevels[number];

export const clauseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  riskLevel: z.enum(riskLevels),
  riskScore: z.number().min(0).max(100),
  explanation: z.string(),
  suggestions: z.array(z.string()),
  startIndex: z.number(),
  endIndex: z.number(),
});

export const contractAnalysisSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  riskScore: z.number().min(0).max(100),
  clauses: z.array(clauseSchema),
  keyIssues: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    riskLevel: z.enum(riskLevels),
    clause: z.string(),
    suggestion: z.string(),
  })),
  missingProtections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    importance: z.enum(['critical', 'important', 'recommended']),
    sampleClause: z.string(),
  })),
  riskBreakdown: z.object({
    payment: z.number().min(0).max(100),
    liability: z.number().min(0).max(100),
    termination: z.number().min(0).max(100),
    confidentiality: z.number().min(0).max(100),
    intellectual_property: z.number().min(0).max(100),
  }),
  plainLanguageSummary: z.string(),
  confidence: z.number().min(0).max(1),
  analysisDate: z.date(),
});

export const uploadedContractSchema = z.object({
  id: z.string(),
  filename: z.string(),
  content: z.string(),
  fileType: z.enum(['pdf', 'docx']),
  uploadDate: z.date(),
  pageCount: z.number(),
  wordCount: z.number(),
});

export type Clause = z.infer<typeof clauseSchema>;
export type ContractAnalysis = z.infer<typeof contractAnalysisSchema>;
export type UploadedContract = z.infer<typeof uploadedContractSchema>;
