import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "./geminiService";

export const fileToGenerativePart = async (file: File | Blob): Promise<{ inlineData: { mimeType: string, data: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateNonFaceScript = async (
  imageParts: any[],
  productName: string,
  keyword: string,
  layout: string,
  gender: string,
  voice: string,
  addressing: string,
  sceneCount: number,
  targetAudience: string,
  apiKey?: string
): Promise<Record<string, { dialogue: string, action: string, veoPrompt: string }>> => {
  return withRetry(async (ai) => {
    const prompt = `
      Bạn là một chuyên gia sáng tạo nội dung Video Review sản phẩm không lộ mặt (Non-Face Review) chuyên nghiệp trên TikTok/Shorts.
      
      Nhiệm vụ: Viết kịch bản chi tiết cho video review sản phẩm "${productName}".
      
      Thông tin sản phẩm:
      - Tên: ${productName}
      - Keyword/USP: ${keyword}
      - Đối tượng mục tiêu: ${targetAudience}
      - Bố cục yêu cầu: ${layout}
      - Giới tính Voice-over: ${gender}
      - Giọng đọc: ${voice}
      - Cách xưng hô: ${addressing}
      - Số lượng phân cảnh: ${sceneCount}
      
      Yêu cầu kịch bản:
      - Ngôn ngữ: Tiếng Việt tự nhiên, thu hút, bắt trend.
      - Mỗi phân cảnh phải có lời thoại (dialogue) và mô tả hành động (action) để tạo hình ảnh/video.
      - Lời thoại phải phù hợp với cách xưng hô "${addressing}".
      - Kịch bản phải làm nổi bật các Keyword/USP của sản phẩm.
      - Cấu trúc kịch bản phải tuân theo bố cục: ${layout}.
      
      Yêu cầu NGHIÊM NGẶT cho "veoPrompt" (Prompt cho AI VEO3):
      - Ngôn ngữ: TIẾNG ANH.
      - TUÂN THỦ HÌNH ẢNH SẢN PHẨM: Phải mô tả cực kỳ chi tiết đặc điểm ngoại quan của sản phẩm dựa trên ảnh đã tải lên (màu sắc, hình dáng, logo, các dòng chữ trên bao bì). AI VEO3 cần hiểu rõ sản phẩm trông như thế nào để không làm sai lệch.
      - KHÔNG ĐƯỢC THAY ĐỔI CHI TIẾT: Tuyệt đối không thay đổi logo, nhãn mác, hoặc bất kỳ chi tiết nhận diện nào của sản phẩm.
      - CHI TIẾT HÀNH ĐỘNG: Mô tả các micro-actions (cử động nhỏ của tay, cách cầm nắm sản phẩm, ánh mắt tập trung vào các chi tiết của sản phẩm) và bối cảnh xung quanh.
      - CINEMATIC: Bao gồm các từ khóa về ánh sáng (lighting), góc máy (camera angle), chất lượng hình ảnh (8k, photorealistic, cinematic).
      - DIALOGUE: Bắt buộc bao gồm lời thoại ở cuối theo định dạng: "Dialogue: [nội dung lời thoại]".
      
      Trả về kết quả dưới dạng JSON với các key là v1, v2, ..., v${sceneCount}.
      Mỗi giá trị là một object có 3 trường: "dialogue" (lời thoại), "action" (mô tả hành động/hình ảnh) và "veoPrompt" (Prompt chi tiết bằng TIẾNG ANH cho VEO3).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: Object.fromEntries(
            Array.from({ length: sceneCount }, (_, i) => [
              `v${i + 1}`, 
              { 
                type: Type.OBJECT,
                properties: {
                  dialogue: { type: Type.STRING },
                  action: { type: Type.STRING },
                  veoPrompt: { type: Type.STRING }
                },
                required: ["dialogue", "action", "veoPrompt"]
              }
            ])
          ),
          required: Array.from({ length: sceneCount }, (_, i) => `v${i + 1}`),
        },
      },
    });

    return JSON.parse(response.text || "{}");
  }, apiKey);
};

export const regenerateNonFaceScriptPart = async (
  imageParts: any[],
  productName: string,
  keyword: string,
  sceneKey: string,
  currentContent: { dialogue: string, action: string, veoPrompt: string },
  fullScript: Record<string, { dialogue: string, action: string, veoPrompt: string }>,
  gender: string,
  voice: string,
  addressing: string,
  targetAudience: string,
  apiKey?: string
): Promise<{ dialogue: string, action: string, veoPrompt: string }> => {
  return withRetry(async (ai) => {
    const prompt = `
      Bạn là chuyên gia biên kịch video ngắn. Hãy viết lại phân cảnh "${sceneKey}" của kịch bản review sản phẩm "${productName}".
      
      Nội dung hiện tại của phân cảnh này: 
      - Lời thoại: "${currentContent.dialogue}"
      - Hành động: "${currentContent.action}"
      - VEO3 Prompt: "${currentContent.veoPrompt}"

      Toàn bộ kịch bản hiện tại: ${JSON.stringify(fullScript)}
      
      Yêu cầu:
      - Viết lại phân cảnh này sao cho hay hơn, thu hút hơn nhưng vẫn phải khớp với mạch truyện của toàn bộ kịch bản.
      - Giữ nguyên cách xưng hô "${addressing}" và phù hợp với đối tượng "${targetAudience}".
      - Yêu cầu NGHIÊM NGẶT cho "veoPrompt": Phải mô tả cực kỳ chi tiết đặc điểm ngoại quan của sản phẩm dựa trên ảnh đã tải lên (màu sắc, hình dáng, logo, các dòng chữ trên bao bì). AI VEO3 cần hiểu rõ sản phẩm trông như thế nào để không làm sai lệch. Tuyệt đối không thay đổi logo, nhãn mác, hoặc bất kỳ chi tiết nhận diện nào của sản phẩm. Bao gồm cinematic keywords, micro-actions (cách cầm nắm, thao tác với sản phẩm), lighting, và lời thoại ở cuối theo định dạng: "Dialogue: [nội dung lời thoại]".
      - Trả về kết quả dưới dạng JSON với 3 trường: "dialogue", "action" và "veoPrompt" (Prompt chi tiết bằng TIẾNG ANH cho VEO3).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogue: { type: Type.STRING },
            action: { type: Type.STRING },
            veoPrompt: { type: Type.STRING }
          },
          required: ["dialogue", "action", "veoPrompt"]
        }
      }
    });

    return JSON.parse(response.text || JSON.stringify(currentContent));
  }, apiKey);
};

