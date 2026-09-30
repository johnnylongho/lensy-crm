/**
 * Quản lý màu sắc và nhãn phân loại Loại hình chụp (Category / Session Type).
 * Phân định rõ ràng giữa các loại: Studio (xanh dương), Outdoor (xanh lá),
 * Event (cam), Wedding (hồng), Lookbook (tím), Portrait (indigo), Pre-wedding (fuchsia).
 */

export interface CategoryConfig {
  id: string;
  label: string;
  color: string; // Tailwind class cho badge (bg + text + border)
  dotColor: string;
}

export const STANDARD_CATEGORIES: CategoryConfig[] = [
  {
    id: 'studio',
    label: 'Studio',
    color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'outdoor',
    label: 'Outdoor',
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'event',
    label: 'Event',
    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'lookbook',
    label: 'Lookbook',
    color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'portrait',
    label: 'Portrait',
    color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'prewedding',
    label: 'Pre-wedding',
    color: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    dotColor: 'bg-fuchsia-500',
  },
];

/**
 * Ánh xạ chuẩn hóa từ chuỗi bất kỳ (từ CSV hoặc DB) sang CategoryConfig chuẩn
 */
export function getCategoryConfig(typeOrCategory?: string | null): CategoryConfig {
  if (!typeOrCategory) {
    return {
      id: 'portrait',
      label: 'Portrait',
      color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      dotColor: 'bg-indigo-500',
    };
  }

  const clean = typeOrCategory.toString().trim().toLowerCase();

  // 1. Studio
  if (clean.includes('studio') || clean.includes('phim trường') || clean.includes('phim truong')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'studio')!;
  }

  // 2. Outdoor / Ngoại cảnh
  if (clean.includes('outdoor') || clean.includes('ngoại cảnh') || clean.includes('ngoai canh') || clean.includes('dã ngoại')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'outdoor')!;
  }

  // 3. Event / Sự kiện
  if (clean.includes('event') || clean.includes('sự kiện') || clean.includes('su kien') || clean.includes('hội nghị') || clean.includes('tiệc')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'event')!;
  }

  // 4. Pre-wedding
  if (clean.includes('pre-wedding') || clean.includes('prewedding') || clean.includes('ảnh cưới') || clean.includes('anh cuoi')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'prewedding')!;
  }

  // 5. Wedding / Cưới
  if (clean.includes('wedding') || clean.includes('tiệc cưới') || clean.includes('phóng sự cưới') || clean.includes('cưới') || clean.includes('cuoi')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'wedding')!;
  }

  // 6. Lookbook / Thời trang
  if (clean.includes('lookbook') || clean.includes('thời trang') || clean.includes('thoi trang') || clean.includes('mẫu') || clean.includes('fashion')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'lookbook')!;
  }

  // 7. Portrait / Chân dung / Profile
  if (clean.includes('portrait') || clean.includes('chân dung') || clean.includes('chan dung') || clean.includes('profile') || clean.includes('doanh nhân') || clean.includes('bầu') || clean.includes('baby') || clean.includes('gia đình') || clean.includes('family')) {
    return STANDARD_CATEGORIES.find(c => c.id === 'portrait')!;
  }

  // Fallback nếu có category khác
  const matched = STANDARD_CATEGORIES.find(c => c.id === clean);
  if (matched) return matched;

  return {
    id: clean,
    label: typeOrCategory.trim(),
    color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    dotColor: 'bg-slate-400',
  };
}

/**
 * Trả về id chuẩn hóa
 */
export function normalizeCategory(val?: string | null): string {
  return getCategoryConfig(val).id;
}
