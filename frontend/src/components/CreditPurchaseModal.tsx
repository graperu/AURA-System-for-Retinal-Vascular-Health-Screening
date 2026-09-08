import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  History,
  Loader2,
  X,
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { billingApi, servicePackageApi } from "../services/api";
interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "patient" | "doctor" | "clinic" | "admin";
  currentCredit?: number;
  onSuccess?: (addedCredits: number) => void;
}
export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentCredit = 0,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"packages" | "history">(
    "packages",
  );
  const [packages, setPackages] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "VNPAY" | "MOMO" | "CREDIT_CARD"
  >("VNPAY");
  const [loading, setLoading] = useState(false);
  const [isProcessingQr, setIsProcessingQr] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [packageResponse, paymentResponse] = await Promise.all([
        servicePackageApi.browse(
          userRole === "clinic" ? "CLINIC" : "INDIVIDUAL",
        ),
        billingApi.myPayments(),
      ]);
      if (packageResponse.success && Array.isArray(packageResponse.data)) {
        setPackages(packageResponse.data);
        if (packageResponse.data.length > 0 && selectedId === null) {
          setSelectedId(packageResponse.data[0].id);
        }
      }
      if (paymentResponse.success && Array.isArray(paymentResponse.data)) {
        setPayments(paymentResponse.data);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Không thể kết nối đến hệ thống thanh toán.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadData();
      setIsProcessingQr(false);
    }
  }, [isOpen, userRole]);

  useEffect(() => {
    let timer: any;
    if (isProcessingQr && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessingQr, qrCountdown]);

  if (!isOpen) return null;

  const handleStartPayment = () => {
    if (selectedId == null) return;
    setIsProcessingQr(true);
    setQrCountdown(60);
    setMessage(null);
  };

  const handleConfirmPayment = async () => {
    if (selectedId == null) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await billingApi.purchase(selectedId, paymentMethod);
      if (!response.success) {
        setMessage({
          type: "error",
          text: response.message || "Giao dịch thanh toán không thành công.",
        });
        setIsProcessingQr(false);
        return;
      }

      const selected = packages.find((item) => item.id === selectedId);
      const added = Number(selected?.credits || 0);
      onSuccess?.(added);
      setMessage({
        type: "success",
        text: `Thanh toán thành công qua cổng ${paymentMethod}! Đã cộng ${added} lượt phân tích vào tài khoản.`,
      });
      setIsProcessingQr(false);
      await loadData();
    } catch (e: any) {
      setMessage({
        type: "error",
        text: "Lỗi xử lý giao dịch. Vui lòng thử lại.",
      });
      setIsProcessingQr(false);
    } finally {
      setLoading(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Mua Gói Khám & Lịch Sử Giao Dịch (FR-11, FR-12)
              </h2>
              <p className="text-xs text-slate-500">
                Số lượt phân tích AI còn lại:{" "}
                <strong className="text-teal-600 font-mono font-bold">
                  {currentCredit} Lượt
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="my-5 flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("packages");
              setIsProcessingQr(false);
            }}
            className={`flex-1 rounded-xl py-2.5 transition-all flex items-center justify-center gap-2 ${
              activeTab === "packages"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="h-4 w-4" /> Chọn Gói Dịch Vụ
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setIsProcessingQr(false);
            }}
            className={`flex-1 rounded-xl py-2.5 transition-all flex items-center justify-center gap-2 ${
              activeTab === "history"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="h-4 w-4" /> Lịch Sử Thanh Toán
          </button>
        </div>

        {/* Alert Messages */}
        {message && (
          <div
            role="alert"
            className={`mb-5 rounded-2xl p-4 text-xs font-medium flex items-center gap-3 border ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {loading && !isProcessingQr && (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
            <span className="text-xs text-slate-500 font-semibold">
              Đang kết nối hệ thống Billing & Payment...
            </span>
          </div>
        )}

        {/* TAB 1: PACKAGES & PAYMENT GATEWAY */}
        {!loading && activeTab === "packages" && !isProcessingQr && (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                1. Chọn gói phân tích thị giác AI
              </label>
              {packages.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 border border-dashed rounded-2xl">
                  Hiện chưa có gói cước dịch vụ nào trong hệ thống.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`rounded-2xl border-2 p-4 text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-cyan-600 bg-cyan-50/40 shadow-md scale-[1.01]"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                          )}
                        </div>
                        <div className="mt-2 text-base font-extrabold text-cyan-800 font-mono">
                          {Number(item.price).toLocaleString("vi-VN")} đ
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                          <Zap className="w-3.5 h-3.5" />
                          <span>
                            {item.credits} lượt khám · Hạn dùng{" "}
                            {item.validityDays} ngày
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                          {item.description ||
                            "Gói phân tích vi mạch võng mạc chuẩn lâm sàng."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gateway Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                2. Chọn cổng thanh toán (Payment Gateway)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("VNPAY")}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "VNPAY"
                      ? "border-[#005BAA] bg-blue-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#005BAA] text-white flex items-center justify-center font-bold text-xs">
                    VN
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    VNPay QR / ATM
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "MOMO"
                      ? "border-[#A50064] bg-pink-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-bold text-xs">
                    MoMo
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Ví MoMo QR
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CREDIT_CARD")}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === "CREDIT_CARD"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Thẻ Quốc Tế
                  </span>
                </button>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bảo mật
                giao dịch 256-bit
              </div>
              <button
                onClick={handleStartPayment}
                disabled={selectedId == null || loading}
                className="px-6 py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* QR CODE PAYMENT POPUP / SIMULATION */}
        {isProcessingQr && selectedPkg && (
          <div className="py-4 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="max-w-xs mx-auto p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>
                  Cổng:{" "}
                  {paymentMethod === "VNPAY"
                    ? "VNPay QR"
                    : paymentMethod === "MOMO"
                      ? "MoMo QR"
                      : "Thẻ Quốc Tế"}
                </span>
                <span className="text-rose-600 font-mono">
                  00:{qrCountdown < 10 ? `0${qrCountdown}` : qrCountdown}
                </span>
              </div>

              {/* QR Canvas Box */}
              <div className="w-44 h-44 mx-auto bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative group">
                <QrCode className="w-36 h-36 text-slate-800" />
                <span className="text-[10px] font-mono font-bold text-cyan-800 mt-1">
                  AURA-PAY-SECURE
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">
                  Gói: {selectedPkg.name}
                </div>
                <div className="text-xl font-extrabold text-cyan-900 font-mono">
                  {Number(selectedPkg.price).toLocaleString("vi-VN")} VND
                </div>
                <div className="text-[11px] text-teal-600 font-semibold">
                  +{selectedPkg.credits} lượt phân tích
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Quét mã QR bằng ứng dụng ngân hàng hoặc ví{" "}
              {paymentMethod === "MOMO" ? "MoMo" : "VNPay"} để xác nhận thanh
              toán tự động.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsProcessingQr(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Xác nhận đã chuyển khoản</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT HISTORY (FR-12) */}
        {!loading && activeTab === "history" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Giao Dịch</th>
                    <th className="p-3.5">Thời Gian</th>
                    <th className="p-3.5">Gói Dịch Vụ</th>
                    <th className="p-3.5">Cổng</th>
                    <th className="p-3.5">Số Tiền</th>
                    <th className="p-3.5">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-slate-400"
                      >
                        Chưa có lịch sử giao dịch nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    payments.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-3.5 font-mono text-cyan-800 font-bold">
                          {item.providerReference || `TXN-${item.id}`}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString("vi-VN")
                            : "--"}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {item.servicePackageName}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                            {item.provider || "VNPAY"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-extrabold text-slate-900">
                          {Number(item.amount).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                              item.status === "SUCCEEDED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : item.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}
                          >
                            {item.status === "SUCCEEDED"
                              ? "THÀNH CÔNG"
                              : item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={loadData}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới lịch sử
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
