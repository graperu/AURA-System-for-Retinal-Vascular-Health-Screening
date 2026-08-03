import React, { useState } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { MOCK_PATIENTS, MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { UserCheck, Stethoscope, Activity, RefreshCcw } from 'lucide-react';

export const CDSDashboardPage: React.FC = () => {
  const [activePatient, setActivePatient] = useState<PatientProfile>(MOCK_PATIENTS[0]);
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });

  const handleStartAnalysis = async (request: FundusAnalysisRequest) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ status: 'Khởi tạo kết nối AI Microservice...', percent: 5 });

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

  const handleSaveFeedback = (feedback: DoctorFeedback) => {
    console.log('Saved Doctor Feedback:', feedback);
  };

  return (
    <div className="space-y-6">
      {/* Patient Selection Bar & Clinical Header */}
      <div className="bg-white border border-[#CCFBF1] rounded-2xl p-5 shadow-medical-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] text-[#0891B2] border border-[#CCFBF1] flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#134E4A]">{activePatient.fullName}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-[#0891B2] font-semibold font-mono-data">
                {activePatient.mrn}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({activePatient.age} tuổi • {activePatient.gender})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Huyết áp: <strong className="text-slate-800 font-mono-data">{activePatient.systolicBp}/{activePatient.diastolicBp} mmHg</strong> | HbA1c: <strong className="text-slate-800 font-mono-data">{activePatient.hba1c}%</strong> | Tiền sử: {activePatient.hasDiabetes ? 'Đái tháo đường T2' : 'Bình thường'}
            </p>
          </div>
        </div>

        {/* Patient Switcher Select */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold hidden lg:block">Đổi Bệnh Nhân:</span>
          <select
            value={activePatient.id}
            onChange={(e) => {
              const p = MOCK_PATIENTS.find((item) => item.id === e.target.value);
              if (p) setActivePatient(p);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0891B2]"
          >
            {MOCK_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.mrn}) — {p.age}t
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left Uploader & Controls / Right CDS Viewer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Image Uploader Workspace (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <PatientUploader
            activePatient={activePatient}
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />
        </div>

        {/* Right Column: Interactive Side-by-Side CDS Viewer & XAI Panel (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          <InteractiveCDSViewer analysisResult={analysisResult} selectedEye="OD (Mắt Phải)" />
        </div>
      </div>

      {/* Full-Width Risk Assessment & Biomarkers Panel */}
      <RiskAssessmentPanel result={analysisResult} />

      {/* Doctor Audit Validation Bar & Sign-Off */}
      <ClinicalValidationBar
        analysisId={analysisResult.analysisId}
        onSaveFeedback={handleSaveFeedback}
      />
    </div>
  );
};
