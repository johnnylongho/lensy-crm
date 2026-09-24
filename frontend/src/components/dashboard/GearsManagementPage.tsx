import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GearItem, GearType, GearStatus } from '../../types';
import {
  Camera,
  Layers,
  Lightbulb,
  Mic,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Wrench,
  ShieldCheck,
  LayoutGrid,
  List,
  Sparkle,
  Coins,
  DollarSign,
} from 'lucide-react';

const GEAR_TYPE_LABELS: Record<GearType, { label: string; icon: React.ReactNode; color: string }> = {
  camera: {
    label: 'Máy Ảnh (Camera)',
    icon: <Camera className="w-4 h-4 text-sky-400" />,
    color: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  },
  lens: {
    label: 'Ống Kính (Lens)',
    icon: <Layers className="w-4 h-4 text-purple-400" />,
    color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  lighting: {
    label: 'Đèn Chiếu Sáng (Lighting)',
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  audio: {
    label: 'Âm Thanh / Mic',
    icon: <Mic className="w-4 h-4 text-emerald-400" />,
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  accessory: {
    label: 'Phụ Kiện / Gimbal',
    icon: <SlidersHorizontal className="w-4 h-4 text-indigo-400" />,
    color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  },
  other: {
    label: 'Khác',
    icon: <Wrench className="w-4 h-4 text-slate-400" />,
    color: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  },
};

const GEAR_STATUS_LABELS: Record<GearStatus, { label: string; color: string }> = {
  active: {
    label: 'Hoạt động tốt',
    color: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
  },
  maintenance: {
    label: 'Đang bảo dưỡng',
    color: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
  },
  retired: {
    label: 'Ngừng sử dụng',
    color: 'bg-slate-900 border-slate-700 text-slate-400',
  },
};

export const GearsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItem | null>(null);
  const [gearName, setGearName] = useState('');
  const [gearType, setGearType] = useState<GearType>('camera');
  const [gearStatus, setGearStatus] = useState<GearStatus>('active');
  const [purchasePrice, setPurchasePrice] = useState<number | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Preset Templates for Freelancers & Studio (Kèm giá tham khảo thị trường)
  const STUDIO_PRESETS: Array<{ name: string; type: GearType; price: number }> = [
    { name: 'Sony Alpha 7 IV (Chính)', type: 'camera', price: 48000000 },
    { name: 'Sony Alpha 7R V (High-Res)', type: 'camera', price: 75000000 },
    { name: 'Canon EOS R6 Mark II', type: 'camera', price: 52000000 },
    { name: 'Sony FE 24-70mm f/2.8 GM II', type: 'lens', price: 49000000 },
    { name: 'Sony FE 70-200mm f/2.8 GM OSS II', type: 'lens', price: 62000000 },
    { name: 'Sony FE 50mm f/1.2 GM', type: 'lens', price: 42000000 },
    { name: 'Đèn Studio Godox AD600 Pro', type: 'lighting', price: 16500000 },
    { name: 'Đèn Flash Godox V1 Sony', type: 'lighting', price: 6500000 },
    { name: 'Gimbal DJI RS3 Pro', type: 'accessory', price: 18000000 },
    { name: 'Micro Thu Âm DJI Mic 2', type: 'audio', price: 7500000 },
  ];

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch gears from Supabase
  const fetchGears = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('gears')
          .select('*')
          .order('created_at', { ascending: false });

        if (user) {
          query = query.eq('photographer_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setGears(data || []);
      } else {
        // Mock fallback với purchase_price đầy đủ
        setGears([
          { id: '1', name: 'Sony Alpha 7 IV', type: 'camera', status: 'active', purchase_price: 48000000 },
          { id: '2', name: 'Sony FE 24-70mm f/2.8 GM II', type: 'lens', status: 'active', purchase_price: 49000000 },
          { id: '3', name: 'Đèn Studio Godox AD600 Pro', type: 'lighting', status: 'active', purchase_price: 16500000 },
        ]);
      }
    } catch (err: any) {
      console.error('Lỗi khi fetch danh sách thiết bị:', err);
      setToast({ type: 'error', message: 'Không thể tải thiết bị: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGears();
  }, [user]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingGear(null);
    setGearName('');
    setGearType('camera');
    setGearStatus('active');
    setPurchasePrice('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (gear: GearItem) => {
    setEditingGear(gear);
    setGearName(gear.name);
    setGearType(gear.type);
    setGearStatus(gear.status);
    setPurchasePrice(gear.purchase_price !== undefined ? gear.purchase_price : '');
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gearName.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập tên thiết bị.' });
      return;
    }

    const numericPrice = Number(purchasePrice) || 0;

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        if (editingGear) {
          // Update
          const { error } = await supabase
            .from('gears')
            .update({
              name: gearName.trim(),
              type: gearType,
              status: gearStatus,
              purchase_price: numericPrice,
            })
            .eq('id', editingGear.id);

          if (error) throw error;
          setToast({ type: 'success', message: `Đã cập nhật thiết bị "${gearName}"!` });
        } else {
          // Insert
          const newGearPayload = {
            name: gearName.trim(),
            type: gearType,
            status: gearStatus,
            purchase_price: numericPrice,
            photographer_id: user?.id || '87239d64-5964-47b1-a146-f12f3d41de9e',
          };
          const { error } = await supabase.from('gears').insert([newGearPayload]);
          if (error) throw error;
          setToast({ type: 'success', message: `Đã thêm thiết bị mới "${gearName}"!` });
        }
      } else {
        // Mock fallback
        if (editingGear) {
          setGears(prev =>
            prev.map(g =>
              g.id === editingGear.id
                ? { ...g, name: gearName.trim(), type: gearType, status: gearStatus, purchase_price: numericPrice }
                : g
            )
          );
        } else {
          const newG: GearItem = {
            id: 'mock-' + Date.now(),
            name: gearName.trim(),
            type: gearType,
            status: gearStatus,
            purchase_price: numericPrice,
          };
          setGears(prev => [newG, ...prev]);
        }
        setToast({ type: 'success', message: 'Thao tác thành công (Demo)!' });
      }

      setIsModalOpen(false);
      fetchGears();
    } catch (err: any) {
      console.error('Lỗi lưu thiết bị:', err);
      setToast({ type: 'error', message: 'Lỗi: ' + (err.message || 'Không thể lưu') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Gear
  const handleDeleteGear = async (gear: GearItem) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thiết bị "${gear.name}" khỏi danh sách?`)) {
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('gears').delete().eq('id', gear.id);
        if (error) throw error;
      }
      setGears(prev => prev.filter(g => g.id !== gear.id));
      setToast({ type: 'success', message: `Đã xóa thiết bị "${gear.name}"!` });
    } catch (err: any) {
      console.error('Lỗi khi xóa thiết bị:', err);
      setToast({ type: 'error', message: 'Không thể xóa: ' + err.message });
    }
  };

  // Filtered Gears
  const filteredGears = gears.filter(g => {
    const matchCategory = selectedCategory === 'all' || g.type === selectedCategory;
    const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Metrics
  const totalCount = gears.length;
  const cameraCount = gears.filter(g => g.type === 'camera').length;
  const lensCount = gears.filter(g => g.type === 'lens').length;
  const lightingCount = gears.filter(g => g.type === 'lighting').length;
  const activeCount = gears.filter(g => g.status === 'active').length;
  const totalInvestment = gears.reduce((sum, g) => sum + (Number(g.purchase_price) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 text-slate-100">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideDown max-w-md">
          <div
            className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-0.5 shadow-lg shadow-sky-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Quản Lý Thiết Bị Studio
                </h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300">
                  USP 2 • Conflict Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kho thiết bị Camera, Lens, Đèn chụp phục vụ gán thiết bị vào từng show và chống trùng lịch
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Thiết Bị Mới</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thiết Bị</span>
          <div className="text-2xl font-black font-mono text-white">{totalCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Body Máy Ảnh</span>
          <div className="text-2xl font-black font-mono text-sky-300">{cameraCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Ống Kính (Lens)</span>
          <div className="text-2xl font-black font-mono text-purple-300">{lensCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Đèn Studio</span>
          <div className="text-2xl font-black font-mono text-amber-300">{lightingCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Sẵn Sàng</span>
          <div className="text-2xl font-black font-mono text-emerald-300">{activeCount} / {totalCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/30 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>Tổng Tài Sản Kho</span>
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-amber-300 truncate" title={`${totalInvestment.toLocaleString('vi-VN')} đ`}>
            {totalInvestment.toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Filter, Search, and View Mode Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên máy, lens, đèn, gimbal..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none"
          />
        </div>

        {/* Category Pills & View Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'camera', label: '📷 Máy ảnh' },
              { id: 'lens', label: '🔍 Ống kính' },
              { id: 'lighting', label: '💡 Đèn' },
              { id: 'accessory', label: '🎬 Phụ kiện' },
            ].map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 flex-shrink-0 ml-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem dạng lưới (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem dạng bảng (Table)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gears List Grid or Table */}
      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          <p className="text-xs text-slate-400">Đang tải kho thiết bị của bạn...</p>
        </div>
      ) : filteredGears.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <Camera className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Chưa có thiết bị nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hãy bấm nút "Thêm Thiết Bị Mới" để khai báo các Body máy, Ống kính, Đèn Studio bạn đang sở hữu.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thiết Bị Đầu Tiên</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* DẠNG BẢNG (TABLE VIEW) */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3.5 px-4">Thiết Bị</th>
                  <th className="py-3.5 px-4">Phân Loại</th>
                  <th className="py-3.5 px-4">Trạng Thái Khả Dụng</th>
                  <th className="py-3.5 px-4 text-right">Giá Mua (VNĐ)</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Mã Thiết Bị</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredGears.map(gear => {
                  const typeConfig = GEAR_TYPE_LABELS[gear.type] || GEAR_TYPE_LABELS.other;
                  const statusConfig = GEAR_STATUS_LABELS[gear.status] || GEAR_STATUS_LABELS.active;
                  const price = Number(gear.purchase_price) || 0;

                  return (
                    <tr
                      key={gear.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                            {typeConfig.icon}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block group-hover:text-amber-300 transition-colors">
                              {gear.name}
                            </span>
                            <span className="text-[10px] text-slate-500 md:hidden font-mono">
                              {gear.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${typeConfig.color}`}>
                          {typeConfig.label.split(' ')[0]}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${statusConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${gear.status === 'active' ? 'bg-emerald-400' : gear.status === 'maintenance' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {price > 0 ? `${price.toLocaleString('vi-VN')} đ` : <span className="text-slate-600 font-normal">Chưa nhập</span>}
                        </span>
                      </td>

                      <td className="py-3 px-4 hidden md:table-cell font-mono text-[11px] text-slate-500">
                        {gear.id}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(gear)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Sửa thiết bị"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGear(gear)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DẠNG LƯỚI (GRID VIEW) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGears.map(gear => {
            const typeConfig = GEAR_TYPE_LABELS[gear.type] || GEAR_TYPE_LABELS.other;
            const statusConfig = GEAR_STATUS_LABELS[gear.status] || GEAR_STATUS_LABELS.active;
            const price = Number(gear.purchase_price) || 0;

            return (
              <div
                key={gear.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all shadow-md space-y-3 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${typeConfig.color}`}>
                      {typeConfig.icon}
                      <span>{typeConfig.label.split(' ')[0]}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {gear.name}
                  </h3>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/60">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>Giá mua:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-xs">
                      {price > 0 ? `${price.toLocaleString('vi-VN')} đ` : <span className="text-slate-600 font-normal">Chưa nhập</span>}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {gear.id.substring(0, 8)}...
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(gear)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Sửa thiết bị"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGear(gear)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors"
                      title="Xóa thiết bị"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Add / Edit Gear Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5 text-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingGear ? 'Chỉnh Sửa Thiết Bị' : 'Thêm Thiết Bị Mới'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingGear ? 'Cập nhật thông tin thiết bị trong kho' : 'Khai báo thiết bị bạn đang sở hữu'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Presets for New Gear */}
              {!editingGear && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chọn Nhanh Thiết Bị Phổ Biến (Mirmia Presets):</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    {STUDIO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setGearName(preset.name);
                          setGearType(preset.type);
                          setPurchasePrice(preset.price);
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-800 text-slate-300 transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tên Thiết Bị */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Tên Thiết Bị (Model / Hãng) *
                </label>
                <input
                  type="text"
                  required
                  value={gearName}
                  onChange={e => setGearName(e.target.value)}
                  placeholder="VD: Sony Alpha 7 IV hoặc Lens FE 24-70mm GM II"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none"
                />
              </div>

              {/* Phân Loại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Phân Loại Thiết Bị *
                </label>
                <select
                  value={gearType}
                  onChange={e => setGearType(e.target.value as GearType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-white transition-all outline-none"
                >
                  <option value="camera">📷 Máy ảnh (Body Camera)</option>
                  <option value="lens">🔍 Ống kính (Lens)</option>
                  <option value="lighting">💡 Đèn Studio / Flash</option>
                  <option value="audio">🎙️ Âm thanh / Micro thu âm</option>
                  <option value="accessory">🎬 Phụ kiện / Gimbal / Chân máy</option>
                  <option value="other">🔧 Khác</option>
                </select>
              </div>

              {/* Giá Mua Thiết Bị (VNĐ) - Dành cho tính ROI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Giá Mua Thiết Bị (VNĐ)</span>
                  </label>
                  {Number(purchasePrice) > 0 && (
                    <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {Number(purchasePrice).toLocaleString('vi-VN')} đ
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value)}
                    placeholder="VD: 48000000 (48 triệu VNĐ)"
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">
                    VNĐ
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dùng để tính toán Tiến độ Hoàn Vốn (ROI Progress Bar) trên Dashboard.
                </p>
              </div>

              {/* Trạng Thái */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Trạng Thái Khả Dụng *
                </label>
                <select
                  value={gearStatus}
                  onChange={e => setGearStatus(e.target.value as GearStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-xs text-white transition-all outline-none"
                >
                  <option value="active">🟢 Đang hoạt động tốt (Sẵn sàng đi show)</option>
                  <option value="maintenance">🟡 Đang bảo dưỡng / vệ sinh</option>
                  <option value="retired">⚪ Ngừng sử dụng / Đã bán</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingGear ? 'Cập Nhật' : 'Thêm Vào Kho'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
