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
  Send,
  Check,
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
    { value: "USER", label: t('admin.packages.scopeUser', isVi ? "Cá nhân" : "Individual (Patient)") },
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
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
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
        50,
        userSearchQuery || undefined,
        roleParam,
      );
      if (userRes.success && userRes.data?.items) {
        setUsersList(
          userRes.data.items.map((u: any) => ({
            id: u.id,
            name: u.fullName || u.email,
            email: u.email,
            role: u.roles?.[0] || "ROLE_USER",
            status: u.active ? "ACTIVE" : "SUSPENDED",
            phoneNumber: u.phoneNumber || "",
            address: u.address || "",
            department:
              u.roles?.[0] === "ROLE_DOCTOR"
                ? (isVi ? "Khoa Mắt & Tim Mạch" : "Ophthalmology & Cardiology")
                : u.roles?.[0] === "ROLE_CLINIC"
                  ? (isVi ? "Phòng Khám Đa Khoa" : "General Clinic")
                  : u.roles?.[0] === "ROLE_ADMIN"
                    ? (isVi ? "Ban Quản Trị Hệ Thống" : "System Administration")
                    : (isVi ? "Cổng Bệnh Nhân" : "Patient Portal"),
            exams: u.totalScreenings || 0,
          })),
        );
      }
    } catch (e) {
      console.warn("Could not fetch users:", e);
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
    try {
      const res = await adminUserApi.updateRole(
        roleChangeUser.id,
        selectedNewRole,
      );
      if (res.success) {
        setUserActionNotice(
          t('admin.userManagement.roleUpdatedSuccess', isVi ? `Đã thay đổi vai trò tài khoản thành ${selectedNewRole}.` : `User role changed to ${selectedNewRole}.`),
        );
        setTimeout(() => setUserActionNotice(null), 4000);
        setRoleChangeUser(null);
        loadUsers();
      }
    } catch (e) {
      console.warn("Could not update user role:", e);
    }
  };

  // ==========================================
  // FR-32: RBAC ROLES & PERMISSIONS MATRIX
  // ==========================================
  const [rbacRoles, setRbacRoles] = useState<any[]>([
    {
      roleName: "ROLE_ADMIN",
      description:
        "Quản trị viên toàn quyền hệ thống AURA, quản lý người dùng và tham số AI",
      permissions: [
        "SCREENING_READ",
        "SCREENING_CREATE",
        "GRADCAM_VIEW",
        "DOCTOR_REVIEW",
        "BILLING_READ",
        "PACKAGE_PURCHASE",
        "USER_MANAGE",
        "ROLE_CONFIG",
        "AI_THRESHOLD_UPDATE",
        "AUDIT_EXPORT",
        "NOTIFICATION_MANAGE",
      ],
    },
    {
      roleName: "ROLE_DOCTOR",
      description:
        "Bác sĩ chuyên khoa Mắt & Tim mạch, thẩm định lâm sàng và chẩn đoán CDS",
      permissions: [
        "SCREENING_READ",
        "SCREENING_CREATE",
        "GRADCAM_VIEW",
        "DOCTOR_REVIEW",
        "DIGITAL_SIGNATURE",
        "ICD10_DIAGNOSE",
        "CONSULTATION_CHAT",
      ],
    },
    {
      roleName: "ROLE_CLINIC",
      description:
        "Tổ chức phòng khám, thực hiện sàng lọc cộng đồng hàng loạt và quản lý bác sĩ cơ sở",
      permissions: [
        "SCREENING_READ",
        "SCREENING_CREATE",
        "GRADCAM_VIEW",
        "BULK_SCREENING",
        "CLINIC_MEMBER_MANAGE",
        "BILLING_READ",
        "PACKAGE_PURCHASE",
      ],
    },
    {
      roleName: "ROLE_USER",
      description:
        "Bệnh nhân cá nhân, tải ảnh chụp đáy mắt và nhận kết quả sàng lọc AI",
      permissions: [
        "SCREENING_READ",
        "SCREENING_CREATE",
        "GRADCAM_VIEW",
        "CONSULTATION_CHAT",
        "BILLING_READ",
        "PACKAGE_PURCHASE",
      ],
    },
  ]);
  const [selectedRbacRole, setSelectedRbacRole] = useState("ROLE_DOCTOR");
  const [rbacSavedNotice, setRbacSavedNotice] = useState<string | null>(null);

  const permissionCatalog = useMemo<{ code: string; name: string; group: string }[]>(() => [
    {
      code: "SCREENING_READ",
      name: isVi ? "Xem kết quả phân tích AI & Biomarkers" : "View AI Analysis Results & Biomarkers",
      group: isVi ? "Chẩn đoán AI" : "AI Diagnostics",
    },
    {
      code: "SCREENING_CREATE",
      name: isVi ? "Tải ảnh đáy mắt & Chạy suy luận AI" : "Upload Fundus Images & Run AI Inference",
      group: isVi ? "Chẩn đoán AI" : "AI Diagnostics",
    },
    {
      code: "GRADCAM_VIEW",
      name: isVi ? "Xem bản đồ nhiệt Grad-CAM vi mạch" : "View Grad-CAM Retinal Microvascular Heatmaps",
      group: isVi ? "Chẩn đoán AI" : "AI Diagnostics",
    },
    {
      code: "BULK_SCREENING",
      name: isVi ? "Sàng lọc hàng loạt (≥100 ảnh/lô)" : "Bulk Screening (≥100 scans/batch)",
      group: isVi ? "Chẩn đoán AI" : "AI Diagnostics",
    },
    {
      code: "DOCTOR_REVIEW",
      name: isVi ? "Thẩm định & Điều chỉnh mức nguy cơ" : "Review & Override Clinical Risk Levels",
      group: isVi ? "Lâm sàng" : "Clinical",
    },
    {
      code: "DIGITAL_SIGNATURE",
      name: isVi ? "Ký số báo cáo y khoa chuẩn HMAC" : "HMAC Digital Signature for Medical Reports",
      group: isVi ? "Lâm sàng" : "Clinical",
    },
    {
      code: "ICD10_DIAGNOSE",
      name: isVi ? "Gán mã bệnh ICD-10 (H35.0, I10)" : "Assign ICD-10 Diagnostic Codes (H35.0, I10)",
      group: isVi ? "Lâm sàng" : "Clinical",
    },
    {
      code: "CONSULTATION_CHAT",
      name: isVi ? "Nhắn tin tư vấn trực tuyến" : "Online Clinical Consultation Messaging",
      group: isVi ? "Lâm sàng" : "Clinical",
    },
    {
      code: "BILLING_READ",
      name: isVi ? "Xem gói dịch vụ & Lịch sử giao dịch" : "View Service Packages & Transaction History",
      group: isVi ? "Thanh toán" : "Billing",
    },
    {
      code: "PACKAGE_PURCHASE",
      name: isVi ? "Mua/gia hạn gói qua VNPay / MoMo" : "Purchase/Renew Packages via VNPay / MoMo",
      group: isVi ? "Thanh toán" : "Billing",
    },
    {
      code: "USER_MANAGE",
      name: isVi ? "Kích hoạt / Khóa / Sửa tài khoản" : "Activate / Suspend / Edit User Accounts",
      group: isVi ? "Quản trị" : "Administration",
    },
    {
      code: "ROLE_CONFIG",
      name: isVi ? "Cấu hình ma trận phân quyền RBAC" : "Configure RBAC Permission Matrix",
      group: isVi ? "Quản trị" : "Administration",
    },
    {
      code: "AI_THRESHOLD_UPDATE",
      name: isVi ? "Điều chỉnh độ nhạy AI & Ngưỡng cảnh báo" : "Adjust AI Sensitivity & Warning Thresholds",
      group: isVi ? "Quản trị" : "Administration",
    },
    {
      code: "NOTIFICATION_MANAGE",
      name: isVi ? "Quản lý mẫu thông báo & Chính sách" : "Manage Notification Templates & Policies",
      group: isVi ? "Quản trị" : "Administration",
    },
    {
      code: "AUDIT_EXPORT",
      name: isVi ? "Xuất báo cáo nhật ký kiểm toán HIPAA" : "Export HIPAA Audit Trail Reports",
      group: isVi ? "Quản trị" : "Administration",
    },
  ], [isVi]);

  const loadRbacRoles = async () => {
    try {
      const res = await adminRoleApi.getRoles();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setRbacRoles(res.data);
      }
    } catch (e) {
      console.warn("Could not fetch RBAC roles:", e);
    }
  };

  const handleTogglePermission = (permissionCode: string) => {
    setRbacRoles((prev) =>
      prev.map((r) => {
        if (r.roleName !== selectedRbacRole) return r;
        const perms = r.permissions || [];
        const exists = perms.includes(permissionCode);
        const nextPerms = exists
          ? perms.filter((p: string) => p !== permissionCode)
          : [...perms, permissionCode];
        return { ...r, permissions: nextPerms };
      }),
    );
  };

  const handleSaveRolePermissions = async () => {
    const currentRoleObj = rbacRoles.find(
      (r) => r.roleName === selectedRbacRole,
    );
    if (!currentRoleObj) return;
    try {
      await adminRoleApi.updatePermissions(
        selectedRbacRole,
        currentRoleObj.permissions,
      );
      setRbacSavedNotice(
        t('admin.rbac.savedSuccess', isVi ? `Đã lưu cấu hình phân quyền cho vai trò ${selectedRbacRole}!` : `Permissions saved for role ${selectedRbacRole}!`),
      );
      setTimeout(() => setRbacSavedNotice(null), 4000);
    } catch (e) {
      console.warn("Could not save permissions:", e);
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
      description: "Gửi xác nhận sau khi nhận IPN/Webhook từ VNPay/MoMo",
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
  const [clinicActionMessage, setClinicActionMessage] = useState<
    Record<string, string>
  >({});
  const [rejectReasonDraft, setRejectReasonDraft] = useState<
    Record<string, string>
  >({});

  const loadClinicProfiles = async () => {
    setClinicsLoading(true);
    try {
      const res = await adminClinicApi.list();
      setClinicProfiles(res.success && res.data ? res.data : []);
    } catch (e) {
      console.warn("Could not fetch clinic profiles:", e);
    }
    setClinicsLoading(false);
  };

  const handleApproveClinic = async (clinicProfileId: string) => {
    const res = await adminClinicApi.review(clinicProfileId, "APPROVED");
    setClinicActionMessage((prev) => ({
      ...prev,
      [clinicProfileId]: res.success
        ? t('admin.clinics.approvedSuccess', isVi ? "Đã phê duyệt hồ sơ." : "Clinic profile approved.")
        : res.message || (isVi ? "Phê duyệt thất bại." : "Approval failed."),
    }));
    if (res.success) loadClinicProfiles();
  };

  const handleRejectClinic = async (clinicProfileId: string) => {
    const reason = rejectReasonDraft[clinicProfileId]?.trim();
    if (!reason) {
      setClinicActionMessage((prev) => ({
        ...prev,
        [clinicProfileId]: isVi ? "Vui lòng nhập lý do từ chối." : "Please provide a rejection reason.",
      }));
      return;
    }
    const res = await adminClinicApi.review(
      clinicProfileId,
      "REJECTED",
      reason,
    );
    setClinicActionMessage((prev) => ({
      ...prev,
      [clinicProfileId]: res.success
        ? t('admin.clinics.rejectedSuccess', isVi ? "Đã từ chối hồ sơ." : "Clinic profile rejected.")
        : res.message || (isVi ? "Từ chối thất bại." : "Rejection failed."),
    }));
    if (res.success) loadClinicProfiles();
  };

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

  // ==========================================
  // AI CONFIG & AUDIT LOGS
  // ==========================================
  const [glaucomaSensitivity, setGlaucomaSensitivity] = useState(85);
  const [drConfidence, setDrConfidence] = useState(70);
  const [retrainThreshold, setRetrainThreshold] = useState(60);
  const [isSavedAI, setIsSavedAI] = useState(false);
  const [auditWorkspaceLogs, setAuditWorkspaceLogs] = useState<AuditLogItem[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

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
          <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">
            {t('admin.dashboardTitle', isVi ? 'Bảng Điều Khiển Quản Trị Hệ Thống' : 'System Administration Dashboard')}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-clinical-text mt-1">
            AURA Security & Administration
          </h1>
          <p className="text-xs text-clinical-text-muted mt-0.5">
            {t('admin.dashboardSubtitle', isVi ? 'Quản trị tài khoản, Ma trận phân quyền RBAC, Mẫu thông báo & Chính sách' : 'Account Management, RBAC Permission Matrix, Notification Templates & Policies')}
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
            <Settings className="w-4 h-4" /> {t('admin.tabs.aiConfig', isVi ? 'Cấu Hình AI' : 'AI Configuration')}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-white shadow-xs text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900 font-normal hover:bg-slate-200/50"
            }`}
          >
            <FileText className="w-4 h-4" /> {t('admin.tabs.audit', isVi ? 'Nhật Ký HIPAA' : 'HIPAA Audit Logs')}
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
                <Users className="w-5 h-5 text-cyan-700" /> {t('admin.userManagement.title', isVi ? 'Quản Lý Tài Khoản Người Dùng, Bác Sĩ & Phòng Khám' : 'User, Doctor & Clinic Account Management')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('admin.userManagement.subtitle', isVi ? 'Kích hoạt, vô hiệu hóa, chỉnh sửa thông tin hồ sơ và gán vai trò người dùng trong hệ thống AURA.' : 'Activate, suspend, edit profile details and assign user roles in the AURA system.')}
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
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">{isVi ? 'Họ & Tên / Email' : 'Name / Email'}</th>
                  <th className="p-3.5">{t('admin.audit.columns.role', isVi ? 'Vai Trò' : 'Role')}</th>
                  <th className="p-3.5">{isVi ? 'Khoa / Đơn Vị' : 'Department / Facility'}</th>
                  <th className="p-3.5">{t('admin.userManagement.phoneLabel', isVi ? 'Số Điện Thoại' : 'Phone Number')}</th>
                  <th className="p-3.5">{t('admin.audit.columns.status', isVi ? 'Trạng Thái' : 'Status')}</th>
                  <th className="p-3.5 text-right">{isVi ? 'Thao Tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {t('admin.userManagement.emptyUsers', isVi ? 'Không tìm thấy tài khoản người dùng nào.' : 'No user accounts found.')}
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {u.email}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${
                            u.role === "ROLE_ADMIN"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : u.role === "ROLE_DOCTOR"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : u.role === "ROLE_CLINIC"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {u.role === "ROLE_ADMIN"
                            ? (isVi ? "Quản trị viên" : "Administrator")
                            : u.role === "ROLE_DOCTOR"
                              ? (isVi ? "Bác sĩ" : "Doctor")
                              : u.role === "ROLE_CLINIC"
                                ? (isVi ? "Phòng khám" : "Clinic")
                                : (isVi ? "Bệnh nhân" : "Patient")}
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
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                          title={isVi ? "Chỉnh sửa thông tin" : "Edit details"}
                        >
                          {t('admin.userManagement.editUser', isVi ? 'Sửa' : 'Edit')}
                        </button>
                        <button
                          onClick={() => {
                            setRoleChangeUser(u);
                            setSelectedNewRole(u.role);
                          }}
                          className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-lg text-xs"
                          title={isVi ? "Chuyển đổi vai trò" : "Change user role"}
                        >
                          {t('admin.userManagement.changeRoleBtn', isVi ? 'Đổi Vai Trò' : 'Change Role')}
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2.5 py-1.5 font-bold rounded-lg text-xs text-white ${
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
                  ))
                )}
              </tbody>
            </table>
          </div>
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
      {activeTab === "rbac" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-700" /> {t('admin.rbac.rolePermissionMatrix', isVi ? 'Định Nghĩa Vai Trò & Ma Trận Phân Quyền RBAC' : 'Role Definition & RBAC Permission Matrix')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('admin.rbac.subtitle', isVi ? 'Thiết lập quyền truy cập cho từng vai trò người dùng theo từng phân hệ chức năng.' : 'Configure access permissions for each user role across system clinical modules.')}
              </p>
            </div>
            <button
              onClick={handleSaveRolePermissions}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {t('admin.rbac.saveMatrix', isVi ? 'Lưu Ma Trận Quyền' : 'Save Permission Matrix')}
            </button>
          </div>

          {rbacSavedNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{rbacSavedNotice}</span>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-[320px]">
              {rbacRoles.map((r) => {
                const isSelected = selectedRbacRole === r.roleName;
                const roleDesc =
                  r.roleName === "ROLE_ADMIN"
                    ? (isVi ? "Quản trị viên toàn quyền quản lý hệ thống, cấu hình tham số và nhật ký bảo mật" : "Full system administrator with configuration and security audit rights")
                    : r.roleName === "ROLE_DOCTOR"
                      ? (isVi ? "Bác sĩ chuyên khoa Mắt & Tim mạch, thẩm định lâm sàng và chẩn đoán" : "Ophthalmology & Cardiology specialist, clinical verification and diagnosis")
                      : r.roleName === "ROLE_CLINIC"
                        ? (isVi ? "Tổ chức phòng khám, thực hiện sàng lọc cộng đồng hàng loạt và quản lý bác sĩ cơ sở" : "Clinic organization conducting bulk community screenings and staff management")
                        : (isVi ? "Bệnh nhân cá nhân, tải ảnh chụp đáy mắt và nhận kết quả sàng lọc AI" : "Individual patient uploading retinal fundus scans and receiving AI reports");
                return (
                  <button
                    key={r.roleName}
                    onClick={() => setSelectedRbacRole(r.roleName)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/50 shadow-xs"
                        : "border-clinical-border hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-mono font-bold text-xs text-slate-900">
                      {r.roleName}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {roleDesc}
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-brand-700">
                      {(r.permissions || []).length} {t('admin.rbac.activePermissions', isVi ? 'Quyền kích hoạt' : 'Active permissions')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-clinical-text">
              {t('admin.rbac.permissionCatalogTitle', isVi ? 'Danh Mục Quyền Hạn Cho Vai Trò:' : 'Permission Catalog for Role:')}{" "}
              <span className="font-mono text-brand-700 font-bold">
                {selectedRbacRole}
              </span>
            </h3>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-[280px]">
                {permissionCatalog.map((perm) => {
                  const currentRoleObj = rbacRoles.find(
                    (r) => r.roleName === selectedRbacRole,
                  );
                  const isChecked = (currentRoleObj?.permissions || []).includes(
                    perm.code,
                  );

                  return (
                    <div
                      key={perm.code}
                      onClick={() => handleTogglePermission(perm.code)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? "border-brand-400 bg-brand-50/40 shadow-xs"
                          : "border-clinical-border bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.code)}
                        className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {perm.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 shrink-0">
                            {perm.group}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-clinical-text-muted mt-0.5">
                          {perm.code}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <Bell className="w-5 h-5 text-cyan-700" /> {t('admin.templates.notificationTemplates', isVi ? 'Mẫu Thông Báo Hệ Thống' : 'System Notification Templates')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('admin.templates.subtitle', isVi ? 'Định nghĩa nội dung tin nhắn và biến số thay thế tự động ({patient_name}, {risk_level}, {credits}) cho các kênh Email, In-App và SMS.' : 'Define message content and automated substitution variables ({patient_name}, {risk_level}, {credits}) for Email, In-App, and SMS channels.')}
                </p>
              </div>
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
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> {t('admin.templates.addTemplate', isVi ? 'Thêm Mẫu Mới' : 'Add New Template')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifTemplates.map((tpl) => (
                <div
                  key={tpl.id || tpl.code}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-cyan-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                        {tpl.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                        {tpl.name}
                      </h4>
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
                        className="p-1.5 text-slate-600 hover:text-cyan-700"
                        title={t('admin.templates.edit', isVi ? 'Chỉnh sửa mẫu' : 'Edit template')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                        title={t('admin.templates.delete', isVi ? 'Xóa mẫu' : 'Delete template')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Communication Policy */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-700" /> {t('admin.templates.policiesTitle', isVi ? 'Chính Sách & Quy Tắc Gửi Tin Nhắn' : 'Communication Policy & Message Rules')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('admin.templates.policiesSubtitle', isVi ? 'Cấu hình kích hoạt các kênh gửi tin theo sự kiện lâm sàng và ngưỡng an toàn y tế.' : 'Configure channel triggers based on clinical events and medical safety thresholds.')}
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
                  <span>{t('admin.templates.inAppChannelLabel', isVi ? 'Kênh Trong Ứng Dụng (Thông báo tức thời trên giao diện)' : 'In-App Channel (Real-time interface notifications)')}</span>
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
                  <span>{t('admin.templates.emailChannelLabel', isVi ? 'Kênh Email Y Tế (Kết quả khám & Báo cáo PDF)' : 'Medical Email Channel (Screening results & PDF reports)')}</span>
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
                  <span>{t('admin.templates.smsChannelLabel', isVi ? 'Kênh SMS Khẩn Cấp (Cảnh báo nguy cơ cao)' : 'Emergency SMS Channel (High-risk critical alerts)')}</span>
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
                    {t('admin.templates.codeLabel', isVi ? 'Mã định danh (Code)' : 'Template Code')}
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
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-700" /> {t('admin.clinics.title', isVi ? 'Phê Duyệt Hồ Sơ Phòng Khám' : 'Clinic Profile Approvals')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('admin.clinics.subtitle', isVi ? 'Kiểm tra giấy phép hành nghề và phê duyệt quyền tổ chức sàng lọc cộng đồng cho các cơ sở y tế.' : 'Review medical operating licenses and approve bulk screening permissions for healthcare facilities.')}
            </p>
          </div>

          {clinicsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {t('admin.clinics.loading', isVi ? 'Đang tải hồ sơ phòng khám...' : 'Loading clinic profiles...')}
            </div>
          ) : clinicProfiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {t('admin.clinics.empty', isVi ? 'Không có hồ sơ phòng khám nào chờ duyệt.' : 'No clinic profiles awaiting approval.')}
            </div>
          ) : (
            <div className="grid gap-4">
              {clinicProfiles.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {p.organizationName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t('admin.clinics.licenseLabel', isVi ? 'Giấy phép số:' : 'License No:')} {p.licenseNumber || t('admin.clinics.notProvided', isVi ? 'Chưa cung cấp' : 'Not provided')}
                    </p>
                    <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {p.verificationStatus === 'APPROVED' ? (isVi ? 'Đã duyệt' : 'Approved') : p.verificationStatus === 'REJECTED' ? (isVi ? 'Đã từ chối' : 'Rejected') : (isVi ? 'Chờ duyệt' : 'Pending')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveClinic(p.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    >
                      {t('admin.clinics.approve', isVi ? 'Phê Duyệt' : 'Approve')}
                    </button>
                    <button
                      onClick={() => handleRejectClinic(p.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                    >
                      {t('admin.clinics.reject', isVi ? 'Từ Chối' : 'Reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <CreditCard className="w-5 h-5 text-cyan-700" /> {t('admin.packages.servicePackageList', isVi ? 'Quản Lý Gói Dịch Vụ & Biểu Phí Billing' : 'Service Packages & Billing Management')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('admin.packages.subtitle', isVi ? 'Thiết lập các gói sàng lọc vi mạch võng mạc cho cá nhân và phòng khám, số lượt phân tích và hạn mức sử dụng.' : 'Configure retinal screening packages for patients and clinics, analysis credits, and validity periods.')}
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
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
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
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-600" />
                      {t('admin.packages.loadingList', isVi ? 'Đang tải danh sách gói dịch vụ...' : 'Loading service package list...')}
                    </td>
                  </tr>
                ) : filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      {t('admin.packages.emptyFiltered', isVi ? 'Không có gói dịch vụ nào phù hợp điều kiện lọc.' : 'No service packages match the filter criteria.')}
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const isClinic = pkg.scope === "CLINIC";
                    return (
                      <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
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
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                              title={isVi ? "Chỉnh sửa thông tin gói" : "Edit package"}
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-600" /> {isVi ? 'Sửa' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleTogglePackageStatus(pkg.id, pkg.active)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all border ${
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
                          <span>{isVi ? "Cá nhân" : "Individual (Patient)"}</span>
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
              <Sliders className="w-5 h-5 text-cyan-700" /> {t('admin.aiConfig.title', isVi ? 'Cấu Hình Tham Số & Độ Nhạy Mô Hình AI' : 'AI Model Parameters & Sensitivity Configuration')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('admin.aiConfig.subtitle', isVi ? 'Điều chỉnh ngưỡng kích hoạt cảnh báo lâm sàng cho vi mạch hoàng điểm và bệnh võng mạc tiểu đường.' : 'Adjust clinical alert triggers for macular microvasculature and diabetic retinopathy.')}
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
