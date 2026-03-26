import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tag, Sparkles, LayoutGrid, Settings, Video } from 'lucide-react';
import AffiliateModule from './AffiliateModule';
import HacksModule from './HacksModule';
import TrollVideoModule from './TrollVideoModule';

const AffiliateVeo3Module = () => {
  const [subModule, setSubModule] = useState<'affiliate' | 'hacks' | 'troll_video'>(() => {
    try {
      return (localStorage.getItem('affiliate_veo3_submodule') as any) || 'affiliate';
    } catch (e) {
      return 'affiliate';
    }
  });

  const handleSubModuleChange = (module: 'affiliate' | 'hacks' | 'troll_video') => {
    setSubModule(module);
    try {
      localStorage.setItem('affiliate_veo3_submodule', module);
    } catch (e) {
      console.warn("Error saving AffiliateVeo3Module state to localStorage:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation for Affiliate VEO3 */}
      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-1 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => handleSubModuleChange('affiliate')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${
              subModule === 'affiliate'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Tag size={18} />
            AFFILIATE
          </button>
          <button
            onClick={() => handleSubModuleChange('troll_video')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${
              subModule === 'troll_video'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Video size={18} />
            VIDEO TROLL
          </button>
          <button
            onClick={() => handleSubModuleChange('hacks')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${
              subModule === 'hacks'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={18} />
            MẸO VẶT
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subModule}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {subModule === 'affiliate' ? (
            <AffiliateModule />
          ) : subModule === 'troll_video' ? (
            <TrollVideoModule />
          ) : (
            <HacksModule />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AffiliateVeo3Module;
