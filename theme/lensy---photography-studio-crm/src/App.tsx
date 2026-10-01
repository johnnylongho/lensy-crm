import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  CalendarCheck,
  Calendar,
  Users,
  Camera,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Mail,
  Bell,
  Plus,
  ArrowUpRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Download,
  Filter,
  X,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Eye,
  Trash2,
  UploadCloud,
  Check,
  Phone,
  DollarSign,
  Tag
} from 'lucide-react';

// --- TYPES ---
interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  category: string;
  iconType: 'blue-bars' | 'teal-rings' | 'green-clover' | 'orange-ring' | 'purple-dots';
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  currentTask: string;
  status: 'On-shoot' | 'In Progress' | 'Editing' | 'Available';
  avatarBg: string;
  avatarText: string;
}

interface Booking {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  location: string;
  price: number;
  deposit: number;
  status: 'Confirmed' | 'Shooting' | 'Editing' | 'Delivered' | 'Pending Deposit';
}

interface GearItem {
  id: string;
  name: string;
  category: string;
  serial: string;
  value: number;
  condition: 'Excellent' | 'Good' | 'Maintenance Required';
  assignedTo?: string;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'calendar' | 'clients' | 'gear'>('dashboard');

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showShootDetailsModal, setShowShootDetailsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImportCsvModal, setShowImportCsvModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  // Time Tracker state
  const [timerSeconds, setTimerSeconds] = useState(5048); // 01:24:08 in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toast Helper
  const triggerToast = (msg: string) => {
    setShowNotificationToast(msg);
    setTimeout(() => {
      setShowNotificationToast(null);
    }, 3200);
  };

  // Selected Day in Revenue Overview
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Tuesday default

