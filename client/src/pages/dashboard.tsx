import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContractViewer } from '@/components/contract-viewer';
import { ClauseExplorer } from '@/components/clause-explorer';
import { RiskInsights } from '@/components/risk-insights';
import { UploadModal } from '@/components/upload-modal';
import { IntroAnimation } from '@/components/intro-animation';
import { useTheme } from '@/components/theme-provider';
import { useStoredAnalysis } from '@/hooks/use-contract-analysis';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Search, 
  Moon, 
  Sun, 
  File,
  Menu,
  BarChart3,
  Settings,
  FolderOpen,
  MessageSquare,
  Download,
  X,
  Send
} from 'lucide-react';
import type { ContractAnalysis } from '@shared/schema';

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [selectedClause, setSelectedClause] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const { data: analysis, isLoading } = useStoredAnalysis(currentAnalysisId);

  // Check for existing analysis on mount
  useEffect(() => {
    const analysisIds = JSON.parse(localStorage.getItem('analysis-ids') || '[]');
    if (analysisIds.length > 0 && !currentAnalysisId) {
      setCurrentAnalysisId(analysisIds[0]);
    }
  }, [currentAnalysisId]);

  // Check if intro should be shown (first time user)
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    setShowIntro(false);
  };

  const handleAnalysisComplete = (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
  };

  const handleClauseSelect = (clauseId: string) => {
    setSelectedClause(clauseId === selectedClause ? undefined : clauseId);
  };

  const handleExportAnalysis = () => {
    if (!analysis) return;
    
    const exportData = {
      contractTitle: analysis.title,
      analysisDate: analysis.analysisDate,
      riskScore: analysis.riskScore,
      confidence: analysis.confidence,
      riskBreakdown: analysis.riskBreakdown,
      keyIssues: analysis.keyIssues,
      missingProtections: analysis.missingProtections,
      plainLanguageSummary: analysis.plainLanguageSummary,
      clauses: analysis.clauses.map(clause => ({
        title: clause.title,
        content: clause.content,
        riskLevel: clause.riskLevel,
        riskScore: clause.riskScore,
        explanation: clause.explanation,
        suggestions: clause.suggestions
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.title.replace(/[^a-z0-9]/gi, '_')}_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Analysis Exported',
      description: 'Contract analysis exported successfully as JSON file.',
    });
  };

  const [showQAModal, setShowQAModal] = useState(false);
  const [qaQuestion, setQAQuestion] = useState('');
  const [qaResponse, setQAResponse] = useState('');
  const [qaLoading, setQALoading] = useState(false);

  const handleStartQASession = () => {
    if (!analysis) {
      toast({
        title: 'No Analysis Available',
        description: 'Please analyze a contract first before starting a Q&A session.',
        variant: 'destructive',
      });
      return;
    }
    setShowQAModal(true);
  };

  const handleAskQuestion = async () => {
    if (!qaQuestion.trim() || !analysis) return;
    
    setQALoading(true);
    try {
      const { askContractQuestion } = await import('@/lib/gemini');
      const response = await askContractQuestion(analysis.content, qaQuestion);
      setQAResponse(response);
    } catch (error) {
      toast({
        title: 'Q&A Failed',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setQALoading(false);
    }
  };

  const handleDemoAnalysis = async () => {
    const demoContract = `PROFESSIONAL CONSULTING AGREEMENT

This Professional Consulting Agreement ("Agreement") is entered into on [DATE] between TechCorp Inc. ("Client") and Strategic Business Advisors LLC ("Consultant").

1. SCOPE OF SERVICES
Consultant will provide strategic business advisory services, market analysis, and operational recommendations to Client for a period of 6 months.

2. PAYMENT TERMS
Client shall pay Consultant $15,000 monthly within 30 days of invoice receipt. Late payments will incur a 1.5% monthly service charge.

3. LIABILITY AND WARRANTIES
Consultant's total liability under this agreement shall not exceed the total fees paid. Consultant provides services on an "as-is" basis with no express or implied warranties.

4. TERMINATION
Either party may terminate this agreement with 30 days written notice. Client will pay for all services performed through the termination date.

5. CONFIDENTIALITY
Both parties agree to maintain confidentiality of all proprietary information shared during the engagement. This obligation survives termination.

6. INTELLECTUAL PROPERTY
All deliverables and work product created by Consultant become the exclusive property of Client upon payment.

7. GOVERNING LAW
This agreement shall be governed by the laws of [State], and any disputes will be resolved through binding arbitration.`;

    try {
      const { storeAnalysis } = await import('@/hooks/use-contract-analysis');
      const { analyzeContract } = await import('@/lib/gemini');
      
      const analysis = await analyzeContract(demoContract, 'Demo Professional Consulting Agreement');
      storeAnalysis(analysis);
      setCurrentAnalysisId(analysis.id);
      
      toast({
        title: 'Demo Analysis Complete',
        description: 'Explore the AI-powered risk analysis features with this sample contract.',
      });
    } catch (error) {
      toast({
        title: 'Demo Analysis Failed',
        description: 'Please ensure your Gemini API key is configured in Replit Secrets.',
        variant: 'destructive',
      });
    }
  };

  // Show intro animation for first-time users
  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:flex md:w-64 md:flex-col`}>
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <File className="w-4 h-4 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">ContractAI</h1>
            </div>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              <button className="bg-blue-600 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left">
                <BarChart3 className="mr-3 w-4 h-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
              >
                <FolderOpen className="mr-3 w-4 h-4" />
                Upload Contract
              </button>
              <button 
                onClick={handleStartQASession}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
              >
                <MessageSquare className="mr-3 w-4 h-4" />
                Q&A Session
              </button>
              <button 
                onClick={handleExportAnalysis}
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
              >
                <Download className="mr-3 w-4 h-4" />
                Export Analysis
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <button 
            className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <div className="w-full max-w-lg lg:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    className="pl-10 bg-white dark:bg-gray-700" 
                    placeholder="Search contracts..." 
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              
              {/* Upload Button */}
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Contract
              </Button>
              
              {/* Profile */}
              <div className="relative">
                <button className="max-w-xs bg-white dark:bg-gray-800 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
                  <img 
                    className="h-8 w-8 rounded-full" 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                    alt="User avatar"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-none mx-auto px-4 sm:px-6 md:px-8">
              
              {analysis ? (
                <>
                  {/* Contract Analysis Header */}
                  <div className="mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                              {analysis.title}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Analyzed {new Date(analysis.analysisDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Analysis Complete</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleExportAnalysis()}>
                              Export
                            </Button>
                          </div>
                        </div>
                        
                        {/* Risk Score Display */}
                        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-4">
                          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                  <BarChart3 className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Risk Score</p>
                                <p className="text-2xl font-bold text-red-600">{analysis.riskScore}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <Search className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Issues Found</p>
                                <p className="text-2xl font-bold text-blue-600">{analysis.keyIssues.length}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                  <Settings className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Missing Protections</p>
                                <p className="text-2xl font-bold text-yellow-600">{analysis.missingProtections.length}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                  <File className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Good Clauses</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {analysis.clauses.filter(c => c.riskLevel === 'low').length}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Two Panel Layout */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Panel - Contract Viewer */}
                    <div className="lg:col-span-2 space-y-6">
                      <ContractViewer 
                        analysis={analysis}
                        selectedClause={selectedClause}
                        onClauseSelect={handleClauseSelect}
                      />
                      <ClauseExplorer 
                        clauses={analysis.clauses}
                        selectedClause={selectedClause}
                        onClauseSelect={handleClauseSelect}
                      />
                    </div>

                    {/* Right Panel - Risk Insights */}
                    <div className="lg:col-span-1">
                      <RiskInsights 
                        analysis={analysis}
                        selectedClause={selectedClause}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Contract Analysis Yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Upload a DOCX or PDF contract to get started with AI-powered risk analysis, or try our demo.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => setShowUploadModal(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Contract
                    </Button>
                    <Button variant="outline" onClick={() => handleDemoAnalysis()}>
                      Try Demo Analysis
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Q&A Modal */}
      {showQAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Contract Q&A Session
              </h3>
              <button
                onClick={() => {
                  setShowQAModal(false);
                  setQAQuestion('');
                  setQAResponse('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ask a question about your contract:
                </label>
                <textarea
                  value={qaQuestion}
                  onChange={(e) => setQAQuestion(e.target.value)}
                  placeholder="E.g., What are the payment terms? What happens if I need to terminate early?"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              {qaResponse && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Response:</h4>
                  <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{qaResponse}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQAModal(false);
                  setQAQuestion('');
                  setQAResponse('');
                }}
              >
                Close
              </Button>
              <Button
                onClick={handleAskQuestion}
                disabled={!qaQuestion.trim() || qaLoading}
                className="min-w-[100px]"
              >
                {qaLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
