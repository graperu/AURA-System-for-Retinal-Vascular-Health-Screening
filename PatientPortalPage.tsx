import React, { useState } from 'react';
import { UserSession } from '../types/auth';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { MOCK_PATIENTS, MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
import { AIRiskResult, FundusAnalysisRequest } from '../types/cds';
import { Eye, Heart, Activity, Download, ShieldCheck, Calendar, CheckCircle2, UserCheck, AlertCircle, FileText, Sliders, Layers, Sparkles } from 'lucide-react';

interface PatientPortalPageProps {
  user: UserSession;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ user }) => {
  const patient = MOCK_PATIENTS[0]; // Patient Trần Văn Hoàng
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visual-scan' | 'metrics'>('visual-scan');
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ status: 'Mã hóa HIPAA & Gửi ảnh sang AI Processing...', percent: 10 });

    try {
      const result = await MockAIService.runFundusAnalysis(request, (status, percent) => {
        setAnalysisProgress({ status, percent });
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    alert('Tải báo cáo kết quả sàng lọc vi mạch võng mạc cá nhân (PDF) thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Patient Profile Header with Medical Banner Accent */}
      <div id="my-scans" className="scroll-mt-24 bg-gradient-to-r from-slate-900 via-[#134E4A] to-slate-900 text-white rounded-2xl p-6 shadow-medical-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Background Visual Eye Glow Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[#0891B2]/20 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md text-[#22D3EE] border border-white/20 flex items-center justify-center font-bold text-xl shadow-inner">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{user.name}</h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0891B2] text-white font-semibold font-mono-data border border-cyan-400">
                {user.mrn}
              </span>
            </div>
            <p className="text-xs text-cyan-100/80 mt-1 flex flex-wrap items-center gap-4">
              <span>Bác sĩ phụ trách: <strong className="text-white">BS. CKII Nguyễn Thị Thanh</strong></span>
              <span>Lần khám gần nhất: <strong className="text-white">{patient.lastExamDate}</strong></span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Khám Định Kỳ Võng Mạc
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadReport}
          className="z-10 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 border border-emerald-400/30 active:scale-95"
        >
          <Download className="w-4 h-4" /> Tải báo cáo PDF
        </button>
      </div>

      {/* Main Grid: Upload New Scan vs AI Results Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload Box */}
        <div id="upload-scan" className="scroll-mt-24 lg:col-span-5 space-y-6">
          <PatientUploader
            activePatient={patient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
        </div>

        {/* Right Column: Personal AI Risk Metrics */}
        <div id="health-advice" className="scroll-mt-24 lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#134E4A] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#0891B2]" />
                  Kết Quả Sàng Lọc Mạch Máu Võng Mạc Cá Nhân
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật tự động dựa trên phân tích hình ảnh võng mạc mới nhất của bạn.
                </p>
              </div>
              <div className="text-right font-mono-data bg-red-50 p-2.5 rounded-xl border border-red-200">
                <span className="text-[11px] text-red-600 block font-semibold uppercase">Chỉ số rủi ro tổng hợp:</span>
                <span className="text-2xl font-extrabold text-[#DC2626]">{analysisResult.overallVascularRiskScore}/100</span>
              </div>
            </div>

            {/* Risk Gauges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-200/30 rounded-full blur-xl pointer-events-none" />
                <span className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-[#DC2626]" /> Nguy Cơ Tim Mạch</span>
                  <span className="text-[10px] text-red-700 font-semibold px-2 py-0.5 rounded-full bg-red-100 border border-red-300">High Risk</span>
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono-data text-[#DC2626]">
                    {analysisResult.cardiovascularRisk.score}%
                  </span>
                  <span className="text-xs text-slate-600">Xác suất 3 năm</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Dấu hiệu co hẹp động mạch nhỏ võng mạc (A/V ratio: 0.52) liên quan tới tăng huyết áp.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-200/30 rounded-full blur-xl pointer-events-none" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-[#0891B2]" /> Bệnh Võng Mạc Đái Tháo Đường</span>
                  <span className="text-[10px] text-amber-800 font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300">Moderate</span>
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono-data text-amber-700">
                    {analysisResult.diabeticRetinopathyRisk.score}%
                  </span>
                  <span className="text-xs text-slate-600">ETDRS Grade 43</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Xuất hiện vi phình mạch đốm nông khu vực cực sau bán kính 1.2mm từ hoàng điểm.
                </p>
              </div>
            </div>

            {/* Personal Doctor Advice Box */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
                <CheckCircle2 className="w-4 h-4" />
                Lời Khuyên Tối Ưu Lối Sống Từ Bác Sĩ Chuyên Khoa:
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "Cần kiểm soát chỉ số huyết áp tâm thu dưới 130 mmHg và duy trì HbA1c dưới 7.0%. Khuyến cáo tái khám chuyên khoa Mắt và soi đáy mắt định kỳ 6 tháng/lần."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Visual Interactive Retinal Scan Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#CCFBF1] shadow-medical-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0891B2]/10 text-[#0891B2]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#134E4A] flex items-center gap-2">
                Trực Quan Ảnh Võng Mạc & Lớp Phủ AI Heatmap (Visual Retinal Diagnostic Viewer)
              </h3>
              <p className="text-xs text-slate-500">
                Quan sát trực tiếp hình ảnh soi đáy mắt thực tế và bản đồ nhiệt vi mạch do AI trích xuất.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('visual-scan')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'visual-scan'
                  ? 'bg-white text-[#0891B2] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Ảnh Võng Mạc & Heatmap
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-white text-[#0891B2] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Chỉ Số Vi Mạch Hóa
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'visual-scan' ? (
          <InteractiveCDSViewer analysisResult={analysisResult} selectedEye="OD (Mắt Phải)" />
        ) : (
          <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-md grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Tỷ lệ Động/Tĩnh Mạch (A/V Ratio)</span>
              <span className="text-2xl font-bold font-mono-data text-[#DC2626]">0.52</span>
              <span className="text-[10px] text-red-600 block mt-1">Chuẩn ≥ 0.67 (Co hẹp động mạch)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Mật độ Mạch Máu Võng Mạc</span>
              <span className="text-2xl font-bold font-mono-data text-[#0891B2]">14.8%</span>
              <span className="text-[10px] text-slate-500 block mt-1">Giảm nhẹ vi tuần hoàn</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Chỉ số Uốn Lượn (Tortuosity)</span>
              <span className="text-2xl font-bold font-mono-data text-amber-700">1.42</span>
              <span className="text-[10px] text-amber-600 block mt-1">Áp lực dòng chảy tăng</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Tỷ lệ Cup/Disc (CDR)</span>
              <span className="text-2xl font-bold font-mono-data text-[#16A34A]">0.38</span>
              <span className="text-[10px] text-emerald-600 block mt-1">Trong ngưỡng an toàn</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
