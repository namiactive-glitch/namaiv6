import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Plus, 
  X, 
  ChevronRight, 
  Settings, 
  Sparkles, 
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layout,
  User,
  MessageSquare,
  Target,
  PenTool,
  Palette,
  Hand,
  Layers,
  Zap,
  Copy,
  Check,
  Scissors,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import clsx from 'clsx';
import { 
  fileToGenerativePart, 
  generateNonFaceScript, 
  regenerateNonFaceScriptPart,
  generateNonFaceImage,
  removeBackground
} from '../services/affiliateService';
import { ScriptSection } from './ScriptSection';
import { ImageCard } from './ImageCard';

interface AffiliateModuleProps {
}

const LAYOUT_OPTIONS = [
  "Cận cảnh sản phẩm + nỗi đau trong cuộc sống + trải nghiệm thực tế + giới thiệu chức năng + trường hợp sử dụng + CTA",
  "Câu chuyện chủ đề + mở hộp sản phẩm + đánh giá chi tiết + sử dụng thực tế + CTA",
  "Review chân thực + chia sẻ trải nghiệm người dùng + giới thiệu sản phẩm + CTA",
  "Chủ đề đời sống + đánh giá so sánh + điểm nổi bật + sử dụng sản phẩm trong nhiều trường hợp",
  "Nỗi đau khách hàng + nguyên nhân + giải pháp từ sản phẩm + uy tín thương hiệu + CTA",
  "Giới thiệu sản phẩm + nỗi đau + trải nghiệm thực tế + đánh giá so sánh + bằng chứng + CTA",
  "Chia sẻ chân thực + kiến thức ngành + giới thiệu chức năng + đặc điểm nổi bật + ưu đãi + CTA",
  "Thu hút đối tượng mục tiêu + câu hỏi từ góc độ người dùng + giải đáp + giới thiệu sản phẩm + ưu đãi + CTA",
  "Kết quả và đánh giá trước + nỗi đau trong cuộc sống + giới thiệu sản phẩm + ưu đãi + CTA",
  "Câu hỏi + giải pháp cho nỗi đau + đặc điểm nổi bật sản phẩm + đảm bảo từ nhiều góc độ + CTA",
  "Nỗi đau theo mùa/khu vực + giới thiệu sản phẩm + hoàn cảnh sử dụng + cảm nhận khi trải nghiệm + CTA",
  "Sở thích + giới thiệu sản phẩm + so sánh + giải thích về giá trị và hình thức + đảm bảo + CTA",
  "Xác định đối tượng mục tiêu + giới thiệu sản phẩm + hướng dẫn sử dụng + thử nghiệm và đánh giá + CTA",
  "Phản hồi của người dùng + kiến thức chuyên môn + nỗi đau + giới thiệu sản phẩm + ưu đãi + CTA",
  "Nỗi đau của khách hàng + giải pháp của sản phẩm + kết quả thực tế + CTA",
  "Câu chuyện thất bại + bài học rút ra + sản phẩm là giải pháp + CTA",
  "Đặt câu hỏi + kể chuyện + dẫn dắt + thuyết phục + đưa ra sản phẩm + khẳng định + CTA",
  "Câu chuyện hàng ngày + biến cố bất ngờ + loay hoay tìm cách giải quyết + gặp sản phẩm như cơ duyên + CTA",
  "Sai lầm phổ biến + tôi cũng vậy + hậu quả kéo dài + quyết định đổi hướng + sản phẩm xuất hiện + CTA",
  "Ước muốn + rào cản + thử nhiều cách vẫn thất bại + một lựa chọn khác biệt + đạt được điều mong muốn + CTA",
  "Hook mạnh + giới thiệu công năng + CTA"
];

