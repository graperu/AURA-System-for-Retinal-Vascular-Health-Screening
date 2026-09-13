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
  servicePackageName: string;
  amount: number;
  status: 'SUCCEEDED' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED' | string;
  provider: string;
  failureReason?: string | null;
  createdAt: string;
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
        name: 'Gói Cơ Sở Sàng Lọc (Clinic Starter)',
        description: 'Dành cho phòng khám đa khoa, chuyên khoa mắt triển khai tầm soát quy mô ban đầu.',
        scansCount: 500,
        priceVnd: 5000000,
        validityDays: 90,
        features: [
          '500 lượt phân tích ảnh vi mạch võng mạc AI',
          'Đánh giá 4 cấp độ nguy cơ (Low, Moderate, High, Critical)',
          'Bản đồ nhiệt Grad-CAM & tính toán tỷ lệ vi mạch A/V',
          'Báo cáo chẩn đoán tóm tắt PDF chuẩn Bộ Y Tế',
          'Hỗ trợ tối đa 2 tài khoản bác sĩ tiếp nhận phân tích',
          'Hỗ trợ kỹ thuật qua email trong giờ hành chính',
        ],
      },
      {
        id: 102,
        name: 'Gói Chiến Dịch Lâm Sàng (Clinic Campaign)',
        description: 'Lựa chọn tối ưu cho các chiến dịch khám cộng đồng, khám sức khỏe doanh nghiệp lớn.',
        scansCount: 2000,
        priceVnd: 18000000,
        validityDays: 180,
        isPopular: true,
        features: [
          '2.000 lượt phân tích ảnh võng mạc tốc độ cao',
          'Tự động xử lý đợt hàng loạt (Bulk Batch Upload) tệp ZIP & DICOM',
          'Báo cáo dịch tễ học & thống kê phân tầng nguy cơ toàn chiến dịch',
          'Phân công bệnh nhân tự động cho đội ngũ bác sĩ chuyên khoa',
          'Xuất dữ liệu báo cáo chuyên sâu định dạng CSV/Excel',
          'Không giới hạn số lượng tài khoản bác sĩ trực thuộc',
          'Tiết kiệm 10% chi phí so với gói cơ sở',
        ],
      },
      {
        id: 103,
        name: 'Gói Quy Mô Lớn / Bệnh Viện (Hospital Enterprise)',
        description: 'Giải pháp toàn diện cho bệnh viện mắt, trung tâm chẩn đoán hình ảnh và hệ thống chuỗi.',
        scansCount: 5000,
        priceVnd: 40000000,
        validityDays: 365,
        features: [
          '5.000 lượt phân tích ảnh võng mạc với băng thông ưu tiên cao nhất',
          'Cổng tích hợp API chuyên biệt với hệ thống PACS / HIS / EMR',
          'Báo cáo dịch tễ học và giám sát xu hướng thời gian thực',
          'Ký số kết luận y khoa với chứng thư số bảo mật cao',
          'Hỗ trợ kỹ thuật chuyên biệt 24/7 & chuyên viên lâm sàng đào tạo',
          'Tùy biến mẫu báo cáo thương hiệu riêng của cơ sở y tế',
          'Tiết kiệm 20% chi phí phân tích vi mạch',
        ],
      },
    ],
    []
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
      text: `Gia hạn thành công! Tài khoản phòng khám đã được cộng thêm +${added.toLocaleString('vi-VN')} lượt khám sàng lọc.`,
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
      return d.toLocaleDateString('vi-VN', {
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
      return d.toLocaleString('vi-VN', {
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
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#0891B2] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu hạn mức và gói cước phòng khám...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
                ? 'Cơ sở đã hết lượt khám sàng lọc khả dụng'
                : `Hạn mức khám sắp cạn kiệt (Chỉ còn ${remainingCredits} lượt)`}
            </h4>
            <p className="text-amber-800 mt-1 leading-relaxed">
              Chiến dịch sàng lọc hàng loạt có thể bị tạm dừng nếu số lượng ảnh tải lên vượt quá số dư lượt khám còn lại.
              Vui lòng gia hạn hoặc mua thêm gói dịch vụ để đảm bảo hoạt động liên tục.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenPurchase()}
            className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0"
          >
            Nạp Thêm Lượt Ngay
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
                Thống Kê Hạn Mức & Dung Lượng Khám Cơ Sở (FR-27)
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi số dư lượt phân tích AI, đợt quét hiện tại và trạng thái hợp đồng dịch vụ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              icon={<Zap className="w-4 h-4" />}
              onClick={() => handleOpenPurchase()}
            >
              Gia Hạn / Mua Gói
            </Button>
          </div>
        </div>

        {/* 4 Thẻ chỉ số tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Số lượt khám khả dụng */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Lượt Khám Khả Dụng</span>
              <CreditCard className="w-4 h-4 text-[#0891B2]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-data text-[#0891B2]">
                {remainingCredits.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-semibold text-slate-500">lượt</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]">
              {remainingCredits > 50 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Hạn mức dồi dào
                </span>
              ) : remainingCredits > 0 ? (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cần sớm nạp thêm
                </span>
              ) : (
                <span className="text-red-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Đã hết hạn mức
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Đã phân tích trong chiến dịch */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Đã Quét Trong Đợt</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono-data text-slate-900">
                {scannedInBatch.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {batchJob?.totalImages || scannedInBatch} ảnh
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Tổng toàn chiến dịch: <strong className="text-slate-700">{totalScannedCampaign} ảnh</strong>
            </p>
          </div>

          {/* Card 3: Gói cước đang kích hoạt */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Gói Đang Hoạt Động</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <div
                className="font-bold text-slate-900 text-sm truncate"
                title={activeSubscription?.servicePackageName || 'Chưa có gói kích hoạt'}
              >
                {activeSubscription?.servicePackageName || 'Chưa kích hoạt gói'}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSubscription?.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {activeSubscription?.status === 'ACTIVE' ? 'ĐANG KÍCH HOẠT' : 'CHƯA ĐĂNG KÝ'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Thời hạn hiệu lực */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Thời Hạn Hiệu Lực</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-mono-data text-slate-900">
                {activeSubscription?.expiresAt ? formatDate(activeSubscription.expiresAt) : 'Vô thời hạn'}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {activeSubscription?.expiresAt ? 'Tự động gia hạn khi mua gói' : 'Áp dụng cho gói đang dùng'}
            </p>
          </div>
        </div>

        {/* Thanh tiến trình sử dụng hạn mức (Progress Bar) */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0891B2]" />
              <span>Tiến Độ Tiêu Hao Hạn Mức Sàng Lọc</span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 font-mono-data text-[11px]">
              <span>
                Đã xử lý: <strong className="text-slate-900">{scannedInBatch} ảnh</strong> ({usedPercent}%)
              </span>
              <span>
                Khả dụng: <strong className="text-[#0891B2]">{remainingCredits} lượt</strong> ({remainingPercent}%)
              </span>
            </div>
          </div>

          {/* Thanh trực quan 2 màu */}
          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex p-0.5 shadow-inner">
            <div
              className="h-full bg-slate-400 rounded-l-full transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
              title={`Đã xử lý: ${scannedInBatch} ảnh (${usedPercent}%)`}
            />
            <div
              className="h-full bg-gradient-to-r from-[#0891B2] to-[#06B6D4] rounded-r-full transition-all duration-500"
              style={{ width: `${remainingPercent}%` }}
              title={`Còn khả dụng: ${remainingCredits} lượt (${remainingPercent}%)`}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Đã phân tích trong đợt
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2] inline-block" /> Lượt khám khả dụng sẵn sàng
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
              <Building2 className="w-5 h-5 text-[#0891B2]" />
              Danh Sách Gói Dịch Vụ Cấp Phòng Khám (FR-28)
            </h2>
            <p className="text-xs text-slate-500">
              Hạn mức thiết kế chuyên biệt cho đợt tầm soát vi mạch diện rộng và bệnh viện (500 – 5.000 lượt phân tích AI).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            Hỗ trợ hóa đơn VAT & chứng thư y tế
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
                    ? 'border-[#0891B2] shadow-md ring-2 ring-[#0891B2]/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Ribbon nổi bật */}
                {pkg.isPopular && (
                  <div className="bg-[#0891B2] text-white text-[11px] font-extrabold uppercase py-1 text-center tracking-wider flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Gói Khuyên Dùng Cho Chiến Dịch
                  </div>
                )}

                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                      {isCurrentActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Đang Dùng
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
                      <span className="text-3xl font-extrabold font-mono-data text-[#0891B2]">
                        {pkg.priceVnd.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs font-bold text-slate-500">VNĐ</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-emerald-700">
                        +{pkg.scansCount.toLocaleString('vi-VN')} lượt phân tích
                      </span>
                      <span>Thời hạn: {pkg.validityDays} ngày</span>
                    </div>
                  </div>

                  {/* Danh sách tính năng */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Tính năng bao gồm:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#0891B2] mt-0.5 shrink-0" />
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
                    {isCurrentActive ? 'Gia Hạn Gói Này' : 'Mua Gói Ngay'}
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
            <History className="w-5 h-5 text-[#0891B2]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch Sử Giao Dịch & Hóa Đơn Phòng Khám (FR-28)
              </h3>
              <p className="text-xs text-slate-500">
                Toàn bộ nhật ký nạp hạn mức, thanh toán hợp đồng dịch vụ và biên lai điện tử.
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchAllData(true)}
            className="text-xs font-semibold text-[#0891B2] hover:text-cyan-800 flex items-center gap-1.5 self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Tải lại lịch sử</span>
          </button>
        </div>

        {/* Bảng danh sách giao dịch */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">Mã Giao Dịch</th>
                  <th className="p-3.5">Gói Dịch Vụ</th>
                  <th className="p-3.5">Số Tiền (VNĐ)</th>
                  <th className="p-3.5">Số Lượt</th>
                  <th className="p-3.5">Ngày Thanh Toán</th>
                  <th className="p-3.5">Phương Thức</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Biên Lai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">Chưa có lịch sử giao dịch nào.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Khi cơ sở thanh toán gia hạn hoặc mua gói hạn mức, thông tin hóa đơn sẽ hiển thị tại đây.
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
                        <td className="p-3.5 font-mono font-bold text-[#0891B2]">
                          {p.providerReference || `TXN-CLN-${p.id.toString().padStart(5, '0')}`}
                        </td>

                        {/* Tên gói */}
                        <td className="p-3.5 font-bold text-slate-900">
                          {p.servicePackageName || 'Gói Sàng Lọc Phòng Khám'}
                        </td>

                        {/* Số tiền */}
                        <td className="p-3.5 font-mono font-extrabold text-slate-900">
                          {Number(p.amount || 0).toLocaleString('vi-VN')} đ
                        </td>

                        {/* Số lượt */}
                        <td className="p-3.5 font-mono font-bold text-emerald-700">
                          {p.servicePackageName?.includes('5000') || p.amount >= 35000000
                            ? '+5.000'
                            : p.servicePackageName?.includes('2000') || p.amount >= 15000000
                              ? '+2.000'
                              : '+500'}{' '}
                          lượt
                        </td>

                        {/* Ngày thanh toán */}
                        <td className="p-3.5 font-mono text-slate-500">
                          {formatDateTime(p.paidAt || p.createdAt)}
                        </td>

                        {/* Cổng thanh toán */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              p.provider === 'MOMO'
                                ? 'bg-pink-50 text-[#A50064] border border-pink-200'
                                : p.provider === 'BANK_TRANSFER'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-50 text-[#005BAA] border border-blue-200'
                            }`}
                          >
                            {p.provider === 'MOMO'
                              ? 'Ví MoMo'
                              : p.provider === 'BANK_TRANSFER'
                                ? 'Chuyển Khoản'
                                : 'VNPay QR'}
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
                            {isSuccess ? 'THÀNH CÔNG' : isPending ? 'ĐANG XỬ LÝ' : 'THẤT BẠI'}
                          </span>
                        </td>

                        {/* Nút xem hóa đơn */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0891B2] hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Xem biên lai</span>
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
                <FileText className="w-5 h-5 text-[#0891B2]" />
                <h4 className="text-base font-bold text-slate-900">Biên Lai Điện Tử Phòng Khám</h4>
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
                <div className="text-[11px] text-slate-400 font-semibold">Đơn vị cung cấp dịch vụ:</div>
                <div className="font-bold text-slate-900">HỆ THỐNG Y TẾ AURA CDS & AI SCREENING</div>
                <div className="text-slate-500 text-[11px]">Nền tảng sàng lọc vi mạch võng mạc & nguy cơ tim mạch</div>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã hóa đơn:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedReceipt.providerReference || `TXN-CLN-${selectedReceipt.id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gói dịch vụ:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.servicePackageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian ghi nhận:</span>
                  <span className="font-mono text-slate-700">
                    {formatDateTime(selectedReceipt.paidAt || selectedReceipt.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cổng thanh toán:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.provider || 'VNPay QR'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-bold text-emerald-700">Đã quyết toán hợp lệ</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex justify-between items-baseline">
                <span className="font-bold text-emerald-900 text-sm">Tổng tiền thanh toán:</span>
                <span className="text-xl font-extrabold font-mono-data text-emerald-800">
                  {Number(selectedReceipt.amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="text-[10px] text-slate-400 italic pt-1 text-center">
                Chứng từ điện tử tuân thủ quy chuẩn y tế và có giá trị thanh quyết toán kinh phí chiến dịch sàng lọc.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<FileText className="w-3.5 h-3.5" />}
                onClick={() => {
                  window.print();
                }}
              >
                In Biên Lai
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tuyên bố an toàn y tế và điều khoản sử dụng */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Quy Định Sử Dụng Hạn Mức Sàng Lọc Phòng Khám (AURA CDS Compliance)</span>
        </div>
        <p className="leading-relaxed">
          Số lượt khám được cấp chỉ phục vụ cho hoạt động sàng lọc ban đầu và hỗ trợ quyết định lâm sàng tại cơ sở y tế đã
          được cấp phép. Kết quả phân tích AI không thay thế chẩn đoán xác định của bác sĩ chuyên khoa mắt hoặc tim mạch.
          Hạn mức chưa sử dụng sẽ được cộng dồn tự động khi cơ sở thực hiện gia hạn trước thời điểm hết hạn của gói hiện tại.
        </p>
      </div>
    </div>
  );
};
