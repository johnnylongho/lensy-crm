import React, { useState } from 'react';
import { CalendarEvent, BookingStatus } from '../../types';
import {
  Calendar,
  ArrowRight,
  MapPin,
  Sparkles,
  MessageSquareQuote,
  Camera,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  Clock,
} from 'lucide-react';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  closestCenter,
  CollisionDetection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  events: CalendarEvent[];
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
}

interface ColumnDef {
  status: BookingStatus;
  stepNum: string;
  title: string;
  color: string;
  headerBg: string;
  badge: string;
  matchStatuses: BookingStatus[];
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'lead',
    stepNum: '1',
    title: 'Mới hỏi',
    color: 'border-amber-700/40 bg-slate-900/50',
    headerBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    matchStatuses: ['lead', 'cho_coc', 'cho_xac_nhan_coc'],
  },
  {
    status: 'deposited',
    stepNum: '2',
    title: 'Đã cọc',
    color: 'border-emerald-700/40 bg-slate-900/50',
    headerBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    matchStatuses: ['deposited', 'da_chot'],
  },
  {
    status: 'shot',
    stepNum: '3',
    title: 'Đã chụp',
    color: 'border-blue-700/40 bg-slate-900/50',
    headerBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    matchStatuses: ['shot'],
  },
  {
    status: 'editing',
    stepNum: '4',
    title: 'Đang sửa ảnh',
    color: 'border-indigo-700/40 bg-slate-900/50',
    headerBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    matchStatuses: ['editing', 'da_tra_file'],
  },
  {
    status: 'done',
    stepNum: '5',
    title: 'Hoàn tất',
    color: 'border-purple-700/40 bg-slate-900/50',
    headerBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    matchStatuses: ['done', 'hoan_thanh'],
  },
];

const NEXT_STATUS_MAP: Partial<Record<BookingStatus, BookingStatus>> = {
  lead: 'deposited',
  deposited: 'shot',
  shot: 'editing',
  editing: 'done',
  // Tương thích ngược:
  cho_coc: 'deposited',
  cho_xac_nhan_coc: 'deposited',
  da_chot: 'shot',
  da_tra_file: 'done',
};

// Tính toán số tiền nợ chưa thu
function calculateDebt(item: CalendarEvent) {
  const effectiveDeposit =
    (item.status === 'deposited' || item.status === 'da_chot') && (!item.depositAmount || item.depositAmount === 0)
      ? Math.round(item.packagePrice * 0.3)
      : item.depositAmount || 0;

  const effectivePaid =
    item.status === 'done' || item.status === 'hoan_thanh'
      ? item.packagePrice
      : item.paidAmount && item.paidAmount > 0
      ? item.paidAmount
      : effectiveDeposit;

  const remainingDebt = Math.max(0, item.packagePrice - effectivePaid);
  return { effectiveDeposit, effectivePaid, remainingDebt };
}

// Thuật toán nhận diện va chạm tối ưu cho Kanban
const kanbanCollisionDetection: CollisionDetection = (args) => {
  // 1. Kiểm tra trực tiếp vị trí con trỏ chuột (pointerWithin)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // 2. Va chạm hình học chữ nhật nếu kéo sát mép (rectIntersection)
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  // 3. Fallback theo khoảng cách tâm gần nhất
  return closestCenter(args);
};

