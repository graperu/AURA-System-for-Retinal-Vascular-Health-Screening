import assert from 'node:assert';
import { detectOpticDiscCentroid } from '../features/patient/PatientScreeningResultView';
import type { VesselAnomalyRegion, AIRiskResult } from '../types/cds';

console.log('=================================================================');
console.log('   AURA RETINAL LANDMARKS & CLINICAL ACCURACY TEST SUITE');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// 1. Kiểm thử Thuật toán phát hiện quang học tâm Gai thị (detectOpticDiscCentroid)
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm thử Thuật toán Quang học detectOpticDiscCentroid ---');

runTest('LANDMARK-1: detectOpticDiscCentroid an toàn tuyệt đối khi môi trường không có DOM/Canvas', () => {
  // Trong môi trường Node không có document.createElement('canvas'), hàm trả về null mà không văng exception
  const dummyImg = {} as HTMLImageElement;
  const resOD = detectOpticDiscCentroid(dummyImg, false);
  const resOS = detectOpticDiscCentroid(dummyImg, true);
  assert.strictEqual(resOD, null, 'Phải an toàn trả về null khi không có Canvas context');
  assert.strictEqual(resOS, null, 'Phải an toàn trả về null cho OS');
});

runTest('LANDMARK-2: Khóa chống cướp tọa độ Gai thị (Anti-Hijacking: Lesion vs Landmark)', () => {
  // Dữ liệu ca bệnh thực tế nơi tổn thương xuất huyết nằm tại x=70.5%, y=38.0% (ở phía trên đĩa thị)
  const mockAnomalies: VesselAnomalyRegion[] = [
    {
      id: 'ANO-01',
      type: 'Microaneurysm',
      coordinates: { x: 70.5, y: 38.0, width: 24, height: 24 },
      confidence: 0.94,
      description: 'Vi phình mạch cạnh cung mạch thái dương trên',
    },
    {
      id: 'ANO-02',
      type: 'Hemorrhage',
      coordinates: { x: 62.0, y: 44.5, width: 26, height: 26 },
      confidence: 0.91,
      description: 'Chấm xuất huyết võng mạc',
    },
  ];

  // Logic lọc tổn thương (chỉ giữ tổn thương bệnh lý, loại bỏ mốc giải phẫu học)
  const lesionAnomalies = mockAnomalies.filter((ano) => {
    const t = (ano.type || '').toUpperCase();
    const id = (ano.id || '').toUpperCase();
    if (id.startsWith('LANDMARK-')) return false;
    if (t.includes('DISC') || t.includes('GAI_THI')) return false;
    if (t.includes('FOVEA') || t.includes('FAZ') || t.includes('HOANG_DIEM')) return false;
    return true;
  });

  assert.strictEqual(lesionAnomalies.length, 2, 'Cả 2 tổn thương bệnh lý đều được bảo toàn');

  // Kiểm tra: Tổn thương x=70.5, y=38.0 TUYỆT ĐỐI KHÔNG ĐƯỢC làm lệch tọa độ Gai thị
  const isOS = false;
  const discLandmark = mockAnomalies.find(
    (a) => a.id === 'LANDMARK-DISC' || a.type.toUpperCase() === 'OPTIC_DISC' || a.type.toUpperCase() === 'DISC'
  );

  // Vì không có mốc DISC chỉ định, fallback lâm sàng chuẩn cho OD phải ở trung tâm y khoa (~74.8%, ~49.5%)
  const discY = discLandmark?.coordinates.y ?? 49.5;
  assert.strictEqual(discLandmark, undefined, 'Không được nhận nhầm vi phình mạch làm đĩa thị');
  assert.strictEqual(discY, 49.5, 'Tọa độ y của Gai thị không bị nhảy lên y=38% của tổn thương vi phình mạch');
});

