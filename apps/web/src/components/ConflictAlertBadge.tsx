import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ConflictReport } from '@lensflow/shared';

interface Props {
  report: ConflictReport | null;
  onApplyRentalCost?: (cost: number) => void;
}

export const ConflictAlertBadge: React.FC<Props> = ({ report, onApplyRentalCost }) => {
  if (!report) return null;

  if (!report.hasConflict) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <span>Tất cả thiết bị & thợ phụ sẵn sàng, không bị trùng lịch cho ngày này.</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-rose-200 shadow-lg shadow-rose-950/30 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-900/60 rounded-lg text-rose-300">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-rose-500 text-white rounded-full">
              RED FLAG: XUNG ĐỘT TÀI NGUYÊN
            </span>
            <span className="text-xs text-rose-300">Ngày {report.eventDate}</span>
          </div>
          <p className="text-sm font-semibold text-white mt-1">
            {report.conflictingGears.length} thiết bị/nhân sự đã bị giữ bởi Job khác!
          </p>
        </div>
      </div>

      <div className="space-y-1.5 pl-11 text-xs">
        {report.conflictingGears.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1 border-b border-rose-900/50">
            <div>
              <span className="font-medium text-rose-100">{item.gear.name}</span>
              <span className="text-rose-400 block text-[11px]">
                Đang bị giữ bởi: <strong className="text-white">{item.conflictWithClientName}</strong>
              </span>
            </div>
            <div className="text-right">
              <span className="text-rose-300 font-mono">
                +{(item.suggestedRentalCost || 0).toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[10px] text-rose-400 block">phí thuê ngoài</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 pl-11 flex flex-wrap items-center justify-between gap-3 border-t border-rose-900/60">
        <div className="text-xs">
          Tổng phí đề xuất cộng thêm:{' '}
          <span className="text-sm font-bold text-white font-mono">
            {report.totalSuggestedRentalCost.toLocaleString('vi-VN')} đ
          </span>
        </div>
        {onApplyRentalCost && (
          <button
            type="button"
            onClick={() => onApplyRentalCost(report.totalSuggestedRentalCost)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Tự động cộng vào báo giá
          </button>
        )}
      </div>
    </div>
  );
};
