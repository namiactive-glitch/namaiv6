import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Character, GeneratedData, ScriptTone, ImageAsset, InteractionMode } from "../types";
import { getAllValidKeys, markKeyAsFailed, getAiClient } from "./keyService";

const getAI = (apiKey?: string) => {
  return getAiClient(apiKey);
};
export const withRetry = async <T>(fn: (ai: any) => Promise<T>, apiKey?: string, maxRetries = 3): Promise<T> => {
  let lastError: any;
  const keys = apiKey ? [apiKey] : getAllValidKeys();
  const retryLimit = Math.max(maxRetries, keys.length);

  for (let i = 0; i < retryLimit; i++) {
    const currentKey = i < keys.length ? keys[i] : keys[keys.length - 1];
    const ai = getAI(currentKey);
    try {
      return await fn(ai);
    } catch (error: any) {
      lastError = error;
      const errorStr = error.message || String(error);
      if (errorStr.includes("429") || errorStr.includes("403") || errorStr.toLowerCase().includes("quota") || errorStr.toLowerCase().includes("resource_exhausted") || errorStr.toLowerCase().includes("permission_denied")) {
        console.warn(`API Key ${currentKey.substring(0, 8)}... failed, rotating to next key.`);
        markKeyAsFailed(currentKey);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const optimizeTTSPrompt = async (
  text: string, 
  voiceName: string, 
  voiceDesc: string, 
  styleInstruction: string,
  speed: number,
  apiKey?: string
): Promise<string> => {
  return withRetry(async (ai) => {
    const prompt = `
      Bạn là một chuyên gia đạo diễn âm thanh và kỹ thuật viên TTS (Text-to-Speech).
      Nhiệm vụ của bạn là tối ưu hóa "Style Instruction" cho mô hình Gemini TTS để đọc đoạn văn bản sau một cách tự nhiên và biểu cảm nhất.

      Văn bản cần đọc: "${text}"
      Tên giọng đọc: "${voiceName}"
      Mô tả giọng: "${voiceDesc}"
      Hướng dẫn phong cách hiện tại: "${styleInstruction}"
      Tốc độ yêu cầu: ${speed}x

      Yêu cầu:
      - Phân tích nội dung văn bản để xác định cảm xúc (vui, buồn, kịch tính, trang trọng...).
      - Tạo một câu hướng dẫn phong cách (Style Instruction) bằng tiếng Việt cực kỳ chi tiết, bao gồm: cách ngắt nghỉ, tông giọng, cảm xúc chủ đạo, và các lưu ý về nhấn nhá.
      - Hướng dẫn phải giúp AI hiểu được ngữ cảnh của đoạn văn.
      - Chỉ trả về duy nhất câu hướng dẫn đó, không thêm bất kỳ lời giải thích nào khác.
      - Ví dụ output: "Đọc với giọng hào hứng, tốc độ nhanh ở đầu câu và chậm lại ở cuối câu để tạo sự bất ngờ, nhấn mạnh vào các tính từ..."
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || styleInstruction;
  }, apiKey);
};

export const generateSpeech = async ({ text, voiceId, speed = 1.0, apiKey }: { text: string, voiceId: string, speed?: number, apiKey?: string }): Promise<string> => {
  return withRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceId as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
    if (!base64Audio) throw new Error("Không nhận được dữ liệu âm thanh từ AI.");
    return base64Audio;
  }, apiKey);
};

export const generateVirtualTryOn = async (
  modelImage: ImageAsset,
  description: string,
  lighting: string,
  filter: string,
  beautyOptions: string[],
  productImage?: ImageAsset,
  interactionMode: InteractionMode = 'wear',
  customBackground: string = '',
  extraOutfit?: ImageAsset,
  customPose: string = '',
  variationIndex: number = 0,
  backgroundImage?: ImageAsset,
  apiKey?: string
): Promise<string | null> => {
  return withRetry(async (ai) => {
    const parts: any[] = [];
    
    // Add model image
    parts.push({
      inlineData: {
        mimeType: modelImage.mimeType,
        data: modelImage.base64
      }
    });

    // Add product image
    if (productImage) {
      parts.push({
        inlineData: {
          mimeType: productImage.mimeType,
          data: productImage.base64
        }
      });
    }

    // Add extra outfit if holding
    if (interactionMode === 'hold' && extraOutfit) {
      parts.push({
        inlineData: {
          mimeType: extraOutfit.mimeType,
          data: extraOutfit.base64
        }
      });
    }

    // Add background image if provided
    if (backgroundImage) {
      parts.push({
        inlineData: {
          mimeType: backgroundImage.mimeType,
          data: backgroundImage.base64
        }
      });
    }

    const prompt = `
      Bạn là một chuyên gia chỉnh sửa ảnh thời trang AI cao cấp.
      Nhiệm vụ: Tạo ra một bức ảnh người mẫu đang ${interactionMode === 'wear' ? 'mặc' : 'cầm/sử dụng'} sản phẩm được cung cấp.
      
      Yêu cầu chi tiết:
      - Giữ nguyên khuôn mặt và vóc dáng của người mẫu từ ảnh tham khảo.
      - ${interactionMode === 'wear' 
          ? 'Người mẫu phải mặc bộ trang phục được cung cấp một cách tự nhiên, vừa vặn.' 
          : 'Người mẫu phải cầm/sử dụng sản phẩm được cung cấp một cách chuyên nghiệp.'}
      - Tư thế: ${customPose || 'Tự nhiên, chuyên nghiệp như chụp ảnh lookbook'}
      - Bối cảnh: ${backgroundImage ? 'Sử dụng bối cảnh từ hình ảnh bối cảnh được cung cấp.' : (customBackground || 'Studio tối giản, sang trọng')}
      - Ánh sáng: ${lighting}
      - Bộ lọc màu: ${filter}
      - Hiệu ứng làm đẹp: ${beautyOptions.join(', ')}
      - Biến thể: Đây là phiên bản số ${variationIndex + 1}. Hãy tạo ra sự khác biệt nhẹ về góc chụp hoặc biểu cảm để người dùng có nhiều lựa chọn.
      
      Chất lượng: Photorealistic, 8k, cực kỳ chi tiết, không có lỗi về giải phẫu người (ngón tay, khớp xương).
      TUYỆT ĐỐI KHÔNG CÓ CHỮ, LOGO LẠ, HOẶC CÁC CHI TIẾT THỪA.
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });

    const base64 = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
    return base64 ? `data:image/png;base64,${base64}` : null;
  }, apiKey);
};

export const isolateClothingItem = async (image: ImageAsset, apiKey?: string): Promise<string | null> => {
  return withRetry(async (ai) => {
    const prompt = "Hãy tách vật thể chính (quần áo, phụ kiện) ra khỏi nền. Trả về hình ảnh vật thể đó trên nền trắng tinh khiết hoặc nền trong suốt (nếu có thể). Chỉ trả về hình ảnh, không có chữ.";
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: image.mimeType, data: image.base64 } },
          { text: prompt }
        ]
      }
    });

    const base64 = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
    return base64 ? `data:image/png;base64,${base64}` : null;
  }, apiKey);
};

