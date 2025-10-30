import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Copy, MessageSquare, Eye, FileText, Search } from 'lucide-react';
import type { ContractAnalysis, Clause, RiskLevel } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ContractViewerProps {
  analysis: ContractAnalysis;
  selectedClause?: string;
  onClauseSelect: (clauseId: string) => void;
}

export function ContractViewer({ analysis, selectedClause, onClauseSelect }: ContractViewerProps) {
  const [viewMode, setViewMode] = useState<'legal' | 'plain'>('legal');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const highlightedContent = useMemo(() => {
    let content = analysis.content;
    
    // Apply search highlighting first
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      content = content.replace(regex, '<mark class="bg-blue-200 dark:bg-blue-800">$1</mark>');
    }

    // Apply clause highlighting
    const sortedClauses = [...analysis.clauses].sort((a, b) => a.startIndex - b.startIndex);
    
    let offset = 0;
    sortedClauses.forEach((clause) => {
      const startIndex = clause.startIndex + offset;
      const endIndex = clause.endIndex + offset;
      const riskColorClass = getRiskColor(clause.riskLevel).split(' ')[0]; // Get background color class
      
      const beforeText = content.substring(0, startIndex);
      const clauseText = content.substring(startIndex, endIndex);
      const afterText = content.substring(endIndex);
      
      const wrappedClause = `<span 
        class="clause-highlight ${riskColorClass} px-1 py-0.5 rounded cursor-pointer transition-all hover:opacity-80 ${selectedClause === clause.id ? 'ring-2 ring-blue-500' : ''}" 
        data-clause-id="${clause.id}"
        data-risk="${clause.riskLevel}"
        title="${clause.explanation}"
      >${clauseText}</span>`;
      
      content = beforeText + wrappedClause + afterText;
      offset += wrappedClause.length - clauseText.length;
    });

    return content;
  }, [analysis, searchTerm, selectedClause]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(analysis.content);
      toast({
        title: 'Copied to clipboard',
        description: 'Contract text has been copied.',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy text to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleClauseClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clauseElement = target.closest('[data-clause-id]');
    if (clauseElement) {
      const clauseId = clauseElement.getAttribute('data-clause-id');
      if (clauseId) {
        onClauseSelect(clauseId);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Contract Document
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={viewMode === 'plain' ? 'default' : 'outline'}
                onClick={() => setViewMode('plain')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Plain English
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'legal' ? 'default' : 'outline'}
                onClick={() => setViewMode('legal')}
              >
                Legal View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contract text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Document Content */}
            <div className="border rounded-lg bg-gray-50 dark:bg-gray-900">
              <div 
                className="max-h-96 overflow-y-auto p-6 text-sm leading-relaxed whitespace-pre-wrap"
                onClick={handleClauseClick}
                dangerouslySetInnerHTML={{
                  __html: viewMode === 'plain' ? analysis.plainLanguageSummary : highlightedContent
                }}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={handleCopyText}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Text
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Add Comment
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {analysis.clauses.length} clauses analyzed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Risk Level Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge className={getRiskColor('high')}>
              High Risk
            </Badge>
            <Badge className={getRiskColor('medium')}>
              Medium Risk
            </Badge>
            <Badge className={getRiskColor('low')}>
              Low Risk / Good Clause
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
