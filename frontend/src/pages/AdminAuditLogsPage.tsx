import React, { useState, useEffect } from "react";
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
} from "../services/api";
import { PatientAssignmentBoard } from "../components/PatientAssignmentBoard";

interface AdminAuditLogsPageProps {
  activeView?: string;
}

export const AdminAuditLogsPage: React.FC<AdminAuditLogsPageProps> = ({
  activeView,
}) => {
  const sectionToTab: Record<
    string,
    | "users"
    | "rbac"
    | "notifications"
    | "clinics"
    | "assignments"
    | "ai-config"
    | "audit"
  > = {
    "user-management": "users",
    "rbac-matrix": "rbac",
    "notification-config": "notifications",
    "clinic-approvals": "clinics",
    "ai-thresholds": "ai-config",
    "audit-logs": "audit",
  };

  const [activeTab, setActiveTab] = useState<
    | "users"
    | "rbac"
    | "notifications"
    | "clinics"
    | "assignments"
    | "ai-config"
    | "audit"
  >((activeView && sectionToTab[activeView]) || "users");

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
                ? "Khoa Mắt & Tim Mạch"
                : u.roles?.[0] === "ROLE_CLINIC"
                  ? "Phòng Khám Đa Khoa"
                  : u.roles?.[0] === "ROLE_ADMIN"
                    ? "Ban Quản Trị Hệ Thống"
                    : "Cổng Bệnh Nhân",
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
            ? "Đã kích hoạt tài khoản thành công."
            : "Đã vô hiệu hóa (khóa) tài khoản.",
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
        setUserActionNotice("Đã cập nhật thông tin tài khoản.");
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
          `Đã chuyển vai trò tài khoản thành ${selectedNewRole}.`,
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

  const permissionCatalog = [
    {
      code: "SCREENING_READ",
      name: "Xem kết quả phân tích AI & Biomarkers",
      group: "Chẩn đoán AI",
    },
    {
      code: "SCREENING_CREATE",
      name: "Tải ảnh đáy mắt & Chạy suy luận AI",
      group: "Chẩn đoán AI",
    },
    {
      code: "GRADCAM_VIEW",
      name: "Xem bản đồ nhiệt Grad-CAM vi mạch",
      group: "Chẩn đoán AI",
    },
    {
      code: "BULK_SCREENING",
      name: "Sàng lọc hàng loạt (≥100 ảnh/lô)",
      group: "Chẩn đoán AI",
    },
    {
      code: "DOCTOR_REVIEW",
      name: "Thẩm định & Điều chỉnh mức nguy cơ",
      group: "Lâm sàng",
    },
    {
      code: "DIGITAL_SIGNATURE",
      name: "Ký số báo cáo y khoa chuẩn HMAC",
      group: "Lâm sàng",
    },
    {
      code: "ICD10_DIAGNOSE",
      name: "Gán mã bệnh ICD-10 (H35.0, I10)",
      group: "Lâm sàng",
    },
    {
      code: "CONSULTATION_CHAT",
      name: "Nhắn tin tư vấn trực tuyến",
      group: "Lâm sàng",
    },
    {
      code: "BILLING_READ",
      name: "Xem gói dịch vụ & Lịch sử giao dịch",
      group: "Thanh toán",
    },
    {
      code: "PACKAGE_PURCHASE",
      name: "Mua/gia hạn gói qua VNPay / MoMo",
      group: "Thanh toán",
    },
    {
      code: "USER_MANAGE",
      name: "Kích hoạt / Khóa / Sửa tài khoản",
      group: "Quản trị",
    },
    {
      code: "ROLE_CONFIG",
      name: "Cấu hình ma trận phân quyền RBAC",
      group: "Quản trị",
    },
    {
      code: "AI_THRESHOLD_UPDATE",
      name: "Điều chỉnh độ nhạy AI & Ngưỡng cảnh báo",
      group: "Quản trị",
    },
    {
      code: "NOTIFICATION_MANAGE",
      name: "Quản lý mẫu thông báo & Chính sách",
      group: "Quản trị",
    },
    {
      code: "AUDIT_EXPORT",
      name: "Xuất báo cáo nhật ký kiểm toán HIPAA",
      group: "Quản trị",
    },
  ];

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
        `Đã lưu cấu hình phân quyền cho vai trò ${selectedRbacRole}!`,
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
          setNotifActionNotice("Đã tạo mẫu thông báo mới!");
          setIsCreatingTemplate(false);
          loadNotifConfig();
        }
      } else if (editingTemplate) {
        const res = await adminNotificationApi.updateTemplate(
          editingTemplate.id,
          templateForm,
        );
        if (res.success) {
          setNotifActionNotice("Đã cập nhật mẫu thông báo!");
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
      setNotifActionNotice("Đã xóa mẫu thông báo.");
      setTimeout(() => setNotifActionNotice(null), 4000);
    } catch (e) {
      console.warn("Could not delete template:", e);
    }
  };

  const handleSavePolicy = async () => {
    try {
      await adminNotificationApi.updatePolicy(commPolicy);
      setNotifActionNotice("Đã lưu chính sách liên lạc hệ thống!");
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
        ? "Đã phê duyệt hồ sơ."
        : res.message || "Phê duyệt thất bại.",
    }));
    if (res.success) loadClinicProfiles();
  };

  const handleRejectClinic = async (clinicProfileId: string) => {
    const reason = rejectReasonDraft[clinicProfileId]?.trim();
    if (!reason) {
      setClinicActionMessage((prev) => ({
        ...prev,
        [clinicProfileId]: "Vui lòng nhập lý do từ chối.",
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
        ? "Đã từ chối hồ sơ."
        : res.message || "Từ chối thất bại.",
    }));
    if (res.success) loadClinicProfiles();
  };

  // ==========================================
  // AI CONFIG & AUDIT LOGS
  // ==========================================
  const [glaucomaSensitivity, setGlaucomaSensitivity] = useState(85);
  const [drConfidence, setDrConfidence] = useState(70);
  const [retrainThreshold, setRetrainThreshold] = useState(60);
  const [isSavedAI, setIsSavedAI] = useState(false);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const loadAuditData = async () => {
    try {
      const auditRes = await auditApi.getLogs();
      if (auditRes.success && auditRes.data?.items) {
        setLogsList(
          auditRes.data.items.map((a: any) => ({
            id: `LOG-${a.id?.slice(0, 6).toUpperCase() || "1000"}`,
            timestamp: a.createdAt
              ? new Date(a.createdAt).toLocaleString("vi-VN")
              : "Không có thời gian",
            tz: "ICT (+7)",
            severity: a.severity || "Info",
            title: a.action || "Sự kiện hệ thống",
            desc: a.details || "Không có chi tiết.",
            user: a.actorEmail || "System",
            userType: a.actorRole === "SYSTEM" ? "system" : "person",
            ip: a.ipAddress || "Không ghi nhận",
          })),
        );
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
    }
  };

  useEffect(() => {
    loadUsers();
    loadRbacRoles();
    loadNotifConfig();
    loadClinicProfiles();
    loadAuditData();
  }, []);

  const handleExportLogs = async () => {
    try {
      const res = await auditApi.exportLogs();
      const exportData = res.success && res.data ? res.data : logsList;
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          "Mã Log,Thời Gian,Mức Độ,Sự Kiện,Người Thực Hiện,IP",
          ...exportData.map(
            (l: any) =>
              `"${l.id}","${l.timestamp}","${l.severity}","${l.title} - ${l.desc}","${l.user}","${l.ip}"`,
          ),
        ].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `AURA_HIPAA_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn("Export failed:", e);
    }
  };

  const filteredLogs = logsList.filter((log) => {
    const matchesSeverity =
      severityFilter === "All" ||
      log.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest">
            Bảng Điều Khiển Quản Trị Hệ Thống
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            AURA Security & Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị tài khoản (FR-31), Ma trận phân quyền RBAC (FR-32), Mẫu
            thông báo & Chính sách (FR-39)
          </p>
        </div>

        {/* Global Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "users"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" /> Tài Khoản (FR-31)
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "rbac"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Phân Quyền (FR-32)
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "notifications"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bell className="w-4 h-4" /> Thông Báo (FR-39)
          </button>
          <button
            onClick={() => setActiveTab("clinics")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "clinics"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" /> Duyệt Phòng Khám
          </button>
          <button
            onClick={() => setActiveTab("ai-config")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "ai-config"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings className="w-4 h-4" /> Cấu Hình AI
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-white text-cyan-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" /> Nhật Ký HIPAA
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
                <Users className="w-5 h-5 text-cyan-700" /> Quản Lý Tài Khoản
                Người Dùng, Bác Sĩ & Phòng Khám (FR-31)
              </h2>
              <p className="text-xs text-slate-500">
                Kích hoạt, vô hiệu hóa, chỉnh sửa thông tin hồ sơ và gán vai trò
                người dùng trong hệ thống AURA.
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
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
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ROLE_USER">Bệnh nhân (ROLE_USER)</option>
                <option value="ROLE_DOCTOR">Bác sĩ (ROLE_DOCTOR)</option>
                <option value="ROLE_CLINIC">Phòng khám (ROLE_CLINIC)</option>
                <option value="ROLE_ADMIN">Quản trị viên (ROLE_ADMIN)</option>
              </select>
              <button
                onClick={loadUsers}
                className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl"
              >
                Lọc
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Họ & Tên / Email</th>
                  <th className="p-3.5">Vai Trò</th>
                  <th className="p-3.5">Khoa / Đơn Vị</th>
                  <th className="p-3.5">Số Điện Thoại</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Không tìm thấy tài khoản người dùng nào.
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
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{u.department}</td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {u.phoneNumber || "Chưa cập nhật"}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {u.status === "ACTIVE" ? "HOẠT ĐỘNG" : "VÔ HIỆU HÓA"}
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
                          title="Chỉnh sửa thông tin"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => {
                            setRoleChangeUser(u);
                            setSelectedNewRole(u.role);
                          }}
                          className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold rounded-lg text-xs"
                          title="Chuyển đổi vai trò"
                        >
                          Đổi Vai Trò
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-2.5 py-1.5 font-bold rounded-lg text-xs text-white ${
                            u.status === "ACTIVE"
                              ? "bg-rose-600 hover:bg-rose-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {u.status === "ACTIVE" ? "Khóa" : "Kích hoạt"}
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
                Chỉnh Sửa Hồ Sơ Tài Khoản
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
                  Email đăng nhập
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
                  Họ và tên
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
                  Số điện thoại liên hệ
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
                  Địa chỉ / Cơ sở y tế
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
                Hủy
              </button>
              <button
                onClick={handleSaveUserEdit}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
              >
                Lưu Thay Đổi
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
                Phân Quyền Vai Trò
              </h3>
              <button
                onClick={() => setRoleChangeUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Chọn vai trò hệ thống mới cho tài khoản:{" "}
              <strong>{roleChangeUser.email}</strong>
            </p>
            <div className="space-y-2">
              {[
                { id: "ROLE_USER", label: "Bệnh nhân (ROLE_USER)" },
                {
                  id: "ROLE_DOCTOR",
                  label: "Bác sĩ chuyên khoa (ROLE_DOCTOR)",
                },
                {
                  id: "ROLE_CLINIC",
                  label: "Tổ chức phòng khám (ROLE_CLINIC)",
                },
                { id: "ROLE_ADMIN", label: "Quản trị viên (ROLE_ADMIN)" },
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
                Hủy
              </button>
              <button
                onClick={handleSaveUserRole}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
              >
                Xác Nhận Đổi
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
                <ShieldCheck className="w-5 h-5 text-cyan-700" /> Định Nghĩa Vai
                Trò & Ma Trận Phân Quyền RBAC (FR-32)
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập quyền truy cập cho từng vai trò người dùng (USER,
                DOCTOR, CLINIC, ADMIN) theo từng phân hệ chức năng.
              </p>
            </div>
            <button
              onClick={handleSaveRolePermissions}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Lưu Ma Trận Quyền
            </button>
          </div>

          {rbacSavedNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{rbacSavedNotice}</span>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rbacRoles.map((r) => {
              const isSelected = selectedRbacRole === r.roleName;
              return (
                <button
                  key={r.roleName}
                  onClick={() => setSelectedRbacRole(r.roleName)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-cyan-600 bg-cyan-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="font-mono font-bold text-xs text-slate-900">
                    {r.roleName}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {r.description}
                  </p>
                  <div className="mt-2 text-[10px] font-bold text-cyan-700">
                    {(r.permissions || []).length} Quyền kích hoạt
                  </div>
                </button>
              );
            })}
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Danh Mục Quyền Hạn Cho Vai Trò:{" "}
              <span className="font-mono text-cyan-700 font-extrabold">
                {selectedRbacRole}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? "border-teal-400 bg-teal-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePermission(perm.code)}
                      className="mt-1 w-4 h-4 text-cyan-700 rounded-md border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {perm.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-100">
                          {perm.group}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {perm.code}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  <Bell className="w-5 h-5 text-cyan-700" /> Mẫu Thông Báo Hệ
                  Thống (Notification Templates)
                </h2>
                <p className="text-xs text-slate-500">
                  Định nghĩa nội dung tin nhắn và biến số thay thế tự động (
                  {`{patient_name}`}, {`{risk_level}`}, {`{credits}`}) cho các
                  kênh Email, In-App và SMS.
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
                <Plus className="w-4 h-4" /> Thêm Mẫu Mới
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
                      Tiêu đề: {tpl.subject}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                      {tpl.body}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Trạng thái: {tpl.enabled ? "Đang kích hoạt" : "Tạm tắt"}
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
                        title="Chỉnh sửa mẫu"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                        title="Xóa mẫu"
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
                  <Sliders className="w-5 h-5 text-cyan-700" /> Chính Sách & Quy
                  Tắc Gửi Tin Nhắn (Communication Policy)
                </h3>
                <p className="text-xs text-slate-500">
                  Cấu hình các kênh gửi thông báo khả dụng, cơ chế cảnh báo khẩn
                  cấp và khung giờ giới hạn liên lạc.
                </p>
              </div>
              <button
                onClick={handleSavePolicy}
                className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Lưu Chính Sách
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Channel Switches */}
              <div className="p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Kênh Truyền Thông Kích Hoạt
                </h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Kênh In-App Notification & SSE (Thời gian thực)</span>
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
                  <span>Kênh Email Y Tế (Kết quả khám & Báo cáo PDF)</span>
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
                  <span>Kênh SMS Khẩn Cấp (Cảnh báo nguy cơ cao)</span>
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
                  Quy Tắc Khẩn Cấp & Giờ Yên Tĩnh
                </h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-800">
                      Cảnh báo khẩn cấp nguy cơ rất cao (Critical)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Ưu tiên phát tức thời bất kể giờ yên tĩnh
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
                      Giờ bắt đầu yên tĩnh
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
                      Giờ kết thúc yên tĩnh
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
                    Thời gian lưu trữ thông báo (Ngày)
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
                  ? "Tạo Mẫu Thông Báo Mới"
                  : "Chỉnh Sửa Mẫu Thông Báo"}
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
                    Mã mẫu (Code)
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
                  <label className="font-bold text-slate-700 block mb-1">
                    Kênh thông báo
                  </label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        channel: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="IN_APP">IN_APP (Thông báo hệ thống)</option>
                    <option value="EMAIL">EMAIL (Thư điện tử)</option>
                    <option value="SMS">SMS (Tin nhắn điện thoại)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                  placeholder="VD: Thông báo kết quả AI hoàn tất"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu đề thông báo
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
                  placeholder="VD: Kết quả phân tích mạch máu võng mạc"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung mẫu (Body)
                </label>
                <textarea
                  rows={4}
                  value={templateForm.body}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, body: e.target.value })
                  }
                  placeholder="Hỗ trợ biến số: {patient_name}, {risk_level}, {screening_id}, {doctor_notes}"
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
                Hủy
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
              >
                Lưu Mẫu
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
              <Building2 className="w-5 h-5 text-cyan-700" /> Phê Duyệt Hồ Sơ
              Phòng Khám (FR-22)
            </h2>
            <p className="text-xs text-slate-500">
              Kiểm tra giấy phép hành nghề và phê duyệt quyền tổ chức sàng lọc
              cộng đồng cho các cơ sở y tế.
            </p>
          </div>

          {clinicsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Đang tải hồ sơ phòng khám...
            </div>
          ) : clinicProfiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Không có hồ sơ phòng khám nào chờ duyệt.
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
                      Giấy phép số: {p.licenseNumber || "Chưa cung cấp"}
                    </p>
                    <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {p.verificationStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveClinic(p.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    >
                      Phê Duyệt
                    </button>
                    <button
                      onClick={() => handleRejectClinic(p.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                    >
                      Từ Chối
                    </button>
                  </div>
                </div>
              ))}
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
              <Sliders className="w-5 h-5 text-cyan-700" /> Cấu Hình Tham Số &
              Độ Nhạy Mô Hình AI (FR-38)
            </h2>
            <p className="text-xs text-slate-500">
              Điều chỉnh ngưỡng kích hoạt cảnh báo lâm sàng cho vi mạch hoàng
              điểm và bệnh võng mạc tiểu đường.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700">
                Độ Nhạy Sàng Lọc Glaucoma/CVD ({glaucomaSensitivity}%)
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
                Tối ưu phát hiện sớm các tổn thương co thắt tiểu động mạch.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700">
                Ngưỡng Tin Cậy Bệnh Võng Mạc ĐTĐ ({drConfidence}%)
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
                Yêu cầu AI đạt độ tin cậy tối thiểu trước khi xuất phân loại
                ETDRS.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700">
                Ngưỡng Cảnh Báo Co Thắt A/V Ratio ({retrainThreshold}%)
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
                Kích hoạt cảnh báo nguy cơ tăng huyết áp khi A/V Ratio dưới
                ngưỡng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: HIPAA AUDIT LOGS (FR-34, FR-35)
      ========================================================================== */}
      {activeTab === "audit" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-700" /> Nhật Ký Kiểm Toán
                & An Toàn Y Tế Chuẩn HIPAA (FR-34, FR-35)
              </h2>
              <p className="text-xs text-slate-500">
                Ghi nhận mọi truy cập hồ sơ bệnh nhân, chữ ký số bác sĩ và suy
                luận AI không thể chỉnh sửa.
              </p>
            </div>
            <button
              onClick={handleExportLogs}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Xuất File CSV
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện, người dùng hoặc IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="All">Tất cả mức độ</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Mã Log</th>
                  <th className="p-3.5">Thời Gian</th>
                  <th className="p-3.5">Mức Độ</th>
                  <th className="p-3.5">Hành Động</th>
                  <th className="p-3.5">Người Thực Hiện</th>
                  <th className="p-3.5">Địa Chỉ IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Không có nhật ký kiểm toán phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-mono font-bold text-cyan-800">
                        {l.id}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {l.timestamp}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.severity === "Critical"
                              ? "bg-rose-100 text-rose-800"
                              : l.severity === "Warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {l.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {l.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {l.desc}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700">{l.user}</td>
                      <td className="p-3.5 font-mono text-slate-500">{l.ip}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
