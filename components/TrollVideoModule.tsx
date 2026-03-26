import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, LayoutGrid, MessageSquare, 
  Camera, Copy, CheckCircle2, Loader2, 
  Image as ImageIcon, Download, RefreshCw, AlertCircle,
  Video, User, Wand2, Ghost, Heart, Utensils, Home, Baby, Briefcase, GraduationCap, Users
} from 'lucide-react';
import { GoogleGenAI, Type as SchemaType, ThinkingLevel } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { withRetry } from '../services/geminiService';

interface Voice { 
  id: string; 
  name: string; 
  apiId: string; 
  description?: string; 
  gender: 'NU' | 'NAM';
  styleInstruction?: string;
}

const SPECIAL_VOICES: Voice[] = [
  { id: 'vi_special_f_1', name: 'Sư cô Diệu Tâm (Dẫn thiền)', apiId: 'Zephyr', description: 'Giọng nữ nhẹ nhàng, thanh thoát, phù hợp dẫn thiền và tâm sự.', gender: 'NU' },
  { id: 'vi_special_f_2', name: 'Phật tử Diệu Liên (Thuyết minh)', apiId: 'Kore', description: 'Giọng nữ truyền cảm, rõ ràng, phù hợp thuyết minh phim Phật giáo.', gender: 'NU' },
  { id: 'vi_special_m_1', name: 'Thiền sư Tâm An (Trầm ấm)', apiId: 'Charon', description: 'Giọng nam trầm, uy lực, phù hợp đọc kinh và giáo lý.', gender: 'NAM' },
  { id: 'vi_special_m_2', name: 'Thầy Minh Tuệ (Giảng thuật)', apiId: 'Puck', description: 'Giọng nam đỉnh đạc, thuyết phục, phù hợp giảng pháp và tư vấn.', gender: 'NAM' },
  { id: 'vi_special_m_3', name: 'Chuyên gia Phong thủy (Tư vấn)', apiId: 'Fenrir', description: 'Giọng nam năng động, quyết đoán, phù hợp tư vấn kiến trúc phong thủy.', gender: 'NAM' }
];

