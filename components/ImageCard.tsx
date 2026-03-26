import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNonFaceImage, fileToGenerativePart } from '../services/affiliateService';

interface ImageCardProps {
  sceneKey: string;
  sceneContent: string;
  actionDescription: string;
  veoPrompt: string;
  onUpdateAction: (value: string) => void;
  onUpdateVeoPrompt: (value: string) => void;
  productName: string;
  productImages: (File | Blob)[];
  handRef: File | null;
  bgRef: File | null;
  imageStyle: string;
  handVisibility: string;
  scriptNote: string;
  visualNote: string;
  onImageGenerated: (key: string, url: string) => void;
  gender: string;
  voice: string;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  sceneKey,
  sceneContent,
  actionDescription,
  veoPrompt,
  onUpdateAction,
  onUpdateVeoPrompt,
  productName,
  productImages,
  handRef,
  bgRef,
  imageStyle,
  handVisibility,
  scriptNote,
  visualNote,
  onImageGenerated,
  gender,
  voice,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (productImages.length === 0) return;
    setIsGenerating(true);
    try {
      const productParts = await Promise.all(productImages.map(img => fileToGenerativePart(img as File)));
      const handRefPart = handRef ? await fileToGenerativePart(handRef) : null;
      const bgRefPart = bgRef ? await fileToGenerativePart(bgRef) : null;

      const url = await generateNonFaceImage(
        productParts,
        handRefPart,
        productName,
        actionDescription || sceneContent,
        undefined,
        imageStyle,
        handVisibility,
        scriptNote,
        visualNote,
        bgRefPart,
        undefined,
        "holding product"
      );

      setImageUrl(url);
      onImageGenerated(sceneKey, url);
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full"
    >
      <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phân cảnh {sceneKey.replace('v', '')}</span>
        {imageUrl && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="relative aspect-[9/16] bg-gray-100 flex items-center justify-center overflow-hidden group">
        <AnimatePresence mode="wait">
          {imageUrl ? (
            <motion.img
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={imageUrl}
              alt={`Scene ${sceneKey}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-500 max-w-[150px]">Chưa có hình ảnh minh họa cho cảnh này</p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                Tạo ảnh AI
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isGenerating && imageUrl && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-3 flex-grow flex flex-col">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Lời thoại</label>
          <p className="text-xs text-gray-600 italic leading-relaxed">
            "{sceneContent}"
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Hành động (Visual)</label>
          <textarea
            value={actionDescription}
            onChange={(e) => onUpdateAction(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg text-[11px] text-gray-700 p-2 focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
            rows={2}
            placeholder="Mô tả hành động..."
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">VEO3 Prompt (English)</label>
            <button 
              onClick={() => copyToClipboard(veoPrompt)}
              className="text-[9px] text-indigo-600 font-medium hover:underline"
            >
              {copied ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          <textarea
            value={veoPrompt}
            onChange={(e) => onUpdateVeoPrompt(e.target.value)}
            className="w-full bg-slate-900 border-none rounded-lg text-[10px] text-slate-300 p-2 focus:ring-1 focus:ring-indigo-500 outline-none resize-y font-mono"
            rows={3}
            placeholder="VEO3 Prompt..."
          />
        </div>

        <div className="mt-auto pt-3 border-t border-gray-50 space-y-2">
        </div>
      </div>
    </motion.div>
  );
};
