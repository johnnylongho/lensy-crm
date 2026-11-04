import React from 'react';
import { ShieldCheck, Camera } from 'lucide-react';

interface Props {
  equipmentList: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_BACKUP_EQUIPMENT = [
  'Body Canon EOS R (Full-Frame)',
  'Ống kính Canon RF 85mm f/2 Macro',
  'Đèn Studio Godox V860iii & Trigger',
  'Softbox & Chân đèn tản sáng',
];

export const QuoteEquipment: React.FC<Props> = ({ equipmentList = [] }) => {
  const cleanEquipmentList = (equipmentList || [])
    .filter(item => typeof item === 'string' && item.trim().length > 0 && !UUID_REGEX.test(item.trim()));

  const finalDisplayList = cleanEquipmentList.length > 0 ? cleanEquipmentList : DEFAULT_BACKUP_EQUIPMENT;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-1.5 flex flex-col justify-between h-full break-inside-avoid print:break-inside-avoid print:m-0">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 print:pb-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
            Tiêu Chuẩn Thiết Bị
          </span>
          <h3 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide flex items-center gap-1.5 print:text-xs">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Cam Kết Thiết Bị</span>
          </h3>
        </div>
        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wider print:text-[9px]">
          Đã Khóa Thiết Bị
        </span>
      </div>

      <p className="text-xs print:text-[10px] text-slate-500 leading-tight">
        Studio cam kết mang đầy đủ thân máy chính & phụ cùng ống kính khẩu độ lớn cao cấp nhất:
      </p>

      {/* Danh sách thiết bị dạng thẻ Tags (Pills) thanh mảnh */}
      <div className="flex flex-wrap gap-1.5 pt-0.5 flex-1 items-start">
        {finalDisplayList.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 print:text-[10px] print:py-0.5 print:px-2"
          >
            <Camera className="w-3 h-3 text-orange-500 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
