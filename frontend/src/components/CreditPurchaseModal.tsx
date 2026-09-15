import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
  Users,
  Info,
  Loader2,
  Radio,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import {
  billingApi,
  ServicePackageResponse,
  PaymentTransactionResponse,
  PaymentStatusResponse,
} from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export interface CreditPackage {
  id: number;
  name: string;
  scansCount: number;
  priceVnd: number;
  isPopular?: boolean;
  features: string[];
  validityDays?: number;
  description?: string;
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

/**
 * Tạo danh sách tính năng (features) lâm sàng theo số lượt khám
 * theo đúng thiết kế của Solution Architect và Clinical Guidelines.
 */
export const getClinicalFeatures = (scansCount: number, isVi: boolean): string[] => {
  if (scansCount === 1) {
    return [
      isVi ? "1 lượt phân tích ảnh võng mạc AI" : "1 AI retinal scan analysis",
      isVi ? "Bản đồ nhiệt Grad-CAM & tính toán A/V ratio" : "Grad-CAM attention heatmap & A/V ratio",
      isVi ? "Báo cáo PDF chuẩn y khoa" : "Standard medical PDF report",
    ];
  }
  if (scansCount === 5) {
    return [
      isVi ? "5 lượt phân tích ảnh võng mạc AI" : "5 AI retinal scan analyses",
      isVi ? "Theo dõi diễn tiến vi mạch theo thời gian" : "Longitudinal microvascular trend tracking",
      isVi ? "Ưu tiên Bác sĩ chuyên khoa phản hồi" : "Priority specialist physician review",
      isVi ? "Tiết kiệm 20% chi phí" : "Save 20% cost",
    ];
  }
  if (scansCount === 15) {
    return [
      isVi ? "15 lượt phân tích cho cả gia đình" : "15 analyses for whole family",
      isVi ? "Lưu trữ hồ sơ xét nghiệm trọn đời" : "Lifetime medical record storage",
      isVi ? "Xuất tệp CSV/PDF không giới hạn" : "Unlimited CSV/PDF report export",
      isVi ? "Tư vấn trực tiếp với bác sĩ" : "Direct physician consultation",
    ];
  }
  if (scansCount === 500) {
    return [
      isVi ? "500 lượt phân tích ảnh vi mạch võng mạc AI" : "500 AI retinal microvascular analyses",
      isVi ? "Phân tầng 4 cấp độ nguy cơ tim mạch & đáy mắt" : "4-tier CV and fundus risk stratification",
      isVi ? "Bản đồ nhiệt Grad-CAM & tính toán A/V ratio" : "Grad-CAM heatmap & A/V ratio computation",
      isVi ? "Báo cáo tóm tắt lâm sàng PDF chuẩn Bộ Y Tế" : "MOH standard clinical summary PDF reports",
      isVi ? "Hỗ trợ tối đa 2 tài khoản bác sĩ phân tích" : "Up to 2 doctor analyst accounts",
    ];
  }
  if (scansCount === 2000) {
    return [
      isVi ? "2.000 lượt phân tích ảnh võng mạc tốc độ cao" : "2,000 high-throughput retinal analyses",
      isVi ? "Tự động xử lý theo đợt hàng loạt" : "Automated bulk batch screening pipeline",
      isVi ? "Báo cáo dịch tễ học & thống kê phân tầng nguy cơ" : "Epidemiological and risk stratification analytics",
      isVi ? "Phân công bệnh nhân tự động cho bác sĩ" : "Automated patient assignment to doctors",
      isVi ? "Xuất dữ liệu báo cáo chuyên sâu CSV/Excel" : "In-depth CSV/Excel clinical data export",
      isVi ? "Không giới hạn số lượng bác sĩ trong cơ sở" : "Unlimited clinic physician seats",
    ];
  }
  if (scansCount === 5000) {
    return [
      isVi ? "5.000 lượt phân tích ảnh võng mạc băng thông ưu tiên" : "5,000 priority-tier retinal analyses",
      isVi ? "API tích hợp PACS / HIS / EMR bệnh viện" : "Direct Hospital PACS / HIS / EMR integration API",
      isVi ? "Báo cáo dịch tễ học và xu hướng thời gian thực" : "Real-time epidemiological trend analytics",
      isVi ? "Ký số y khoa và lưu trữ đám mây chuẩn HIPAA" : "Medical digital signatures & HIPAA cloud storage",
      isVi ? "Hỗ trợ kỹ thuật chuyên biệt 24/7 & chuyên gia lâm sàng" : "24/7 dedicated engineering & clinical support",
      isVi ? "Tùy biến mẫu báo cáo theo nhận diện cơ sở y tế" : "Customizable medical report templates with facility branding",
    ];
  }
  return [
    isVi ? `${scansCount} lượt phân tích ảnh võng mạc AI` : `${scansCount} AI retinal scan analyses`,
    isVi ? "Bản đồ nhiệt Grad-CAM & phân tích vi mạch" : "Grad-CAM heatmap & microvascular analysis",
    isVi ? "Báo cáo lâm sàng số hóa tiêu chuẩn" : "Standardized digital clinical report",
  ];
};

/**
 * Chuẩn hóa tên hiển thị song ngữ cho gói cước
 */
const getLocalizedPackageName = (name: string, scansCount: number, isVi: boolean): string => {
  if (isVi) return name;
  if (scansCount === 1) return "Basic Package (Single Scan)";
  if (scansCount === 5) return "Standard Package (Personal)";
  if (scansCount === 15) return "Family Package (Periodic)";
  if (scansCount === 500) return "Clinic Starter Package";
  if (scansCount === 2000) return "Clinic Campaign Package";
  if (scansCount === 5000) return "Hospital Enterprise Package";
  return name;
};

/**
 * Danh mục gói cước chuẩn hóa theo CSDL PostgreSQL (Flyway V029/V032)
 * Sử dụng để khởi tạo an toàn trong môi trường SSR/Unit test khi API chưa sẵn sàng.
 */
const STANDARD_DEFAULT_PACKAGES: Record<"INDIVIDUAL" | "CLINIC", ServicePackageResponse[]> = {
  INDIVIDUAL: [
    { id: 1, name: "Gói Cơ Bản (Khám Đơn)", price: 50000, credits: 1, validityDays: 30, scope: "INDIVIDUAL", active: true },
    { id: 2, name: "Gói Tiêu Chuẩn (Cá Nhân)", price: 200000, credits: 5, validityDays: 90, scope: "INDIVIDUAL", active: true },
    { id: 3, name: "Gói Gia Đình (Định Kỳ)", price: 500000, credits: 15, validityDays: 180, scope: "INDIVIDUAL", active: true },
  ],
  CLINIC: [
    { id: 101, name: "Gói Cơ Sở Sàng Lọc", price: 5000000, credits: 500, validityDays: 90, scope: "CLINIC", active: true },
    { id: 102, name: "Gói Chiến Dịch Lâm Sàng", price: 18000000, credits: 2000, validityDays: 180, scope: "CLINIC", active: true },
    { id: 103, name: "Gói Quy Mô Lớn / Bệnh Viện", price: 40000000, credits: 5000, validityDays: 365, scope: "CLINIC", active: true },
  ],
};

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
  const { isVi } = useLanguage();
  const activeCredits = currentCredits ?? currentCredit ?? 0;
  const scope = userRole === "clinic" ? "CLINIC" : "INDIVIDUAL";

  // Trạng thái dữ liệu tải từ Backend API (trong SSR/Node test khởi tạo theo danh mục chuẩn để render được HTML)
  const isSSR = typeof window === "undefined";
  const [rawPackages, setRawPackages] = useState<ServicePackageResponse[]>(() => {
    return isSSR ? STANDARD_DEFAULT_PACKAGES[scope] : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Xác định gói mặc định khởi tạo nếu truyền customPackages và initialPackageId
  const initialSelected = useMemo(() => {
    if (initialPackageId && customPackages && customPackages.length > 0) {
      return customPackages.find((p) => p.id === initialPackageId) || null;
    }
    return null;
  }, [initialPackageId, customPackages]);

  // Trạng thái quy trình thanh toán
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(initialSelected);
  const [paymentStep, setPaymentStep] = useState<"SELECT" | "CONFIRM" | "QR_SCAN" | "SUCCESS">(
    initialSelected ? "CONFIRM" : "SELECT"
  );
  const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "VNPAY" | "MOMO" | "CREDIT_CARD">("VIETQR");
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [lastTxnDetails, setLastTxnDetails] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdownSec, setCountdownSec] = useState<number>(900); // 15:00 đếm ngược
  const [activeTxnId, setActiveTxnId] = useState<number | null>(null);
  const [activeTxnData, setActiveTxnData] = useState<PaymentTransactionResponse | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Tải danh sách gói cước động từ Backend API
  const fetchPackages = useCallback(async () => {
    if (customPackages && customPackages.length > 0) {
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const scope = userRole === "clinic" ? "CLINIC" : "INDIVIDUAL";
      const res = await billingApi.packages(scope);
      if (res.success && Array.isArray(res.data)) {
        const activeList = res.data.filter((p) => p.active !== false);
        activeList.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        setRawPackages(activeList);
      } else {
        setLoadError(
          res.message ||
          (isVi
            ? "Không thể tải danh sách gói dịch vụ từ máy chủ."
            : "Unable to load service packages from the server.")
        );
      }
    } catch (err: any) {
      setLoadError(
        err?.message ||
        (isVi
          ? "Lỗi kết nối mạng khi tải danh sách gói dịch vụ. Vui lòng kiểm tra lại."
          : "Network connection error while loading service packages. Please retry.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [customPackages, userRole, isVi]);

  // Kích hoạt tải gói cước khi Modal mở và không có customPackages
  useEffect(() => {
    if (isOpen && (!customPackages || customPackages.length === 0)) {
      fetchPackages();
    }
  }, [isOpen, customPackages, fetchPackages]);

  // Ánh xạ dữ liệu từ backend sang CreditPackage chuẩn
  const packages = useMemo<CreditPackage[]>(() => {
    if (customPackages && customPackages.length > 0) {
      return customPackages;
    }
    return rawPackages.map((item) => {
      const scansCount = Number(item.credits || 1);
      const priceVnd = Number(item.price ?? 0);
      const id = Number(item.id);
      // Gán isPopular = true cho gói 5 lượt (Gói Tiêu Chuẩn, ID = 2) hoặc gói 2000 lượt (Clinic)
      const isPopular = id === 2 || scansCount === 5 || id === 102 || scansCount === 2000;
      const features = getClinicalFeatures(scansCount, isVi);
      return {
        id,
        name: getLocalizedPackageName(item.name, scansCount, isVi),
        scansCount,
        priceVnd,
        isPopular,
        features,
        validityDays: item.validityDays,
        description: item.description,
      };
    });
  }, [customPackages, rawPackages, isVi]);

  // Xử lý gói khởi tạo initialPackageId khi mở Modal
  useEffect(() => {
    if (initialPackageId && isOpen && packages.length > 0 && !selectedPackage) {
      const match = packages.find((p) => p.id === initialPackageId);
      if (match) {
        setSelectedPackage(match);
        setPaymentStep("CONFIRM");
      }
    }
  }, [initialPackageId, isOpen, packages, selectedPackage]);

  // Đồng bộ selectedPackage khi ngôn ngữ hoặc danh sách packages thay đổi
  useEffect(() => {
    if (selectedPackage) {
      const updated = packages.find((p) => p.id === selectedPackage.id);
      if (updated) {
        setSelectedPackage(updated);
      }
    }
  }, [packages]);

  // Chống nhảy trạng thái sai: Nếu không có selectedPackage thì không cho ở bước CONFIRM hoặc QR_SCAN
  useEffect(() => {
    if ((paymentStep === "CONFIRM" || paymentStep === "QR_SCAN") && !selectedPackage) {
      setPaymentStep("SELECT");
    }
  }, [paymentStep, selectedPackage]);

  // Đếm ngược phiên thanh toán QR 15 phút
  useEffect(() => {
    if (paymentStep !== "QR_SCAN") return;
    setCountdownSec(900);
    setIsExpired(false);
    const interval = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentStep]);

  // Polling tự động mỗi 3 giây kiểm tra trạng thái giao dịch ngân hàng (AC-4, AC-5)
  useEffect(() => {
    if (paymentStep !== "QR_SCAN" || !activeTxnId || isExpired) return;

    const interval = setInterval(async () => {
      try {
        const res = await billingApi.getTransactionStatus(activeTxnId);
        if (res.success && res.data) {
          const { status, creditsAdded, failureReason } = res.data;
          if (status === "SUCCEEDED") {
            clearInterval(interval);
            const added = creditsAdded || selectedPackage?.scansCount || 0;
            setLastTxnDetails({
              ...res.data,
              id: res.data.transactionId,
              provider: activeTxnData?.provider || paymentMethod,
            });
            onPurchaseSuccess?.(activeCredits + added);
            onSuccess?.(added);
            setPaymentStep("SUCCESS");
          } else if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") {
            clearInterval(interval);
            if (status === "EXPIRED") {
              setIsExpired(true);
            }
            setPurchaseError(
              failureReason ||
              (status === "EXPIRED"
                ? (isVi
                    ? "Phiên thanh toán đã hết hạn sau 15 phút. Vui lòng tạo giao dịch mới."
                    : "Payment session has expired. Please create a new transaction.")
                : (isVi
                    ? "Giao dịch thanh toán không thành công. Vui lòng thử lại."
                    : "Payment transaction failed. Please try again."))
            );
          }
        }
      } catch {
        // Bỏ qua lỗi kết nối mạng tạm thời giữa các lần poll
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [
    paymentStep,
    activeTxnId,
    isExpired,
    selectedPackage,
    activeCredits,
    activeTxnData,
    paymentMethod,
    isVi,
    onPurchaseSuccess,
    onSuccess,
  ]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const paymentGateways = useMemo(
    () => [
      {
        id: "VIETQR" as const,
        name: isVi ? "Chuyển Khoản Ngân Hàng VietQR Napas 24/7" : "VietQR Napas 24/7 Bank Transfer",
        badge: isVi ? "Quét bằng 40+ App Ngân Hàng & Ví" : "40+ Banking Apps & E-Wallets",
        description: isVi
          ? "Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, ACB, VPBank, MoMo...) quét mã chuyển khoản tức thì"
          : "Scan with any bank app (Vietcombank, MB, Techcombank, ACB, MoMo...) for instant settlement",
        color: "border-teal-500 bg-teal-50/40 text-teal-800",
        icon: <QrCode className="w-5 h-5 text-teal-600" />,
        tag: isVi ? "Khuyên Dùng" : "Recommended",
      },
    ],
    [isVi]
  );

  // Cấu hình tài khoản ngân hàng thụ hưởng AURA
  const bankConfig = {
    bankId: "MB",
    bankName: "MBBank - Ngân hàng TMCP Quân Đội",
    accountNo: "1208123456",
    accountName: "PHAN VAN DINH",
  };

  // Nội dung chuyển khoản: AURA NAP {PACKAGE_ID} {CLEAN_MRN} - Ưu tiên lấy từ activeTxnData.transferContent từ backend
  const cleanMrn = (patientMrn || "KHAM").replace(/[^a-zA-Z0-9]/g, "");
  const defaultTransferContent = selectedPackage
    ? `AURA NAP ${selectedPackage.id} ${cleanMrn}`.toUpperCase()
    : "";
  const transferContent = activeTxnData?.transferContent || defaultTransferContent;
  const currentAmount = activeTxnData?.amount ?? selectedPackage?.priceVnd ?? 0;

  // Chuỗi ảnh VietQR thật - Ưu tiên qrCodeUrl sinh từ backend
  const vietQrUrl = activeTxnData?.qrCodeUrl || (selectedPackage && transferContent
    ? `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${currentAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankConfig.accountName)}`
    : "");

  const handleCopy = (text: string, fieldKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Khởi tạo phiên giao dịch thanh toán PENDING (AC-1)
  const handleStartCheckout = async () => {
    if (!selectedPackage) return;
    setIsProcessing(true);
    setPurchaseError(null);
    try {
      const res = await billingApi.checkout(selectedPackage.id, paymentMethod);
      if (res.success && res.data) {
        setActiveTxnId(res.data.id);
        setActiveTxnData(res.data);
        setIsExpired(false);
        setPaymentStep("QR_SCAN");
      } else {
        setPurchaseError(
          res.message ||
          (isVi
            ? "Không thể khởi tạo phiên thanh toán. Vui lòng thử lại sau."
            : "Failed to initiate payment session. Please try again.")
        );
      }
    } catch (e: any) {
      setPurchaseError(
        e?.message ||
        (isVi
          ? "Không thể khởi tạo giao dịch thanh toán. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau."
          : "Unable to initiate payment transaction. Please check your network connection or try again later.")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPaymentStep("SELECT");
    setSelectedPackage(null);
    setPurchaseError(null);
    setLastTxnDetails(null);
    setActiveTxnId(null);
    setActiveTxnData(null);
    setIsExpired(false);
    onClose();
  };

  // Kiểm tra gói hiện tại có phải Gói Gia Đình (15 lượt) không
  const isFamilyPackage = (pkg?: CreditPackage | null) =>
    Boolean(pkg && (pkg.scansCount === 15 || pkg.id === 3));

  // Notice Box hướng dẫn lâm sàng cho Gói Gia Đình
  const renderFamilyNotice = () => (
    <div className="p-4 rounded-xl bg-cyan-50/90 border border-cyan-200 text-cyan-950 flex items-start gap-3 shadow-2xs">
      <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700 shrink-0 mt-0.5">
        <Users className="w-4 h-4" />
      </div>
      <div className="space-y-1 text-xs">
        <h5 className="font-bold text-cyan-900 flex items-center gap-1.5">
          <span>
            {isVi
              ? "Hướng Dẫn Sử Dụng Hạn Mức Gói Gia Đình"
              : "Family Package Clinical Guidelines"}
          </span>
        </h5>
        <p className="leading-relaxed text-cyan-800">
          {isVi
            ? "Hạn mức 15 lượt khám được cộng trực tiếp vào tài khoản gia đình của bạn. Bạn có thể sử dụng số dư này để tải ảnh đáy mắt và phân tích AI cho bản thân hoặc các thành viên trong gia đình trên cùng tài khoản này. Vui lòng ghi rõ thông tin thành viên (họ tên, năm sinh) tại phần Ghi chú ca khám để bác sĩ đối chiếu chính xác."
            : "The 15-screening quota is credited directly to your family account. You can use this balance to upload retinal images and perform AI analyses for yourself or family members on this same account. Please specify each member's information (full name, birth year) in the Clinical Notes section for accurate doctor verification."}
        </p>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-600" />
          <span>
            {isVi ? "Nạp Thêm Lượt Khám Sàng Lọc AI" : "Purchase AI Screening Credits"}
          </span>
        </div>
      }
      description={`${isVi ? "Số dư hiện tại" : "Current balance"}: ${activeCredits} ${
        isVi ? "lượt khám khả dụng" : "available credits"
      } | ${isVi ? "Chuyển khoản thực tế bằng Mã QR" : "Real-time payment via QR Code"}`}
    >
      {/* ================= STEP 1: SELECT PACKAGE ================= */}
      {paymentStep === "SELECT" && (
        <div className="space-y-6">
          {/* Trạng thái Đang tải (Loading Skeleton) */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 animate-pulse space-y-4"
                >
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                  <div className="h-9 bg-slate-200 rounded w-full mt-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Trạng thái Lỗi mạng (Load Error) */}
          {!isLoading && loadError && (
            <div className="p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/60 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {isVi ? "Không thể tải danh sách gói cước" : "Unable to load service packages"}
              </h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{loadError}</p>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchPackages}
                  className="border-rose-300 text-rose-700 hover:bg-rose-100"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {isVi ? "Thử lại" : "Retry"}
                </Button>
              </div>
            </div>
          )}

          {/* Trạng thái Không có gói nào */}
          {!isLoading && !loadError && packages.length === 0 && (
            <div className="p-8 text-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 space-y-2 text-xs">
              <Info className="w-6 h-6 text-slate-400 mx-auto" />
              <p>{isVi ? "Hiện chưa có gói cước nào khả dụng." : "No service packages available."}</p>
              <Button type="button" variant="outline" size="sm" onClick={fetchPackages}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                {isVi ? "Tải lại" : "Reload"}
              </Button>
            </div>
          )}

          {/* Danh sách các gói cước thực tế */}
          {!isLoading && !loadError && packages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                const isFamily = isFamilyPackage(pkg);
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
                        {isVi ? "Phổ biến nhất" : "Most Popular"}
                      </span>
                    )}

                    <div className="space-y-3">
                      <h4 className="font-bold text-sm text-slate-900">{pkg.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono-data text-teal-700">
                          {pkg.priceVnd.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">VNĐ</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-200">
                          +{pkg.scansCount} {isVi ? "lượt phân tích" : "scans"}
                        </div>
                        {pkg.validityDays && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {pkg.validityDays} {isVi ? "ngày" : "days"}
                          </span>
                        )}
                      </div>

                      {/* Ghi chú nhanh cho Gói Gia Đình trong thẻ */}
                      {isFamily && (
                        <div className="text-[11px] text-cyan-800 bg-cyan-50/70 p-2 rounded-lg border border-cyan-200/80 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span className="font-medium">
                            {isVi ? "Tài khoản gia đình dùng chung" : "Shared family account"}
                          </span>
                        </div>
                      )}

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
                        {isSelected
                          ? isVi
                            ? "Đang chọn gói này"
                            : "Selected"
                          : isVi
                            ? "Chọn gói này"
                            : "Select Package"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notice Box hướng dẫn lâm sàng cho Gói Gia Đình khi được chọn */}
          {!isLoading && isFamilyPackage(selectedPackage) && renderFamilyNotice()}

          {/* Thanh thao tác dưới cùng Step 1 */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isVi
                  ? "Quét mã VietQR chuyển khoản thực tế qua mọi ngân hàng tại Việt Nam"
                  : "Scan VietQR to transfer via all Vietnamese banks & e-wallets"}
              </span>
            </div>

            {/* Nút Tiếp tục bị disabled hoàn toàn khi chưa chọn gói hoặc đang tải */}
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!selectedPackage || isLoading || !!loadError}
              onClick={() => {
                if (!selectedPackage) return;
                setPaymentStep("CONFIRM");
              }}
            >
              {isVi ? "Tiếp tục chọn phương thức" : "Continue to Payment Method"}
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
                {isVi ? "1. Thông tin gói dịch vụ đã chọn" : "1. Selected Package Details"}
              </h4>
              <button
                type="button"
                onClick={() => setPaymentStep("SELECT")}
                className="text-teal-600 hover:text-teal-700 font-semibold text-[11px] cursor-pointer"
              >
                {isVi ? "Thay đổi gói" : "Change package"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block">{isVi ? "Gói:" : "Package:"}</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPackage.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">{isVi ? "Số lượt nạp:" : "Credits:"}</span>
                <span className="font-bold text-emerald-700 text-sm">
                  +{selectedPackage.scansCount} {isVi ? "lượt khám" : "credits"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">
                {isVi ? "Tổng tiền thanh toán:" : "Total payment:"}
              </span>
              <span className="font-black font-mono-data text-lg text-teal-700">
                {selectedPackage.priceVnd.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
          </div>

          {/* Notice Box hướng dẫn lâm sàng cho Gói Gia Đình tại Step 2 */}
          {isFamilyPackage(selectedPackage) && renderFamilyNotice()}

          {/* Payment Gateway Selector */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-600" />
              {isVi ? "2. Chọn phương thức thanh toán" : "2. Select Payment Method"}
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
                          <span className="font-bold text-sm text-slate-900">{gw.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                            {gw.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{gw.description}</p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> {gw.badge}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isGwSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"
                        }`}
                      >
                        {isGwSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {purchaseError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{purchaseError}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <Button variant="outline" size="md" onClick={() => setPaymentStep("SELECT")}>
              {isVi ? "Quay lại" : "Back"}
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={isProcessing}
              disabled={!selectedPackage || isProcessing}
              onClick={handleStartCheckout}
            >
              {isVi ? "Tiến hành quét mã QR thanh toán" : "Proceed to QR Code Payment"}
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
                {isVi
                  ? "Mở ứng dụng Ngân hàng (MB, Vietcombank, Techcombank, ACB...) hoặc MoMo để quét mã"
                  : "Open any Banking App (MB, Vietcombank, Techcombank, ACB...) or MoMo to scan"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-teal-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-teal-200">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{formatCountdown(countdownSec)}</span>
            </div>
          </div>

          {/* Notice Box Gói Gia Đình tại Step 3 */}
          {isFamilyPackage(selectedPackage) && renderFamilyNotice()}

          {/* Radar / Spinner Chờ Ngân Hàng Tự Động Xác Nhận (AC-2, AC-5) */}
          {!isExpired ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50/90 via-cyan-50/80 to-teal-50/90 border border-teal-200 shadow-2xs flex items-center gap-4">
              <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-40 animate-ping" />
                <span className="relative inline-flex rounded-full h-9 w-9 bg-teal-600 text-white items-center justify-center shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  <span>
                    {isVi
                      ? "Đang chờ hệ thống ngân hàng xác nhận giao dịch chuyển khoản..."
                      : "Waiting for banking system to confirm payment transaction..."}
                  </span>
                </div>
                <p className="text-teal-800 text-[11px] leading-relaxed">
                  {isVi
                    ? "Gói khám sẽ tự động kích hoạt ngay khi nhận được tiền từ ngân hàng. Quý khách vui lòng không cần bấm thêm bất kỳ thao tác nào."
                    : "Screening credits will activate automatically upon receipt. No manual confirmation is required."}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">
                  {isVi ? "Phiên thanh toán đã hết hạn sau 15 phút" : "Payment session expired"}
                </p>
                <p className="text-[11px] text-amber-800">
                  {isVi
                    ? "Vui lòng bấm 'Tạo phiên thanh toán mới' bên dưới để tiếp tục giao dịch."
                    : "Please click 'Create New Session' below to continue the transaction."}
                </p>
              </div>
            </div>
          )}

          {/* Split QR & Beneficiary Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: High-Res VietQR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-white border-2 border-teal-600/40 rounded-2xl shadow-md relative">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {isVi ? "MÃ VIETQR CHUYỂN KHOẢN 24/7" : "VIETQR 24/7 BANK TRANSFER"}
              </div>

              {/* QR Image Frame */}
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs relative">
                {vietQrUrl ? (
                  <img
                    src={vietQrUrl}
                    alt={isVi ? "Mã VietQR thanh toán thực tế" : "VietQR payment code"}
                    className="w-56 h-auto object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    {isVi ? "Chưa chọn gói hợp lệ" : "No valid package selected"}
                  </div>
                )}
              </div>

              <div className="mt-3 text-center text-[11px] text-slate-500 font-medium">
                {isVi
                  ? "Quét mã để tự động điền STK, Số tiền & Nội dung chuyển khoản"
                  : "Scan to autofill account number, amount & transfer note"}
              </div>
            </div>

            {/* Right: Beneficiary Information & 1-Click Copy */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                {isVi
                  ? "Thông tin tài khoản thụ hưởng"
                  : "Beneficiary Account Details"}
              </h4>

              <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                {/* Bank */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isVi ? "Ngân hàng:" : "Bank:"}</span>
                  <span className="font-bold text-slate-900">{bankConfig.bankName}</span>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isVi ? "Số tài khoản:" : "Account Number:"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm font-mono text-teal-700">{bankConfig.accountNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankConfig.accountNo, "accountNo")}
                      className="p-1 rounded hover:bg-slate-200 text-teal-600 transition-colors"
                      title={isVi ? "Sao chép số tài khoản" : "Copy account number"}
                    >
                      {copiedField === "accountNo" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isVi ? "Chủ tài khoản:" : "Account Name:"}</span>
                  <span className="font-bold text-slate-900">{bankConfig.accountName}</span>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isVi ? "Số tiền chuyển:" : "Transfer Amount:"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm font-mono text-rose-600">
                      {currentAmount.toLocaleString("vi-VN")} VNĐ
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(currentAmount), "amount")}
                      className="p-1 rounded hover:bg-slate-200 text-teal-600 transition-colors"
                      title={isVi ? "Sao chép số tiền" : "Copy amount"}
                    >
                      {copiedField === "amount" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Transfer Content - Ưu tiên từ backend */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">{isVi ? "Nội dung chuyển:" : "Transfer Note:"}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-xs bg-slate-200/80 px-2 py-0.5 rounded text-slate-800">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, "content")}
                      className="p-1 rounded hover:bg-slate-200 text-teal-600 transition-colors"
                      title={isVi ? "Sao chép nội dung" : "Copy note"}
                    >
                      {copiedField === "content" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isVi ? "Quy trình thanh toán an toàn:" : "Secure Payment Instructions:"}</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-amber-800">
                  <li>
                    {isVi
                      ? "Mở ứng dụng Ngân hàng trên điện thoại → Chọn tính năng Quét mã QR."
                      : "Open your banking app on your mobile device → Select QR Scan."}
                  </li>
                  <li>
                    {isVi
                      ? "Quét mã ở khung bên trái (thông tin số tiền và nội dung sẽ tự động điền chính xác)."
                      : "Scan the QR code on the left (amount & transfer note will be autofilled accurately)."}
                  </li>
                  <li>
                    {isVi
                      ? "Xác nhận chuyển tiền trên ứng dụng ngân hàng. Cổng thanh toán AURA sẽ tự động đối soát và kích hoạt gói khám trong 3-5 giây."
                      : "Confirm transfer in your banking app. AURA Gateway will auto-verify and credit scans within 3-5 seconds."}
                  </li>
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

          {/* Action Bar Step 3: Loại bỏ hoàn toàn nút tự kích hoạt (AC-2) */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setPaymentStep("CONFIRM");
                setPurchaseError(null);
                setIsExpired(false);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {isVi ? "Quay lại chọn phương thức" : "Back to Payment Method"}
            </Button>

            {isExpired ? (
              <Button
                variant="primary"
                size="md"
                loading={isProcessing}
                disabled={isProcessing}
                onClick={() => {
                  setIsExpired(false);
                  handleStartCheckout();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {isVi ? "Tạo phiên thanh toán mới" : "Create New Session"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  {isVi
                    ? "Hệ thống đang tự động kiểm tra mỗi 3 giây..."
                    : "System is automatically polling every 3 seconds..."}
                </span>
              </div>
            )}
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
              {isVi ? "Nạp Gói Dịch Vụ Thành Công!" : "Package Purchased Successfully!"}
            </h4>
            <p className="text-xs text-slate-600">
              {isVi
                ? "Hệ thống đã xác nhận thanh toán và cộng thêm "
                : "The system has verified your payment and added "}
              <strong className="text-emerald-700 text-sm font-bold">
                +{selectedPackage.scansCount} {isVi ? "lượt khám" : "credits"}
              </strong>{" "}
              {isVi ? "vào tài khoản của bạn." : "to your account."}
            </p>
          </div>

          {/* Thông báo nhắc nhở thành viên cho Gói Gia Đình sau khi kích hoạt thành công */}
          {isFamilyPackage(selectedPackage) && (
            <div className="text-left">
              {renderFamilyNotice()}
            </div>
          )}

          {lastTxnDetails && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {isVi ? "Cổng thanh toán:" : "Payment gateway:"}
                </span>
                <span className="font-bold text-slate-800">
                  {lastTxnDetails.provider || paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {isVi ? "Mã giao dịch:" : "Transaction Ref:"}
                </span>
                <span className="font-bold text-teal-700 truncate max-w-[200px]">
                  {lastTxnDetails.providerReference ||
                    lastTxnDetails.id ||
                    `TXN_${Date.now()}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isVi ? "Trạng thái:" : "Status:"}</span>
                <span className="font-bold text-emerald-600">
                  {isVi ? "ĐÃ THANH TOÁN THỰC TẾ" : "PAYMENT CONFIRMED"}
                </span>
              </div>
            </div>
          )}

          <Button variant="primary" size="md" className="w-full mt-2" onClick={handleClose}>
            {isVi ? "Bắt đầu sàng lọc ngay" : "Start Screening Now"}
          </Button>
        </div>
      )}
    </Modal>
  );
};