// Nội dung thẻ Booking Card
const KanbanCardContent: React.FC<{
  item: CalendarEvent;
  isOverlay?: boolean;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
}> = ({
  item,
  isOverlay = false,
  onSelectBooking,
  onOpenDebtReminder,
  onStatusChange,
}) => {
  const { effectiveDeposit, effectivePaid, remainingDebt } = calculateDebt(item);
  const nextStatus = NEXT_STATUS_MAP[item.status];
  const statusTheme = STATUS_CONFIG[item.status] || STATUS_CONFIG.lead || STATUS_CONFIG.cho_coc;

  const isDebtReminderEligible =
    (item.status === 'editing' || item.status === 'da_tra_file' || item.status === 'done') && remainingDebt > 0;

  return (
    <div
      className={`p-3.5 rounded-2xl border select-none transition-colors duration-150 shadow-md space-y-3 text-xs ${
        statusTheme.cardBg
      } ${statusTheme.cardBorder} ${
        isOverlay
          ? 'rotate-2 scale-105 shadow-2xl shadow-amber-500/25 ring-2 ring-amber-400 bg-slate-900 border-amber-400 cursor-grabbing'
          : 'hover:border-slate-500 cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Header: Client Name, Session Type & Grip */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="space-y-0.5 flex-1 min-w-0">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onSelectBooking && onSelectBooking(item)}
            className="font-bold text-white text-sm leading-snug hover:text-amber-400 hover:underline text-left transition-colors truncate block max-w-full cursor-pointer"
            title="Xem chi tiết & Gán thiết bị"
          >
            {item.clientName}
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-amber-400">
              {item.sessionType}
            </span>
            {item.assignedGears && item.assignedGears.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold border bg-sky-950/80 border-sky-500/40 text-sky-300 flex items-center gap-1">
                <Camera className="w-2.5 h-2.5" />
                <span>{item.assignedGears.length} máy</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Status Dropdown & Grip Icon */}
        <div className="flex items-center gap-1">
          {onStatusChange && (
            <div onPointerDown={(e) => e.stopPropagation()}>
              <BookingStatusSelect
                status={item.status}
                onChange={newStatus => onStatusChange(item.id, newStatus)}
                size="sm"
              />
            </div>
          )}
          <div
            className="p-1 rounded-lg text-slate-500 hover:text-amber-400 transition-colors pointer-events-none"
            title="Kéo thả thẻ để chuyển trạng thái"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Date & Location */}
      <div className="space-y-1 text-slate-300 text-[11px] bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-medium text-slate-200">{item.eventDate}</span>
          <span className="text-slate-500">|</span>
          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="text-slate-400 font-mono text-[10px]">
            {item.startTime} - {item.endTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate text-slate-300">{item.location}</span>
        </div>
      </div>

      {/* Financial Info & Highlighted Remaining Debt */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-0.5">
          <span>Tổng giá trị gói:</span>
          <span className="text-slate-200 font-bold">
            {item.packagePrice.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Cảnh báo / Nhấn mạnh Số tiền chưa thu bằng MÀU ĐỎ nếu còn nợ */}
        {remainingDebt > 0 ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-300 shadow-sm animate-pulse-subtle">
            <span className="text-[10px] font-bold uppercase flex items-center gap-1 text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Chưa thu:</span>
            </span>
            <span className="font-mono font-black text-xs text-rose-300">
              {remainingDebt.toLocaleString('vi-VN')} đ
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300">
            <span className="text-[10px] font-bold uppercase flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Thanh toán:</span>
            </span>
            <span className="font-mono font-bold text-xs text-emerald-300">
              Đã thanh toán đủ (100%)
            </span>
          </div>
        )}
      </div>

      {/* USP 1: Nút "Nhắc thanh toán" nổi bật khi Hậu kỳ / Hoàn tất & Còn nợ */}
      {isDebtReminderEligible && onOpenDebtReminder && (
        <div className="pt-0.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenDebtReminder(item)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 hover:shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Nhắc thanh toán ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
          </button>
        </div>
      )}

      {/* Quick 1-click Forward Step Button */}
      {nextStatus && onStatusChange && (
        <div
          className="pt-2 border-t border-slate-800/80 flex items-center justify-between"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-slate-400">Bước tiếp theo:</span>
          <button
            type="button"
            onClick={() => onStatusChange(item.id, nextStatus)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>{STATUS_CONFIG[nextStatus].label}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// Sortable Card Wrapper
const SortableCard: React.FC<{
  item: CalendarEvent;
  columnStatus: BookingStatus;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
}> = ({ item, columnStatus, onSelectBooking, onOpenDebtReminder, onStatusChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'Card',
      item,
      columnStatus,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    // Khi đang kéo, tắt transition để transform bám sát chuột 100% không có độ trễ
    transition: isDragging ? undefined : transition,
    touchAction: 'none',
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 min-h-[160px] opacity-40 transition-none"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCardContent
        item={item}
        onSelectBooking={onSelectBooking}
        onOpenDebtReminder={onOpenDebtReminder}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

// Droppable Column Component
const KanbanColumn: React.FC<{
  column: ColumnDef;
  events: CalendarEvent[];
  isHighlighted?: boolean;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
}> = ({ column, events, isHighlighted = false, onSelectBooking, onOpenDebtReminder, onStatusChange }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
    data: {
      type: 'Column',
      status: column.status,
    },
  });

  const totalRevenue = events.reduce((acc, e) => acc + e.packagePrice, 0);
  const activeHover = isOver || isHighlighted;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-3 flex flex-col h-full min-w-[250px] transition-colors duration-150 ${
        activeHover
          ? 'border-amber-400 bg-amber-950/20 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/40'
          : column.color
      }`}
    >
      {/* Column Header */}
      <div className={`p-2.5 rounded-xl border mb-3 flex items-center justify-between ${column.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center font-mono">
            {column.stepNum}
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wide">
            {column.title}
          </span>
        </div>
        <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-950/80 border border-slate-700/80">
          {events.length}
        </span>
      </div>

      {/* Subtotal of column */}
      <div className="mb-2.5 px-1 text-[10px] text-slate-400 font-mono flex items-center justify-between">
        <span>Tổng giá trị cột:</span>
        <span className="font-bold text-slate-200">
          {totalRevenue.toLocaleString('vi-VN')} đ
        </span>
      </div>

      {/* Cards list with SortableContext */}
      <SortableContext items={events.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1 min-h-[140px]">
          {events.length === 0 ? (
            <div
              className={`text-center py-10 px-2 text-xs border border-dashed rounded-xl transition-colors ${
                activeHover
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              {activeHover ? 'Thả vào đây để đổi trạng thái' : 'Kéo thả show chụp vào đây'}
            </div>
          ) : (
            events.map(item => (
              <SortableCard
                key={item.id}
                item={item}
                columnStatus={column.status}
                onSelectBooking={onSelectBooking}
                onOpenDebtReminder={onOpenDebtReminder}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export const KanbanView: React.FC<Props> = ({
  events,
  onStatusChange,
  onSelectBooking,
  onOpenDebtReminder,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Cấu hình PointerSensor để phân biệt click nhanh vs kéo thả mượt mà
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px là điểm vàng: bấm click không bị trôi, kéo thả phản hồi tức thì
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id ? String(event.over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeEventId = String(active.id);
    const activeBooking = events.find(e => e.id === activeEventId);
    if (!activeBooking) return;

    // Xác định target status
    let targetStatus: BookingStatus | null = null;

    // 1. Kiểm tra data gắn trên droppable
    const overData = over.data?.current;
    if (overData?.columnStatus) {
      targetStatus = overData.columnStatus;
    } else if (overData?.status) {
      targetStatus = overData.status;
    }

    // 2. Nếu thả thẳng lên cột (id của column là status: 'lead', 'deposited', etc.)
    if (!targetStatus) {
      const directCol = COLUMNS.find(c => c.status === over.id);
      if (directCol) {
        targetStatus = directCol.status;
      }
    }

    // 3. Nếu thả lên một thẻ khác nằm trong cột
    if (!targetStatus) {
      const overBooking = events.find(e => e.id === over.id);
      if (overBooking) {
        const parentCol = COLUMNS.find(c =>
          c.status === overBooking.status || c.matchStatuses.includes(overBooking.status)
        );
        if (parentCol) {
          targetStatus = parentCol.status;
        }
      }
    }

    // 4. Nếu targetStatus hợp lệ và khác với status hiện tại của booking
    if (targetStatus && targetStatus !== activeBooking.status) {
      if (onStatusChange) {
        onStatusChange(activeBooking.id, targetStatus);
      }
    }
  };

  const activeBooking = activeId ? events.find(e => e.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Title & Pipeline View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
            Quy Trình 5 Bước Chuẩn Nhiếp Ảnh (Photography Kanban Pipeline)
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Bảng Kanban Tiến Độ Show
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            <GripVertical className="w-3.5 h-3.5 text-amber-400" />
            <span>Kéo bất kỳ thẻ nào để đổi cột</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Realtime Supabase Sync</span>
          </div>
        </div>
      </div>

      {/* 5 Kanban Columns: Mới hỏi ➔ Đã cọc ➔ Đã chụp ➔ Đang sửa ảnh ➔ Hoàn tất */}
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colEvents = events.filter(
              e => col.matchStatuses.includes(e.status) || e.status === col.status
            );

            // Kiểm tra xem con trỏ chuột có đang hover lên cột này hoặc bất kỳ thẻ nào trong cột không
            const isColHighlighted = Boolean(
              overId &&
                (col.status === overId ||
                  colEvents.some(e => e.id === overId))
            );

            return (
              <KanbanColumn
                key={col.status}
                column={col}
                events={colEvents}
                isHighlighted={isColHighlighted}
                onSelectBooking={onSelectBooking}
                onOpenDebtReminder={onOpenDebtReminder}
                onStatusChange={onStatusChange}
              />
            );
          })}
        </div>

        {/* Drag Overlay: Hiển thị thẻ nổi khi đang kéo thả (Độ trễ 0ms, đổ bóng mềm) */}
        <DragOverlay
          dropAnimation={{
            duration: 150,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeBooking ? (
            <div className="w-[280px] max-w-full cursor-grabbing pointer-events-none">
              <KanbanCardContent item={activeBooking} isOverlay={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
