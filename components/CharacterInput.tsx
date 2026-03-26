import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Loader2, Trash2, Wand2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Character, ScriptTone } from '../types';
import { generateCharacterImage } from '../services/geminiService';

interface CharacterInputProps {
  label: string;
  tagLabel: string;
  tagColorClass: string;
  borderColorClass: string;
  ringColorClass: string;
  character: Character;
  styleId: string;
  scriptTone?: ScriptTone;
  onChange: (char: Character) => void;
  optional?: boolean;
}

const CharacterInput: React.FC<CharacterInputProps> = ({
  label,
  tagLabel,
  tagColorClass,
  borderColorClass,
  ringColorClass,
  character,
  styleId,
  scriptTone,
  onChange,
  optional = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localStyleId, setLocalStyleId] = useState(styleId);

  React.useEffect(() => {
    setLocalStyleId(styleId);
  }, [styleId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...character, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!character.description && !character.name) {
      toast.warning("Vui lòng nhập tên hoặc mô tả để AI có thể tạo hình ảnh.");
      return;
    }

    setIsGenerating(true);
    try {
      const base64Image = await generateCharacterImage(character, localStyleId, undefined, scriptTone);
      onChange({ ...character, image: base64Image });
    } catch (error) {
      toast.error("Lỗi khi tạo ảnh nhân vật. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ ...character, image: null });
  };

  const handleDownloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (character.image) {
      const link = document.createElement('a');
      link.href = character.image;
      link.download = `${character.name ? character.name.replace(/\s+/g, '-').toLowerCase() : 'character'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-lg ${tagColorClass.replace('bg-', 'text-').replace('-50', '-600')}`}>{label}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tagColorClass} ${tagColorClass.replace('bg-', 'text-').replace('-50', '-600')}`}>
          {tagLabel}
        </span>
      </div>

      {/* Image Area */}
      <div className="mb-4">
        <div
          onClick={() => !character.image && fileInputRef.current?.click()}
          className={`aspect-square w-full sm:w-2/3 mx-auto rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all group ${
            character.image
              ? 'border-transparent shadow-md'
              : `cursor-pointer border-slate-300 hover:${borderColorClass.replace('focus:ring-', 'border-')} hover:${tagColorClass}`
          }`}
        >
          {character.image ? (
            <>
              <img src={character.image} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <button 
                  onClick={handleDownloadImage}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Tải ảnh"
                 >
                   <Download size={20} />
                 </button>
                 <button 
                  onClick={handleClearImage}
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                  title="Xóa ảnh"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>
            </>
          ) : (
            <>
              {isGenerating ? (
                <div className="flex flex-col items-center text-orange-600 animate-pulse">
                  <Loader2 size={32} className="animate-spin mb-2" />
                  <p className="text-xs font-medium">Đang vẽ nhân vật...</p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <Upload className="text-slate-400 mx-auto mb-2" size={24} />
                  <p className="text-sm text-slate-500 font-medium">Tải ảnh lên</p>
                  <p className="text-xs text-slate-400 mt-1">hoặc dùng công cụ AI bên dưới</p>
                </div>
              )}
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Tên nhân vật {!optional && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            placeholder={optional ? "Ví dụ: Robot (để trống nếu không có)" : "Ví dụ: Bác sĩ Tim"}
            className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${ringColorClass}`}
            value={character.name}
            onChange={(e) => onChange({ ...character, name: e.target.value })}
          />
        </div>
        
        {/* Voice & Demographics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
           <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Giới tính</label>
              <select 
                className={`w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ringColorClass}`}
                value={character.voiceGender || 'Nam'}
                onChange={(e) => onChange({...character, voiceGender: e.target.value})}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
           </div>
           <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Độ tuổi</label>
              <input 
                type="text"
                placeholder="VD: 25, Trẻ em..."
                className={`w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ringColorClass}`}
                value={character.voiceAge || ''}
                onChange={(e) => onChange({...character, voiceAge: e.target.value})}
              />
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vùng miền</label>
              <select 
                className={`w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ringColorClass}`}
                value={character.voiceRegion || 'Miền Bắc'}
                onChange={(e) => onChange({...character, voiceRegion: e.target.value})}
              >
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
                <option value="Hải Ngoại">Hải Ngoại</option>
                <option value="Không rõ">Không rõ</option>
              </select>
           </div>
           <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kiểu giọng (Voice Type)</label>
              <select 
                className={`w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-orange-700 bg-orange-50 focus:outline-none focus:ring-2 ${ringColorClass}`}
                value={character.voiceType || 'Kể chuyện'}
                onChange={(e) => onChange({...character, voiceType: e.target.value})}
              >
                <option value="Quảng cáo">Quảng cáo (Sales)</option>
                <option value="Review / Đánh giá">Review / Đánh giá</option>
                <option value="Kể chuyện">Kể chuyện (Narrative)</option>
                <option value="Chính luận / Tin tức">Chính luận / Tin tức</option>
                <option value="Tâm sự / Chia sẻ">Tâm sự / Chia sẻ</option>
                <option value="Truyền cảm hứng">Truyền cảm hứng</option>
                <option value="Cãi vã">Cãi vã (Aggressive)</option>
                <option value="Tranh luận">Tranh luận (Debate)</option>
                <option value="Bức xúc / Phẫn nộ">Bức xúc / Phẫn nộ</option>
                <option value="Hài hước / Chế giễu">Hài hước / Chế giễu</option>
                <option value="Giảng dạy / Tutorial">Giảng dạy / Tutorial</option>
              </select>
           </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Vai trò / Đặc điểm</label>
          <input
            type="text"
            placeholder="Nghiêm túc, lo lắng..."
            className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 ${ringColorClass}`}
            value={character.role}
            onChange={(e) => onChange({ ...character, role: e.target.value })}
          />
        </div>
        
        {/* Visual Description & Generator */}
        <div>
          <div className="flex justify-between items-center mb-1">
             <label className="block text-xs font-medium text-slate-500">
               Mô tả ngoại hình (cho AI tạo ảnh)
             </label>
             <div className="flex items-center gap-2">
                <select 
                  value={localStyleId}
                  onChange={(e) => setLocalStyleId(e.target.value)}
                  className="text-[10px] text-slate-600 bg-slate-100 border-none rounded px-1 py-0.5 outline-none"
                >
                  <option value="realistic">Chân thật</option>
                  <option value="3d_animation">3D Animation</option>
                  <option value="mixed">Kết hợp</option>
                </select>
                <a 
                  href="https://labs.google/fx/tools/whisk/project" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-orange-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={10} /> Tạo ảnh người thật tại đây
                </a>
             </div>
          </div>
          <div className="relative">
            <textarea
              placeholder="Mô tả chi tiết: Mắt kính tròn, áo blouse trắng, tóc xám..."
              className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 text-sm min-h-[80px] ${ringColorClass}`}
              value={character.description || ''}
              onChange={(e) => onChange({ ...character, description: e.target.value })}
            />
            <button
              onClick={() => handleGenerateImage()}
              disabled={isGenerating || (!character.name && !character.description)}
              className={`absolute bottom-2 right-2 p-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all ${
                (!character.name && !character.description) 
                 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                 : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-md hover:scale-105'
              }`}
              title="Tự động tạo ảnh nhân vật"
            >
               {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14}/>}
               AI Vẽ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterInput;
