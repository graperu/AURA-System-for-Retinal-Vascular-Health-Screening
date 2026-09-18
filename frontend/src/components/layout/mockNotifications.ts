export type NotificationType =
  | 'SCAN_UPLOADED'
  | 'RESULT_REVIEWED'
  | 'BATCH_COMPLETED'
  | 'ALERT_HIGH_RISK'
  | 'AI_READY'
  | 'DOCTOR_REVIEW'
  | 'BILLING'
  | 'CONSULTATION'
  | 'SYSTEM'
  | string;

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  timestamp: string | number | Date;
  read: boolean;
  link?: string;
  isRead?: boolean;
  linkUrl?: string;
  portal?: string;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-alert-high-risk',
    type: 'ALERT_HIGH_RISK',
    title: 'Cảnh báo: Phát hiện ca nguy cơ CAO - MRN-78214',
    titleEn: 'Alert: Detected HIGH risk case - MRN-78214',
    message: 'Phát hiện tổn thương vi mạch độ 3 với xuất huyết võng mạc diện rộng, khuyến nghị chuyển tuyến khẩn cấp.',
    messageEn: 'Grade 3 microvascular lesions and diffuse retinal hemorrhages detected, urgent referral recommended.',
    timestamp: Date.now() - 5 * 60 * 1000, // 5 phút trước
    read: false,
    link: '/cds-viewer',
    isRead: false,
    linkUrl: '/cds-viewer',
  },
  {
    id: 'notif-scan-uploaded',
    type: 'SCAN_UPLOADED',
    title: 'Bệnh nhân Trần Thị Mai đã tải ảnh fundus mới',
    titleEn: 'Patient Tran Thi Mai uploaded a new fundus scan',
    message: 'Ảnh đáy mắt màu hai mắt (OD/OS) chất lượng cao đã tải lên thành công và sẵn sàng phân tích AI.',
    messageEn: 'High-quality bilateral fundus scans (OD/OS) uploaded and ready for AI analysis.',
    timestamp: Date.now() - 25 * 60 * 1000, // 25 phút trước
    read: false,
    link: '/upload-scan',
    isRead: false,
    linkUrl: '/upload-scan',
  },
  {
    id: 'notif-result-reviewed',
    type: 'RESULT_REVIEWED',
    title: 'BS. Nguyễn Văn An đã duyệt kết quả #SCR-2026-0918-01',
    titleEn: 'Dr. Nguyen Van An approved result #SCR-2026-0918-01',
    message: 'Kết quả sàng lọc vi mạch đã hoàn tất xác nhận lâm sàng và phát hành phiếu báo cáo song ngữ.',
    messageEn: 'Vascular screening results clinically reviewed and bilingual medical report issued.',
    timestamp: Date.now() - 60 * 60 * 1000, // 1 giờ trước
    read: false,
    link: '/reports',
    isRead: false,
    linkUrl: '/reports',
  },
  {
    id: 'notif-batch-completed',
    type: 'BATCH_COMPLETED',
    title: 'Batch B-2026-0918 đã hoàn tất phân tích AI',
    titleEn: 'Batch B-2026-0918 completed AI analysis',
    message: 'Toàn bộ 48 ảnh chụp đáy mắt phòng khám đã phân tích xong và sẵn sàng đối soát.',
    messageEn: 'All 48 clinic fundus images analyzed and ready for verification.',
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 giờ trước
    read: true,
    link: '/bulk-batch',
    isRead: true,
    linkUrl: '/bulk-batch',
  },
];