const VOICE_OPTIONS = [
  { id: "Nữ Bắc - Sale Sôi Động (20-30t)", label: "Nữ Bắc - Sale Sôi Động (20-30t)" },
  { id: "Nữ Bắc - Kể Chuyện Nhẹ Nhàng (20-30t)", label: "Nữ Bắc - Kể Chuyện Nhẹ Nhàng (20-30t)" },
  { id: "Nữ Bắc - MC Tin Tức Chuyên Nghiệp (25-35t)", label: "Nữ Bắc - MC Tin Tức Chuyên Nghiệp (25-35t)" },
  { id: "Nam Bắc - Reviewer Chân Thực (25-35t)", label: "Nam Bắc - Reviewer Chân Thực (25-35t)" },
  { id: "Nam Bắc - Chuyên Gia Uy Tín (40-50t)", label: "Nam Bắc - Chuyên Gia Uy Tín (40-50t)" },
  { id: "Nam Bắc - Hào Sảng/Mạnh Mẽ (30-45t)", label: "Nam Bắc - Hào Sảng/Mạnh Mẽ (30-45t)" },
  { id: "Nữ Nam - Sale Ngọt Ngào (18-25t)", label: "Nữ Nam - Sale Ngọt Ngào (18-25t)" },
  { id: "Nữ Nam - Tâm Sự Cảm Xúc (25-35t)", label: "Nữ Nam - Tâm Sự Cảm Xúc (25-35t)" },
  { id: "Nữ Nam - Reviewer Thân Thiện (20-30t)", label: "Nữ Nam - Reviewer Thân Thiện (20-30t)" },
  { id: "Nam Nam - Reviewer Hài Hước (20-30t)", label: "Nam Nam - Reviewer Hài Hước (20-30t)" },
  { id: "Nam Nam - Kể Chuyện Trầm Ấm (40-60t)", label: "Nam Nam - Kể Chuyện Trầm Ấm (40-60t)" },
  { id: "Nam Nam - Năng Động/Bắt Trend (18-25t)", label: "Nam Nam - Năng Động/Bắt Trend (18-25t)" }
];

