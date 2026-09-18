import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { realtimeBus, RealtimeEvent } from '../services/realtimeService';

export interface AnalysisProgressInfo {
  status: string;
  percent: number;
}

export type AnalysisStep =
  | 'IDLE'
  | 'IMAGE_UPLOADED'
  | 'PREPARING_ANALYSIS'
  | 'GEMINI_INFERENCE'
  | 'GENERATING_RESULT'
  | 'SAVING_RESULT'
  | 'COMPLETED';

export const ANALYSIS_STEP_PERCENTAGES: Record<AnalysisStep, number> = {
  IDLE: 0,
  IMAGE_UPLOADED: 20,
  PREPARING_ANALYSIS: 40,
  GEMINI_INFERENCE: 65,
  GENERATING_RESULT: 85,
  SAVING_RESULT: 92,
  COMPLETED: 100,
};

export const getAnalysisStatusMessage = (p: number): string => {
  if (p < 25) {
    return 'Khởi tạo mã hóa bảo mật & tiền xử lý ảnh võng mạc...';
  } else if (p < 60) {
    return 'Hệ thống AURA AI đang phân tích vi mạch...';
  } else if (p < 85) {
    return 'Nhận diện vi phình mạch, xuất huyết & tính toán Biomarkers...';
  } else if (p < 95) {
    return 'Trích xuất bản đồ Grad-CAM & tổng hợp nguy cơ lâm sàng...';
  } else {
    return 'Hoàn tất phân tích! Đang chuyển sang bảng kết quả lâm sàng...';
  }
};

export function useAnalysisProgress() {
  const [percent, setPercent] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('IDLE');
  const [customStatusMessage, setCustomStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const status = useMemo(() => {
    if (!isAnalyzing && percent === 0) {
      return '';
    }
    if (customStatusMessage) {
      return customStatusMessage;
    }
    return getAnalysisStatusMessage(percent);
  }, [isAnalyzing, percent, customStatusMessage]);

  const setStepProgress = useCallback((step: AnalysisStep, customMessage?: string) => {
    setCurrentStep(step);
    const targetPercent = ANALYSIS_STEP_PERCENTAGES[step];
    setPercent(targetPercent);
    if (customMessage) {
      setCustomStatusMessage(customMessage);
    }
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setIsAnalyzing(true);
    setError(null);
    setCurrentStep('IMAGE_UPLOADED');
    setCustomStatusMessage(null);
    setPercent(ANALYSIS_STEP_PERCENTAGES.IMAGE_UPLOADED);

    // Deterministic fallback pacing without Math.random()
    // Steps: 20 -> 40 -> 65 -> 85 -> 92 (ceiling while waiting for network)
    const sequence: AnalysisStep[] = [
      'PREPARING_ANALYSIS',
      'GEMINI_INFERENCE',
      'GENERATING_RESULT',
      'SAVING_RESULT',
    ];
    let seqIndex = 0;

    timerRef.current = setInterval(() => {
      if (seqIndex < sequence.length) {
        const nextStep = sequence[seqIndex];
        seqIndex++;
        setCurrentStep(nextStep);
        setPercent(ANALYSIS_STEP_PERCENTAGES[nextStep]);
      } else {
        // Hold deterministically at 92%
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 900);
  }, [clearTimers]);

  const completeProgress = useCallback(
    (onDone?: () => void) => {
      clearTimers();
      setCurrentStep('COMPLETED');
      setPercent(100);
      setCustomStatusMessage(null);

      timeoutRef.current = setTimeout(() => {
        setIsAnalyzing(false);
        if (onDone) {
          onDone();
        }
      }, 600);
    },
    [clearTimers]
  );

  const failProgress = useCallback(
    (errMsg?: string) => {
      clearTimers();
      setIsAnalyzing(false);
      setError(errMsg || 'Quá trình phân tích gặp sự cố. Vui lòng thử lại.');
      setCurrentStep('IDLE');
    },
    [clearTimers]
  );

  const resetProgress = useCallback(() => {
    clearTimers();
    setIsAnalyzing(false);
    setPercent(0);
    setError(null);
    setCurrentStep('IDLE');
    setCustomStatusMessage(null);
  }, [clearTimers]);

  // Connect to realtimeBus listening for real step sequence events from STOMP/WebSocket
  useEffect(() => {
    const unsubscribe = realtimeBus.subscribe(
      ['SCREENING_PROCESSING', 'SCREENING_COMPLETED', 'SCREENING_FAILED'],
      (event: RealtimeEvent) => {
        if (!isAnalyzing && event.type === 'SCREENING_PROCESSING') {
          setIsAnalyzing(true);
        }

        if (event.type === 'SCREENING_PROCESSING') {
          clearTimers();
          const stepRaw = (event.data?.step || '').toUpperCase();
          const statusMsg = event.data?.statusMessage || event.data?.stepTitle;

          if (stepRaw === 'IMAGE_UPLOADED') {
            setStepProgress('IMAGE_UPLOADED', statusMsg);
          } else if (stepRaw === 'PREPARING_ANALYSIS') {
            setStepProgress('PREPARING_ANALYSIS', statusMsg);
          } else if (stepRaw === 'GEMINI_INFERENCE') {
            setStepProgress('GEMINI_INFERENCE', statusMsg);
          } else if (stepRaw === 'GENERATING_RESULT') {
            setStepProgress('GENERATING_RESULT', statusMsg);
          } else if (stepRaw === 'SAVING_RESULT') {
            setStepProgress('SAVING_RESULT', statusMsg);
          } else if (typeof event.data?.stepIndex === 'number') {
            const index = event.data.stepIndex;
            const mappedPercent = Math.min(92, Math.max(10, Math.round((index / 5) * 92)));
            setPercent(mappedPercent);
            if (statusMsg) setCustomStatusMessage(statusMsg);
          }
        } else if (event.type === 'SCREENING_COMPLETED') {
          completeProgress();
        } else if (event.type === 'SCREENING_FAILED') {
          failProgress(event.data?.errorMessage || event.data?.message);
        }
      }
    );

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [isAnalyzing, clearTimers, setStepProgress, completeProgress, failProgress]);

  const analysisProgress: AnalysisProgressInfo = useMemo(
    () => ({
      status,
      percent,
    }),
    [status, percent]
  );

  return {
    percent,
    status,
    isAnalyzing,
    currentStep,
    error,
    analysisProgress,
    startProgress,
    completeProgress,
    failProgress,
    resetProgress,
    setStepProgress,
  };
}
