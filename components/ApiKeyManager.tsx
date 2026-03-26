import React, { useState, useEffect } from 'react';
import { X, Key, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKeys = localStorage.getItem('user_gemini_api_keys') || localStorage.getItem('user_gemini_api_key') || '';
      setKeys(savedKeys.replace(/,/g, '\n'));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('user_gemini_api_keys', keys.trim());
    localStorage.removeItem('user_gemini_api_key'); // Clean up old key
    toast.success('Đã lưu API Keys thành công.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Key size={20} className="text-orange-600" />
            Quản lý API Keys
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="text-sm text-slate-600 mb-4 bg-orange-50 p-3 rounded-xl border border-orange-100">
          <p className="font-medium mb-1">Hướng dẫn:</p>
          <p>Nhập mỗi API Key trên một dòng. Hệ thống sẽ tự động sử dụng lần lượt các Key này để đảm bảo ứng dụng hoạt động liền mạch khi một Key bị giới hạn.</p>
        </div>
        <textarea
          value={keys}
          onChange={(e) => setKeys(e.target.value)}
          className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none mb-4 font-mono text-sm"
          placeholder="Nhập mỗi API Key một dòng..."
        />
        <a 
          href="https://aistudio.google.com/api-keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full py-3 mb-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all text-center text-sm"
        >
          Lấy API KEY miễn phí
        </a>
        <button
          onClick={handleSave}
          className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> Lưu API Keys
        </button>
      </div>
    </div>
  );
};

export default ApiKeyManager;
