import {
  computeEtdrsGrade,
  mapScreeningToAIRiskResult,
  toFrontendRiskLevel,
} from '../services/screeningMapper';
import { MockAIService } from '../services/mockAiEngine';
import { VesselAnomalyRegion } from '../types/cds';

// Minimal Node.js DOM mock for headless testing of image processing
if (typeof globalThis.Image === 'undefined') {
  (globalThis as any).Image = class {
    onload: (() => void) | null = null;
    width = 512;
    height = 512;
    set src(_val: string) {
      setTimeout(() => this.onload?.(), 5);
    }
  };
}
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 512,
          height: 512,
          getContext: () => ({
            drawImage: () => {},
            getImageData: () => ({ data: new Uint8ClampedArray(512 * 512 * 4) }),
            putImageData: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} }),
            fillRect: () => {},
            clearRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
          }),
          toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        };
      }
      return {};
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runM2Tests() {
  console.log('\n=================================================================');
  console.log('   M2 CLINICAL SAFETY & AI INTEGRITY VERIFICATION SUITE');
  console.log('=================================================================\n');

  console.log('--- 1. MED-03: AAO / ETDRS Rule 4-2-1 Lesion-Based Staging ---');
  {
    // Test 1.1: Preserve "Không DR"
    const zeroDr = computeEtdrsGrade('Cấp độ 0 (Không DR)', 35, 'LOW');
    assert(zeroDr === 'Cấp độ 0 (Không DR)', 'Giữ nguyên Cấp độ 0 (Không DR), không bị ghi đè bởi score non-zero');

    // Test 1.2: Tân mạch -> Cấp độ 4 (PDR)
    const pdrAnomalies: VesselAnomalyRegion[] = [
      {
        id: 'A1',
        type: 'Neovascularization',
        coordinates: { x: 25, y: 25, width: 10, height: 10 },
        confidence: 0.92,
        description: 'Tân mạch đĩa thị NVD',
      },
    ];
    const pdrGrade = computeEtdrsGrade(null, 40, 'LOW', pdrAnomalies);
    assert(pdrGrade.includes('PDR') || pdrGrade.includes('Cấp độ 4'), 'Nhận diện tân mạch NVD gán đúng PDR (Cấp độ 4)');

    // Test 1.3: Quy tắc 4-2-1 (Xuất huyết ở 4 góc phần tư) -> Cấp độ 3 (NPDR nặng)
    const rule4Anomalies: VesselAnomalyRegion[] = [
      { id: 'H1', type: 'Hemorrhage', coordinates: { x: 75, y: 25, width: 5, height: 5 }, confidence: 0.9, description: 'Q1' },
      { id: 'H2', type: 'Hemorrhage', coordinates: { x: 25, y: 25, width: 5, height: 5 }, confidence: 0.9, description: 'Q2' },
      { id: 'H3', type: 'Hemorrhage', coordinates: { x: 25, y: 75, width: 5, height: 5 }, confidence: 0.9, description: 'Q3' },
      { id: 'H4', type: 'Hemorrhage', coordinates: { x: 75, y: 75, width: 5, height: 5 }, confidence: 0.9, description: 'Q4' },
    ];
    const severeGrade = computeEtdrsGrade(null, 30, 'LOW', rule4Anomalies);
    assert(severeGrade.includes('NPDR nặng') || severeGrade.includes('Cấp độ 3'), 'Quy tắc 4: Xuất huyết trên 4 góc phần tư xếp đúng NPDR nặng (Cấp độ 3)');

    // Test 1.4: Chỉ có vi phình mạch -> Cấp độ 1 (NPDR nhẹ)
    const microAnomalies: VesselAnomalyRegion[] = [
      { id: 'M1', type: 'Microaneurysm', coordinates: { x: 60, y: 60, width: 4, height: 4 }, confidence: 0.85, description: 'Vi phình' },
    ];
    const mildGrade = computeEtdrsGrade(null, 15, 'LOW', microAnomalies);
    assert(mildGrade.includes('NPDR nhẹ') || mildGrade.includes('Cấp độ 1'), 'Chỉ có vi phình mạch xếp đúng Cấp độ 1 (NPDR nhẹ)');
  }

  console.log('\n--- 2. MED-05: Emergency Max-Rule Risk Formula ---');
  {
    // Test 2.1: Khi DR đạt 92 (CRITICAL/PDR) nhưng CVD chỉ 20 (LOW), điểm tổng hợp phải là 92 (Max-Rule)
    const mockScreening = {
      id: 'SCR-TEST-EMERGENCY',
      cardiovascularRiskScore: 20,
      cardiovascularRiskLevel: 'LOW',
      diabeticRetinopathyRiskScore: 92,
      diabeticRetinopathyRiskLevel: 'CRITICAL',
      strokeRiskScore: 20,
      strokeRiskLevel: 'LOW',
      etdrsGrade: 'Cấp độ 4 (PDR - Tăng sinh)',
    };
    const mapped = mapScreeningToAIRiskResult(mockScreening, 'https://cdn.aura.test/eye.png');
    assert(mapped.overallVascularRiskScore === 92, 'Emergency Max-Rule: Điểm tổng hợp đạt 92, không bị pha loãng trung bình xuống 56');
    assert(mapped.diabeticRetinopathyRisk.score === 92, 'DiabeticRetinopathyRisk bảo toàn điểm số 92');
  }

  console.log('\n--- 3. MED-06: Independent Stroke Risk Axis ---');
  {
    const mockScreeningStroke = {
      id: 'SCR-TEST-STROKE',
      cardiovascularRiskScore: 35,
      cardiovascularRiskLevel: 'LOW',
      diabeticRetinopathyRiskScore: 25,
      diabeticRetinopathyRiskLevel: 'LOW',
      strokeRiskScore: 82,
      strokeRiskLevel: 'HIGH',
      strokeClinicalNote: 'Nguy cơ đột quỵ độc lập từ hẹp tiểu động mạch',
    };
    const mappedStroke = mapScreeningToAIRiskResult(mockScreeningStroke, 'https://cdn.aura.test/eye.png');
    assert(mappedStroke.strokeRisk !== undefined, 'Đối tượng strokeRisk độc lập tồn tại trong AIRiskResult');
    assert(mappedStroke.strokeRisk?.score === 82, 'Điểm nguy cơ đột quỵ độc lập bằng 82');
    assert(mappedStroke.strokeRisk?.level === 'High', 'Mức nguy cơ đột quỵ độc lập được ánh xạ thành High');
  }

  console.log('\n--- 4. MED-04: Offline Mock AI Engine Physiological Baselines ---');
  {
    const result1 = await MockAIService.runFundusAnalysis(
      {
        requestId: 'REQ-1',
        patientId: 'P1',
        clinicId: 'C1',
        imageName: 'patient_a.jpg',
        imageUrl: 'https://cdn.aura.test/a.jpg',
        scanType: 'Fundus_Macula',
        eyePosition: 'Right_OD',
        uploadedAt: new Date().toISOString(),
      },
      () => {}
    );

    const result2 = await MockAIService.runFundusAnalysis(
      {
        requestId: 'REQ-2',
        patientId: 'P1',
        clinicId: 'C1',
        imageName: 'completely_different_filename_xyz_999.png',
        imageUrl: 'https://cdn.aura.test/different.jpg',
        scanType: 'Fundus_Macula',
        eyePosition: 'Right_OD',
        uploadedAt: new Date().toISOString(),
      },
      () => {}
    );

    assert(
      result1.annotatedMap.arteryVeinRatio === result2.annotatedMap.arteryVeinRatio,
      `Chỉ số A/V Ratio (${result1.annotatedMap.arteryVeinRatio}) độc lập với tên file và nhất quán về mặt sinh lý học`
    );
    assert(
      result1.annotatedMap.vesselDensityPercentage === result2.annotatedMap.vesselDensityPercentage,
      `Chỉ số Vessel Density (${result1.annotatedMap.vesselDensityPercentage}%) nhất quán với chuẩn sinh lý học`
    );
  }

  console.log('\n=================================================================');
  console.log('   KẾT QUẢ: 100% TESTS M2 CLINICAL SAFETY ĐÃ VƯỢT QUA');
  console.log('=================================================================\n');
}

runM2Tests().catch((e) => {
  console.error(e);
  process.exit(1);
});
