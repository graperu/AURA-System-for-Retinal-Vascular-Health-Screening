import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, ShieldCheck, Zap, Building2, UserCheck, Sparkles, QrCode, History, Clock, FileText } from 'lucide-react';

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
  currentCredit = 5,
  onSuccess,
}) => {
  const isClinic = userRole === 'clinic';
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');

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
      desc: '5 lượt tầm soát toàn diện + Theo dõi xu hướng mạch máu + Hội chẩn Bác sĩ Chuyên khoa.',
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

  // Sample transaction history for FR-12
  const [transactionHistory] = useState([
    {
      id: 'TXN-998241',
      date: '2026-08-15 09:30',
      packageName: 'Gói Chăm Sóc Định Kỳ (Pro 5)',
      amount: '590.000 đ',
      credits: '+5 lượt',
      status: 'THÀNH CÔNG',
      method: 'VietQR Banking',
    },
    {
      id: 'TXN-881023',
      date: '2026-07-02 14:15',
      packageName: 'Gói Cơ Bản (Single Scan)',
      amount: '150.000 đ',
      credits: '+1 lượt',
      status: 'THÀNH CÔNG',
      method: 'Thẻ Visa/Master',
    },
  ]);

  if (!isOpen) return null;

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess(selectedPkg.credits);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-teal-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Nạp Lượt Khám & Gói Dịch Vụ Phân Tích (FR-11, FR-12)
              </h2>
              <p className="text-xs text-slate-500">
                Số lượt phân tích còn lại của bạn:{' '}
                <strong className="text-teal-600 font-mono-data text-sm">{currentCredit} lượt</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'packages' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Mua Thêm Gói Khám (FR-11)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Lịch Sử Thanh Toán (FR-12)
          </button>
        </div>

        {activeTab === 'packages' ? (
          <>
            {isSuccess ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Thanh toán thành công!</h3>
                <p className="text-xs text-emerald-700">
                  Đã cộng <strong>+{selectedPkg.credits} lượt phân tích</strong> vào tài khoản của bạn.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Packages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkgId(pkg.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                        selectedPkgId === pkg.id
                          ? 'border-teal-500 bg-teal-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 right-3 text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                          Khuyên dùng
                        </span>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-bold text-slate-900">{pkg.name}</h4>
                        <span className="text-xs font-extrabold text-teal-600 font-mono-data">
                          {pkg.credits} lượt
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-slate-800 font-mono-data mb-2">
                        {pkg.price}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">{pkg.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Payment Methods */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Phương thức thanh toán bảo mật</span>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setPaymentMethod('vietqr')}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                        paymentMethod === 'vietqr'
                          ? 'bg-white border-teal-500 text-teal-800 shadow-xs'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-teal-600" />
                      VietQR Quét Mã Ngân Hàng
                    </label>

                    <label
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-xs font-semibold ${
                        paymentMethod === 'card'
                          ? 'bg-white border-teal-500 text-teal-800 shadow-xs'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      Thẻ Visa / Master / ATM
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Tổng thanh toán: <strong className="text-slate-900 text-sm font-mono-data">{selectedPkg.price}</strong>
                  </span>
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>Đang xử lý kết nối ngân hàng...</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Thanh Toán Ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Transaction History Table for FR-12 */
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Mã GD</th>
                    <th className="p-3">Thời Gian</th>
                    <th className="p-3">Gói Dịch Vụ</th>
                    <th className="p-3">Số Tiền</th>
                    <th className="p-3">Lượt Cộng</th>
                    <th className="p-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono-data font-semibold text-slate-800">{tx.id}</td>
                      <td className="p-3 text-slate-500 font-mono-data">{tx.date}</td>
                      <td className="p-3 text-slate-800 font-medium">{tx.packageName}</td>
                      <td className="p-3 font-mono-data font-bold text-slate-900">{tx.amount}</td>
                      <td className="p-3 font-mono-data font-bold text-emerald-600">{tx.credits}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between text-xs">
              <span className="text-teal-900 font-medium">Hạn mức phân tích khả dụng:</span>
              <span className="text-teal-900 font-bold font-mono-data text-sm">{currentCredit} Lượt Khám</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
