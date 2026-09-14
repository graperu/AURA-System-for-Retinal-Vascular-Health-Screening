import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface AnalysisProgressInfo {
  status: string;
  percent: number;
}

export const getAnalysisStatusMessage = (p: number): string => {
  if (p < 25) {
    return 'Khởi tạo mã hóa bảo mật & tiền xử lý ảnh võng mạc...';
  } else if (p < 60) {
    return 'AURA AI Core (Multimodal Vision) đang phân tích vi mạch...';
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
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Status là giá trị phái sinh (derived value) thuần túy dựa trên percent và isAnalyzing
  const status = useMemo(() => {
    if (!isAnalyzing && percent === 0) {
      return '';
    }
    return getAnalysisStatusMessage(percent);
  }, [isAnalyzing, percent]);

  const startProgress = useCallback(() => {
    clearTimers();
    setIsAnalyzing(true);
    setError(null);
    setPercent(0);

    intervalRef.current = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 92) {
          return 92;
        }

        let increment = 1;
        if (prev < 25) {
          increment = Math.floor(Math.random() * 3) + 2; // +2 to +4%
        } else if (prev < 60) {
          increment = Math.floor(Math.random() * 3) + 1; // +1 to +3%
        } else if (prev < 85) {
          increment = Math.floor(Math.random() * 2) + 1; // +1 to +2%
        } else {
          increment = 1; // +1% up to 92%
        }

        return Math.min(92, prev + increment);
      });
    }, 280);
  }, [clearTimers]);

  const completeProgress = useCallback(
    (onDone?: () => void) => {
      clearTimers();
      setPercent(100);

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
    },
    [clearTimers]
  );

  const resetProgress = useCallback(() => {
    clearTimers();
    setIsAnalyzing(false);
    setPercent(0);
    setError(null);
  }, [clearTimers]);

  // Dọn dẹp bộ nhớ chống rò rỉ timer khi component unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

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
    error,
    analysisProgress,
    startProgress,
    completeProgress,
    failProgress,
    resetProgress,
  };
}
