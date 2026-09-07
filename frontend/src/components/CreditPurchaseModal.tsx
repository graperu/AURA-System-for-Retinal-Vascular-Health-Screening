import React, { useEffect, useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Zap,
  QrCode,
  History,
  Smartphone,
  Wallet,
  FileText,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { billingApi } from "../services/api";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "patient" | "doctor" | "clinic" | "admin";
  currentCredit?: number;
  onSuccess?: (addedCredits: number) => void;
}

const METHODS = [
  { id: "VNPAY", label: "VNPay", icon: Wallet },
  { id: "MOMO", label: "MoMo", icon: Smartphone },
  { id: "ZALOPAY", label: "ZaloPay", icon: Smartphone },
  { id: "VIETQR", label: "VietQR", icon: QrCode },
  { id: "CARD", label: "Visa/Mastercard", icon: CreditCard },
] as const;

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentCredit = 0,
  onSuccess,
}) => {
  const isClinic = userRole === "clinic";
  const [activeTab, setActiveTab] = useState<"packages" | "history">(
    "packages",
  );
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("VNPAY");
  const [voucherCode, setVoucherCode] = useState("");
  const [simulateOutcome, setSimulateOutcome] = useState<
    "SUCCESS" | "FAILED" | "PENDING"
  >("SUCCESS");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const load = async () => {
    const pkgRes = await billingApi.packages(
      isClinic ? "CLINIC" : "INDIVIDUAL",
    );
    if (pkgRes.success && Array.isArray(pkgRes.data)) {
      setPackages(pkgRes.data);
      if (pkgRes.data.length > 0) setSelectedPkgId(pkgRes.data[0].id);
    }
    const payRes = await billingApi.myPayments();
    if (payRes.success && Array.isArray(payRes.data)) setPayments(payRes.data);
  };

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, isClinic]);

  if (!isOpen) return null;

  const selectedPkg =
    packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handlePay = async () => {
    if (!selectedPkg) return;
    setIsProcessing(true);
    setError(null);
    setMessage(null);
    const outcome = paymentMethod === "VIETQR" ? "PENDING" : simulateOutcome;
    const res = await billingApi.purchase(selectedPkg.id, {
      paymentMethod,
      voucherCode: voucherCode.trim() || undefined,
      simulateOutcome: outcome,
    });
    setIsProcessing(false);
    if (!res.success) {
      setError(
        res.message ||
          "Thanh toán thất bại. Có thể thử hoàn tiền nếu đã trừ nhầm (Refund Policy).",
      );
      await load();
      return;
    }
    if (res.data?.status === "PENDING") {
      setPendingId(res.data.id);
      setMessage(
        "Giao dịch đang treo — quét VietQR rồi bấm Xác nhận, hoặc Hủy nếu timeout.",
      );
      await load();
      return;
    }
    setMessage(
      `Thanh toán thành công qua ${paymentMethod}. Đã cộng ${selectedPkg.credits} lượt.`,
    );
    onSuccess?.(selectedPkg.credits);
    await load();
  };

  const confirmPending = async () => {
    if (!pendingId) return;
    const res = await billingApi.confirmPayment(pendingId);
    if (res.success) {
      setMessage("Đã xác nhận VietQR — credit đã cộng.");
      setPendingId(null);
      onSuccess?.(selectedPkg?.credits || 0);
      await load();
    } else setError(res.message || "Không xác nhận được.");
  };

  const cancelPending = async () => {
    if (!pendingId) return;
    await billingApi.failPayment(pendingId, "Timeout / hủy quét VietQR");
    setPendingId(null);
    setMessage("Đã ghi nhận giao dịch thất bại.");
    await load();
  };

  const downloadInvoice = async (id: number) => {
    const res = await billingApi.invoice(id);
    if (!res.success || !res.data) {
      setError(res.message || "Không xuất được hóa đơn");
      return;
    }
    const inv = res.data;
    const amount = Number(inv.amount ?? 0).toLocaleString("vi-VN");
    const when = inv.paidAt || inv.createdAt || "";
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>Hóa đơn ${inv.invoiceNumber || id}</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:32px;color:#0f172a;max-width:640px;margin:0 auto}
    h2{color:#0f766e;margin-bottom:8px}
    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0}
    .label{color:#64748b;font-size:13px}
    .value{font-weight:600}
    footer{margin-top:32px;font-size:12px;color:#94a3b8}
  </style>
</head>
<body>
  <h2>Hóa đơn AURA</h2>
  <p style="color:#64748b;margin-top:0">Sàng lọc sức khỏe mạch máu võng mạc</p>
  <div class="row"><span class="label">Số HĐ</span><span class="value">${inv.invoiceNumber || "—"}</span></div>
  <div class="row"><span class="label">Gói</span><span class="value">${inv.servicePackageName || "—"}</span></div>
  <div class="row"><span class="label">Số tiền</span><span class="value">${amount} ${inv.currency || "VND"}</span></div>
  <div class="row"><span class="label">Cổng</span><span class="value">${inv.provider || "—"}</span></div>
  <div class="row"><span class="label">Trạng thái</span><span class="value">${inv.status || "—"}</span></div>
  <div class="row"><span class="label">Thời gian</span><span class="value">${when}</span></div>
  <footer>AURA — Clinical Decision Support · Hóa đơn điện tử demo</footer>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoiceNumber || "hoa-don-" + id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refund = async (id: number) => {
    const res = await billingApi.refund(
      id,
      "Hoàn tiền theo chính sách AURA (demo)",
    );
    if (res.success) {
      setMessage("Đã hoàn tiền và trừ credit tương ứng.");
      await load();
    } else setError(res.message || "Không hoàn được.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-teal-100 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Mua / gia hạn gói phân tích (FR-11, FR-12)
            </h2>
            <p className="text-xs text-slate-500">
              Số lượt còn lại:{" "}
              <strong className="text-teal-600 font-mono-data">
                {currentCredit}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("packages")}
            className={`flex-1 py-2 rounded-lg ${activeTab === "packages" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600"}`}
          >
            <span className="inline-flex items-center gap-1.5 justify-center w-full">
              <Zap className="w-3.5 h-3.5" /> Mua gói
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-lg ${activeTab === "history" ? "bg-white text-teal-700 shadow-xs" : "text-slate-600"}`}
          >
            <span className="inline-flex items-center gap-1.5 justify-center w-full">
              <History className="w-3.5 h-3.5" /> Lịch sử & hóa đơn
            </span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            {message}
          </div>
        )}

        {activeTab === "packages" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`text-left p-4 rounded-xl border-2 ${
                    selectedPkgId === pkg.id
                      ? "border-teal-500 bg-teal-50/40"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      {pkg.name}
                    </h4>
                    <span className="text-xs font-extrabold text-teal-600">
                      {pkg.credits} lượt
                    </span>
                  </div>
                  <div className="text-base font-extrabold font-mono-data mt-1">
                    {Number(pkg.price).toLocaleString("vi-VN")} đ
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {pkg.description}
                  </p>
                </button>
              ))}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Cổng thanh toán
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-semibold ${
                      paymentMethod === m.id
                        ? "border-teal-500 bg-white text-teal-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <m.icon className="w-4 h-4 text-teal-600" /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-700">
              Mã giảm giá / voucher
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="AURA10, TET2026, FAMILY15"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-data"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Mô phỏng ngoại lệ (đồ án)
              <select
                value={simulateOutcome}
                onChange={(e) => setSimulateOutcome(e.target.value as any)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại (cổng từ chối)</option>
                <option value="PENDING">Treo (chờ xác nhận)</option>
              </select>
            </label>

            {pendingId && (
              <div className="flex gap-2">
                <button
                  onClick={confirmPending}
                  className="flex-1 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
                >
                  Xác nhận VietQR
                </button>
                <button
                  onClick={cancelPending}
                  className="flex-1 py-2 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Hủy giao dịch treo
                </button>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={isProcessing || !selectedPkg}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
            >
              {isProcessing
                ? "Đang kết nối cổng thanh toán..."
                : "Thanh toán / Gia hạn"}
            </button>
            <p className="text-[10px] text-slate-400">
              Refund Policy: giao dịch SUCCEEDED có thể hoàn tiền; credit bị trừ
              lại. Giao dịch FAILED không cộng lượt. VietQR PENDING không cộng
              lượt đến khi xác nhận.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2">Mã</th>
                    <th className="p-2">Gói</th>
                    <th className="p-2">Cổng</th>
                    <th className="p-2">Số tiền</th>
                    <th className="p-2">Trạng thái</th>
                    <th className="p-2">HĐ / Hoàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-slate-400"
                      >
                        Chưa có giao dịch
                      </td>
                    </tr>
                  ) : (
                    payments.map((tx) => (
                      <tr key={tx.id}>
                        <td className="p-2 font-mono-data">
                          {tx.invoiceNumber || tx.id}
                        </td>
                        <td className="p-2">{tx.servicePackageName}</td>
                        <td className="p-2">{tx.provider}</td>
                        <td className="p-2 font-mono-data">
                          {Number(tx.amount).toLocaleString("vi-VN")} đ
                        </td>
                        <td className="p-2">{tx.status}</td>
                        <td className="p-2 flex gap-1">
                          <button
                            onClick={() => downloadInvoice(tx.id)}
                            className="p-1 rounded bg-slate-100"
                            title="Xuất HĐĐT"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {tx.status === "SUCCEEDED" && (
                            <button
                              onClick={() => refund(tx.id)}
                              className="p-1 rounded bg-amber-50 text-amber-700"
                              title="Hoàn tiền"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
