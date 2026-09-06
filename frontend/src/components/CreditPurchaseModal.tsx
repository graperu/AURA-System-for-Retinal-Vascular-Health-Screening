import React, { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, History, Loader2, X } from 'lucide-react';
import { billingApi, servicePackageApi } from '../services/api';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'patient' | 'doctor' | 'clinic' | 'admin';
  currentCredit?: number;
  onSuccess?: (addedCredits: number) => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen, onClose, userRole, currentCredit = 0, onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');
  const [packages, setPackages] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    const [packageResponse, paymentResponse] = await Promise.all([
      servicePackageApi.browse(userRole === 'clinic' ? 'CLINIC' : 'INDIVIDUAL'),
      billingApi.myPayments(),
    ]);
    setPackages(packageResponse.success && Array.isArray(packageResponse.data) ? packageResponse.data : []);
    setPayments(paymentResponse.success && Array.isArray(paymentResponse.data) ? paymentResponse.data : []);
    if (!packageResponse.success) setMessage(packageResponse.message || 'Không thể tải danh mục gói dịch vụ.');
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) void loadData();
  }, [isOpen, userRole]);

  if (!isOpen) return null;

  const pay = async () => {
    if (selectedId == null) return;
    setLoading(true);
    setMessage(null);
    const response = await billingApi.purchase(selectedId);
    setLoading(false);
    if (!response.success) {
      setMessage(response.message || 'Thanh toán chưa thể thực hiện. Không có khoản tiền nào được thu.');
      return;
    }
    const selected = packages.find((item) => item.id === selectedId);
    onSuccess?.(Number(selected?.credits || 0));
    setMessage('Thanh toán đã được nhà cung cấp xác nhận.');
    await loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div><h2 className="font-bold text-slate-900">Gói dịch vụ và thanh toán</h2><p className="text-xs text-slate-500">Số lượt còn lại: {currentCredit}</p></div>
          <button onClick={onClose} aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="my-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button onClick={() => setActiveTab('packages')} className={`flex-1 rounded-lg p-2 ${activeTab === 'packages' ? 'bg-white text-teal-700' : ''}`}><CreditCard className="mr-1 inline h-4 w-4" />Gói dịch vụ</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 rounded-lg p-2 ${activeTab === 'history' ? 'bg-white text-teal-700' : ''}`}><History className="mr-1 inline h-4 w-4" />Lịch sử thật</button>
        </div>
        {message && <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{message}</div>}
        {loading && <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>}
        {!loading && activeTab === 'packages' && (
          <div className="space-y-4">
            {packages.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Chưa có gói dịch vụ hoạt động.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">{packages.map((item) => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`rounded-xl border-2 p-4 text-left ${selectedId === item.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                  <div className="font-bold text-slate-900">{item.name}</div><div className="mt-2 font-mono font-bold">{Number(item.price).toLocaleString('vi-VN')} đ</div><div className="text-xs text-teal-700">{item.credits} lượt · {item.validityDays} ngày</div><p className="mt-2 text-xs text-slate-500">{item.description || 'Không có mô tả.'}</p>
                </button>
              ))}</div>
            )}
            <button onClick={pay} disabled={selectedId == null || loading} className="ml-auto flex rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-2 h-4 w-4" />Thanh toán qua cổng đã cấu hình</button>
          </div>
        )}
        {!loading && activeTab === 'history' && (
          <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-xs"><thead className="bg-slate-50"><tr><th className="p-3">Mã</th><th className="p-3">Thời gian</th><th className="p-3">Gói</th><th className="p-3">Số tiền</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{payments.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.id}</td><td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Không có'}</td><td className="p-3">{item.servicePackageName}</td><td className="p-3">{Number(item.amount).toLocaleString('vi-VN')} đ</td><td className="p-3">{item.status}</td></tr>)}</tbody></table>{payments.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Chưa có giao dịch.</p>}</div>
        )}
      </div>
    </div>
  );
};
