import { useState, useRef } from "react";
import { Image as ImageIcon, Loader2, Download, Edit, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ImageEditor } from "./ImageEditor";
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

export const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter an image prompt");
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      // Use Pollinations AI for free image generation
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${Math.floor(Math.random() * 1000000)}`;
      
      // Test if the image loads successfully
      const img = new Image();
      img.onload = () => {
        setGeneratedImage(imageUrl);
        toast.success("Image generated successfully");
      };
      img.onerror = () => {
        throw new Error("Failed to generate image");
      };
      img.src = imageUrl;
      
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("File size must be less than 500MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      toast.success("Image uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackgroundReplace = async () => {
    if (!uploadedImage || !backgroundPrompt.trim()) {
      toast.error("Please upload an image and describe the background");
      return;
    }

    setIsProcessingBackground(true);
    try {
      // Load the segmentation model
      const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        device: 'wasm',
      });

      // Create image element from uploaded image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = uploadedImage;
      });

      // Segment the image to find the subject
      const result = await segmenter(uploadedImage);
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error('Failed to segment image');
      }

      // Generate new background using Pollinations AI
      const backgroundUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(backgroundPrompt + " background, high quality, detailed")}?width=512&height=512&seed=${Math.floor(Math.random() * 1000000)}`;
      
      // Wait for background to load
      const backgroundImg = new Image();
      backgroundImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        backgroundImg.onload = resolve;
        backgroundImg.onerror = reject;
        backgroundImg.src = backgroundUrl;
      });

      // Create canvas to combine subject and background
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw new background (scaled to fit)
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

      // Apply the subject with alpha masking
      const subjectCanvas = document.createElement('canvas');
      const subjectCtx = subjectCanvas.getContext('2d');
      if (!subjectCtx) throw new Error('Could not get subject canvas context');

      subjectCanvas.width = img.width;
      subjectCanvas.height = img.height;
      subjectCtx.drawImage(img, 0, 0);

      const imageData = subjectCtx.getImageData(0, 0, subjectCanvas.width, subjectCanvas.height);
      const data = imageData.data;

      // Apply mask to make background transparent with a threshold for cleaner separation
      const mask = result[0].mask;
      const threshold = 0.5; // Adjust this value for cleaner separation
      for (let i = 0; i < mask.data.length; i++) {
        // Create binary mask: either fully opaque (subject) or fully transparent (background)
        const maskValue = mask.data[i];
        const alpha = maskValue > threshold ? 255 : 0; // Binary threshold
        data[i * 4 + 3] = alpha;
      }

      subjectCtx.putImageData(imageData, 0, 0);

      // Draw the masked subject on top of the new background
      ctx.drawImage(subjectCanvas, 0, 0);

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setGeneratedImage(url);
          toast.success("Background replaced successfully!");
        }
      }, 'image/png');

    } catch (error) {
      console.error("Error replacing background:", error);
      toast.error("Failed to replace background. Please try again.");
    } finally {
      setIsProcessingBackground(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Image Generation</h2>
        <div className="text-sm text-deepseek-gray-300">
          Pollinations AI Model
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Text to Image Section */}
          <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-4">
              Describe the image you want to create:
            </label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A red sports car on a mountain road..."
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

          {/* Image Upload & Background Replace Section */}
          <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-4">
              Upload Image & Replace Background:
            </label>
            
            {/* File Upload */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {!uploadedImage ? (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full bg-deepseek-gray-700 border-deepseek-gray-600 text-white hover:bg-deepseek-gray-600 h-12"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Image (Max 500MB)
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Uploaded Image Preview */}
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded image" 
                      className="w-full h-32 object-cover rounded-lg border border-deepseek-gray-600"
                    />
                    <Button
                      onClick={removeUploadedImage}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-deepseek-gray-700 border-deepseek-gray-600 text-white hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Background Prompt */}
                  <Input
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    placeholder="Describe the new background... (e.g., sunset beach, modern office, forest)"
                    className="bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500"
                    disabled={isProcessingBackground}
                  />
                  
                  <Button
                    onClick={handleBackgroundReplace}
                    disabled={isProcessingBackground || !backgroundPrompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                  >
                    {isProcessingBackground ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Replacing Background...
                      </>
                    ) : (
                      <>
                        <Edit className="h-5 w-5 mr-2" />
                        Replace Background
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-xs text-deepseek-gray-400">
              Upload an image and describe the background you want. AI will automatically remove the current background and add your desired one.
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-deepseek-gray-800 rounded-lg p-6 border border-deepseek-gray-600">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-deepseek-gray-300">
              Generated Image:
            </label>
            {generatedImage && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowEditor(true)}
                  variant="outline"
                  size="sm"
                  className="bg-deepseek-gray-700 border-deepseek-gray-600 text-white hover:bg-deepseek-gray-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="bg-deepseek-gray-700 border-deepseek-gray-600 text-white hover:bg-deepseek-gray-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
              </div>
            )}
          </div>
          
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

      {/* Image Editor Modal */}
      {showEditor && generatedImage && (
        <ImageEditor
          imageUrl={generatedImage}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};
