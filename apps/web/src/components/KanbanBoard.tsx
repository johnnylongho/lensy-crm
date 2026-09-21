import React from 'react';
import { Booking, WorkflowStage } from '@lensflow/shared';
import { Calendar, DollarSign, ArrowRight, ExternalLink, Camera } from 'lucide-react';

interface Props {
  bookings: Booking[];
  onStageChange: (bookingId: string, newStage: WorkflowStage) => void;
  onOpenDebtModal: () => void;
}

const COLUMNS: { stage: WorkflowStage; title: string; color: string }[] = [
  { stage: 'lead', title: 'Báo Giá Mới', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { stage: 'booked', title: 'Đã Cọc / Chờ Chụp', color: 'border-indigo-700/50 bg-indigo-950/20 text-indigo-300' },
  { stage: 'retouching', title: 'Đang Retouch', color: 'border-amber-700/50 bg-amber-950/20 text-amber-300' },
  { stage: 'delivered', title: 'Đã Trả Ảnh (Chờ Thu Nợ)', color: 'border-rose-700/50 bg-rose-950/20 text-rose-300' },
  { stage: 'completed', title: 'Đóng Job (Đã Thu Đủ)', color: 'border-emerald-700/50 bg-emerald-950/20 text-emerald-300' },
];

const NEXT_STAGE_MAP: Partial<Record<WorkflowStage, WorkflowStage>> = {
  lead: 'booked',
  deposit_pending: 'booked',
  booked: 'retouching',
  shooting: 'retouching',
  culling: 'retouching',
  retouching: 'delivered',
  delivered: 'completed',
};

export const KanbanBoard: React.FC<Props> = ({ bookings, onStageChange, onOpenDebtModal }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            Bảng Tiến Độ Công Việc (Job Kanban Board)
          </h2>
          <p className="text-xs text-slate-400">
            Theo dõi dòng chảy từ khi chốt lịch, hậu kỳ cho tới trả file ảnh và quyết toán công nợ
          </p>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colBookings = bookings.filter(b => {
            if (col.stage === 'lead') return b.workflowStage === 'lead' || b.workflowStage === 'deposit_pending';
            if (col.stage === 'retouching') return b.workflowStage === 'retouching' || b.workflowStage === 'shooting' || b.workflowStage === 'culling';
            return b.workflowStage === col.stage;
          });

          return (
            <div
              key={col.stage}
              className={`rounded-2xl border p-3 flex flex-col h-full min-w-[220px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-800 text-slate-300">
                  {colBookings.length}
                </span>
              </div>

              {/* Cards in column */}
              <div className="space-y-3 flex-1">
                {colBookings.length === 0 ? (
                  <div className="text-center py-6 text-[11px] text-slate-600">
                    Không có job nào
                  </div>
                ) : (
                  colBookings.map(b => {
                    const nextStage = NEXT_STAGE_MAP[b.workflowStage];

                    return (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl shadow space-y-2.5 transition-all text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-white text-xs leading-snug">{b.clientName}</h4>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded uppercase">
                            {b.sessionType}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-400 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{b.eventDate} ({b.startTime})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              Còn nợ:{' '}
                              <strong className="text-rose-400 font-mono">
                                {(b.remainingAmount || 0).toLocaleString('vi-VN')} đ
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Drive / Pixieset Link */}
                        {b.driveDeliveryLink && (
                          <a
                            href={b.driveDeliveryLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Link Drive ảnh
                          </a>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                          {b.workflowStage === 'delivered' && b.remainingAmount > 0 && (
                            <button
                              type="button"
                              onClick={onOpenDebtModal}
                              className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-[10px] font-semibold border border-rose-500/40"
                            >
                              Nhắc nợ Zalo
                            </button>
                          )}

                          {nextStage && (
                            <button
                              type="button"
                              onClick={() => onStageChange(b.id, nextStage)}
                              className="ml-auto px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded text-[10px] font-medium transition-colors flex items-center gap-1"
                            >
                              Chuyển tiếp <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
