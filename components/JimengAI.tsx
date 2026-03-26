import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Copy, Sparkles, Camera, MapPin, 
  Type, Loader2, Clapperboard, RefreshCw, ArrowLeft, ExternalLink, FileText,
  Plus, Minus, Clock, ListOrdered, Image as ImageIcon, Lock, User,
  BookOpen, Layers, Split, Film, MessageSquare, Heart, Zap, Mic,
  Smile, Shirt, List, Check, Wand2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { withRetry } from '../services/geminiService';

interface JimengAIProps {
}

const JimengAI = ({ }: JimengAIProps) => {
  const [activeTab, setActiveTab] = useState<'series' | 'expert'>(() => 
    (localStorage.getItem('jimeng_activeTab') as any) || 'expert'
  );

  const extractJSON = (text: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerE) {
          throw innerE;
        }
      }
      throw e;
    }
  };
  const [mainStory, setMainStory] = useState(() => localStorage.getItem('jimeng_mainStory') || '');
  const [fullStory, setFullStory] = useState(() => localStorage.getItem('jimeng_fullStory') || '');
  const [workflowStep, setWorkflowStep] = useState(() => {
    const saved = localStorage.getItem('jimeng_workflowStep');
    return saved ? parseInt(saved) : 0;
  });
  const [series, setSeries] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('jimeng_series');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(() => {
    const saved = localStorage.getItem('jimeng_currentIndex');
    return saved ? parseInt(saved) : 0;
  });
  const [topic, setTopic] = useState(() => localStorage.getItem('jimeng_topic') || '');
  const [episodeCount, setEpisodeCount] = useState(() => {
    const saved = localStorage.getItem('jimeng_episodeCount');
    return saved ? parseInt(saved) : 3;
  });
  const [episodeDuration, setEpisodeDuration] = useState(() => {
    const saved = localStorage.getItem('jimeng_episodeDuration');
    return saved ? parseInt(saved) : 60;
  });
  const [seriesCharacters, setSeriesCharacters] = useState<{ name: string; gender: 'Nam' | 'Nữ'; costume: string; costumeType: 'custom' | 'reference' | 'cameo_default' }[]>(() => {
    try {
      const saved = localStorage.getItem('jimeng_seriesCharacters');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.map((c: any) => ({
        ...c,
        costumeType: c.costumeType || 'custom'
      }));
    } catch (e) {
      return [];
    }
  });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isExpandingStory, setIsExpandingStory] = useState(false);
  const [isSplittingEpisodes, setIsSplittingEpisodes] = useState(false);
  const [isSplittingScenes, setIsSplittingScenes] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<string[]>([]);
  const [costumeType, setCostumeType] = useState<'custom' | 'reference' | 'cameo_default'>(() => 
    (localStorage.getItem('jimeng_costumeType') as any) || 'custom'
  );
  const [costume, setCostume] = useState(() => localStorage.getItem('jimeng_costume') || 'Ví dụ: Nhân vật A mặc áo thun, Nhân vật B mặc váy...');
  
  // Expert State
  const [expertDialogueMode, setExpertDialogueMode] = useState<'with_dialogue' | 'no_dialogue'>(() => 
    (localStorage.getItem('jimeng_expertDialogueMode') as any) || 'with_dialogue'
  );
  const [expertSelectedThemes, setExpertSelectedThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('jimeng_expertSelectedThemes');
    return saved ? JSON.parse(saved) : [];
  });
  const [expertSelectedSubTopic, setExpertSelectedSubTopic] = useState<string>(() => 
    localStorage.getItem('jimeng_expertSelectedSubTopic') || ''
  );
  const [seriesSelectedThemes, setSeriesSelectedThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('jimeng_seriesSelectedThemes');
    return saved ? JSON.parse(saved) : [];
  });
  const [seriesSelectedSubTopic, setSeriesSelectedSubTopic] = useState<string>(() => 
    localStorage.getItem('jimeng_seriesSelectedSubTopic') || ''
  );
  const [isGeneratingExpertIdea, setIsGeneratingExpertIdea] = useState(false);
  const [isAnalyzingExpertScript, setIsAnalyzingExpertScript] = useState(false);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const focusedPromptViRef = useRef<{index: number, value: string} | null>(null);
  const focusedDialogueRef = useRef<{index: number, value: string} | null>(null);
  const [expertIdea, setExpertIdea] = useState(() => localStorage.getItem('jimeng_expertIdea') || '');
  const [expertDuration, setExpertDuration] = useState(() => {
    const saved = localStorage.getItem('jimeng_expertDuration');
    return saved ? parseInt(saved) : 60;
  });
  const [expertStep, setExpertStep] = useState(() => {
    const saved = localStorage.getItem('jimeng_expertStep');
    return saved ? parseInt(saved) : 1;
  });
  const [expertCharacters, setExpertCharacters] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('jimeng_expertCharacters');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [expertSceneInputs, setExpertSceneInputs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('jimeng_expertSceneInputs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isGeneratingExpert, setIsGeneratingExpert] = useState(false);
  const [expertResult, setExpertResult] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('jimeng_expertResult');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Auto-sync refs
  const lastSyncedVi = useRef<Record<string, string>>({});
  const seriesSyncTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('jimeng_activeTab', activeTab);
      localStorage.setItem('jimeng_mainStory', mainStory);
      localStorage.setItem('jimeng_fullStory', fullStory);
      localStorage.setItem('jimeng_workflowStep', workflowStep.toString());
      localStorage.setItem('jimeng_series', JSON.stringify(series));
      localStorage.setItem('jimeng_currentIndex', currentEpisodeIndex.toString());
      localStorage.setItem('jimeng_topic', topic);
      localStorage.setItem('jimeng_episodeCount', episodeCount.toString());
      localStorage.setItem('jimeng_episodeDuration', episodeDuration.toString());
      localStorage.setItem('jimeng_seriesCharacters', JSON.stringify(seriesCharacters));
      localStorage.setItem('jimeng_costumeType', costumeType);
      localStorage.setItem('jimeng_costume', costume);
      localStorage.setItem('jimeng_expertDialogueMode', expertDialogueMode);
      localStorage.setItem('jimeng_expertSelectedThemes', JSON.stringify(expertSelectedThemes));
      localStorage.setItem('jimeng_expertSelectedSubTopic', expertSelectedSubTopic);
      localStorage.setItem('jimeng_seriesSelectedThemes', JSON.stringify(seriesSelectedThemes));
      localStorage.setItem('jimeng_seriesSelectedSubTopic', seriesSelectedSubTopic);
      localStorage.setItem('jimeng_expertIdea', expertIdea);
      localStorage.setItem('jimeng_expertDuration', expertDuration.toString());
      localStorage.setItem('jimeng_expertStep', expertStep.toString());
      localStorage.setItem('jimeng_expertCharacters', JSON.stringify(expertCharacters));
      localStorage.setItem('jimeng_expertSceneInputs', JSON.stringify(expertSceneInputs));
      localStorage.setItem('jimeng_expertResult', JSON.stringify(expertResult));
    } catch (e) {
      console.warn("Error saving JimengAI state to localStorage:", e);
    }
  }, [series, currentEpisodeIndex, costumeType, costume, mainStory, fullStory, workflowStep, activeTab, seriesCharacters, expertDialogueMode, expertSelectedThemes, expertSelectedSubTopic, seriesSelectedThemes, seriesSelectedSubTopic, expertIdea, expertDuration, expertStep, expertCharacters, expertSceneInputs, expertResult]);

  const expertThemesList = [
    { id: 'chu_tich', label: 'Chủ tịch giả nghèo', icon: '👔' },
    { id: 'xuyen_khong', label: 'Xuyên không/Cổ trang', icon: '👘' },
    { id: 'truyen_cam_hung', label: 'Truyền cảm hứng', icon: '✨' },
    { id: 'tinh_cam', label: 'Tình cảm gia đình', icon: '❤️' },
    { id: 'hai_huoc', label: 'Hài hước/Troll', icon: '😂' },
    { id: 'nau_an', label: 'Nấu ăn/ASMR', icon: '🍳' },
    { id: 'kinh_di', label: 'Kinh dị/Bí ẩn', icon: '👻' },
    { id: 'hanh_dong', label: 'Hành động võ thuật', icon: '🥋' },
  ];

  const expertSubTopics: Record<string, string[]> = {
    chu_tich: [
      'Chủ tịch đi xin việc', 'Chủ tịch bị bảo vệ đuổi', 'Chủ tịch đi ăn quán vỉa hè', 'Chủ tịch bị coi thường', 'Chủ tịch đi xe ôm',
      'Chủ tịch bị thu hồi thẻ', 'Chủ tịch đi họp phụ huynh', 'Chủ tịch đi mua đồ cũ', 'Chủ tịch bị lừa tiền', 'Chủ tịch đi làm công nhân',
      'Chủ tịch đi bán hàng rong', 'Chủ tịch đi học lại', 'Chủ tịch bị bạn cũ khinh', 'Chủ tịch đi làm bảo vệ', 'Chủ tịch đi thi tuyển',
      'Chủ tịch bị mất ví', 'Chủ tịch đi làm từ thiện', 'Chủ tịch bị sếp mắng', 'Chủ tịch đi xin nước', 'Chủ tịch đi làm shipper'
    ],
    xuyen_khong: [
      'Xuyên không thành hoàng hậu', 'Xuyên không thành nô tỳ', 'Xuyên không thành tướng quân', 'Xuyên không thành công chúa', 'Xuyên không thành thái giám',
      'Xuyên không thành tiểu thư', 'Xuyên không thành vương gia', 'Xuyên không thành cung nữ', 'Xuyên không thành thị vệ', 'Xuyên không thành hoàng đế',
      'Xuyên không thành người hầu', 'Xuyên không thành kiếm khách', 'Xuyên không thành thần y', 'Xuyên không thành phù thủy', 'Xuyên không thành người dân',
      'Xuyên không thành quân sư', 'Xuyên không thành kỹ nữ', 'Xuyên không thành thái tử', 'Xuyên không thành công tử', 'Xuyên không thành người rừng'
    ],
    truyen_cam_hung: [
      'Vượt qua thất bại', 'Hành trình khởi nghiệp', 'Giúp đỡ người nghèo', 'Học tập không ngừng', 'Đạt được ước mơ',
      'Vượt qua nỗi sợ', 'Tình bạn cao cả', 'Sự kiên trì', 'Lòng nhân ái', 'Sống tích cực',
      'Vượt qua nghịch cảnh', 'Sáng tạo đột phá', 'Tình yêu thương', 'Sự tha thứ', 'Lòng dũng cảm',
      'Sự tự tin', 'Hành trình thay đổi', 'Sự cống hiến', 'Lòng biết ơn', 'Sự trưởng thành'
    ],
    tinh_cam: [
      'Bữa cơm gia đình', 'Sự quan tâm của cha', 'Tình yêu của mẹ', 'Anh em đùm bọc', 'Sự thấu hiểu',
      'Gia đình sum họp', 'Sự hy sinh', 'Tình cảm vợ chồng', 'Sự gắn kết', 'Sự chia sẻ',
      'Sự bao dung', 'Tình cảm ông bà', 'Sự đồng hành', 'Sự ủng hộ', 'Sự tin tưởng',
      'Sự yêu thương', 'Sự quan tâm', 'Sự thấu cảm', 'Sự trân trọng', 'Sự gắn bó'
    ],
    hai_huoc: [
      'Troll bạn thân', 'Tình huống dở khóc dở cười', 'Chơi khăm đồng nghiệp', 'Phản ứng hài hước', 'Tình huống bất ngờ',
      'Hành động ngớ ngẩn', 'Biểu cảm khó đỡ', 'Tình huống trớ trêu', 'Sự cố hài hước', 'Trò đùa nghịch ngợm',
      'Tình huống hiểu lầm', 'Hành động kỳ quặc', 'Sự cố bất ngờ', 'Tình huống hài hước', 'Trò đùa vui nhộn',
      'Tình huống trêu chọc', 'Hành động buồn cười', 'Sự cố khó đỡ', 'Tình huống trớ trêu', 'Trò đùa vui nhộn'
    ],
    nau_an: [
      'Nấu ăn ASMR', 'Thử thách nấu ăn', 'Công thức độc lạ', 'Nấu ăn cùng gia đình', 'Bữa ăn nhanh',
      'Nấu ăn sang chảnh', 'Nấu ăn dân dã', 'Nấu ăn sáng tạo', 'Nấu ăn ngon', 'Nấu ăn đẹp mắt',
      'Nấu ăn đơn giản', 'Nấu ăn chuyên nghiệp', 'Nấu ăn tại nhà', 'Nấu ăn dã ngoại', 'Nấu ăn tiệc',
      'Nấu ăn chay', 'Nấu ăn mặn', 'Nấu ăn tráng miệng', 'Nấu ăn sáng', 'Nấu ăn tối'
    ],
    kinh_di: [
      'Tiếng động lạ', 'Bóng ma xuất hiện', 'Căn nhà hoang', 'Bí ẩn đêm khuya', 'Sự kiện kỳ lạ',
      'Bóng đêm bao trùm', 'Sự cố kinh dị', 'Bí ẩn chưa lời giải', 'Sự kiện đáng sợ', 'Bóng ma trong gương',
      'Tiếng thì thầm', 'Bí ẩn trong rừng', 'Sự kiện kỳ bí', 'Bóng ma trong đêm', 'Sự cố đáng sợ',
      'Bí ẩn trong nhà', 'Sự kiện bí ẩn', 'Bóng ma trong phòng', 'Sự cố kinh hoàng', 'Bí ẩn đêm khuya'
    ],
    hanh_dong: [
      'Võ thuật đỉnh cao', 'Hành động kịch tính', 'Cuộc chiến gay cấn', 'Hành động nhanh', 'Sự cố hành động',
      'Hành động mạnh mẽ', 'Cuộc đối đầu', 'Hành động quyết liệt', 'Sự cố kịch tính', 'Hành động nhanh nhẹn',
      'Cuộc chiến gay cấn', 'Hành động đỉnh cao', 'Sự cố hành động', 'Hành động mạnh mẽ', 'Cuộc đối đầu',
      'Hành động quyết liệt', 'Sự cố kịch tính', 'Hành động nhanh nhẹn', 'Cuộc chiến gay cấn', 'Hành động đỉnh cao'
    ]
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  useEffect(() => {
    const textareas = document.querySelectorAll('.auto-resize');
    textareas.forEach(textarea => {
      const el = textarea as HTMLTextAreaElement;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    });
  }, [series, currentEpisodeIndex]);

  const expandStory = async () => {
    if (!mainStory) return;
    setIsExpandingStory(true);
    try {
      const systemPrompt = `Bạn là một biên kịch phim chuyên nghiệp. 
      Nhiệm vụ của bạn là phát triển cốt truyện ngắn gọn của người dùng thành một câu chuyện đầy đủ, chi tiết và hấp dẫn hơn.
      Câu chuyện cần có cấu trúc rõ ràng, có cao trào và giải quyết vấn đề.
      Hãy viết câu chuyện dưới dạng văn bản mạch lạc, khoảng 300-500 từ.`;
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: mainStory }] }],
          config: { systemInstruction: systemPrompt }
        });
        return response.text;
      });

      if (result) {
        setFullStory(result);
        setWorkflowStep(1);
      }
    } catch (error) {
      console.error("Story expansion failed:", error);
      toast.error("Lỗi phát triển cốt truyện. Vui lòng thử lại.");
    } finally {
      setIsExpandingStory(false);
    }
  };

  const suggestStory = async () => {
    if (!topic && seriesSelectedThemes.length === 0) {
      toast.error("Vui lòng chọn chủ đề hoặc nhập ý tưởng");
      return;
    }
    setIsSuggesting(true);
    try {
      const themesStr = seriesSelectedThemes.length > 0 
        ? `thuộc các chủ đề: ${seriesSelectedThemes.map(id => expertThemesList.find(t => t.id === id)?.label).join(', ')}`
        : '';
      
      const systemPrompt = `Bạn là một biên kịch sáng tạo. 
      Dựa trên chủ đề và cấu hình series người dùng cung cấp ${themesStr}, hãy gợi ý một cốt truyện ngắn gọn (khoảng 100-200 từ) nhưng đầy đủ các yếu tố hấp dẫn, nhân vật và mâu thuẫn chính.
      Cốt truyện phải phù hợp để chia thành ${episodeCount} tập, mỗi tập khoảng ${episodeDuration} giây.
      Hãy viết bằng tiếng Việt.`;
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: `Chủ đề: ${topic}\nSố tập: ${episodeCount}\nThời lượng: ${episodeDuration} giây/tập` }] }],
          config: { systemInstruction: systemPrompt }
        });
        return response.text;
      });

      if (result) {
        setMainStory(result);
      }
    } catch (error) {
      console.error("Story suggestion failed:", error);
      toast.error("Lỗi tạo cốt truyện. Vui lòng thử lại.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const syncTranslations = async (episodeIndex: number, sceneIndex: number, newViText: string) => {
    setIsSyncing(`${episodeIndex}-${sceneIndex}`);
    try {
      const systemPrompt = `Translate the following Vietnamese video prompt into English and Chinese. 
      Maintain all technical details, camera angles, and character names.
      Return only a JSON object with keys 'en' and 'zh'.`;
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: newViText }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT" as any,
              properties: {
                en: { type: "STRING" as any },
                zh: { type: "STRING" as any }
              },
              required: ["en", "zh"]
            }
          }
        });
        return response.text;
      });

      if (result) {
        const content = extractJSON(result);
        const updatedSeries = [...series];
        if (updatedSeries[episodeIndex].scenes[sceneIndex].prompt) {
          updatedSeries[episodeIndex].scenes[sceneIndex].prompt.en = content.en;
          updatedSeries[episodeIndex].scenes[sceneIndex].prompt.zh = content.zh;
          updatedSeries[episodeIndex].scenes[sceneIndex].prompt.vi = newViText;
        }
        setSeries(updatedSeries);
      }
    } catch (error) {
      console.error("Sync translation failed:", error);
    } finally {
      setIsSyncing(null);
    }
  };

  const splitEpisodes = async () => {
    if (!fullStory) return;
    setIsSplittingEpisodes(true);
    try {
      const themesStr = seriesSelectedThemes.length > 0 
        ? `thuộc các chủ đề: ${seriesSelectedThemes.map(id => expertThemesList.find(t => t.id === id)?.label).join(', ')}`
        : '';
      
      const systemPrompt = `Bạn là một biên kịch phim chuyên nghiệp. 
      Nhiệm vụ của bạn là chia câu chuyện sau đây thành chính xác ${episodeCount} tập phim ${themesStr}.
      Mỗi tập phim cần có tiêu đề và tóm tắt nội dung cụ thể.
      
      Yêu cầu: Trả về một JSON object chứa mảng 'episodes'. 
      Mỗi phần tử có: 
      - 'title' (Tiêu đề tập)
      - 'summary' (Tóm tắt nội dung tập khoảng 50-100 từ)
      - 'setting' (Mô tả bối cảnh chung của tập phim này, ví dụ: 'Trong một căn biệt thự cổ u ám', 'Trên đường phố Sài Gòn nhộn nhịp ban đêm').`;
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: `Câu chuyện: ${fullStory}` }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT" as any,
              properties: {
                episodes: {
                  type: "ARRAY" as any,
                  items: {
                    type: "OBJECT" as any,
                    properties: {
                      title: { type: "STRING" as any },
                      summary: { type: "STRING" as any },
                      setting: { type: "STRING" as any }
                    },
                    required: ["title", "summary", "setting"]
                  }
                }
              },
              required: ["episodes"]
            }
          }
        });
        return response.text;
      });

      if (result) {
        const content = extractJSON(result);
        if (content.episodes) {
          setSeries(content.episodes.map((ep: any) => ({ 
            ...ep, 
            scenes: [],
            backgroundImage: null
          })));
          setWorkflowStep(2);
          setCurrentEpisodeIndex(0);
        }
      }
    } catch (error) {
      console.error("Episode splitting failed:", error);
      toast.error("Lỗi chia tập phim. Vui lòng thử lại.");
    } finally {
      setIsSplittingEpisodes(false);
    }
  };

  const splitScenes = async (episodeIndex: number) => {
    if (!series[episodeIndex]) return;
    setIsSplittingScenes(true);
    const sceneCount = Math.ceil(episodeDuration / 12); // Each scene is 12s
    try {
      const systemPrompt = `Bạn là một đạo diễn hình ảnh chuyên nghiệp. 
      Nhiệm vụ của bạn là chia nội dung tập phim sau đây thành chính xác ${sceneCount} cảnh quay, mỗi cảnh dài khoảng 12 giây.
      
      QUY TẮC QUAN TRỌNG:
      1. Tính liên tục: Cảnh sau PHẢI nối tiếp hành động và góc quay của cảnh trước đó để tạo thành một mạch phim mượt mà.
      2. Mô tả chi tiết: Mỗi cảnh quay cần mô tả hành động, bối cảnh và cảm xúc nhân vật một cách chi tiết để có thể tạo video AI.
      3. Chuyển cảnh: Sử dụng các mô tả như 'Máy quay từ từ tiến gần', 'Chuyển sang góc nhìn của nhân vật', 'Tiếp nối hành động từ cảnh trước...' để đảm bảo tính khớp nối.
      
      Yêu cầu: Trả về một JSON object chứa mảng 'scenes'. 
      Mỗi phần tử có: 
      - 'description' (Mô tả chi tiết cảnh quay bằng tiếng Việt)
      - 'setting' (Mô tả bối cảnh cụ thể của cảnh này, kế thừa từ bối cảnh chung nhưng chi tiết hơn).
      
      Bối cảnh chung của tập này: ${series[episodeIndex].setting || 'Chưa xác định'}`;
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: `Tập phim: ${series[episodeIndex].title}\nTóm tắt: ${series[episodeIndex].summary}` }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT" as any,
              properties: {
                scenes: {
                  type: "ARRAY" as any,
                  items: {
                    type: "OBJECT" as any,
                    properties: {
                      description: { type: "STRING" as any },
                      setting: { type: "STRING" as any }
                    },
                    required: ["description", "setting"]
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
        const content = extractJSON(result);
        if (content.scenes) {
          const updatedSeries = [...series];
          updatedSeries[episodeIndex].scenes = content.scenes.map((s: any) => ({
            ...s,
            setting: s.setting || series[episodeIndex].setting || "",
            prompt: null
          }));
          setSeries(updatedSeries);
          setWorkflowStep(3);
        }
      }
    } catch (error) {
      console.error("Scene splitting failed:", error);
      toast.error("Lỗi chia cảnh quay. Vui lòng thử lại.");
    } finally {
      setIsSplittingScenes(false);
    }
  };

  const generateScenePrompt = async (episodeIndex: number, sceneIndex: number) => {
    if (!series[episodeIndex]?.scenes[sceneIndex]) return;
    setIsTranslating(true);
    
    try {
      const scene = series[episodeIndex].scenes[sceneIndex];
      const sceneSetting = scene.setting || series[episodeIndex].setting || "";
      const episodeBgImage = series[episodeIndex].backgroundImage;
      
      const charInfo = seriesCharacters.length > 0 
        ? `Characters involved in this series:\n${seriesCharacters.map(c => {
            let costumeDesc = "";
            if (c.costumeType === 'reference') {
              costumeDesc = "Costume: Wear the costume exactly as shown in the provided reference image. Do not describe new costumes.";
            } else if (c.costumeType === 'cameo_default') {
              costumeDesc = "Costume: Wear the default cameo costume. Do not describe new costumes.";
            } else {
              costumeDesc = `Costume: ${c.costume}`;
            }
            return `- ${c.name} (STRICT GENDER: ${c.gender === 'Nam' ? 'MALE' : 'FEMALE'}, ${costumeDesc})`;
          }).join('\n')}`
        : "";

      let costumeInstruction = "";
      if (costumeType === 'reference') {
        costumeInstruction = "IMPORTANT: The characters should wear the costumes exactly as shown in the provided reference image. Do not describe new costumes, just refer to the reference image style.";
      } else if (costumeType === 'cameo_default') {
        costumeInstruction = "IMPORTANT: The characters should wear their default cameo costumes. Do not describe new costumes.";
      } else {
        costumeInstruction = `General Costume details: ${costume}`;
      }
      
      const systemPrompt = `You are a world-class prompt engineer for Jimeng AI. 
      Create a detailed 12s cinematic video prompt for a scene based on the provided description.
      
      STRICT REQUIREMENTS:
      1. Setting & Environment: You MUST strictly incorporate this background setting: "${sceneSetting}". Ensure the environment is consistent with previous scenes.
      2. Character Consistency: You MUST strictly follow these character details to ensure consistency across the series:
      ${charInfo}
      3. Character Costume: You MUST strictly follow these costume instructions: "${costumeInstruction}".
      4. COMBINE EVERYTHING: The final prompt MUST seamlessly blend the scene action, the background environment, and the character's costume into a single, coherent cinematic description.
      5. GENDER CONSISTENCY: Ensure characters maintain consistent gender as specified (MALE/FEMALE).
      ${episodeBgImage ? "6. Background Reference: Use the provided background reference image for the environment and atmosphere." : ""}
      
      Technical Requirements:
      - Lighting: Describe cinematic lighting (e.g., volumetric lighting, golden hour, neon glow, dramatic shadows).
      - Camera: Specify camera angles and movement (e.g., low angle, dolly zoom, tracking shot, close-up, wide shot).
      - Cinematography: Use terms like 'shallow depth of field', 'anamorphic lens flares', '4k', 'highly detailed textures'.
      - Action Timeline: Break down character actions by seconds. You MUST explicitly describe what Character A does and what Character B does (if multiple characters) in detail to make it realistic:
         - 0s-4s: [Detailed Action for Character A and B]
         - 4s-8s: [Detailed Action for Character A and B]
         - 8s-12s: [Detailed Action for Character A and B]
      - Character Names: ALWAYS CAPITALIZE character names.
      7. DETAILED OUTPUT: Every generated prompt (vi, en, zh) MUST explicitly describe the characters (names, gender, costume) and the setting to ensure consistency across all scenes.
      
      Return only a JSON object with keys 'vi', 'en', and 'zh'.`;
      
      const userContent = `Scene Description: ${scene.description}\nBackground Setting: ${sceneSetting}\n${charInfo}\nCostume: ${costumeInstruction}`;

      const parts: any[] = [];
      if (episodeBgImage) {
        const matches = episodeBgImage.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }
      parts.push({ text: userContent });
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT" as any,
              properties: {
                vi: { type: "STRING" as any },
                en: { type: "STRING" as any },
                zh: { type: "STRING" as any }
              },
              required: ["vi", "en", "zh"]
            }
          }
        });
        return response.text;
      });

      if (result) {
        const content = extractJSON(result);
        const updatedSeries = [...series];
        updatedSeries[episodeIndex].scenes[sceneIndex].prompt = content;
        setSeries(updatedSeries);
      }
    } catch (error) {
      console.error("Scene prompt generation failed:", error);
      toast.error("Lỗi tạo prompt. Vui lòng thử lại.");
    } finally {
      setIsTranslating(false);
    }
  };

  const generateSceneImage = async (episodeIndex: number, sceneIndex: number) => {
    const scene = series[episodeIndex]?.scenes[sceneIndex];
    if (!scene?.prompt?.en) return;
    
    setIsGeneratingImage(`${episodeIndex}-${sceneIndex}`);
    try {
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `Cinematic illustration for a movie scene: ${scene.prompt.en}. High quality, 4k, detailed textures.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        });

        let imageUrl = null;
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            imageUrl = `data:image/png;base64,${base64EncodeString}`;
            break;
          }
        }
        return imageUrl;
      });

      if (result) {
        const updatedSeries = [...series];
        updatedSeries[episodeIndex].scenes[sceneIndex].imageUrl = result;
        setSeries(updatedSeries);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast.error("Lỗi tạo ảnh minh họa. Vui lòng thử lại.");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const suggestExpertIdea = async () => {
    setIsGeneratingExpertIdea(true);
    try {
      const themesStr = expertSelectedThemes.length > 0 
        ? `thuộc các chủ đề: ${expertSelectedThemes.map(id => expertThemesList.find(t => t.id === id)?.label).join(', ')}`
        : 'ngẫu nhiên, sáng tạo và thú vị';
      const subTopicStr = expertSelectedSubTopic ? `với ý tưởng nhỏ là: "${expertSelectedSubTopic}"` : '';
      const prompt = `Gợi ý một ý tưởng kịch bản video ngắn (khoảng 1 đoạn văn) ${themesStr} ${subTopicStr}. Ý tưởng cần rõ ràng, có nhân vật cụ thể và bối cảnh.`;
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text;
      });
      if (result) setExpertIdea(result);
    } catch (e) {
      toast.error("Lỗi tạo ý tưởng");
    } finally {
      setIsGeneratingExpertIdea(false);
    }
  };

  const analyzeExpertScript = async () => {
    if (!expertIdea) return;
    setIsAnalyzingExpertScript(true);
    try {
      const prompt = `Phân tích ý tưởng sau và trích xuất danh sách các nhân vật xuất hiện trong kịch bản.
Ý tưởng: ${expertIdea}
Trả về JSON format: { "characters": ["Tên nhân vật 1", "Tên nhân vật 2"] }`;
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
          }
        });
        return response.text;
      });
      if (result) {
        const parsed = extractJSON(result);
        if (parsed && parsed.characters) {
          setExpertCharacters(parsed.characters.map((name: string) => ({
            name,
            outfitType: 'custom',
            outfitDescription: ''
          })));
        }
        
        const sceneCount = Math.ceil(expertDuration / 12);
        const scenes = [];
        for (let i = 0; i < sceneCount; i++) {
          scenes.push({
            timeRange: `${i * 12}-${(i + 1) * 12}s`,
            background: ''
          });
        }
        setExpertSceneInputs(scenes);
        setExpertStep(2);
      }
    } catch (e) {
      toast.error("Lỗi phân tích kịch bản");
    } finally {
      setIsAnalyzingExpertScript(false);
    }
  };

  const generateExpertPrompt = async () => {
    if (!expertIdea || expertDuration <= 0) return;
    setIsGeneratingExpert(true);
    try {
      const systemPrompt = `Bạn là một Chuyên gia viết Prompt cho AI Video (Jimeng/Sora) chuyên nghiệp. Nhiệm vụ của bạn là chuyển đổi ý tưởng của người dùng thành một chuỗi các Prompt phân cảnh 12 giây có tính logic, đồng nhất về nhân vật và bối cảnh.

Cấu trúc Prompt bắt buộc cho mỗi cảnh:
[Subject] + [Action] + [Environment/Outfit] + [Camera/Lighting] + [Cinematic Style]

Quy trình làm việc:
Người dùng sẽ cung cấp ý tưởng, thông tin nhân vật (kèm trang phục) và bối cảnh từng cảnh.
Bạn phải tạo prompt cho từng cảnh dựa trên các thông tin này.

Để đảm bảo sự Đồng nhất (Consistency), bạn phải:
- Áp dụng chính xác trang phục của nhân vật vào mọi cảnh họ xuất hiện.
- Áp dụng chính xác bối cảnh đã được chỉ định cho từng cảnh.

Yêu cầu kỹ thuật:
- Tạo prompt bằng 3 ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Trung.
- Tiếng Anh và Tiếng Trung dùng để đưa vào AI Video. Tiếng Việt để người dùng đọc hiểu.
- TRONG MỖI PROMPT (cả 3 ngôn ngữ), bạn PHẢI chia chi tiết hành động của cảnh 12 giây thành 3 giai đoạn: 0-4s, 4s-8s, 8s-12s. Ở mỗi giai đoạn, mô tả thật chi tiết và chân thật nhân vật A làm gì, nhân vật B làm gì (nếu có nhiều nhân vật). Ví dụ: "0-4s: [Hành động chi tiết]. 4s-8s: [Hành động chi tiết]. 8s-12s: [Hành động chi tiết]."
${expertDialogueMode === 'with_dialogue' ? '- TRONG KỊCH BẢN CÓ THOẠI: Hãy thêm một trường "dialogue" (tiếng Việt) cho mỗi cảnh nếu có nhân vật nói chuyện. ĐỒNG THỜI, trong các prompt (Vi, En, Zh), phải miêu tả rõ nhân vật đang nói chuyện, đưa TRỰC TIẾP câu thoại TIẾNG VIỆT vào trong ngoặc kép và thêm yêu cầu "sử dụng giọng đọc cameo mặc định". LƯU Ý QUAN TRỌNG: Câu thoại trong ngoặc kép ở prompt Tiếng Anh và Tiếng Trung VẪN PHẢI GIỮ NGUYÊN TIẾNG VIỆT để AI đọc đúng tiếng Việt (ví dụ: Character is speaking "Xin chào mọi người", using default cameo voice / 角色正在说“Xin chào mọi người”，使用默认客串声音).' : '- TRONG KỊCH BẢN KHÔNG THOẠI: Tuyệt đối không thêm lời thoại. Sử dụng ngôn ngữ hình thể để miêu tả biểu cảm và hành động của nhân vật một cách chân thật và chi tiết nhất.'}

Output Format:
Return a JSON object with a 'scenes' array.
Each scene object must have:
- 'timeRange': string (e.g., "0-12s")
- 'promptVi': string (The Vietnamese prompt)
- 'promptEn': string (The English prompt)
- 'promptZh': string (The Chinese prompt)
${expertDialogueMode === 'with_dialogue' ? "- 'dialogue': string (Vietnamese dialogue, or empty string if none)" : ""}
`;

      const charactersInfo = expertCharacters.map(c => {
        let outfit = '';
        if (c.outfitType === 'cameo') outfit = 'Trang phục cameo mặc định';
        else if (c.outfitType === 'reference') outfit = `Theo ảnh tham chiếu (URL/Mô tả): ${c.outfitDescription}`;
        else outfit = c.outfitDescription || 'Trang phục tự do';
        return `- ${c.name}: ${outfit}`;
      }).join('\n');

      const scenesInfo = expertSceneInputs.map((s, i) => `Cảnh ${i + 1} (${s.timeRange}): Bối cảnh - ${s.background || 'Tự do'}`).join('\n');

      const themesStr = expertSelectedThemes.length > 0 
        ? `\nChủ đề: ${expertSelectedThemes.map(id => expertThemesList.find(t => t.id === id)?.label).join(', ')}`
        : '';

      const userPrompt = `Ý tưởng: ${expertIdea}${themesStr}\nLoại kịch bản: ${expertDialogueMode === 'with_dialogue' ? 'Có thoại tiếng Việt' : 'Không thoại'}\n\nNhân vật và trang phục:\n${charactersInfo}\n\nCác cảnh và bối cảnh:\n${scenesInfo}`;

      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT" as any,
              properties: {
                scenes: {
                  type: "ARRAY" as any,
                  items: {
                    type: "OBJECT" as any,
                    properties: {
                      timeRange: { type: "STRING" as any },
                      promptVi: { type: "STRING" as any },
                      promptEn: { type: "STRING" as any },
                      promptZh: { type: "STRING" as any },
                      ...(expertDialogueMode === 'with_dialogue' ? { dialogue: { type: "STRING" as any } } : {})
                    },
                    required: ["timeRange", "promptVi", "promptEn", "promptZh"]
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
        const content = extractJSON(result);
        setExpertResult(content);
        setExpertStep(3);
      }
    } catch (error) {
      console.error("Expert prompt generation failed:", error);
      toast.error("Lỗi tạo prompt chuyên gia. Vui lòng thử lại.");
    } finally {
      setIsGeneratingExpert(false);
    }
  };

  const translateScenePrompt = async (index: number) => {
    const scene = expertResult?.scenes?.[index];
    if (!scene || !scene.promptVi) return;
    
    setTranslatingIndex(index);
    try {
      const prompt = `Dịch đoạn prompt sau sang tiếng Anh và tiếng Trung.
LƯU Ý QUAN TRỌNG: 
1. Nếu trong prompt có câu thoại được đặt trong ngoặc kép (ví dụ: "Xin chào"), BẮT BUỘC PHẢI GIỮ NGUYÊN câu thoại đó bằng tiếng Việt trong cả bản dịch tiếng Anh và tiếng Trung. Không được dịch câu thoại sang ngôn ngữ khác.
2. Đảm bảo có cụm từ yêu cầu giọng đọc cameo mặc định (ví dụ: using default cameo voice / 使用默认客串声音) nếu có lời thoại.
${scene.dialogue ? `\nLời thoại của cảnh này là: "${scene.dialogue}". Hãy chắc chắn lời thoại này xuất hiện trong prompt dịch (giữ nguyên tiếng Việt).` : ''}

Prompt tiếng Việt: ${scene.promptVi}
Trả về JSON: { "promptEn": "...", "promptZh": "..." }`;
      
      const result = await withRetry(async (ai) => {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });
        return response.text;
      });

      if (result) {
        const parsed = extractJSON(result);
        if (parsed && parsed.promptEn && parsed.promptZh) {
          const newScenes = [...expertResult.scenes];
          newScenes[index] = {
            ...newScenes[index],
            promptEn: parsed.promptEn,
            promptZh: parsed.promptZh
          };
          setExpertResult({ ...expertResult, scenes: newScenes });
          toast.success("Đã cập nhật bản dịch");
        }
      }
    } catch (e) {
      toast.error("Lỗi dịch prompt");
    } finally {
      setTranslatingIndex(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIds(prev => Array.from(new Set([...prev, id])));
      setTimeout(() => {
        setCopiedIds(prev => prev.filter(item => item !== id));
      }, 5000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedIds(prev => Array.from(new Set([...prev, id])));
      setTimeout(() => {
        setCopiedIds(prev => prev.filter(item => item !== id));
      }, 5000);
    }
  };

  const resetJimeng = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu series này không?')) {
      setSeries([]);
      setMainStory('');
      setFullStory('');
      setTopic('');
      setSeriesSelectedThemes([]);
      setSeriesSelectedSubTopic('');
      setWorkflowStep(0);
      setCostumeType('custom');
      setCostume('Ví dụ: Nhân vật A mặc áo thun, Nhân vật B mặc váy...');
      setCurrentEpisodeIndex(0);
      localStorage.removeItem('jimeng_series');
      localStorage.removeItem('jimeng_mainStory');
      localStorage.removeItem('jimeng_fullStory');
      localStorage.removeItem('jimeng_workflowStep');
      localStorage.removeItem('jimeng_currentIndex');
      localStorage.removeItem('jimeng_costumeType');
      localStorage.removeItem('jimeng_costume');
      localStorage.removeItem('jimeng_seriesSelectedThemes');
      localStorage.removeItem('jimeng_seriesSelectedSubTopic');
    }
  };

  const downloadAllPrompts = () => {
    if (series.length === 0) return;
    
    let content = `SERIES: ${mainStory || 'Chưa đặt tên'}\n`;
    content += `TRANG PHỤC (${costumeType}): ${costumeType === 'custom' ? costume : (costumeType === 'reference' ? 'Ảnh tham chiếu' : 'Mặc định Cameo')}\n`;
    content += `-------------------------------------------\n\n`;
    
    series.forEach((ep, idx) => {
      content += `TẬP ${idx + 1}: ${ep.title}\n`;
      content += `TÓM TẮT: ${ep.summary}\n\n`;
      
      if (ep.scenes && ep.scenes.length > 0) {
        ep.scenes.forEach((scene, sIdx) => {
          content += `  CẢNH ${sIdx + 1}: ${scene.description}\n`;
          if (scene.prompt?.vi) {
            content += `  [VIETNAMESE PROMPT]\n  ${scene.prompt.vi}\n\n`;
            content += `  [ENGLISH PROMPT]\n  ${scene.prompt.en}\n\n`;
            content += `  [CHINESE PROMPT]\n  ${scene.prompt.zh}\n`;
          } else {
            content += `  (Chưa tạo prompt cho cảnh này)\n`;
          }
          content += `  -------------------\n`;
        });
      } else {
        content += `(Chưa chia cảnh cho tập này)\n`;
      }
      content += `-------------------------------------------\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jimeng_AI_Series_${mainStory.substring(0, 20).replace(/\s+/g, '_') || 'Export'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentEpisode = series[currentEpisodeIndex] || null;

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="bg-orange-50 p-2 rounded-[2rem] flex gap-2 shadow-inner border border-orange-100">
          <button
            onClick={() => setActiveTab('expert')}
            className={`px-8 py-3 rounded-[1.5rem] text-sm transition-all flex items-center gap-2.5 ${
              activeTab === 'expert' 
                ? 'bg-white text-orange-600 shadow-lg shadow-orange-100 scale-105' 
                : 'text-orange-400 hover:text-orange-600 hover:bg-white/50'
            }`}
          >
            <Wand2 size={20} />
            CHUYÊN GIA PROMPT
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-8 py-3 rounded-[1.5rem] text-sm transition-all flex items-center gap-2.5 ${
              activeTab === 'series' 
                ? 'bg-white text-orange-600 shadow-lg shadow-orange-100 scale-105' 
                : 'text-orange-400 hover:text-orange-600 hover:bg-white/50'
            }`}
          >
            <Film size={20} />
            PHIM BỘ (SERIES)
          </button>
        </div>
      </div>

      {activeTab === 'expert' ? (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-orange-50 border border-orange-100 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Wand2 className="text-orange-500" />
              Chuyên gia Prompt
            </h2>
            <p className="text-slate-600">
              Nhập ý tưởng của bạn, AI sẽ tự động phân chia thành các cảnh 12 giây và tạo prompt chi tiết, đồng nhất về nhân vật và bối cảnh.
            </p>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-orange-600 uppercase tracking-wider">Chọn chủ đề phim (Có thể chọn nhiều)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {expertThemesList.map(theme => {
                  const isSelected = expertSelectedThemes.includes(theme.id);
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        if (isSelected) {
                          setExpertSelectedThemes(expertSelectedThemes.filter(id => id !== theme.id));
                          setExpertSelectedSubTopic('');
                        } else {
                          setExpertSelectedThemes([...expertSelectedThemes, theme.id]);
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100 scale-[1.02]' 
                          : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/50'
                      }`}
                    >
                      <span className="text-2xl mb-2">{theme.icon}</span>
                      <span className={`text-xs font-bold text-center uppercase tracking-wide ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>
                        {theme.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {expertSelectedThemes.length > 0 && (
              <div className="space-y-3 mt-6">
                <label className="block text-sm font-semibold text-orange-600 uppercase tracking-wider">Chọn ý tưởng nhỏ (Tiêu đề phụ)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {expertSubTopics[expertSelectedThemes[0]]?.map((subTopic, index) => (
                    <button
                      key={`${subTopic}-${index}`}
                      onClick={() => setExpertSelectedSubTopic(subTopic)}
                      className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                        expertSelectedSubTopic === subTopic
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300'
                      }`}
                    >
                      {subTopic}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={expertSelectedSubTopic}
                  onChange={(e) => setExpertSelectedSubTopic(e.target.value)}
                  placeholder="Hoặc nhập ý tưởng của riêng bạn..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-orange-500 outline-none"
                />
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="expertDialogueMode"
                    value="with_dialogue"
                    checked={expertDialogueMode === 'with_dialogue'}
                    onChange={() => setExpertDialogueMode('with_dialogue')}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Có thoại tiếng Việt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="expertDialogueMode"
                    value="no_dialogue"
                    checked={expertDialogueMode === 'no_dialogue'}
                    onChange={() => setExpertDialogueMode('no_dialogue')}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Không thoại</span>
                </label>
              </div>
              <button
                onClick={suggestExpertIdea}
                disabled={isGeneratingExpertIdea}
                className="bg-orange-100 text-orange-600 hover:bg-orange-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingExpertIdea ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Gợi ý ý tưởng ngẫu nhiên
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Ý tưởng của bạn là gì?</label>
              <textarea
                value={expertIdea}
                onChange={(e) => setExpertIdea(e.target.value)}
                placeholder="VD: Tôi muốn làm phim về anh Nam đi dạo ở Vinh và ghé vào quán cà phê làm việc..."
                className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Bạn muốn video dài bao nhiêu giây?</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={expertDuration}
                  onChange={(e) => setExpertDuration(parseInt(e.target.value) || 0)}
                  className="w-32 p-3 rounded-xl border-2 border-slate-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all text-center"
                  min="12"
                  step="12"
                />
                <span className="text-slate-500">giây (≈ {Math.ceil(expertDuration / 12)} cảnh)</span>
              </div>
            </div>

            <button
              onClick={analyzeExpertScript}
              disabled={isAnalyzingExpertScript || !expertIdea || expertDuration <= 0}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-medium shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzingExpertScript ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Đang phân tích kịch bản...
                </>
              ) : (
                <>
                  <ListOrdered size={20} />
                  Phân tích Nhân vật & Bối cảnh
                </>
              )}
            </button>
          </div>

          {expertStep >= 2 && (
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-orange-50 border border-orange-100 space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <User className="text-orange-500" />
                    Cài đặt Nhân vật
                  </h3>
                  <button
                    onClick={() => {
                      setExpertCharacters([...expertCharacters, { name: 'Nhân vật mới', outfitType: 'custom', outfitDescription: '' }]);
                    }}
                    className="bg-orange-100 text-orange-600 hover:bg-orange-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} /> Thêm nhân vật
                  </button>
                </div>
                {expertCharacters.length === 0 ? (
                  <p className="text-slate-500 italic">Không tìm thấy nhân vật nào trong kịch bản.</p>
                ) : (
                  <div className="grid gap-4">
                    {expertCharacters.map((char, index) => (
                      <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <input
                            type="text"
                            value={char.name}
                            onChange={(e) => {
                              const newChars = [...expertCharacters];
                              newChars[index].name = e.target.value;
                              setExpertCharacters(newChars);
                            }}
                            className="font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-400 focus:outline-none px-1 py-0.5"
                            placeholder="Tên nhân vật"
                          />
                          <button
                            onClick={() => {
                              const newChars = expertCharacters.filter((_, i) => i !== index);
                              setExpertCharacters(newChars);
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Xóa nhân vật"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <select
                            value={char.outfitType}
                            onChange={(e) => {
                              const newChars = [...expertCharacters];
                              newChars[index].outfitType = e.target.value;
                              setExpertCharacters(newChars);
                            }}
                            className="p-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                          >
                            <option value="cameo">Dùng trang phục cameo</option>
                            <option value="reference">Ảnh tham chiếu</option>
                            <option value="custom">Nhập mô tả tùy chọn</option>
                          </select>
                          {char.outfitType !== 'cameo' && (
                            <input
                              type="text"
                              value={char.outfitDescription}
                              onChange={(e) => {
                                const newChars = [...expertCharacters];
                                newChars[index].outfitDescription = e.target.value;
                                setExpertCharacters(newChars);
                              }}
                              placeholder={char.outfitType === 'reference' ? "Nhập URL ảnh hoặc mô tả ảnh" : "Mô tả chi tiết trang phục..."}
                              className="p-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="text-orange-500" />
                    Cài đặt Bối cảnh
                  </h3>
                  {expertSceneInputs.length > 1 && (
                    <button
                      onClick={() => {
                        const firstBg = expertSceneInputs[0]?.background;
                        if (!firstBg) {
                          toast.error("Vui lòng nhập bối cảnh cho cảnh 1 trước khi đồng bộ");
                          return;
                        }
                        const newScenes = expertSceneInputs.map(scene => ({
                          ...scene,
                          background: firstBg
                        }));
                        setExpertSceneInputs(newScenes);
                        toast.success("Đã đồng bộ bối cảnh cho tất cả các cảnh");
                      }}
                      className="text-sm bg-orange-100 text-orange-600 hover:bg-orange-200 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      Đồng bộ bối cảnh các cảnh
                    </button>
                  )}
                </div>
                <div className="grid gap-4">
                  {expertSceneInputs.map((scene, index) => (
                    <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap">
                        Cảnh {index + 1} ({scene.timeRange})
                      </span>
                      <input
                        type="text"
                        value={scene.background}
                        onChange={(e) => {
                          const newScenes = [...expertSceneInputs];
                          newScenes[index].background = e.target.value;
                          setExpertSceneInputs(newScenes);
                        }}
                        placeholder="Nhập bối cảnh (VD: Quán cà phê vintage, ánh sáng ấm áp...)"
                        className="flex-1 p-2 rounded-lg border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={generateExpertPrompt}
                disabled={isGeneratingExpert}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white py-4 rounded-xl font-medium shadow-lg shadow-orange-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingExpert ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Đang tạo Prompt...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Tạo Prompt Đồng nhất
                  </>
                )}
              </button>
            </div>
          )}

          {expertStep >= 3 && expertResult && expertResult.scenes && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" />
                Kết quả ({expertResult.scenes.length} cảnh)
              </h3>
              <div className="grid gap-6">
                {expertResult.scenes.map((scene: any, index: number) => (
                  <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        Cảnh {index + 1} ({scene.timeRange})
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt Tiếng Việt (Có thể chỉnh sửa)</label>
                        <button
                          onClick={() => translateScenePrompt(index)}
                          disabled={translatingIndex === index}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {translatingIndex === index ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Cập nhật bản dịch
                        </button>
                      </div>
                      <textarea
                        value={scene.promptVi}
                        onFocus={(e) => {
                          focusedPromptViRef.current = { index, value: e.target.value };
                        }}
                        onBlur={(e) => {
                          if (focusedPromptViRef.current?.index === index && focusedPromptViRef.current.value !== e.target.value) {
                            translateScenePrompt(index);
                          }
                          focusedPromptViRef.current = null;
                        }}
                        onChange={(e) => {
                          const newScenes = [...expertResult.scenes];
                          newScenes[index].promptVi = e.target.value;
                          setExpertResult({ ...expertResult, scenes: newScenes });
                        }}
                        className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none text-sm"
                      />
                    </div>

                    {expertDialogueMode === 'with_dialogue' && scene.dialogue && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lời thoại (Tiếng Việt)</label>
                        <textarea
                          value={scene.dialogue}
                          onFocus={(e) => {
                            focusedDialogueRef.current = { index, value: e.target.value };
                          }}
                          onBlur={(e) => {
                            if (focusedDialogueRef.current?.index === index && focusedDialogueRef.current.value !== e.target.value) {
                              translateScenePrompt(index);
                            }
                            focusedDialogueRef.current = null;
                          }}
                          onChange={(e) => {
                            const newScenes = [...expertResult.scenes];
                            newScenes[index].dialogue = e.target.value;
                            setExpertResult({ ...expertResult, scenes: newScenes });
                          }}
                          className="w-full h-16 p-3 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-50 transition-all resize-none text-sm bg-green-50/30"
                          placeholder="Nhập lời thoại cho cảnh này..."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt Tiếng Anh</label>
                          <button
                            onClick={() => copyToClipboard(scene.promptEn, `expert-prompt-en-${index}`)}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${copiedIds.includes(`expert-prompt-en-${index}`) ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-400 hover:text-orange-500'}`}
                            title="Copy Prompt Tiếng Anh"
                          >
                            {copiedIds.includes(`expert-prompt-en-${index}`) ? <><span className="text-[9px]">ĐÃ CHÉP</span><Check size={14} /></> : <Copy size={14} />}
                          </button>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-slate-700 font-mono text-xs leading-relaxed border border-slate-100 h-32 overflow-y-auto">
                          {scene.promptEn}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt Tiếng Trung</label>
                          <button
                            onClick={() => copyToClipboard(scene.promptZh, `expert-prompt-zh-${index}`)}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${copiedIds.includes(`expert-prompt-zh-${index}`) ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-400 hover:text-orange-500'}`}
                            title="Copy Prompt Tiếng Trung"
                          >
                            {copiedIds.includes(`expert-prompt-zh-${index}`) ? <><span className="text-[9px]">ĐÃ CHÉP</span><Check size={14} /></> : <Copy size={14} />}
                          </button>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-slate-700 font-mono text-xs leading-relaxed border border-slate-100 h-32 overflow-y-auto">
                          {scene.promptZh}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {series.length > 0 && (
        <div className="flex justify-end">
          <button 
            onClick={downloadAllPrompts}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm shadow-md"
            title="Tải xuống toàn bộ kịch bản"
          >
            <FileText size={20} />
            <span>Tải kịch bản</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-orange-50 border border-orange-100 space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-orange-600 uppercase tracking-wider px-2">
                  <Sparkles size={18} className="text-orange-500" /> Chọn chủ đề phim (Có thể chọn nhiều)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {expertThemesList.map(theme => {
                    const isSelected = seriesSelectedThemes.includes(theme.id);
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          if (isSelected) {
                            setSeriesSelectedThemes(seriesSelectedThemes.filter(id => id !== theme.id));
                            setSeriesSelectedSubTopic('');
                          } else {
                            setSeriesSelectedThemes([...seriesSelectedThemes, theme.id]);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100 scale-[1.02]' 
                            : 'border-slate-100 bg-slate-50 hover:border-orange-200 hover:bg-orange-50/50'
                        }`}
                      >
                        <span className="text-xl mb-1">{theme.icon}</span>
                        <span className={`text-[10px] font-bold text-center uppercase tracking-wide ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>
                          {theme.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {seriesSelectedThemes.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-orange-600 uppercase tracking-wider px-2">Chọn ý tưởng nhỏ (Tiêu đề phụ)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {expertSubTopics[seriesSelectedThemes[0]]?.map((subTopic, index) => (
                      <button
                        key={`${subTopic}-${index}`}
                        onClick={() => {
                          setSeriesSelectedSubTopic(subTopic);
                          setTopic(subTopic);
                        }}
                        className={`p-2 rounded-lg text-[10px] font-medium border transition-all ${
                          seriesSelectedSubTopic === subTopic
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300'
                        }`}
                      >
                        {subTopic}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={seriesSelectedSubTopic}
                    onChange={(e) => {
                      setSeriesSelectedSubTopic(e.target.value);
                      setTopic(e.target.value);
                    }}
                    placeholder="Hoặc nhập ý tưởng của riêng bạn..."
                    className="w-full p-3 bg-orange-50/50 border-2 border-orange-100 rounded-xl text-sm focus:border-orange-500 outline-none"
                  />
                </div>
              )}

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 px-2">
                  <Layers size={18} className="text-orange-500" /> Cấu hình Series ⚙️
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-orange-50/50 p-4 rounded-[2rem] border-2 border-orange-100 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                      <ListOrdered size={14} /> Số tập
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-2xl border border-orange-100 p-1.5 shadow-sm">
                      <button 
                        onClick={() => setEpisodeCount(Math.max(1, episodeCount - 1))}
                        className="p-2.5 hover:bg-orange-50 rounded-xl text-orange-500 transition-all"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm text-slate-700">{episodeCount}</span>
                      <button 
                        onClick={() => setEpisodeCount(Math.min(10, episodeCount + 1))}
                        className="p-2.5 hover:bg-orange-50 rounded-xl text-orange-500 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-[2rem] border-2 border-orange-100 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                      <Clock size={14} /> Giây/Tập
                    </div>
                    <div className="flex items-center justify-between bg-white rounded-2xl border border-orange-100 p-1.5 shadow-sm">
                      <button 
                        onClick={() => setEpisodeDuration(Math.max(12, episodeDuration - 12))}
                        className="p-2.5 hover:bg-orange-50 rounded-xl text-orange-500 transition-all"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm text-slate-700">{episodeDuration}s</span>
                      <button 
                        onClick={() => setEpisodeDuration(Math.min(600, episodeDuration + 12))}
                        className="p-2.5 hover:bg-orange-50 rounded-xl text-orange-500 transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={suggestStory}
                  disabled={isSuggesting || !topic}
                  className="w-full py-5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white rounded-[2rem] transition-all flex items-center justify-center gap-3 text-sm shadow-xl shadow-orange-200 disabled:shadow-none"
                >
                  {isSuggesting ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  <span>TẠO CỐT TRUYỆN ✨</span>
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 px-2">
                  <BookOpen size={18} className="text-orange-500" /> Cốt truyện ban đầu 📖
                </label>
                <textarea 
                  value={mainStory}
                  onChange={(e) => setMainStory(e.target.value)}
                  placeholder="Nhập ý tưởng hoặc cốt truyện ngắn gọn của bạn..."
                  className="w-full p-6 bg-orange-50/50 border-2 border-orange-100 rounded-[2.5rem] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:outline-none transition-all text-sm min-h-[120px] resize-none font-medium leading-relaxed"
                />
                <button
                  onClick={expandStory}
                  disabled={isExpandingStory || !mainStory}
                  className="w-full py-5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white rounded-[2rem] transition-all flex items-center justify-center gap-3 text-sm shadow-xl shadow-amber-200 disabled:shadow-none"
                >
                  {isExpandingStory ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  <span>PHÁT TRIỂN CỐT TRUYỆN 🚀</span>
                </button>
              </div>

              {workflowStep >= 1 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-4 border-t border-slate-100"
                >
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <Film size={16} className="text-violet-500" /> Cốt truyện chi tiết (Có thể sửa)
                  </label>
                  <textarea 
                    value={fullStory}
                    onChange={(e) => {
                      setFullStory(e.target.value);
                      autoResize(e);
                    }}
                    className="w-full p-4 bg-violet-50 border border-violet-100 rounded-2xl text-xs text-slate-600 leading-relaxed min-h-[150px] focus:ring-2 focus:ring-violet-500 outline-none transition-all custom-scrollbar italic resize-none"
                  />
                  <button
                    onClick={splitEpisodes}
                    disabled={isSplittingEpisodes}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-100 disabled:shadow-none"
                  >
                    {isSplittingEpisodes ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                    <span>Chia tập phim</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {workflowStep >= 2 && series.length > 0 && (
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs text-slate-400 uppercase tracking-widest">Danh sách {series.length} tập</h3>
                <button onClick={resetJimeng} className="text-slate-400 hover:text-red-500 transition-all">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {series.map((ep, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentEpisodeIndex(idx)}
                    className={`w-full text-left p-3 rounded-2xl transition-all border ${
                      currentEpisodeIndex === idx 
                        ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-200' 
                        : 'bg-slate-50 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${
                        currentEpisodeIndex === idx ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${currentEpisodeIndex === idx ? 'text-violet-700' : 'text-slate-700'}`}>
                          {ep.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{ep.summary}</p>
                      </div>
                      {ep.scenes?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {currentEpisode ? (
              <motion.div
                key={currentEpisodeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-xl shadow-orange-50 border border-orange-100">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-lg shadow-orange-100">Tập {currentEpisodeIndex + 1} 🎬</span>
                        <input 
                          type="text"
                          value={currentEpisode.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSeries(prev => {
                              const updated = [...prev];
                              updated[currentEpisodeIndex].title = val;
                              return updated;
                            });
                          }}
                          className="text-3xl text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300"
                          placeholder="Tiêu đề tập phim..."
                        />
                      </div>
                      <textarea 
                        value={currentEpisode.summary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSeries(prev => {
                            const updated = [...prev];
                            updated[currentEpisodeIndex].summary = val;
                            return updated;
                          });
                          autoResize(e);
                        }}
                        placeholder="Tóm tắt nội dung tập phim này..."
                        className="text-base text-slate-500 leading-relaxed bg-transparent border-none focus:ring-0 p-0 w-full resize-none auto-resize overflow-hidden font-medium italic"
                      />
                    </div>
                    <button
                      onClick={() => splitScenes(currentEpisodeIndex)}
                      disabled={isSplittingScenes}
                      className="w-full md:w-auto px-8 py-4 bg-orange-600 text-white text-sm rounded-[2rem] hover:bg-orange-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-200 disabled:shadow-none disabled:bg-slate-200 group"
                    >
                      {isSplittingScenes ? <Loader2 size={20} className="animate-spin" /> : <Split size={20} className="group-hover:rotate-180 transition-transform duration-500" />}
                      CHIA CẢNH (12s) ✨
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                        <label className="text-[10px] text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <Shirt size={14} className="text-orange-500" /> Trang phục nhân vật
                        </label>
                        <div className="flex bg-orange-50 p-1.5 rounded-2xl gap-1 border border-orange-100">
                          <button 
                            onClick={() => setCostumeType('custom')}
                            className={`px-4 py-2 rounded-xl text-[10px] transition-all flex items-center gap-2 ${
                              costumeType === 'custom' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-orange-400'
                            }`}
                          >
                            <User size={14} /> Tùy chọn
                          </button>
                          <button 
                            onClick={() => setCostumeType('reference')}
                            className={`px-4 py-2 rounded-xl text-[10px] transition-all flex items-center gap-2 ${
                              costumeType === 'reference' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-orange-400'
                            }`}
                          >
                            <ImageIcon size={14} /> Ảnh mẫu
                          </button>
                          <button 
                            onClick={() => setCostumeType('cameo_default')}
                            className={`px-4 py-2 rounded-xl text-[10px] transition-all flex items-center gap-2 ${
                              costumeType === 'cameo_default' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-orange-400'
                            }`}
                          >
                            <Lock size={14} /> Cameo
                          </button>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {costumeType === 'custom' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                          >
                            <input 
                              type="text"
                              value={costume}
                              onChange={(e) => setCostume(e.target.value)}
                              placeholder="Ví dụ: ANH CHỒNG mặc áo thun trắng, CHỊ VỢ mặc váy hoa..."
                              className="w-full p-5 bg-orange-50/30 border-2 border-orange-100 rounded-[2rem] text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-slate-300"
                            />
                          </motion.div>
                        )}
                        {costumeType === 'reference' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-5 bg-orange-50 border-2 border-orange-100 rounded-[2rem] flex items-center gap-4 group cursor-pointer hover:bg-orange-100/50 transition-colors"
                          >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                              <ImageIcon size={24} />
                            </div>
                            <div>
                              <p className="text-sm text-orange-700">Ảnh trang phục tham chiếu 📸</p>
                              <p className="text-[11px] text-orange-500">AI sẽ tự phân tích trang phục từ ảnh Jimeng.</p>
                            </div>
                          </motion.div>
                        )}
                        {costumeType === 'cameo_default' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center gap-4"
                          >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                              <Lock size={24} />
                            </div>
                            <div>
                              <p className="text-sm text-slate-700">Đã khóa trang phục Cameo 🔒</p>
                              <p className="text-[11px] text-slate-400">Sử dụng trang phục gốc để đảm bảo nhất quán.</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                          <MapPin size={14} className="text-orange-500" /> Bối cảnh & Không gian
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer p-2 bg-orange-50 hover:bg-orange-100 rounded-xl text-orange-500 transition-all border border-orange-100 shadow-sm" title="Tải ảnh bối cảnh tham chiếu">
                            <Camera size={16} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setSeries(prev => {
                                      const updated = [...prev];
                                      updated[currentEpisodeIndex].backgroundImage = reader.result as string;
                                      return updated;
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {currentEpisode.backgroundImage && (
                            <button 
                              onClick={() => {
                                setSeries(prev => {
                                  const updated = [...prev];
                                  updated[currentEpisodeIndex].backgroundImage = null;
                                  return updated;
                                });
                              }}
                              className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all border border-red-100 shadow-sm"
                              title="Xóa ảnh bối cảnh"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                          {series.length > 1 && (
                            <button
                              onClick={() => {
                                setSeries(prev => {
                                  return prev.map(ep => ({
                                    ...ep,
                                    setting: currentEpisode.setting,
                                    backgroundImage: currentEpisode.backgroundImage
                                  }));
                                });
                                toast.success("Đã đồng bộ bối cảnh cho tất cả các tập");
                              }}
                              className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 shadow-sm flex items-center gap-1"
                              title="Đồng bộ bối cảnh cho tất cả các tập"
                            >
                              <RefreshCw size={16} />
                              <span className="text-xs font-medium pr-1">Đồng bộ</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative group">
                        <textarea 
                          value={currentEpisode.setting}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSeries(prev => {
                              const updated = [...prev];
                              updated[currentEpisodeIndex].setting = val;
                              return updated;
                            });
                          }}
                          placeholder="Mô tả bối cảnh chung của tập phim này..."
                          className="w-full p-5 bg-orange-50/30 border-2 border-orange-100 rounded-[2rem] text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all min-h-[52px] resize-none placeholder:text-slate-300"
                        />
                        {currentEpisode.backgroundImage && (
                          <div className="absolute right-3 bottom-3 w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-orange-100">
                            <img src={currentEpisode.backgroundImage} className="w-full h-full object-cover" alt="BG Ref" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentEpisode.scenes?.length > 0 ? (
                    <div className="space-y-8">
                      <h4 className="text-[10px] text-slate-400 uppercase tracking-[0.4em] px-4 flex items-center gap-2">
                        <List size={14} className="text-orange-500" /> Danh sách cảnh quay 🎬
                      </h4>
                      <div className="grid grid-cols-1 gap-6">
                        {currentEpisode.scenes.map((scene: any, sIdx: number) => (
                          <div key={sIdx} className="bg-orange-50/30 border-2 border-orange-100 rounded-[2.5rem] p-8 space-y-6 hover:shadow-lg hover:shadow-orange-50 transition-all group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                                  {sIdx + 1}
                                </span>
                                <span className="text-[10px] text-orange-600 uppercase tracking-widest">Cảnh {sIdx + 1} (12s) ⏱️</span>
                              </div>
                              <button
                                onClick={() => generateScenePrompt(currentEpisodeIndex, sIdx)}
                                disabled={isTranslating}
                                className="px-5 py-2.5 bg-orange-600 text-white text-[10px] rounded-xl hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-100 disabled:bg-slate-200 disabled:shadow-none"
                              >
                                {isTranslating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                TẠO PROMPT ✨
                              </button>
                            </div>
                            <textarea 
                              value={scene.description}
                              onChange={(e) => {
                                const updatedSeries = [...series];
                                updatedSeries[currentEpisodeIndex].scenes[sIdx].description = e.target.value;
                                setSeries(updatedSeries);
                                autoResize(e);
                              }}
                              placeholder="Mô tả hành động trong cảnh này..."
                              className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-slate-700 leading-relaxed italic resize-none overflow-hidden placeholder:text-slate-300"
                              rows={1}
                              onFocus={autoResize}
                            />

                            <div className="bg-white/80 rounded-2xl p-4 border-2 border-orange-100 flex items-start gap-4 shadow-sm">
                              <MapPin size={18} className="text-orange-400 mt-1 shrink-0" />
                              <textarea 
                                value={scene.setting}
                                onChange={(e) => {
                                  const updatedSeries = [...series];
                                  updatedSeries[currentEpisodeIndex].scenes[sIdx].setting = e.target.value;
                                  setSeries(updatedSeries);
                                  autoResize(e);
                                }}
                                placeholder="Bối cảnh & Không gian riêng cho cảnh này..."
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-slate-500 font-medium leading-relaxed resize-none overflow-hidden placeholder:text-slate-300"
                                rows={1}
                                onFocus={autoResize}
                              />
                            </div>
                            
                            {scene.imageUrl && (
                              <div className="relative group rounded-3xl overflow-hidden border-4 border-white shadow-xl aspect-video bg-slate-100 ring-1 ring-orange-100">
                                <img 
                                  src={scene.imageUrl} 
                                  alt={`Scene ${sIdx + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-orange-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <button 
                                    onClick={() => generateSceneImage(currentEpisodeIndex, sIdx)}
                                    className="bg-white text-orange-600 px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                                  >
                                    <RefreshCw size={16} className={isGeneratingImage === `${currentEpisodeIndex}-${sIdx}` ? 'animate-spin' : ''} />
                                    LÀM MỚI ẢNH 📸
                                  </button>
                                </div>
                              </div>
                            )}

                            {scene.prompt && (
                              <div className="bg-slate-900 rounded-[2rem] p-6 space-y-6 border-4 border-slate-800 shadow-2xl">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center px-2">
                                    <span className="text-[9px] text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" /> Vietnamese (Editable)
                                    </span>
                                    <div className="flex items-center gap-3">
                                      {isSyncing === `${currentEpisodeIndex}-${sIdx}` && <Loader2 size={12} className="animate-spin text-orange-400" />}
                                      <button 
                                        onClick={() => syncTranslations(currentEpisodeIndex, sIdx, scene.prompt.vi)}
                                        disabled={!!isSyncing}
                                        className="p-2 text-slate-500 hover:text-orange-400 transition-all hover:bg-slate-800 rounded-lg"
                                        title="Đồng bộ sang EN/ZH"
                                      >
                                        <RefreshCw size={14} />
                                      </button>
                                      <button onClick={() => copyToClipboard(scene.prompt.vi, `vi-${sIdx}`)} className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${copiedIds.includes(`vi-${sIdx}`) ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
                                        {copiedIds.includes(`vi-${sIdx}`) ? <><span className="text-[9px]">ĐÃ CHÉP</span><Check size={14} /></> : <Copy size={14} />}
                                      </button>
                                    </div>
                                  </div>
                                    <textarea 
                                      value={scene.prompt.vi}
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        const updatedSeries = [...series];
                                        updatedSeries[currentEpisodeIndex].scenes[sIdx].prompt.vi = text;
                                        setSeries(updatedSeries);
                                        
                                        // Auto-sync
                                        const key = `${currentEpisodeIndex}-${sIdx}`;
                                        if (seriesSyncTimers.current[key]) clearTimeout(seriesSyncTimers.current[key]);
                                        seriesSyncTimers.current[key] = setTimeout(() => {
                                          if (lastSyncedVi.current[key] !== text) {
                                            syncTranslations(currentEpisodeIndex, sIdx, text);
                                            lastSyncedVi.current[key] = text;
                                          }
                                        }, 2000);
                                      }}
                                      className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 text-xs text-slate-300 font-medium leading-relaxed focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none resize-none min-h-[100px] transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[9px] text-blue-400 uppercase tracking-widest">English 🇺🇸</span>
                                      <div className="flex items-center gap-2">
                                        {!scene.imageUrl && (
                                          <button 
                                            onClick={() => generateSceneImage(currentEpisodeIndex, sIdx)}
                                            disabled={!!isGeneratingImage}
                                            className="p-1.5 text-orange-500 hover:text-orange-400 transition-all hover:bg-slate-800 rounded-lg"
                                            title="Tạo ảnh minh họa"
                                          >
                                            {isGeneratingImage === `${currentEpisodeIndex}-${sIdx}` ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                          </button>
                                        )}
                                        <button onClick={() => copyToClipboard(scene.prompt.en, `en-${sIdx}`)} className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${copiedIds.includes(`en-${sIdx}`) ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
                                          {copiedIds.includes(`en-${sIdx}`) ? <><span className="text-[9px]">ĐÃ CHÉP</span><Check size={14} /></> : <Copy size={14} />}
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-3 italic">{scene.prompt.en}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                      <span className="text-[9px] text-red-400 uppercase tracking-widest">Chinese 🇨🇳</span>
                                      <button onClick={() => copyToClipboard(scene.prompt.zh, `zh-${sIdx}`)} className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${copiedIds.includes(`zh-${sIdx}`) ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
                                        {copiedIds.includes(`zh-${sIdx}`) ? <><span className="text-[9px]">ĐÃ CHÉP</span><Check size={14} /></> : <Copy size={14} />}
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-3 italic">{scene.prompt.zh}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-96 border-4 border-dashed border-orange-100 rounded-[4rem] flex flex-col items-center justify-center text-slate-400 gap-8 bg-orange-50/20 transition-all hover:bg-orange-50/40 group">
                      <div className="bg-white p-8 rounded-full shadow-xl border border-orange-100 group-hover:scale-110 transition-transform duration-500">
                        <Camera size={64} className="text-orange-300" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg text-slate-600">Sẵn sàng chia cảnh 🎬</p>
                        <p className="text-sm text-slate-400 font-medium">Bấm nút "CHIA CẢNH (12s)" phía trên để bắt đầu ✨</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 space-y-8 bg-orange-50/10 rounded-[4rem] border-4 border-dashed border-orange-100 transition-all hover:bg-orange-50/20 group">
                <div className="bg-white p-8 rounded-full shadow-xl border border-orange-50 group-hover:rotate-12 transition-transform duration-500">
                  <Film size={48} className="text-orange-200" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg text-slate-600">Chưa có kịch bản chi tiết 📝</p>
                  <p className="text-sm text-slate-400 font-medium">Vui lòng phát triển cốt truyện và chia tập ở cột bên trái ✨</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )}
</div>
);
};

export default JimengAI;
