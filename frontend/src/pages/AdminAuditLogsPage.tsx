import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  ShieldAlert,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
  Users,
  Sliders,
  CreditCard,
  ShieldCheck,
  Building2,
  Stethoscope,
  Lock,
  Unlock,
  Eye,
  Sparkles,
  Settings,
  Bell,
  FileText,
  Edit,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  X,
  Check,
  Loader2,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  auditApi,
  adminUserApi,
  adminClinicApi,
  adminRoleApi,
  adminNotificationApi,
  adminServicePackageApi,
  ServicePackagePayload,
} from "../services/api";
import { ClinicalSelect, ClinicalSelectOption } from "../components/ui/ClinicalSelect";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { useLanguage } from "../context/LanguageContext";
import { PatientAssignmentBoard } from "../components/PatientAssignmentBoard";
import {
  AdminAuditWorkspace,
  AuditLogItem,
} from "../features/admin/AdminAuditWorkspace";

interface AdminAuditLogsPageProps {
  activeView?: string;
}

type AdminTab =
  | "users"
  | "rbac"
  | "notifications"
  | "clinics"
  | "assignments"
  | "packages"
  | "ai-config"
  | "audit";

export const AdminAuditLogsPage: React.FC<AdminAuditLogsPageProps> = ({
  activeView,
}) => {
  const { t, isVi } = useLanguage();

  const userRoleFilterOptions = useMemo<ClinicalSelectOption<string>[]>(() => [
    { value: "ALL", label: t('admin.userManagement.allRoles', isVi ? "Tất cả vai trò" : "All Roles") },
    { value: "ROLE_USER", label: isVi ? "Bệnh nhân" : "Patient" },
    { value: "ROLE_DOCTOR", label: isVi ? "Bác sĩ chuyên khoa" : "Specialist Doctor" },
    { value: "ROLE_CLINIC", label: isVi ? "Tổ chức phòng khám" : "Clinic Organization" },
    { value: "ROLE_ADMIN", label: isVi ? "Quản trị viên" : "Administrator" },
  ], [t, isVi]);

  const notificationChannelOptions = useMemo<ClinicalSelectOption<string>[]>(() => [
    { value: "IN_APP", label: isVi ? "Thông báo hệ thống" : "System Notification" },
    { value: "EMAIL", label: isVi ? "Thư điện tử" : "Email" },
    { value: "SMS", label: isVi ? "Tin nhắn SMS" : "SMS Message" },
  ], [isVi]);

  const packageScopeOptions = useMemo<ClinicalSelectOption<string>[]>(() => [
    { value: "ALL", label: t('admin.packages.scopeAll', isVi ? "Tất cả đối tượng" : "All Audiences") },
    { value: "USER", label: t('admin.packages.scopeUser', isVi ? "Cá nhân" : "Individual") },
    { value: "CLINIC", label: t('admin.packages.scopeClinic', isVi ? "Phòng khám" : "Clinic") },
  ], [t, isVi]);

  const sectionToTab: Record<string, AdminTab> = {
    "user-management": "users",
    "rbac-matrix": "rbac",
    "notification-config": "notifications",
    "clinic-approvals": "clinics",
    "package-management": "packages",
    "ai-thresholds": "ai-config",
    "audit-logs": "audit",
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(
    (activeView && sectionToTab[activeView]) || "users",
  );

  useEffect(() => {
    if (activeView && sectionToTab[activeView]) {
      setActiveTab(sectionToTab[activeView]);
    }
  }, [activeView]);

  // ==========================================
  // FR-31: USER MANAGEMENT STATE & HANDLERS
  // ==========================================
  const normalizeRole = (r?: string): string => {
    if (!r) return "ROLE_USER";
    const clean = String(r).toUpperCase().trim();
    if (clean.startsWith("ROLE_")) return clean;
    return `ROLE_${clean}`;
  };

  const getDepartment = (roleStr?: string) => {
    const norm = normalizeRole(roleStr);
    if (norm === "ROLE_DOCTOR") return isVi ? "Khoa Mắt & Tim Mạch" : "Ophthalmology & Cardiology";
    if (norm === "ROLE_CLINIC") return isVi ? "Phòng Khám Đa Khoa" : "General Clinic";
    if (norm === "ROLE_ADMIN") return isVi ? "Ban Quản Trị Hệ Thống" : "System Administration";
    return isVi ? "Cổng Bệnh Nhân" : "Patient Portal";
  };

  const formatRoleLabel = (roleStr?: string) => {
    const norm = normalizeRole(roleStr);
    if (norm === "ROLE_ADMIN") return isVi ? "Quản trị viên" : "Administrator";
    if (norm === "ROLE_DOCTOR") return isVi ? "Bác sĩ chuyên khoa" : "Specialist Doctor";
    if (norm === "ROLE_CLINIC") return isVi ? "Phòng khám" : "Clinic";
    return isVi ? "Bệnh nhân" : "Patient";
  };

  const getRoleBadgeClass = (roleStr?: string) => {
    const norm = normalizeRole(roleStr);
    if (norm === "ROLE_ADMIN") return "bg-purple-100 text-purple-800 border border-purple-200";
    if (norm === "ROLE_DOCTOR") return "bg-blue-100 text-blue-800 border border-blue-200";
    if (norm === "ROLE_CLINIC") return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
  });
  const [roleChangeUser, setRoleChangeUser] = useState<any | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState("ROLE_USER");
  const [userActionNotice, setUserActionNotice] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const roleParam = userRoleFilter !== "ALL" ? userRoleFilter : undefined;
      const userRes = await adminUserApi.getUsers(
        0,
        100,
        userSearchQuery || undefined,
        roleParam,
      );
      const rawItems = userRes?.data?.items || (Array.isArray(userRes?.data) ? userRes.data : Array.isArray(userRes) ? userRes : []);
      if (rawItems && rawItems.length > 0) {
        setUsersList(
          rawItems.map((u: any) => {
            const rawRole = (Array.isArray(u.roles) && u.roles[0]) || u.role || "ROLE_USER";
            const normRole = normalizeRole(rawRole);
            return {
              id: u.id,
              name: u.fullName || u.name || u.email,
              email: u.email,
              role: normRole,
              status: u.active === false ? "SUSPENDED" : (u.status || "ACTIVE"),
              phoneNumber: u.phoneNumber || "",
              address: u.address || "",
              department: getDepartment(normRole),
              exams: u.totalScreenings || 0,
            };
          }),
        );
      }
    } catch (e) {
      console.warn("Could not fetch users:", e);
    }
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const uRole = normalizeRole(u.role);
      const filterRole = userRoleFilter !== "ALL" ? normalizeRole(userRoleFilter) : "ALL";
      const matchRole = filterRole === "ALL" || uRole === filterRole;
      const q = userSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));
      return matchRole && matchQuery;
    });
  }, [usersList, userRoleFilter, userSearchQuery]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllUsers = () => {
    if (paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.id))) {
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string,
  ) => {
    const newActive = currentStatus !== "ACTIVE";
    try {
      const res = await adminUserApi.updateStatus(userId, newActive);
      if (res.success) {
        setUserActionNotice(
          newActive
            ? t('admin.userManagement.activatedSuccess', isVi ? "Đã kích hoạt tài khoản thành công." : "Account activated successfully.")
            : t('admin.userManagement.suspendedSuccess', isVi ? "Đã vô hiệu hóa (khóa) tài khoản." : "Account suspended successfully."),
        );
        setTimeout(() => setUserActionNotice(null), 4000);
        loadUsers();
      }
    } catch (e) {
      console.warn("Could not toggle user status:", e);
    }
  };

  const handleBatchToggleUserStatus = async (newActive: boolean) => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => adminUserApi.updateStatus(id, newActive)));
      setUserActionNotice(
        newActive
          ? t('admin.userManagement.activatedSuccess', isVi ? `Đã kích hoạt ${ids.length} tài khoản thành công.` : `Activated ${ids.length} accounts successfully.`)
          : t('admin.userManagement.suspendedSuccess', isVi ? `Đã vô hiệu hóa (khóa) ${ids.length} tài khoản.` : `Suspended ${ids.length} accounts successfully.`)
      );
      setSelectedUserIds(new Set());
      setTimeout(() => setUserActionNotice(null), 4000);
      loadUsers();
    } catch (e) {
      console.warn("Could not batch toggle user status:", e);
    }
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await adminUserApi.updateUser(editingUser.id, editFormData);
      if (res.success) {
        setUserActionNotice(t('admin.userManagement.updatedSuccess', isVi ? "Đã cập nhật thông tin tài khoản." : "Account details updated successfully."));
        setTimeout(() => setUserActionNotice(null), 4000);
        setEditingUser(null);
        loadUsers();
      }
    } catch (e) {
      console.warn("Could not update user:", e);
    }
  };

  const handleSaveUserRole = async () => {
    if (!roleChangeUser) return;
    const normNewRole = normalizeRole(selectedNewRole);
    try {
      // Optimistic instant UI update
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === roleChangeUser.id
            ? {
                ...u,
                role: normNewRole,
                department: getDepartment(normNewRole),
              }
            : u
        )
      );

      const res = await adminUserApi.updateRole(
        roleChangeUser.id,
        normNewRole,
      );
      if (res.success) {
        setUserActionNotice(
          t('admin.userManagement.roleUpdatedSuccess', isVi ? `Đã thay đổi vai trò tài khoản thành ${formatRoleLabel(normNewRole)}.` : `User role changed to ${formatRoleLabel(normNewRole)}.`),
        );
      } else {
        setUserActionNotice(res.message || (isVi ? "Không thể thay đổi vai trò." : "Failed to change user role."));
      }
      setTimeout(() => setUserActionNotice(null), 4000);
      setRoleChangeUser(null);
      await loadUsers();
    } catch (e: any) {
      console.warn("Could not update user role:", e);
      setUserActionNotice(e?.message || (isVi ? "Đã xảy ra lỗi khi đổi vai trò." : "Error changing user role."));
      setTimeout(() => setUserActionNotice(null), 4000);
      setRoleChangeUser(null);
      await loadUsers();
    }
  };

  // ==========================================
  // FR-32: RBAC ROLES & PERMISSIONS MATRIX
  // ==========================================
  const PERMISSION_META: Record<string, { nameVi: string; nameEn: string; groupVi: string; groupEn: string; descVi?: string; descEn?: string }> = useMemo(() => ({
    // DOCTOR
    PATIENT_WORKLIST: {
      nameVi: "Danh sách tiếp nhận ca khám (Worklist)",
      nameEn: "Assigned Patient Worklist",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Xem và tiếp nhận danh sách bệnh nhân được phân công khám & sàng lọc.",
      descEn: "View and accept assigned patient worklist for screening.",
    },
    SCREENING_REVIEW: {
      nameVi: "Thẩm định & Ký duyệt kết quả AI",
      nameEn: "Review & Sign AI Results",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Thẩm định độ chính xác của AI, điều chỉnh mức nguy cơ và ký số kết quả.",
      descEn: "Review AI accuracy, override risk levels, and sign diagnostic results.",
    },
    CLINICAL_NOTES: {
      nameVi: "Ghi chú lâm sàng & Mã bệnh ICD-10",
      nameEn: "Clinical Notes & ICD-10 Coding",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Nhập bệnh án điện tử, phân loại ICD-10 (H35.0, I10) và chỉ định phác đồ điều trị.",
      descEn: "Record EHR notes, assign ICD-10 codes, and prescribe treatment plans.",
    },
    FEEDBACK_SUBMIT: {
      nameVi: "Phản hồi huấn luyện lại mô hình AI",
      nameEn: "AI Feedback & Retraining",
      groupVi: "Chẩn đoán AI",
      groupEn: "AI Diagnostics",
      descVi: "Gửi phản hồi nhãn sai lệch để hỗ trợ chu trình Active Learning / Retraining.",
      descEn: "Submit mislabeled samples for Active Learning and model retraining.",
    },
    DOCTOR_REVIEW: {
      nameVi: "Thẩm định & Điều chỉnh mức nguy cơ",
      nameEn: "Review & Override Clinical Risk",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Đánh giá phân độ tổn thương vi mạch đáy mắt và gán mức nguy cơ lâm sàng.",
      descEn: "Evaluate microvascular lesion severity and assign clinical risk level.",
    },
    DIGITAL_SIGNATURE: {
      nameVi: "Ký số báo cáo y khoa chuẩn HMAC",
      nameEn: "HMAC Digital Signature for Medical Reports",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Tạo chữ ký số mật mã xác thực tính toàn vẹn của báo cáo kết quả.",
      descEn: "Cryptographic signing to guarantee medical report integrity.",
    },
    ICD10_DIAGNOSE: {
      nameVi: "Gán mã chẩn đoán ICD-10 (H35.0, I10)",
      nameEn: "Assign ICD-10 Diagnostic Codes",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Chẩn đoán bệnh võng mạc đái tháo đường, tăng huyết áp theo chuẩn WHO.",
      descEn: "Diagnose DR and hypertensive retinopathy under WHO standards.",
    },
    CONSULTATION_CHAT: {
      nameVi: "Nhắn tin tư vấn trực tuyến với bệnh nhân",
      nameEn: "Online Teleconsultation Messaging",
      groupVi: "Lâm sàng",
      groupEn: "Clinical",
      descVi: "Nhắn tin và trao đổi chuyên môn trực tiếp với bệnh nhân qua cổng tư vấn.",
      descEn: "Direct secure messaging and teleconsultation with patients.",
    },

    // PATIENT / USER
    SCREENING_CREATE: {
      nameVi: "Tải ảnh đáy mắt & Chạy suy luận AI",
      nameEn: "Upload Fundus Images & Run AI Inference",
      groupVi: "Chẩn đoán AI",
      groupEn: "AI Diagnostics",
      descVi: "Tải ảnh chụp đáy mắt màu và kích hoạt chu trình phân tích AI tự động.",
      descEn: "Upload fundus photographs and trigger automated AI inference.",
    },
    SCREENING_READ: {
      nameVi: "Xem kết quả phân tích AI & Biomarkers",
      nameEn: "View AI Analysis Results & Biomarkers",
      groupVi: "Chẩn đoán AI",
      groupEn: "AI Diagnostics",
      descVi: "Xem các chỉ số vi mạch AVR, Fractal Dimension, Tortuosity và dự đoán nguy cơ.",
      descEn: "View vascular biomarkers AVR, Fractal Dimension, Tortuosity, and risk predictions.",
    },
    GRADCAM_VIEW: {
      nameVi: "Xem bản đồ nhiệt Grad-CAM vi mạch",
      nameEn: "View Grad-CAM Retinal Microvascular Heatmaps",
      groupVi: "Chẩn đoán AI",
      groupEn: "AI Diagnostics",
      descVi: "Xem vùng chú ý giải thích minh bạch AI trên mạng lưới mạch máu.",
      descEn: "View visual explainability heatmaps over retinal vascular network.",
    },
    PROFILE_MANAGE: {
      nameVi: "Quản lý hồ sơ sức khỏe y tế cá nhân",
      nameEn: "Personal Health Profile Management",
      groupVi: "Bệnh nhân",
      groupEn: "Patient",
      descVi: "Cập nhật tiền sử bệnh tim mạch, đái tháo đường và chỉ số sinh hiệu.",
      descEn: "Manage cardiovascular history, diabetes status, and vital signs.",
    },
    BILLING_VIEW: {
      nameVi: "Xem gói dịch vụ & Lịch sử giao dịch",
      nameEn: "View Service Packages & Transaction History",
      groupVi: "Thanh toán",
      groupEn: "Billing",
      descVi: "Tra cứu lịch sử nạp credit, hóa đơn điện tử và các gói phân tích đã mua.",
      descEn: "View credit top-up history, invoices, and active service packages.",
    },
    BILLING_READ: {
      nameVi: "Tra cứu số dư credit và gói cước",
      nameEn: "Check Credit Balance & Subscriptions",
      groupVi: "Thanh toán",
      groupEn: "Billing",
      descVi: "Kiểm tra số dư lượt phân tích AI khả dụng trong tài khoản.",
      descEn: "Check available AI analysis credits in account balance.",
    },
    PACKAGE_PURCHASE: {
      nameVi: "Mua / Nạp gói phân tích qua VietQR Napas",
      nameEn: "Purchase Packages via VietQR Napas",
      groupVi: "Thanh toán",
      groupEn: "Billing",
      descVi: "Quét mã VietQR chuyển khoản thanh toán gói phân tích nhanh chóng 24/7.",
      descEn: "Scan VietQR Napas 24/7 code to purchase AI screening credits.",
    },

    // CLINIC
    BULK_SCREENING: {
      nameVi: "Sàng lọc cộng đồng hàng loạt (≥100 ảnh/lô)",
      nameEn: "Bulk Screening (≥100 scans/batch)",
      groupVi: "Chẩn đoán AI",
      groupEn: "AI Diagnostics",
      descVi: "Tải lên và xử lý song song hàng trăm ca chụp cho các chiến dịch khám cộng đồng.",
      descEn: "Batch upload and parallel processing for community screening drives.",
    },
    CLINIC_MEMBERS: {
      nameVi: "Quản lý đội ngũ bác sĩ trực thuộc phòng khám",
      nameEn: "Manage Affiliated Clinic Doctors",
      groupVi: "Tổ chức",
      groupEn: "Organization",
      descVi: "Thêm, gán quyền và điều phối công việc cho các bác sĩ trong cơ sở.",
      descEn: "Add, assign roles, and allocate workload to affiliated clinic doctors.",
    },
    CLINIC_MEMBER_MANAGE: {
      nameVi: "Quản lý thành viên & nhân sự phòng khám",
      nameEn: "Manage Clinic Staff & Members",
      groupVi: "Tổ chức",
      groupEn: "Organization",
      descVi: "Phân quyền và quản lý nhân sự y tế trong tổ chức phòng khám.",
      descEn: "Manage medical personnel and assign access within the clinic.",
    },
    CLINIC_ANALYTICS: {
      nameVi: "Báo cáo thống kê & Dịch tễ học chiến dịch",
      nameEn: "Epidemiological Campaign Analytics",
      groupVi: "Thống kê",
      groupEn: "Analytics",
      descVi: "Xuất dữ liệu dịch tễ học và phân bố nguy cơ theo nhóm đối tượng sàng lọc.",
      descEn: "Export epidemiological stats and risk distribution across populations.",
    },
    CREDIT_PURCHASE: {
      nameVi: "Mua & Phân bổ Credit cho bác sĩ phòng khám",
      nameEn: "Purchase & Allocate Clinic Credits",
      groupVi: "Thanh toán",
      groupEn: "Billing",
      descVi: "Mua gói credit số lượng lớn với chiết khấu và cấp phát cho bác sĩ trực thuộc.",
      descEn: "Bulk purchase credit packages with enterprise discount for staff.",
    },

    // ADMIN
    USER_MANAGE: {
      nameVi: "Quản lý tài khoản & Phân quyền người dùng",
      nameEn: "User Account & Role Management",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Kích hoạt, tạm khóa, cấp lại mật khẩu và đổi vai trò tài khoản.",
      descEn: "Activate, suspend, reset passwords, and assign roles to accounts.",
    },
    ROLE_MANAGE: {
      nameVi: "Cấu hình ma trận phân quyền hệ thống",
      nameEn: "Configure System RBAC Permission Matrix",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Bật / tắt các quyền truy cập chi tiết cho từng nhóm vai trò người dùng.",
      descEn: "Enable or disable granular access permissions for each user role.",
    },
    ROLE_CONFIG: {
      nameVi: "Cấu hình ma trận phân quyền hệ thống",
      nameEn: "Configure RBAC Permission Matrix",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Thiết lập quyền truy cập cho từng vai trò người dùng trong hệ thống.",
      descEn: "Configure access permissions for each user role in the system.",
    },
    CLINIC_VERIFY: {
      nameVi: "Phê duyệt hồ sơ pháp nhân phòng khám",
      nameEn: "Verify & Approve Clinic Legal Profiles",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Thẩm định giấy phép hoạt động khám chữa bệnh và phê duyệt tài khoản phòng khám.",
      descEn: "Verify medical operation licenses and approve legal clinic profiles.",
    },
    ASSIGNMENT_MANAGE: {
      nameVi: "Điều phối & Phân công ca khám cho bác sĩ",
      nameEn: "Doctor Workload Dispatching",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Tự động hoặc thủ công phân bổ ca khám cần thẩm định cho bác sĩ phù hợp.",
      descEn: "Auto or manual dispatching of screening cases to available doctors.",
    },
    AI_CONFIG: {
      nameVi: "Cấu hình tham số & Độ nhạy mô hình AI",
      nameEn: "AI Parameters & Sensitivity Configuration",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Điều chỉnh ngưỡng phân loại bệnh lý mắt và cảnh báo mạch máu.",
      descEn: "Tune cut-off thresholds for Glaucoma, DR, and AVR alert levels.",
    },
    AI_THRESHOLD_UPDATE: {
      nameVi: "Điều chỉnh độ nhạy AI & Ngưỡng cảnh báo",
      nameEn: "Adjust AI Sensitivity & Warning Thresholds",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Cấu hình ngưỡng phân loại nguy cơ và tự động kích hoạt huấn luyện lại.",
      descEn: "Configure risk classification thresholds and automatic retraining triggers.",
    },
    AUDIT_VIEW: {
      nameVi: "Xem & Giám sát nhật ký bảo mật hệ thống",
      nameEn: "View & Monitor Security Audit Logs",
      groupVi: "Bảo mật",
      groupEn: "Security",
      descVi: "Giám sát chi tiết mọi thao tác truy cập dữ liệu y tế nhạy cảm.",
      descEn: "Monitor access trails and security events in real-time.",
    },
    AUDIT_EXPORT: {
      nameVi: "Xuất báo cáo nhật ký bảo mật hệ thống",
      nameEn: "Export Audit Trail Reports (CSV)",
      groupVi: "Bảo mật",
      groupEn: "Security",
      descVi: "Xuất file CSV chứa toàn bộ nhật ký truy cập và thao tác hệ thống.",
      descEn: "Export CSV files containing complete access trails and system actions.",
    },
    NOTIFICATION_MANAGE: {
      nameVi: "Quản lý mẫu thông báo & Chính sách liên lạc",
      nameEn: "Manage Notification Templates & Policies",
      groupVi: "Quản trị",
      groupEn: "Administration",
      descVi: "Soạn thảo mẫu Email, SMS, In-App và thiết lập khung giờ yên lặng.",
      descEn: "Compose Email, SMS, In-App templates and configure quiet hours.",
    },
  }), []);

  const defaultFallbackRoles = useMemo(() => [
    {
      id: "role-admin",
      name: "ADMIN",
      roleName: "ROLE_ADMIN",
      displayName: isVi ? "Quản Trị Viên (ADMIN)" : "Administrator (ADMIN)",
      description: isVi
        ? "Toàn quyền quản trị hệ thống AURA, quản lý người dùng, cấu hình tham số AI và kiểm toán bảo mật HIPAA."
        : "Full system administration, user accounts, AI configuration, and HIPAA security audit logs.",
      permissions: [
        { code: "USER_MANAGE", enabled: true },
        { code: "ROLE_MANAGE", enabled: true },
        { code: "CLINIC_VERIFY", enabled: true },
        { code: "ASSIGNMENT_MANAGE", enabled: true },
        { code: "AI_CONFIG", enabled: true },
        { code: "AUDIT_VIEW", enabled: true },
        { code: "NOTIFICATION_MANAGE", enabled: true },
      ],
    },
    {
      id: "role-doctor",
      name: "DOCTOR",
      roleName: "ROLE_DOCTOR",
      displayName: isVi ? "Bác Sĩ Chuyên Khoa (DOCTOR)" : "Specialist Doctor (DOCTOR)",
      description: isVi
        ? "Bác sĩ chuyên khoa Mắt & Tim mạch, thẩm định lâm sàng CDS, phân loại ICD-10 và ký số HMAC báo cáo y khoa."
        : "Ophthalmologist & cardiologist, clinical CDS validation, ICD-10 diagnosis, and HMAC digital signing.",
      permissions: [
        { code: "PATIENT_WORKLIST", enabled: true },
        { code: "SCREENING_REVIEW", enabled: true },
        { code: "CLINICAL_NOTES", enabled: true },
        { code: "FEEDBACK_SUBMIT", enabled: true },
        { code: "CONSULTATION_CHAT", enabled: true },
      ],
    },
    {
      id: "role-clinic",
      name: "CLINIC",
      roleName: "ROLE_CLINIC",
      displayName: isVi ? "Tổ Chức Phòng Khám (CLINIC)" : "Clinic Organization (CLINIC)",
      description: isVi
        ? "Tổ chức phòng khám y tế, thực hiện sàng lọc cộng đồng hàng loạt, quản lý bác sĩ cơ sở và mua credit."
        : "Clinic organization, running bulk screening campaigns, managing doctor staff, and credit packages.",
      permissions: [
        { code: "BULK_SCREENING", enabled: true },
        { code: "CLINIC_MEMBERS", enabled: true },
        { code: "CLINIC_ANALYTICS", enabled: true },
        { code: "CREDIT_PURCHASE", enabled: true },
      ],
    },
    {
      id: "role-user",
      name: "USER",
      roleName: "ROLE_USER",
      displayName: isVi ? "Bệnh Nhân Cá Nhân (USER)" : "Individual Patient (USER)",
      description: isVi
        ? "Bệnh nhân cá nhân, tải ảnh chụp đáy mắt, nhận kết quả sàng lọc AI và tư vấn trực tuyến với bác sĩ."
        : "Individual patient, uploading fundus scans, receiving AI screening reports, and doctor teleconsultation.",
      permissions: [
        { code: "SCREENING_CREATE", enabled: true },
        { code: "PROFILE_MANAGE", enabled: true },
        { code: "BILLING_VIEW", enabled: true },
        { code: "CONSULTATION_CHAT", enabled: true },
      ],
    },
  ], [isVi]);

  const normalizeRoleData = (rawData: any[]): any[] => {
    if (!Array.isArray(rawData) || rawData.length === 0) return defaultFallbackRoles;

    return rawData.map((item) => {
      const rawName = String(item.name || item.roleName || "").replace(/^ROLE_/, "").toUpperCase();
      const roleName = `ROLE_${rawName}`;

      const defaultDesc =
        rawName === "ADMIN"
          ? (isVi ? "Toàn quyền quản trị hệ thống AURA, quản lý người dùng, cấu hình tham số AI và kiểm toán bảo mật HIPAA." : "Full system administration, user accounts, AI configuration, and HIPAA security audit logs.")
          : rawName === "DOCTOR"
            ? (isVi ? "Bác sĩ chuyên khoa Mắt & Tim mạch, thẩm định lâm sàng CDS, phân loại ICD-10 và ký số HMAC báo cáo y khoa." : "Ophthalmologist & cardiologist, clinical CDS validation, ICD-10 diagnosis, and HMAC digital signing.")
            : rawName === "CLINIC"
              ? (isVi ? "Tổ chức phòng khám y tế, thực hiện sàng lọc cộng đồng hàng loạt, quản lý bác sĩ cơ sở và mua credit." : "Clinic organization, running bulk screening campaigns, managing doctor staff, and credit packages.")
              : (isVi ? "Bệnh nhân cá nhân, tải ảnh chụp đáy mắt, nhận kết quả sàng lọc AI và tư vấn trực tuyến với bác sĩ." : "Individual patient, uploading fundus scans, receiving AI screening reports, and doctor teleconsultation.");

      const displayName =
        rawName === "ADMIN"
          ? (isVi ? "Quản Trị Viên (ADMIN)" : "Administrator (ADMIN)")
          : rawName === "DOCTOR"
            ? (isVi ? "Bác Sĩ Chuyên Khoa (DOCTOR)" : "Specialist Doctor (DOCTOR)")
            : rawName === "CLINIC"
              ? (isVi ? "Tổ Chức Phòng Khám (CLINIC)" : "Clinic Organization (CLINIC)")
              : (isVi ? "Bệnh Nhân Cá Nhân (USER)" : "Individual Patient (USER)");

      let permissions: any[] = [];
      if (Array.isArray(item.permissions)) {
        permissions = item.permissions.map((p: any) => {
          if (typeof p === "string") {
            const meta = PERMISSION_META[p];
            return {
              id: undefined,
              code: p,
              name: meta ? (isVi ? meta.nameVi : meta.nameEn) : p,
              group: meta ? (isVi ? meta.groupVi : meta.groupEn) : (isVi ? "Chung" : "General"),
              desc: meta ? (isVi ? meta.descVi : meta.descEn) : "",
              enabled: true,
            };
          } else {
            const code = p.code || p.permissionCode || "";
            const meta = PERMISSION_META[code];
            return {
              id: p.id,
              code: code,
              name: meta ? (isVi ? meta.nameVi : meta.nameEn) : (p.label || p.permissionLabel || code),
              group: meta ? (isVi ? meta.groupVi : meta.groupEn) : (isVi ? "Quyền hạn" : "Permission"),
              desc: meta ? (isVi ? meta.descVi : meta.descEn) : (p.description || ""),
              enabled: p.enabled !== false,
            };
          }
        });
      }

      return {
        id: item.id || `role-${rawName.toLowerCase()}`,
        name: rawName,
        roleName: roleName,
        displayName: displayName,
        description: item.description || defaultDesc,
        permissions,
      };
    });
  };

  const [rbacRoles, setRbacRoles] = useState<any[]>(() => defaultFallbackRoles);
  const [selectedRbacRole, setSelectedRbacRole] = useState("ROLE_DOCTOR");
  const [rbacSavedNotice, setRbacSavedNotice] = useState<string | null>(null);
  const [isSavingRbac, setIsSavingRbac] = useState(false);

  const loadRbacRoles = async () => {
    try {
      const res = await adminRoleApi.getRoles();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setRbacRoles(normalizeRoleData(res.data));
      }
    } catch (e) {
      console.warn("Could not fetch RBAC roles:", e);
    }
  };

  const handleTogglePermission = (permissionCode: string) => {
    const cleanSelected = selectedRbacRole.replace(/^ROLE_/, "").toUpperCase();
    setRbacRoles((prev) =>
      prev.map((r) => {
        const rName = String(r.name || r.roleName || "").replace(/^ROLE_/, "").toUpperCase();
        if (rName !== cleanSelected && r.roleName !== selectedRbacRole) return r;
        const perms = (r.permissions || []).map((p: any) => {
          if (p.code === permissionCode) {
            return { ...p, enabled: !p.enabled };
          }
          return p;
        });
        return { ...r, permissions: perms };
      }),
    );
  };

  const handleToggleAllPermissionsForRole = (enabled: boolean) => {
    const cleanSelected = selectedRbacRole.replace(/^ROLE_/, "").toUpperCase();
    setRbacRoles((prev) =>
      prev.map((r) => {
        const rName = String(r.name || r.roleName || "").replace(/^ROLE_/, "").toUpperCase();
        if (rName !== cleanSelected && r.roleName !== selectedRbacRole) return r;
        const perms = (r.permissions || []).map((p: any) => ({ ...p, enabled }));
        return { ...r, permissions: perms };
      }),
    );
  };

  const handleSaveRolePermissions = async () => {
    const cleanSelected = selectedRbacRole.replace(/^ROLE_/, "").toUpperCase();
    const currentRoleObj = rbacRoles.find(
      (r) => {
        const rName = String(r.name || r.roleName || "").replace(/^ROLE_/, "").toUpperCase();
        return rName === cleanSelected || r.roleName === selectedRbacRole;
      },
    );
    if (!currentRoleObj) return;
    setIsSavingRbac(true);
    try {
      const payloadToggles = (currentRoleObj.permissions || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        enabled: Boolean(p.enabled),
      }));

      const res = await adminRoleApi.updatePermissions(
        cleanSelected,
        payloadToggles,
      );
      if (res.success) {
        setRbacSavedNotice(
          t(
            'admin.rbac.savedSuccess',
            isVi
              ? `Đã lưu thành công cấu hình ma trận phân quyền cho vai trò ${currentRoleObj.displayName || cleanSelected}!`
              : `Permissions saved successfully for role ${currentRoleObj.displayName || cleanSelected}!`
          ),
        );
        loadRbacRoles();
      } else {
        setRbacSavedNotice(res.message || (isVi ? "Lưu ma trận quyền thất bại." : "Failed to save permissions."));
      }
      setTimeout(() => setRbacSavedNotice(null), 4500);
    } catch (e) {
      console.warn("Could not save permissions:", e);
      setRbacSavedNotice(isVi ? "Lỗi kết nối khi lưu ma trận phân quyền." : "Error connecting to server while saving permissions.");
      setTimeout(() => setRbacSavedNotice(null), 4500);
    } finally {
      setIsSavingRbac(false);
    }
  };

  // ==========================================
  // FR-39: NOTIFICATION TEMPLATES & POLICIES
  // ==========================================
  const [notifTemplates, setNotifTemplates] = useState<any[]>([
    {
      id: "tpl-1",
      code: "AI_ANALYSIS_READY",
      name: "Kết quả phân tích AI sẵn sàng",
      channel: "IN_APP",
      subject: "Kết quả phân tích mạch máu võng mạc đã hoàn tất",
      body: "Xin chào {patient_name}, ảnh chụp võng mạc của bạn đã được AI phân tích. Mức độ rủi ro vi mạch: {risk_level}. Vui lòng đăng nhập để xem bản đồ nhiệt Grad-CAM.",
      description:
        "Gửi tự động qua SSE và In-App ngay khi AI Inference hoàn tất",
      enabled: true,
    },
    {
      id: "tpl-2",
      code: "DOCTOR_REVIEW_APPROVED",
      name: "Bác sĩ đã ký duyệt kết quả",
      channel: "EMAIL",
      subject: "Bác sĩ chuyên khoa đã hoàn tất thẩm định ca khám",
      body: "Bác sĩ {doctor_name} đã thẩm định và ký số báo cáo y khoa của bạn. Kết luận lâm sàng: {doctor_notes}.",
      description: "Gửi thông báo khi bác sĩ hoàn thành thẩm định",
      enabled: true,
    },
    {
      id: "tpl-3",
      code: "BILLING_PAYMENT_SUCCESS",
      name: "Thanh toán gói cước thành công",
      channel: "IN_APP",
      subject: "Nạp lượt phân tích AI thành công",
      body: "Giao dịch qua cổng {payment_gateway} thành công. Tài khoản của bạn đã được cộng {credits_added} lượt phân tích.",
      description: "Gửi xác nhận sau khi nhận Webhook/IPN xác nhận thanh toán từ VietQR Napas 24/7",
      enabled: true,
    },
    {
      id: "tpl-4",
      code: "CRITICAL_VASCULAR_ALERT",
      name: "Cảnh báo vi mạch nguy cơ cao",
      channel: "SMS",
      subject: "Cảnh báo khẩn cấp: Nguy cơ tim mạch/đột quỵ cao",
      body: "AURA Cảnh báo: Chỉ số A/V Ratio ({av_ratio}) cho thấy hẹp động mạch nhỏ. Khuyến cáo khám chuyên khoa tim mạch trong 48h.",
      description: "Kích hoạt ngay khi RiskLevel là CRITICAL",
      enabled: true,
    },
  ]);

  const [commPolicy, setCommPolicy] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: true,
    highRiskImmediate: true,
    marketingOptInDefault: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    retentionDays: 90,
    notes:
      "Chính sách truyền thông tuân thủ tiêu chuẩn an toàn dữ liệu y tế HIPAA.",
  });

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    code: "",
    name: "",
    channel: "IN_APP",
    subject: "",
    body: "",
    description: "",
    enabled: true,
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [notifActionNotice, setNotifActionNotice] = useState<string | null>(
    null,
  );
  const [selectedNotifIds, setSelectedNotifIds] = useState<Set<string>>(new Set());
  const [notifPage, setNotifPage] = useState(1);
  const [notifPageSize, setNotifPageSize] = useState(6);
  const [notifToDelete, setNotifToDelete] = useState<any | null>(null);
  const [isNotifDeleteModalOpen, setIsNotifDeleteModalOpen] = useState(false);
  const [isBatchNotifDelete, setIsBatchNotifDelete] = useState(false);

  const paginatedNotifs = useMemo(() => {
    const start = (notifPage - 1) * notifPageSize;
    return notifTemplates.slice(start, start + notifPageSize);
  }, [notifTemplates, notifPage, notifPageSize]);

  const toggleSelectNotif = (id: string) => {
    setSelectedNotifIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllNotifs = () => {
    if (paginatedNotifs.length > 0 && paginatedNotifs.every((n) => selectedNotifIds.has(n.id || n.code))) {
      setSelectedNotifIds((prev) => {
        const next = new Set(prev);
        paginatedNotifs.forEach((n) => next.delete(n.id || n.code));
        return next;
      });
    } else {
      setSelectedNotifIds((prev) => {
        const next = new Set(prev);
        paginatedNotifs.forEach((n) => next.add(n.id || n.code));
        return next;
      });
    }
  };

  const loadNotifConfig = async () => {
    try {
      const [tplRes, polRes] = await Promise.all([
        adminNotificationApi.getTemplates(),
        adminNotificationApi.getPolicy(),
      ]);
      if (
        tplRes.success &&
        Array.isArray(tplRes.data) &&
        tplRes.data.length > 0
      ) {
        setNotifTemplates(tplRes.data);
      }
      if (polRes.success && polRes.data) {
        setCommPolicy(polRes.data);
      }
    } catch (e) {
      console.warn("Could not fetch notification config:", e);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (isCreatingTemplate) {
        const res = await adminNotificationApi.createTemplate(templateForm);
        if (res.success) {
          setNotifActionNotice(t('admin.templates.savedNotice', isVi ? "Đã tạo mẫu thông báo mới!" : "Notification template created successfully."));
          setIsCreatingTemplate(false);
          loadNotifConfig();
        }
      } else if (editingTemplate) {
        const res = await adminNotificationApi.updateTemplate(
          editingTemplate.id,
          templateForm,
        );
        if (res.success) {
          setNotifActionNotice(t('admin.templates.savedNotice', isVi ? "Đã cập nhật mẫu thông báo!" : "Notification template updated successfully."));
          setEditingTemplate(null);
          loadNotifConfig();
        }
      }
      setTimeout(() => setNotifActionNotice(null), 4000);
    } catch (e) {
      console.warn("Could not save template:", e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await adminNotificationApi.deleteTemplate(id);
      setNotifTemplates((prev) => prev.filter((t) => t.id !== id));
      setNotifActionNotice(t('admin.templates.savedNotice', isVi ? "Đã xóa mẫu thông báo." : "Notification template deleted."));
      setTimeout(() => setNotifActionNotice(null), 4000);
    } catch (e) {
      console.warn("Could not delete template:", e);
    }
  };

  const handleConfirmDeleteNotif = async () => {
    if (isBatchNotifDelete) {
      const ids = Array.from(selectedNotifIds);
      try {
        await Promise.all(ids.map((id) => adminNotificationApi.deleteTemplate(id)));
        setNotifTemplates((prev) => prev.filter((t) => !ids.includes(t.id) && !ids.includes(t.code)));
        setSelectedNotifIds(new Set());
        setNotifActionNotice(t('admin.templates.savedNotice', isVi ? `Đã xóa ${ids.length} mẫu thông báo thành công.` : `Deleted ${ids.length} templates successfully.`));
        setTimeout(() => setNotifActionNotice(null), 4000);
      } catch (e) {
        console.warn("Could not batch delete templates:", e);
      }
    } else if (notifToDelete) {
      await handleDeleteTemplate(notifToDelete.id || notifToDelete.code);
    }
    setIsNotifDeleteModalOpen(false);
    setNotifToDelete(null);
  };

  const handleSavePolicy = async () => {
    try {
      await adminNotificationApi.updatePolicy(commPolicy);
      setNotifActionNotice(t('admin.templates.policySavedNotice', isVi ? "Đã lưu chính sách liên lạc hệ thống!" : "Notification policies saved successfully."));
      setTimeout(() => setNotifActionNotice(null), 4000);
    } catch (e) {
      console.warn("Could not update policy:", e);
    }
  };

  // ==========================================
  // CLINIC APPROVALS (FR-22)
  // ==========================================
  const [clinicProfiles, setClinicProfiles] = useState<any[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [clinicFilterStatus, setClinicFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [clinicSearchQuery, setClinicSearchQuery] = useState("");
  const [clinicActionNotice, setClinicActionNotice] = useState<string | null>(null);
  const [isReviewingClinicId, setIsReviewingClinicId] = useState<string | null>(null);
  const [rejectModalClinic, setRejectModalClinic] = useState<any | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejectFormError, setRejectFormError] = useState<string | null>(null);

  const loadClinicProfiles = async () => {
    setClinicsLoading(true);
    try {
      const res = await adminClinicApi.list();
      setClinicProfiles(res.success && res.data ? res.data : []);
    } catch (e) {
      console.warn("Could not fetch clinic profiles:", e);
    } finally {
      setClinicsLoading(false);
    }
  };

  const handleApproveClinic = async (clinicProfileId: string) => {
    setIsReviewingClinicId(clinicProfileId);
    try {
      const res = await adminClinicApi.review(clinicProfileId, "APPROVED");
      if (res.success) {
        setClinicProfiles((prev) =>
          prev.map((c) =>
            c.id === clinicProfileId
              ? { ...c, verificationStatus: "APPROVED", rejectionReason: null }
              : c
          )
        );
        setClinicActionNotice(
          t(
            'admin.clinics.approvedSuccess',
            isVi
              ? "Đã phê duyệt hồ sơ phòng khám thành công! Quyền tổ chức sàng lọc cộng đồng đã được kích hoạt."
              : "Clinic profile approved successfully! Screening permissions activated."
          )
        );
        loadClinicProfiles();
      } else {
        setClinicActionNotice(
          res.message || (isVi ? "Phê duyệt hồ sơ thất bại." : "Approval failed.")
        );
      }
    } catch (e) {
      console.error("Error approving clinic:", e);
      setClinicActionNotice(isVi ? "Lỗi kết nối khi phê duyệt hồ sơ phòng khám." : "Error connecting to server.");
    } finally {
      setIsReviewingClinicId(null);
      setTimeout(() => setClinicActionNotice(null), 4500);
    }
  };

  const handleOpenRejectModal = (clinic: any) => {
    setRejectModalClinic(clinic);
    setRejectReasonInput(
      clinic.rejectionReason || (isVi ? "Giấy phép hành nghề chưa hợp lệ hoặc thiếu tài liệu xác thực pháp nhân." : "Invalid medical license or missing legal verification documents.")
    );
    setRejectFormError(null);
  };

  const handleConfirmRejectClinic = async () => {
    if (!rejectModalClinic) return;
    const reason = rejectReasonInput.trim();
    if (!reason) {
      setRejectFormError(isVi ? "Vui lòng nhập lý do từ chối hồ sơ." : "Please provide a rejection reason.");
      return;
    }

    const clinicId = rejectModalClinic.id;
    setIsReviewingClinicId(clinicId);
    try {
      const res = await adminClinicApi.review(clinicId, "REJECTED", reason);
      if (res.success) {
        setClinicProfiles((prev) =>
          prev.map((c) =>
            c.id === clinicId
              ? { ...c, verificationStatus: "REJECTED", rejectionReason: reason }
              : c
          )
        );
        setClinicActionNotice(
          t(
            'admin.clinics.rejectedSuccess',
            isVi ? "Đã từ chối hồ sơ phòng khám và gửi thông báo lý do." : "Clinic profile rejected."
          )
        );
        setRejectModalClinic(null);
        loadClinicProfiles();
      } else {
        setRejectFormError(res.message || (isVi ? "Từ chối hồ sơ thất bại." : "Rejection failed."));
      }
    } catch (e) {
      console.error("Error rejecting clinic:", e);
      setRejectFormError(isVi ? "Lỗi kết nối khi từ chối hồ sơ." : "Error connecting to server.");
    } finally {
      setIsReviewingClinicId(null);
      setTimeout(() => setClinicActionNotice(null), 4500);
    }
  };

  const filteredClinicProfiles = useMemo(() => {
    return clinicProfiles.filter((p) => {
      const matchStatus =
        clinicFilterStatus === "ALL" ||
        p.verificationStatus === clinicFilterStatus;

      const q = clinicSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (p.organizationName && p.organizationName.toLowerCase().includes(q)) ||
        (p.licenseNumber && p.licenseNumber.toLowerCase().includes(q));

      return matchStatus && matchQuery;
    });
  }, [clinicProfiles, clinicFilterStatus, clinicSearchQuery]);

  // ==========================================
  // FR-34: SERVICE PACKAGE MANAGEMENT STATE & HANDLERS
  // ==========================================
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [isPackagesLoading, setIsPackagesLoading] = useState(false);
  const [packageActionNotice, setPackageActionNotice] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [isCreatePackageModalOpen, setIsCreatePackageModalOpen] = useState(false);
  const [packageFilterScope, setPackageFilterScope] = useState<"ALL" | "USER" | "CLINIC">("ALL");
  const [packageSearchQuery, setPackageSearchQuery] = useState("");
  const [packageFormData, setPackageFormData] = useState({
    name: "",
    scope: "USER" as "USER" | "CLINIC",
    price: 50000,
    credits: 10,
    validityDays: 30,
    description: "",
  });
  const [packageFormError, setPackageFormError] = useState<string | null>(null);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);

  const loadPackages = async () => {
    setIsPackagesLoading(true);
    try {
      const res = await adminServicePackageApi.listAll();
      if (res.success && Array.isArray(res.data)) {
        setPackagesList(res.data);
      }
    } catch (e) {
      console.warn("Could not fetch packages:", e);
    } finally {
      setIsPackagesLoading(false);
    }
  };

  const handleCreateOrUpdatePackage = async (
    payload: ServicePackagePayload,
    packageId?: number | string,
  ): Promise<boolean> => {
    try {
      const res = packageId
        ? await adminServicePackageApi.update(packageId, payload)
        : await adminServicePackageApi.create(payload);

      if (res.success) {
        setPackageActionNotice(
          packageId
            ? t('admin.packages.packageSavedNotice', isVi ? "Cập nhật thông tin gói dịch vụ thành công." : "Service package updated successfully.")
            : t('admin.packages.packageCreatedNotice', isVi ? "Đã tạo mới gói dịch vụ thành công." : "New service package created successfully."),
        );
        setTimeout(() => setPackageActionNotice(null), 4000);
        setIsCreatePackageModalOpen(false);
        setEditingPackage(null);
        await loadPackages();
        return true;
      } else {
        setPackageActionNotice(res.message || (isVi ? "Lỗi khi lưu gói dịch vụ." : "Error saving service package."));
        setTimeout(() => setPackageActionNotice(null), 4000);
        return false;
      }
    } catch (e) {
      console.warn("Could not save package:", e);
      setPackageActionNotice(isVi ? "Lỗi hệ thống khi lưu thông tin gói dịch vụ." : "System error while saving service package.");
      setTimeout(() => setPackageActionNotice(null), 4000);
      return false;
    }
  };

  const handleTogglePackageStatus = async (
    packageId: number | string,
    currentActive: boolean,
  ) => {
    try {
      const newActive = !currentActive;
      const res = await adminServicePackageApi.setActive(packageId, newActive);
      if (res.success) {
        setPackageActionNotice(
          t('admin.packages.statusToggledNotice', isVi ? "Đã cập nhật trạng thái mở bán gói dịch vụ." : "Service package active status updated."),
        );
        setTimeout(() => setPackageActionNotice(null), 4000);
        await loadPackages();
      } else {
        setPackageActionNotice(res.message || (isVi ? "Không thể cập nhật trạng thái gói dịch vụ." : "Unable to update service package status."));
        setTimeout(() => setPackageActionNotice(null), 4000);
      }
    } catch (e) {
      console.warn("Could not toggle package status:", e);
      setPackageActionNotice(isVi ? "Lỗi hệ thống khi cập nhật trạng thái gói dịch vụ." : "System error while updating service package status.");
      setTimeout(() => setPackageActionNotice(null), 4000);
    }
  };

  const handleOpenCreatePackageModal = () => {
    setEditingPackage(null);
    setPackageFormData({
      name: "",
      scope: "USER",
      price: 50000,
      credits: 10,
      validityDays: 30,
      description: "",
    });
    setPackageFormError(null);
    setIsCreatePackageModalOpen(true);
  };

  const handleOpenEditPackageModal = (pkg: any) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name: pkg.name || "",
      scope: pkg.scope === "CLINIC" ? "CLINIC" : "USER",
      price: Number(pkg.price) || 0,
      credits: Number(pkg.credits) || 1,
      validityDays: Number(pkg.validityDays) || 30,
      description: pkg.description || "",
    });
    setPackageFormError(null);
    setIsCreatePackageModalOpen(true);
  };

  const handleSubmitPackageForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageFormData.name.trim()) {
      setPackageFormError(isVi ? "Vui lòng nhập tên gói dịch vụ." : "Please enter package name.");
      return;
    }
    if (Number(packageFormData.price) < 0) {
      setPackageFormError(isVi ? "Giá gói không được nhỏ hơn 0 VNĐ." : "Package price cannot be negative.");
      return;
    }
    if (Number(packageFormData.credits) < 1) {
      setPackageFormError(isVi ? "Số lượt phân tích tối thiểu là 1 lượt." : "Minimum credits is 1.");
      return;
    }
    if (Number(packageFormData.validityDays) < 1) {
      setPackageFormError(isVi ? "Thời hạn sử dụng tối thiểu là 1 ngày." : "Minimum validity is 1 day.");
      return;
    }

    setPackageFormError(null);
    setIsSubmittingPackage(true);
    const payload: ServicePackagePayload = {
      name: packageFormData.name.trim(),
      scope: packageFormData.scope,
      price: Number(packageFormData.price),
      credits: Number(packageFormData.credits),
      validityDays: Number(packageFormData.validityDays),
      description: packageFormData.description?.trim() || "",
    };

    await handleCreateOrUpdatePackage(
      payload,
      editingPackage ? editingPackage.id : undefined,
    );
    setIsSubmittingPackage(false);
  };

  const filteredPackages = packagesList.filter((pkg) => {
    const matchesScope =
      packageFilterScope === "ALL" ||
      (packageFilterScope === "USER" &&
        (pkg.scope === "USER" || pkg.scope === "INDIVIDUAL")) ||
      (packageFilterScope === "CLINIC" && pkg.scope === "CLINIC");

    const query = packageSearchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      (pkg.name && pkg.name.toLowerCase().includes(query)) ||
      (pkg.description && pkg.description.toLowerCase().includes(query));

    return matchesScope && matchesQuery;
  });

  const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(new Set());
  const [packagePage, setPackagePage] = useState(1);
  const [packagePageSize, setPackagePageSize] = useState(10);

  const paginatedPackages = useMemo(() => {
    const start = (packagePage - 1) * packagePageSize;
    return filteredPackages.slice(start, start + packagePageSize);
  }, [filteredPackages, packagePage, packagePageSize]);

  const toggleSelectPackage = (id: string | number) => {
    const strId = String(id);
    setSelectedPackageIds((prev) => {
      const next = new Set(prev);
      if (next.has(strId)) next.delete(strId);
      else next.add(strId);
      return next;
    });
  };

  const toggleSelectAllPackages = () => {
    if (paginatedPackages.length > 0 && paginatedPackages.every((p) => selectedPackageIds.has(String(p.id)))) {
      setSelectedPackageIds((prev) => {
        const next = new Set(prev);
        paginatedPackages.forEach((p) => next.delete(String(p.id)));
        return next;
      });
    } else {
      setSelectedPackageIds((prev) => {
        const next = new Set(prev);
        paginatedPackages.forEach((p) => next.add(String(p.id)));
        return next;
      });
    }
  };

  const handleBatchTogglePackageStatus = async (newActive: boolean) => {
    const ids = Array.from(selectedPackageIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => adminServicePackageApi.setActive(id, newActive)));
      setPackageActionNotice(
        t('admin.packages.statusToggledNotice', isVi ? `Đã cập nhật trạng thái mở bán cho ${ids.length} gói dịch vụ.` : `Updated active status for ${ids.length} packages.`)
      );
      setSelectedPackageIds(new Set());
      setTimeout(() => setPackageActionNotice(null), 4000);
      loadPackages();
    } catch (e) {
      console.warn("Could not batch toggle package status:", e);
    }
  };

  // ==========================================
  // AI CONFIG & AUDIT LOGS
  // ==========================================
  const [glaucomaSensitivity, setGlaucomaSensitivity] = useState(85);
  const [drConfidence, setDrConfidence] = useState(70);
  const [retrainThreshold, setRetrainThreshold] = useState(60);
  const [isSavedAI, setIsSavedAI] = useState(false);
  const [isSavingAI, setIsSavingAI] = useState(false);
  const [aiConfigNotice, setAiConfigNotice] = useState<string | null>(null);
  const [auditWorkspaceLogs, setAuditWorkspaceLogs] = useState<AuditLogItem[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const handleSaveAiConfig = async () => {
    setIsSavingAI(true);
    try {
      const payload = {
        sensitivityThreshold: glaucomaSensitivity,
        confidenceThreshold: drConfidence,
        avrWarningThreshold: retrainThreshold,
        autoRetrainEnabled: true,
      };
      const res = await adminUserApi.updateAiConfig(payload);
      if (res.success) {
        setIsSavedAI(true);
        setAiConfigNotice(t('admin.aiConfig.saveSuccess', isVi ? 'Đã lưu cấu hình tham số & độ nhạy AI thành công!' : 'AI model parameters saved successfully!'));
        setTimeout(() => {
          setIsSavedAI(false);
          setAiConfigNotice(null);
        }, 4000);
      } else {
        setAiConfigNotice(t('admin.aiConfig.saveError', isVi ? 'Lưu cấu hình thất bại: ' + (res.message || 'Lỗi không xác định') : 'Failed to save config'));
        setTimeout(() => setAiConfigNotice(null), 5000);
      }
    } catch (e: any) {
      setAiConfigNotice(t('admin.aiConfig.saveError', isVi ? 'Lỗi kết nối máy chủ khi lưu cấu hình AI.' : 'Server connection error while saving AI config.'));
      setTimeout(() => setAiConfigNotice(null), 5000);
    } finally {
      setIsSavingAI(false);
    }
  };

  const loadAuditData = async () => {
    setIsAuditLoading(true);
    try {
      const auditRes = await auditApi.getLogs(0, 100);
      if (auditRes.success && auditRes.data?.items) {
        const mapped: AuditLogItem[] = auditRes.data.items.map((a: any) => {
          const actionUpper = (a.action || "").toUpperCase();
          const isFailed = (a.status || "").toUpperCase() === "FAILED";
          let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
          if (
            isFailed ||
            actionUpper.includes("DELETE") ||
            actionUpper.includes("SECURITY") ||
            actionUpper.includes("LOCK") ||
            actionUpper.includes("OVERRIDE")
          ) {
            severity = "CRITICAL";
          } else if (
            actionUpper.includes("UPDATE") ||
            actionUpper.includes("REJECT") ||
            actionUpper.includes("WARN")
          ) {
            severity = "WARNING";
          }

          return {
            id: a.id ? String(a.id) : `LOG-${Math.random().toString(36).substring(2, 8)}`,
            timestamp: a.createdAt || new Date().toISOString(),
            actor: a.userEmail || (a.userId ? String(a.userId) : (isVi ? "Hệ thống" : "System")),
            role: a.actorRole || "USER",
            action: a.action || (isVi ? "Thao tác hệ thống" : "System action"),
            resource: a.resourceType
              ? `${a.resourceType}${a.resourceId ? ` (#${String(a.resourceId).slice(0, 8)})` : ""}`
              : a.details || (isVi ? "Hệ thống" : "System"),
            severity,
            status: isFailed ? "FAILED" : "SUCCESS",
            ipAddress: a.ipAddress || "—",
          };
        });
        setAuditWorkspaceLogs(mapped);
      }
      const configRes = await adminUserApi.getAiConfig();
      if (configRes.success && configRes.data) {
        setGlaucomaSensitivity(
          Number(configRes.data.sensitivityThreshold || 85),
        );
        setDrConfidence(Number(configRes.data.confidenceThreshold || 70));
        setRetrainThreshold(Number(configRes.data.avrWarningThreshold || 60));
      }
    } catch (e) {
      console.warn("Could not fetch audit/config:", e);
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRbacRoles();
    loadNotifConfig();
    loadClinicProfiles();
    loadAuditData();
    loadPackages();
  }, []);

  const handleExportLogs = async () => {
    try {
      const res = await auditApi.exportLogs();
      const exportData = res.success && Array.isArray(res.data) ? res.data : auditWorkspaceLogs;

      const sanitizeCsvCell = (val: string): string => {
        if (!val) return '';
        const trimmed = String(val).trim();
        const escaped = trimmed.replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(escaped)) {
          return `"'${escaped}"`;
        }
        return `"${escaped}"`;
      };

      const csvHeader = isVi
        ? "Mã Log,Thời Gian,Mức Độ,Hành Động,Tài Nguyên,Người Thực Hiện,IP,Trạng Thái"
        : "Log ID,Timestamp,Severity,Action,Resource,Actor,IP,Status";

      const csvRows = [
        csvHeader,
        ...exportData.map((l: any) =>
          [
            sanitizeCsvCell(l.id),
            sanitizeCsvCell(l.timestamp || l.createdAt || ''),
            sanitizeCsvCell(l.severity || 'INFO'),
            sanitizeCsvCell(l.action || l.title || ''),
            sanitizeCsvCell(l.resource || l.resourceType || l.details || ''),
            sanitizeCsvCell(l.actor || l.userEmail || l.user || (isVi ? 'Hệ thống' : 'System')),
            sanitizeCsvCell(l.ipAddress || l.ip || ''),
            sanitizeCsvCell(l.status === 'SUCCESS' ? (isVi ? 'Thành công' : 'SUCCESS') : (isVi ? 'Thất bại' : 'FAILED')),
          ].join(',')
        ),
      ].join('\r\n');

      const blob = new Blob(['\uFEFF' + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AURA_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Export failed:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-clinical-border shadow-medical-card flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-700 uppercase tracking-widest block">
            {t('admin.dashboardTitle', isVi ? 'Bảng Điều Khiển Quản Trị Hệ Thống' : 'System Administration Dashboard')}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-clinical-text mt-1">
            {isVi ? 'Quản Trị Hệ Thống & Bảo Mật AURA' : 'AURA Security & Administration'}
          </h1>
          <p className="text-xs text-clinical-text-muted mt-0.5">
            {t('admin.dashboardSubtitle', isVi ? 'Quản lý tài khoản, ma trận phân quyền RBAC, gói dịch vụ và nhật ký HIPAA.' : 'Account management, RBAC matrix, service packages, and HIPAA audit.')}
          </p>
        </div>

        {/* Global Tabs - Segmented Control */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl border border-clinical-border text-xs">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "users"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <Users className="w-4 h-4" /> {t('admin.tabs.users', isVi ? 'Tài Khoản' : 'Accounts')}
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "rbac"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> {t('admin.tabs.rbac', isVi ? 'Phân Quyền' : 'RBAC Matrix')}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "notifications"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <Bell className="w-4 h-4" /> {t('admin.tabs.notifications', isVi ? 'Thông Báo' : 'Notifications')}
          </button>
          <button
            onClick={() => setActiveTab("clinics")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "clinics"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <Building2 className="w-4 h-4" /> {t('admin.tabs.clinics', isVi ? 'Duyệt Phòng Khám' : 'Clinic Approvals')}
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "packages"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <CreditCard className="w-4 h-4" /> {t('admin.tabs.packages', isVi ? 'Gói Dịch Vụ' : 'Service Packages')}
          </button>
          <button
            onClick={() => setActiveTab("ai-config")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "ai-config"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <Settings className="w-4 h-4" /> {t('admin.tabs.aiConfig', isVi ? 'Cấu Hình AI' : 'AI Config')}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <FileText className="w-4 h-4" /> {t('admin.tabs.audit', isVi ? 'Nhật Ký HIPAA' : 'HIPAA Audit')}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: USER MANAGEMENT (FR-31)
      ========================================================================== */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-700" /> {t('admin.userManagement.title', isVi ? 'Quản lý tài khoản' : 'User Accounts')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('admin.userManagement.subtitle', isVi ? 'Quản lý trạng thái, thông tin và phân quyền người dùng hệ thống.' : 'Manage account status, profiles, and role assignments.')}
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t('common.refresh', isVi ? 'Làm mới' : 'Refresh')}
            </button>
          </div>

          {userActionNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{userActionNotice}</span>
            </div>
          )}

          {/* Search & Role Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={t('admin.userManagement.searchPlaceholder', isVi ? 'Tìm kiếm theo tên hoặc email...' : 'Search by name or email...')}
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <ClinicalSelect<string>
                value={userRoleFilter}
                onChange={setUserRoleFilter}
                options={userRoleFilterOptions}
                size="sm"
                className="w-56"
              />
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl h-8 shrink-0"
              >
                {t('admin.userManagement.filterBtn', isVi ? 'Lọc' : 'Filter')}
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.id))}
                        onChange={toggleSelectAllUsers}
                        className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                        aria-label={isVi ? "Chọn tất cả" : "Select all"}
                      />
                    </th>
                    <th className="p-3.5">{isVi ? 'Họ & Tên / Email' : 'Name / Email'}</th>
                    <th className="p-3.5">{t('admin.audit.columns.role', isVi ? 'Vai Trò' : 'Role')}</th>
                    <th className="p-3.5">{isVi ? 'Khoa / Đơn Vị' : 'Department / Facility'}</th>
                    <th className="p-3.5">{t('admin.userManagement.phoneLabel', isVi ? 'Số Điện Thoại' : 'Phone Number')}</th>
                    <th className="p-3.5">{t('admin.audit.columns.status', isVi ? 'Trạng Thái' : 'Status')}</th>
                    <th className="p-3.5 text-right">{isVi ? 'Thao Tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        {t('admin.userManagement.emptyUsers', isVi ? 'Không tìm thấy tài khoản người dùng nào.' : 'No user accounts found.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isSelected = selectedUserIds.has(u.id);
                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${isSelected ? "bg-cyan-50/40" : "hover:bg-slate-50/80"}`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(u.id)}
                              className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                              aria-label={`Select ${u.name}`}
                            />
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {u.email}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${getRoleBadgeClass(u.role)}`}
                            >
                              {formatRoleLabel(u.role)}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">{u.department}</td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {u.phoneNumber || t('admin.userManagement.notUpdated', isVi ? 'Chưa cập nhật' : 'Not updated')}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-rose-100 text-rose-800 border border-rose-300"
                              }`}
                            >
                              {u.status === "ACTIVE"
                                ? t('admin.userManagement.activeStatus', isVi ? "HOẠT ĐỘNG" : "ACTIVE")
                                : t('admin.userManagement.suspendedStatus', isVi ? "VÔ HIỆU HÓA" : "SUSPENDED")}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditFormData({
                                  fullName: u.name,
                                  phoneNumber: u.phoneNumber || "",
                                  address: u.address || "",
                                });
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                              title={isVi ? "Chỉnh sửa thông tin" : "Edit details"}
                            >
                              {t('admin.userManagement.editUser', isVi ? 'Sửa' : 'Edit')}
                            </button>
                            <button
                              onClick={() => {
                                setRoleChangeUser(u);
                                setSelectedNewRole(normalizeRole(u.role));
                              }}
                              className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-lg text-xs cursor-pointer"
                              title={isVi ? "Chuyển đổi vai trò" : "Change user role"}
                            >
                              {t('admin.userManagement.changeRoleBtn', isVi ? 'Đổi Vai Trò' : 'Change Role')}
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className={`px-2.5 py-1.5 font-bold rounded-lg text-xs text-white cursor-pointer ${
                                u.status === "ACTIVE"
                                  ? "bg-rose-600 hover:bg-rose-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {u.status === "ACTIVE"
                                ? t('admin.userManagement.lockAccount', isVi ? "Khóa" : "Suspend")
                                : t('admin.userManagement.unlockAccount', isVi ? "Kích hoạt" : "Activate")}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <Pagination
                currentPage={userPage}
                totalPages={Math.max(1, Math.ceil(filteredUsers.length / userPageSize))}
                totalItems={filteredUsers.length}
                pageSize={userPageSize}
                onPageChange={setUserPage}
                onPageSizeChange={(sz) => {
                  setUserPageSize(sz);
                  setUserPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel={isVi ? 'tài khoản' : 'accounts'}
              />
            )}
          </div>

          {/* Sticky Batch Floating Action Toolbar */}
          {selectedUserIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold">
                  {isVi
                    ? `Đã chọn ${selectedUserIds.size} / ${filteredUsers.length} tài khoản`
                    : `Selected ${selectedUserIds.size} / ${filteredUsers.length} accounts`}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-700" />
              <button
                onClick={() => setSelectedUserIds(new Set())}
                className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {isVi ? 'Bỏ chọn' : 'Deselect'}
              </button>
              <button
                onClick={() => handleBatchToggleUserStatus(false)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                {isVi ? `Khóa (${selectedUserIds.size})` : `Suspend (${selectedUserIds.size})`}
              </button>
              <button
                onClick={() => handleBatchToggleUserStatus(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                {isVi ? `Kích hoạt (${selectedUserIds.size})` : `Activate (${selectedUserIds.size})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {t('admin.userManagement.editModalTitle', isVi ? 'Chỉnh Sửa Hồ Sơ Tài Khoản' : 'Edit Account Profile')}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.userManagement.emailLabel', isVi ? 'Email đăng nhập' : 'Login Email')}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.userManagement.fullNameLabel', isVi ? 'Họ và tên' : 'Full Name')}
                </label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.userManagement.phoneLabel', isVi ? 'Số điện thoại liên hệ' : 'Phone Number')}
                </label>
                <input
                  type="text"
                  value={editFormData.phoneNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.userManagement.addressLabel', isVi ? 'Địa chỉ / Cơ sở y tế' : 'Address / Facility')}
                </label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      address: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
              </button>
              <button
                onClick={handleSaveUserEdit}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
              >
                {t('admin.userManagement.saveChanges', isVi ? 'Lưu Thay Đổi' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE CHANGE MODAL */}
      {roleChangeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {t('admin.userManagement.roleModalTitle', isVi ? 'Phân Quyền Vai Trò' : 'Assign User Role')}
              </h3>
              <button
                onClick={() => setRoleChangeUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {t('admin.userManagement.roleModalDesc', isVi ? 'Chọn vai trò hệ thống mới cho tài khoản:' : 'Select new system role for account:')}{" "}
              <strong>{roleChangeUser.email}</strong>
            </p>
            <div className="space-y-2">
              {[
                { id: "ROLE_USER", label: isVi ? "Bệnh nhân" : "Patient" },
                {
                  id: "ROLE_DOCTOR",
                  label: isVi ? "Bác sĩ chuyên khoa" : "Specialist Doctor",
                },
                {
                  id: "ROLE_CLINIC",
                  label: isVi ? "Tổ chức phòng khám" : "Clinic Organization",
                },
                { id: "ROLE_ADMIN", label: isVi ? "Quản trị viên" : "Administrator" },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-bold ${
                    selectedNewRole === r.id
                      ? "border-cyan-600 bg-cyan-50/50 text-cyan-900"
                      : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="roleOption"
                    value={r.id}
                    checked={selectedNewRole === r.id}
                    onChange={(e) => setSelectedNewRole(e.target.value)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setRoleChangeUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
              </button>
              <button
                onClick={handleSaveUserRole}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
              >
                {t('admin.userManagement.confirmRoleBtn', isVi ? 'Xác Nhận Đổi' : 'Confirm Change')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RBAC ROLE & PERMISSION MATRIX (FR-32)
      ========================================================================== */}
      {activeTab === "rbac" && (() => {
        const cleanSelected = selectedRbacRole.replace(/^ROLE_/, "").toUpperCase();
        const currentRoleObj = rbacRoles.find(
          (r) => {
            const rName = String(r.name || r.roleName || "").replace(/^ROLE_/, "").toUpperCase();
            return rName === cleanSelected || r.roleName === selectedRbacRole;
          },
        );

        return (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-700" /> {t('admin.rbac.rolePermissionMatrix', isVi ? 'Ma trận phân quyền hệ thống' : 'Role Permissions')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('admin.rbac.subtitle', isVi ? 'Thiết lập quyền truy cập cho từng vai trò người dùng trong hệ thống.' : 'Configure access permissions for each user role.')}
                </p>
              </div>
              <button
                onClick={handleSaveRolePermissions}
                disabled={isSavingRbac}
                className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                  isSavingRbac ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isSavingRbac ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSavingRbac
                  ? (isVi ? 'Đang lưu...' : 'Saving...')
                  : t('admin.rbac.saveMatrix', isVi ? 'Lưu Ma Trận Quyền' : 'Save Permission Matrix')}
              </button>
            </div>

            {rbacSavedNotice && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rbacSavedNotice}</span>
              </div>
            )}

            {/* Role Selector Tabs */}
            <div className="overflow-x-auto pb-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-[320px]">
                {rbacRoles.map((r) => {
                  const cleanName = String(r.name || r.roleName || "").replace(/^ROLE_/, "").toUpperCase();
                  const isSelected = cleanSelected === cleanName;
                  const activeCount = (r.permissions || []).filter((p: any) => p.enabled).length;
                  const totalCount = (r.permissions || []).length;

                  return (
                    <button
                      key={r.roleName || r.name || r.id}
                      type="button"
                      onClick={() => setSelectedRbacRole(r.roleName || `ROLE_${cleanName}`)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-cyan-600 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 line-clamp-1">
                            {r.displayName || r.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                            isSelected ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                            {cleanName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {t('admin.rbac.activePermissions', isVi ? 'Quyền kích hoạt:' : 'Active permissions:')}
                        </span>
                        <span className="text-[11px] font-bold font-mono text-cyan-800">
                          {activeCount}/{totalCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{t('admin.rbac.permissionCatalogTitle', isVi ? 'Danh Mục Quyền Hạn Cho Vai Trò:' : 'Permission Catalog for Role:')}</span>
                    <span className="px-2.5 py-0.5 bg-cyan-700 text-white rounded-lg font-mono text-xs font-bold">
                      {currentRoleObj?.displayName || selectedRbacRole}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isVi
                      ? `Đang bật ${(currentRoleObj?.permissions || []).filter((p: any) => p.enabled).length} trên tổng số ${(currentRoleObj?.permissions || []).length} quyền hạn.`
                      : `Active: ${(currentRoleObj?.permissions || []).filter((p: any) => p.enabled).length} of ${(currentRoleObj?.permissions || []).length} permissions.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllPermissionsForRole(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 transition-colors cursor-pointer"
                  >
                    {isVi ? 'Bật tất cả' : 'Enable All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllPermissionsForRole(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  >
                    {isVi ? 'Tắt tất cả' : 'Disable All'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(currentRoleObj?.permissions || []).map((perm: any) => {
                  const isChecked = Boolean(perm.enabled);
                  return (
                    <div
                      key={perm.code}
                      onClick={() => handleTogglePermission(perm.code)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        isChecked
                          ? "border-cyan-400 bg-cyan-50/40 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.code)}
                        className="mt-1 w-4 h-4 text-cyan-700 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-bold text-xs line-clamp-1 ${isChecked ? "text-cyan-950" : "text-slate-800"}`}>
                            {perm.name || perm.label || perm.code}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 shrink-0">
                            {perm.group || (isVi ? 'Quyền hạn' : 'Permission')}
                          </span>
                        </div>
                        {perm.desc && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {perm.desc}
                          </p>
                        )}
                        <div className="font-mono text-[10px] text-slate-400 mt-1.5 flex items-center gap-2">
                          <span>CODE: {perm.code}</span>
                          <span className={`font-semibold ${isChecked ? "text-emerald-600" : "text-slate-400"}`}>
                            • {isChecked ? (isVi ? 'Đang kích hoạt' : 'Enabled') : (isVi ? 'Đã tắt' : 'Disabled')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 3: NOTIFICATION TEMPLATES & POLICIES (FR-39)
      ========================================================================== */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {notifActionNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notifActionNotice}</span>
            </div>
          )}

          {/* Section 1: Notification Templates */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-700" /> {t('admin.templates.notificationTemplates', isVi ? 'Mẫu thông báo' : 'Notification Templates')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('admin.templates.subtitle', isVi ? 'Cấu hình nội dung tin nhắn mẫu qua Email, SMS và In-App.' : 'Configure message templates for Email, SMS, and In-App.')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifTemplates.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllNotifs}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    {paginatedNotifs.length > 0 && paginatedNotifs.every((n) => selectedNotifIds.has(n.id || n.code))
                      ? (isVi ? 'Bỏ chọn trang này' : 'Deselect Page')
                      : (isVi ? 'Chọn tất cả trang' : 'Select All on Page')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsCreatingTemplate(true);
                    setEditingTemplate(null);
                    setTemplateForm({
                      code: "",
                      name: "",
                      channel: "IN_APP",
                      subject: "",
                      body: "",
                      description: "",
                      enabled: true,
                    });
                  }}
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {t('admin.templates.addTemplate', isVi ? 'Thêm Mẫu Mới' : 'Add New Template')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedNotifs.map((tpl) => {
                const tplKey = tpl.id || tpl.code;
                const isSelected = selectedNotifIds.has(tplKey);
                return (
                  <div
                    key={tplKey}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-50/30 shadow-xs"
                        : "border-slate-200 bg-white hover:border-cyan-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectNotif(tplKey)}
                          className="mt-1 w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                          aria-label={`Select ${tpl.name}`}
                        />
                        <div>
                          <span className="font-mono text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                            {tpl.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                            {tpl.name}
                          </h4>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          tpl.channel === "IN_APP"
                            ? "bg-blue-100 text-blue-800"
                            : tpl.channel === "EMAIL"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {tpl.channel}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                      <div className="font-bold text-slate-900 mb-1">
                        {t('admin.templates.subjectPrefix', isVi ? 'Tiêu đề:' : 'Subject:')} {tpl.subject}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                        {tpl.body}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {t('admin.templates.statusPrefix', isVi ? 'Trạng thái:' : 'Status:')}{" "}
                        {tpl.enabled
                          ? t('admin.templates.activeStatus', isVi ? "Đang kích hoạt" : "Active")
                          : t('admin.templates.inactiveStatus', isVi ? "Tạm tắt" : "Disabled")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTemplate(tpl);
                            setIsCreatingTemplate(false);
                            setTemplateForm({
                              code: tpl.code,
                              name: tpl.name,
                              channel: tpl.channel,
                              subject: tpl.subject,
                              body: tpl.body,
                              description: tpl.description || "",
                              enabled: tpl.enabled ?? true,
                            });
                          }}
                          className="p-1.5 text-slate-600 hover:text-cyan-700 cursor-pointer"
                          title={t('admin.templates.edit', isVi ? 'Chỉnh sửa mẫu' : 'Edit template')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setNotifToDelete(tpl);
                            setIsBatchNotifDelete(false);
                            setIsNotifDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title={t('admin.templates.delete', isVi ? 'Xóa mẫu' : 'Delete template')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination for Templates */}
            {notifTemplates.length > 0 && (
              <Pagination
                currentPage={notifPage}
                totalPages={Math.max(1, Math.ceil(notifTemplates.length / notifPageSize))}
                totalItems={notifTemplates.length}
                pageSize={notifPageSize}
                onPageChange={setNotifPage}
                onPageSizeChange={(sz) => {
                  setNotifPageSize(sz);
                  setNotifPage(1);
                }}
                pageSizeOptions={[4, 6, 12, 24]}
                itemLabel={isVi ? 'mẫu thông báo' : 'notification templates'}
              />
            )}
          </div>

          {/* Sticky Batch Floating Action Toolbar for Notifications */}
          {selectedNotifIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold">
                  {isVi
                    ? `Đã chọn ${selectedNotifIds.size} / ${notifTemplates.length} mẫu`
                    : `Selected ${selectedNotifIds.size} / ${notifTemplates.length} templates`}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-700" />
              <button
                onClick={() => setSelectedNotifIds(new Set())}
                className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {isVi ? 'Bỏ chọn' : 'Deselect'}
              </button>
              <button
                onClick={() => {
                  setIsBatchNotifDelete(true);
                  setNotifToDelete(null);
                  setIsNotifDeleteModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isVi ? `Xóa Đã Chọn (${selectedNotifIds.size})` : `Delete Selected (${selectedNotifIds.size})`}
              </button>
            </div>
          )}

          {/* Delete Template Confirmation Modal */}
          <Modal
            isOpen={isNotifDeleteModalOpen}
            onClose={() => {
              setIsNotifDeleteModalOpen(false);
              setNotifToDelete(null);
            }}
            title={isVi ? "Xác nhận xóa mẫu thông báo" : "Confirm Delete Template"}
            maxWidth="sm"
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBatchNotifDelete
                  ? (isVi
                      ? `Bạn có chắc chắn muốn xóa ${selectedNotifIds.size} mẫu thông báo đã chọn không? Thao tác này không thể hoàn tác.`
                      : `Are you sure you want to delete ${selectedNotifIds.size} selected templates? This action cannot be undone.`)
                  : (isVi
                      ? `Bạn có chắc chắn muốn xóa mẫu thông báo "${notifToDelete?.name || notifToDelete?.code}" không?`
                      : `Are you sure you want to delete template "${notifToDelete?.name || notifToDelete?.code}"?`)}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsNotifDeleteModalOpen(false);
                    setNotifToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
                </button>
                <button
                  onClick={handleConfirmDeleteNotif}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isVi ? 'Xóa Vĩnh Viễn' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Section 2: Communication Policy */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-700" /> {t('admin.templates.policiesTitle', isVi ? 'Chính sách gửi tin' : 'Message Policies')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('admin.templates.policiesSubtitle', isVi ? 'Thiết lập kích hoạt kênh và quy tắc cảnh báo y tế khẩn cấp.' : 'Configure channels and emergency medical alerts.')}
                </p>
              </div>
              <button
                onClick={handleSavePolicy}
                className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {t('admin.templates.savePolicies', isVi ? 'Lưu Chính Sách' : 'Save Policies')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Channel Switches */}
              <div className="p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {t('admin.templates.activeChannelsTitle', isVi ? 'Kênh Liên Lạc Kích Hoạt' : 'Active Communication Channels')}
                </h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>{t('admin.templates.inAppChannelLabel', isVi ? 'Thông báo ứng dụng (In-App)' : 'In-App Notifications')}</span>
                  <input
                    type="checkbox"
                    checked={commPolicy.inAppEnabled}
                    onChange={(e) =>
                      setCommPolicy({
                        ...commPolicy,
                        inAppEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>{t('admin.templates.emailChannelLabel', isVi ? 'Email y tế (Kết quả & Báo cáo PDF)' : 'Medical Email (Results & PDF)')}</span>
                  <input
                    type="checkbox"
                    checked={commPolicy.emailEnabled}
                    onChange={(e) =>
                      setCommPolicy({
                        ...commPolicy,
                        emailEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>{t('admin.templates.smsChannelLabel', isVi ? 'Tin nhắn SMS (Cảnh báo nguy cơ cao)' : 'Emergency SMS (High risk alerts)')}</span>
                  <input
                    type="checkbox"
                    checked={commPolicy.smsEnabled}
                    onChange={(e) =>
                      setCommPolicy({
                        ...commPolicy,
                        smsEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                </label>
              </div>

              {/* Priority & Quiet Hours */}
              <div className="p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  {t('admin.templates.emergencyRulesTitle', isVi ? 'Quy Tắc Khẩn Cấp & Giờ Yên Tĩnh' : 'Emergency Rules & Quiet Hours')}
                </h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {t('admin.templates.criticalAlertLabel', isVi ? 'Cảnh báo khẩn cấp nguy cơ rất cao (Critical)' : 'Emergency Alert for Critical Risk')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t('admin.templates.criticalAlertDesc', isVi ? 'Ưu tiên phát tức thời bất kể giờ yên tĩnh' : 'Immediate delivery regardless of quiet hours')}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={commPolicy.highRiskImmediate}
                    onChange={(e) =>
                      setCommPolicy({
                        ...commPolicy,
                        highRiskImmediate: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                </label>

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {t('admin.templates.quietStartLabel', isVi ? 'Giờ bắt đầu yên tĩnh' : 'Quiet hours start')}
                    </label>
                    <input
                      type="time"
                      value={commPolicy.quietHoursStart}
                      onChange={(e) =>
                        setCommPolicy({
                          ...commPolicy,
                          quietHoursStart: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {t('admin.templates.quietEndLabel', isVi ? 'Giờ kết thúc yên tĩnh' : 'Quiet hours end')}
                    </label>
                    <input
                      type="time"
                      value={commPolicy.quietHoursEnd}
                      onChange={(e) =>
                        setCommPolicy({
                          ...commPolicy,
                          quietHoursEnd: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t('admin.templates.retentionLabel', isVi ? 'Thời gian lưu trữ thông báo (Ngày)' : 'Notification Retention Period (Days)')}
                  </label>
                  <input
                    type="number"
                    value={commPolicy.retentionDays}
                    onChange={(e) =>
                      setCommPolicy({
                        ...commPolicy,
                        retentionDays: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPSERT NOTIFICATION TEMPLATE */}
      {(isCreatingTemplate || editingTemplate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {isCreatingTemplate
                  ? t('admin.templates.modalCreateTitle', isVi ? "Tạo Mẫu Thông Báo Mới" : "Create New Notification Template")
                  : t('admin.templates.modalEditTitle', isVi ? "Chỉnh Sửa Mẫu Thông Báo" : "Edit Notification Template")}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingTemplate(false);
                  setEditingTemplate(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t('admin.templates.codeLabel', isVi ? 'Mã định danh' : 'Template Code')}
                  </label>
                  <input
                    type="text"
                    value={templateForm.code}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, code: e.target.value })
                    }
                    placeholder="VD: AI_READY_SMS"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <ClinicalSelect<string>
                    label={t('admin.templates.channelLabel', isVi ? 'Kênh thông báo' : 'Notification Channel')}
                    value={templateForm.channel}
                    onChange={(val) =>
                      setTemplateForm({
                        ...templateForm,
                        channel: val,
                      })
                    }
                    options={notificationChannelOptions}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.templates.nameLabel', isVi ? 'Tên mẫu hiển thị' : 'Template Name')}
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                  placeholder={isVi ? "VD: Thông báo kết quả AI hoàn tất" : "e.g. AI analysis completed notice"}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.templates.subjectLabel', isVi ? 'Tiêu đề tin nhắn' : 'Message Subject')}
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      subject: e.target.value,
                    })
                  }
                  placeholder={isVi ? "VD: Kết quả phân tích mạch máu võng mạc" : "e.g. Retinal microvascular evaluation result"}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('admin.templates.bodyLabel', isVi ? 'Nội dung chi tiết' : 'Message Body')}
                </label>
                <textarea
                  rows={4}
                  value={templateForm.body}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, body: e.target.value })
                  }
                  placeholder={isVi ? "Hỗ trợ biến số: {patient_name}, {risk_level}, {screening_id}, {doctor_notes}" : "Supported variables: {patient_name}, {risk_level}, {screening_id}, {doctor_notes}"}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-sans"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreatingTemplate(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
              >
                {t('admin.templates.saveTemplateBtn', isVi ? 'Lưu Mẫu' : 'Save Template')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CLINIC APPROVALS (FR-22)
      ========================================================================== */}
      {activeTab === "clinics" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-700" /> {t('admin.clinics.title', isVi ? 'Phê duyệt phòng khám' : 'Clinic Approvals')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('admin.clinics.subtitle', isVi ? 'Xét duyệt giấy phép và cấp quyền sàng lọc cho cơ sở y tế.' : 'Review medical operating licenses and approve screening permissions.')}
              </p>
            </div>
            <button
              onClick={loadClinicProfiles}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
              title={isVi ? "Tải lại danh sách" : "Refresh list"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${clinicsLoading ? 'animate-spin text-cyan-700' : 'text-slate-500'}`} />
              <span>{isVi ? 'Làm mới' : 'Refresh'}</span>
            </button>
          </div>

          {/* Action Notice Alert */}
          {clinicActionNotice && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                {clinicActionNotice}
              </span>
              <button
                type="button"
                onClick={() => setClinicActionNotice(null)}
                className="text-teal-700 hover:text-teal-950 font-bold px-2 py-0.5 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { id: "ALL", label: isVi ? "Tất cả" : "All", count: clinicProfiles.length },
                  { id: "PENDING", label: isVi ? "Chờ duyệt" : "Pending", count: clinicProfiles.filter(c => c.verificationStatus === 'PENDING').length },
                  { id: "APPROVED", label: isVi ? "Đã duyệt" : "Approved", count: clinicProfiles.filter(c => c.verificationStatus === 'APPROVED').length },
                  { id: "REJECTED", label: isVi ? "Đã từ chối" : "Rejected", count: clinicProfiles.filter(c => c.verificationStatus === 'REJECTED').length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setClinicFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    clinicFilterStatus === tab.id
                      ? "bg-white text-cyan-800 shadow-xs border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${clinicFilterStatus === tab.id ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={clinicSearchQuery}
                onChange={(e) => setClinicSearchQuery(e.target.value)}
                placeholder={isVi ? "Tìm phòng khám, mã giấy phép..." : "Search clinic, license..."}
                className="w-full h-8.5 pl-8 pr-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {clinicsLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 text-cyan-700 animate-spin mx-auto" />
              <p>{t('admin.clinics.loading', isVi ? 'Đang tải danh sách hồ sơ phòng khám...' : 'Loading clinic profiles...')}</p>
            </div>
          ) : filteredClinicProfiles.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p>{t('admin.clinics.empty', isVi ? 'Không tìm thấy hồ sơ phòng khám nào phù hợp.' : 'No matching clinic profiles found.')}</p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {filteredClinicProfiles.map((p) => {
                const isApproved = p.verificationStatus === 'APPROVED';
                const isRejected = p.verificationStatus === 'REJECTED';
                const isPending = !isApproved && !isRejected;
                const isProcessing = isReviewingClinicId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                      isApproved
                        ? 'bg-emerald-50/20 border-emerald-200/70 hover:border-emerald-300'
                        : isRejected
                        ? 'bg-rose-50/20 border-rose-200/70 hover:border-rose-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {p.organizationName}
                        </h4>

                        {/* Status Badge */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 select-none">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {isVi ? 'Đã duyệt' : 'Approved'}
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 select-none">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            {isVi ? 'Đã từ chối' : 'Rejected'}
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 select-none">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {isVi ? 'Chờ duyệt' : 'Pending'}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 pl-10.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          {t('admin.clinics.licenseLabel', isVi ? 'Giấy phép số:' : 'License No:')}{' '}
                          <span className="font-mono-data font-semibold text-slate-700">
                            {p.licenseNumber || t('admin.clinics.notProvided', isVi ? 'Chưa cung cấp' : 'Not provided')}
                          </span>
                        </span>

                        {p.licenseDocumentUrl && (
                          <a
                            href={p.licenseDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900 hover:underline font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isVi ? 'Xem hồ sơ đính kèm' : 'View License Doc'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        {p.reviewedByName && (
                          <span className="text-slate-400">
                            • {isVi ? 'Người duyệt:' : 'Reviewed by:'} <span className="text-slate-600 font-medium">{p.reviewedByName}</span>
                          </span>
                        )}
                      </div>

                      {/* Rejection Reason Notice if any */}
                      {isRejected && p.rejectionReason && (
                        <div className="mt-2 ml-10.5 p-2.5 bg-rose-50 rounded-xl border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">{isVi ? 'Lý do từ chối: ' : 'Rejection Reason: '}</span>
                            <span>{p.rejectionReason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center pl-10.5 md:pl-0">
                      {isApproved ? (
                        <>
                          <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-200 select-none">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{isVi ? 'Đang hoạt động' : 'Active'}</span>
                          </div>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleOpenRejectModal(p)}
                            className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 hover:text-rose-900 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isVi ? 'Thu hồi / Từ chối' : 'Revoke'}
                          </button>
                        </>
                      ) : isRejected ? (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApproveClinic(p.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isVi ? 'Phê duyệt lại' : 'Re-Approve'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleOpenRejectModal(p)}
                            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-xl transition-all cursor-pointer"
                          >
                            {isVi ? 'Sửa lý do' : 'Edit Reason'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApproveClinic(p.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{t('admin.clinics.approve', isVi ? 'Phê Duyệt' : 'Approve')}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleOpenRejectModal(p)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('admin.clinics.reject', isVi ? 'Từ Chối' : 'Reject')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejection Modal with Reason Input */}
          <Modal
            isOpen={Boolean(rejectModalClinic)}
            onClose={() => !isReviewingClinicId && setRejectModalClinic(null)}
            maxWidth="md"
            title={isVi ? 'Từ chối hồ sơ pháp nhân phòng khám' : 'Reject Clinic Application'}
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold">
                  {isVi ? 'Cơ sở y tế: ' : 'Organization: '}
                  <span className="text-slate-900">{rejectModalClinic?.organizationName}</span>
                </p>
                <p className="text-amber-800 text-[11px]">
                  {isVi
                    ? 'Hồ sơ bị từ chối sẽ nhận được thông báo kèm lý do dưới đây và có thể chỉnh sửa để nộp lại.'
                    : 'The clinic will be notified with the reason below and can update their profile.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-800">
                  {isVi ? 'Lý do từ chối (bắt buộc):' : 'Rejection reason (required):'}
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonInput}
                  onChange={(e) => {
                    setRejectReasonInput(e.target.value);
                    if (rejectFormError) setRejectFormError(null);
                  }}
                  placeholder={isVi ? "Ví dụ: Giấy phép hành nghề chưa được cấp phép hoặc hết hạn..." : "e.g. Invalid medical operating license..."}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 text-xs"
                />
                {rejectFormError && (
                  <p className="text-rose-600 font-semibold text-[11px]">{rejectFormError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={Boolean(isReviewingClinicId)}
                  onClick={() => setRejectModalClinic(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  {t('common.cancel', isVi ? 'Hủy' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={Boolean(isReviewingClinicId)}
                  onClick={handleConfirmRejectClinic}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isReviewingClinicId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isVi ? 'Xác nhận từ chối' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* =========================================================================
          TAB: SERVICE PACKAGE MANAGEMENT (FR-34)
      ========================================================================== */}
      {activeTab === "packages" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-700" /> {t('admin.packages.servicePackageList', isVi ? 'Gói dịch vụ & Biểu phí' : 'Service Packages')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('admin.packages.subtitle', isVi ? 'Cấu hình gói sàng lọc, số lượt phân tích và hạn mức sử dụng.' : 'Configure screening packages, analysis credits, and validity periods.')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadPackages}
                disabled={isPackagesLoading}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all disabled:opacity-50"
                title={t('admin.packages.refreshTooltip', isVi ? 'Làm mới danh sách gói' : 'Refresh package list')}
              >
                <RefreshCw className={`w-4 h-4 ${isPackagesLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleOpenCreatePackageModal}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> {t('admin.packages.createPackage', isVi ? 'Tạo Gói Dịch Vụ Mới' : 'Create New Service Package')}
              </button>
            </div>
          </div>

          {/* Action Notice */}
          {packageActionNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{packageActionNotice}</span>
              </div>
              <button
                onClick={() => setPackageActionNotice(null)}
                className="text-emerald-500 hover:text-emerald-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 block">{t('admin.packages.totalPackages', isVi ? 'Tổng Số Gói' : 'Total Packages')}</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block font-mono-data">
                {packagesList.length}
              </span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-emerald-700 block">{t('admin.packages.activePackages', isVi ? 'Đang Mở Bán' : 'Active Packages')}</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block font-mono-data">
                {packagesList.filter((p) => p.active).length}
              </span>
            </div>
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-blue-700 block">{t('admin.packages.userPackages', isVi ? 'Gói Cá Nhân' : 'Individual Packages')}</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block font-mono-data">
                {packagesList.filter((p) => p.scope === "INDIVIDUAL" || p.scope === "USER").length}
              </span>
            </div>
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-purple-700 block">{t('admin.packages.clinicPackages', isVi ? 'Gói Phòng Khám' : 'Clinic Packages')}</span>
              <span className="text-2xl font-black text-purple-700 mt-1 block font-mono-data">
                {packagesList.filter((p) => p.scope === "CLINIC").length}
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={packageSearchQuery}
                onChange={(e) => setPackageSearchQuery(e.target.value)}
                placeholder={t('admin.packages.searchPlaceholder', isVi ? 'Tìm kiếm gói dịch vụ theo tên, mã...' : 'Search packages by name, code...')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-cyan-600 focus:bg-white transition-all"
              />
            </div>
            <ClinicalSelect<string>
              value={packageFilterScope}
              onChange={(val) => setPackageFilterScope(val as any)}
              options={packageScopeOptions}
              size="sm"
              className="w-48 shrink-0"
            />
          </div>

          {/* Table */}
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedPackages.length > 0 && paginatedPackages.every((p) => selectedPackageIds.has(String(p.id)))}
                        onChange={toggleSelectAllPackages}
                        className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                        aria-label={isVi ? "Chọn tất cả gói" : "Select all packages"}
                      />
                    </th>
                    <th className="p-3.5">{t('admin.packages.packageName', isVi ? 'Tên Gói Dịch Vụ' : 'Package Name')}</th>
                    <th className="p-3.5">{isVi ? 'Phạm Vi' : 'Scope'}</th>
                    <th className="p-3.5">{t('admin.packages.price', isVi ? 'Giá Niêm Yết' : 'Price')}</th>
                    <th className="p-3.5">{t('admin.packages.quota', isVi ? 'Số Lượt Phân Tích' : 'Screening Credits')}</th>
                    <th className="p-3.5">{t('admin.packages.validity', isVi ? 'Hạn Dùng' : 'Validity')}</th>
                    <th className="p-3.5">{t('admin.audit.columns.status', isVi ? 'Trạng Thái' : 'Status')}</th>
                    <th className="p-3.5 text-right">{isVi ? 'Thao Tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isPackagesLoading && packagesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-600" />
                        {t('admin.packages.loadingList', isVi ? 'Đang tải danh sách gói dịch vụ...' : 'Loading service package list...')}
                      </td>
                    </tr>
                  ) : filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        {t('admin.packages.emptyFiltered', isVi ? 'Không có gói dịch vụ nào phù hợp điều kiện lọc.' : 'No service packages match the filter criteria.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedPackages.map((pkg) => {
                      const isClinic = pkg.scope === "CLINIC";
                      const isSelected = selectedPackageIds.has(String(pkg.id));
                      return (
                        <tr
                          key={pkg.id}
                          className={`transition-colors ${isSelected ? "bg-cyan-50/40" : "hover:bg-slate-50/80"}`}
                        >
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectPackage(pkg.id)}
                              className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                              aria-label={`Select ${pkg.name}`}
                            />
                          </td>
                          <td className="p-3.5 max-w-[240px]">
                            <span className="font-bold text-slate-900 block text-sm">{pkg.name}</span>
                            {pkg.description && (
                              <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={pkg.description}>
                                {pkg.description}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isClinic ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> {isVi ? 'Phòng khám' : 'Clinic'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                                <User className="w-3 h-3" /> {isVi ? 'Cá nhân' : 'Individual'}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold font-mono-data text-slate-900">
                            {Number(pkg.price || 0).toLocaleString(isVi ? "vi-VN" : "en-US")} ₫
                          </td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono-data">
                              {pkg.credits} {t('admin.packages.creditsUnit', isVi ? 'lượt' : 'credits')}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono-data text-slate-600">
                            {pkg.validityDays > 0 ? `${pkg.validityDays} ${t('admin.packages.days', isVi ? 'ngày' : 'days')}` : t('admin.packages.lifetime', isVi ? 'Vĩnh viễn' : 'Lifetime')}
                          </td>
                          <td className="p-3.5">
                            {pkg.active ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t('admin.packages.active', isVi ? 'Đang bán' : 'Active')}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                {t('admin.packages.inactive', isVi ? 'Tạm ngưng' : 'Inactive')}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPackageModal(pkg)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                                title={isVi ? "Chỉnh sửa thông tin gói" : "Edit package"}
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600" /> {isVi ? 'Sửa' : 'Edit'}
                              </button>
                              <button
                                onClick={() => handleTogglePackageStatus(pkg.id, pkg.active)}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all border cursor-pointer ${
                                  pkg.active
                                    ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                }`}
                                title={pkg.active ? (isVi ? "Tạm ngưng mở bán gói" : "Deactivate package") : (isVi ? "Kích hoạt mở bán gói" : "Activate package")}
                              >
                                {pkg.active ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" /> {t('admin.packages.deactivateBtn', isVi ? 'Ngưng bán' : 'Deactivate')}
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" /> {t('admin.packages.activateBtn', isVi ? 'Mở bán' : 'Activate')}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredPackages.length > 0 && (
              <Pagination
                currentPage={packagePage}
                totalPages={Math.max(1, Math.ceil(filteredPackages.length / packagePageSize))}
                totalItems={filteredPackages.length}
                pageSize={packagePageSize}
                onPageChange={setPackagePage}
                onPageSizeChange={(sz) => {
                  setPackagePageSize(sz);
                  setPackagePage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel={isVi ? 'gói dịch vụ' : 'packages'}
              />
            )}
          </div>

          {/* Sticky Batch Floating Action Toolbar for Packages */}
          {selectedPackageIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-semibold">
                  {isVi
                    ? `Đã chọn ${selectedPackageIds.size} / ${filteredPackages.length} gói dịch vụ`
                    : `Selected ${selectedPackageIds.size} / ${filteredPackages.length} packages`}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-700" />
              <button
                onClick={() => setSelectedPackageIds(new Set())}
                className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                {isVi ? 'Bỏ chọn' : 'Deselect'}
              </button>
              <button
                onClick={() => handleBatchTogglePackageStatus(false)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                {isVi ? `Ngưng bán (${selectedPackageIds.size})` : `Deactivate (${selectedPackageIds.size})`}
              </button>
              <button
                onClick={() => handleBatchTogglePackageStatus(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                {isVi ? `Mở bán (${selectedPackageIds.size})` : `Activate (${selectedPackageIds.size})`}
              </button>
            </div>
          )}

          {/* Modal Form: Create / Edit Package */}
          {isCreatePackageModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {editingPackage
                          ? t('admin.packages.editModalTitle', isVi ? "Chỉnh Sửa Gói Dịch Vụ" : "Edit Service Package")
                          : t('admin.packages.createModalTitle', isVi ? "Tạo Gói Dịch Vụ Mới" : "Create New Package")}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {editingPackage
                          ? `ID: #${editingPackage.id}`
                          : t('admin.packages.createModalSubtitle', isVi ? "Định nghĩa gói sàng lọc và mức biểu phí" : "Define screening package quotas and pricing tier")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreatePackageModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmitPackageForm} className="p-6 space-y-4">
                  {packageFormError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{packageFormError}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('admin.packages.nameLabel', isVi ? 'Tên gói dịch vụ' : 'Package Name')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={packageFormData.name}
                      onChange={(e) => setPackageFormData({ ...packageFormData, name: e.target.value })}
                      placeholder={isVi ? "VD: Gói Sàng Lọc Cá Nhân Tiêu Chuẩn" : "e.g. Standard Patient Screening Package"}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-cyan-600"
                      required
                    />
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('admin.packages.scopeLabel', isVi ? 'Đối tượng áp dụng' : 'Target Audience')} <span className="text-rose-500">*</span>
                    </label>
                    {editingPackage ? (
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>{packageFormData.scope === "CLINIC" ? (isVi ? "Phòng khám & Cơ sở y tế" : "Clinic Organization") : (isVi ? "Người dùng cá nhân" : "Individual Patient")}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({isVi ? "Phạm vi gói cố định sau khi tạo" : "Scope is locked after creation"})</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPackageFormData({ ...packageFormData, scope: "USER" })}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                            packageFormData.scope === "USER"
                              ? "bg-blue-50 border-blue-300 text-blue-800 shadow-xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <User className="w-4 h-4 text-blue-600" />
                          <span>{isVi ? "Cá nhân" : "Individual"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPackageFormData({ ...packageFormData, scope: "CLINIC" })}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                            packageFormData.scope === "CLINIC"
                              ? "bg-purple-50 border-purple-300 text-purple-800 shadow-xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span>{isVi ? "Phòng khám" : "Clinic"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Price & Credits Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('admin.packages.priceLabel', isVi ? 'Đơn giá (VNĐ)' : 'Price (VND)')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={packageFormData.price}
                        onChange={(e) => setPackageFormData({ ...packageFormData, price: Number(e.target.value) })}
                        placeholder="50000"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data focus:outline-none focus:border-cyan-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('admin.packages.creditsLabel', isVi ? 'Số lượt sàng lọc' : 'Screening Credits')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={packageFormData.credits}
                        onChange={(e) => setPackageFormData({ ...packageFormData, credits: Number(e.target.value) })}
                        placeholder="10"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data focus:outline-none focus:border-cyan-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Validity Days */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('admin.packages.validityLabel', isVi ? 'Thời hạn sử dụng (Ngày, 0 = Vĩnh viễn)' : 'Validity (Days, 0 = Lifetime)')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={packageFormData.validityDays}
                      onChange={(e) => setPackageFormData({ ...packageFormData, validityDays: Number(e.target.value) })}
                      placeholder="30"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-mono-data focus:outline-none focus:border-cyan-600"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('admin.packages.descLabel', isVi ? 'Mô tả chi tiết' : 'Description')}
                    </label>
                    <textarea
                      rows={3}
                      value={packageFormData.description}
                      onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })}
                      placeholder={isVi ? "Mô tả quyền lợi gói, bao gồm bản đồ nhiệt Grad-CAM, báo cáo PDF và tư vấn bác sĩ..." : "Describe package benefits, including Grad-CAM heatmaps, PDF reports, and doctor consultation..."}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-cyan-600 resize-none"
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreatePackageModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      {t('common.cancel', isVi ? 'Hủy bỏ' : 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPackage}
                      className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isSubmittingPackage ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {editingPackage ? t('admin.packages.saveBtn', isVi ? "Lưu Thay Đổi" : "Save Changes") : t('admin.packages.createBtn', isVi ? "Tạo Gói Mới" : "Create Package")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: AI CDS CONFIG (FR-38)
      ========================================================================== */}
      {activeTab === "ai-config" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-700" /> {t('admin.aiConfig.title', isVi ? 'Cấu hình tham số AI' : 'AI Configuration')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('admin.aiConfig.subtitle', isVi ? 'Điều chỉnh độ nhạy và ngưỡng cảnh báo lâm sàng của mô hình AI.' : 'Adjust clinical alert triggers and AI model sensitivity.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700">
                {t('admin.aiConfig.glaucomaSensitivity', isVi ? 'Độ Nhạy Sàng Lọc Glaucoma/CVD' : 'Glaucoma / CVD Screening Sensitivity')} ({glaucomaSensitivity}%)
              </span>
              <input
                type="range"
                min="50"
                max="99"
                value={glaucomaSensitivity}
                onChange={(e) => setGlaucomaSensitivity(Number(e.target.value))}
                className="w-full accent-cyan-700"
              />
              <p className="text-[11px] text-slate-500">
                {t('admin.aiConfig.glaucomaHint', isVi ? 'Tối ưu phát hiện sớm các tổn thương co thắt tiểu động mạch.' : 'Optimizes early detection of arteriolar narrowing and focal constrictions.')}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700">
                {t('admin.aiConfig.drConfidence', isVi ? 'Ngưỡng Tin Cậy Bệnh Võng Mạc ĐTĐ' : 'Diabetic Retinopathy Confidence Threshold')} ({drConfidence}%)
              </span>
              <input
                type="range"
                min="40"
                max="95"
                value={drConfidence}
                onChange={(e) => setDrConfidence(Number(e.target.value))}
                className="w-full accent-cyan-700"
              />
              <p className="text-[11px] text-slate-500">
                {t('admin.aiConfig.drHint', isVi ? 'Yêu cầu AI đạt độ tin cậy tối thiểu trước khi xuất phân loại lâm sàng.' : 'Requires minimum AI model confidence before outputting clinical classification.')}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700">
                {t('admin.aiConfig.retrainThreshold', isVi ? 'Ngưỡng Cảnh Báo Co Thắt A/V Ratio' : 'A/V Ratio Constriction Alert Threshold')} ({retrainThreshold}%)
              </span>
              <input
                type="range"
                min="30"
                max="80"
                value={retrainThreshold}
                onChange={(e) => setRetrainThreshold(Number(e.target.value))}
                className="w-full accent-cyan-700"
              />
              <p className="text-[11px] text-slate-500">
                {t('admin.aiConfig.retrainHint', isVi ? 'Kích hoạt cảnh báo nguy cơ tăng huyết áp khi A/V Ratio dưới ngưỡng.' : 'Triggers hypertensive microvascular alert when A/V Ratio is below threshold.')}
              </p>
            </div>
          </div>

          {/* VULN-10 FIX: Nút hành động Lưu Cấu Hình & Thông Báo Phản Hồi */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {aiConfigNotice && (
                <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 ${
                  isSavedAI ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isSavedAI ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{aiConfigNotice}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setGlaucomaSensitivity(85);
                  setDrConfidence(70);
                  setRetrainThreshold(60);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {t('admin.aiConfig.resetBtn', isVi ? 'Khôi phục mặc định' : 'Reset')}
              </button>
              <button
                type="button"
                onClick={handleSaveAiConfig}
                disabled={isSavingAI}
                className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isSavingAI ? t('common.saving', isVi ? 'Đang lưu...' : 'Saving...') : t('admin.aiConfig.saveBtn', isVi ? 'Lưu cấu hình' : 'Save Config')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: HIPAA AUDIT LOGS (FR-37, NFR-18)
      ========================================================================== */}
      {activeTab === "audit" && (
        <AdminAuditWorkspace
          logs={auditWorkspaceLogs}
          loading={isAuditLoading}
          onRefresh={loadAuditData}
          onExportLogs={handleExportLogs}
        />
      )}
    </div>
  );
};