export const generateSpeechStream = async ({ text, voiceId, apiKey }: { text: string, voiceId: string, apiKey?: string }) => {
  return withRetry(async (ai) => {
    return ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceId as any },
          },
        },
      },
    });
  }, apiKey);
};

export const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    try {
      // Try standard decoding first (in case it's a WAV or other format)
      return await ctx.decodeAudioData(bytes.buffer.slice(0));
    } catch (e) {
      console.warn("Standard decodeAudioData failed, attempting raw PCM decoding as fallback.");
      
      // Fallback for raw PCM (16-bit, mono, 24kHz) which is the default for Gemini 2.5 TTS
      const sampleRate = 24000;
      const numSamples = Math.floor(bytes.length / 2);
      const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(bytes.buffer);
      
      for (let i = 0; i < numSamples; i++) {
        // 16-bit signed PCM is from -32768 to 32767
        // Use little-endian as it's standard for PCM
        const sample = dataView.getInt16(i * 2, true);
        // Convert to float from -1.0 to 1.0
        channelData[i] = sample / 32768;
      }
      return audioBuffer;
    }
  } catch (error) {
    console.error("Error in decodeAudioData:", error);
    throw new Error("Unable to decode audio data: " + (error instanceof Error ? error.message : String(error)));
  }
};