const AffiliateModule: React.FC<AffiliateModuleProps> = () => {
  const [productImages, setProductImages] = useState<{file: File | Blob, preview: string, id: string}[]>([]);
  const [isProcessingBg, setIsProcessingBg] = useState<string | null>(null);
  const [handRef, setHandRef] = useState<File | null>(null);
  const [bgRef, setBgRef] = useState<File | null>(null);
  const [productName, setProductName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [layout, setLayout] = useState(LAYOUT_OPTIONS[0]);
  const [gender, setGender] = useState('Female');
  const [voice, setVoice] = useState(VOICE_OPTIONS[0].id);
  const [addressing, setAddressing] = useState('Mình - Các bạn');
  const [sceneCount, setSceneCount] = useState(5);
  const [targetAudience, setTargetAudience] = useState('Gen Z, nội trợ, dân văn phòng');
  const [imageStyle, setImageStyle] = useState('Realistic');
  const [handVisibility, setHandVisibility] = useState('with_hand');
  const [scriptNote, setScriptNote] = useState('Bối cảnh phòng ngủ/phòng làm việc hiện đại, ánh sáng tự nhiên');
  const [visualNote, setVisualNote] = useState('Màu sắc tươi sáng, tập trung vào chi tiết sản phẩm');
  
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [script, setScript] = useState<Record<string, { dialogue: string, action: string, veoPrompt: string }> | null>(null);
  const [isRegeneratingPart, setIsRegeneratingPart] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7)
      }));
      setProductImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeProductImage = (id: string) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
  };

  const handleRemoveBackground = async (id: string) => {
    const imgObj = productImages.find(img => img.id === id);
    if (!imgObj) return;

    setIsProcessingBg(id);
    try {
      const imagePart = await fileToGenerativePart(imgObj.file as File);
      const processedUrl = await removeBackground(imagePart);
      
      // Convert base64 to Blob to keep it consistent
      const response = await fetch(processedUrl);
      const blob = await response.blob();
      
      setProductImages(prev => prev.map(img => 
        img.id === id ? { ...img, file: blob, preview: processedUrl } : img
      ));
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsProcessingBg(null);
    }
  };

  const handleGenerateScript = async () => {
    if (!productName || productImages.length === 0) return;
    setIsGeneratingScript(true);
    try {
      const imageParts = await Promise.all(productImages.map(img => fileToGenerativePart(img.file as File)));
      const result = await generateNonFaceScript(
        imageParts,
        productName,
        keyword,
        layout,
        gender,
        voice,
        addressing,
        sceneCount,
        targetAudience
      );
      setScript(result);
      setGeneratedImages({});
    } catch (error) {
      console.error("Error generating script:", error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRegeneratePart = async (key: string) => {
    if (!script) return;
    setIsRegeneratingPart(key);
    try {
      const imageParts = await Promise.all(productImages.map(img => fileToGenerativePart(img.file as File)));
      const newContent = await regenerateNonFaceScriptPart(
        imageParts,
        productName,
        keyword,
        key,
        script[key],
        script,
        gender,
        voice,
        addressing,
        targetAudience
      );
      setScript(prev => ({ ...prev!, [key]: newContent }));
    } catch (error) {
      console.error("Error regenerating script part:", error);
    } finally {
      setIsRegeneratingPart(null);
    }
  };

  const handleUpdateScriptPart = (key: string, field: 'dialogue' | 'action' | 'veoPrompt', value: string) => {
    if (!script) return;
    setScript(prev => ({
      ...prev!,
      [key]: {
        ...prev![key],
        [field]: value
      }
    }));
  };

  const handleGenerateAllImages = async () => {
    if (!script || productImages.length === 0) return;
    
    setIsGeneratingAllImages(true);
    try {
      const productParts = await Promise.all(productImages.map(img => fileToGenerativePart(img.file as File)));
      const handRefPart = handRef ? await fileToGenerativePart(handRef) : null;
      const bgRefPart = bgRef ? await fileToGenerativePart(bgRef) : null;

      const keys = Object.keys(script);
      await Promise.all(keys.map(async (key) => {
        try {
          const url = await generateNonFaceImage(
            productParts,
            handRefPart,
            productName,
            script[key].action || script[key].dialogue,
            undefined,
            imageStyle,
            handVisibility,
            scriptNote,
            visualNote,
            bgRefPart,
            undefined,
            "holding product"
          );
          setGeneratedImages(prev => ({ ...prev, [key]: url }));
        } catch (err) {
          console.error(`Error generating image for ${key}:`, err);
        }
      }));
    } catch (error) {
      console.error("Error generating all images:", error);
    } finally {
      setIsGeneratingAllImages(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (Object.keys(generatedImages).length === 0) return;
    
    const zip = new JSZip();
    const folder = zip.folder("images");
    
    Object.entries(generatedImages).forEach(([key, url]) => {
      const base64Data = url.split(',')[1];
      folder?.file(`scene_${key}.png`, base64Data, { base64: true });
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${productName || 'product'}_images.zip`;
    link.click();
  };

  const handleDownloadAllPrompts = () => {
    if (!script) return;
    
    let content = `KỊCH BẢN VÀ PROMPT VEO3 - ${productName.toUpperCase()}\n`;
    content += `====================================================\n\n`;
    
    Object.entries(script).forEach(([key, scene]) => {
      content += `PHÂN CẢNH ${key.replace('v', '')}:\n`;
      content += `- Lời thoại: ${scene.dialogue}\n`;
      content += `- Hành động: ${scene.action}\n`;
      content += `- VEO3 Prompt: ${scene.veoPrompt}\n\n`;
      content += `----------------------------------------------------\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${productName || 'product'}_prompts.txt`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-indigo-100/50 border border-indigo-50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl text-gray-900">Cấu hình kịch bản</h2>
                <p className="text-xs text-gray-500">Thiết lập thông tin sản phẩm & kịch bản</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Product Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  Hình ảnh sản phẩm (Gốc)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {productImages.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
                      <img 
                        src={img.preview} 
                        alt="Product" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleRemoveBackground(img.id)}
                          disabled={isProcessingBg === img.id}
                          className="p-2 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50"
                          title="Tách nền trắng"
                        >
                          {isProcessingBg === img.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Scissors className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => removeProductImage(img.id)}
                          className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-lg"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {isProcessingBg === img.id && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all bg-gray-50/50"
                  >
                    <Plus className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Thêm ảnh</span>
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleProductImageUpload} 
                  multiple 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Tên sản phẩm</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ví dụ: Kem chống nắng Skin1004"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                    <PenTool className="absolute right-4 top-3.5 w-4 h-4 text-gray-300" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Keyword / USP</label>
                  <textarea 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Mỏng nhẹ, không bết rít, chiết xuất rau má..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="pt-4 border-t border-gray-50 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                      <Layout className="w-3 h-3" /> Bố cục
                    </label>
                    <select 
                      value={layout}
                      onChange={(e) => setLayout(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                    >
                      {LAYOUT_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Xưng hô
                    </label>
                    <input 
                      type="text"
                      value={addressing}
                      onChange={(e) => setAddressing(e.target.value)}
                      placeholder="Ví dụ: Mình - Các bạn"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Giọng đọc
                    </label>
                    <select 
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                    >
                      {VOICE_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" /> Số cảnh
                    </label>
                    <input 
                      type="number"
                      min="3"
                      max="10"
                      value={sceneCount}
                      onChange={(e) => setSceneCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Đối tượng mục tiêu
                  </label>
                  <input 
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Visual Config */}
              <div className="pt-4 border-t border-gray-50 space-y-4">
                <h3 className="text-xs text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Cấu hình hình ảnh AI
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Phong cách</label>
                    <select 
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none"
                    >
                      <option value="Realistic">Realistic (Ảnh thật)</option>
                      <option value="3D Animation">3D Animation (Hoạt hình)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Hiển thị tay</label>
                    <select 
                      value={handVisibility}
                      onChange={(e) => setHandVisibility(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none"
                    >
                      <option value="with_hand">Có tay người</option>
                      <option value="product_only">Chỉ sản phẩm</option>
                    </select>
                  </div>
                </div>

                {/* Reference Images */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <Hand className="w-2.5 h-2.5" /> Mẫu tay
                    </label>
                    <div 
                      onClick={() => handInputRef.current?.click()}
                      className={`aspect-video rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${handRef ? 'border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      {handRef ? (
                        <img src={URL.createObjectURL(handRef)} alt="Hand Ref" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <input type="file" ref={handInputRef} onChange={(e) => setHandRef(e.target.files?.[0] || null)} className="hidden" accept="image/*" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> Background
                    </label>
                    <div 
                      onClick={() => bgInputRef.current?.click()}
                      className={`aspect-video rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${bgRef ? 'border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      {bgRef ? (
                        <img src={URL.createObjectURL(bgRef)} alt="BG Ref" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <input type="file" ref={bgInputRef} onChange={(e) => setBgRef(e.target.files?.[0] || null)} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Ghi chú bối cảnh</label>
                  <input 
                    type="text"
                    value={scriptNote}
                    onChange={(e) => setScriptNote(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || !productName || productImages.length === 0}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Tạo kịch bản AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!script ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[600px] rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-sm"
              >
                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6">
                  <FileText className="w-12 h-12" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-2">Chưa có kịch bản</h3>
                <p className="text-gray-500 max-w-md">
                  Hãy điền thông tin sản phẩm và tải ảnh lên ở cột bên trái, sau đó nhấn "Tạo kịch bản AI" để bắt đầu sáng tạo nội dung.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Kịch bản chuẩn TikTok
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Hình ảnh minh họa AI
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Script Section */}
                <ScriptSection 
                  script={script} 
                  onRegeneratePart={handleRegeneratePart}
                  onUpdatePart={handleUpdateScriptPart}
                  isRegenerating={isRegeneratingPart}
                />

                {/* Visual Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-indigo-500" />
                      Hình ảnh minh họa
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerateAllImages}
                        disabled={isGeneratingAllImages || !script}
                        className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingAllImages ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Tạo tất cả ảnh AI
                      </button>
                      <span className="text-xs text-gray-400 italic">Tạo hình ảnh minh họa cho từng phân cảnh</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(script).map(([key, scene]) => (
                      <ImageCard
                        key={key}
                        sceneKey={key}
                        sceneContent={scene.dialogue}
                        actionDescription={scene.action}
                        veoPrompt={scene.veoPrompt}
                        onUpdateAction={(val) => handleUpdateScriptPart(key, 'action', val)}
                        onUpdateVeoPrompt={(val) => handleUpdateScriptPart(key, 'veoPrompt', val)}
                        productName={productName}
                        productImages={productImages.map(img => img.file)}
                        handRef={handRef}
                        bgRef={bgRef}
                        imageStyle={imageStyle}
                        handVisibility={handVisibility}
                        scriptNote={scriptNote}
                        visualNote={visualNote}
                        onImageGenerated={(k, url) => setGeneratedImages(prev => ({ ...prev, [k]: url }))}
                        gender={gender}
                        voice={voice}
                      />
                    ))}
                  </div>
                </div>

                {/* Export/Next Steps */}
                <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                      <h3 className="text-xl">Hoàn tất kịch bản & Hình ảnh!</h3>
                    </div>
                    <p className="text-indigo-100 mb-6 max-w-2xl">
                      Bạn đã có đầy đủ kịch bản và hình ảnh minh họa. Bạn có thể tải hàng loạt về máy
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleDownloadAllImages}
                        disabled={Object.keys(generatedImages).length === 0}
                        className="px-6 py-3 bg-white text-indigo-900 rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Tải ảnh hàng loạt
                      </button>
                      <button 
                        onClick={handleDownloadAllPrompts}
                        disabled={!script}
                        className="px-6 py-3 bg-indigo-800 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 border border-indigo-700"
                      >
                        <FileText className="w-4 h-4" />
                        Tải prompt hàng loạt
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AffiliateModule;
