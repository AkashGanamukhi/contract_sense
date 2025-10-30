import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Download, 
  Share2, 
  MessageCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  X,
  Check
} from 'lucide-react';
import type { ContractAnalysis, RiskLevel } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface RiskInsightsProps {
  analysis: ContractAnalysis;
  selectedClause?: string;
}

export function RiskInsights({ analysis, selectedClause }: RiskInsightsProps) {
  const { toast } = useToast();
  const [showProtectionModal, setShowProtectionModal] = useState(false);
  const [selectedProtection, setSelectedProtection] = useState<any>(null);

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'important': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'recommended': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const riskBreakdownEntries = Object.entries(analysis.riskBreakdown).map(([key, value]) => ({
    category: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    key
  }));

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your analysis report is being prepared for download.',
    });
  };

  const handleShare = () => {
    toast({
      title: 'Share Link Generated',
      description: 'Analysis link has been copied to clipboard.',
    });
  };

  const handleAddProtection = (protection: any) => {
    setSelectedProtection(protection);
    setShowProtectionModal(true);
  };

  const confirmAddProtection = () => {
    if (selectedProtection) {
      toast({
        title: 'Protection Added',
        description: `"${selectedProtection.title}" has been added to your contract recommendations.`,
      });
      setShowProtectionModal(false);
      setSelectedProtection(null);
    }
  };

  const handleViewSuggestion = (issue: any) => {
    toast({
      title: 'Suggestion Details',
      description: issue.suggestion || 'Consider reviewing this clause with legal counsel.',
    });
  };

  const selectedClauseData = selectedClause 
    ? analysis.clauses.find(c => c.id === selectedClause)
    : null;

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Risk Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold text-white ${
              analysis.riskScore >= 70 ? 'bg-gradient-to-br from-red-500 to-red-600' :
              analysis.riskScore >= 40 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
              'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              {analysis.riskScore}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Overall Risk Score
            </p>
          </div>

          {/* Risk Breakdown */}
          <div className="space-y-3">
            {riskBreakdownEntries.map(({ category, value, key }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {category}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        value >= 70 ? 'bg-red-500' :
                        value >= 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    value >= 70 ? 'text-red-600 dark:text-red-400' :
                    value >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Clause Details */}
      {selectedClauseData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Clause Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedClauseData.title}
                </h4>
                <Badge className={`mt-1 ${
                  selectedClauseData.riskLevel === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                  selectedClauseData.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {selectedClauseData.riskLevel} Risk ({selectedClauseData.riskScore}/100)
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedClauseData.explanation}
                </p>
              </div>
              
              {selectedClauseData.suggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Suggestions:
                  </h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {selectedClauseData.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Key Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.keyIssues.map((issue) => (
              <div 
                key={issue.id}
                className={`border-l-4 p-4 ${
                  issue.riskLevel === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  issue.riskLevel === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-green-500 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <div className="flex items-start">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 mr-3 ${getRiskColor(issue.riskLevel)}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {issue.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {issue.description}
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className={`p-0 h-auto text-xs mt-2 ${getRiskColor(issue.riskLevel)}`}
                      onClick={() => handleViewSuggestion(issue)}
                    >
                      View Suggestion <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {analysis.keyIssues.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No critical issues identified</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Missing Protections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Missing Protections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.missingProtections.map((protection) => (
              <div 
                key={protection.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Shield className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {protection.title}
                    </span>
                    <div className="flex items-center mt-1">
                      <Badge className={`text-xs mr-2 ${getImportanceColor(protection.importance)}`}>
                        {protection.importance}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => handleAddProtection(protection)}
                >
                  Add <Plus className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}

            {analysis.missingProtections.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All standard protections are present</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>



      {/* Analysis Confidence */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Analysis Confidence</span>
            <span className="font-medium">{Math.round(analysis.confidence * 100)}%</span>
          </div>
          <Progress value={analysis.confidence * 100} className="mt-2" />
        </CardContent>
      </Card>

      {/* Protection Preview Modal */}
      {showProtectionModal && selectedProtection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Protection: {selectedProtection.title}
              </h3>
              <button
                onClick={() => setShowProtectionModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Badge className={`${getImportanceColor(selectedProtection.importance)} mb-3`}>
                  {selectedProtection.importance}
                </Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {selectedProtection.description}
                </p>
              </div>
              
              {selectedProtection.sampleClause && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Sample Clause to Add:
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 italic leading-relaxed">
                    "{selectedProtection.sampleClause}"
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowProtectionModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAddProtection}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm & Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