export const renderBufferAtSpeed = async (buffer: AudioBuffer, speed: number): Promise<AudioBuffer> => {
  if (speed === 1.0) return buffer;
  
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(buffer.length / speed),
    buffer.sampleRate
  );
  
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  source.connect(offlineCtx.destination);
  source.start(0);
  
  return await offlineCtx.startRendering();
};

export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const buffer_out = new ArrayBuffer(length);
  const view = new DataView(buffer_out);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
  }

  return new Blob([buffer_out], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

export const suggestTopic = async (parentTheme: string, characters: Character[], apiKey?: string): Promise<string[]> => {
  return withRetry(async (ai) => {
    const isGeneric = parentTheme.toLowerCase().includes("tùy chọn") || parentTheme.toLowerCase().includes("custom");
    
    const context = isGeneric 
      ? "bất kỳ chủ đề nào đang cực kỳ thịnh hành (Trending/Hot Trend) trên TikTok/Shorts hiện nay" 
      : `lĩnh vực chủ đề: "${parentTheme}"`;

    const charInfo = characters
      .filter(c => c.name.trim() !== '')
      .map((c, i) => `${i + 1}. ${c.name} (${c.role}) - ${c.description || 'Chưa có mô tả'}`)
      .join('\n    ');

    const promptText = `
      Bạn là một chuyên gia sáng tạo nội dung Viral Video (TikTok/Shorts).
      
      Thông tin các nhân vật tham gia:
      ${charInfo}
      
      Nhiệm vụ: Dựa vào đặc điểm cụ thể của các nhân vật trên, hãy gợi ý 5 (năm) chủ đề con cụ thể, giật gân, thú vị thuộc ${context}.
      
      Yêu cầu:
      - Nội dung phải được cá nhân hóa, phù hợp với tính cách/ngoại hình nhân vật.
      - Phải ngắn gọn (dưới 10 từ) bằng TIẾNG VIỆT.
      - Phải có tính "Clickbait" văn minh, gây tò mò hoặc đánh trúng tâm lý người xem.
      - KHÔNG sử dụng dấu ngoặc kép.
      - Trả về kết quả dưới dạng danh sách, mỗi chủ đề một dòng. Không có số thứ tự hay lời dẫn.
    `;

    const parts: any[] = [];

    characters.forEach(char => {
      if (char.image && char.image.startsWith('data:image')) {
        const matches = char.image.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }
    });

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
    });
    
    const text = response.text || "";
    return text.split('\n').map(s => s.trim()).filter(s => s !== '');
  }, apiKey);
};

