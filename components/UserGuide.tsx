import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Sparkles, Mic, ScanEye, Shirt, Film, 
  MessageCircle, Image as ImageIcon, ListOrdered, 
  Key, Info, CheckCircle2, AlertCircle, Tag, ArrowRight
} from 'lucide-react';

interface UserGuideProps {
  onNavigate?: (module: 'script' | 'tts' | 'vision' | 'tryon' | 'jimeng' | 'guide' | 'affiliate_veo3') => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ onNavigate }) => {
  const sections = [
    {
      id: 'general',
      title: 'Cài đặt chung & API Key',
      icon: <Key className="text-amber-500" />,
      content: [
        'Hệ thống yêu cầu Gemini API Key để hoạt động. Bạn có thể nhập một hoặc nhiều Key (mỗi Key một dòng).',
        'Hệ thống tự động xoay vòng Key nếu một Key bị hết hạn hoặc lỗi Quota (429).',
        'Dữ liệu của bạn được lưu trữ cục bộ (LocalStorage), đảm bảo tính riêng tư.'
      ]
    },
    {
      id: 'script',
      title: 'Nhân Hóa (Tạo Kịch bản)',
      icon: <Film className="text-orange-500" />,
      content: [
        'Bước 1: Thiết lập nhân vật (Tên, vai trò, giọng đọc). Tối đa 4 nhân vật.',
        'Bước 2: Chọn chủ đề hoặc nhập kịch bản có sẵn. Bạn có thể dùng nút "Gợi ý" để AI tìm ý tưởng.',
        'Bước 3: Chọn phong cách hình ảnh (Người thật hoặc Hoạt hình 3D) và cảm xúc lời thoại.',
        'Bước 4: Bấm "Tạo Kịch bản & Prompt" để nhận kết quả chi tiết từng cảnh quay.'
      ]
    },
    {
      id: 'tts',
      title: 'Giọng Đọc (TTS)',
      icon: <Mic className="text-blue-500" />,
      content: [
        'Nhập văn bản và chọn giọng đọc phù hợp (Nam/Nữ, vùng miền).',
        'Sử dụng "Style Instruction" để điều chỉnh cảm xúc, tốc độ và cách nhấn nhá của AI.',
        'Có thể tối ưu hóa hướng dẫn đọc bằng AI để giọng nói tự nhiên hơn.',
        'Tải xuống file âm thanh chất lượng cao để lồng tiếng cho video.'
      ]
    },
    {
      id: 'vision',
      title: 'Quét Ảnh (Vision)',
      icon: <ScanEye className="text-emerald-500" />,
      content: [
        'Tải lên ảnh nhân vật hoặc bối cảnh để AI phân tích chi tiết.',
        'AI sẽ trích xuất đặc điểm ngoại hình, trang phục và bối cảnh.',
        'Kết quả phân tích có thể dùng làm Prompt tham chiếu cho các module khác.'
      ]
    },
    {
      id: 'tryon',
      title: 'Thử Đồ (Virtual Try-On)',
      icon: <Shirt className="text-pink-500" />,
      content: [
        'Tải lên ảnh người mẫu và ảnh sản phẩm thời trang.',
        'AI sẽ tự động "mặc" sản phẩm lên người mẫu một cách chân thực.',
        'Hệ thống tạo ra 3 phiên bản khác nhau mỗi lần để bạn dễ dàng lựa chọn.',
        'Hỗ trợ các tùy chọn về ánh sáng, bộ lọc và làm đẹp.'
      ]
    },
    {
      id: 'jimeng',
      title: 'Prompt Jimeng (Phim ngắn AI)',
      icon: <Sparkles className="text-violet-500" />,
      content: [
        'Quy trình chuyên nghiệp để tạo phim ngắn: Chủ đề -> Cốt truyện -> Chia tập -> Chia cảnh -> Prompt.',
        'Tự động tạo Prompt đa ngôn ngữ (VI, EN, ZH) tối ưu cho các công cụ tạo video AI.',
        'Đảm bảo tính nhất quán (Consistency) về nhân vật và bối cảnh xuyên suốt các tập phim.',
        'Tích hợp tạo ảnh minh họa cho từng cảnh quay để hình dung mạch phim.'
      ]
    },
    {
      id: 'affiliate_veo3',
      title: 'AFFILIATE VEO3 (Review & Mẹo vặt)',
      icon: <Tag className="text-rose-500" />,
      content: [
        'Tạo kịch bản review sản phẩm không lộ mặt (Non-Face Review) chuyên nghiệp.',
        'Tạo kịch bản mẹo vặt (Life Hacks) độc đáo, mới lạ từ gợi ý của AI.',
        'Tự động tạo hình ảnh minh họa AI cho từng phân cảnh dựa trên ảnh sản phẩm thật hoặc bối cảnh mẹo vặt.',
        'Hỗ trợ nhiều bố cục kịch bản TikTok/Shorts và phong cách hình ảnh khác nhau.'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 bg-violet-100 rounded-3xl text-violet-600 mb-2"
        >
          <BookOpen size={48} />
        </motion.div>
        <h1 className="text-4xl font-medium text-slate-800 tracking-tight">HƯỚNG DẪN SỬ DỤNG</h1>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
          Chào mừng bạn đến với hệ thống AI Nhân Hóa. Khám phá sức mạnh của AI trong việc sáng tạo nội dung video chuyên nghiệp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <h3 className="text-lg font-medium text-slate-800">{section.title}</h3>
            </div>
            <ul className="space-y-3 flex-grow">
              {section.content.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {section.id !== 'general' && onNavigate && (
              <button
                onClick={() => onNavigate(section.id as any)}
                className="mt-6 w-full py-3 bg-slate-50 hover:bg-violet-50 text-slate-600 hover:text-violet-600 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2 group/btn"
              >
                Trải nghiệm ngay
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] space-y-4">
        <div className="flex items-center gap-3 text-amber-700 font-medium">
          <AlertCircle size={24} />
          <h3 className="text-xl">Lưu ý quan trọng</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-amber-800/80 font-medium">
          <div className="space-y-2">
            <p>• Luôn kiểm tra API Key nếu hệ thống không phản hồi.</p>
            <p>• Sử dụng ảnh rõ nét để module Vision và Try-On đạt hiệu quả tốt nhất.</p>
          </div>
          <div className="space-y-2">
            <p>• Các Prompt được tối ưu cho Jimeng AI, Midjourney và Stable Diffusion.</p>
            <p>• Bạn có thể tải xuống kịch bản dưới dạng file .txt để lưu trữ.</p>
          </div>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Hệ thống phát triển bởi Nam Lê AI</p>
      </div>
    </div>
  );
};

export default UserGuide;
