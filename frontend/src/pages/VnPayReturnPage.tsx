import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, ArrowLeft, ShieldCheck, CreditCard, Building2, Calendar } from 'lucide-react';

export const VnPayReturnPage: React.FC = () => {
  const params = useMemo(() => {
    return new URLSearchParams(window.location.search);
  }, []);

  const responseCode = params.get('vnp_ResponseCode') || '';
  const txnRef = params.get('vnp_TxnRef') || '';
  const amountRaw = params.get('vnp_Amount') || '0';
  const bankCode = params.get('vnp_BankCode') || 'NCB';
  const orderInfo = params.get('vnp_OrderInfo') || '';
  const transactionNo = params.get('vnp_TransactionNo') || '';
  const payDateRaw = params.get('vnp_PayDate') || '';

  const isSuccess = responseCode === '00';
  const amountVnd = Math.round(Number(amountRaw) / 100);

  const formattedDate = useMemo(() => {
    if (payDateRaw.length === 14) {
      const year = payDateRaw.substring(0, 4);
      const month = payDateRaw.substring(4, 6);
      const day = payDateRaw.substring(6, 8);
      const hour = payDateRaw.substring(8, 10);
      const min = payDateRaw.substring(10, 12);
      const sec = payDateRaw.substring(12, 14);
      return `${hour}:${min}:${sec} - ${day}/${month}/${year}`;
    }
    return new Date().toLocaleString('vi-VN');
  }, [payDateRaw]);

  const getErrorMessage = (code: string) => {
    switch (code) {
      case '24':
        return 'Giao dịch bị hủy bởi khách hàng.';
      case '07':
        return 'Trừ tiền thành công. Giao dịch bị nghi ngờ gian lận.';
      case '09':
        return 'Thẻ/Tài khoản của bạn chưa đăng ký dịch vụ InternetBanking tại ngân hàng.';
      case '10':
        return 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.';
      case '11':
        return 'Đã hết hạn chờ thanh toán. Vui lòng thử lại.';
      case '12':
        return 'Thẻ/Tài khoản của bạn đang bị khóa.';
      case '51':
        return 'Tài khoản của bạn không đủ số dư để thực hiện giao dịch.';
      case '65':
        return 'Tài khoản của bạn đã vượt quá hạn mức giao dịch trong ngày.';
      default:
        return `Giao dịch không thành công (Mã phản hồi VNPAY: ${code || 'N/A'}).`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className={`p-6 text-center text-white ${isSuccess ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-rose-600 to-amber-600'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3 backdrop-blur-sm">
            {isSuccess ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {isSuccess ? 'Thanh Toán Thành Công!' : 'Giao Dịch Chưa Hoàn Tất'}
          </h1>
          <p className="text-sm text-white/90 mt-1 font-medium">
            {isSuccess
              ? 'Hệ thống đã ghi nhận thanh toán qua Cổng VNPAY Sandbox'
              : getErrorMessage(responseCode)}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Số tiền thanh toán</span>
              <span className="text-lg font-bold text-teal-700">
                {amountVnd > 0 ? amountVnd.toLocaleString('vi-VN') : '0'} đ
              </span>
            </div>

            {txnRef && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Mã giao dịch AURA
                </span>
                <span className="font-semibold text-slate-700 font-mono text-xs">{txnRef}</span>
              </div>
            )}

            {transactionNo && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Mã giao dịch VNPAY
                </span>
                <span className="font-semibold text-slate-700 font-mono text-xs">{transactionNo}</span>
              </div>
            )}

            {bankCode && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" /> Ngân hàng thực hiện
                </span>
                <span className="font-semibold text-slate-700 uppercase">{bankCode} (Sandbox)</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Thời gian xử lý
              </span>
              <span className="font-medium text-slate-600 text-xs">{formattedDate}</span>
            </div>

            {orderInfo && (
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span className="font-medium text-slate-600">Nội dung: </span>
                {decodeURIComponent(orderInfo.replace(/\+/g, ' '))}
              </div>
            )}
          </div>

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Số lượt khám và quyền lợi của gói dịch vụ đã được cập nhật tự động vào tài khoản của bạn.
              </span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {isSuccess ? 'Về Bảng Điều Khiển / Bắt Đầu Khám' : 'Quay Lại Hệ Thống AURA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VnPayReturnPage;
