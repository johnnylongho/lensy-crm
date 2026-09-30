import React, { useState } from 'react';
import { CalendarEvent, BookingStatus } from '../../types';
import {
  Calendar,
  Sparkles,
  GripVertical,
  Trash2,
  History,
  Archive,
  Pencil,
} from 'lucide-react';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { ZaloNotificationModal } from './ZaloNotificationModal';
import { CompletedShootsHistoryModal } from './CompletedShootsHistoryModal';
import { getCategoryConfig } from '../../utils/categoryConfig';
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
  onDeleteBooking?: (booking: CalendarEvent) => void;
  onEditFinancials?: (booking: CalendarEvent) => void;
  onEditCategory?: (booking: CalendarEvent) => void;
  studioName?: string;
}

interface ColumnDef {
  status: BookingStatus;
  stepNum: string;
  title: string;
  dotColor: string;
  matchStatuses: BookingStatus[];
}

const COLUMNS: ColumnDef[] = [
  {
    status: 'lead',
    stepNum: '1',
    title: 'Mới hỏi',
    dotColor: 'bg-amber-400',
    matchStatuses: ['lead', 'cho_coc', 'cho_xac_nhan_coc'],
  },
  {
    status: 'deposited',
    stepNum: '2',
    title: 'Đã cọc',
    dotColor: 'bg-emerald-400',
    matchStatuses: ['deposited', 'da_chot'],
  },
  {
    status: 'shot',
    stepNum: '3',
    title: 'Đã chụp',
    dotColor: 'bg-blue-400',
    matchStatuses: ['shot'],
  },
  {
    status: 'editing',
    stepNum: '4',
    title: 'Đang sửa ảnh',
    dotColor: 'bg-indigo-400',
    matchStatuses: ['editing', 'da_tra_file'],
  },
  {
    status: 'done',
    stepNum: '5',
    title: 'Hoàn tất',
    dotColor: 'bg-purple-400',
    matchStatuses: ['done', 'hoan_thanh'],
  },
];

// Thời gian 7 ngày (mili giây) dùng cho Auto-Archive cột Hoàn tất
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Hàm kiểm tra thẻ hoàn tất có trong vòng 7 ngày gần nhất hay không
export const isDoneRecently = (e: CalendarEvent): boolean => {
  const dateStr = e.updated_at || e.eventDate;
  if (!dateStr) return true;
  const itemTime = new Date(dateStr).getTime();
  if (isNaN(itemTime)) return true;
  return Date.now() - itemTime <= SEVEN_DAYS_MS;
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
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  return closestCenter(args);
};

/**
 * COMPACT KANBAN CARD:
 * Thiết kế lại thẻ riêng cho bảng Kanban theo yêu cầu UI/UX:
 * - Rút gọn tối đa: Tên Khách Hàng (In đậm), Ngày chụp, Trạng thái thanh toán ngắn gọn ("Nợ: 5.000.000đ" nhỏ màu đỏ).
 * - Ẩn toàn bộ thông tin thứ cấp: Địa chỉ chi tiết, Giờ giấc, Tổng gói, Số máy/lens (chỉ hiện khi click mở Drawer/Modal chi tiết).
 * - Giảm padding & gap (p-3, space-y-2) giúp thẻ dẹt, gọn gàng và không chiếm diện tích.
 * - Icon Thùng rác (Trash Icon, màu đỏ nhạt khi hover) trong cụm thao tác.
 */
