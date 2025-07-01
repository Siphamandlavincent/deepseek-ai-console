
import { useState } from "react";
import { Eye, Loader2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const VisionAnalyzer = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("What do you see in this image?");
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a question about the image");
      return;
    }

    setIsLoading(true);
    setAnalysis("");

    try {
      // Check if puter is available
      if (typeof window !== 'undefined' && (window as any).puter) {
        const puter = (window as any).puter;
        const response = await puter.ai.chat(prompt, imageUrl);
        setAnalysis(response);
        toast.success("Image analysis completed");
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const simulatedAnalysis = `DeepSeek Vision Analysis:\n\nAnalyzing image from: ${imageUrl}\n\nQuestion: "${prompt}"\n\nThis is a simulated vision analysis response. In the full implementation, this would use advanced computer vision AI models to analyze the provided image and answer your specific questions about its contents, composition, objects, people, text, and other visual elements.\n\nThe system would provide detailed descriptions, identify objects and people, read text, analyze artistic elements, and answer complex questions about the visual content.`;
        
        // Simulate streaming response
        for (let i = 0; i < simulatedAnalysis.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          setAnalysis(simulatedAnalysis.slice(0, i + 1));
        }
        
        toast.success("Image analysis completed (demo mode)");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Failed to analyze image");
      setAnalysis("Error: Failed to analyze image. Please check the image URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Vision Analysis</h2>
        <div className="text-sm text-deepseek-gray-300">
          AI-Powered Image Understanding
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600 space-y-4">
            <div>
              <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
                Image URL:
              </label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
                What would you like to know about this image?
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you see in this image..."
                className="bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500 min-h-[100px]"
                disabled={isLoading}
              />
            </div>
            
            <div className="text-xs text-deepseek-gray-400">
              <div className="flex items-center space-x-1 mb-1">
                <Link className="h-3 w-3" />
                <span>Supports: JPG, PNG, GIF, WebP formats</span>
              </div>
              <div>Ask about objects, text, people, colors, composition, or any visual elements</div>
            </div>
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !imageUrl.trim() || !prompt.trim()}
            className="w-full bg-gradient-to-r from-deepseek-blue to-deepseek-cyan hover:from-deepseek-cyan hover:to-deepseek-blue text-white font-medium h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Eye className="h-5 w-5 mr-2" />
                Analyze Image
              </>
            )}
          </Button>
        </div>

        {/* Output Section */}
        <div className="flex flex-col space-y-4">
          {/* Image Preview */}
          {imageUrl && (
            <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600">
              <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
                Image Preview:
              </label>
              <div className="bg-deepseek-dark rounded border border-deepseek-gray-700 aspect-video flex items-center justify-center overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Image to analyze" 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Analysis Results */}
          <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600 flex-1">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
              Analysis Results:
            </label>
            <div className="bg-deepseek-dark rounded p-4 min-h-[200px] border border-deepseek-gray-700 overflow-auto">
              {analysis ? (
                <pre className="whitespace-pre-wrap text-white font-mono text-sm">
                  {analysis}
                </pre>
              ) : (
                <div className="text-deepseek-gray-500 italic">
                  Analysis results will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
