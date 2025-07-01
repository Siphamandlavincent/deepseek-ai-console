
import { useState } from "react";
import { FileText, Upload, Loader2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  file: File;
}

export const DocumentAnalyzer = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check if adding these files would exceed the 3 file limit
    if (uploadedFiles.length + files.length > 3) {
      toast.error("Maximum 3 files allowed");
      return;
    }

    setIsUploading(true);

    for (const file of Array.from(files)) {
      // Check file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 500MB limit`);
        continue;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }

      try {
        let content = "";
        
        if (file.type === 'application/pdf') {
          // For PDFs, we'll store the file reference and process it when needed
          content = "PDF content will be analyzed when questioned";
        } else if (file.type.startsWith('image/')) {
          // For images, create a data URL
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          type: file.type,
          size: file.size,
          content,
          file
        };

        setUploadedFiles(prev => [...prev, newFile]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    // Reset the input
    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success("File removed");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const analyzeDocuments = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    setIsAnalyzing(true);
    setResponse("");

    try {
      // Create a comprehensive prompt that includes document context
      let documentContext = "Based on the following uploaded documents:\n\n";
      
      uploadedFiles.forEach((file, index) => {
        documentContext += `Document ${index + 1}: ${file.name} (${file.type})\n`;
        if (file.type.startsWith('image/')) {
          documentContext += `[Image content will be analyzed]\n`;
        } else if (file.type === 'application/pdf') {
          documentContext += `[PDF content will be analyzed]\n`;
        }
        documentContext += "\n";
      });

      const fullPrompt = `${documentContext}

User Question: ${question}

Instructions: 
1. First, analyze the uploaded documents thoroughly for relevant information
2. If the answer can be found in the uploaded documents, provide a detailed response based on that content
3. If the documents don't contain sufficient information, clearly state this and then provide an answer based on general knowledge
4. Always indicate whether your answer comes from the uploaded documents or general knowledge`;

      // Check if puter is available
      if (typeof window !== 'undefined' && (window as any).puter) {
        const puter = (window as any).puter;
        
        // For images, include them in the analysis
        const imageFiles = uploadedFiles.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          // Use the first image for vision analysis
          const response = await puter.ai.chat(fullPrompt, imageFiles[0].content);
          setResponse(response);
        } else {
          // Text-only analysis
          const response = await puter.ai.chat(fullPrompt);
          setResponse(response);
        }
        
        toast.success("Document analysis completed");
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const simulatedResponse = `Document Analysis Results:\n\nAnalyzing ${uploadedFiles.length} uploaded file(s):\n${uploadedFiles.map(f => `- ${f.name}`).join('\n')}\n\nQuestion: "${question}"\n\nThis is a simulated document analysis response. In the full implementation, this would:\n\n1. Extract and analyze text content from PDFs\n2. Perform OCR on images to extract text\n3. Search through all document content for relevant information\n4. Provide answers based on the uploaded documents first\n5. Fall back to general knowledge if documents don't contain the answer\n\nThe system would indicate whether the answer comes from your uploaded documents or general AI knowledge.`;
        
        // Simulate streaming response
        for (let i = 0; i < simulatedResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          setResponse(simulatedResponse.slice(0, i + 1));
        }
        
        toast.success("Document analysis completed (demo mode)");
      }
    } catch (error) {
      console.error("Error analyzing documents:", error);
      toast.error("Failed to analyze documents");
      setResponse("Error: Failed to analyze documents. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Document Analysis</h2>
        <div className="text-sm text-deepseek-gray-300">
          AI-Powered Document Understanding
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600 space-y-4">
            <div>
              <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
                Upload Documents ({uploadedFiles.length}/3)
              </label>
              <div className="border-2 border-dashed border-deepseek-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading || uploadedFiles.length >= 3}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex flex-col items-center space-y-2 ${
                    uploadedFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="h-8 w-8 text-deepseek-gray-400" />
                  <span className="text-deepseek-gray-300">
                    {isUploading ? 'Uploading...' : 'Click to upload PDFs or images'}
                  </span>
                  <span className="text-xs text-deepseek-gray-500">
                    Max 500MB per file, 3 files total
                  </span>
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-deepseek-gray-300">
                  Uploaded Files:
                </label>
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-deepseek-dark rounded p-3 border border-deepseek-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-4 w-4 text-deepseek-electric" />
                      <div>
                        <div className="text-white text-sm font-medium">{file.name}</div>
                        <div className="text-deepseek-gray-400 text-xs">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
                Ask a question about your documents:
              </label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What information can you find in these documents?"
                className="bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500 min-h-[100px]"
                disabled={isAnalyzing}
              />
            </div>
          </div>

          <Button
            onClick={analyzeDocuments}
            disabled={isAnalyzing || uploadedFiles.length === 0 || !question.trim()}
            className="w-full bg-gradient-to-r from-deepseek-blue to-deepseek-cyan hover:from-deepseek-cyan hover:to-deepseek-blue text-white font-medium h-12"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Documents...
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 mr-2" />
                Analyze Documents
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600 flex flex-col">
          <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
            Analysis Results:
          </label>
          <div className="bg-deepseek-dark rounded p-4 flex-1 border border-deepseek-gray-700 overflow-auto">
            {response ? (
              <pre className="whitespace-pre-wrap text-white font-mono text-sm">
                {response}
              </pre>
            ) : (
              <div className="text-deepseek-gray-500 italic">
                Upload documents and ask a question to see analysis results...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
