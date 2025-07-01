
import { Activity, Zap } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-deepseek-darker border-b border-deepseek-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Zap className="h-8 w-8 text-deepseek-electric animate-glow" />
            <div className="absolute inset-0 h-8 w-8 text-deepseek-electric opacity-20 animate-pulse">
              <Zap className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DeepSeek AI</h1>
            <p className="text-sm text-deepseek-gray-300">Advanced AI Development Console</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-green-400">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">System Online</span>
          </div>
          <div className="h-6 w-px bg-deepseek-gray-600"></div>
          <div className="text-sm text-deepseek-gray-300">
            Core v1.2.1
          </div>
        </div>
      </div>
    </header>
  );
};
