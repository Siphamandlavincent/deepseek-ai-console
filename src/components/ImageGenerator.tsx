
import { useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter an image prompt");
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      // Check if puter is available
      if (typeof window !== 'undefined' && (window as any).puter) {
        const puter = (window as any).puter;
        const imageElement = await puter.ai.txt2img(prompt);
        
        if (imageElement && imageElement.src) {
          setGeneratedImage(imageElement.src);
          toast.success("Image generated successfully");
        } else {
          throw new Error("No image returned");
        }
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Use a placeholder image service for demonstration
        const placeholderUrl = `https://picsum.photos/512/512?random=${Date.now()}`;
        setGeneratedImage(placeholderUrl);
        toast.success("Image generated successfully (demo mode)");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Image Generation</h2>
        <div className="text-sm text-deepseek-gray-300">
          Text-to-Image AI Model
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-4">
              Describe the image you want to create:
            </label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic AI laboratory with glowing screens..."
              className="bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500 h-12"
              disabled={isLoading}
            />
            <div className="mt-4 text-xs text-deepseek-gray-400">
              Tip: Be descriptive for better results. Include style, colors, mood, and details.
            </div>
          </div>
          
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-deepseek-blue to-deepseek-cyan hover:from-deepseek-cyan hover:to-deepseek-blue text-white font-medium h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 mr-2" />
                Create Image
              </>
            )}
          </Button>
        </div>

        {/* Output Section */}
        <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600">
          <label className="block text-sm font-medium text-deepseek-gray-300 mb-4">
            Generated Image:
          </label>
          
          <div className="bg-deepseek-dark rounded-lg border border-deepseek-gray-700 aspect-square flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-deepseek-electric mx-auto mb-2" />
                <p className="text-deepseek-gray-400">Creating your image...</p>
              </div>
            ) : generatedImage ? (
              <img 
                src={generatedImage} 
                alt="Generated image" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center text-deepseek-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Generated image will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
