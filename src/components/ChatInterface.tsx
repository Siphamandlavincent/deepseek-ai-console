
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
    { value: "Llama-4-Maverick-17B-128E-Instruct", label: "Llama-4-Maverick-17B (SambaNova)" },
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

    const apiKey = localStorage.getItem("sambanova_api_key");
    if (!apiKey) {
      toast.error("Please set your SambaNova API key in the Status Panel");
      return;
    }

    setIsLoading(true);
    setResponse("");

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
              content: prompt
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
                setResponse(fullResponse);
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      toast.success("Response generated successfully");
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResponse("Error: Failed to generate response. Please check your API key and try again.");
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