export const suggestSituations = async (parentTheme: string, topic: string, characters: Character[], apiKey?: string): Promise<string[]> => {
  return withRetry(async (ai) => {
    const charInfo = characters
      .filter(c => c.name.trim() !== '')
      .map((c, i) => `${i + 1}. ${c.name} (${c.role}) - ${c.description || 'Chưa có mô tả'}`)
      .join('\n    ');

    const promptText = `
      Bạn là một chuyên gia sáng tạo nội dung Viral Video (TikTok/Shorts).
      
      Thông tin các nhân vật tham gia:
      ${charInfo}
      
      Chủ đề chính: ${parentTheme}
      Chủ đề cụ thể: ${topic}
      
      Nhiệm vụ: Dựa vào đặc điểm của các nhân vật và chủ đề trên, hãy gợi ý 3 (ba) tình huống (situations) cụ thể, hài hước hoặc kịch tính để làm video ngắn.
      
      Yêu cầu:
      - Mỗi tình huống phải có mâu thuẫn hoặc điểm nhấn gây cười/bất ngờ.
      - Phải ngắn gọn (dưới 30 từ) bằng TIẾNG VIỆT.
      - Phù hợp với tính cách nhân vật.
      - Trả về kết quả dưới dạng danh sách, mỗi tình huống một dòng. Không có số thứ tự hay lời dẫn.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptText,
    });
    
    const text = response.text || "";
    return text.split('\n').map(s => s.trim()).filter(s => s !== '');
  }, apiKey);
};

export const generateScriptAndPrompts = async (
  characters: Character[],
  themeLabel: string,
  styleId: string,
  scriptTone: ScriptTone,
  customScript: string = "",
  duration: string = "30 giây",
  dialogueMode: string = 'both',
  pronounPreference: string = "",
  generalContext: string = "",
  characterStyles: Record<string, string> = {},
  apiKey?: string
): Promise<GeneratedData> => {
  return withRetry(async (ai) => {
    const activeChars = characters.filter(c => c.name.trim() !== '');
    
    let styleDescription = "";
    let promptPrefix = "";
    let characterDirectives = "";

    const getStyleTerm = (s: string) => s === 'realistic' ? "Photorealistic 4k" : "High-end 3D Pixar Animation 4k";

    if (styleId === 'mixed') {
       styleDescription = "MIXED VISUAL STYLE: Each character has a specific individual style.";
       promptPrefix = "Cinematic 4k video, Mixed Media Style, UHD";
       characterDirectives = activeChars.map(c => {
          const s = characterStyles[c.name] || '3d_animation';
          return `- Describe ${c.name} as: [${getStyleTerm(s)} style, gender: ${c.voiceGender}, age: ${c.voiceAge}, visual: ${c.description}]. ALWAYS wear this exact outfit.`;
       }).join('\n');
    } else {
       styleDescription = styleId === "realistic"
        ? "Cinematic Realistic, 4k, UHD, highly detailed, natural lighting, photorealistic textures"
        : "High-end 3D Animation, Pixar style, Disney style, 4k render, cute but detailed";
       
       promptPrefix = styleId === "realistic" ? "Cinematic 4k video, Photorealistic, UHD" : "Cinematic 4k video, 3D Animation, Pixar Style, UHD, Masterpiece";
       characterDirectives = activeChars.map(c => 
          `- Describe ${c.name} as: [gender: ${c.voiceGender}, age: ${c.voiceAge}, visual: ${c.description}]. ALWAYS wear this exact outfit.`
       ).join('\n');
    }

    const charDetails = activeChars.map((c, i) => 
      `- Nhân vật ${String.fromCharCode(65 + i)}: "${c.name}", vai trò: "${c.role}", KIỂU GIỌNG: "${c.voiceType}", VÙNG MIỀN: "${c.voiceRegion}", GIỚI TÍNH: "${c.voiceGender}", ĐỘ TUỔI: "${c.voiceAge}", MÔ TẢ NGOẠI HÌNH: "${c.description}".`
    ).join('\n');

    const promptText = `
      Bạn là một ĐẠO DIỄN PHIM HOLLYWOOD lừng danh, nổi tiếng với khả năng tạo ra những thước phim mãn nhãn, chân thật và giàu cảm xúc. 
      Nhiệm vụ của bạn là viết kịch bản và mô tả cảnh quay (prompts) cho video AI (Google VEO).

      QUY ĐỊNH NGHIÊM NGẶT VỀ THỜI LƯỢNG VÀ CẤU TRÚC PROMPT:
      1. THỜI LƯỢNG 12 GIÂY: Mỗi cảnh quay (shot) trong "veo_prompts" tương ứng với 12 giây video.
      2. CẤU TRÚC PROMPT CHI TIẾT THEO THỜI GIAN: Trong phần "prompt" (Tiếng Anh), bạn PHẢI chia nhỏ hành động của TỪNG NHÂN VẬT theo các mốc thời gian sau:
         - 0-3 seconds: [Hành động chi tiết của từng nhân vật]
         - 3-6 seconds: [Hành động chi tiết của từng nhân vật]
         - 6-9 seconds: [Hành động chi tiết của từng nhân vật]
         - 9-12 seconds: [Hành động chi tiết của từng nhân vật]
         Mô tả phải cực kỳ điện ảnh (Cinematic), chi tiết về biểu cảm khuôn mặt, cử chỉ tay, ánh mắt và sự tương tác với môi trường.
      3. LỜI THOẠI (dialogue_segment): Phải có độ dài phù hợp để nói trong khoảng 12 giây (khoảng 25-35 từ tiếng Việt).
      4. AN TOÀN NỘI DUNG (SAFETY): Tuyệt đối không tạo các mô tả gây hại, nhạy cảm hoặc nguy hiểm. 
         - Tránh: "shouting in rage", "violent", "screaming", "suffering".
         - Thay bằng: "intense emotional expression", "passionate speaking", "dynamic gestures", "high-end cinematic lighting".
      5. NGÔN NGỮ: "dialogue_segment" PHẢI là TIẾNG VIỆT. Prompt mô tả hình ảnh PHẢI là TIẾNG ANH.
      6. ĐỒNG NHẤT: Nhân vật mặc đúng một bộ trang phục xuyên suốt các cảnh.
      7. QUỐC GIA/DÂN TỘC: Tuân thủ TUYỆT ĐỐI các mô tả về đặc điểm nhân chủng học để tạo ra hình ảnh và bối cảnh phù hợp văn hóa.

      Thông tin đầu vào:
      ${charDetails}
      Bối cảnh chung: ${generalContext}
      Style: "${styleDescription}"
      Tone chủ đạo: "${scriptTone.label}". Hướng dẫn: ${scriptTone.instruction}
      Thời lượng tổng: ${duration}
      ${customScript ? `Kịch bản gốc: ${customScript}` : `Chủ đề: ${themeLabel}`}
      ${pronounPreference ? `Xưng hô: ${pronounPreference}` : ""}

      Yêu cầu JSON Output:
      - "title": Tiêu đề video hấp dẫn.
      - "synopsis": Tóm tắt nội dung.
      - "script": Mảng các đối tượng { character, dialogue, action } bằng TIẾNG VIỆT.
      - "veo_prompts": Mảng các cảnh quay 12 giây. 
         + "dialogue_segment": Lời thoại TIẾNG VIỆT (khoảng 30 từ).
         + "prompt": Mô tả hình ảnh TIẾNG ANH theo phong cách ĐẠO DIỄN HOLLYWOOD, chia theo 4 mốc thời gian (0-3s, 3-6s, 6-9s, 9-12s). Bao gồm câu: "The character is performing the following dialogue in Vietnamese: '[dialogue_segment]'"
      - "sound_design": Music và SFX phù hợp.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character: { type: Type.STRING },
                  dialogue: { type: Type.STRING },
                  action: { type: Type.STRING },
                },
                required: ["character", "dialogue", "action"],
              },
            },
            sound_design: {
              type: Type.OBJECT,
              properties: {
                music: { type: Type.STRING },
                sfx: { type: Type.STRING },
              },
              required: ["music", "sfx"],
            },
            veo_prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  dialogue_segment: { type: Type.STRING },
                  prompt: { 
                    type: Type.STRING,
                    description: "Detailed cinematic prompt in English, broken down into 0-3s, 3-6s, 6-9s, 9-12s segments."
                  },
                },
                required: ["type", "prompt", "dialogue_segment"],
              },
            },
          },
          required: ["title", "synopsis", "script", "veo_prompts", "sound_design"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedData;
    }
    
    throw new Error("No response from Gemini");
  }, apiKey);
};