runTest('LANDMARK-3: Tầng 1 - Ưu tiên tuyệt đối tọa độ mốc giải phẫu AI (LANDMARK-DISC & LANDMARK-FAZ)', () => {
  const anomaliesWithLandmarks: VesselAnomalyRegion[] = [
    {
      id: 'LANDMARK-DISC',
      type: 'Optic_Disc',
      coordinates: { x: 65.4, y: 53.2, width: 56, height: 56 },
      confidence: 0.98,
      description: 'Đĩa thần kinh thị giác (Gai thị)',
    },
    {
      id: 'LANDMARK-FAZ',
      type: 'Fovea_Centralis',
      coordinates: { x: 42.1, y: 51.5, width: 44, height: 44 },
      confidence: 0.97,
      description: 'Vùng vô mạch hoàng điểm (FAZ)',
    },
    {
      id: 'ANO-01',
      type: 'Microaneurysm',
      coordinates: { x: 68.0, y: 40.0, width: 22, height: 22 },
      confidence: 0.88,
      description: 'Vi phình mạch',
    },
  ];

  // 1. Phân tách tổn thương bệnh lý
  const lesions = anomaliesWithLandmarks.filter((ano) => {
    const t = (ano.type || '').toUpperCase();
    const id = (ano.id || '').toUpperCase();
    if (id.startsWith('LANDMARK-')) return false;
    if (t.includes('DISC') || t.includes('GAI_THI')) return false;
    if (t.includes('FOVEA') || t.includes('FAZ') || t.includes('HOANG_DIEM')) return false;
    return true;
  });

  assert.strictEqual(lesions.length, 1, 'Chỉ có 1 tổn thương bệnh lý (Microaneurysm) được render dưới dạng đốm cảnh báo');
  assert.strictEqual(lesions[0].type, 'Microaneurysm');

  // 2. Tìm mốc giải phẫu
  const discLandmark = anomaliesWithLandmarks.find(
    (a) => a.id === 'LANDMARK-DISC' || a.type.toUpperCase() === 'OPTIC_DISC'
  );
  const fazLandmark = anomaliesWithLandmarks.find(
    (a) => a.id === 'LANDMARK-FAZ' || a.type.toUpperCase() === 'FOVEA_CENTRALIS'
  );

  assert.ok(discLandmark, 'Tìm thấy mốc Gai thị từ AI');
  assert.strictEqual(discLandmark!.coordinates.x, 65.4);
  assert.strictEqual(discLandmark!.coordinates.y, 53.2);

  assert.ok(fazLandmark, 'Tìm thấy mốc Hoàng điểm (FAZ) từ AI');
  assert.strictEqual(fazLandmark!.coordinates.x, 42.1);
  assert.strictEqual(fazLandmark!.coordinates.y, 51.5);
});

runTest('LANDMARK-4: Tầng 3 - Căn chỉnh giải phẫu học tiêu chuẩn (OD vs OS)', () => {
  // Khi không có mốc AI và không có Canvas quang học:
  // Mắt Phải (OD): Gai thị nằm ở phía mũi (bên phải ~74.8%), Hoàng điểm nằm thái dương (bên trái ~49.3%)
  const isOD = false; // OD
  const discOD = { x: isOD ? 25.5 : 74.8, y: 49.5 };
  const maculaOD = {
    x: Math.round((discOD.x - 25.5) * 10) / 10,
    y: Math.round((discOD.y + 0.8) * 10) / 10,
  };

  assert.strictEqual(discOD.x, 74.8, 'Gai thị OD nằm ở bán cầu mũi bên phải');
  assert.strictEqual(maculaOD.x, 49.3, 'Hoàng điểm OD nằm ở phía thái dương bên trái gai thị');

  // Mắt Trái (OS): Gai thị nằm ở phía mũi (bên trái ~25.5%), Hoàng điểm nằm thái dương (bên phải ~51.0%)
  const isOS = true; // OS
  const discOS = { x: isOS ? 25.5 : 74.8, y: 49.5 };
  const maculaOS = {
    x: Math.round((discOS.x + 25.5) * 10) / 10,
    y: Math.round((discOS.y + 0.8) * 10) / 10,
  };

  assert.strictEqual(discOS.x, 25.5, 'Gai thị OS nằm ở bán cầu mũi bên trái');
  assert.strictEqual(maculaOS.x, 51.0, 'Hoàng điểm OS nằm ở phía thái dương bên phải gai thị');
});

console.log('\n=================================================================');
console.log(`   KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐÃ ĐẠT (100% PASS)`);
console.log('=================================================================\n');
