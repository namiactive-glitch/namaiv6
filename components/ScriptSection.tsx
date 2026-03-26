import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ScriptSectionProps {
  script: Record<string, { dialogue: string, action: string, veoPrompt: string }>;
  onRegeneratePart: (key: string) => Promise<void>;
  onUpdatePart: (key: string, field: 'dialogue' | 'action' | 'veoPrompt', value: string) => void;
  isRegenerating: string | null;
}

export const ScriptSection: React.FC<ScriptSectionProps> = ({ script, onRegeneratePart, onUpdatePart, isRegenerating }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Kịch bản chi tiết</h3>
      <div className="grid gap-4">
        {Object.entries(script).map(([key, scene]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Phân cảnh {key.replace('v', '')}</span>
              <button
                onClick={() => onRegeneratePart(key)}
                disabled={isRegenerating === key}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                title="Viết lại phân cảnh này"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating === key ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 block">Lời thoại</label>
                <textarea
                  value={scene.dialogue}
                  onChange={(e) => onUpdatePart(key, 'dialogue', e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-700 leading-relaxed text-sm resize-y p-0"
                  rows={3}
                  placeholder="Nhập lời thoại..."
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider mb-1 block">VEO3 Prompt (English)</label>
                <textarea
                  value={scene.veoPrompt}
                  onChange={(e) => onUpdatePart(key, 'veoPrompt', e.target.value)}
                  className="w-full bg-slate-900 rounded-lg p-2 font-mono text-[10px] text-slate-300 leading-relaxed resize-y border-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  placeholder="VEO3 Prompt..."
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
