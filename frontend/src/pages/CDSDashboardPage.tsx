import React, { useState } from 'react';
import { PatientProfile, FundusAnalysisRequest, AIRiskResult, DoctorFeedback } from '../types/cds';
import { MOCK_PATIENTS, MOCK_SAMPLE_RESULT, MockAIService } from '../services/mockAiEngine';
import { PatientUploader } from '../components/PatientUploader';
import { InteractiveCDSViewer } from '../components/InteractiveCDSViewer';
import { RiskAssessmentPanel } from '../components/RiskAssessmentPanel';
import { ClinicalValidationBar } from '../components/ClinicalValidationBar';
import { MedicalReportModal } from '../components/MedicalReportModal';
import { ConsultationChatModal } from '../components/ConsultationChatModal';
import { UserCheck, MessageSquare, Download, CheckCircle2 } from 'lucide-react';

import { screeningApi, feedbackApi } from '../services/api';

export const CDSDashboardPage: React.FC = () => {
  const [activePatient, setActivePatient] = useState<PatientProfile>(MOCK_PATIENTS[0]);
  const [analysisResult, setAnalysisResult] = useState<AIRiskResult>(MOCK_SAMPLE_RESULT);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);

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

  const handleSaveFeedback = async (feedback: DoctorFeedback) => {
    console.log('Saved Doctor Feedback:', feedback);
    try {
      // Save doctor feedback and review into PostgreSQL DB
      await feedbackApi.submit({
        screeningId: feedback.analysisId || '84099cb3-562f-49ca-b0a4-fc4093e505cf',
        clinicalDecision: feedback.decision || 'APPROVED',
        doctorNotes: feedback.clinicalNotes || 'Bác sĩ đã xác nhận kết quả chẩn đoán',
        correctRiskLevel: feedback.adjustedCardioRisk || 'HIGH',
        eligibleForRetraining: true,
      });
      setFeedbackSuccessToast(true);
      setTimeout(() => setFeedbackSuccessToast(false), 5000);
    } catch (err) {
      console.warn('Feedback submission error:', err);
    }
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

        {/* Action Controls & Patient Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsChatModalOpen(true)}
            className="px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-cyan-200"
          >
            <MessageSquare className="w-4 h-4 text-cyan-700" />
            Tư Vấn Bệnh Nhân
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-emerald-200"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            Xuất Phiếu Khám PDF
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold hidden xl:block">Đổi BN:</span>
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

      {/* Modals */}
      <MedicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={activePatient}
        result={analysisResult}
      />

      <ConsultationChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUserRole="doctor"
        patientName={activePatient.fullName}
        patientMrn={activePatient.mrn}
      />
    </div>
  );
};
