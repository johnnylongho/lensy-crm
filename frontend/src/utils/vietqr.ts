export interface VietQRParams {
  bankId: string; // e.g. "MB", "VCB", "TCB", "ICB"
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
}

export const POPULAR_VIETNAMESE_BANKS = [
  { id: 'MB', name: 'MBBank (Quân Đội)', code: '970422' },
  { id: 'VCB', name: 'Vietcombank', code: '970436' },
  { id: 'TCB', name: 'Techcombank', code: '970407' },
  { id: 'ICB', name: 'VietinBank', code: '970415' },
  { id: 'ACB', name: 'ACB', code: '970416' },
  { id: 'BIDV', name: 'BIDV', code: '970418' },
  { id: 'TPB', name: 'TPBank', code: '970423' },
  { id: 'VPB', name: 'VPBank', code: '970432' },
];

/**
 * Generate standard VietQR image link with dynamic deposit amount and transfer memo
 */
export function generateVietQRUrl(params: VietQRParams): string {
  const cleanBank = (params.bankId || 'MB').toUpperCase().trim();
  const cleanAcc = (params.accountNo || '').trim();
  const cleanAmount = Math.max(0, Math.round(params.amount || 0));
  const encodedDesc = encodeURIComponent((params.description || '').slice(0, 50));
  const encodedName = encodeURIComponent((params.accountName || '').toUpperCase().trim());

  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-compact2.png?amount=${cleanAmount}&addInfo=${encodedDesc}&accountName=${encodedName}`;
}

