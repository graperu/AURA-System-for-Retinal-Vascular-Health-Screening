import {
  computeEtdrsGrade,
  mapScreeningToAIRiskResult,
  toFrontendRiskLevel,
} from '../services/screeningMapper';
import { VesselAnomalyRegion } from '../types/cds';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runAdversarialM2Challenge() {
  console.log('\n=================================================================');
  console.log('   CHALLENGER M2.2: ADVERSARIAL CLINICAL GRADING & RISK STRESS TESTS');
  console.log('=================================================================\n');

  console.log('--- 1. ETDRS 4-2-1 Lesion Staging Adversarial Challenge ---');
  {
    // 1.1 Isolated Microaneurysm without hemorrhages -> Level 1 (Mild NPDR), NOT Level 2 or 3
    const singleMa: VesselAnomalyRegion[] = [
      {
        id: 'MA-1',
        type: 'Microaneurysm',
        coordinates: { x: 30, y: 40, width: 3, height: 3 },
        confidence: 0.95,
        description: 'Single isolated microaneurysm in macular region',
      },
    ];
    const gradeSingle = computeEtdrsGrade(null, 15, 'LOW', singleMa);
    assert(
      gradeSingle === 'Cấp độ 1 (NPDR nhẹ - Vi phình mạch)',
      `Single isolated microaneurysm classified as Level 1 (got: ${gradeSingle})`
    );
    assert(!gradeSingle.includes('Cấp độ 2'), 'Must NOT be classified as Level 2');
    assert(!gradeSingle.includes('Cấp độ 3'), 'Must NOT be classified as Level 3');

    // 1.2 Two isolated microaneurysms across different quadrants without hemorrhages
    const dualMa: VesselAnomalyRegion[] = [
      { id: 'MA-1', type: 'Microaneurysm', coordinates: { x: 20, y: 20, width: 3, height: 3 }, confidence: 0.9 },
      { id: 'MA-2', type: 'Microaneurysm', coordinates: { x: 80, y: 80, width: 3, height: 3 }, confidence: 0.9 },
    ];
    const gradeDual = computeEtdrsGrade(null, 20, 'LOW', dualMa);
    assert(
      gradeDual === 'Cấp độ 1 (NPDR nhẹ - Vi phình mạch)',
      `Two isolated microaneurysms classified as Level 1 (got: ${gradeDual})`
    );

    // 1.3 Hemorrhages in all 4 quadrants -> Rule 4-2-1 Met -> Level 3 (Severe NPDR)
    // Q1: x >= 50, y < 50; Q2: x < 50, y < 50; Q3: x < 50, y >= 50; Q4: x >= 50, y >= 50
    const hemorrhages4Q: VesselAnomalyRegion[] = [
      { id: 'H1', type: 'Hemorrhage', coordinates: { x: 75, y: 25, width: 5, height: 5 }, confidence: 0.88, description: 'Q1 bleed' },
      { id: 'H2', type: 'Retinal_Hemorrhage', coordinates: { x: 25, y: 25, width: 5, height: 5 }, confidence: 0.89, description: 'Q2 bleed' },
      { id: 'H3', type: 'Hemorrhage_Blot', coordinates: { x: 25, y: 75, width: 5, height: 5 }, confidence: 0.91, description: 'Q3 bleed' },
      { id: 'H4', type: 'Xuất huyết', coordinates: { x: 75, y: 75, width: 5, height: 5 }, confidence: 0.87, description: 'Q4 xuất huyết võng mạc' },
    ];
    const grade4Q = computeEtdrsGrade(null, 30, 'LOW', hemorrhages4Q);
    assert(
      grade4Q === 'Cấp độ 3 (NPDR nặng - Tiền tăng sinh)',
      `Hemorrhages in 4 quadrants triggers Rule 4 of 4-2-1 -> Level 3 (got: ${grade4Q})`
    );

    // 1.4 Venous beading in >=2 quadrants -> Rule 4-2-1 Met -> Level 3 (Severe NPDR)
    const venousBeading2Q: VesselAnomalyRegion[] = [
      { id: 'VB1', type: 'Venous_Beading', coordinates: { x: 70, y: 20, width: 5, height: 5 }, confidence: 0.9 },
      { id: 'VB2', type: 'Venous_Beading', coordinates: { x: 20, y: 80, width: 5, height: 5 }, confidence: 0.9 },
    ];
    const gradeVb = computeEtdrsGrade(null, 35, 'LOW', venousBeading2Q);
    assert(
      gradeVb === 'Cấp độ 3 (NPDR nặng - Tiền tăng sinh)',
      `Venous beading in 2 quadrants triggers Rule 2 of 4-2-1 -> Level 3 (got: ${gradeVb})`
    );

    // 1.5 IRMA in >=1 quadrant -> Rule 4-2-1 Met -> Level 3 (Severe NPDR)
    const irma1Q: VesselAnomalyRegion[] = [
      { id: 'IRMA1', type: 'IRMA', coordinates: { x: 30, y: 30, width: 5, height: 5 }, confidence: 0.92 },
    ];
    const gradeIrma = computeEtdrsGrade(null, 30, 'LOW', irma1Q);
    assert(
      gradeIrma === 'Cấp độ 3 (NPDR nặng - Tiền tăng sinh)',
      `IRMA in 1 quadrant triggers Rule 1 of 4-2-1 -> Level 3 (got: ${gradeIrma})`
    );

    // 1.6 Neovascularization (NVD / NVE) -> Level 4 (PDR)
    const nvd: VesselAnomalyRegion[] = [
      { id: 'NV1', type: 'NVD', coordinates: { x: 50, y: 50, width: 10, height: 10 }, confidence: 0.97, description: 'Neovascularization of the disc' },
    ];
    const gradeNvd = computeEtdrsGrade(null, 50, 'LOW', nvd);
    assert(
      gradeNvd === 'Cấp độ 4 (PDR - Tăng sinh)',
      `NVD neovascularization classified as Level 4 PDR (got: ${gradeNvd})`
    );

    const nve: VesselAnomalyRegion[] = [
      { id: 'NV2', type: 'Neovascularization_Elsewhere_NVE', coordinates: { x: 80, y: 20, width: 10, height: 10 }, confidence: 0.93 },
    ];
    const gradeNve = computeEtdrsGrade(null, 45, 'LOW', nve);
    assert(
      gradeNve === 'Cấp độ 4 (PDR - Tăng sinh)',
      `NVE neovascularization classified as Level 4 PDR (got: ${gradeNve})`
    );

    // 1.7 Preservation of Level 0 (No DR / Không DR)
    const grade0Explicit = computeEtdrsGrade('Cấp độ 0 (Không DR)', 35, 'LOW');
    assert(
      grade0Explicit === 'Cấp độ 0 (Không DR)',
      `Preserves existing 'Cấp độ 0 (Không DR)' regardless of non-zero risk score (got: ${grade0Explicit})`
    );

    const grade0Empty = computeEtdrsGrade(null, 10, 'LOW', []);
    assert(
      grade0Empty === 'Cấp độ 0 (Không DR)',
      `Empty anomalies array with low score classified as Level 0 (got: ${grade0Empty})`
    );
  }

  console.log('\n--- 2. Emergency Risk Max-Rule Adversarial Challenge ---');
    // Scenario 2.1: Screening record without pre-existing riskScore (mapper computes it)
    const acutePdrCase = {
      id: 'SCR-ADVERSARIAL-PDR-EMERGENCY',
      cardiovascularRiskScore: 20,
      cardiovascularRiskLevel: 'LOW',
      strokeRiskScore: 20,
      strokeRiskLevel: 'LOW',
      diabeticRetinopathyRiskScore: 95,
      diabeticRetinopathyRiskLevel: 'CRITICAL',
      etdrsGrade: 'Cấp độ 4 (PDR - Tăng sinh)',
      overallVascularRiskScore: 47, // Raw diluted score before emergency calculation
    };

    const mapped = mapScreeningToAIRiskResult(acutePdrCase, 'https://cdn.aura.test/eye.png');

    assert(
      mapped.overallVascularRiskScore === 95,
      `Emergency Max-Rule: Overall composite score must be 95 (got: ${mapped.overallVascularRiskScore}), NOT diluted to 47`
    );
    assert(
      mapped.riskScore === 95,
      `riskScore property must also be 95 via emergency max-rule (got: ${mapped.riskScore})`
    );
    assert(
      mapped.diabeticRetinopathyRisk.score === 95,
      `Diabetic Retinopathy organ risk score is preserved at 95 (got: ${mapped.diabeticRetinopathyRisk.score})`
    );
    assert(
      mapped.diabeticRetinopathyRisk.level === 'Critical',
      `Diabetic Retinopathy organ risk level is Critical (got: ${mapped.diabeticRetinopathyRisk.level})`
    );

    const calculatedLevel = toFrontendRiskLevel(acutePdrCase.diabeticRetinopathyRiskLevel);
    assert(
      calculatedLevel === 'Critical',
      `Organ risk level must map to Critical (got: ${calculatedLevel})`
    );

    // Scenario 2.2: Adversarial edge case where a pre-existing diluted riskScore: 47 is present
    const preExistingDilutedCase = {
      ...acutePdrCase,
      riskScore: 47,
    };
    const mappedDiluted = mapScreeningToAIRiskResult(preExistingDilutedCase, 'https://cdn.aura.test/eye.png');
    assert(
      mappedDiluted.overallVascularRiskScore === 95,
      `Emergency Max-Rule correctly elevates overallVascularRiskScore to 95 even when input riskScore was 47`
    );

  console.log('\n=================================================================');
  console.log('   CHALLENGER M2.2 VERDICT: ALL ADVERSARIAL TESTS PASSED (100%)');
  console.log('=================================================================\n');
}

runAdversarialM2Challenge().catch((e) => {
  console.error('Adversarial Challenge FAILED:', e);
  process.exit(1);
});
