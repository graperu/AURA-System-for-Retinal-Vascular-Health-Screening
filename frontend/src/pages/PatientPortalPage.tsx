import React, { useState } from 'react';
import { UserSession } from '../types/auth';
import { PatientUploader } from '../components/PatientUploader';
import { MOCK_PATIENTS, MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
import { AIRiskResult, FundusAnalysisRequest } from '../types/cds';
import { Eye, Heart, Activity, Download, ShieldCheck, Calendar, CheckCircle2, UserCheck, AlertCircle, FileText } from 'lucide-react';

interface PatientPortalPageProps {
  user: UserSession;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ user }) => {
  const patient = MOCK_PATIENTS[0]; // Patient Trần Văn Hoàng
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
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
      {/* Patient Profile Header */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-6 shadow-medical-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center justify-center font-bold text-xl shadow-xs">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#134E4A]">{user.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono-data">
                {user.mrn}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span>Bác sĩ phụ trách: <strong>BS. CKII Nguyễn Thị Thanh</strong></span>
              <span>Lần khám gần nhất: <strong>{patient.lastExamDate}</strong></span>
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadReport}
          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Tải Báo Cáo Y Tế (PDF)
        </button>
      </div>

      {/* Main Grid: Upload New Scan vs AI Results Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload Box */}
        <div className="lg:col-span-5 space-y-6">
          <PatientUploader
            activePatient={patient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
        </div>

        {/* Right Column: Personal AI Risk Metrics */}
        <div className="lg:col-span-7 space-y-6">
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
              <div className="text-right font-mono-data">
                <span className="text-xs text-slate-400 block">Chỉ số rủi ro:</span>
                <span className="text-2xl font-bold text-[#DC2626]">{analysisResult.overallVascularRiskScore}/100</span>
              </div>
            </div>

            {/* Risk Gauges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-[#F0FDFA] space-y-2">
                <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#DC2626]" /> Nguy Cơ Tim Mạch
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono-data text-[#134E4A]">
                    {analysisResult.cardiovascularRisk.score}%
                  </span>
                  <span className="text-xs text-orange-700 font-semibold px-2 py-0.5 rounded-full bg-orange-100">
                    Mức High
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Dấu hiệu co hẹp động mạch nhỏ võng mạc liên quan tới tăng huyết áp.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-[#F0FDFA] space-y-2">
                <span className="text-xs font-bold text-[#134E4A] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#0891B2]" /> Bệnh Võng Mạc Đái Tháo Đường
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono-data text-[#134E4A]">
                    {analysisResult.diabeticRetinopathyRisk.score}%
                  </span>
                  <span className="text-xs text-amber-800 font-semibold px-2 py-0.5 rounded-full bg-amber-100">
                    Mức Moderate
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Xuất hiện vi phình mạch đốm nông khu vực cực sau.
                </p>
              </div>
            </div>

            {/* Personal Doctor Advice Box */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
                <CheckCircle2 className="w-4 h-4" />
                Lời Khuyên Tối Ưu Lối Sống Từ Bác Sĩ Chuyên Khoa:
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                "Cần kiểm soát chỉ số huyết áp tâm thu dưới 130 mmHg và duy trì HbA1c dưới 7.0%. Khuyến cáo tái khám chuyên khoa Mắt và soi đáy mắt định kỳ 6 tháng/lần."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
