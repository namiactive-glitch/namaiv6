import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateSpeech, generateSpeechStream, decodeAudioData, audioBufferToWav, optimizeTTSPrompt, renderBufferAtSpeed } from '../services/geminiService';
import { Mic, Headphones, Volume2, Download, RefreshCw, AlertCircle, Play, Info, Video, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface Voice { 
  id: string; 
  name: string; 
  apiId: string; 
  description?: string; 
  gender: 'NU' | 'NAM';
  styleInstruction?: string;
}

const SPECIAL_VOICES: Voice[] = [
  { 
    id: 'vi_special_f_1', 
    name: 'Sư cô Diệu Tâm (Dẫn thiền)', 
    apiId: 'Zephyr', 
    description: 'Giọng nữ nhẹ nhàng, thanh thoát, phù hợp dẫn thiền và tâm sự.',
    gender: 'NU',
    styleInstruction: 'Đọc bằng giọng nhẹ nhàng, thanh thoát, chậm rãi, nhấn nhá sâu lắng như đang dẫn thiền:'
  },
  { 
    id: 'vi_special_f_2', 
    name: 'Phật tử Diệu Liên (Thuyết minh)', 
    apiId: 'Kore', 
    description: 'Giọng nữ truyền cảm, rõ ràng, phù hợp thuyết minh phim Phật giáo.',
    gender: 'NU',
    styleInstruction: 'Đọc bằng giọng truyền cảm, rõ ràng, thành kính, nhấn mạnh vào các từ ngữ thiêng liêng:'
  },
  { 
    id: 'vi_special_m_1', 
    name: 'Thiền sư Tâm An (Trầm ấm)', 
    apiId: 'Charon', 
    description: 'Giọng nam trầm, uy lực, phù hợp đọc kinh và giáo lý.',
    gender: 'NAM',
    styleInstruction: 'Đọc bằng giọng nam trầm, uy lực, trang nghiêm, nhấn nhá dứt khoát và uy nghi:'
  },
  { 
    id: 'vi_special_m_2', 
    name: 'Thầy Minh Tuệ (Giảng thuật)', 
    apiId: 'Puck', 
    description: 'Giọng nam đỉnh đạc, thuyết phục, phù hợp giảng pháp và tư vấn.',
    gender: 'NAM',
    styleInstruction: 'Đọc bằng giọng đỉnh đạc, thuyết phục, từ tốn, nhấn nhá vào các ý chính để tạo sự tin tưởng:'
  },
  { 
    id: 'vi_special_m_3', 
    name: 'Chuyên gia Phong thủy (Tư vấn)', 
    apiId: 'Fenrir', 
    description: 'Giọng nam năng động, quyết đoán, phù hợp tư vấn kiến trúc phong thủy.',
    gender: 'NAM',
    styleInstruction: 'Đọc bằng giọng năng động, quyết đoán, chuyên nghiệp, nhấn mạnh vào các giải pháp kỹ thuật:'
  }
];

const REGIONS = [
  { code: 'hn', name: 'Miền Bắc (Hà Nội)', accent: 'giọng Hà Nội chuẩn, thanh lịch, phát âm rõ ràng, nhấn nhá nhẹ nhàng và tinh tế' },
  { code: 'na', name: 'Miền Trung (Nghệ An)', accent: 'giọng Nghệ An đặc trưng, mộc mạc, chân phương, nhấn nhá mạnh mẽ vào các thanh điệu đặc thù của vùng đất Lam Hồng' },
  { code: 'hcm', name: 'Miền Nam (TP. HCM)', accent: 'giọng Sài Gòn (TP. HCM) ngọt ngào, năng động, phóng khoáng, nhấn nhá vui tươi và cởi mở' }
];

const generateFilmVoices = () => {
  const styles = [
    { id: 'trailer', name: 'Trailer Bom Tấn', apiId: 'Charon', gender: 'NAM' as const, desc: 'Kịch tính, hào hùng, nhấn mạnh cực độ, ngắt nghỉ đột ngột để tạo sự hồi hộp như trailer phim Hollywood' },
    { id: 'drama', name: 'Thuyết minh Phim bộ', apiId: 'Kore', gender: 'NU' as const, desc: 'Truyền cảm, ngọt ngào, nhấn nhá vào các cung bậc cảm xúc vui buồn của nhân vật' },
    { id: 'tiktok', name: 'Review Phim TikTok', apiId: 'Puck', gender: 'NAM' as const, desc: 'Trẻ trung, năng động, tốc độ nhanh, nhấn nhá hài hước và lôi cuốn' },
    { id: 'doc', name: 'Phim Tài liệu', apiId: 'Charon', gender: 'NAM' as const, desc: 'Trầm ấm, sâu sắc, uy tín, nhấn nhá chậm rãi để truyền tải thông tin lịch sử trang trọng' },
    { id: 'cartoon_f', name: 'Hoạt hình (Trong trẻo)', apiId: 'Kore', gender: 'NU' as const, desc: 'Trong trẻo, vui tươi, biểu cảm đa dạng, nhấn nhá tinh nghịch như nhân vật Disney' },
    { id: 'crime', name: 'Kịch tính & Hình sự', apiId: 'Fenrir', gender: 'NAM' as const, desc: 'Mạnh mẽ, dứt khoát, bí ẩn, nhấn mạnh vào các chi tiết quan trọng' },
    { id: 'sword', name: 'Kiếm Hiệp Cổ Trang', apiId: 'Charon', gender: 'NAM' as const, desc: 'Hào sảng, phong trần, đậm chất kiếm hiệp, nhấn mạnh mạnh mẽ ở các từ Hán Việt' },
    { id: 'audiobook', name: 'Kể chuyện Audio', apiId: 'Zephyr', gender: 'NU' as const, desc: 'Nhẹ nhàng, sâu lắng, truyền cảm, nhấn nhá chậm rãi như kể chuyện đêm khuya' },
    { id: 'horror', name: 'Phim Kinh Dị', apiId: 'Charon', gender: 'NAM' as const, desc: 'Thều thào, đáng sợ, bí ẩn, nhấn nhá rùng rợn và ngắt quãng' },
    { id: 'romance', name: 'Phim Lãng Mạn', apiId: 'Zephyr', gender: 'NU' as const, desc: 'Mơ mộng, dịu dàng, tràn đầy cảm xúc, nhấn nhá ngọt ngào' },
    { id: 'action', name: 'Phim Hành Động', apiId: 'Fenrir', gender: 'NAM' as const, desc: 'Dồn dập, kịch tính, đầy năng lượng, nhấn mạnh vào các động từ mạnh' },
    { id: 'cartoon_fun', name: 'Hoạt Hình (Tinh nghịch)', apiId: 'Puck', gender: 'NU' as const, desc: 'Trong trẻo, tinh nghịch, vui tươi, nhấn nhá hài hước và biến hóa linh hoạt' },
    { id: 'scifi', name: 'Khoa Học Viễn Tưởng', apiId: 'Fenrir', gender: 'NAM' as const, desc: 'Lạnh lùng, hơi máy móc, hiện đại, nhấn nhá dứt khoát như robot' },
    { id: 'comedy', name: 'Phim Hài Hước', apiId: 'Puck', gender: 'NU' as const, desc: 'Hóm hỉnh, vui nhộn, nhấn nhá cường điệu để tạo tiếng cười' },
    { id: 'cn_classic', name: 'TM Phim Cổ Trang', apiId: 'Charon', gender: 'NAM' as const, desc: 'Trang trọng, hào sảng, đậm chất phim cổ trang Trung Quốc, nhấn mạnh vào các danh xưng cổ' },
    { id: 'cn_love', name: 'TM Phim Ngôn Tình', apiId: 'Zephyr', gender: 'NU' as const, desc: 'Ngọt ngào, lãng mạn, sâu lắng, phù hợp các đoạn hội thoại tình cảm phim Trung Quốc' },
    { id: 'cn_wuxia', name: 'TM Phim Kiếm Hiệp', apiId: 'Puck', gender: 'NAM' as const, desc: 'Mạnh mẽ, khí thế, hào hùng, nhấn mạnh vào các chiêu thức và hành động kịch tính' },
    { id: 'cn_drama', name: 'TM Phim Tâm Lý', apiId: 'Kore', gender: 'NU' as const, desc: 'Truyền cảm, rõ ràng, thể hiện tốt các biến chuyển tâm lý nhân vật phim bộ Trung Quốc' },
    { id: 'cn_action', name: 'TM Phim Võ Thuật', apiId: 'Fenrir', gender: 'NAM' as const, desc: 'Dồn dập, kịch tính, đầy năng lượng, nhấn mạnh vào các pha hành động võ thuật' }
  ];

  const voices: Voice[] = [];
  REGIONS.forEach(reg => {
    styles.forEach(style => {
      voices.push({
        id: `film_${style.id}_${reg.code}`,
        name: `${style.name} (${reg.name})`,
        apiId: style.apiId,
        gender: style.gender,
        description: `Giọng ${style.gender === 'NAM' ? 'nam' : 'nữ'} ${reg.name}, phong cách ${style.name.toLowerCase()}.`,
        styleInstruction: `Hãy sử dụng ${reg.accent}. Đọc bằng giọng ${style.desc}:`
      });
    });
  });
  return voices;
};

const FILM_VOICES = generateFilmVoices();

const generateVietnameseVoices = () => {
  const styles = [
    { name: 'Tin tức', apiF: 'Kore', apiM: 'Charon', instruction: 'Đọc theo phong cách bản tin thời sự, rõ ràng, mạch lạc, nhấn mạnh vào các thông tin quan trọng' },
    { name: 'Kể chuyện', apiF: 'Zephyr', apiM: 'Puck', instruction: 'Đọc theo phong cách kể chuyện, truyền cảm, có nhịp điệu, nhấn nhá vào các tình tiết kịch tính' },
    { name: 'Review/Vlog', apiF: 'Kore', apiM: 'Fenrir', instruction: 'Đọc theo phong cách review sản phẩm, tự nhiên, sôi nổi, nhấn nhá vào các ưu điểm nổi bật' }
  ];

  const femaleNames = ['Thanh Lam', 'Hồng Nhung', 'Mỹ Linh', 'Minh Tuyết', 'Như Quỳnh', 'Cẩm Ly', 'Lệ Quyên', 'Đông Nhi', 'Bích Phương'];
  const maleNames = ['Quang Thọ', 'Trọng Tấn', 'Đăng Dương', 'Quang Dũng', 'Đan Trường', 'Lam Trường', 'Sơn Tùng', 'Soobin', 'Karik'];

  const voices: { female: Voice[], male: Voice[] } = { female: [], male: [] };

  REGIONS.forEach((reg, rIdx) => {
    styles.forEach((style, sIdx) => {
      const fName = femaleNames[(rIdx * styles.length + sIdx) % femaleNames.length];
      voices.female.push({
        id: `vi_f_${reg.code}_${sIdx}`,
        name: `${fName} (${reg.name} - ${style.name})`,
        apiId: style.apiF as any,
        gender: 'NU',
        description: `Giọng nữ ${reg.name}, ${style.instruction.toLowerCase()}.`,
        styleInstruction: `Hãy sử dụng ${reg.accent}. ${style.instruction}:`
      });

      const mName = maleNames[(rIdx * styles.length + sIdx) % maleNames.length];
      voices.male.push({
        id: `vi_m_${reg.code}_${sIdx}`,
        name: `${mName} (${reg.name} - ${style.name})`,
        apiId: style.apiM as any,
        gender: 'NAM',
        description: `Giọng nam ${reg.name}, ${style.instruction.toLowerCase()}.`,
        styleInstruction: `Hãy sử dụng ${reg.accent}. ${style.instruction}:`
      });
    });
  });
  return voices;
};

const VI_VOICES = generateVietnameseVoices();

const SCENARIOS = [
  { name: "Hà Nội Thanh Lịch", text: "Chào bạn, rất vui được gặp bạn trong một buổi sáng mùa thu Hà Nội thật dịu dàng và tinh khôi." },
  { name: "Nghệ An Chân Phương", text: "Chào các bạn, hôm nay mình sẽ kể cho các bạn nghe về vẻ đẹp mộc mạc của quê hương xứ Nghệ thân thương." },
  { name: "Sài Gòn Năng Động", text: "Hế lô cả nhà! Sài Gòn hôm nay nắng đẹp quá chừng luôn, mình cùng đi dạo một vòng thành phố nha!" },
  { name: "Trailer Bom Tấn", text: "Trong một thế giới bị thống trị bởi bóng tối, một người hùng sẽ đứng lên để thay đổi tất cả. Đón xem siêu phẩm hành động vào mùa hè này!" },
  { name: "Review TikTok", text: "Chào các bạn, hôm nay mình sẽ review một bộ phim cực kỳ hack não vừa mới ra mắt. Đảm bảo các bạn sẽ phải bất ngờ với cái kết!" },
  { name: "Phim Cổ Trang", text: "Tại hạ là một kẻ lãng du, phiêu bạt giang hồ đã lâu. Hôm nay tình cờ gặp được các vị ở đây, quả là một đại duyên phận." },
  { name: "Phim Ngôn Tình", text: "Dù cả thế giới này có quay lưng lại với anh, em vẫn sẽ luôn ở đây, bên cạnh anh, mãi mãi không bao giờ rời xa." },
  { name: "Dẫn Thiền", text: "Hãy hít vào thật sâu, cảm nhận luồng không khí trong lành đang đi vào cơ thể. Và thở ra thật chậm, buông bỏ mọi muộn phiền." },
];

interface TextToSpeechProps {
}

export const TextToSpeech: React.FC<TextToSpeechProps> = () => {
  const [text, setText] = useState(() => localStorage.getItem('tts_text') || "");
  const [voiceId, setVoiceId] = useState<string>(() => localStorage.getItem('tts_voiceId') || FILM_VOICES[0].id);
  const [speed, setSpeed] = useState(() => parseFloat(localStorage.getItem('tts_speed') || "1.0"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [smartMode, setSmartMode] = useState(() => localStorage.getItem('tts_smartMode') !== 'false');

  // Persistence Effect
  React.useEffect(() => {
    try {
      localStorage.setItem('tts_text', text);
      localStorage.setItem('tts_voiceId', voiceId);
      localStorage.setItem('tts_speed', speed.toString());
      localStorage.setItem('tts_smartMode', smartMode.toString());
    } catch (e) {
      console.warn("Error saving TTS settings to localStorage:", e);
    }
  }, [text, voiceId, speed, smartMode]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const selectedVoice = useMemo<Voice>(() => {
    const allVoices = [...SPECIAL_VOICES, ...FILM_VOICES, ...VI_VOICES.female, ...VI_VOICES.male];
    return allVoices.find(v => v.id === voiceId) || FILM_VOICES[0];
  }, [voiceId]);

  const handleSynthesize = useCallback(async () => {
    if (!text.trim()) { setError("Vui lòng nhập văn bản cần đọc."); return; }
    
    setError(null); 
    setLoading(true);
    setIsStreaming(true);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      
      const ctx = audioCtxRef.current;
      nextStartTimeRef.current = ctx.currentTime + 0.1;

      let finalInstruction = selectedVoice.styleInstruction || "";
      if (smartMode) {
        setIsOptimizing(true);
        finalInstruction = await optimizeTTSPrompt(
          text, 
          selectedVoice.name, 
          selectedVoice.description || "", 
          selectedVoice.styleInstruction || "",
          speed
        );
        setIsOptimizing(false);
      }

      const fullText = `${finalInstruction} ${text}`;

      const stream = await generateSpeechStream({ text: fullText, voiceId: selectedVoice.apiId });
      
      for await (const chunk of stream) {
        const base64 = chunk.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
        if (base64) {
          const audioBuffer = await decodeAudioData(base64, ctx);
          
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.playbackRate.value = speed;
          source.connect(ctx.destination);
          
          const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
          source.start(startTime);
          nextStartTimeRef.current = startTime + (audioBuffer.duration / speed);
        }
      }

      const fullBase64 = await generateSpeech({ text: fullText, voiceId: selectedVoice.apiId, speed });
      const fullBuffer = await decodeAudioData(fullBase64, ctx);
      const speedAdjustedBuffer = await renderBufferAtSpeed(fullBuffer, speed);
      const wavBlob = audioBufferToWav(speedAdjustedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || "Lỗi khi tạo giọng nói.";
      
      // Handle 429 Quota Exceeded error
      if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("resource_exhausted")) {
        errorMessage = "Bạn đã hết hạn mức sử dụng (Quota) hôm nay. Vui lòng thử lại sau hoặc kiểm tra gói dịch vụ của bạn.";
      }
      
      setError(errorMessage);
    } finally { 
      setLoading(false); 
      setIsStreaming(false);
    }
  }, [text, selectedVoice, speed, audioUrl, smartMode]);

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(err => console.warn("Error closing AudioContext:", err));
      }
    };
  }, [audioUrl]);
  
  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `voice_${selectedVoice.name.replace(/\s+/g, '_')}_${Date.now()}.wav`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-4 lg:h-full flex flex-col gap-6"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-display font-medium text-slate-800 flex items-center gap-2">
             <Mic className="text-orange-600" /> AI Voice Studio
           </h1>
           <p className="text-sm text-slate-500 font-body">Chuyển đổi văn bản thành giọng nói tự nhiên với Gemini 2.5 TTS</p>
        </div>
        <div className="flex gap-2 flex-wrap">
           {SCENARIOS.map(s => (
             <button key={s.name} onClick={() => setText(s.text)} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm">
               {s.name}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-4 space-y-4 lg:overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Video size={14} className="text-orange-500" /> GIỌNG LÀM PHIM & TRUYỀN THÔNG
            </h3>
            
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition-all font-display text-sm text-slate-700 appearance-none cursor-pointer"
                >
                  {FILM_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender === 'NU' ? 'Nữ' : 'Nam'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Play size={14} className="rotate-90 fill-current" />
                </div>
              </div>
              
              {selectedVoice && selectedVoice.id.startsWith('film_') && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-orange-50 border border-orange-100 rounded-2xl"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-orange-700 uppercase tracking-wider">Đang chọn: {selectedVoice.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedVoice.gender === 'NU' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedVoice.gender}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-body leading-relaxed">{selectedVoice.description}</p>
                </motion.div>
              )}
            </div>

            <h3 className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-4">
              <Headphones size={14} /> CHỌN GIỌNG ĐỌC THIỀN & CHUYÊN GIA
            </h3>
            
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition-all font-display text-sm text-slate-700 appearance-none cursor-pointer"
                >
                  {SPECIAL_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender === 'NU' ? 'Nữ' : 'Nam'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Play size={14} className="rotate-90 fill-current" />
                </div>
              </div>
              
              {selectedVoice && selectedVoice.id.startsWith('vi_special_') && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-orange-50 border border-orange-100 rounded-2xl"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-orange-700 uppercase tracking-wider">Đang chọn: {selectedVoice.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedVoice.gender === 'NU' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedVoice.gender}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-body leading-relaxed">{selectedVoice.description}</p>
                </motion.div>
              )}
            </div>

            <div className="pt-4">
               <h3 className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Volume2 size={14} /> GIỌNG NÓI PHỔ THÔNG
              </h3>
              <div className="relative">
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:border-orange-200 focus:border-orange-500 outline-none transition-all text-xs text-slate-700 appearance-none cursor-pointer"
                >
                  {[...VI_VOICES.female, ...VI_VOICES.male].map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Play size={10} className="rotate-90 fill-current" />
                </div>
              </div>

              {selectedVoice && (selectedVoice.id.startsWith('vi_f_') || selectedVoice.id.startsWith('vi_m_')) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl"
                >
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">{selectedVoice.description}</p>
                </motion.div>
              )}
            </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
           <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-1">
                      <div className="flex flex-col gap-1 flex-1 max-w-[180px]">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-400 uppercase">Tốc độ: {speed}x</label>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setSpeed(prev => Math.max(0.5, parseFloat((prev - 0.1).toFixed(1))))}
                              className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button 
                              onClick={() => setSpeed(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(1))))}
                              className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                        <input 
                          type="range" min="0.5" max="2" step="0.1" 
                          value={speed} onChange={e => setSpeed(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>
                      
                      <button 
                        onClick={() => setSmartMode(!smartMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                          smartMode 
                          ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <Sparkles size={14} className={smartMode ? 'text-orange-500' : ''} />
                        <span className="text-[10px] uppercase tracking-tight">AI Smart Mode</span>
                      </button>

                      <div className="bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200 flex items-center gap-2">
                        <Info size={14} className="text-orange-600" />
                        <span className="text-[10px] text-orange-700">Mẹo: Thêm dấu ... để nghỉ lâu hơn</span>
                      </div>
                  </div>

                  <button
                    onClick={() => handleSynthesize()}
                    disabled={loading || !text.trim()}
                    className={`px-8 py-3 rounded-2xl font-display text-white shadow-lg transition-all flex items-center gap-2 ${
                      loading || !text.trim() ? 'bg-slate-300' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] active:scale-95 shadow-orange-200'
                    }`}
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Zap size={18} className="animate-pulse text-yellow-300" />
                    )}
                    {isOptimizing ? 'AI ĐANG TỐI ƯU...' : loading ? 'ĐANG TẠO...' : 'TẠO NGAY'}
                  </button>
              </div>

              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <span className="text-sm text-slate-600 font-display">Nội dung văn bản</span>
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setText("")}
                      className="text-[10px] text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                    >
                      Xóa văn bản
                    </button>
                    <span className="text-xs text-slate-400 font-mono">{text.length} ký tự</span>
                 </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập nội dung bạn muốn AI đọc tại đây... (Nên sử dụng dấu phẩy, dấu chấm để ngắt nghỉ tự nhiên)"
                className="flex-1 w-full p-6 text-lg font-body outline-none resize-none bg-transparent placeholder:text-slate-300 leading-relaxed text-slate-700"
              />
           </div>

           <div className={`p-4 rounded-3xl border-2 border-dashed transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${audioUrl ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-full ${audioUrl ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Volume2 size={24} />
                 </div>
                 <div>
                    <h4 className={`text-sm font-display ${audioUrl ? 'text-green-700' : 'text-slate-500'}`}>
                      {audioUrl ? 'Sẵn sàng nghe thử' : 'Chưa có tệp âm thanh'}
                    </h4>
                    <p className="text-xs text-slate-400 font-body">Kết quả sẽ được xuất dưới dạng file WAV chất lượng cao</p>
                 </div>
              </div>

              {audioUrl ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 w-full md:w-auto"
                >
                   <audio ref={audioRef} src={audioUrl} className="h-10 w-full md:w-64" controls />
                   <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDownload} 
                    className="p-3 bg-white text-green-600 border border-green-200 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                   >
                      <Download size={20} />
                   </motion.button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      key="error-msg"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 text-red-600 text-sm bg-white px-4 py-2 rounded-xl border border-red-100 shadow-sm"
                    >
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
           </div>
        </div>
      </div>

      </motion.div>
  );
};
