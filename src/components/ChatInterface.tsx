
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ChatInterfaceProps {
  currentModel: string;
  setCurrentModel: (model: string) => void;
}

export const ChatInterface = ({ currentModel, setCurrentModel }: ChatInterfaceProps) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const models = [
    { value: "gpt-4o", label: "GPT-4o (Advanced)" },
    { value: "o3-mini", label: "O3-Mini (Fast)" },
    { value: "claude-sonnet", label: "Claude Sonnet" },
    { value: "gemini-pro", label: "Gemini Pro" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      // Check if puter is available
      if (typeof window !== 'undefined' && (window as any).puter) {
        const puter = (window as any).puter;
        
        // Stream the response
        const stream = await puter.ai.chat(prompt, { model: currentModel, stream: true });
        
        for await (const part of stream) {
          if (part?.text) {
            setResponse(prev => prev + part.text);
          }
        }
      } else {
        // Fallback simulation if puter is not available
        const simulatedResponse = `DeepSeek AI Response (${currentModel}):\n\nI understand you're looking for assistance with: "${prompt}"\n\nThis is a simulated response as the Puter.js library is being loaded. In the full implementation, this would connect to real AI models for advanced text generation, analysis, and conversation.`;
        
        // Simulate streaming
        for (let i = 0; i < simulatedResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 10));
          setResponse(simulatedResponse.slice(0, i + 1));
        }
      }
      
      toast.success("Response generated successfully");
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Failed to generate response");
      setResponse("Error: Failed to generate response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">AI Chat Interface</h2>
        <Select value={currentModel} onValueChange={setCurrentModel}>
          <SelectTrigger className="w-48 bg-deepseek-gray-800 border-deepseek-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-deepseek-gray-800 border-deepseek-gray-600">
            {models.map((model) => (
              <SelectItem key={model.value} value={model.value} className="text-white hover:bg-deepseek-gray-700">
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col space-y-4">
          <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
              Enter your prompt:
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything..."
              className="min-h-[300px] bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500 font-mono"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-gradient-to-r from-deepseek-blue to-deepseek-cyan hover:from-deepseek-cyan hover:to-deepseek-blue text-white font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Generate Response
              </>
            )}
          </Button>
        </div>

        {/* Output Section */}
        <div className="flex flex-col">
          <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600 flex-1">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
              AI Response:
            </label>
            <div className="bg-deepseek-dark rounded p-4 min-h-[300px] border border-deepseek-gray-700 overflow-auto">
              {response ? (
                <pre className="whitespace-pre-wrap text-white font-mono text-sm">
                  {response}
                </pre>
              ) : (
                <div className="text-deepseek-gray-500 italic">
                  Response will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
