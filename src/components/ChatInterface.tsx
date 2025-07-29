
import { useState } from "react";
import { Send, Loader2, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface ChatInterfaceProps {
  currentModel: string;
  setCurrentModel: (model: string) => void;
}

export const ChatInterface = ({ currentModel, setCurrentModel }: ChatInterfaceProps) => {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<Record<string, { content: string; isLoading: boolean; error: string | null }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(["Llama-4-Maverick-17B-128E-Instruct"]);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single');

  const models = [
    { value: "Llama-4-Maverick-17B-128E-Instruct", label: "Llama-4-Maverick-17B (SambaNova)" },
    { value: "gpt-4o", label: "GPT-4o (Advanced)" },
    { value: "o3-mini", label: "O3-Mini (Fast)" },
    { value: "claude-sonnet", label: "Claude Sonnet" },
    { value: "gemini-pro", label: "Gemini Pro" },
  ];

  const handleModelSelection = (modelValue: string, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, modelValue]);
    } else {
      setSelectedModels(prev => {
        const newSelection = prev.filter(m => m !== modelValue);
        // Ensure at least one model is always selected
        return newSelection.length > 0 ? newSelection : prev;
      });
    }
  };

  const generateResponseForModel = async (modelValue: string, promptText: string) => {
    const apiKey = localStorage.getItem("sambanova_api_key");
    if (!apiKey) {
      throw new Error("Please set your SambaNova API key in the Status Panel");
    }

    // Initialize response state for this model
    setResponses(prev => ({
      ...prev,
      [modelValue]: { content: "", isLoading: true, error: null }
    }));

    try {
      const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Llama-4-Maverick-17B-128E-Instruct",
          messages: [
            {
              role: "user",
              content: promptText
            }
          ],
          stream: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                setResponses(prev => ({
                  ...prev,
                  [modelValue]: { content: fullResponse, isLoading: true, error: null }
                }));
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Mark as complete
      setResponses(prev => ({
        ...prev,
        [modelValue]: { content: fullResponse, isLoading: false, error: null }
      }));

    } catch (error) {
      console.error(`Error generating response for ${modelValue}:`, error);
      setResponses(prev => ({
        ...prev,
        [modelValue]: { 
          content: "", 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    setIsLoading(true);
    setResponses({});
    
    // Set view mode based on number of selected models
    setViewMode(selectedModels.length > 1 ? 'comparison' : 'single');

    try {
      // Generate responses for all selected models simultaneously
      const promises = selectedModels.map(model => 
        generateResponseForModel(model, prompt)
      );
      
      await Promise.allSettled(promises);

      toast.success(`Responses generated for ${selectedModels.length} model${selectedModels.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error(`Failed to generate responses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">AI Chat Interface</h2>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'single' ? 'comparison' : 'single')}
            className="bg-deepseek-gray-800 border-deepseek-gray-600 text-white hover:bg-deepseek-gray-700"
          >
            {viewMode === 'single' ? <Grid className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
            {viewMode === 'single' ? 'Comparison Mode' : 'Single Mode'}
          </Button>
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600">
        <h3 className="text-sm font-medium text-deepseek-gray-300 mb-3">Select Models for Comparison:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {models.map((model) => (
            <div key={model.value} className="flex items-center space-x-2">
              <Checkbox
                id={model.value}
                checked={selectedModels.includes(model.value)}
                onCheckedChange={(checked) => handleModelSelection(model.value, checked as boolean)}
                className="border-deepseek-gray-600"
              />
              <label
                htmlFor={model.value}
                className="text-sm text-deepseek-gray-300 cursor-pointer truncate"
                title={model.label}
              >
                {model.label}
              </label>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-deepseek-gray-400">
          Selected: {selectedModels.length} model{selectedModels.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className={`flex-1 ${viewMode === 'comparison' ? 'grid grid-cols-1' : 'grid grid-cols-2'} gap-6 min-h-0`}>
        {/* Input Section */}
        <div className={`flex flex-col space-y-4 ${viewMode === 'comparison' ? '' : ''}`}>
          <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600">
            <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
              Enter your prompt:
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me anything..."
              className="min-h-[200px] bg-deepseek-dark border-deepseek-gray-600 text-white placeholder:text-deepseek-gray-500 font-mono"
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

        {/* Output Section(s) */}
        {viewMode === 'single' && (
          <div className="flex flex-col">
            <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600 flex-1">
              <label className="block text-sm font-medium text-deepseek-gray-300 mb-2">
                AI Response:
              </label>
              <div className="bg-deepseek-dark rounded p-4 min-h-[300px] border border-deepseek-gray-700 overflow-auto">
                {Object.keys(responses).length > 0 ? (
                  Object.entries(responses).map(([modelKey, response]) => (
                    <div key={modelKey}>
                      <pre className="whitespace-pre-wrap text-white font-mono text-sm">
                        {response.content}
                      </pre>
                      {response.error && (
                        <div className="text-red-400 text-sm mt-2">
                          Error: {response.error}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-deepseek-gray-500 italic">
                    Response will appear here...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison View */}
        {viewMode === 'comparison' && (
          <div className="col-span-full">
            <div className={`grid gap-4 ${
              selectedModels.length === 1 ? 'grid-cols-1' :
              selectedModels.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
              'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            }`}>
              {selectedModels.map((modelValue) => {
                const model = models.find(m => m.value === modelValue);
                const response = responses[modelValue];
                
                return (
                  <div key={modelValue} className="flex flex-col">
                    <div className="bg-deepseek-gray-800 rounded-lg p-4 border border-deepseek-gray-600 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-deepseek-gray-300">
                          {model?.label || modelValue}
                        </label>
                        {response?.isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-deepseek-electric" />
                        )}
                      </div>
                      <div className="bg-deepseek-dark rounded p-4 min-h-[300px] border border-deepseek-gray-700 overflow-auto">
                        {response?.content ? (
                          <pre className="whitespace-pre-wrap text-white font-mono text-sm">
                            {response.content}
                          </pre>
                        ) : response?.error ? (
                          <div className="text-red-400 text-sm">
                            Error: {response.error}
                          </div>
                        ) : response?.isLoading ? (
                          <div className="text-deepseek-gray-500 italic">
                            Generating response...
                          </div>
                        ) : (
                          <div className="text-deepseek-gray-500 italic">
                            Response will appear here...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
