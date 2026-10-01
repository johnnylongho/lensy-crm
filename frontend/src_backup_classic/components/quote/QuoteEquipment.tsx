import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface Props {
  equipmentList: string[];
}

export const QuoteEquipment: React.FC<Props> = ({ equipmentList }) => {
  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Cam Kết Thiết Bị Chuyên Nghiệp
        </h3>
        <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
          Đã Khóa Thiết Bị
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Studio cam kết mang đầy đủ thân máy chính & thân máy dự phòng cùng ống kính khẩu độ lớn cao cấp nhất để đảm bảo an toàn tuyệt đối cho buổi chụp:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {equipmentList.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
