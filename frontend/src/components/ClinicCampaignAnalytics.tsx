import React, { useState, useEffect } from 'react';
import { clinicAnalyticsApi } from '../services/api';

export const ClinicCampaignAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await clinicAnalyticsApi.getCampaignAnalytics();
    if (res.success) {
      setData(res.data);
    } else {
      setError(res.message || 'Lỗi tải dữ liệu báo cáo chiến dịch');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      await clinicAnalyticsApi.exportData();
    } catch (err: any) {
      alert(err.message || 'Không thể xuất dữ liệu');
    }
  };

  if (loading) return <div className="text-center p-8">Đang tải dữ liệu báo cáo...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#134E4A]">Báo cáo Chiến dịch Lâm sàng</h1>
          <p className="text-xs text-slate-500 mt-1">Dữ liệu tổng hợp toàn phòng khám.</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-[#0891B2] hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition"
        >
          Xuất dữ liệu (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-bold text-slate-500 mb-2">Tổng số chiến dịch</p>
          <p className="text-3xl font-extrabold text-[#134E4A]">{data?.totalCampaigns || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-bold text-slate-500 mb-2">Tổng số ảnh đã quét</p>
          <p className="text-3xl font-extrabold text-[#134E4A]">{data?.totalImages || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-sm font-bold text-slate-500 mb-2">Bệnh nhân nguy cơ cao</p>
          <p className="text-3xl font-extrabold text-red-600">{data?.highRiskPatients || 0}</p>
        </div>
      </div>
    </div>
  );
};