  const revenueDays = [
    { day: 'S', name: 'Chủ Nhật', amount: '18,500,000 ₫', height: '55%', type: 'hatched', percentage: '45%' },
    { day: 'M', name: 'Thứ Hai', amount: '26,000,000 ₫', height: '70%', type: 'solid-green', percentage: '65%' },
    { day: 'T', name: 'Thứ Ba', amount: '32,400,000 ₫', height: '65%', type: 'mint', percentage: '74%' },
    { day: 'W', name: 'Thứ Tư', amount: '48,000,000 ₫', height: '95%', type: 'deep-green', percentage: '92%' },
    { day: 'T', name: 'Thứ Năm', amount: '22,000,000 ₫', height: '58%', type: 'hatched', percentage: '52%' },
    { day: 'F', name: 'Thứ Sáu', amount: '19,200,000 ₫', height: '48%', type: 'hatched', percentage: '48%' },
    { day: 'S', name: 'Thứ Bảy', amount: '24,000,000 ₫', height: '60%', type: 'hatched', percentage: '58%' },
  ];

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: 'Edit photos for Phú & Mai',
      dueDate: 'Due date: Oct 04, 2026',
      completed: false,
      category: 'Post-production',
      iconType: 'blue-bars'
    },
    {
      id: 'task-2',
      title: 'Check camera sensor & clean 85mm f/1.2',
      dueDate: 'Due date: Oct 05, 2026',
      completed: false,
      category: 'Gear Maintenance',
      iconType: 'teal-rings'
    },
    {
      id: 'task-3',
      title: 'Send preview gallery to Lan Anh',
      dueDate: 'Due date: Oct 07, 2026',
      completed: false,
      category: 'Client Delivery',
      iconType: 'green-clover'
    },
    {
      id: 'task-4',
      title: 'Backup SD cards - Wedding Gala',
      dueDate: 'Due date: Oct 08, 2026',
      completed: true,
      category: 'Data Management',
      iconType: 'orange-ring'
    },
    {
      id: 'task-5',
      title: 'Lighting test for Lookbook Autumn',
      dueDate: 'Due date: Oct 10, 2026',
      completed: false,
      category: 'Studio Prep',
      iconType: 'purple-dots'
    }
  ]);

  // Staff State
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: 'staff-1',
      name: 'Nguyễn Hoàng Nam',
      role: 'Lead Photographer',
      currentTask: 'Shooting Pre-wedding Đà Lạt',
      status: 'On-shoot',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      avatarText: 'HN'
    },
    {
      id: 'staff-2',
      name: 'Lê Thảo Linh',
      role: 'Master Makeup Artist',
      currentTask: 'Bridal Glam for Chị Mai',
      status: 'On-shoot',
      avatarBg: 'bg-rose-100 text-rose-800',
      avatarText: 'TL'
    },
    {
      id: 'staff-3',
      name: 'Trần Đức Anh',
      role: 'Retoucher / Colorist',
      currentTask: 'Color Grading Lookbook FW26',
      status: 'Editing',
      avatarBg: 'bg-amber-100 text-amber-800',
      avatarText: 'ĐA'
    },
    {
      id: 'staff-4',
      name: 'Vũ Minh Châu',
      role: '2nd Shooter / Lighting Tech',
      currentTask: 'Studio Setup Room B',
      status: 'Available',
      avatarBg: 'bg-sky-100 text-sky-800',
      avatarText: 'MC'
    }
  ]);

  // Bookings List State
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'bk-101',
      client: 'Anh Nam & Chị Linh',
      service: 'Pre-wedding Diamond 4K',
      date: 'Oct 02, 2026',
      time: '02:00 PM - 05:30 PM',
      location: 'Đà Lạt Pine Forest',
      price: 28000000,
      deposit: 15000000,
      status: 'Confirmed'
    },
    {
      id: 'bk-102',
      client: 'Phú & Mai',
      service: 'Wedding Traditional & Party',
      date: 'Oct 06, 2026',
      time: '07:00 AM - 01:00 PM',
      location: 'Gem Center, Q1, HCM',
      price: 36000000,
      deposit: 20000000,
      status: 'Confirmed'
    },
    {
      id: 'bk-103',
      client: 'Thương hiệu IVY Moda',
      service: 'Fashion Lookbook Autumn/Winter',
      date: 'Oct 09, 2026',
      time: '09:00 AM - 04:00 PM',
      location: 'Lensy Studio Room A',
      price: 42000000,
      deposit: 42000000,
      status: 'Confirmed'
    },
    {
      id: 'bk-104',
      client: 'Gia đình Bác Hải',
      service: 'Family Heritage Portrait',
      date: 'Oct 12, 2026',
      time: '03:00 PM - 05:00 PM',
      location: 'Lensy Studio Room B',
      price: 12000000,
      deposit: 6000000,
      status: 'Pending Deposit'
    },
    {
      id: 'bk-105',
      client: 'Chị Lan Anh',
      service: 'Maternity Fine Art',
      date: 'Oct 14, 2026',
      time: '01:30 PM - 03:30 PM',
      location: 'Lensy Studio Room A',
      price: 9500000,
      deposit: 9500000,
      status: 'Confirmed'
    }
  ]);

  // Gear Inventory State
  const [gearList] = useState<GearItem[]>([
    {
      id: 'gear-1',
      name: 'Sony Alpha 7R V (Body)',
      category: 'Camera',
      serial: 'SN-7849201',
      value: 68000000,
      condition: 'Excellent',
      assignedTo: 'Nguyễn Hoàng Nam'
    },
    {
      id: 'gear-2',
      name: 'Sony FE 85mm f/1.2 GM Lens',
      category: 'Lens',
      serial: 'SN-4439120',
      value: 42000000,
      condition: 'Good',
      assignedTo: 'Nguyễn Hoàng Nam'
    },
    {
      id: 'gear-3',
      name: 'Godox AD600Pro TTL Strobe Light Kit',
      category: 'Lighting',
      serial: 'SN-9102381',
      value: 24000000,
      condition: 'Excellent',
      assignedTo: 'Vũ Minh Châu'
    },
    {
      id: 'gear-4',
      name: 'DJI RS 3 Pro Gimbal Stabilizer',
      category: 'Support',
      serial: 'SN-3298104',
      value: 16000000,
      condition: 'Good',
      assignedTo: 'Studio Room A'
    }
  ]);

  // New Booking Form State
  const [newBookingData, setNewBookingData] = useState({
    client: '',
    service: 'Pre-wedding Diamond 4K',
    date: '2026-10-15',
    time: '09:00 AM - 12:00 PM',
    location: 'Lensy Studio Room A',
    price: '25,000,000 ₫',
    deposit: '10,000,000 ₫'
  });

  // New Task Input
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Oct 15, 2026');

  // New Staff Input
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Assistant Photographer');

  // Filtered lists based on search
  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.currentTask.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle task completion
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Add Task Handler
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: `Due date: ${newTaskDueDate}`,
      completed: false,
      category: 'Studio Task',
      iconType: 'green-clover'
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowNewTaskModal(false);
    triggerToast('Added new task successfully!');
  };

  // Add Booking Handler
  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingData.client.trim()) return;
    const cleanPrice = parseInt(newBookingData.price.replace(/\D/g, '')) || 20000000;
    const cleanDeposit = parseInt(newBookingData.deposit.replace(/\D/g, '')) || 10000000;
    const newBk: Booking = {
      id: `bk-${Date.now()}`,
      client: newBookingData.client.trim(),
      service: newBookingData.service,
      date: newBookingData.date,
      time: newBookingData.time,
      location: newBookingData.location,
      price: cleanPrice,
      deposit: cleanDeposit,
      status: 'Confirmed'
    };
    setBookings([newBk, ...bookings]);
    setShowNewBookingModal(false);
    triggerToast(`Created booking for ${newBk.client}!`);
  };

  // Add Staff Handler
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    const initials = newStaffName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(-2)
      .toUpperCase();
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole,
      currentTask: 'Standby / Scheduled for upcoming shoot',
      status: 'Available',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      avatarText: initials
    };
    setStaff([...staff, newMember]);
    setNewStaffName('');
    setShowAddStaffModal(false);
    triggerToast(`Added ${newMember.name} to team roster!`);
  };

  // Helper for task decorative icon (matches the exact icon marks in Donezo image)
  const renderTaskIcon = (type: Task['iconType']) => {
    switch (type) {
      case 'blue-bars':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="4" x2="6" y2="20" />
              <line x1="12" y1="9" x2="12" y2="20" />
              <line x1="18" y1="14" x2="18" y2="20" />
            </svg>
          </div>
        );
      case 'teal-rings':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        );
      case 'green-clover':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M22 12a3 3 0 0 0-3-3h-1a3 3 0 0 0 0 6h1a3 3 0 0 0 3-3z" />
              <path d="M12 22a3 3 0 0 0 3-3v-1a3 3 0 0 0-6 0v1a3 3 0 0 0 3 3z" />
              <path d="M2 12a3 3 0 0 0 3 3h1a3 3 0 0 0 0-6H5a3 3 0 0 0-3 3z" />
            </svg>
          </div>
        );
      case 'orange-ring':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="7" strokeDasharray="4 2" />
            </svg>
          </div>
        );
      case 'purple-dots':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="8" r="2.5" />
              <circle cx="16" cy="8" r="2.5" />
              <circle cx="12" cy="16" r="2.5" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 p-2 sm:p-4 md:p-6 lg:p-8 font-sans antialiased flex justify-center">
      {/* Toast Notification */}
      {showNotificationToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#134e35] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-emerald-700/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-medium">{showNotificationToast}</span>
        </div>
      )}

      {/* Main Container Card (Dashboard Shell) */}
      <div className="w-full max-w-[1440px] bg-white rounded-3xl shadow-sm border border-gray-200/90 overflow-hidden flex flex-col md:flex-row min-h-[920px]">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR */}
        {/* ========================================================================= */}
        <aside className="w-full md:w-[240px] lg:w-[260px] bg-white border-r border-gray-100 p-6 flex flex-col justify-between shrink-0">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#134e35]">
                {/* Stylized camera aperture / curved infinity mark */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <circle cx="12" cy="12" r="3" fill="#134e35" />
                </svg>
              </div>
              <span className="font-bold text-2xl text-gray-900 tracking-tight">Lensy</span>
            </div>

            {/* Menu Section */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3 px-3">
                Menu
              </p>
              <nav className="space-y-1">
                {/* Dashboard */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                    activeTab === 'dashboard'
                      ? 'text-gray-900 bg-gray-50/80 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {activeTab === 'dashboard' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#134e35] rounded-r-full" />
                  )}
                  <LayoutGrid
                    className={`w-4 h-4 ${
                      activeTab === 'dashboard' ? 'text-[#134e35]' : 'text-gray-400'
                    }`}
                  />
                  <span>Dashboard</span>
                </button>

                {/* Bookings */}
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                    activeTab === 'bookings'
                      ? 'text-gray-900 bg-gray-50/80 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {activeTab === 'bookings' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#134e35] rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <CalendarCheck
                      className={`w-4 h-4 ${
                        activeTab === 'bookings' ? 'text-[#134e35]' : 'text-gray-400'
                      }`}
                    />
                    <span>Bookings</span>
                  </div>
                  <span className="bg-gray-900 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
                    12+
                  </span>
                </button>

                {/* Calendar */}
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                    activeTab === 'calendar'
                      ? 'text-gray-900 bg-gray-50/80 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {activeTab === 'calendar' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#134e35] rounded-r-full" />
                  )}
                  <Calendar
                    className={`w-4 h-4 ${
                      activeTab === 'calendar' ? 'text-[#134e35]' : 'text-gray-400'
                    }`}
                  />
                  <span>Calendar</span>
                </button>

                {/* Clients */}
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                    activeTab === 'clients'
                      ? 'text-gray-900 bg-gray-50/80 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {activeTab === 'clients' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#134e35] rounded-r-full" />
                  )}
                  <Users
                    className={`w-4 h-4 ${
                      activeTab === 'clients' ? 'text-[#134e35]' : 'text-gray-400'
                    }`}
                  />
                  <span>Clients</span>
                </button>

                {/* Gear Asset */}
                <button
                  onClick={() => setActiveTab('gear')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                    activeTab === 'gear'
                      ? 'text-gray-900 bg-gray-50/80 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {activeTab === 'gear' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#134e35] rounded-r-full" />
                  )}
                  <Camera
                    className={`w-4 h-4 ${
                      activeTab === 'gear' ? 'text-[#134e35]' : 'text-gray-400'
                    }`}
                  />
                  <span>Studio Gear</span>
                </button>
              </nav>
            </div>

            {/* General Section */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3 px-3">
                General
              </p>
              <nav className="space-y-1">
                <button
                  onClick={() => triggerToast('Studio settings saved')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 transition"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => triggerToast('Lensy Help Center opened')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 transition"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span>Help</span>
                </button>

                <button
                  onClick={() => triggerToast('Logged out of demo session')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 transition"
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Bottom Card (Upgrade to Pro - Dark Green Stylized Card) */}
          <div className="mt-4 bg-[#0a2f1c] text-white p-4 rounded-2xl relative overflow-hidden shadow-md">
            {/* Decorative background contour waves */}
            <svg
              className="absolute -right-6 -bottom-6 w-36 h-36 opacity-25 text-emerald-400 pointer-events-none"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="50" cy="50" r="20" />
              <circle cx="50" cy="50" r="35" />
              <circle cx="50" cy="50" r="50" />
              <circle cx="50" cy="50" r="65" />
            </svg>

            <div className="relative z-10">
              <div className="w-7 h-7 rounded-lg bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>

              <h4 className="font-semibold text-sm leading-tight text-white mb-1">
                Upgrade to Pro
              </h4>
              <p className="text-[12px] text-emerald-200/80 leading-normal mb-3">
                Unlimited 4K galleries, RAW cloud storage &amp; client contracts.
              </p>

              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-[#134e35] hover:bg-[#1a6445] text-white text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm border border-emerald-600/30 cursor-pointer"
              >
                <span>Upgrade Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN VIEWPORT */}
        {/* ========================================================================= */}
        <main className="flex-1 bg-[#fafafa] p-5 sm:p-7 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Navigation Bar */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative w-full sm:w-[320px] md:w-[360px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bookings, clients, gear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 pl-10 pr-14 py-2 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#134e35]/20 focus:border-[#134e35] transition shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                  ⌘F
                </span>
              </div>

              {/* Right Profile & Notifications Area */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Messages */}
                <button
                  onClick={() => triggerToast('Inbox: All client messages up to date')}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
                  title="Messages"
                >
                  <Mail className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <button
                  onClick={() => triggerToast('Notification: 2 deposits cleared this morning')}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 absolute top-2.5 right-2.5" />
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 overflow-hidden flex items-center justify-center text-amber-900 font-bold text-sm shadow-2xs">
                    HN
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-semibold text-sm text-gray-900 leading-tight">
                      Minh Hoàng
                    </p>
                    <p className="text-xs text-gray-400 leading-tight">
                      hoang.studio@lensy.vn
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Dashboard Title & Action Buttons Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Plan, prioritize, and accomplish your tasks with ease.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* + New Booking (Primary Action - Forest Green) */}
                <button
                  onClick={() => setShowNewBookingModal(true)}
                  className="bg-[#134e35] hover:bg-[#0e3b28] text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Booking</span>
                </button>

                {/* Import CSV (Secondary Action - Outline) */}
                <button
                  onClick={() => setShowImportCsvModal(true)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <span>Import CSV</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW CONTENTS: DASHBOARD / BOOKINGS / CALENDAR / CLIENTS / GEAR */}
            {/* ========================================================================= */}
            {activeTab === 'dashboard' ? (
              <>
                {/* 1. TOP METRIC CARDS (4 Cards Grid) */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Card 1: Total Revenue (Lush Forest Green) */}
                  <div className="bg-[#134e35] text-white p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[148px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-emerald-100 text-sm font-medium">
                        Total Revenue
                      </span>
                      <button
                        onClick={() => triggerToast('Viewing revenue analytics')}
                        className="w-7 h-7 rounded-full bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center text-emerald-200 hover:text-white transition cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-1">
                      <p className="font-bold text-2xl lg:text-3xl tracking-tight tabular-nums text-white">
                        245,000,000 ₫
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 bg-emerald-800/90 text-emerald-200 text-xs px-2 py-0.5 rounded-md font-medium">
                        <ArrowUpRight className="w-3 h-3 text-emerald-300" />
                        <span>18%</span>
                      </span>
                      <span className="text-xs text-emerald-200/90">
                        Increased from last month
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Active Bookings (White Card) */}
                  <div className="bg-white border border-gray-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-2xs min-h-[148px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-sm font-medium">
                        Active Bookings
                      </span>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-1">
                      <p className="font-bold text-3xl tracking-tight tabular-nums text-gray-900">
                        12
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md font-medium">
                        <ArrowUpRight className="w-3 h-3 text-gray-500" />
                        <span>3</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Increased from last month
                      </span>
                    </div>
                  </div>

                  {/* Card 3: New Clients (White Card) */}
                  <div className="bg-white border border-gray-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-2xs min-h-[148px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-sm font-medium">
                        New Clients
                      </span>
                      <button
                        onClick={() => setActiveTab('clients')}
                        className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-1">
                      <p className="font-bold text-3xl tracking-tight tabular-nums text-gray-900">
                        8
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md font-medium">
                        <ArrowUpRight className="w-3 h-3 text-gray-500" />
                        <span>2</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Increased from last month
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Pending Deposits (White Card) */}
                  <div className="bg-white border border-gray-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-2xs min-h-[148px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-sm font-medium">
                        Pending Deposits
                      </span>
                      <button
                        onClick={() => triggerToast('Checking 2 pending bank transfers')}
                        className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-1">
                      <p className="font-bold text-3xl tracking-tight tabular-nums text-gray-900">
                        2
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Awaiting transfer
                      </span>
                    </div>
                  </div>
                </section>

                {/* 2. MIDDLE SECTION: 3 Columns (Chart, Reminder/Upcoming Shoot, Tasks) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
                  {/* Left: Revenue Overview (Bar Chart Card) - 5 Cols */}
                  <div className="lg:col-span-5 bg-white border border-gray-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base text-gray-900">
                        Revenue Overview
                      </h3>
                      <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60">
                        This Week
                      </span>
                    </div>

                    {/* SVG Bar Chart with exact visual styles matching Donezo (solid green, mint, hatched patterns) */}
                    <div className="relative pt-6 pb-2">
                      {/* SVG Hatched Pattern Definition */}
                      <svg width="0" height="0" className="absolute">
                        <defs>
                          <pattern
                            id="diagonalStripes"
                            width="8"
                            height="8"
                            patternTransform="rotate(45 0 0)"
                            patternUnits="userSpaceOnUse"
                          >
                            <line
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="8"
                              stroke="#9ca3af"
                              strokeWidth="2.5"
                            />
                          </pattern>
                        </defs>
                      </svg>

                      {/* Tooltip for Selected Day */}
                      <div
                        className="text-center transition-all mb-1 flex justify-center"
                        style={{ minHeight: '36px' }}
                      >
                        <div className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md animate-fade-in">
                          <span>{revenueDays[selectedDayIndex].name}:</span>
                          <span className="text-emerald-400 font-mono">
                            {revenueDays[selectedDayIndex].amount}
                          </span>
                        </div>
                      </div>

                      {/* Bars Container */}
                      <div className="flex items-end justify-between gap-2 h-44 px-2">
                        {revenueDays.map((item, idx) => {
                          const isSelected = selectedDayIndex === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedDayIndex(idx)}
                              className="flex-1 flex flex-col items-center cursor-pointer group"
                            >
                              {/* Pill Bar */}
                              <div className="w-full flex justify-center h-36 items-end">
                                <div
                                  style={{ height: item.height }}
                                  className={`w-7 sm:w-8 rounded-full transition-all duration-300 relative flex items-center justify-center ${
                                    isSelected ? 'scale-105 shadow-md ring-2 ring-emerald-500/40' : 'group-hover:opacity-90'
                                  } ${
                                    item.type === 'deep-green'
                                      ? 'bg-[#134e35]'
                                      : item.type === 'solid-green'
                                      ? 'bg-[#1d6b49]'
                                      : item.type === 'mint'
                                      ? 'bg-[#34d399]'
                                      : 'bg-gray-100 border border-gray-300/80'
                                  }`}
                                >
                                  {/* Render hatched stripes if type is hatched */}
                                  {item.type === 'hatched' && (
                                    <svg className="w-full h-full rounded-full" preserveAspectRatio="none">
                                      <rect
                                        width="100%"
                                        height="100%"
                                        fill="url(#diagonalStripes)"
                                        rx="16"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {/* Day Label */}
                              <span
                                className={`text-xs font-semibold mt-3 transition ${
                                  isSelected ? 'text-gray-900 font-bold' : 'text-gray-400 group-hover:text-gray-600'
                                }`}
                              >
                                {item.day}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Reminders -> Next Upcoming Shoot - 3.5 Cols */}
                  <div className="lg:col-span-3 bg-white border border-gray-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                          Next Upcoming Shoot
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 leading-snug">
                        Pre-wedding: Anh Nam &amp; Chị Linh
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Time : 02.00 pm - 05.30 pm</span>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-semibold text-gray-800">
                              Đà Lạt Pine Forest
                            </p>
                            <p className="text-gray-500 mt-0.5">
                              Package: Diamond 4K (2 Shooters + 1 MUA)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowShootDetailsModal(true)}
                      className="w-full bg-[#134e35] hover:bg-[#0e3b28] text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer mt-4 shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>

                  {/* Right: Project -> Recent Tasks/Notes - 3.5 Cols */}
                  <div className="lg:col-span-4 bg-white border border-gray-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-base text-gray-900">
                          Recent Tasks
                        </h3>
                        <button
                          onClick={() => setShowNewTaskModal(true)}
                          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New</span>
                        </button>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-3 mt-3">
                        {filteredTasks.slice(0, 5).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 group py-1 border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {renderTaskIcon(task.iconType)}
                              <div className="min-w-0">
                                <p
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`text-xs font-medium text-gray-900 truncate cursor-pointer hover:text-[#134e35] transition ${
                                    task.completed ? 'line-through text-gray-400' : ''
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {task.dueDate}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition ${
                                task.completed
                                  ? 'bg-[#134e35] border-[#134e35] text-white'
                                  : 'border-gray-300 hover:border-[#134e35]'
                              }`}
                            >
                              {task.completed && <Check className="w-3 h-3" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. BOTTOM SECTION: 3 Columns (Team / MUA, Monthly Goal Arc, Time Tracker) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Studio Staff / MUA (Team Collaboration) - 5 Cols */}
                  <div className="lg:col-span-5 bg-white border border-gray-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-gray-900">
                          Studio Staff / MUA
                        </h3>
                        <button
                          onClick={() => setShowAddStaffModal(true)}
                          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Member</span>
                        </button>
                      </div>

                      {/* Staff List */}
                      <div className="space-y-3.5">
                        {filteredStaff.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full ${member.avatarBg} font-bold text-xs flex items-center justify-center shrink-0 border border-gray-200/70 shadow-2xs`}
                              >
                                {member.avatarText}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {member.name}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  {member.role} · <span className="text-gray-400">{member.currentTask}</span>
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
                                member.status === 'On-shoot'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : member.status === 'Editing'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : member.status === 'In Progress'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {member.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Monthly Goal Progress (Circular/Semi-circular Gauge) - 4 Cols */}
                  <div className="lg:col-span-4 bg-white border border-gray-200/80 p-5 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-2">
                        Monthly Goal Progress
                      </h3>
                      <p className="text-xs text-gray-500">
                        Target: 300,000,000 ₫ (Current: 245M ₫)
                      </p>
                    </div>

                    {/* Semi-circular SVG Gauge matching the Donezo visual */}
                    <div className="flex flex-col items-center justify-center my-3">
                      <div className="relative w-48 h-28 overflow-hidden flex items-end justify-center">
                        <svg className="w-48 h-48 -rotate-180" viewBox="0 0 100 100">
                          {/* Background Track */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#e5e7eb"
                            strokeWidth="12"
                            strokeDasharray="125.6 125.6"
                          />
                          {/* Active Progress Bar (Lush Green) */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke="#134e35"
                            strokeWidth="12"
                            strokeDasharray="94.2 125.6" // 75% of 125.6
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* Centered Percentage */}
                        <div className="absolute bottom-1 text-center">
                          <p className="font-bold text-3xl text-gray-900 tracking-tight">
                            75%
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium">
                            Revenue Target
                          </p>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#134e35]" />
                          <span>Reached</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                          <span>In Progress</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-400 bg-gray-200" />
                          <span>Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Time Tracker / Quick Stats (Dark Green Card with Organic Curves) - 3 Cols */}
                  <div className="lg:col-span-3 bg-[#0a2f1c] text-white p-5 rounded-2xl shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    {/* Background abstract wavy lines */}
                    <svg
                      className="absolute right-0 bottom-0 w-44 h-44 opacity-20 pointer-events-none text-emerald-300"
                      viewBox="0 0 120 120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M 0,30 Q 30,10 60,30 T 120,30" />
                      <path d="M 0,50 Q 30,30 60,50 T 120,50" />
                      <path d="M 0,70 Q 30,50 60,70 T 120,70" />
                      <path d="M 0,90 Q 30,70 60,90 T 120,90" />
                      <circle cx="60" cy="60" r="45" strokeDasharray="3 3" />
                    </svg>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-200 tracking-wider uppercase">
                          Time Tracker
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      {/* Digital Timer Counter */}
                      <div className="my-4 text-center">
                        <p className="font-mono text-3xl sm:text-4xl font-bold tracking-wider text-white">
                          {formatTimer(timerSeconds)}
                        </p>
                        <p className="text-[11px] text-emerald-300/80 mt-1">
                          Current Session: Pre-wedding Đà Lạt
                        </p>
                      </div>

                      {/* Interactive Controls (Pause, Play, Reset) */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm cursor-pointer ${
                            isTimerRunning
                              ? 'bg-amber-400 text-gray-900 hover:bg-amber-300'
                              : 'bg-white text-[#0a2f1c] hover:bg-emerald-100'
                          }`}
                          title={isTimerRunning ? 'Pause Session' : 'Start Session'}
                        >
                          {isTimerRunning ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setIsTimerRunning(false);
                            setTimerSeconds(0);
                            triggerToast('Session timer reset to 00:00:00');
                          }}
                          className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="Reset Timer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Gear Quick Stat */}
                    <div className="relative z-10 pt-3 border-t border-emerald-900/80 flex items-center justify-between text-xs text-emerald-200/90 mt-2">
                      <span>Total Gear Asset:</span>
                      <span className="font-mono font-bold text-white">
                        120,000,000 ₫
                      </span>
                    </div>
                  </div>
                </section>
              </>
            ) : activeTab === 'bookings' ? (
              /* ========================================================================= */
              /* BOOKINGS TAB VIEW */
              /* ========================================================================= */
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Studio Bookings Schedule
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage all shooting sessions, contracts, and payment balances.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewBookingModal(true)}
                    className="bg-[#134e35] hover:bg-[#0e3b28] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Booking</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-3">Client / Concept</th>
                        <th className="py-3 px-3">Date &amp; Time</th>
                        <th className="py-3 px-3">Location</th>
                        <th className="py-3 px-3 text-right">Total Price</th>
                        <th className="py-3 px-3 text-right">Deposit</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-gray-900">{b.client}</p>
                            <p className="text-xs text-gray-500">{b.service}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-gray-900 font-medium">{b.date}</p>
                            <p className="text-xs text-gray-500">{b.time}</p>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-600">
                            {b.location}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-gray-900">
                            {b.price.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-emerald-700">
                            {b.deposit.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${
                                b.status === 'Confirmed'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setShowShootDetailsModal(true);
                              }}
                              className="text-xs text-[#134e35] hover:underline font-semibold"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'calendar' ? (
              /* ========================================================================= */
              /* CALENDAR TAB VIEW */
              /* ========================================================================= */
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Studio Calendar — October 2026
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Visual shoot timeline for Studio Room A, Room B, and Outdoor Locations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg font-medium border border-emerald-200">
                      3 Shoots Scheduled This Week
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500 mb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, i) => {
                    const dayNum = i + 1;
                    const hasShoot = dayNum === 2 || dayNum === 6 || dayNum === 9 || dayNum === 12;
                    return (
                      <div
                        key={i}
                        className={`min-h-[85px] p-2 rounded-xl border transition flex flex-col justify-between text-left ${
                          hasShoot
                            ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                            : 'bg-gray-50/40 border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-semibold text-xs text-gray-700">
                          {dayNum}
                        </span>
                        {hasShoot && (
                          <div className="bg-[#134e35] text-white text-[10px] p-1 rounded-md mt-1 font-medium truncate">
                            {dayNum === 2
                              ? 'Pre-wedding Đà Lạt'
                              : dayNum === 6
                              ? 'Wedding Phú & Mai'
                              : dayNum === 9
                              ? 'IVY Moda FW26'
                              : 'Heritage Portrait'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'clients' ? (
              /* ========================================================================= */
              /* CLIENTS TAB VIEW */
              /* ========================================================================= */
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Client CRM Directory
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Client history, contact details, gallery links, and contracts.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewBookingModal(true)}
                    className="bg-[#134e35] hover:bg-[#0e3b28] text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                  >
                    + New Client
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-xs transition bg-gray-50/40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900">
                          {b.client}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          VIP Client
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{b.service}</p>
                      <p className="text-[11px] text-gray-400 mb-3">
                        Shoot Date: {b.date}
                      </p>
                      <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Total Value:</span>
                        <span className="font-mono font-bold text-gray-900">
                          {b.price.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* GEAR TAB VIEW */
              /* ========================================================================= */
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Studio Gear &amp; Equipment Roster
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Total Asset Value: 120,000,000 ₫ · Regular maintenance scheduled.
                    </p>
                  </div>
                  <button
                    onClick={() => triggerToast('Equipment scanner ready')}
                    className="bg-[#134e35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    + Log Equipment
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {gearList.map((g) => (
                    <div
                      key={g.id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {g.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {g.category} · Serial: {g.serial} · Custodian: {g.assignedTo}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-mono font-bold text-sm text-gray-900">
                          {g.value.toLocaleString('vi-VN')} ₫
                        </p>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {g.condition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quiet Minimalist Footer */}
          <footer className="mt-8 pt-4 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
            <span>© 2026 Lensy Studio CRM · Operating in Đà Lạt &amp; TP. Hồ Chí Minh</span>
            <div className="flex items-center gap-4">
              <span className="hover:text-gray-600 cursor-pointer" onClick={() => triggerToast('System status: 100% Operational')}>System Status</span>
              <span>·</span>
              <span className="hover:text-gray-600 cursor-pointer" onClick={() => setShowUpgradeModal(true)}>Lensy Cloud v2.4</span>
            </div>
          </footer>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. NEW BOOKING MODAL */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">Create New Booking</h3>
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Client Name(s)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anh Đức & Chị Hương"
                  value={newBookingData.client}
                  onChange={(e) =>
                    setNewBookingData({ ...newBookingData, client: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-[#134e35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Photography Package
                </label>
                <select
                  value={newBookingData.service}
                  onChange={(e) =>
                    setNewBookingData({ ...newBookingData, service: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-[#134e35]"
                >
                  <option value="Pre-wedding Diamond 4K">Pre-wedding Diamond 4K (28,000,000 ₫)</option>
                  <option value="Wedding Traditional & Party">Wedding Traditional & Party (36,000,000 ₫)</option>
                  <option value="Fashion Lookbook FW26">Fashion Lookbook Commercial (42,000,000 ₫)</option>
                  <option value="Fine Art Maternity">Fine Art Maternity (9,500,000 ₫)</option>
                  <option value="Family Heritage Portrait">Family Heritage Portrait (12,000,000 ₫)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newBookingData.date}
                    onChange={(e) =>
                      setNewBookingData({ ...newBookingData, date: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Time Window
                  </label>
                  <input
                    type="text"
                    value={newBookingData.time}
                    onChange={(e) =>
                      setNewBookingData({ ...newBookingData, time: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location / Studio Room
                </label>
                <input
                  type="text"
                  value={newBookingData.location}
                  onChange={(e) =>
                    setNewBookingData({ ...newBookingData, location: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Total Value (₫)
                  </label>
                  <input
                    type="text"
                    value={newBookingData.price}
                    onChange={(e) =>
                      setNewBookingData({ ...newBookingData, price: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Deposit Paid (₫)
                  </label>
                  <input
                    type="text"
                    value={newBookingData.deposit}
                    onChange={(e) =>
                      setNewBookingData({ ...newBookingData, deposit: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#134e35] hover:bg-[#0e3b28] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. NEW TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-gray-900">Add Studio Task</h3>
              <button onClick={() => setShowNewTaskModal(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export color-graded gallery for Mai"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#134e35]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="text"
                  placeholder="Oct 14, 2026"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#134e35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-gray-900">Add Team Member / MUA</h3>
              <button onClick={() => setShowAddStaffModal(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Đặng Quỳnh Trang"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#134e35]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs"
                >
                  <option value="Photographer">Photographer</option>
                  <option value="Master Makeup Artist">Master Makeup Artist</option>
                  <option value="Photo Retoucher">Photo Retoucher</option>
                  <option value="Lighting Tech">Lighting Tech</option>
                  <option value="Studio Coordinator">Studio Coordinator</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#134e35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. UPCOMING SHOOT DETAILS MODAL */}
      {showShootDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#134e35] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Shoot Brief: Pre-wedding Đà Lạt
                  </h3>
                  <p className="text-xs text-gray-500">
                    Client: Anh Nam &amp; Chị Linh · Package Diamond 4K
                  </p>
                </div>
              </div>
              <button onClick={() => setShowShootDetailsModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 font-medium">Timeline:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    02:00 PM - 05:30 PM (Golden Hour)
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Location:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    Đồi thông &amp; Hồ Tuyền Lâm, Đà Lạt
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Assigned Team &amp; Equipment Checklist:
                </h4>
                <ul className="space-y-1 list-disc list-inside text-gray-600">
                  <li>Lead Photographer: Nguyễn Hoàng Nam (Sony A7R V + 85mm f/1.2 GM)</li>
                  <li>Master MUA: Lê Thảo Linh (Bridal styling with 2 hair transitions)</li>
                  <li>Lighting Assistant: Vũ Minh Châu (Godox AD600 Pro + 120cm Octabox)</li>
                  <li>4x V-Mount high capacity batteries + 6x 128GB Sony Tough SD cards</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Contract Total:</span>
                  <span className="font-mono font-bold text-sm">28,000,000 ₫</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-800 mt-1">
                  <span>Deposit paid (50%):</span>
                  <span>14,000,000 ₫ (Remaining on delivery)</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowShootDetailsModal(false);
                  setIsTimerRunning(true);
                  triggerToast('Shoot session started! Timer running.');
                }}
                className="bg-[#134e35] hover:bg-[#0e3b28] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Session Timer</span>
              </button>

              <button
                onClick={() => setShowShootDetailsModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. UPGRADE TO PRO MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#134e35] flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Upgrade to Lensy Studio Pro
                  </h3>
                  <p className="text-xs text-gray-500">
                    Engineered for high-volume wedding &amp; commercial photography studios.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowUpgradeModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#134e35]">
                    Studio Pro Unlimited
                  </span>
                  <span className="font-mono font-bold text-sm text-gray-900">
                    890,000 ₫ <span className="text-xs font-normal text-gray-500">/ month</span>
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Unlimited 4K &amp; RAW online client proofing galleries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Automated Vietnamese e-contract &amp; VietQR bank deposit integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Real-time gear depreciation &amp; sensor calibration tracker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Unlimited MUA, retoucher, and second-shooter team accounts</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-semibold text-gray-600 px-4 py-2"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  triggerToast('Upgraded to Lensy Pro! Welcome aboard.');
                }}
                className="bg-[#134e35] hover:bg-[#0e3b28] text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-xs"
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. IMPORT CSV MODAL */}
      {showImportCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900">
                Import Bookings &amp; Clients CSV
              </h3>
              <button onClick={() => setShowImportCsvModal(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-gray-50/50">
              <UploadCloud className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-800">
                Click to upload or drag &amp; drop CSV file
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Supports Google Sheets, HoneyBook, or Excel export format (.csv, .xlsx)
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowImportCsvModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowImportCsvModal(false);
                  triggerToast('Successfully imported 8 bookings from CSV!');
                }}
                className="bg-[#134e35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