export const generateImage = async (
  prompt: string, 
  referenceImages?: (string | null)[], 
  styleId: string = '3d_animation', 
  characterStyles: Record<string, string> = {},
  apiKey?: string
): Promise<string> => {
  return withRetry(async (ai) => {
    const performGeneration = async (useRefs: boolean) => {
      const parts: any[] = [];
      let hasValidRefs = false;
      
      if (useRefs && referenceImages && referenceImages.length > 0) {
        referenceImages.forEach(img => {
          if (img && img.startsWith('data:image')) {
             const matches = img.match(/^data:(.+);base64,(.+)$/);
             if (matches) {
               hasValidRefs = true;
               parts.push({
                 inlineData: {
                   mimeType: matches[1],
                   data: matches[2]
                 }
               });
             }
          }
        });
      }

      const styleKeywords = styleId === 'realistic'
          ? "Cinematic, photorealistic, 8k, wholesome professional photography, bright lighting, safe content"
          : "3D Animation, Pixar style, Disney style, bright colors, friendly and clean, wholesome environment";

      const strictNoText = " NO TEXT, NO LETTERS, NO SPEECH BUBBLES.";
      
      const cleanPrompt = prompt.replace(/"/g, "'").replace(/\n/g, " ").substring(0, 700);
      let promptText = `${styleKeywords}. ${cleanPrompt}. ${strictNoText} Professional high-end quality.`;

      if (useRefs && hasValidRefs) {
        promptText = `STRICT CHARACTER IDENTITY: Maintain exact facial features and clothing from reference images. ${promptText}`;
      }

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: { imageConfig: { aspectRatio: "9:16" } }
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates returned");
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("No content/parts in candidate");
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("Image data missing in response");
    };

    try {
      return await performGeneration(true);
    } catch (error) {
      console.warn("Retrying image generation without references due to error:", error);
      return await performGeneration(false);
    }
  }, apiKey);
};

export const generateCharacterImage = async (char: Character, styleId: string, apiKey?: string, scriptTone?: ScriptTone): Promise<string> => {
  return withRetry(async (ai) => {
    let styleDescription = "";
    if (styleId === "realistic") {
      styleDescription = "Cinematic Realistic, photorealistic 8k, wholesome character portrait, professional lighting, safe and clean, real human skin and textures";
    } else if (styleId === "3d_animation") {
      styleDescription = "High-end 3D Animation, Pixar Disney style, cute and vibrant, professional friendly character design, stylized features";
    } else {
      // Mixed / Custom
      styleDescription = "Stylized Realistic, semi-realistic 3D, high-end digital art, unique blend of cinematic lighting and stylized character proportions";
    }

    const strictNoText = " ABSOLUTELY NO TEXT, NO WORDS. CLEAR CHARACTER DESIGN ONLY.";
    
    const analysisPrompt = `
      Create a professional image generation prompt for a character design sheet.
      Character Name: ${char.name}
      Role: ${char.role}
      STRICT Gender: ${char.voiceGender}
      STRICT Age: ${char.voiceAge}
      Visual Details: ${char.description}
      Artistic Style: ${styleDescription}
      Expression/Tone: ${scriptTone ? scriptTone.label : 'Neutral'}
      
      ANTHROPOMORPHIC INSTRUCTIONS:
      - If the "Visual Details" or "Character Name" describes an INANIMATE OBJECT or PLANT (e.g., "lá tía tô" - perilla leaf, "cái ghế" - chair, "quả táo" - apple):
        - The character MUST be an anthropomorphic version of that object.
        - It MUST have human-like features such as expressive eyes and a mouth.
        - It should have a personality that matches its role.
      - If the "Visual Details" describes a HUMAN (e.g., "người đàn ông" - man, "phụ nữ" - woman, "bác sĩ" - doctor):
        - The character MUST be a realistic or stylized human shape as per the Artistic Style.
      
      GENERAL INSTRUCTIONS:
      - The image MUST be a CHARACTER DESIGN SHEET showing the character from multiple angles (front, back, and side views).
      - STRICTLY follow the nationality, ethnicity, or country mentioned in the "Visual Details" to ensure the character's features and clothing are culturally accurate.
      - Describe the character's face, hair, and clothing in detail.
      - The expression should match the tone: ${scriptTone ? scriptTone.desc : 'Neutral'}.
      - Ensure the character looks wholesome and professional.
      - If the character is a child, ensure the description is entirely age-appropriate, safe, and professional.
      - ${strictNoText}
    `;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: analysisPrompt,
    });

    let optimizedPrompt = (analysisResponse.text || `A character sheet for ${char.name}, ${char.voiceAge} year old ${char.voiceGender}, ${char.description}`) + " . " + strictNoText;

    const parts: any[] = [];
    if (char.image && char.image.startsWith('data:image')) {
       const matches = char.image.match(/^data:(.+);base64,(.+)$/);
       if (matches) {
         parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
         optimizedPrompt = `RE-DRAW THIS CHARACTER AS A CHARACTER SHEET: Maintain facial identity, gender, and age from the reference image. Show front, back, and side views. ${optimizedPrompt}`;
       }
    }
  
    parts.push({ text: optimizedPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    if (!response.candidates || response.candidates.length === 0) throw new Error("No candidates");
    
    const candidate = response.candidates[0];
    for (const part of candidate.content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data in response");
  }, apiKey);
};