export const generateNonFaceImage = async (
  productParts: any[],
  handRefPart: any | null,
  productName: string,
  sceneContent: string,
  customPrompt: string | undefined,
  imageStyle: string,
  handVisibility: string,
  scriptNote: string,
  visualNote: string,
  bgRefPart: any | null,
  angle: string | undefined,
  poseLabel: string,
  apiKey?: string
): Promise<string> => {
  return withRetry(async (ai) => {
    const parts = [...productParts];
    if (handRefPart) parts.push(handRefPart);
    if (bgRefPart) parts.push(bgRefPart);

    const styleDesc = imageStyle === 'Realistic' 
      ? "Cinematic Photorealistic, 8k, highly detailed, professional product photography" 
      : "High-end 3D Animation, Pixar style, vibrant colors, clean and friendly";

    const prompt = `
      Nhiệm vụ: Tạo một hình ảnh minh họa cho phân cảnh video review sản phẩm "${productName}".
      
      Nội dung phân cảnh: "${sceneContent}"
      ${customPrompt ? `Yêu cầu bổ sung: ${customPrompt}` : ""}
      Phong cách: ${styleDesc}
      Hiển thị tay: ${handVisibility === 'with_hand' ? `Có bàn tay người đang cầm/sử dụng sản phẩm. Tư thế tay: ${poseLabel}` : "Không có tay người, chỉ tập trung vào sản phẩm"}
      Góc quay: ${angle || "Cận cảnh (Close-up)"}
      Ghi chú bối cảnh: ${scriptNote}
      Ghi chú hình ảnh: ${visualNote}
      
      Yêu cầu quan trọng:
      - TUÂN THỦ NGHIÊM NGẶT HÌNH ẢNH SẢN PHẨM: Sản phẩm trong ảnh tạo ra PHẢI giống hệt ảnh gốc tham khảo. 
      - GIỮ NGUYÊN TOÀN BỘ CHI TIẾT: Tất cả các chi tiết trên sản phẩm, bao gồm CHỮ (TEXT), LOGO, KIỂU DÁNG, MÀU SẮC phải được giữ nguyên 100% so với ảnh gốc. KHÔNG ĐƯỢC THAY ĐỔI HOẶC XÓA CHỮ TRÊN SẢN PHẨM.
      - ${bgRefPart ? "Sử dụng bối cảnh từ ảnh background tham khảo." : "Bối cảnh phù hợp với sản phẩm."}
      - ${handRefPart ? "Sử dụng đặc điểm bàn tay từ ảnh mẫu tay tham khảo." : ""}
      - Không thêm chữ mới vào bối cảnh (NO NEW TEXT IN BACKGROUND), nhưng phải giữ nguyên chữ trên sản phẩm.
    `;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });

    const base64 = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
    if (!base64) throw new Error("Không tạo được ảnh.");
    return `data:image/png;base64,${base64}`;
  }, apiKey);
};

export const removeBackground = async (
  imagePart: any,
  apiKey?: string
): Promise<string> => {
  return withRetry(async (ai) => {
    const prompt = "Remove the background of this image and replace it with a pure white background. Keep only the main product. The output should be a clean product shot on white.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [imagePart, { text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const base64 = response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
    if (!base64) throw new Error("Không thể tách nền.");
    return `data:image/png;base64,${base64}`;
  }, apiKey);
};
