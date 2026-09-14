import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  AlertCircle,
  QrCode,
  Wallet,
  Building2,
  Copy,
  Clock,
  Smartphone,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { billingApi } from "../services/api";

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
  userRole?: "patient" | "clinic";
  currentCredits?: number;
  currentCredit?: number;
  customPackages?: CreditPackage[];
  initialPackageId?: number;
  patientMrn?: string;
  onPurchaseSuccess?: (newCredits: number) => void;
  onSuccess?: (added: number) => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  userRole = "patient",
  currentCredits,
  currentCredit,
  customPackages,
  initialPackageId,
  patientMrn,
  onPurchaseSuccess,
  onSuccess,
}) => {
  const activeCredits = currentCredits ?? currentCredit ?? 0;
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentStep, setPaymentStep] = useState<"SELECT" | "CONFIRM" | "QR_SCAN" | "SUCCESS">("SELECT");
  const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "VNPAY" | "MOMO" | "CREDIT_CARD">("VIETQR");
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [lastTxnDetails, setLastTxnDetails] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdownSec, setCountdownSec] = useState<number>(900); // 15:00 countdown

  // Countdown timer for QR payment session
  useEffect(() => {
    if (paymentStep !== "QR_SCAN") return;
    setCountdownSec(900);
    const interval = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentStep]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const patientPackages: CreditPackage[] = [
    {
      id: 1,
      name: "Gói Cơ Bản (Khám Đơn)",
      scansCount: 1,
      priceVnd: 50000,
      features: [
        "1 lượt phân tích ảnh võng mạc AI",
        "Bản đồ nhiệt Grad-CAM",
        "Báo cáo PDF chuẩn y khoa",
      ],
    },
    {
      id: 2,
      name: "Gói Tiêu Chuẩn (Cá Nhân)",
      scansCount: 5,
      priceVnd: 200000,
      isPopular: true,
      features: [
        "5 lượt phân tích ảnh võng mạc AI",
        "Theo dõi diễn tiến vi mạch theo thời gian",
        "Ưu tiên Bác sĩ chuyên khoa phản hồi",
        "Tiết kiệm 20% chi phí",
      ],
    },
    {
      id: 3,
      name: "Gói Gia Đình (Định Kỳ)",
      scansCount: 15,
      priceVnd: 500000,
      features: [
        "15 lượt phân tích cho cả gia đình",
        "Lưu trữ hồ sơ xét nghiệm trọn đời",
        "Xuất tệp CSV/PDF không giới hạn",
        "Tư vấn trực tiếp với bác sĩ",
      ],
    },
  ];

  const defaultClinicPackages: CreditPackage[] = [
    {
      id: 101,
      name: "Gói Cơ Sở Sàng Lọc (Clinic Starter)",
      scansCount: 500,
      priceVnd: 5000000,
      validityDays: 90,
      features: [
        "500 lượt phân tích ảnh vi mạch võng mạc AI",
        "Phân tầng 4 cấp độ nguy cơ tim mạch & đáy mắt",
        "Bản đồ nhiệt Grad-CAM & tính toán A/V ratio",
        "Báo cáo tóm tắt lâm sàng PDF chuẩn Bộ Y Tế",
        "Hỗ trợ tối đa 2 tài khoản bác sĩ phân tích",
      ],
    },
    {
      id: 102,
      name: "Gói Chiến Dịch Lâm Sàng (Clinic Campaign)",
      scansCount: 2000,
      priceVnd: 18000000,
      validityDays: 180,
      isPopular: true,
      features: [
        "2.000 lượt phân tích ảnh võng mạc tốc độ cao",
        "Tự động xử lý theo đợt hàng loạt (Bulk Batch)",
        "Báo cáo dịch tễ học & thống kê phân tầng nguy cơ",
        "Phân công bệnh nhân tự động cho bác sĩ",
        "Xuất dữ liệu báo cáo chuyên sâu CSV/Excel",
        "Không giới hạn số lượng bác sĩ trong cơ sở",
      ],
    },
    {
      id: 103,
      name: "Gói Quy Mô Lớn / Bệnh Viện (Hospital Enterprise)",
      scansCount: 5000,
      priceVnd: 40000000,
      validityDays: 365,
      features: [
        "5.000 lượt phân tích ảnh võng mạc băng thông ưu tiên",
        "API tích hợp PACS / HIS / EMR bệnh viện",
        "Báo cáo dịch tễ học và xu hướng thời gian thực",
        "Ký số y khoa và lưu trữ đám mây chuẩn HIPAA",
        "Hỗ trợ kỹ thuật chuyên biệt 24/7 & chuyên gia lâm sàng",
        "Tùy biến mẫu báo cáo theo nhận diện cơ sở y tế",
      ],
    },
  ];

  const packages = customPackages && customPackages.length > 0
    ? customPackages
    : userRole === "clinic"
      ? defaultClinicPackages
      : patientPackages;

  useEffect(() => {
    if (initialPackageId && isOpen) {
      const match = packages.find((p) => p.id === initialPackageId);
      if (match) {
        setSelectedPackage(match);
        setPaymentStep("CONFIRM");
      }
    }
  }, [initialPackageId, isOpen, packages]);

  const paymentGateways = [
    {
      id: "VIETQR" as const,
      name: "Mã QR Ngân Hàng (VietQR Napas 24/7)",
      badge: "Quét bằng 40+ App Ngân Hàng & Ví",
      description:
        "Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, ACB, VPBank, MoMo...) quét mã chuyển khoản tức thì",
      color: "border-teal-500 bg-teal-50/40 text-teal-800",
      icon: <QrCode className="w-5 h-5 text-teal-600" />,
      tag: "Khuyên Dùng",
    },
    {
      id: "MOMO" as const,
      name: "Ví Điện Tử MoMo QR",
      badge: "Thanh toán siêu tốc 1 chạm",
      description:
        "Quét mã QR qua ứng dụng MoMo trên điện thoại",
      color: "border-pink-500 bg-pink-50/40 text-pink-800",
      icon: <Wallet className="w-5 h-5 text-pink-600" />,
      tag: "Tiện lợi",
    },
    {
      id: "VNPAY" as const,
      name: "Cổng VNPAY / VNPAY-QR",
      badge: "Cổng Thanh Toán Quốc Gia",
      description:
        "Thanh toán qua cổng VNPAY-QR, Internet Banking và thẻ nội địa",
      color: "border-blue-500 bg-blue-50/40 text-blue-800",
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      tag: "Phổ biến",
    },
    {
      id: "CREDIT_CARD" as const,
      name: "Thẻ Quốc Tế (Visa / MasterCard)",
      badge: "Bảo mật PCI-DSS 256-bit",
      description:
        "Hỗ trợ thẻ tín dụng & ghi nợ quốc tế phát hành toàn cầu",
      color: "border-indigo-500 bg-indigo-50/40 text-indigo-800",
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
      tag: "Quốc tế",
    },
  ];

  // Banking beneficiary details
  const bankConfig = {
    bankId: "MB",
    bankName: "MBBank (Ngân hàng TMCP Quân Đội)",
    accountNo: "0399882026",
    accountName: "CONG TY AI Y TE AURA",
  };

  // Transfer content: AURA NAP {PACKAGE_ID} {CLEAN_MRN}
  const transferContent = `AURA NAP ${selectedPackage?.id || 1} ${(patientMrn || "KHAM").replace(/[^a-zA-Z0-9]/g, "")}`.toUpperCase();

  // Standard VietQR Image URL
  const vietQrUrl = selectedPackage
    ? `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${selectedPackage.priceVnd}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankConfig.accountName)}`
    : "";

  const handleCopy = (text: string, fieldKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;
    setIsProcessing(true);
    setPurchaseError(null);
    try {
      // Map VIETQR to VNPAY provider for backend storage
      const provider = paymentMethod === "VIETQR" ? "VNPAY" : paymentMethod;
      const res = await billingApi.purchase(selectedPackage.id, provider);
      setIsProcessing(false);
      if (res.success || res.data) {
        setPaymentStep("SUCCESS");
        setLastTxnDetails(res.data || res);
        onPurchaseSuccess?.(activeCredits + selectedPackage.scansCount);
        onSuccess?.(selectedPackage.scansCount);
      } else {
        setPurchaseError(res.message || "Giao dịch thanh toán chưa hoàn tất.");
      }
    } catch (e: any) {
      setIsProcessing(false);
      setPurchaseError(
        e?.message ||
        "Không thể hoàn tất giao dịch thanh toán. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau."
      );
    }
  };

  const handleClose = () => {
    setPaymentStep("SELECT");
    setSelectedPackage(null);
    setPurchaseError(null);
    setLastTxnDetails(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-600" />
          <span>Nạp Thêm Lượt Khám Sàng Lọc AI (FR-11, FR-28)</span>
        </div>
      }
      description={`Số dư hiện tại: ${activeCredits} lượt khám khả dụng | Chuyển khoản thực tế bằng Mã QR`}
    >
      {/* ================= STEP 1: SELECT PACKAGE ================= */}
      {paymentStep === "SELECT" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/40 shadow-sm ring-2 ring-teal-600/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {pkg.isPopular && (
                    <span className="absolute -top-2.5 right-4 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Phổ biến nhất
                    </span>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">
                      {pkg.name}
                    </h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono-data text-teal-700">
                        {pkg.priceVnd.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        VNĐ
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-200">
                      +{pkg.scansCount} lượt phân tích
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Button
                      type="button"
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      className="w-full"
                    >
                      {isSelected ? "Đang chọn gói này" : "Chọn gói này"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Quét mã VietQR chuyển khoản thực tế qua mọi ngân hàng tại Việt Nam
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!selectedPackage}
              onClick={() => setPaymentStep("CONFIRM")}
            >
              Tiếp tục chọn phương thức
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: CHOOSE METHOD & CONFIRM ================= */}
      {paymentStep === "CONFIRM" && selectedPackage && (
        <div className="space-y-6 max-w-2xl mx-auto py-2">
          {/* Order Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="font-bold text-sm text-slate-900">
                1. Thông tin gói dịch vụ đã chọn
              </h4>
              <button
                onClick={() => setPaymentStep("SELECT")}
                className="text-teal-600 hover:text-teal-700 font-semibold text-[11px]"
              >
                Thay đổi gói
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block">Gói:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedPackage.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">
                  Số lượt nạp:
                </span>
                <span className="font-bold text-emerald-700 text-sm">
                  +{selectedPackage.scansCount} lượt khám
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">
                Tổng tiền thanh toán:
              </span>
              <span className="font-black font-mono-data text-lg text-teal-700">
                {selectedPackage.priceVnd.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
          </div>

          {/* Payment Gateway Selector */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-600" />
              2. Chọn phương thức thanh toán
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {paymentGateways.map((gw) => {
                const isGwSelected = paymentMethod === gw.id;
                return (
                  <div
                    key={gw.id}
                    onClick={() => setPaymentMethod(gw.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isGwSelected
                        ? "border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs mt-0.5">
                        {gw.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {gw.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                            {gw.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {gw.description}
                        </p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />{" "}
                            {gw.badge}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${isGwSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"}`}
                      >
                        {isGwSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setPaymentStep("SELECT")}
            >
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setPaymentStep("QR_SCAN")}
            >
              Tiến hành quét mã QR thanh toán
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: REAL VIETQR CODE SCANNING ================= */}
      {paymentStep === "QR_SCAN" && selectedPackage && (
        <div className="space-y-6 max-w-3xl mx-auto py-1">
          {/* Header notice */}
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, ACB...) hoặc MoMo để quét mã
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-teal-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-teal-200">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{formatCountdown(countdownSec)}</span>
            </div>
          </div>

          {/* Split QR & Beneficiary Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: High-Res VietQR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-white border-2 border-teal-600/40 rounded-2xl shadow-md relative">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                MÃ VIETQR CHUYỂN KHOẢN 24/7
              </div>

              {/* QR Image Frame */}
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs relative">
                <img
                  src={vietQrUrl}
                  alt="Mã VietQR thanh toán thực tế"
                  className="w-56 h-auto object-contain rounded-lg"
                />
              </div>

              <div className="mt-3 text-center text-[11px] text-slate-500 font-medium">
                Quét mã để tự động điền STK, Số tiền &amp; Nội dung chuyển khoản
              </div>
            </div>

            {/* Right: Beneficiary Information & 1-Click Copy */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Thông tin tài khoản thụ hưởng (AURA System)
              </h4>

              <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                {/* Bank */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-900">{bankConfig.bankName}</span>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm font-mono text-teal-700">{bankConfig.accountNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankConfig.accountNo, "accountNo")}
                      className="p-1 rounded hover:bg-slate-200 text-teal-600 transition-colors"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === "accountNo" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900">{bankConfig.accountName}</span>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Số tiền chuyển:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm font-mono text-rose-600">
                      {selectedPackage.priceVnd.toLocaleString("vi-VN")} VNĐ
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(selectedPackage.priceVnd), "amount")}
                      className="p-1 rounded hover:bg-slate-200 text-teal-600 transition-colors"
                      title="Sao chép số tiền"
                    >
                      {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Transfer Content */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Nội dung chuyển:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-xs bg-slate-200/80 px-2 py-0.5 rounded text-slate-800">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, "content")}
                      className="p-1 rounded hover:bg-slate-200 text-teal-600 transition-colors"
                      title="Sao chép nội dung"
                    >
                      {copiedField === "content" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <p className="font-bold">Hướng dẫn thanh toán:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Mở ứng dụng Ngân hàng trên điện thoại $\rightarrow$ Chọn Quét mã QR.</li>
                  <li>Quét mã ở khung bên trái (thông tin số tiền và nội dung sẽ tự động điền).</li>
                  <li>Sau khi chuyển khoản thành công, bấm nút <strong>&quot;Xác Nhận Đã Chuyển Khoản&quot;</strong> bên dưới.</li>
                </ol>
              </div>

              {purchaseError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{purchaseError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setPaymentStep("CONFIRM")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={isProcessing}
              onClick={handleConfirmPurchase}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Xác Nhận Đã Chuyển Khoản (Kích Hoạt Gói)
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SUCCESS ================= */}
      {paymentStep === "SUCCESS" && selectedPackage && (
        <div className="text-center py-6 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-in zoom-in-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xl font-bold text-slate-900">
              Nạp Gói Dịch Vụ Thành Công!
            </h4>
            <p className="text-xs text-slate-600">
              Hệ thống đã xác nhận thanh toán và cộng thêm{" "}
              <strong className="text-emerald-700 text-sm font-bold">
                +{selectedPackage.scansCount} lượt khám
              </strong>{" "}
              vào tài khoản của bạn.
            </p>
          </div>

          {lastTxnDetails && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Cổng thanh toán:</span>
                <span className="font-bold text-slate-800">
                  {lastTxnDetails.provider || paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã giao dịch (TxnRef):</span>
                <span className="font-bold text-teal-700 truncate max-w-[200px]">
                  {lastTxnDetails.providerReference ||
                    lastTxnDetails.id ||
                    `TXN_${Date.now()}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-600">ĐÃ THANH TOÁN THỰC TẾ</span>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            className="w-full mt-2"
            onClick={handleClose}
          >
            Bắt đầu sàng lọc ngay
          </Button>
        </div>
      )}
    </Modal>
  );
};
