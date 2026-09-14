import React, { useState, useEffect } from 'react';
import { Download, Building2, Layers, AlertTriangle } from 'lucide-react';
import { clinicAnalyticsApi } from '../services/api';
import { PageHeader, Card, LoadingState, EmptyState, ErrorState, Button, MedicalDisclaimer } from './ui';
import { useLanguage } from '../context/LanguageContext';

export const ClinicCampaignAnalytics: React.FC = () => {
  const { t, isVi } = useLanguage();
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
        setError(res.message || t('clinic.campaignAnalytics.errorTitle'));
      }
    } catch (err: any) {
      setError(err?.message || t('clinic.campaignAnalytics.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await clinicAnalyticsApi.exportData();
    } catch (err: any) {
      alert(err.message || (isVi ? 'Không thể xuất dữ liệu' : 'Unable to export data'));
    }
  };

  if (loading) {
    return <LoadingState message={t('clinic.campaignAnalytics.loadingMessage')} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('clinic.campaignAnalytics.errorTitle')}
        message={error}
        onRetry={fetchData}
      />
    );
  }

  if (!data || (data.totalCampaigns === 0 && data.totalImages === 0)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('clinic.campaignAnalytics.campaignTitle')}
          subtitle={t('clinic.campaignAnalytics.pageSubtitle')}
        />
        <EmptyState
          icon={<Building2 className="w-10 h-10 text-slate-400" />}
          title={t('clinic.campaignAnalytics.emptyTitle')}
          description={t('clinic.campaignAnalytics.emptyDescription')}
          actionLabel={t('clinic.campaignAnalytics.reloadButton')}
          onAction={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('clinic.campaignAnalytics.campaignTitle')}
        subtitle={t('clinic.campaignAnalytics.pageSubtitle')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            {t('clinic.campaignAnalytics.exportCsvButton')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text-secondary uppercase tracking-wider">
              {t('clinic.campaignAnalytics.totalCampaignsCard')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-clinical-text font-mono-data">
            {data?.totalCampaigns || 0}
          </div>
          <p className="text-xs text-clinical-text-muted">
            {t('clinic.campaignAnalytics.totalCampaignsSub')}
          </p>
        </Card>

        <Card padding="lg" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-clinical-text-secondary uppercase tracking-wider">
              {t('clinic.campaignAnalytics.totalImagesCard')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-clinical-text font-mono-data">
            {data?.totalImages || 0}
          </div>
          <p className="text-xs text-clinical-text-muted">
            {t('clinic.campaignAnalytics.totalImagesSub')}
          </p>
        </Card>

        <Card padding="lg" className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              {t('clinic.campaignAnalytics.highRiskCard')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-700 font-mono-data">
            {data?.highRiskPatients || 0}
          </div>
          <p className="text-xs text-clinical-text-muted">
            {t('clinic.campaignAnalytics.highRiskSub')}
          </p>
        </Card>
      </div>

      <MedicalDisclaimer variant="compact" />
    </div>
  );
};
