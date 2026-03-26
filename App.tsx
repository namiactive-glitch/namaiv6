import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clapperboard, Sparkles, User, Type, Palette, Check, FileText, MessageCircle, Clock, Mic, Users, RotateCcw, MessageSquare, ArrowLeft, MapPin, Upload, Wand2, Loader2, PlusCircle, MinusCircle, ScanEye, Shirt, LogOut, Key, X, ExternalLink, Eye, EyeOff, RefreshCw, BookOpen, Tag, Video, Image as ImageIcon, Layout, Zap } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import CharacterInput from './components/CharacterInput';
import ResultDisplay from './components/ResultDisplay';
import { TextToSpeech } from './components/TextToSpeech';
import { VisionScanner } from './components/VisionScanner';
import { VirtualTryOn } from './components/VirtualTryOn';
import UserGuide from './components/UserGuide';
import AffiliateVeo3Module from './components/AffiliateVeo3Module';
import Login from './components/Login';
import ApiKeyManager from './components/ApiKeyManager';
import { Character, GeneratedData, Theme, StyleOption, ScriptTone } from './types';
import { generateScriptAndPrompts, suggestTopic, suggestSituations } from './services/geminiService';

const themes: Theme[] = [
  { id: 'family_life', label: 'Gia đình', icon: '🏠' },
  { id: 'parenting', label: 'Nuôi dạy con', icon: '👶' },
  { id: 'spouses', label: 'Vợ - chồng', icon: '👩‍❤️‍👨' },
  { id: 'health_tips', label: 'Sức khỏe', icon: '❤️' },
  { id: 'body_parts', label: 'Bộ phận', icon: '🧠' },
  { id: 'vegetables', label: 'Rau củ', icon: '🥦' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'custom', label: 'Tùy chỉnh', icon: '✨' },
];

const styles: StyleOption[] = [
  { id: 'realistic', label: 'Chân thật (Cinematic)', desc: 'Ánh sáng tự nhiên, da người thật, quay phim điện ảnh', color: 'from-orange-400 to-amber-600' },
  { id: '3d_animation', label: 'Hoạt hình 3D', desc: 'Phong cách Pixar/Disney, dễ thương, màu sắc rực rỡ', color: 'from-amber-400 to-orange-500' },
  { id: 'mixed', label: 'Kết hợp (Mixed)', desc: 'Tùy chỉnh riêng cho từng nhân vật', color: 'from-orange-500 to-red-500' },
];

const tones: ScriptTone[] = [
  { id: 'casual', label: 'Đời thường', desc: 'Gần gũi, tự nhiên', instruction: 'Sử dụng ngôn ngữ hàng ngày, xưng hô gần gũi (cậu/tớ, anh/em), câu từ ngắn gọn.' },
  { id: 'funny', label: 'Hài hước / Tếu táo', desc: 'Vui nhộn, gây cười', instruction: 'Sử dụng từ ngữ hài hước, chơi chữ, xưng hô tếu táo, tình huống gây cười.' },
  { id: 'polite', label: 'Lịch sự / Giáo dục', desc: 'Trang trọng, tôn trọng', instruction: 'Ngôn ngữ chuẩn mực, lịch sự, xưng hô tôn trọng, phù hợp nội dung giáo dục.' },
  { id: 'drama', label: 'Kịch tính / Cảm xúc', desc: 'Gay cấn, sâu sắc', instruction: 'Ngôn ngữ giàu cảm xúc, câu từ mạnh mẽ, xưng hô thể hiện rõ mối quan hệ sâu sắc.' },
  { id: 'angry', label: 'Tức giận / Phẫn nộ', desc: 'Bức xúc, gay gắt', instruction: 'Ngôn ngữ thể hiện sự tức giận, bức xúc cao độ. Câu thoại ngắn, dồn dập.' },
  { id: 'inspiring', label: 'Lạc quan / Truyền cảm hứng', desc: 'Tích cực, đầy hy vọng', instruction: 'Sử dụng từ ngữ mạnh mẽ, khích lệ, nhịp điệu hào hứng, kết thúc bằng một thông điệp ý nghĩa.' },
  { id: 'anxious', label: 'Sợ hãi / Lo lắng', desc: 'Bồn chồn, bất an', instruction: 'Câu thoại ngắt quãng, lặp từ, thể hiện sự hoảng loạn hoặc lo âu trong từng câu chữ.' },
  { id: 'sarcastic', label: 'Mỉa mai / Châm chọc', desc: 'Sắc sảo, hài hước đen', instruction: 'Dùng lối nói ngược, khen chê khéo léo, giọng điệu sắc sảo và mang tính giễu cợt.' },
  { id: 'mysterious', label: 'Bí ẩn / Nguy hiểm', desc: 'Trầm lắng, khó đoán', instruction: 'Lời thoại ngắn gọn, ẩn ý, tạo cảm giác tò mò và hồi hộp cho người xem.' },
];

