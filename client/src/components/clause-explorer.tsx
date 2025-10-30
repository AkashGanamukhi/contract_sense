import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, List } from 'lucide-react';
import type { Clause, RiskLevel } from '@shared/schema';

interface ClauseExplorerProps {
  clauses: Clause[];
  selectedClause?: string;
  onClauseSelect: (clauseId: string) => void;
}

export function ClauseExplorer({ clauses, selectedClause, onClauseSelect }: ClauseExplorerProps) {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRiskLabel = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Good Clause';
      default: return 'Unknown';
    }
  };

  const sortedClauses = [...clauses].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <List className="w-5 h-5 mr-2" />
          Clause Explorer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedClauses.map((clause) => (
            <div
              key={clause.id}
              className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                selectedClause === clause.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
              }`}
              onClick={() => onClauseSelect(clause.id)}
            >
              <div className="flex items-center min-w-0 flex-1">
                <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${getRiskColor(clause.riskLevel)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {clause.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Risk Score: {clause.riskScore}/100
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <Badge className={`${getRiskBadgeColor(clause.riskLevel)} text-xs`}>
                  {getRiskLabel(clause.riskLevel)}
                </Badge>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {clauses.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No clauses identified yet</p>
            <p className="text-sm">Upload a contract to see clause analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
