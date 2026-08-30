import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, ShieldCheck, Zap, Building2, UserCheck, Sparkles, QrCode } from 'lucide-react';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'patient' | 'doctor' | 'clinic' | 'admin';
  currentCredit?: number;
  onSuccess?: (addedCredits: number) => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentCredit = 1880,
  onSuccess,
}) => {
  const isClinic = userRole === 'clinic';

  const patientPackages = [
    {
      id: 'p1',
      name: 'Gói Cơ Bản (Single Scan)',
      credits: 1,
      price: '150.000 đ',
      desc: '1 lượt phân tích ảnh võng mạc + Heatmap + Đánh giá nguy cơ tim mạch 3 năm.',
      popular: false,
    },
    {
      id: 'p2',
      name: 'Gói Chăm Sóc Định Kỳ (Pro 5)',
      credits: 5,
      price: '590.000 đ',
      desc: '5 lượt tầm soát toàn diện + Theo dõi xu hướng mạch máu + Tư vấn chuyên gia.',
      popular: true,
    },
  ];

  const clinicPackages = [
    {
      id: 'c1',
      name: 'Gói Chiến Dịch Sàng Lọc (Bulk 500)',
      credits: 500,
      price: '12.500.000 đ',
      desc: '500 lượt phân tích lô hàng loạt + Phân công bác sĩ + Xuất báo cáo CSV phòng khám.',
      popular: false,
    },
    {
      id: 'c2',
      name: 'Gói Bệnh Viện & Trung Tâm (Enterprise 2,500)',
      credits: 2500,
      price: '48.000.000 đ',
      desc: '2,500 lượt phân tích + Ưu tiên hàng đợi GPU PyTorch + Hỗ trợ tích hợp camera DICOM.',
      popular: true,
    },
  ];

  const packages = isClinic ? clinicPackages : patientPackages;
  const [selectedPkgId, setSelectedPkgId] = useState(packages[1].id);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'card'>('vietqr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess(selectedPkg.credits);
    }, 1200);
  };

  const handleDone = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#F0FDFA] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-sm">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#134E4A]">
                {isClinic ? 'Gia Hạn & Mua Thêm Credit Phòng Khám' : 'Nạp Lượt Phân Tích Sàng Lọc Cá Nhân'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Hạn mức khả dụng hiện tại: <strong className="text-cyan-800 font-mono-data">{currentCredit} lượt</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Giao Dịch Thanh Toán Thành Công!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Đã cộng thành công <strong>+{selectedPkg.credits} lượt phân tích AI</strong> vào tài khoản của bạn. Hóa đơn điện tử đã được lưu vào lịch sử giao dịch.
            </p>
            <div className="pt-2">
              <button
                onClick={handleDone}
                className="rounded-xl bg-cyan-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-800 transition-all"
              >
                Quay lại Bàn làm việc
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Package Selection */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Chọn Gói Dịch Vụ</span>
              <div className="grid grid-cols-1 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPkgId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50/40 ring-2 ring-cyan-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute right-3 top-3 rounded-full bg-cyan-700 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          Phổ biến nhất
                        </span>
                      )}
                      <div className="flex items-center justify-between pr-20">
                        <div className="font-bold text-sm text-slate-900">{pkg.name}</div>
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-extrabold font-mono-data text-cyan-800">{pkg.price}</span>
                        <span className="text-xs text-slate-500 font-mono-data">/ +{pkg.credits} Lượt khám</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{pkg.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Phương Thức Thanh Toán</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                    paymentMethod === 'vietqr'
                      ? 'border-cyan-600 bg-cyan-50/40 text-cyan-900 ring-2 ring-cyan-600/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode className="h-4 w-4 text-cyan-700" />
                  Mã VietQR Tự Động
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                    paymentMethod === 'card'
                      ? 'border-cyan-600 bg-cyan-50/40 text-cyan-900 ring-2 ring-cyan-600/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-cyan-700" />
                  Thẻ Tín Dụng / Visa
                </button>
              </div>
            </div>

            {/* Payment Button */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Tổng thanh toán:</span>
                <span className="text-lg font-black font-mono-data text-slate-900">{selectedPkg.price}</span>
              </div>
              <button
                onClick={handlePay}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-800 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý giao dịch...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Xác Nhận Thanh Toán Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