const durations = [
  { value: '15', label: '15s (Shorts)' },
  { value: '30', label: '30s (TikTok)' },
  { value: '60', label: '60s (Story)' },
];

const pronounOptions = [
  { id: 'default', label: 'Tự động (Theo Tone)' },
  { id: 'tao_may', label: 'Tao - Mày' },
  { id: 'toi_co', label: 'Tôi - Cô / Tôi - Cậu' },
  { id: 'anh_em', label: 'Anh - Em' },
  { id: 'vo_chong', label: 'Vợ - Chồng' },
  { id: 'bo_con', label: 'Bố - Con / Mẹ - Con' },
  { id: 'custom', label: 'Tùy chỉnh...' },
];

const createEmptyCharacter = (index: number): Character => ({
  name: '', role: '', description: '', image: null,
  voiceGender: index % 2 === 0 ? 'Nam' : 'Nữ', voiceAge: '', voiceRegion: 'Miền Bắc', voiceType: 'Kể chuyện'
});

const THEME_TOPICS: Record<string, string[]> = {
  family_life: ['Mẹ chồng nàng dâu', 'Chuyện con cái học hành', 'Bữa cơm gia đình', 'Kỷ niệm ngày cưới', 'Dọn dẹp nhà cửa', 'Đi du lịch gia đình'],
  parenting: ['Dạy con tự lập', 'Khi con bướng bỉnh', 'Chọn trường cho con', 'Cân bằng công việc và con cái', 'Dạy con về tiền bạc', 'Sức khỏe của bé'],
  spouses: ['Quỹ đen của chồng', 'Vợ hay ghen', 'Kỷ niệm lần đầu gặp', 'Phân công việc nhà', 'Lãng mạn hâm nóng tình cảm', 'Chuyện quà cáp'],
  health_tips: ['Giảm cân lành mạnh', 'Chăm sóc da mùa đông', 'Tập thể dục tại nhà', 'Chế độ ăn cho người tiểu đường', 'Sức khỏe tinh thần', 'Mẹo ngủ ngon'],
  body_parts: ['Cái bụng đói', 'Đôi mắt thâm quầng', 'Cái lưng đau', 'Trái tim đa cảm', 'Đôi chân mệt mỏi', 'Cái đầu hay quên'],
  vegetables: ['Súp lơ vs Cà rốt', 'Hành tây mít ướt', 'Ớt cay nghiệt', 'Bắp cải tròn trịa', 'Dưa chuột mát tính', 'Tỏi nồng nàn'],
  fitness: ['Ngày đầu đi gym', 'Thử thách 30 ngày plank', 'Chạy bộ buổi sáng', 'Yoga cho người mới', 'Động lực tập luyện', 'Chế độ ăn gym'],
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('isLoggedIn') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [activeModule, setActiveModule] = useState<'script' | 'tts' | 'vision' | 'tryon' | 'guide' | 'affiliate_veo3'>(() => {
    try {
      const saved = localStorage.getItem('activeModule');
      if (saved === 'affiliate' || saved === 'hacks' || saved === 'troll_video') return 'affiliate_veo3';
      return (saved as any) || 'guide';
    } catch (e) {
      return 'guide';
    }
  });
  const [loading, setLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(() => {
    try {
      const saved = localStorage.getItem('generatedData');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Error parsing generatedData from localStorage:", e);
      return null;
    }
  });

  const handleLogout = React.useCallback(() => {
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('trialStartTime');
      localStorage.removeItem('trialDuration');
    } catch (e) {
      console.warn("Error clearing localStorage on logout:", e);
    }
    setIsLoggedIn(false);
  }, []);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      let startTime: string | null = null;
      try {
        startTime = localStorage.getItem('trialStartTime');
        if (!startTime) {
          startTime = Date.now().toString();
          localStorage.setItem('trialStartTime', startTime);
        }
      } catch (e) {
        startTime = Date.now().toString();
      }

      let durationSeconds = 5 * 60;
      try {
        const storedDuration = localStorage.getItem('trialDuration');
        durationSeconds = storedDuration ? parseInt(storedDuration, 10) : 5 * 60;
      } catch (e) {
        durationSeconds = 5 * 60;
      }

      if (durationSeconds === -1) {
        setTimeLeft(null);
        return;
      }

      const timer = setInterval(() => {
        const start = parseInt(startTime!, 10);
        if (isNaN(start)) {
          clearInterval(timer);
          return;
        }
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timer);
          handleLogout();
          // Use a non-blocking notification or just logout
          toast.error("Hết thời gian sử dụng tài khoản. Hệ thống đã tự động đăng xuất.");
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setTimeLeft(null);
    }
  }, [isLoggedIn, handleLogout]);

  const formatTimeLeft = (seconds: number) => {
    if (seconds > 24 * 3600) {
      const days = Math.floor(seconds / (24 * 3600));
      const hours = Math.floor((seconds % (24 * 3600)) / 3600);
      return `${days} ngày ${hours}h`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isLoggedIn) {
      try {
        localStorage.setItem('activeModule', activeModule);
        localStorage.setItem('generatedData', JSON.stringify(generatedData));
      } catch (e) {
        console.warn("Error saving activeModule/generatedData to localStorage:", e);
      }
    }
  }, [activeModule, generatedData, isLoggedIn]);

  const [charA, setCharA] = useState<Character>(() => {
    try {
      const saved = localStorage.getItem('charA');
      return saved ? JSON.parse(saved) : createEmptyCharacter(0);
    } catch (e) {
      return createEmptyCharacter(0);
    }
  });
  const [charB, setCharB] = useState<Character>(() => {
    try {
      const saved = localStorage.getItem('charB');
      return saved ? JSON.parse(saved) : createEmptyCharacter(1);
    } catch (e) {
      return createEmptyCharacter(1);
    }
  });
  const [charC, setCharC] = useState<Character>(() => {
    try {
      const saved = localStorage.getItem('charC');
      return saved ? JSON.parse(saved) : createEmptyCharacter(2);
    } catch (e) {
      return createEmptyCharacter(2);
    }
  });
  const [charD, setCharD] = useState<Character>(() => {
    try {
      const saved = localStorage.getItem('charD');
      return saved ? JSON.parse(saved) : createEmptyCharacter(3);
    } catch (e) {
      return createEmptyCharacter(3);
    }
  });
  
  const [activeCharsCount, setActiveCharsCount] = useState(() => {
    try {
      const saved = localStorage.getItem('activeCharsCount');
      return saved ? parseInt(saved, 10) : 2;
    } catch (e) {
      return 2;
    }
  });

  const [generalContext, setGeneralContext] = useState(() => {
    try {
      return localStorage.getItem('generalContext') || '';
    } catch (e) {
      return '';
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'family_life';
    } catch (e) {
      return 'family_life';
    }
  });
  const [customTheme, setCustomTheme] = useState(() => {
    try {
      return localStorage.getItem('customTheme') || '';
    } catch (e) {
      return '';
    }
  });
  const [situation, setSituation] = useState(() => {
    try {
      return localStorage.getItem('situation') || '';
    } catch (e) {
      return '';
    }
  });
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [suggestedSituations, setSuggestedSituations] = useState<string[]>([]);
  const [isSuggestingSituations, setIsSuggestingSituations] = useState(false);
  const [customScript, setCustomScript] = useState(() => {
    try {
      return localStorage.getItem('customScript') || '';
    } catch (e) {
      return '';
    }
  });
  
  const [style, setStyle] = useState(() => {
    try {
      return localStorage.getItem('style') || '3d_animation';
    } catch (e) {
      return '3d_animation';
    }
  });
  const [characterStyles, setCharacterStyles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('characterStyles');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [scriptTone, setScriptTone] = useState<ScriptTone>(() => {
    try {
      const saved = localStorage.getItem('scriptTone');
      return saved ? JSON.parse(saved) : tones[0];
    } catch (e) {
      return tones[0];
    }
  });
  const [duration, setDuration] = useState(() => {
    try {
      return localStorage.getItem('duration') || '30';
    } catch (e) {
      return '30';
    }
  });
  const [isCustomDuration, setIsCustomDuration] = useState(() => {
    try {
      return localStorage.getItem('isCustomDuration') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [dialogueMode, setDialogueMode] = useState(() => {
    try {
      return localStorage.getItem('dialogueMode') || 'both';
    } catch (e) {
      return 'both';
    }
  });
  
  const [pronounStyle, setPronounStyle] = useState(() => {
    try {
      return localStorage.getItem('pronounStyle') || 'default';
    } catch (e) {
      return 'default';
    }
  });
  const [customPronoun, setCustomPronoun] = useState(() => {
    try {
      return localStorage.getItem('customPronoun') || '';
    } catch (e) {
      return '';
    }
  });

  // Save inputs effect
  useEffect(() => {
    if (isLoggedIn) {
      try {
        localStorage.setItem('charA', JSON.stringify(charA));
        localStorage.setItem('charB', JSON.stringify(charB));
        localStorage.setItem('charC', JSON.stringify(charC));
        localStorage.setItem('charD', JSON.stringify(charD));
        localStorage.setItem('activeCharsCount', activeCharsCount.toString());
        localStorage.setItem('generalContext', generalContext);
        localStorage.setItem('theme', theme);
        localStorage.setItem('customTheme', customTheme);
        localStorage.setItem('situation', situation);
        localStorage.setItem('customScript', customScript);
        localStorage.setItem('style', style);
        localStorage.setItem('characterStyles', JSON.stringify(characterStyles));
        localStorage.setItem('scriptTone', JSON.stringify(scriptTone));
        localStorage.setItem('duration', duration);
        localStorage.setItem('isCustomDuration', isCustomDuration.toString());
        localStorage.setItem('dialogueMode', dialogueMode);
        localStorage.setItem('pronounStyle', pronounStyle);
        localStorage.setItem('customPronoun', customPronoun);
      } catch (e) {
        console.warn("Error saving inputs to localStorage:", e);
      }
    }
  }, [
    charA, charB, charC, charD, activeCharsCount, generalContext, theme, 
    customTheme, customScript, style, characterStyles, scriptTone, 
    duration, isCustomDuration, dialogueMode, pronounStyle, customPronoun, isLoggedIn
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showResetModal, setShowResetModal] = useState(false);

  const handleReset = () => {
    const keysToKeep = ['isLoggedIn', 'user_gemini_api_keys', 'user_gemini_api_key'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  const handleBack = () => {
    setGeneratedData(null);
  };

  const getActiveCharacters = () => {
    const list = [charA];
    if (activeCharsCount >= 2) list.push(charB);
    if (activeCharsCount >= 3) list.push(charC);
    if (activeCharsCount >= 4) list.push(charD);
    return list;
  };

  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.generatedData && json.inputs) {
            setGeneratedData(json.generatedData);
            const i = json.inputs;
            if (i.characters) {
              setCharA(i.characters[0] || createEmptyCharacter(0));
              setCharB(i.characters[1] || createEmptyCharacter(1));
              setCharC(i.characters[2] || createEmptyCharacter(2));
              setCharD(i.characters[3] || createEmptyCharacter(3));
              setActiveCharsCount(i.characters.length);
            }
            if (i.generalContext) setGeneralContext(i.generalContext);
            if (i.theme) setTheme(i.theme);
            if (i.customTheme) setCustomTheme(i.customTheme);
            if (i.situation) setSituation(i.situation);
            if (i.customScript) setCustomScript(i.customScript);
            if (i.styleId) setStyle(i.styleId);
            if (i.characterStyles) setCharacterStyles(i.characterStyles);
            if (i.scriptTone) {
               const foundTone = tones.find(t => t.id === i.scriptTone.id) || i.scriptTone;
               setScriptTone(foundTone);
            }
            if (i.duration) {
              setDuration(i.duration);
              setIsCustomDuration(!durations.some(d => d.value === i.duration));
            }
            if (i.pronounStyle) setPronounStyle(i.pronounStyle);
            if (i.customPronoun) setCustomPronoun(i.customPronoun);
            return;
        }
        console.error("File JSON không tương thích.");
        toast.error("File JSON không tương thích.");
      } catch (err) {
        console.error("Có lỗi khi đọc file.");
        toast.error("Có lỗi khi đọc file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSuggestSubTopic = async (parentThemeLabel: string) => {
    setIsSuggesting(true);
    setSuggestedTopics([]);
    try {
      const suggestions = await suggestTopic(parentThemeLabel, getActiveCharacters());
      setSuggestedTopics(suggestions);
    } catch (error) {
      console.error("Could not suggest topics at this time.", error);
      toast.error("Không thể gợi ý chủ đề lúc này.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSuggestSituations = async (parentThemeLabel: string, topic: string) => {
    if (!topic) {
      toast.warning("Vui lòng nhập hoặc chọn chủ đề trước.");
      return;
    }
    setIsSuggestingSituations(true);
    setSuggestedSituations([]);
    try {
      const suggestions = await suggestSituations(parentThemeLabel, topic, getActiveCharacters());
      setSuggestedSituations(suggestions);
    } catch (error) {
      console.error("Could not suggest situations at this time.", error);
      toast.error("Không thể gợi ý tình huống lúc này.");
    } finally {
      setIsSuggestingSituations(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedData(null);

    try {
      const selectedThemeObj = themes.find(t => t.id === theme);
      const parentLabel = selectedThemeObj?.label || 'General';
      
      let efficientTheme = theme === 'custom' ? customTheme : parentLabel;
      if (theme !== 'custom' && customTheme) efficientTheme += ` - Chủ đề: ${customTheme}`;
      if (situation) efficientTheme += ` - Tình huống: ${situation}`;

      const durationArg = customScript.trim() ? "Theo độ dài kịch bản" : `${duration} giây`;
      let selectedPronoun = pronounStyle === 'custom' ? customPronoun : (pronounStyle !== 'default' ? pronounOptions.find(p => p.id === pronounStyle)?.label || '' : '');

      const activeChars = getActiveCharacters();
      const data = await generateScriptAndPrompts(
        activeChars, 
        efficientTheme, 
        style, 
        scriptTone, 
        customScript, 
        durationArg,
        dialogueMode,
        selectedPronoun,
        generalContext,
        characterStyles
      );
      setGeneratedData(data);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Có lỗi xảy ra khi tạo kịch bản.";
      const errorStr = error.message || String(error);
      
      if (errorStr.includes("429") || errorStr.toLowerCase().includes("quota") || errorStr.toLowerCase().includes("resource_exhausted")) {
        errorMessage = "Bạn đã hết hạn mức sử dụng (Quota) hôm nay. Vui lòng thử lại sau hoặc kiểm tra gói dịch vụ của bạn.";
      }
      
      console.error(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={(durationDays) => {
      try {
        if (durationDays !== null) {
          localStorage.setItem('trialDuration', (durationDays * 24 * 60 * 60).toString());
        } else {
          localStorage.setItem('trialDuration', '-1');
        }
        localStorage.setItem('isLoggedIn', 'true');
      } catch (e) {
        console.warn("Error saving login state to localStorage:", e);
      }
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 flex flex-col">
      <Toaster position="top-right" richColors />
      <ApiKeyManager isOpen={showApiKeyManager} onClose={() => setShowApiKeyManager(false)} />
      <div className="no-print">
        <div className="bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-600 text-white py-2.5 px-4 flex items-center justify-center shadow-md relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 z-10">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1 rounded-md hidden sm:block">
                <Clapperboard size={14} className="text-white" />
              </div>
              <span className="uppercase tracking-tight text-[11px] md:text-sm">
                Mua khóa học Capcut & tài khoản <span className="text-yellow-400">Pro</span> - Mua tài khoản VEO3 Ultra <span className="text-yellow-400">giá rẻ</span> liên hệ
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white text-purple-700 px-4 py-1 rounded-full text-[11px] md:text-sm shadow-lg transform hover:scale-105 transition-transform cursor-default">
                Nam AI 098.102.8794
              </span>
              <span className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] md:text-[11px] flex items-center gap-1 border border-white/20">
                <Sparkles size={12} className="text-yellow-400 fill-yellow-400" /> GIÁ RẺ - UY TÍN
              </span>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute left-0 top-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          </div>
        </div>

        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-3 lg:py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-tr from-orange-600 to-amber-600 text-white p-2 rounded-lg">
                  <Clapperboard size={20} />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">
                    
                  </h1>
                  <p className="text-[10px] md:text-xs text-slate-500"> </p>
                </div>
              </div>

              <div className="flex lg:hidden flex-col items-end gap-1">
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 gap-0.5">
                  <button 
                    onClick={() => setShowResetModal(true)}
                    className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-100/50 rounded-lg transition-all active:scale-95"
                    title="Làm mới"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-all active:scale-95"
                    title="Đăng xuất"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
                {timeLeft !== null && (
                  <div className="px-2 py-0.5 flex items-center gap-1 text-orange-600 bg-orange-50 rounded-lg border border-orange-100">
                    <Clock size={10} className="animate-pulse" />
                    <span className="text-[9px] tabular-nums whitespace-nowrap">
                      {formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          
            <div className="flex flex-col items-center w-full lg:w-auto max-w-full overflow-hidden">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveModule('guide')}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-sm transition-all flex items-center justify-center gap-2 ${activeModule === 'guide' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BookOpen size={14} /> Hướng dẫn
              </button>
              <button 
                onClick={() => setActiveModule('script')}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-sm transition-all flex items-center justify-center gap-2 ${activeModule === 'script' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Clapperboard size={14} /> Nhân Hóa
              </button>
              <button 
                onClick={() => setActiveModule('tts')}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-sm transition-all flex items-center justify-center gap-2 ${activeModule === 'tts' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Mic size={14} /> Giọng Đọc
              </button>
              <button 
                onClick={() => setActiveModule('tryon')}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-sm transition-all flex items-center justify-center gap-2 ${activeModule === 'tryon' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Shirt size={14} /> Thử Đồ
              </button>
              <button 
                onClick={() => setActiveModule('vision')}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-sm transition-all flex items-center justify-center gap-2 ${activeModule === 'vision' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ScanEye size={14} /> Quét Ảnh
              </button>
              <button 
                onClick={() => setActiveModule('affiliate_veo3')}
                className={`flex-1 md:flex-none whitespace-nowrap px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-sm transition-all flex items-center justify-center gap-2 ${activeModule === 'affiliate_veo3' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Tag size={14} /> AFFILATE VEO3
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 animate-pulse text-center w-full max-w-full px-4 truncate">
              ← Trượt sang phải để xem thêm ứng dụng →
            </p>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <input type="file" ref={fileInputRef} onChange={handleJsonUpload} accept=".json" className="hidden" />
              {activeModule === 'script' && generatedData && (
                <button 
                  onClick={handleBack} 
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-orange-600 hover:bg-white rounded-lg transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft size={14} /> Quay lại
                </button>
              )}
              
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              
              <button 
                onClick={() => setShowApiKeyManager(true)}
                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-white rounded-lg transition-all group relative"
                title="Quản lý API Keys"
              >
                <Key size={18} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">API Keys</span>
              </button>

              <button 
                onClick={() => setShowResetModal(true)}
                className="p-2 text-slate-500 hover:text-orange-600 hover:bg-white rounded-lg transition-all group relative"
                title="Làm mới hệ thống"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Làm mới</span>
              </button>

              <button 
                onClick={handleLogout} 
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-all group relative"
                title="Đăng xuất"
              >
                <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Đăng xuất</span>
              </button>
            </div>
            {timeLeft !== null && (
              <div className="px-3 py-1 flex items-center gap-2 text-orange-600 bg-orange-50 rounded-lg border border-orange-100">
                <Clock size={12} className="animate-pulse" />
                <span className="text-[10px] tabular-nums whitespace-nowrap">
                  Hạn dùng: {formatTimeLeft(timeLeft)}
                </span>
              </div>
            )}
          </div>
          </div>
        </header>
    </div>

    <main className="max-w-6xl mx-auto px-4 py-8 flex-grow w-full">
        <AnimatePresence mode="wait">
          {activeModule === 'guide' ? (
            <motion.div
              key="guide-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UserGuide onNavigate={setActiveModule} />
            </motion.div>
          ) : activeModule === 'tryon' ? (
            <motion.div
              key="tryon-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VirtualTryOn />
            </motion.div>
          ) : activeModule === 'vision' ? (
            <motion.div
              key="vision-scanner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VisionScanner />
            </motion.div>
          ) : activeModule === 'affiliate_veo3' ? (
            <motion.div
              key="affiliate-veo3-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AffiliateVeo3Module />
            </motion.div>
          ) : activeModule === 'tts' ? (
            <motion.div
              key="tts-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TextToSpeech />
            </motion.div>
          ) : !generatedData ? (
            <motion.div
              key="script-module"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <section>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl flex items-center gap-2">
                    <User className="text-orange-600" />
                    1. Thiết lập Nhân vật (Tối đa 4)
                  </h2>
                  {!generatedData && (
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="px-4 py-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Upload size={16} /> Mở Project
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-[10px] md:text-xs space-y-1">
                    <p className="text-orange-800 flex items-center gap-2">
                      <Sparkles size={14} /> Tham khảo mẫu video AI nhân hóa:
                    </p>
                    <div className="flex gap-4">
                      <a href="https://www.facebook.com/profile.php?id=61586773262867" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Mẫu 1 <ExternalLink size={12} />
                      </a>
                      <a href="https://www.facebook.com/profile.php?id=61587009421526" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        Mẫu 2 <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setActiveCharsCount(Math.max(1, activeCharsCount - 1))}
                      disabled={activeCharsCount <= 1}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 transition-colors"
                    >
                      <MinusCircle size={20} />
                    </button>
                    <span className="text-sm w-6 text-center">{activeCharsCount}</span>
                    <button 
                      onClick={() => setActiveCharsCount(Math.min(4, activeCharsCount + 1))}
                      disabled={activeCharsCount >= 4}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 transition-colors"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid lg:grid-cols-2 gap-8">
                <CharacterInput label="Nhân vật A" tagLabel="Chính diện" tagColorClass="bg-orange-50" borderColorClass="focus:ring-orange-500" ringColorClass="focus:ring-orange-500" character={charA} styleId={style === 'mixed' ? (characterStyles[charA.name] || 'realistic') : style} scriptTone={scriptTone} onChange={setCharA} />
                {activeCharsCount >= 2 && <CharacterInput label="Nhân vật B" tagLabel="Phụ/Đối trọng" tagColorClass="bg-amber-50" borderColorClass="focus:ring-amber-500" ringColorClass="focus:ring-amber-500" character={charB} styleId={style === 'mixed' ? (characterStyles[charB.name] || '3d_animation') : style} scriptTone={scriptTone} onChange={setCharB} optional={true} />}
                {activeCharsCount >= 3 && <CharacterInput label="Nhân vật C" tagLabel="Phụ" tagColorClass="bg-orange-100" borderColorClass="focus:ring-orange-400" ringColorClass="focus:ring-orange-400" character={charC} styleId={style === 'mixed' ? (characterStyles[charC.name] || '3d_animation') : style} scriptTone={scriptTone} onChange={setCharC} optional={true} />}
                {activeCharsCount >= 4 && <CharacterInput label="Nhân vật D" tagLabel="Phụ" tagColorClass="bg-amber-100" borderColorClass="focus:ring-amber-400" ringColorClass="focus:ring-amber-400" character={charD} styleId={style === 'mixed' ? (characterStyles[charD.name] || '3d_animation') : style} scriptTone={scriptTone} onChange={setCharD} optional={true} />}
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl mb-6 flex items-center gap-2">
                  <Type className="text-orange-600" />
                  2. Chọn Chủ đề / Kịch bản
                </h2>
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="text-orange-600" />
                      <label className="text-sm text-slate-700">Bối cảnh chung</label>
                    </div>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-slate-50" placeholder="VD: Văn phòng hiện đại, Khu vườn cổ tích..." value={generalContext} onChange={(e) => setGeneralContext(e.target.value)} />
                  </div>
                  <div className={`bg-white p-5 rounded-xl border ${customScript ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-orange-600" />
                      <label className="text-sm text-slate-700">Kịch bản chi tiết (Tùy chọn)</label>
                    </div>
                    <textarea className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm min-h-[120px]" placeholder="Nhập kịch bản có sẵn..." value={customScript} onChange={(e) => setCustomScript(e.target.value)} />
                  </div>
                  {!customScript && (
                    <div className="space-y-4">
                      {/* Theme Selection - Tag Style */}
                      <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-orange-800 flex items-center gap-2">
                            <Layout size={16} />
                            Chủ đề :
                          </span>
                          {themes.map(t => (
                            <button
                              key={t.id}
                              onClick={() => { 
                                setTheme(t.id); 
                                setCustomTheme(''); 
                                setSituation(''); 
                                setSuggestedTopics([]); 
                                setSuggestedSituations([]); 
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${theme === t.id ? 'bg-orange-600 text-white shadow-md scale-105' : 'bg-white text-orange-700 border border-orange-200 hover:border-orange-400'}`}
                            >
                              <span>{t.icon}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sub-options for the selected theme */}
                      {theme && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn space-y-6">
                          {theme === 'custom' ? (
                            <div>
                              <label className="text-sm text-slate-700 mb-2 block">Nhập chủ đề tự do</label>
                              <input 
                                type="text" 
                                value={customTheme} 
                                onChange={(e) => setCustomTheme(e.target.value)} 
                                placeholder="VD: Chuyện đi làm muộn, Gặp lại người yêu cũ..." 
                                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-slate-50" 
                              />
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Topic Selection */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={12} className="text-orange-500" />
                                    1. Lựa chọn Chủ đề chi tiết
                                  </label>
                                  <button 
                                    onClick={() => handleSuggestSubTopic(themes.find(t => t.id === theme)?.label || '')} 
                                    disabled={isSuggesting}
                                    className="text-[10px] text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors"
                                  >
                                    {isSuggesting ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                    AI Gợi ý thêm
                                  </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {(THEME_TOPICS[theme] || []).map(top => (
                                    <button 
                                      key={top} 
                                      onClick={() => { setCustomTheme(top); setSuggestedSituations([]); }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${customTheme === top ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-orange-300'}`}
                                    >
                                      {top}
                                    </button>
                                  ))}
                                </div>

                                {suggestedTopics.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                                    {suggestedTopics.map(top => (
                                      <button 
                                        key={top} 
                                        onClick={() => { setCustomTheme(top); setSuggestedTopics([]); setSuggestedSituations([]); }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-violet-700 border border-violet-200 hover:border-violet-500 transition-all"
                                      >
                                        ✨ {top}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <input 
                                  type="text" 
                                  value={customTheme} 
                                  onChange={(e) => setCustomTheme(e.target.value)} 
                                  placeholder="Hoặc tự nhập chủ đề..." 
                                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-slate-50" 
                                />
                              </div>

                              {/* Situation Suggestion */}
                              {customTheme && (
                                <div className="pt-4 border-t border-slate-100">
                                  <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <Zap size={12} className="text-orange-500" />
                                      2. Tình huống hài hước
                                    </label>
                                    <button 
                                      onClick={() => handleSuggestSituations(themes.find(t => t.id === theme)?.label || '', customTheme)} 
                                      disabled={isSuggestingSituations}
                                      className="px-3 py-1.5 rounded-lg text-[10px] bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                    >
                                      {isSuggestingSituations ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                      AI Gợi ý tình huống
                                    </button>
                                  </div>

                                  {suggestedSituations.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 mb-3">
                                      {suggestedSituations.map((sit, idx) => (
                                        <button 
                                          key={idx} 
                                          onClick={() => { setSituation(sit); setSuggestedSituations([]); }}
                                          className="text-left p-3 rounded-xl text-xs bg-orange-50/50 border border-orange-100 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-start gap-2 group"
                                        >
                                          <span className="bg-orange-200 text-orange-700 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">{idx + 1}</span>
                                          <span className="text-slate-700 group-hover:text-orange-900 leading-relaxed">{sit}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  <textarea 
                                    value={situation} 
                                    onChange={(e) => setSituation(e.target.value)} 
                                    placeholder="Mô tả tình huống chi tiết để kịch bản hay hơn..." 
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-slate-50 min-h-[100px] leading-relaxed" 
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!customScript && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-orange-600" />
                        <label className="text-sm text-slate-700">Thời lượng</label>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {durations.map((d) => (
                          <button key={d.value} onClick={() => { setDuration(d.value); setIsCustomDuration(false); }} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${!isCustomDuration && duration === d.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>{d.label}</button>
                        ))}
                        <button onClick={() => setIsCustomDuration(true)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${isCustomDuration ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>Tùy chỉnh</button>
                      </div>
                      {isCustomDuration && (
                        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 mt-3 border border-orange-300 rounded-lg outline-none" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl mb-6 flex items-center gap-2">
                  <Palette className="text-orange-600" />
                  3. Visual & Tone
                </h2>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {styles.map((s) => (
                    <div key={s.id} onClick={() => setStyle(s.id)} className={`relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all group ${style === s.id ? 'border-transparent ring-2 ring-orange-500' : 'border-slate-200'}`}>
                      <div className="p-5 relative z-10">
                        <h3 className="text-lg text-slate-800">{s.label}</h3>
                        <p className="text-sm text-slate-600">{s.desc}</p>
                      </div>
                      <div className={`h-1.5 w-full bg-gradient-to-r ${s.color} mt-auto`}></div>
                    </div>
                  ))}
                </div>

                {style === 'mixed' && (
                  <div className="mb-8 p-5 bg-orange-50 border border-orange-200 rounded-xl">
                    <h4 className="text-sm text-orange-800 mb-4 flex items-center gap-2"><Sparkles size={16} /> Phong cách từng nhân vật</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {getActiveCharacters().map(char => (
                        <div key={char.name || Math.random()}>
                          <label className="block text-xs text-slate-500 mb-1">{char.name || 'N/A'}</label>
                          <select 
                            value={characterStyles[char.name] || '3d_animation'}
                            onChange={(e) => setCharacterStyles({...characterStyles, [char.name]: e.target.value})}
                            className="w-full p-2 bg-white border border-orange-300 rounded-lg text-sm"
                          >
                            <option value="realistic">Người thật</option>
                            <option value="3d_animation">Hoạt hình 3D</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-slate-500 uppercase mb-3"><MessageCircle size={16} className="inline mr-2"/> Cảm xúc lời thoại</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tones.map((t) => (
                        <button key={t.id} onClick={() => setScriptTone(t)} className={`p-3 rounded-xl border text-left text-sm ${scriptTone.id === t.id ? 'border-orange-600 bg-orange-50 font-semibold' : 'border-slate-200 text-slate-600'}`}>
                          <span>{t.label}</span>
                          <p className="text-xs opacity-70 font-normal">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm text-slate-500 uppercase mb-3"><MessageSquare size={16} className="inline mr-2"/> Cách xưng hô</h3>
                    <div className="flex flex-wrap gap-2">
                      {pronounOptions.map((opt) => (
                        <button key={opt.id} onClick={() => setPronounStyle(opt.id)} className={`px-3 py-2 rounded-lg text-sm border ${pronounStyle === opt.id ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200'}`}>{opt.label}</button>
                      ))}
                    </div>
                    {pronounStyle === 'custom' && (
                      <input type="text" placeholder="VD: Đại ca - Đệ tử..." className="w-full p-2.5 mt-3 border border-orange-300 rounded-lg text-sm" value={customPronoun} onChange={(e) => setCustomPronoun(e.target.value)} />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center pt-8 pb-12">
              <button 
                onClick={handleGenerate} 
                disabled={loading || !charA.name} 
                className={`rounded-full px-12 py-4 text-white text-lg shadow-xl transition-all ${loading || !charA.name ? 'bg-slate-300' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-105'}`}
              >
                {loading ? "Đang xử lý..." : "Tạo Kịch bản & Prompt"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result-module"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <ResultDisplay 
            data={generatedData!} 
            characters={getActiveCharacters()} 
            styleId={style}
            characterStyles={characterStyles}
            projectInputs={{ theme, customTheme, customScript, scriptTone, duration, dialogueMode, pronounStyle, customPronoun, generalContext }}
            onReset={handleReset} 
            onBack={handleBack}
          />
        </motion.div>
        )}
      </AnimatePresence>
    </main>
      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 mt-auto bg-slate-50 no-print">@by Nam Lê AI - 098.102.8794</footer>

      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <RefreshCw size={24} />
                  </div>
                  <h3 className="text-xl">Làm mới dữ liệu?</h3>
                </div>
                <button onClick={() => setShowResetModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 text-center">
                <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                  Bạn có chắc chắn muốn làm mới toàn bộ dữ liệu? Thao tác này sẽ xóa tất cả các cài đặt, kịch bản và kết quả hiện tại. 
                </p>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-200"
                  >
                    Đồng ý xóa
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } 
        @keyframes fadeInSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } 
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; } 
        .animate-fadeInSlideUp { animation: fadeInSlideUp 0.6s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;