const CompactKanbanCardContent: React.FC<{
  item: CalendarEvent;
  isOverlay?: boolean;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onDeleteBooking?: (booking: CalendarEvent) => void;
  onEditFinancials?: (booking: CalendarEvent) => void;
  onEditCategory?: (booking: CalendarEvent) => void;
}> = ({
  item,
  isOverlay = false,
  onSelectBooking,
  onOpenDebtReminder,
  onStatusChange,
  onDeleteBooking,
  onEditFinancials,
  onEditCategory,
}) => {
  const { remainingDebt } = calculateDebt(item);
  const catCfg = getCategoryConfig(item.category || item.sessionType);

  return (
    <div
      onClick={() => onSelectBooking && onSelectBooking(item)}
      className={`w-full p-3 rounded-xl border select-none transition-all duration-200 shadow-sm flex flex-col gap-2 text-xs bg-white/80 dark:bg-white/5 backdrop-blur-md border-gray-200 dark:border-white/10 ${
        isOverlay
          ? 'rotate-2 scale-105 shadow-2xl shadow-amber-500/25 ring-2 ring-amber-400 bg-white/95 dark:bg-slate-900 border-amber-400 cursor-grabbing'
          : 'hover:scale-[1.02] hover:border-amber-400/70 dark:hover:border-white/30 hover:shadow-md cursor-grab active:cursor-grabbing transform-gpu'
      }`}
    >
      {/* Hàng 1: Tên Khách Hàng (In đậm) & Cụm nút thao tác (Thùng rác, Quick Status, Grip) */}
      <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
        <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
          <span
            className="font-bold text-gray-900 dark:text-white text-xs sm:text-[13px] leading-tight hover:text-amber-500 dark:hover:text-amber-400 transition-colors truncate"
            title={`${item.clientName} - Nhấn để mở Drawer chi tiết`}
          >
            {item.clientName}
          </span>
          {/* Nhãn phân loại loại hình chụp (Category Badge) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onEditCategory) onEditCategory(item);
            }}
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 transition-all hover:scale-105 cursor-pointer flex-shrink-0 shadow-xs ${catCfg.color}`}
            title={`Loại hình: ${catCfg.label}${item.package_type ? ` - Gói: ${item.package_type}` : ''} (Nhấn để tùy chỉnh)`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dotColor}`} />
            <span>{catCfg.label}</span>
            {item.package_type && (
              <span className="opacity-75 font-normal max-w-[80px] truncate">· {item.package_type}</span>
            )}
          </button>
        </div>

        {/* Cụm thao tác nhanh: Icon Thùng rác (hover đỏ nhạt) + Đổi status + Grip kéo thả */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Nút Thùng rác (Trash Icon, màu đỏ nhạt khi hover) */}
          {onDeleteBooking && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBooking(item);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hủy / Xóa lịch chụp này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Status Select */}
          {onStatusChange && (
            <BookingStatusSelect
              status={item.status}
              onChange={newStatus => {
                onStatusChange(item.id, newStatus);
              }}
              size="sm"
            />
          )}

          {/* Grip Icon */}
          <div
            className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-amber-500 transition-colors pointer-events-none"
            title="Kéo thả thẻ để chuyển cột"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Hàng 2: Ngày chụp + Staff Avatars (Trái) & Trạng thái thanh toán ngắn gọn (Phải) */}
      <div className="flex items-center justify-between gap-2 pt-0.5 w-full">
        {/* Ngày chụp + Staff Avatars */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="font-mono truncate">{item.eventDate}</span>
          </div>

          {/* 2 icon avatar nhỏ (kèm tooltip tên) của Thợ chụp và MUA nếu đã được phân công */}
          {(item.photographer || item.makeup_artist) && (
            <div className="flex items-center -space-x-1.5 flex-shrink-0" title="Nhân sự phụ trách">
              {item.photographer && (
                <div
                  className="w-5 h-5 rounded-full overflow-hidden border border-amber-500/70 bg-amber-500/20 shadow-sm"
                  title={`Thợ chụp: ${item.photographer.full_name}`}
                >
                  <img
                    src={item.photographer.avatar_url || '/mirmia-logo.png'}
                    alt={item.photographer.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                    }}
                  />
                </div>
              )}
              {item.makeup_artist && (
                <div
                  className="w-5 h-5 rounded-full overflow-hidden border border-fuchsia-500/70 bg-fuchsia-500/20 shadow-sm"
                  title={`Thợ Makeup (MUA): ${item.makeup_artist.full_name}`}
                >
                  <img
                    src={item.makeup_artist.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={item.makeup_artist.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trạng thái thanh toán ngắn gọn: "Nợ: 5.000.000đ" nhỏ màu đỏ hoặc "Đã đủ 100%" nhỏ màu xanh + Nút Sửa tài chính */}
        <div className="flex items-center gap-1.5 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          {remainingDebt > 0 ? (
            <span
              onClick={(e) => {
                if (
                  onOpenDebtReminder &&
                  (item.status === 'editing' || item.status === 'da_tra_file' || item.status === 'done')
                ) {
                  e.stopPropagation();
                  onOpenDebtReminder(item);
                }
              }}
              className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/70 flex items-center gap-1 flex-shrink-0 cursor-pointer"
              title="Còn nợ tiền show"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              <span>Nợ: {remainingDebt.toLocaleString('vi-VN')} đ</span>
            </span>
          ) : (
            <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Đã đủ 100%</span>
            </span>
          )}

          {onEditFinancials && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditFinancials(item);
              }}
              className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cập nhật tài chính"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
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
  onDeleteBooking?: (booking: CalendarEvent) => void;
  onEditFinancials?: (booking: CalendarEvent) => void;
  onEditCategory?: (booking: CalendarEvent) => void;
}> = ({ item, columnStatus, onSelectBooking, onOpenDebtReminder, onStatusChange, onDeleteBooking, onEditFinancials, onEditCategory }) => {
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
    transition: isDragging ? undefined : transition,
    touchAction: 'none',
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 min-h-[75px] opacity-40 transition-none"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full">
      <CompactKanbanCardContent
        item={item}
        onSelectBooking={onSelectBooking}
        onOpenDebtReminder={onOpenDebtReminder}
        onStatusChange={onStatusChange}
        onDeleteBooking={onDeleteBooking}
        onEditFinancials={onEditFinancials}
        onEditCategory={onEditCategory}
      />
    </div>
  );
};

// Droppable Column Component
const KanbanColumn: React.FC<{
  column: ColumnDef;
  events: CalendarEvent[];
  totalColEventsCount: number;
  archivedCount: number;
  isHighlighted?: boolean;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onDeleteBooking?: (booking: CalendarEvent) => void;
  onEditFinancials?: (booking: CalendarEvent) => void;
  onEditCategory?: (booking: CalendarEvent) => void;
  onOpenDoneHistory?: () => void;
}> = ({
  column,
  events,
  totalColEventsCount,
  archivedCount,
  isHighlighted = false,
  onSelectBooking,
  onOpenDebtReminder,
  onStatusChange,
  onDeleteBooking,
  onEditFinancials,
  onEditCategory,
  onOpenDoneHistory,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
    data: {
      type: 'Column',
      status: column.status,
    },
  });

  const totalRevenue = events.reduce((acc, e) => acc + e.packagePrice, 0);
  const activeHover = isOver || isHighlighted;
  const isDoneColumn = column.status === 'done';

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[320px] w-[320px] flex-shrink-0 flex flex-col rounded-xl p-4 transition-all duration-150 ${
        activeHover
          ? 'border border-amber-400 bg-amber-500/10 dark:bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40 backdrop-blur-md'
          : 'bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-sm'
      }`}
    >
      {/* Column Header: Tách biệt nhẹ nhàng bằng đường viền mỏng ở dưới */}
      <div className="pb-3 mb-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Chấm tròn nhỏ (dot) màu cạnh tiêu đề cột, tuyệt đối KHÔNG tô màu cả khối nền */}
          <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor} flex-shrink-0 shadow-sm`} />
          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center font-mono">
            {column.stepNum}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            {column.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isDoneColumn && archivedCount > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
              title={`${archivedCount} show cũ hơn 7 ngày đã tự động lưu trữ`}
            >
              + {archivedCount} cũ
            </span>
          )}
          <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 shadow-sm">
            {events.length}
          </span>
        </div>
      </div>

      {/* Subtotal of column: Không nền màu chói lóa, màu chuẩn text-gray-600 dark:text-gray-300 và text-sm font-medium text-gray-900 dark:text-white */}
      <div className="mb-3 px-1 text-xs text-gray-600 dark:text-gray-300 font-mono flex items-center justify-between">
        <span>{isDoneColumn ? 'Doanh thu 7 ngày:' : 'Tổng giá trị cột:'}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {totalRevenue.toLocaleString('vi-VN')} đ
        </span>
      </div>

      {/* Cards list with SortableContext */}
      <SortableContext items={events.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 flex-1 min-h-[120px]">
          {events.length === 0 ? (
            <div
              className={`text-center py-8 px-2 text-xs border border-dashed rounded-xl transition-colors ${
                activeHover
                  ? 'border-amber-400 bg-amber-500/10 text-amber-500 dark:text-amber-300 font-bold'
                  : 'border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500'
              }`}
            >
              {activeHover ? 'Thả vào đây để đổi trạng thái' : 'Trống lịch'}
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
                onDeleteBooking={onDeleteBooking}
                onEditFinancials={onEditFinancials}
                onEditCategory={onEditCategory}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Cơ chế Auto-Archive: Nút "Xem lịch sử hoàn tất" ở cuối cột Hoàn tất */}
      {isDoneColumn && onOpenDoneHistory && (
        <div className="pt-3 mt-auto border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={onOpenDoneHistory}
            className="w-full py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-white/5 dark:hover:bg-white/10 border border-purple-200 dark:border-white/10 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Xem lịch sử hoàn tất ({totalColEventsCount})</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const KanbanView: React.FC<Props> = ({
  events,
  onStatusChange,
  onSelectBooking,
  onOpenDebtReminder,
  onDeleteBooking,
  onEditFinancials,
  onEditCategory,
  studioName,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isDoneHistoryOpen, setIsDoneHistoryOpen] = useState(false);
  const [zaloNotification, setZaloNotification] = useState<{
    isOpen: boolean;
    booking: CalendarEvent | null;
    targetStatus: BookingStatus | null;
  }>({
    isOpen: false,
    booking: null,
    targetStatus: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

    let targetStatus: BookingStatus | null = null;

    const overData = over.data?.current;
    if (overData?.columnStatus) {
      targetStatus = overData.columnStatus;
    } else if (overData?.status) {
      targetStatus = overData.status;
    }

    if (!targetStatus) {
      const directCol = COLUMNS.find(c => c.status === over.id);
      if (directCol) {
        targetStatus = directCol.status;
      }
    }

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

    if (targetStatus && targetStatus !== activeBooking.status) {
      if (onStatusChange) {
        onStatusChange(activeBooking.id, targetStatus);
      }

      if (
        targetStatus === 'deposited' ||
        targetStatus === 'da_chot' ||
        targetStatus === 'done' ||
        targetStatus === 'hoan_thanh'
      ) {
        setZaloNotification({
          isOpen: true,
          booking: { ...activeBooking, status: targetStatus },
          targetStatus: targetStatus,
        });
      }
    }
  };

  const activeBooking = activeId ? events.find(e => e.id === activeId) : null;

  // Danh sách toàn bộ các buổi chụp đã hoàn tất để hiển thị trong Modal Lịch sử
  const allCompletedBookings = events.filter(
    e => e.status === 'done' || e.status === 'hoan_thanh'
  );

  return (
    <div className="space-y-4">
      {/* Title & Pipeline View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
            Quy Trình 5 Bước Chuẩn Nhiếp Ảnh (Photography Kanban Pipeline)
          </span>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Bảng Kanban Tiến Độ Show
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] shadow-sm">
            <GripVertical className="w-3.5 h-3.5 text-amber-500" />
            <span>Kéo bất kỳ thẻ nào để đổi cột</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Realtime Supabase Sync</span>
          </div>
        </div>
      </div>

      {/* 5 Kanban Columns: Container flex flex-nowrap overflow-x-auto gap-4 p-4 */}
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-nowrap overflow-x-auto gap-4 p-4 pb-6 scrollbar-thin">
          {COLUMNS.map(col => {
            const allColEvents = events.filter(
              e => col.matchStatuses.includes(e.status) || e.status === col.status
            );

            // Auto-Archive cho cột 'done': Chỉ hiển thị các thẻ được cập nhật trong 7 ngày gần nhất
            const isDoneColumn = col.status === 'done';
            const displayedEvents = isDoneColumn
              ? allColEvents.filter(isDoneRecently)
              : allColEvents;

            const archivedCount = isDoneColumn
              ? allColEvents.length - displayedEvents.length
              : 0;

            const isColHighlighted = Boolean(
              overId &&
                (col.status === overId ||
                  displayedEvents.some(e => e.id === overId))
            );

            return (
              <KanbanColumn
                key={col.status}
                column={col}
                events={displayedEvents}
                totalColEventsCount={allColEvents.length}
                archivedCount={archivedCount}
                isHighlighted={isColHighlighted}
                onSelectBooking={onSelectBooking}
                onOpenDebtReminder={onOpenDebtReminder}
                onStatusChange={onStatusChange}
                onDeleteBooking={onDeleteBooking}
                onEditFinancials={onEditFinancials}
                onEditCategory={onEditCategory}
                onOpenDoneHistory={() => setIsDoneHistoryOpen(true)}
              />
            );
          })}
        </div>

        {/* Drag Overlay: Hiển thị Compact Card nổi khi đang kéo thả */}
        <DragOverlay
          dropAnimation={{
            duration: 150,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {activeBooking ? (
            <div className="w-[300px] max-w-full cursor-grabbing pointer-events-none">
              <CompactKanbanCardContent item={activeBooking} isOverlay={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal Lịch Sử Lịch Chụp Hoàn Tất (Auto-Archive Viewer) */}
      <CompletedShootsHistoryModal
        isOpen={isDoneHistoryOpen}
        onClose={() => setIsDoneHistoryOpen(false)}
        completedBookings={allCompletedBookings}
        onSelectBooking={onSelectBooking}
        onDeleteBooking={onDeleteBooking}
      />

      {/* Modal Gửi thông báo Zalo tự động chăm sóc khách hàng */}
      <ZaloNotificationModal
        isOpen={zaloNotification.isOpen}
        booking={zaloNotification.booking}
        targetStatus={zaloNotification.targetStatus}
        studioName={studioName}
        onClose={() =>
          setZaloNotification({ isOpen: false, booking: null, targetStatus: null })
        }
      />
    </div>
  );
};
