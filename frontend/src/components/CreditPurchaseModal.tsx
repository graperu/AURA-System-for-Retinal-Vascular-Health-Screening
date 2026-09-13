import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { billingApi } from '../services/api';

export interface CreditPackage {
  id: number;
  name: string;
  scansCount: number;
  priceVnd: number;
  isPopular?: boolean;
  features: string[];
  validityDays?: number;
}

export interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'patient' | 'clinic';
  currentCredits?: number;
  currentCredit?: number;
  customPackages?: CreditPackage[];
  initialPackageId?: number;
  onPurchaseSuccess?: (newCredits: number) => void;
  onSuccess?: (added: number) => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  userRole = 'patient',
  currentCredits,
  currentCredit,
  customPackages,
  initialPackageId,
  onPurchaseSuccess,
  onSuccess,
}) => {
  const activeCredits = currentCredits ?? currentCredit ?? 0;
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'CONFIRM' | 'SUCCESS'>('SELECT');
  const [paymentMethod, setPaymentMethod] = useState<'VNPAY' | 'MOMO' | 'BANK_TRANSFER'>('VNPAY');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const patientPackages: CreditPackage[] = [
    {
      id: 1,
      name: 'Gói Cơ Bản (Khám Đơn)',
      scansCount: 1,
      priceVnd: 50000,
      features: ['1 lượt phân tích ảnh võng mạc AI', 'Bản đồ nhiệt Grad-CAM', 'Báo cáo PDF chuẩn y khoa'],
    },
    {
      id: 2,
      name: 'Gói Tiêu Chuẩn (Cá Nhân)',
      scansCount: 5,
      priceVnd: 200000,
      isPopular: true,
      features: [
        '5 lượt phân tích ảnh võng mạc AI',
        'Theo dõi diễn tiến vi mạch theo thời gian',
        'Ưu tiên Bác sĩ chuyên khoa phản hồi',
        'Tiết kiệm 20% chi phí',
      ],
    },
    {
      id: 3,
      name: 'Gói Gia Đình (Định Kỳ)',
      scansCount: 15,
      priceVnd: 500000,
      features: [
        '15 lượt phân tích cho cả gia đình',
        'Lưu trữ hồ sơ xét nghiệm trọn đời',
        'Xuất tệp CSV/PDF không giới hạn',
        'Tư vấn trực tiếp với bác sĩ',
      ],
    },
  ];

  const defaultClinicPackages: CreditPackage[] = [
    {
      id: 101,
      name: 'Gói Cơ Sở Sàng Lọc (Clinic Starter)',
      scansCount: 500,
      priceVnd: 5000000,
      validityDays: 90,
      features: [
        '500 lượt phân tích ảnh vi mạch võng mạc AI',
        'Phân tầng 4 cấp độ nguy cơ tim mạch & đáy mắt',
        'Bản đồ nhiệt Grad-CAM & tính toán A/V ratio',
        'Báo cáo tóm tắt lâm sàng PDF chuẩn Bộ Y Tế',
        'Hỗ trợ tối đa 2 tài khoản bác sĩ phân tích',
      ],
    },
    {
      id: 102,
      name: 'Gói Chiến Dịch Lâm Sàng (Clinic Campaign)',
      scansCount: 2000,
      priceVnd: 18000000,
      validityDays: 180,
      isPopular: true,
      features: [
        '2.000 lượt phân tích ảnh võng mạc tốc độ cao',
        'Tự động xử lý theo đợt hàng loạt (Bulk Batch)',
        'Báo cáo dịch tễ học & thống kê phân tầng nguy cơ',
        'Phân công bệnh nhân tự động cho bác sĩ',
        'Xuất dữ liệu báo cáo chuyên sâu CSV/Excel',
        'Không giới hạn số lượng bác sĩ trong cơ sở',
      ],
    },
    {
      id: 103,
      name: 'Gói Quy Mô Lớn / Bệnh Viện (Hospital Enterprise)',
      scansCount: 5000,
      priceVnd: 40000000,
      validityDays: 365,
      features: [
        '5.000 lượt phân tích ảnh võng mạc băng thông ưu tiên',
        'API tích hợp PACS / HIS / EMR bệnh viện',
        'Báo cáo dịch tễ học và xu hướng thời gian thực',
        'Ký số y khoa và lưu trữ đám mây chuẩn HIPAA',
        'Hỗ trợ kỹ thuật chuyên biệt 24/7 & chuyên gia lâm sàng',
        'Tùy biến mẫu báo cáo theo nhận diện cơ sở y tế',
      ],
    },
  ];

  const packages = customPackages && customPackages.length > 0
    ? customPackages
    : userRole === 'clinic'
      ? defaultClinicPackages
      : patientPackages;

  useEffect(() => {
    if (initialPackageId && isOpen) {
      const match = packages.find((p) => p.id === initialPackageId);
      if (match) {
        setSelectedPackage(match);
        setPaymentStep('CONFIRM');
      }
    }
  }, [initialPackageId, isOpen, packages]);

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;
    setIsProcessing(true);
    setPurchaseError(null);
    try {
      // Call real billing API endpoint
      const res = await billingApi.purchase(selectedPackage.id, paymentMethod);
      setIsProcessing(false);
      if (res.success || res.data) {
        setPaymentStep('SUCCESS');
        onPurchaseSuccess?.(activeCredits + selectedPackage.scansCount);
        onSuccess?.(selectedPackage.scansCount);
      } else {
        setPurchaseError(res.message || 'Giao dịch thanh toán chưa hoàn tất.');
      }
    } catch (e: any) {
      setIsProcessing(false);
      setPurchaseError(
        e?.message ||
        'Không thể hoàn tất giao dịch thanh toán. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.'
      );
    }
  };

  const handleClose = () => {
    setPaymentStep('SELECT');
    setSelectedPackage(null);
    setPurchaseError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-600" />
          <span>Nạp Thêm Lượt Khám Sàng Lọc AURA</span>
        </div>
      }
      description={`Số dư hiện tại: ${activeCredits} lượt khám`}
    >
      {paymentStep === 'SELECT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                      : 'border-clinical-border bg-white hover:border-slate-300'
                  }`}
                >
                  {pkg.isPopular && (
                    <span className="absolute -top-2.5 right-4 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Phổ biến nhất
                    </span>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-clinical-text">{pkg.name}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold font-mono-data text-brand-700">
                        {pkg.priceVnd.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">VNĐ</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-700">
                      +{pkg.scansCount} lượt phân tích
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-clinical-text-secondary">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button
                      type="button"
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full"
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn gói này'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-clinical-border pt-4">
            <div className="flex items-center gap-2 text-xs text-clinical-text-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Giao dịch an toàn mã hóa SSL/TLS 256-bit</span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!selectedPackage}
              onClick={() => setPaymentStep('CONFIRM')}
            >
              Tiếp tục thanh toán
            </Button>
          </div>
        </div>
      )}

      {paymentStep === 'CONFIRM' && selectedPackage && (
        <div className="space-y-6 max-w-lg mx-auto py-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-clinical-border space-y-3 text-xs">
            <h4 className="font-bold text-sm text-clinical-text">Xác nhận thông tin giao dịch</h4>
            <div className="flex justify-between py-1.5 border-b border-clinical-border">
              <span className="text-clinical-text-muted">Gói dịch vụ:</span>
              <span className="font-semibold text-clinical-text">{selectedPackage.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-clinical-border">
              <span className="text-clinical-text-muted">Số lượt cộng thêm:</span>
              <span className="font-semibold text-emerald-700">+{selectedPackage.scansCount} lượt</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <span className="font-bold text-clinical-text">Tổng thanh toán:</span>
              <span className="font-bold font-mono-data text-brand-700">
                {selectedPackage.priceVnd.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-clinical-text">Phương thức thanh toán:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('VNPAY')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                  paymentMethod === 'VNPAY'
                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold ring-2 ring-brand-500/20'
                    : 'border-clinical-border bg-white text-clinical-text hover:bg-slate-50'
                }`}
              >
                VNPay QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('MOMO')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                  paymentMethod === 'MOMO'
                    ? 'border-[#A50064] bg-pink-50 text-[#A50064] font-bold ring-2 ring-pink-500/20'
                    : 'border-clinical-border bg-white text-clinical-text hover:bg-slate-50'
                }`}
              >
                Ví MoMo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold ring-2 ring-emerald-500/20'
                    : 'border-clinical-border bg-white text-clinical-text hover:bg-slate-50'
                }`}
              >
                Chuyển Khoản
              </button>
            </div>
          </div>

          {purchaseError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{purchaseError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="md" onClick={() => setPaymentStep('SELECT')}>
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={isProcessing}
              onClick={handleConfirmPurchase}
            >
              Xác nhận & Nạp lượt
            </Button>
          </div>
        </div>
      )}

      {paymentStep === 'SUCCESS' && selectedPackage && (
        <div className="text-center py-8 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-clinical-text">Giao dịch nạp lượt thành công!</h4>
          <p className="text-xs text-clinical-text-muted">
            Tài khoản của bạn đã được cộng thêm <strong className="text-emerald-700">+{selectedPackage.scansCount} lượt</strong> sàng lọc vi mạch võng mạc.
          </p>
          <Button variant="primary" size="md" onClick={handleClose}>
            Bắt đầu sàng lọc ngay
          </Button>
        </div>
      )}
    </Modal>
  );
};
