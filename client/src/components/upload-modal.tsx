import React, { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload, useContractAnalysis, storeAnalysis } from '@/hooks/use-contract-analysis';
import { validateFileSize, validateFileType } from '@/lib/file-processing';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysisId: string) => void;
}

export function UploadModal({ isOpen, onClose, onAnalysisComplete }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  const fileUpload = useFileUpload();
  const contractAnalysis = useContractAnalysis();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setProgress(10);
      
      // Validate file first
      validateFileSize(selectedFile);
      validateFileType(selectedFile);
      setProgress(20);
      
      toast({
        title: 'Processing File',
        description: 'Extracting text from your contract...',
      });
      
      const processedFile = await fileUpload.mutateAsync(selectedFile);
      setProgress(50);

      toast({
        title: 'Analyzing Contract',
        description: 'Running AI analysis with Gemini...',
      });

      const analysis = await contractAnalysis.mutateAsync({
        content: processedFile.content,
        title: processedFile.filename.replace(/\.[^/.]+$/, ''),
      });
      setProgress(100);

      storeAnalysis(analysis);
      
      toast({
        title: 'Analysis Complete',
        description: `Found ${analysis.keyIssues.length} issues and analyzed ${analysis.clauses.length} clauses.`,
      });

      onAnalysisComplete(analysis.id);
      onClose();
      resetModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Upload error:', error);
      
      toast({
        title: 'Analysis Failed',
        description: errorMessage.includes('API key') 
          ? 'Please ensure your Gemini API key is properly configured in Replit Secrets.'
          : errorMessage,
        variant: 'destructive',
      });
      setProgress(0);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setProgress(0);
    setDragActive(false);
  };

  const isProcessing = fileUpload.isPending || contractAnalysis.isPending;
  const isComplete = progress === 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Contract
          </DialogTitle>
        </DialogHeader>


        <div className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="w-12 h-12 mx-auto text-primary" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drop your contract here</p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse files
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="outline" 
                  asChild
                  disabled={isProcessing}
                >
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
            )}
          </div>

          {/* File Format Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Supported formats
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  <strong>DOCX files (recommended)</strong> and PDF files up to 10MB. DOCX provides more reliable text extraction for better analysis results.
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {progress < 50 ? 'Processing file...' : 'Analyzing with Gemini AI...'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing || isComplete}
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Contract'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
