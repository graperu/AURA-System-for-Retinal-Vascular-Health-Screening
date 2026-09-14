import React, { useState, useEffect } from 'react';
import { Download, Building2, Layers, AlertTriangle } from 'lucide-react';
import { clinicAnalyticsApi } from '../services/api';
import { PageHeader, Card, LoadingState, EmptyState, ErrorState, Button, MedicalDisclaimer } from './ui';

export const ClinicCampaignAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clinicAnalyticsApi.getCampaignAnalytics();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Lỗi tải dữ liệu báo cáo chiến dịch');
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối đến máy chủ báo cáo chiến dịch.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await clinicAnalyticsApi.exportData();
    } catch (err: any) {
      alert(err.message || 'Không thể xuất dữ liệu');
    }
  };

  if (loading) {
    return <LoadingState message="Đang tải dữ liệu báo cáo chiến dịch lâm sàng..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Lỗi tải dữ liệu chiến dịch"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  if (!data || (data.totalCampaigns === 0 && data.totalImages === 0)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Báo cáo Chiến dịch Lâm sàng"
          subtitle="Dữ liệu tổng hợp toàn phòng khám và các đợt sàng lọc vi mạch."
        />
        <EmptyState
          icon={<Building2 className="w-10 h-10 text-slate-400" />}
          title="Chưa có dữ liệu chiến dịch"
          description="Phòng khám chưa triển khai chiến dịch sàng lọc nào hoặc chưa có dữ liệu tổng hợp."
          actionLabel="Tải lại dữ liệu"
          onAction={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo Chiến dịch Lâm sàng"
        subtitle="Dữ liệu tổng hợp toàn cơ sở y tế / phòng khám và các đợt sàng lọc vi mạch."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Xuất dữ liệu (CSV)
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text-secondary uppercase tracking-wider">
              Tổng số chiến dịch
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-clinical-text font-mono-data">
            {data?.totalCampaigns || 0}
          </div>
          <p className="text-xs text-clinical-text-muted">
            Chiến dịch sàng lọc cộng đồng đã khởi tạo
          </p>
        </Card>

        <Card padding="lg" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text-secondary uppercase tracking-wider">
              Tổng số ảnh đã quét
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-clinical-text font-mono-data">
            {data?.totalImages || 0}
          </div>
          <p className="text-xs text-clinical-text-muted">
            Ảnh chụp đáy mắt đã phân tích qua AI
          </p>
        </Card>

        <Card padding="lg" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Bệnh nhân nguy cơ cao
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-700 font-mono-data">
            {data?.highRiskPatients || 0}
          </div>
          <p className="text-xs text-clinical-text-muted">
            Ca bệnh cần theo dõi hoặc chuyển tuyến chuyên khoa
          </p>
        </Card>
      </div>

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
