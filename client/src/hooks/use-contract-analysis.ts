import { useMutation, useQuery } from '@tanstack/react-query';
import { analyzeContract, askContractQuestion } from '@/lib/gemini';
import { processFile, validateFileSize, validateFileType } from '@/lib/file-processing';
import type { ContractAnalysis } from '@shared/schema';

export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      validateFileSize(file);
      validateFileType(file);
      return await processFile(file);
    },
  });
}

export function useContractAnalysis() {
  return useMutation({
    mutationFn: async ({ content, title }: { content: string; title: string }) => {
      return await analyzeContract(content, title);
    },
  });
}

export function useContractQuestion() {
  return useMutation({
    mutationFn: async ({ contractText, question }: { contractText: string; question: string }) => {
      return await askContractQuestion(contractText, question);
    },
  });
}

export function useStoredAnalysis(analysisId: string | null) {
  return useQuery({
    queryKey: ['contract-analysis', analysisId],
    queryFn: (): ContractAnalysis | null => {
      if (!analysisId) return null;
      
      const stored = localStorage.getItem(`analysis-${analysisId}`);
      return stored ? JSON.parse(stored) : null;
    },
    enabled: !!analysisId,
  });
}

export function storeAnalysis(analysis: ContractAnalysis) {
  localStorage.setItem(`analysis-${analysis.id}`, JSON.stringify(analysis));
  
  // Store list of analysis IDs for dashboard
  const existingIds = JSON.parse(localStorage.getItem('analysis-ids') || '[]');
  const updatedIds = [analysis.id, ...existingIds.filter((id: string) => id !== analysis.id)];
  localStorage.setItem('analysis-ids', JSON.stringify(updatedIds.slice(0, 10))); // Keep last 10
}

export function useAnalysisList() {
  return useQuery({
    queryKey: ['analysis-list'],
    queryFn: (): string[] => {
      return JSON.parse(localStorage.getItem('analysis-ids') || '[]');
    },
  });
}
