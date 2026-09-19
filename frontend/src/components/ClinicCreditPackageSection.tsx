import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Check,
  History,
  Layers,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { CreditPurchaseModal, CreditPackage } from './CreditPurchaseModal';
import { billingApi, servicePackageApi, clinicAnalyticsApi } from '../services/api';
import { ClinicBatchJob } from '../types/cds';
import { useLanguage } from '../context/LanguageContext';

export interface ClinicCreditPackageSectionProps {
  batchJob?: ClinicBatchJob;
  onRefreshBatch?: () => void;
}

interface SubscriptionItem {
  servicePackageId?: number;
  servicePackageName?: string;
  remainingCredits: number;
  expiresAt: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED' | 'CANCELLED' | string;
}

interface PaymentItem {
  id: number;
  servicePackageId?: number;
  servicePackageName?: string;
  amount: number;
  status: 'SUCCEEDED' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | string;
  provider: string;
  failureReason?: string | null;
  createdAt?: string;
  paidAt?: string | null;
  providerReference?: string;
}

interface ClinicPackageItem {
  id: number;
  name: string;
  description?: string;
  scansCount: number;
  priceVnd: number;
  validityDays: number;
  isPopular?: boolean;
  features: string[];
}

export const ClinicCreditPackageSection: React.FC<ClinicCreditPackageSectionProps> = ({
  batchJob,
  onRefreshBatch,
}) => {
  const { t, isVi } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [packages, setPackages] = useState<ClinicPackageItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);

  // Modal purchase state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [selectedPackageForModal, setSelectedPackageForModal] = useState<CreditPackage | null>(null);
  const [initialPackageId, setInitialPackageId] = useState<number | undefined>(undefined);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Danh mục gói dịch vụ chuẩn phòng khám (FR-28: 500 - 5.000 lượt)
  const defaultClinicPackages: ClinicPackageItem[] = useMemo(
    () => [
      {
        id: 101,
        name: t('clinic.creditPackage.pkgStarterName'),
        description: t('clinic.creditPackage.pkgStarterDesc'),
        scansCount: 500,
        priceVnd: 5000000,
        validityDays: 90,
        features: [
          isVi ? '500 lượt phân tích ảnh vi mạch võng mạc AI' : '500 AI retinal microvascular evaluations',
          isVi ? 'Đánh giá 4 cấp độ nguy cơ (Thấp, Trung bình, Cao, Nguy kịch)' : '4 clinical risk tier classifications (Low, Moderate, High, Critical)',
          isVi ? 'Bản đồ nhiệt Grad-CAM & tính toán tỷ lệ vi mạch A/V' : 'Grad-CAM heatmap attention & arteriovenous ratio quantification',
          isVi ? 'Báo cáo chẩn đoán tóm tắt PDF chuẩn Bộ Y Tế' : 'Standard PDF summary report compliant with health authority guidelines',
          isVi ? 'Hỗ trợ tối đa 2 tài khoản bác sĩ tiếp nhận phân tích' : 'Up to 2 doctor seats for clinical review',
          isVi ? 'Hỗ trợ kỹ thuật qua email trong giờ hành chính' : 'Standard business hours email support',
        ],
      },
      {
        id: 102,
        name: t('clinic.creditPackage.pkgCampaignName'),
        description: t('clinic.creditPackage.pkgCampaignDesc'),
        scansCount: 2000,
        priceVnd: 18000000,
        validityDays: 180,
        isPopular: true,
        features: [
          isVi ? '2.000 lượt phân tích ảnh võng mạc tốc độ cao' : '2,000 high-throughput retinal scan evaluations',
          isVi ? 'Tự động xử lý đợt hàng loạt tệp ZIP & DICOM' : 'Automated bulk batch processing for ZIP & DICOM folders',
          isVi ? 'Báo cáo dịch tễ học & thống kê phân tầng nguy cơ toàn chiến dịch' : 'Epidemiological reporting & campaign-wide risk stratification',
          isVi ? 'Phân công bệnh nhân tự động cho đội ngũ bác sĩ chuyên khoa' : 'Automated patient assignment to specialist physicians',
          isVi ? 'Xuất dữ liệu báo cáo chuyên sâu định dạng CSV/Excel' : 'In-depth clinical data export in CSV/Excel formats',
          isVi ? 'Không giới hạn số lượng tài khoản bác sĩ trực thuộc' : 'Unlimited affiliated physician accounts',
          isVi ? 'Tiết kiệm 10% chi phí so với gói cơ sở' : '10% cost savings compared to starter tier',
        ],
      },
      {
        id: 103,
        name: t('clinic.creditPackage.pkgHospitalName'),
        description: t('clinic.creditPackage.pkgHospitalDesc'),
        scansCount: 5000,
        priceVnd: 40000000,
        validityDays: 365,
        features: [
          isVi ? '5.000 lượt phân tích ảnh võng mạc với băng thông ưu tiên cao nhất' : '5,000 retinal scan evaluations with highest bandwidth priority',
          isVi ? 'Cổng tích hợp API chuyên biệt với hệ thống PACS / HIS / EMR' : 'Dedicated API integration for PACS / HIS / EMR hospital systems',
          isVi ? 'Báo cáo dịch tễ học và giám sát xu hướng thời gian thực' : 'Real-time epidemiological surveillance & trend analytics',
          isVi ? 'Ký số kết luận y khoa với chứng thư số bảo mật cao' : 'Digital signing of clinical conclusions with high-assurance certificates',
          isVi ? 'Hỗ trợ kỹ thuật chuyên biệt 24/7 & chuyên viên lâm sàng đào tạo' : '24/7 dedicated technical support & clinical staff onboarding',
          isVi ? 'Tùy biến mẫu báo cáo thương hiệu riêng của cơ sở y tế' : 'Custom branded medical reporting templates',
          isVi ? 'Tiết kiệm 20% chi phí phân tích vi mạch' : '20% cost savings on microvascular evaluations',
        ],
      },
    ],
    [t, isVi]
  );

  // Nạp toàn bộ dữ liệu từ Backend API
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [subsRes, paymentsRes, packagesRes, analyticsRes] = await Promise.allSettled([
        billingApi.mySubscriptions(),
        billingApi.myPayments(),
        servicePackageApi.list('CLINIC'),
        clinicAnalyticsApi.getCampaignAnalytics(),
      ]);

      // 1. Xử lý subscriptions
      if (subsRes.status === 'fulfilled' && subsRes.value.success && Array.isArray(subsRes.value.data)) {
        setSubscriptions(subsRes.value.data);
      } else {
        setSubscriptions([]);
      }

      // 2. Xử lý payments history
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.success && Array.isArray(paymentsRes.value.data)) {
        setPayments(paymentsRes.value.data);
      } else {
        setPayments([]);
      }

      // 3. Xử lý danh mục packages từ backend
      if (packagesRes.status === 'fulfilled' && packagesRes.value.success && Array.isArray(packagesRes.value.data) && packagesRes.value.data.length > 0) {
        // Map backend packages kết hợp với thông số hiển thị
        const backendPkgs = packagesRes.value.data;
        const mappedList: ClinicPackageItem[] = backendPkgs.map((bp: any, idx: number) => {
          const defaultMatch = defaultClinicPackages.find(
            (dp) => dp.id === bp.id || dp.scansCount === bp.credits
          );

          return {
            id: bp.id,
            name: bp.name || defaultMatch?.name || `Gói Khám Phòng Khám ${bp.credits || 500} Lượt`,
            description: bp.description || defaultMatch?.description || 'Gói hạn mức phân tích ảnh võng mạc phòng khám.',
            scansCount: bp.credits || defaultMatch?.scansCount || 500,
            priceVnd: Number(bp.price || defaultMatch?.priceVnd || 5000000),
            validityDays: bp.validityDays || defaultMatch?.validityDays || 180,
            isPopular: idx === 1 || bp.credits === 2000,
            features: defaultMatch?.features || [
              `${bp.credits || 500} lượt phân tích ảnh võng mạc AI`,
              'Đánh giá nguy cơ vi mạch & bản đồ Grad-CAM',
              'Xuất báo cáo PDF chuẩn Bộ Y Tế',
              'Quản lý bác sĩ và phân công bệnh nhân',
            ],
          };
        });

        // Nếu backend chỉ có 1 gói mẫu, bổ sung thêm 2 gói chuẩn để phòng khám luôn có đầy đủ 3 mức 500-2000-5000
        if (mappedList.length === 1) {
          const first = mappedList[0];
          const rest = defaultClinicPackages.filter((dp) => dp.scansCount !== first.scansCount);
          setPackages([first, ...rest]);
        } else {
          setPackages(mappedList);
        }
      } else {
        // Sử dụng danh mục chuẩn 500 - 5.000 lượt (FR-28)
        setPackages(defaultClinicPackages);
      }

      // 4. Xử lý analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success && analyticsRes.value.data) {
        setAnalyticsData(analyticsRes.value.data);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu hạn mức phòng khám:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [defaultClinicPackages]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Thống kê hạn mức (FR-27)
  const remainingCredits = useMemo(() => {
    return subscriptions.reduce((sum, item) => {
      if (item.status === 'ACTIVE') {
        return sum + Number(item.remainingCredits || 0);
      }
      return sum;
    }, 0);
  }, [subscriptions]);

  const activeSubscription = useMemo(() => {
    return subscriptions.find((s) => s.status === 'ACTIVE') || null;
  }, [subscriptions]);

  const scannedInBatch = Number(batchJob?.processedCount || 0);
  const totalScannedCampaign = Number(analyticsData?.totalImages || scannedInBatch);

  // Tính toán thanh tiến trình sử dụng hạn mức
  const totalQuota = useMemo(() => {
    if (activeSubscription) {
      // Ước tính tổng quota = số lượt còn lại + số lượt đã phân tích trong chiến dịch
      return Math.max(100, remainingCredits + scannedInBatch);
    }
    return Math.max(100, remainingCredits + scannedInBatch);
  }, [activeSubscription, remainingCredits, scannedInBatch]);

  const usedPercent = useMemo(() => {
    if (totalQuota <= 0) return 0;
    const ratio = (scannedInBatch / totalQuota) * 100;
    return Math.min(100, Math.max(0, Math.round(ratio)));
  }, [scannedInBatch, totalQuota]);

  const remainingPercent = Math.max(0, 100 - usedPercent);

  // Xử lý mở Modal mua gói
  const handleOpenPurchase = (pkg?: ClinicPackageItem) => {
    if (pkg) {
      const creditPkg: CreditPackage = {
        id: pkg.id,
        name: pkg.name,
        scansCount: pkg.scansCount,
        priceVnd: pkg.priceVnd,
        isPopular: pkg.isPopular,
        features: pkg.features,
        validityDays: pkg.validityDays,
      };
      setSelectedPackageForModal(creditPkg);
      setInitialPackageId(pkg.id);
    } else {
      setSelectedPackageForModal(null);
      setInitialPackageId(undefined);
    }
    setIsPurchaseModalOpen(true);
  };

  // Callback sau khi mua gói thành công
  const handlePurchaseSuccess = (added: number) => {
    setActionMessage({
      type: 'success',
      text: isVi
        ? `Gia hạn thành công! Tài khoản phòng khám đã được cộng thêm +${added.toLocaleString('vi-VN')} lượt khám sàng lọc.`
        : `Renewal successful! Your clinic account has been credited with +${added.toLocaleString('en-US')} screening scans.`,
    });
    setTimeout(() => setActionMessage(null), 8000);
    fetchAllData(true);
    if (onRefreshBatch) onRefreshBatch();
  };

  // Định dạng ngày hiển thị
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(isVi ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3 clinic.creditPackage" data-section="clinic.creditPackage">
        <span className="sr-only">Gói Khám Credit 500</span>
        <RefreshCw className="w-8 h-8 text-[#3478F6] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">{t('clinic.creditPackage.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 clinic.creditPackage" data-section="clinic.creditPackage">
      {/* Thông báo thao tác */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cảnh báo hạn mức nguy cấp nếu hết hoặc sắp hết */}
      {remainingCredits <= 20 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900 text-sm">
              {remainingCredits === 0
                ? t('clinic.creditPackage.quotaDepletedTitle')
                : `${t('clinic.creditPackage.quotaLowTitle')} (${isVi ? `Chỉ còn ${remainingCredits} lượt` : `Only ${remainingCredits} remaining`})`}
            </h4>
            <p className="text-amber-800 mt-1 leading-relaxed">
              {t('clinic.creditPackage.quotaWarningDesc')}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenPurchase()}
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0"
          >
            {t('clinic.creditPackage.topUpNow')}
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHẦN 1: THỐNG KÊ HẠN MỨC & DUNG LƯỢNG (FR-27) */}
      {/* ========================================================================= */}
      <Card padding="md" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {t('clinic.creditPackage.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('clinic.creditPackage.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              title={t('clinic.creditPackage.refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('clinic.creditPackage.refreshing') : t('clinic.creditPackage.refresh')}</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              icon={<Zap className="w-4 h-4" />}
              onClick={() => handleOpenPurchase()}
            >
              {t('clinic.creditPackage.renewBuyButton')}
            </Button>
          </div>
        </div>

        {/* 4 Thẻ chỉ số tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Số lượt khám khả dụng */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{t('clinic.creditPackage.availableCredits')}</span>
              <CreditCard className="w-4 h-4 text-[#3478F6]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-data text-[#3478F6]">
                {remainingCredits.toLocaleString(isVi ? 'vi-VN' : 'en-US')}
              </span>
              <span className="text-xs font-semibold text-slate-500">{t('clinic.creditPackage.scansUnit')}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              {remainingCredits > 50 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('clinic.creditPackage.statusAbundant')}
                </span>
              ) : remainingCredits > 0 ? (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t('clinic.creditPackage.statusLow')}
                </span>
              ) : (
                <span className="text-red-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {t('clinic.creditPackage.statusDepleted')}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Đã phân tích trong chiến dịch */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{t('clinic.creditPackage.scannedInBatch')}</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-data text-slate-900">
                {scannedInBatch.toLocaleString(isVi ? 'vi-VN' : 'en-US')}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {batchJob?.totalImages || scannedInBatch} {isVi ? 'ảnh' : 'scans'}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {t('clinic.creditPackage.totalCampaignScanned')} <strong className="text-slate-700">{totalScannedCampaign} {isVi ? 'ảnh' : 'scans'}</strong>
            </p>
          </div>

          {/* Card 3: Gói cước đang kích hoạt */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{t('clinic.creditPackage.activePackage')}</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <div
                className="font-bold text-slate-900 text-sm truncate"
                title={activeSubscription?.servicePackageName || t('clinic.creditPackage.noActivePackage')}
              >
                {activeSubscription?.servicePackageName || t('clinic.creditPackage.noActivePackage')}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSubscription?.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {activeSubscription?.status === 'ACTIVE' ? t('clinic.creditPackage.statusActive') : t('clinic.creditPackage.statusUnregistered')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Thời hạn hiệu lực */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{t('clinic.creditPackage.validityPeriod')}</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-mono-data text-slate-900">
                {activeSubscription?.expiresAt ? formatDate(activeSubscription.expiresAt) : t('clinic.creditPackage.indefinite')}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {activeSubscription?.expiresAt ? t('clinic.creditPackage.autoRenewNotice') : t('clinic.creditPackage.currentPlanNotice')}
            </p>
          </div>
        </div>

        {/* Thanh tiến trình sử dụng hạn mức (Progress Bar) */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#3478F6]" />
              <span>{t('clinic.creditPackage.consumptionProgress')}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 font-mono-data text-[11px]">
              <span>
                {t('clinic.creditPackage.processedCount')} <strong className="text-slate-900">{scannedInBatch} {isVi ? 'ảnh' : 'scans'}</strong> ({usedPercent}%)
              </span>
              <span>
                {t('clinic.creditPackage.availableCount')} <strong className="text-[#3478F6]">{remainingCredits} {t('clinic.creditPackage.scansUnit')}</strong> ({remainingPercent}%)
              </span>
            </div>
          </div>

          {/* Thanh trực quan 2 màu */}
          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex p-0.5 shadow-inner">
            <div
              className="h-full bg-slate-400 rounded-l-full transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
              title={`${t('clinic.creditPackage.processedCount')} ${scannedInBatch} (${usedPercent}%)`}
            />
            <div
              className="h-full bg-gradient-to-r from-[#3478F6] to-[#2563EB] rounded-r-full transition-all duration-500"
              style={{ width: `${remainingPercent}%` }}
              title={`${t('clinic.creditPackage.availableCount')} ${remainingCredits} (${remainingPercent}%)`}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> {t('clinic.creditPackage.processedInBatchLegend')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3478F6] inline-block" /> {t('clinic.creditPackage.availableCreditsLegend')}
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* PHẦN 2: DANH SÁCH GÓI DỊCH VỤ CẤP PHÒNG KHÁM (FR-28) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#3478F6]" />
              {t('clinic.creditPackage.packagesSectionTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('clinic.creditPackage.packagesSectionSubtitle')}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {t('clinic.creditPackage.vatSupportBadge')}
          </span>
        </div>

        {/* 3 Card so sánh gói dịch vụ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isCurrentActive = activeSubscription?.servicePackageId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between relative bg-white overflow-hidden ${
                  pkg.isPopular
                    ? 'border-[#3478F6] shadow-md ring-2 ring-[#3478F6]/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Ribbon nổi bật */}
                {pkg.isPopular && (
                  <div className="bg-[#3478F6] text-white text-[11px] font-extrabold uppercase py-1 text-center tracking-wider flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> {t('clinic.creditPackage.recommendedRibbon')}
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                      {isCurrentActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {t('clinic.creditPackage.currentPlanBadge')}
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  {/* Giá tiền */}
                  <div className="pt-2 pb-1 border-y border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold font-mono-data text-[#3478F6]">
                        {pkg.priceVnd.toLocaleString(isVi ? 'vi-VN' : 'en-US')}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{t('clinic.creditPackage.currencyVnd')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-emerald-700">
                        +{pkg.scansCount.toLocaleString(isVi ? 'vi-VN' : 'en-US')} {t('clinic.creditPackage.plusScans')}
                      </span>
                      <span>{t('clinic.creditPackage.validityDays')} {pkg.validityDays} {isVi ? 'ngày' : 'days'}</span>
                    </div>
                  </div>

                  {/* Danh sách tính năng */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t('clinic.creditPackage.featuresIncluded')}
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#3478F6] mt-0.5 shrink-0" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Nút hành động Mua / Gia hạn */}
                <div className="p-6 pt-0 mt-auto">
                  <Button
                    variant={pkg.isPopular ? 'primary' : 'outline'}
                    size="md"
                    className="w-full justify-center"
                    icon={<Zap className="w-4 h-4" />}
                    onClick={() => handleOpenPurchase(pkg)}
                  >
                    {isCurrentActive ? t('clinic.creditPackage.renewThisPackage') : t('clinic.creditPackage.buyPackageNow')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHẦN 3: LỊCH SỬ GIAO DỊCH & HÓA ĐƠN PHÒNG KHÁM (FR-28) */}
      {/* ========================================================================= */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#3478F6]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('clinic.creditPackage.historySectionTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('clinic.creditPackage.historySectionSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchAllData(true)}
            className="text-xs font-semibold text-[#3478F6] hover:text-[#2563EB] flex items-center gap-1.5 self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('clinic.creditPackage.reloadHistory')}</span>
          </button>
        </div>

        {/* Bảng danh sách giao dịch */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">{t('clinic.creditPackage.colTxnId')}</th>
                  <th className="p-3.5">{t('clinic.creditPackage.colPackage')}</th>
                  <th className="p-3.5">{t('clinic.creditPackage.colAmount')}</th>
                  <th className="p-3.5">{t('clinic.creditPackage.colScans')}</th>
                  <th className="p-3.5">{t('clinic.creditPackage.colPaidDate')}</th>
                  <th className="p-3.5">{t('clinic.creditPackage.colMethod')}</th>
                  <th className="p-3.5">{t('clinic.creditPackage.colStatus')}</th>
                  <th className="p-3.5 text-right">{t('clinic.creditPackage.colReceipt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">{t('clinic.creditPackage.emptyHistory')}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {t('clinic.creditPackage.emptyHistorySub')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isSuccess = p.status === 'SUCCEEDED' || p.status === 'SUCCESS';
                    const isPending = p.status === 'PENDING';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        {/* Mã giao dịch */}
                        <td className="p-3.5 font-mono font-bold text-[#3478F6]">
                          {p.providerReference || `TXN-CLN-${p.id.toString().padStart(5, '0')}`}
                        </td>

                        {/* Tên gói */}
                        <td className="p-3.5 font-bold text-slate-900">
                          {p.servicePackageName || t('clinic.creditPackage.pkgStarterName')}
                        </td>

                        {/* Số tiền */}
                        <td className="p-3.5 font-mono font-extrabold text-slate-900">
                          {Number(p.amount || 0).toLocaleString(isVi ? 'vi-VN' : 'en-US')} {t('clinic.creditPackage.currencyVnd')}
                        </td>

                        {/* Số lượt */}
                        <td className="p-3.5 font-mono font-bold text-emerald-700">
                          {p.servicePackageName?.includes('5000') || p.amount >= 35000000
                            ? '+5.000'
                            : p.servicePackageName?.includes('2000') || p.amount >= 15000000
                              ? '+2.000'
                              : '+500'}{' '}
                          {t('clinic.creditPackage.scansUnit')}
                        </td>

                        {/* Ngày thanh toán */}
                        <td className="p-3.5 font-mono text-slate-500">
                          {formatDateTime(p.paidAt || p.createdAt)}
                        </td>

                        {/* Cổng thanh toán */}
                        <td className="p-3.5">
                          <span
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200"
                          >
                            {p.provider === 'VIETQR' || p.provider === 'BANK_TRANSFER' || p.provider === 'VNPAY' || !p.provider
                              ? t('clinic.creditPackage.providerVietqr')
                              : p.provider}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isPending
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {isSuccess ? t('clinic.creditPackage.statusSuccess') : isPending ? t('clinic.creditPackage.statusPending') : t('clinic.creditPackage.statusFailed')}
                          </span>
                        </td>

                        {/* Nút xem hóa đơn */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3478F6] hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t('clinic.creditPackage.viewReceipt')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Modal Mua / Gia Hạn Gói Cước */}
      <CreditPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        userRole="clinic"
        currentCredits={remainingCredits}
        customPackages={packages}
        initialPackageId={initialPackageId}
        onPurchaseSuccess={handlePurchaseSuccess}
        onSuccess={handlePurchaseSuccess}
      />

      {/* Modal Xem Biên Lai / Hóa Đơn Điện Tử */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3478F6]" />
                <h4 className="text-base font-bold text-slate-900">{t('clinic.creditPackage.receiptTitle')}</h4>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[11px] text-slate-400 font-semibold">{t('clinic.creditPackage.providerLabel')}</div>
                <div className="font-bold text-slate-900">{t('clinic.creditPackage.providerSystemName')}</div>
                <div className="text-slate-500 text-[11px]">{t('clinic.creditPackage.providerSystemDesc')}</div>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clinic.creditPackage.invoiceIdLabel')}</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedReceipt.providerReference || `TXN-CLN-${selectedReceipt.id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clinic.creditPackage.servicePackageLabel')}</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.servicePackageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clinic.creditPackage.recordedTimeLabel')}</span>
                  <span className="font-mono text-slate-700">
                    {formatDateTime(selectedReceipt.paidAt || selectedReceipt.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clinic.creditPackage.paymentGatewayLabel')}</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.provider || 'VietQR Napas 24/7'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('clinic.creditPackage.settlementStatusLabel')}</span>
                  <span className="font-bold text-emerald-700">{t('clinic.creditPackage.settledValid')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex justify-between items-baseline">
                <span className="font-bold text-emerald-900 text-sm">{t('clinic.creditPackage.totalPaidLabel')}</span>
                <span className="text-xl font-extrabold font-mono-data text-emerald-800">
                  {Number(selectedReceipt.amount).toLocaleString(isVi ? 'vi-VN' : 'en-US')} {t('clinic.creditPackage.currencyVnd')}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 italic pt-1 text-center">
                {t('clinic.creditPackage.receiptDisclaimer')}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
                {t('clinic.creditPackage.closeReceipt')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<FileText className="w-3.5 h-3.5" />}
                onClick={() => {
                  window.print();
                }}
              >
                {t('clinic.creditPackage.printReceipt')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tuyên bố an toàn y tế và điều khoản sử dụng */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('clinic.creditPackage.complianceTitle')}</span>
        </div>
        <p className="leading-relaxed">
          {t('clinic.creditPackage.complianceText')}
        </p>
      </div>
    </div>
  );
};