const REGIONS = [
  { code: 'hn', name: 'Miền Bắc (Hà Nội)', accent: 'giọng Hà Nội chuẩn' },
  { code: 'na', name: 'Miền Trung (Nghệ An)', accent: 'giọng Nghệ An đặc trưng' },
  { code: 'hcm', name: 'Miền Nam (TP. HCM)', accent: 'giọng Sài Gòn ngọt ngào' }
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
const ALL_VOICES = [...SPECIAL_VOICES, ...FILM_VOICES, ...VI_VOICES.female, ...VI_VOICES.male];

const TROLL_THEMES = [
  { id: 'valentine', label: 'Lễ tình nhân', icon: <Heart className="w-4 h-4" />, emoji: '💝' },
  { id: 'halloween', label: 'Halloween', icon: <Ghost className="w-4 h-4" />, emoji: '🎃' },
  { id: 'cooking', label: 'Nấu ăn', icon: <Utensils className="w-4 h-4" />, emoji: '🍳' },
  { id: 'lifestyle', label: 'Đời sống', icon: <Home className="w-4 h-4" />, emoji: '🏠' },
  { id: 'children', label: 'Con cái', icon: <Baby className="w-4 h-4" />, emoji: '👶' },
  { id: 'work', label: 'Công sở', icon: <Briefcase className="w-4 h-4" />, emoji: '💼' },
  { id: 'school', label: 'Trường học', icon: <GraduationCap className="w-4 h-4" />, emoji: '🏫' },
  { id: 'friendship', label: 'Bạn bè', icon: <Users className="w-4 h-4" />, emoji: '🤝' },
];

const SCENE_DURATION = 8;

const TrollVideoModule = () => {
  const [trollTopic, setTrollTopic] = useState(() => localStorage.getItem('troll_topic') || '');
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('troll_theme') || 'lifestyle');
  const [gender, setGender] = useState<'male' | 'female'>(() => (localStorage.getItem('troll_gender') as any) || 'female');
  const [videoStyle, setVideoStyle] = useState(() => localStorage.getItem('troll_videoStyle') || 'comedy');
  const [voiceId, setVoiceId] = useState(() => localStorage.getItem('troll_voiceId') || 'film_tiktok_hn');
  const [totalDuration, setTotalDuration] = useState(() => parseInt(localStorage.getItem('troll_totalDuration') || '32'));
  const [isManualDuration, setIsManualDuration] = useState(() => localStorage.getItem('troll_isManualDuration') === 'true');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(() => (localStorage.getItem('troll_aspectRatio') as any) || '9:16');
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [results, setResults] = useState<any[] | null>(() => {
    try {
      const saved = localStorage.getItem('troll_results');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('troll_topic', trollTopic);
      localStorage.setItem('troll_theme', selectedTheme);
      localStorage.setItem('troll_gender', gender);
      localStorage.setItem('troll_videoStyle', videoStyle);
      localStorage.setItem('troll_voiceId', voiceId);
      localStorage.setItem('troll_totalDuration', totalDuration.toString());
      localStorage.setItem('troll_isManualDuration', isManualDuration.toString());
      localStorage.setItem('troll_aspectRatio', aspectRatio);
      localStorage.setItem('troll_results', JSON.stringify(results));
    } catch (e) {
      console.warn("Error saving TrollVideoModule state to localStorage:", e);
    }
  }, [trollTopic, selectedTheme, gender, videoStyle, voiceId, totalDuration, isManualDuration, aspectRatio, results]);

  const suggestTrollIdea = async () => {
    setSuggesting(true);
    try {
      const themeLabel = TROLL_THEMES.find(t => t.id === selectedTheme)?.label || 'Đời sống';
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: `Gợi ý 1 ý tưởng video TROLL (hài hước, trêu chọc nhẹ nhàng) thuộc chủ đề "${themeLabel}". 
          Yêu cầu:
          1. Tình huống bất ngờ, gây cười.
          2. Phù hợp với văn hóa Việt Nam.
          3. Chỉ trả về nội dung ý tưởng ngắn gọn (dưới 50 từ).` }] }],
          config: {
            temperature: 1,
            seed: Math.floor(Math.random() * 1000000),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });
        return response.text;
      });

      if (result) {
        setTrollTopic(result.trim());
      }
    } catch (err) {
      console.error("Suggest Error:", err);
    } finally {
      setSuggesting(false);
    }
  };

  const generateScript = async () => {
    const topic = trollTopic.trim();
    if (!topic) {
      setError("Vui lòng nhập hoặc gợi ý ý tưởng troll!");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const themeLabel = TROLL_THEMES.find(t => t.id === selectedTheme)?.label || 'Đời sống';
    const selectedVoice = ALL_VOICES.find(v => v.id === voiceId) || ALL_VOICES[0];

    const systemPrompt = `Bạn là một ĐẠO DIỄN PHIM HÀI chuyên nghiệp, chuyên gia sáng tạo nội dung video TROLL, PRANK hài hước trên TikTok/Reels.
Mục tiêu: Tạo ra một kịch bản video troll CỰC KỲ HÀI HƯỚC, BẤT NGỜ và MANG TÍNH GIẢI TRÍ CAO.

QUY TẮC BIÊN KỊCH:
1. TÍNH BẤT NGỜ: Video troll phải có cú twist (bất ngờ) ở cuối hoặc các tình huống dở khóc dở cười.
2. NHỊP ĐIỆU NHANH: Các cảnh quay phải dồn dập, tạo tiếng cười liên tục.
3. BIỂU CẢM NHÂN VẬT: Mô tả kỹ biểu cảm "đứng hình", "ngơ ngác", "cay cú" hoặc "cười đắc thắng" của nhân vật.
4. ĐỒNG BỘ LỜI THOẠI: Lời thoại phải tếu táo, sử dụng ngôn ngữ mạng (slang) phù hợp nhưng vẫn giữ được sự duyên dáng.
5. KHUNG HÌNH: Video quay ở khung hình ${aspectRatio}.

Nhiệm vụ: Tạo kịch bản video troll ${totalDuration} giây.
Chủ đề: ${themeLabel}.
Ý tưởng gốc: ${topic}.
Nhân vật chính: Một người Việt Nam (${gender === 'male' ? 'Nam' : 'Nữ'}), tính cách lầy lội, hài hước.
Phong cách video: ${videoStyle.toUpperCase()}.
Chất giọng: ${selectedVoice.name}.

Yêu cầu Output: Trả về JSON chứa danh sách các cảnh. Mỗi cảnh gồm: 
- title: Tên phân đoạn
- time: Khoảng thời gian
- description: Mô tả chi tiết hành động troll và biểu cảm (tiếng Việt).
- dialogue: Lời thoại hài hước (tiếng Việt).
- veoPrompt: Prompt chi tiết bằng TIẾNG ANH cho VEO3 (bao gồm cinematic keywords, funny expressions, lighting, và lời thoại).
LƯU Ý: Trong veoPrompt, bắt buộc bao gồm lời thoại ở cuối theo định dạng: "Dialogue: [nội dung lời thoại]".`;

    try {
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: `Tạo kịch bản troll cho ý tưởng: ${topic}` }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                scenes: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      title: { type: SchemaType.STRING },
                      time: { type: SchemaType.STRING },
                      description: { type: SchemaType.STRING },
                      dialogue: { type: SchemaType.STRING },
                      veoPrompt: { type: SchemaType.STRING }
                    },
                    required: ["title", "time", "description", "dialogue", "veoPrompt"]
                  }
                }
              },
              required: ["scenes"]
            }
          }
        });
        return response.text;
      });

      if (result) {
        const parsedData = JSON.parse(result);
        setResults(parsedData.scenes || []);
      }
    } catch (err) {
      console.error("Generate Error:", err);
      setError("Có lỗi xảy ra khi tạo kịch bản troll.");
    } finally {
      setLoading(false);
    }
  };

  const generateImageForScene = async (index: number) => {
    if (!results) return;
    const newResults = [...results];
    newResults[index] = { ...newResults[index], isGeneratingImage: true };
    setResults(newResults);

    try {
      const result = await withRetry(async (ai) => {
        const prompt = `High quality, funny atmosphere, cinematic lighting, 8k resolution, ${aspectRatio === '9:16' ? 'vertical portrait composition' : 'wide landscape composition'}: ${newResults[index].veoPrompt}. NO TEXT, NO WATERMARKS.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ parts: [{ text: prompt }] }],
          config: { imageConfig: { aspectRatio: aspectRatio } },
        });

        let base64Image = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
        return base64Image ? `data:image/png;base64,${base64Image}` : null;
      });

      if (result) {
        newResults[index] = { 
          ...newResults[index], 
          imageUrl: result,
          isGeneratingImage: false 
        };
        setResults(newResults);
      }
    } catch (err) {
      console.error("Image Error:", err);
      newResults[index] = { ...newResults[index], isGeneratingImage: false };
      setResults(newResults);
    }
  };

  const generateAllImages = async () => {
    if (!results) return;
    setIsGeneratingAll(true);
    setError(null);

    try {
      // Parallelize image generation for maximum speed
      const generatePromises = results.map(async (scene, index) => {
        if (scene.imageUrl) return;

        setResults(prev => {
          if (!prev) return null;
          const next = [...prev];
          next[index] = { ...next[index], isGeneratingImage: true };
          return next;
        });

        try {
          const result = await withRetry(async (ai) => {
            const prompt = `High quality, funny atmosphere, cinematic lighting, 8k resolution, ${aspectRatio === '9:16' ? 'vertical portrait composition' : 'wide landscape composition'}: ${scene.veoPrompt}. NO TEXT, NO WATERMARKS.`;
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: [{ parts: [{ text: prompt }] }],
              config: { imageConfig: { aspectRatio: aspectRatio } },
            });

            let base64Image = "";
            for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
              }
            }
            return base64Image ? `data:image/png;base64,${base64Image}` : null;
          });

          if (result) {
            setResults(prev => {
              if (!prev) return null;
              const next = [...prev];
              next[index] = { ...next[index], imageUrl: result, isGeneratingImage: false };
              return next;
            });
          } else {
            setResults(prev => {
              if (!prev) return null;
              const next = [...prev];
              next[index] = { ...next[index], isGeneratingImage: false };
              return next;
            });
          }
        } catch (err) {
          console.error(`Image Error for scene ${index}:`, err);
          setResults(prev => {
            if (!prev) return null;
            const next = [...prev];
            next[index] = { ...next[index], isGeneratingImage: false };
            return next;
          });
        }
      });

      await Promise.all(generatePromises);
    } catch (err) {
      console.error("Generate All Images Error:", err);
      setError("Có lỗi xảy ra khi tạo hàng loạt ảnh.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (!results || !results.some(r => r.imageUrl)) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("troll_images");
      
      results.forEach((scene, idx) => {
        if (scene.imageUrl) {
          const base64Data = scene.imageUrl.split(',')[1];
          folder?.file(`scene_${idx + 1}.png`, base64Data, { base64: true });
        }
      });
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `troll_images_${Date.now()}.zip`);
    } catch (err) {
      console.error("Download Error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text: string, index: number, type: 'prompt' | 'dialogue') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index + (type === 'dialogue' ? 100 : 0));
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-xl">
                <Ghost className="text-purple-600 w-5 h-5" />
              </div>
              <h2 className="text-xl font-medium text-slate-800">Tạo Video Troll</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Chủ đề Troll</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {TROLL_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${selectedTheme === t.id ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500' : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300'}`}
                    >
                      <span className="text-lg mb-1">{t.emoji}</span>
                      <span className="text-[9px] font-medium text-center leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tình huống hài hước</label>
                  <button 
                    onClick={suggestTrollIdea}
                    disabled={suggesting}
                    className="text-[10px] font-medium text-purple-600 flex items-center gap-1 hover:text-purple-700 transition-colors"
                  >
                    <Sparkles className={`w-3 h-3 ${suggesting ? 'animate-spin' : ''}`} />
                    Gợi ý ý tưởng
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Chăm con', 'Nấu ăn', 'Công sở', 'Trường học', 'Người yêu', 'Bạn bè', 'Vợ chồng', 'Mua sắm', 'Chơi game'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => setTrollTopic(theme)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all border ${trollTopic === theme ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>

                <textarea 
                  placeholder="Nhập tình huống hài hước của bạn hoặc nhấn chọn chủ đề..."
                  className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none text-sm"
                  value={trollTopic}
                  onChange={(e) => setTrollTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Nhân vật</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setGender('male')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-all ${gender === 'male' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Nam
                    </button>
                    <button 
                      onClick={() => setGender('female')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-all ${gender === 'female' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Nữ
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Khung hình</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setAspectRatio('9:16')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${aspectRatio === '9:16' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      <div className="w-2 h-3 border-2 border-current rounded-[1px]" />
                      9:16
                    </button>
                    <button 
                      onClick={() => setAspectRatio('16:9')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${aspectRatio === '16:9' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      <div className="w-3 h-2 border-2 border-current rounded-[1px]" />
                      16:9
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Phong cách</label>
                  <select 
                    value={videoStyle}
                    onChange={(e) => setVideoStyle(e.target.value)}
                    className="w-full p-2 bg-slate-100 border-none rounded-xl text-[10px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="comedy">Hài hước (Comedy)</option>
                    <option value="prank">Chơi khăm (Prank)</option>
                    <option value="reaction">Phản ứng (Reaction)</option>
                    <option value="storytelling">Kể chuyện (Story)</option>
                    <option value="cinematic">Điện ảnh (Cinematic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">Thời lượng (giây)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[15, 32, 64].map(d => (
                      <button 
                        key={d}
                        onClick={() => {
                          setTotalDuration(d);
                          setIsManualDuration(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${totalDuration === d && !isManualDuration ? 'bg-purple-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                      >
                        {d}s
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsManualDuration(true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${isManualDuration ? 'bg-purple-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
                    >
                      Tùy chỉnh
                    </button>
                  </div>
                  {isManualDuration && (
                    <input 
                      type="number"
                      placeholder="Nhập số giây..."
                      className="w-full p-2 bg-white border border-purple-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                      value={totalDuration}
                      onChange={(e) => setTotalDuration(parseInt(e.target.value) || 0)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest block">Giọng đọc AI</label>
                  <select 
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[10px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <optgroup label="Giọng Đặc Biệt">
                      {SPECIAL_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </optgroup>
                    <optgroup label="Giọng Phim & Truyền Thông">
                      {FILM_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </optgroup>
                    <optgroup label="Giọng Phổ Thông">
                      {[...VI_VOICES.female, ...VI_VOICES.male].map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-[10px] border border-red-100">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button 
                onClick={generateScript}
                disabled={loading}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-medium text-white transition-all shadow-lg ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-100 active:scale-95'}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                {loading ? 'Đang tạo kịch bản troll...' : 'TẠO KỊCH BẢN TROLL'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400">
              <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-center font-medium text-sm">Kịch bản troll sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Dòng thời gian ({totalDuration}s)
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={generateAllImages}
                    disabled={isGeneratingAll || !results}
                    className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-medium hover:bg-purple-100 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Tạo tất cả ảnh AI
                  </button>
                  <button
                    onClick={handleDownloadAllImages}
                    disabled={isDownloading || !results || !results.some(r => r.imageUrl)}
                    className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-medium hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Tải ảnh hàng loạt
                  </button>
                </div>
              </div>

              <div className="relative border-l-2 border-purple-100 ml-6 pl-8 space-y-8">
                {results.map((scene, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-purple-600 shadow-sm z-10 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-purple-600">{idx + 1}</span>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-purple-300 transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-7 space-y-4">
                          <div>
                            <span className="text-[10px] font-medium text-purple-500 uppercase tracking-tighter block mb-1">
                              Cảnh {idx + 1} • {scene.time}
                            </span>
                            <h4 className="text-lg font-medium text-slate-800">{scene.title}</h4>
                          </div>
                          <p className="text-sm text-slate-600 italic border-l-4 border-slate-100 pl-4 py-1">
                            {scene.description}
                          </p>
                          <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Lời thoại
                              </span>
                              <button 
                                onClick={() => copyToClipboard(scene.dialogue, idx, 'dialogue')}
                                className="text-[10px] text-purple-600 font-medium hover:underline"
                              >
                                {copiedIndex === idx + 100 ? 'Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                            <p className="text-sm text-slate-700 font-medium">{scene.dialogue}</p>
                          </div>
                        </div>

                        <div className="md:col-span-5 space-y-4">
                          <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group/img">
                            {scene.imageUrl ? (
                              <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                {scene.isGeneratingImage ? (
                                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                ) : (
                                  <button 
                                    onClick={() => generateImageForScene(idx)}
                                    className="text-[10px] font-medium text-purple-600 hover:underline flex items-center gap-2"
                                  >
                                    <ImageIcon className="w-4 h-4" /> Vẽ ảnh minh họa
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">VEO3 Prompt</span>
                              <button 
                                onClick={() => copyToClipboard(scene.veoPrompt, idx, 'prompt')}
                                className="text-[10px] text-purple-600 font-medium hover:underline"
                              >
                                {copiedIndex === idx ? 'Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-3 font-mono text-[9px] text-slate-400 leading-relaxed max-h-[80px] overflow-y-auto custom-scrollbar">
                              {scene.veoPrompt}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrollVideoModule;
