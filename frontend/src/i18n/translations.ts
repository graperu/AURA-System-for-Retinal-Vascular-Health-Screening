/**
 * AURA Clinical Decision Support System - Bilingual Medical Dictionary
 * Standardized according to VN Ministry of Health & AAO Guidelines.
 * Strict Zero-Hybrid Policy: No mixed "Tiếng Việt (English)" strings.
 * 100% Symmetrical Schema between Vietnamese (vi) and English (en).
 */

export type SupportedLanguage = 'vi' | 'en';

export interface ClinicalTranslationSchema {
  common: {
    systemName: string;
    systemFullName: string;
    medicalDisclaimerTitle: string;
    medicalDisclaimerText: string;
    mandatoryNotice: string;
    darkRoomOn: string;
    darkRoomOff: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    vesselOverlay: string;
    opacityLabel: string;
    close: string;
    save: string;
    cancel: string;
    confirm: string;
    loading: string;
    refresh: string;
    retry: string;
    printReport: string;
    exportCsv: string;
    securityStandard: string;
    hipaaCompliant: string;
    notifications: string;
    markAllAsRead: string;
    noNotifications: string;
    newNotification: string;
    dismiss: string;
    pagination: {
      previous: string;
      next: string;
      page: string;
      of: string;
      perPage: string;
      showing: string;
    };
    status: {
      pending: string;
      processing: string;
      completed: string;
      failed: string;
      approved: string;
      rejected: string;
      modified: string;
      reviewed: string;
      active: string;
      inactive: string;
    };
    actions: {
      view: string;
      edit: string;
      delete: string;
      download: string;
      print: string;
      share: string;
      refresh: string;
      back: string;
      next: string;
      submit: string;
      close: string;
      cancel: string;
      confirm: string;
    };
    gender: {
      male: string;
      female: string;
      other: string;
    };
    bloodType: {
      a: string;
      b: string;
      ab: string;
      o: string;
      unknown: string;
    };
    diabetesType: {
      none: string;
      type1: string;
      type2: string;
      gestational: string;
    };
    emptyStates: {
      noData: string;
      noResults: string;
      noHistory: string;
      noPatients: string;
      noLogs: string;
    };
    confirmationModals: {
      confirmDelete: string;
      confirmAction: string;
      areYouSure: string;
    };
  };
  navigation: {
    dashboard: string;
    newScan: string;
    cdsWorkspace: string;
    patientList: string;
    historyReports: string;
    consultation: string;
    medicalProfile: string;
    billingCredits: string;
    riskAnalytics: string;
    medicalReportsSignoff: string;
    bulkScreening: string;
    campaignAnalytics: string;
    doctorManagement: string;
    userManagement: string;
    rbacPermissions: string;
    aiConfiguration: string;
    auditLogs: string;
    logout: string;
    clinicApprovals: string;
    packageManagement: string;
    notificationConfig: string;
    creditPackage: string;
    groupOverview: string;
    groupScreening: string;
    groupCare: string;
    groupBilling: string;
    groupClinical: string;
    groupAnalytics: string;
    groupCommunication: string;
    groupCampaign: string;
    groupFacility: string;
    groupUserAdmin: string;
    groupConfigAudit: string;
    workspacePatient: string;
    workspaceDoctor: string;
    workspaceClinic: string;
    workspaceAdmin: string;
  };
  roles: {
    patient: string;
    doctor: string;
    clinic: string;
    admin: string;
  };
  header: {
    tagline: string;
    notificationCenter: string;
    markAllAsRead: string;
    noNotifications: string;
    newNotification: string;
    gotIt: string;
    hipaaStandard: string;
    logout: string;
  };
  eyeLaterality: {
    rightEye: string;
    rightEyeShort: string;
    leftEye: string;
    leftEyeShort: string;
    bothEyes: string;
    bothEyesShort: string;
    selectEye: string;
  };
  scanTypes: {
    maculaCentered: {
      label: string;
      description: string;
    };
    opticDisc: {
      label: string;
      description: string;
    };
    oct: {
      label: string;
      description: string;
    };
  };
  riskLevels: {
    low: string;
    moderate: string;
    high: string;
    critical: string;
    unverified: string;
  };
  biomarkers: {
    avr: {
      label: string;
      abbreviation: string;
      normalRef: string;
      clinicalSignificance: string;
    };
    vesselDensity: {
      label: string;
      unit: string;
      normalRef: string;
      clinicalSignificance: string;
    };
    tortuosity: {
      label: string;
      unit: string;
      normalRef: string;
      clinicalSignificance: string;
    };
    cdr: {
      label: string;
      abbreviation: string;
      normalRef: string;
      clinicalSignificance: string;
    };
  };
  clinicalDecision: {
    title: string;
    approve: string;
    modify: string;
    reject: string;
    doctorNotesPlaceholder: string;
    signerLabel: string;
    signatureVerified: string;
    saveSuccess: string;
  };
  icd10: Record<string, string>;
  recommendations: Record<'low' | 'moderate' | 'high' | 'critical', string[]>;
  anomalies: {
    Microaneurysm: string;
    Hemorrhage: string;
    Hard_Exudate: string;
    AV_Nipping: string;
    Focal_Narrowing: string;
    confidence: string;
  };
  cdsViewer: {
    title: string;
    patientNotice: string;
    darkRoom: string;
    darkRoomOn: string;
    darkRoomTitle: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    vesselOverlay: string;
    opacityLabel: string;
    highAttention: string;
    monitoring: string;
    normal: string;
    showCoordinates: string;
    normalMicrovasculature: string;
    rawFundus: string;
    rawFundusAlt: string;
    aiAttentionLayer: string;
    noAnomaliesFound: string;
    negativeFindingBannerTitle: string;
    negativeFindingBannerDesc: string;
    clinicallyNegative: string;
  };
  uploader: {
    title: string;
    subtitle: string;
    useSample: string;
    loadingSample: string;
    securityBadge: string;
    selectEye: string;
    selectScanType: string;
    rightEyeLabel: string;
    leftEyeLabel: string;
    dragDrop: string;
    chooseFile: string;
    uploadedFile: string;
    fileSizeError: string;
    fileEmptyError: string;
    fileFormatError: string;
    availableQuota: string;
    quotaUnit: string;
    topUp: string;
    startAnalysis: string;
    analyzing: string;
    retry: string;
    closeNotice: string;
    analysisFailed: string;
    fileCheckError: string;
  };
  login: {
    tabLogin: string;
    tabRegister: string;
    titleLogin: string;
    titleRegister: string;
    subtitleLogin: string;
    subtitleRegister: string;
    emailLabel: string;
    passwordLabel: string;
    submitLogin: string;
    submitRegister: string;
    switchLanguage: string;
  };
  auth: {
    loginForm: {
      email: string;
      password: string;
      loginButton: string;
      rememberMe: string;
      forgotPassword: string;
      errorMessages: {
        invalidCredentials: string;
        emailRequired: string;
        passwordRequired: string;
        generalError: string;
      };
      loggingIn: string;
    };
    registerForm: {
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      phone: string;
      roleSelection: string;
      registerButton: string;
      termsConsent: string;
    };
    authHeroPanel: {
      tagline: string;
      hipaaCompliant: string;
      aiAccuracy: string;
      clinicalBenefits: string;
      trustedByHospitals: string;
    };
    verifyEmailLink: {
      verifying: string;
      success: string;
      invalidLink: string;
      returnToLogin: string;
    };
  };
  patient: {
    dashboard: {
      greeting: string;
      healthStatus: string;
      quickActions: {
        uploadScan: string;
        viewHistory: string;
        doctorChat: string;
        updateProfile: string;
      };
      recentScansTable: string;
      creditsRemaining: string;
    };
    history: {
      title: string;
      searchPlaceholder: string;
      filters: {
        eye: string;
        risk: string;
        scanType: string;
        sort: string;
      };
      columns: {
        date: string;
        eye: string;
        modality: string;
        riskLevel: string;
        status: string;
        doctor: string;
        action: string;
      };
      emptyState: string;
      viewDetails: string;
      exportReport: string;
    };
    results: {
      summaryTitle: string;
      cardiovascularRiskScore: string;
      diabeticRetinopathyGrade: string;
      microvascularBiomarkers: string;
      aiRationale: string;
      clinicalRecommendation: string;
      print: string;
      share: string;
      askDoctor: string;
    };
    chat: {
      consultationTitle: string;
      assignedDoctor: string;
      onlineStatus: string;
      placeholder: string;
      sendButton: string;
      emptyChat: string;
      emergencyNotice: string;
    };
    profile: {
      personalInfo: string;
      dob: string;
      gender: string;
      bloodType: string;
      diabetesType: string;
      hypertension: string;
      smokingStatus: string;
      medications: string;
      saveProfile: string;
    };
    credit: {
      currentQuota: string;
      packageOptions: string;
      pricing: string;
      buyNow: string;
      transferInstructions: string;
    };
  };
  doctor: {
    cds: {
      title: string;
      pendingReviewsCount: string;
      urgentCases: string;
      reviewedToday: string;
      totalAssigned: string;
      recentPatientsQueue: string;
      quickInspection: string;
    };
    worklist: {
      title: string;
      search: string;
      filterTabs: {
        pending: string;
        reviewed: string;
        all: string;
      };
      riskFilters: string;
      columns: {
        patient: string;
        patientId: string;
        date: string;
        scanType: string;
        aiRisk: string;
        doctorRisk: string;
        status: string;
        action: string;
      };
      reviewButton: string;
    };
    diagnosisModal: {
      title: string;
      aiPreliminary: string;
      doctorDecision: {
        approve: string;
        modify: string;
        reject: string;
      };
      adjustedCardio: string;
      adjustedDR: string;
      icd10Select: string;
      doctorNotes: string;
      digitalSign: string;
      signedAt: string;
      signerName: string;
      saveButton: string;
    };
    patientList: {
      title: string;
      search: string;
      genderFilter: string;
      columns: {
        name: string;
        age: string;
        gender: string;
        phone: string;
        lastScan: string;
        riskLevel: string;
        actions: string;
      };
      viewProfile: string;
      assignDoctor: string;
    };
    reportsView: {
      title: string;
      filter: string;
      columns: {
        code: string;
        patient: string;
        date: string;
        findings: string;
        status: string;
        actions: string;
      };
      print: string;
      exportPdf: string;
      exportCsv: string;
      downloadSignoff: string;
    };
    riskAnalytics: {
      title: string;
      populationDistribution: string;
      riskMatrix: string;
      ageGroups: string;
      hypertensionVsRetinopathyCorrelation: string;
    };
  };
  clinic: {
    portal: {
      title: string;
      batchScreeningStatus: string;
      activeCampaigns: string;
      assignedDoctors: string;
      quotaBalance: string;
      topUp: string;
    };
    batchWorkspace: {
      batchList: string;
      status: {
        queued: string;
        processing: string;
        completed: string;
        error: string;
      };
      newBatchButton: string;
      batchDetails: string;
    };
    batchProcessing: {
      batchTitle: string;
      progress: string;
      itemsProcessed: string;
      successRate: string;
      filterStatus: string;
      filterRisk: string;
      itemsTable: string;
    };
    batchUploadModal: {
      uploadTitle: string;
      selectClinic: string;
      selectEye: string;
      dropzone: string;
      filesSelected: string;
      uploading: string;
      assignDoctor: string;
      submitBatch: string;
    };
    batchDetailModal: {
      itemDetails: string;
      eye: string;
      scanType: string;
      biomarkers: string;
      rawFundus: string;
      heatmap: string;
      doctorSignoffStatus: string;
    };
    campaignAnalytics: {
      campaignTitle: string;
      totalScreened: string;
      highRiskIdentified: string;
      coverageRate: string;
      demographicChart: string;
    };
  };
  admin: {
    audit: {
      title: string;
      searchByUserIp: string;
      severityFilter: string;
      actionFilter: string;
      columns: {
        timestamp: string;
        user: string;
        role: string;
        action: string;
        resource: string;
        ip: string;
        severity: string;
      };
      exportAuditTrail: string;
    };
    userManagement: {
      title: string;
      userList: string;
      changeRole: string;
      activateDeactivate: string;
      resetPassword: string;
      saveChanges: string;
    };
    rbac: {
      rolePermissionMatrix: string;
      viewPermissions: string;
      editPermissions: string;
      savePolicy: string;
    };
    aiConfig: {
      title: string;
      modelSelection: string;
      temperature: string;
      sensitivityThreshold: string;
      endpointUrl: string;
      testConnection: string;
      saveParameters: string;
    };
    templates: {
      notificationTemplates: string;
      channel: {
        email: string;
        inApp: string;
        sms: string;
      };
      title: string;
      content: string;
      createTemplate: string;
      edit: string;
      delete: string;
    };
    packages: {
      servicePackageList: string;
      packageName: string;
      price: string;
      quota: string;
      validity: string;
      activeToggle: string;
      createPackage: string;
    };
  };
  footer: {
    copyright: string;
    version: string;
    termsOfService: string;
    privacyPolicy: string;
    medicalSafetyStatement: string;
  };
}

export const translations: Record<SupportedLanguage, ClinicalTranslationSchema> = {
  vi: {
    common: {
      systemName: "AURA",
      systemFullName: "Hệ thống Hỗ trợ Quyết định Lâm sàng Sàng lọc Vi mạch Võng mạc AURA",
      medicalDisclaimerTitle: "Tuyên bố Miễn trừ Y tế",
      medicalDisclaimerText:
        "Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.",
      mandatoryNotice: "Lưu ý y khoa bắt buộc:",
      darkRoomOn: "Buồng tối: BẬT",
      darkRoomOff: "Buồng tối",
      zoomIn: "Phóng to",
      zoomOut: "Thu nhỏ",
      resetZoom: "Kích thước chuẩn",
      vesselOverlay: "Lớp phân đoạn mạch máu",
      opacityLabel: "Độ mờ bản đồ nhiệt",
      close: "Đóng",
      save: "Lưu kết luận",
      cancel: "Hủy bỏ",
      confirm: "Xác nhận",
      loading: "Đang tải dữ liệu lâm sàng...",
      refresh: "Làm mới",
      retry: "Thử lại",
      printReport: "In phiếu kết quả",
      exportCsv: "Xuất tệp CSV",
      securityStandard: "Chuẩn bảo mật",
      hipaaCompliant: "Chuẩn bảo mật HIPAA",
      notifications: "Thông báo",
      markAllAsRead: "Đọc tất cả",
      noNotifications: "Không có thông báo mới nào.",
      newNotification: "Thông báo mới",
      dismiss: "Đã hiểu",
      pagination: {
        previous: "Trang trước",
        next: "Trang sau",
        page: "Trang",
        of: "trên",
        perPage: "Số dòng mỗi trang",
        showing: "Đang hiển thị",
      },
      status: {
        pending: "Đang chờ xử lý",
        processing: "Đang tiến hành",
        completed: "Đã hoàn thành",
        failed: "Thất bại",
        approved: "Đã phê duyệt",
        rejected: "Bị từ chối",
        modified: "Đã hiệu chỉnh",
        reviewed: "Đã thẩm định",
        active: "Đang hoạt động",
        inactive: "Ngừng hoạt động",
      },
      actions: {
        view: "Xem",
        edit: "Chỉnh sửa",
        delete: "Xóa",
        download: "Tải xuống",
        print: "In",
        share: "Chia sẻ",
        refresh: "Làm mới",
        back: "Quay lại",
        next: "Tiếp theo",
        submit: "Gửi đi",
        close: "Đóng",
        cancel: "Hủy bỏ",
        confirm: "Xác nhận",
      },
      gender: {
        male: "Nam",
        female: "Nữ",
        other: "Khác",
      },
      bloodType: {
        a: "Nhóm máu A",
        b: "Nhóm máu B",
        ab: "Nhóm máu AB",
        o: "Nhóm máu O",
        unknown: "Chưa xác định",
      },
      diabetesType: {
        none: "Không mắc đái tháo đường",
        type1: "Đái tháo đường type 1",
        type2: "Đái tháo đường type 2",
        gestational: "Đái tháo đường thai kỳ",
      },
      emptyStates: {
        noData: "Chưa có dữ liệu nào được ghi nhận.",
        noResults: "Không tìm thấy kết quả phù hợp với điều kiện lọc.",
        noHistory: "Chưa có lịch sử sàng lọc nào trong hệ thống.",
        noPatients: "Chưa có bệnh nhân nào trong danh sách quản lý.",
        noLogs: "Chưa có nhật ký kiểm toán nào được ghi lại.",
      },
      confirmationModals: {
        confirmDelete: "Bạn có chắc chắn muốn xóa bản ghi này không? Thao tác này không thể hoàn tác.",
        confirmAction: "Vui lòng xác nhận thực hiện hành động này.",
        areYouSure: "Bạn có chắc chắn muốn tiếp tục?",
      },
    },
    navigation: {
      dashboard: "Tổng quan sức khỏe",
      newScan: "Phân tích ảnh mới",
      cdsWorkspace: "Bàn chẩn đoán tương tác CDS",
      patientList: "Danh sách bệnh nhân",
      historyReports: "Lịch sử & Báo cáo",
      consultation: "Tư vấn Bác sĩ",
      medicalProfile: "Hồ sơ y tế",
      billingCredits: "Giao dịch & Lượt khám",
      riskAnalytics: "Thống kê nguy cơ",
      medicalReportsSignoff: "Báo cáo y khoa & Ký duyệt",
      bulkScreening: "Sàng lọc hàng loạt",
      campaignAnalytics: "Báo cáo chiến dịch",
      doctorManagement: "Quản lý bác sĩ",
      userManagement: "Quản lý người dùng",
      rbacPermissions: "Phân quyền vai trò",
      aiConfiguration: "Cấu hình tham số AI",
      auditLogs: "Nhật ký kiểm toán HIPAA",
      logout: "Đăng xuất",
      clinicApprovals: "Phê duyệt phòng khám",
      packageManagement: "Quản lý gói dịch vụ",
      notificationConfig: "Mẫu thông báo & CS",
      creditPackage: "Gói cước cơ sở",
      groupOverview: "TỔNG QUAN",
      groupScreening: "SÀNG LỌC VÕNG MẠC",
      groupCare: "CHĂM SÓC & TƯ VẤN",
      groupBilling: "TÀI KHOẢN & DỊCH VỤ",
      groupClinical: "CHẨN ĐOÁN LÂM SÀNG",
      groupAnalytics: "PHÂN TÍCH & BÁO CÁO",
      groupCommunication: "GIAO TIẾP",
      groupCampaign: "CHIẾN DỊCH TẦM SOÁT",
      groupFacility: "NHÂN SỰ & CƠ SỞ",
      groupUserAdmin: "QUẢN TRỊ TÀI KHOẢN",
      groupConfigAudit: "CẤU HÌNH & KIỂM TOÁN",
      workspacePatient: "Không gian Bệnh nhân",
      workspaceDoctor: "Bàn làm việc Bác sĩ",
      workspaceClinic: "Không gian Phòng khám",
      workspaceAdmin: "Quản trị Hệ thống",
    },
    roles: {
      patient: "Bệnh nhân",
      doctor: "Bác sĩ",
      clinic: "Phòng khám",
      admin: "Quản trị viên",
    },
    header: {
      tagline: "Sàng lọc vi mạch võng mạc & tim mạch",
      notificationCenter: "Trung Tâm Thông Báo",
      markAllAsRead: "Đọc tất cả",
      noNotifications: "Không có thông báo mới nào.",
      newNotification: "Thông báo mới",
      gotIt: "Đã hiểu",
      hipaaStandard: "Chuẩn bảo mật HIPAA",
      logout: "Đăng xuất",
    },
    eyeLaterality: {
      rightEye: "Mắt phải (OD)",
      rightEyeShort: "Mắt phải",
      leftEye: "Mắt trái (OS)",
      leftEyeShort: "Mắt trái",
      bothEyes: "Cả hai mắt (OU)",
      bothEyesShort: "Cả hai mắt",
      selectEye: "Chọn mắt sàng lọc",
    },
    scanTypes: {
      maculaCentered: {
        label: "Ảnh màu đáy mắt hoàng điểm",
        description: "Tập trung vùng hoàng điểm và vi mạch trung tâm võng mạc",
      },
      opticDisc: {
        label: "Ảnh màu đáy mắt gai thị",
        description: "Tập trung gai thị, viền thần kinh và tỷ lệ lõm đĩa thị",
      },
      oct: {
        label: "Chụp cắt lớp võng mạc (OCT)",
        description: "Phân tích lớp cắt chuyên sâu đánh giá vi mô võng mạc",
      },
    },
    riskLevels: {
      low: "Nguy cơ thấp",
      moderate: "Nguy cơ trung bình",
      high: "Nguy cơ cao",
      critical: "Nguy kịch",
      unverified: "Cần thẩm định lại",
    },
    biomarkers: {
      avr: {
        label: "Tỷ lệ động-tĩnh mạch",
        abbreviation: "A/V",
        normalRef: "Bình thường: ~0.67 (2:3)",
        clinicalSignificance: "Chỉ số co hẹp tiểu động mạch do tăng huyết áp mạn tính",
      },
      vesselDensity: {
        label: "Mật độ vi mạch",
        unit: "%",
        normalRef: "Bình thường: 16.0% – 22.0%",
        clinicalSignificance: "Phản ánh tình trạng tưới máu và thiếu máu cục bộ mao mạch võng mạc",
      },
      tortuosity: {
        label: "Độ ngoằn ngoèo mạch máu",
        unit: "",
        normalRef: "Bình thường: 1.10 – 1.20",
        clinicalSignificance: "Tăng áp lực thành mạch và biến đổi cấu trúc cung mạch võng mạc",
      },
      cdr: {
        label: "Tỷ lệ lõm đĩa thị",
        abbreviation: "C/D",
        normalRef: "Bình thường: 0.30 – 0.40",
        clinicalSignificance: "Chỉ số quan trọng trong sàng lọc và theo dõi bệnh lý Glaucoma",
      },
    },
    clinicalDecision: {
      title: "Quyết định lâm sàng của bác sĩ",
      approve: "Chấp thuận kết quả AI",
      modify: "Hiệu chỉnh chẩn đoán",
      reject: "Bác bỏ kết luận AI",
      doctorNotesPlaceholder: "Nhập ghi chú chẩn đoán phân biệt, khuyến nghị điều trị hoặc giải trình lý do hiệu chỉnh...",
      signerLabel: "Bác sĩ thẩm định & Ký số HMAC",
      signatureVerified: "Chữ ký số hợp lệ",
      saveSuccess: "Đã lưu kết luận lâm sàng và ký số hồ sơ thành công!",
    },
    icd10: {
      "H35.0": "H35.0 — Bệnh lý mạch máu võng mạc và biến đổi vi mạch",
      "H35.03": "H35.03 — Bệnh võng mạc tăng huyết áp",
      "E11.3": "E11.3 — Bệnh võng mạc đái tháo đường type 2",
      "E10.3": "E10.3 — Bệnh võng mạc đái tháo đường type 1",
      "I10": "I10 — Tăng huyết áp vô căn (nguyên phát)",
      "H40.1": "H40.1 — Glaucoma góc mở nguyên phát",
      "H35.3": "H35.3 — Thoái hóa hoàng điểm tuổi già (AMD)",
      "I63": "I63 — Nhồi máu não (Nguy cơ đột quỵ thiếu máu cục bộ)",
    },
    recommendations: {
      low: [
        "Hệ vi mạch võng mạc khỏe mạnh, chưa ghi nhận dấu hiệu tổn thương vi mạch.",
        "Duy trì chế độ dinh dưỡng giàu chất chống oxy hóa và lối sống năng động.",
        "Khám mắt định kỳ mỗi 12 tháng để theo dõi sức khỏe vi mạch võng mạc.",
      ],
      moderate: [
        "Ghi nhận co hẹp nhẹ vi mạch; khuyến nghị theo dõi huyết áp và đường huyết tại nhà.",
        "Hạn chế thực phẩm nhiều muối và mỡ động vật; tăng cường vận động nhẹ.",
        "Khám chuyên khoa Mắt hoặc Tim mạch trong vòng 3 – 6 tháng để kiểm tra chuyên sâu.",
      ],
      high: [
        "Phát hiện biến đổi mạch máu đáng kể; cần khám Mắt soi đáy mắt giãn đồng tử.",
        "Khám Tim mạch toàn diện để đánh giá nguy cơ xơ vữa và biến chứng mạch máu.",
        "Thực hiện tái khám chuyên khoa trong vòng 2 – 4 tuần.",
      ],
      critical: [
        "Tổn thương vi mạch mức độ nặng; nguy cơ biến cố tim mạch hoặc giảm thị lực cấp.",
        "Yêu cầu đến cơ sở y tế chuyên khoa Mắt hoặc cấp cứu Tim mạch để kiểm tra ngay.",
        "Tránh vận động thể lực gắng sức trước khi được bác sĩ chuyên khoa thăm khám.",
      ],
    },
    anomalies: {
      Microaneurysm: "Vi phình mạch",
      Hemorrhage: "Xuất huyết võng mạc",
      Hard_Exudate: "Xuất tiết cứng",
      AV_Nipping: "Dấu bắt chéo động-tĩnh mạch",
      Focal_Narrowing: "Co thắt tiểu động mạch khu trú",
      confidence: "Độ tin cậy",
    },
    cdsViewer: {
      title: "Bàn chẩn đoán tương tác CDS — Bản đồ nhiệt Grad-CAM",
      patientNotice: "AI làm nổi bật các nhánh mạch máu bằng màu sắc. Vùng màu đỏ/vàng là nơi có dấu hiệu bất thường cần bác sĩ lưu ý.",
      darkRoom: "Buồng tối",
      darkRoomOn: "Buồng tối: BẬT",
      darkRoomTitle: "Chế độ nền tối giúp nhìn rõ mạch máu hơn",
      zoomIn: "Phóng to",
      zoomOut: "Thu nhỏ",
      resetZoom: "Kích thước chuẩn",
      vesselOverlay: "Lớp mạch máu",
      opacityLabel: "Độ mờ bản đồ nhiệt:",
      highAttention: "Vùng chú ý cao",
      monitoring: "Vùng theo dõi",
      normal: "Bình thường",
      showCoordinates: "Hiển thị tọa độ tổn thương",
      normalMicrovasculature: "Vi mạch bình thường (0 điểm tổn thương)",
      rawFundus: "Ảnh chụp đáy mắt gốc",
      rawFundusAlt: "Ảnh võng mạc gốc",
      aiAttentionLayer: "Bản đồ nhiệt Grad-CAM",
      noAnomaliesFound: "Không phát hiện tổn thương vi phình mạch khu trú",
      negativeFindingBannerTitle: "Khảo sát vi mạch toàn diện: Cấu trúc bình thường (0 điểm tổn thương)",
      negativeFindingBannerDesc: "AI đã quét 4 góc phần tư võng mạc và cây mạch máu, không phát hiện vi phình mạch, xuất huyết hay co thắt khu trú.",
      clinicallyNegative: "Âm tính lâm sàng",
    },
    uploader: {
      title: "Tải ảnh võng mạc khám sàng lọc",
      subtitle: "Hỗ trợ ảnh PNG, JPG, DICOM (tối đa 15MB). Dữ liệu được bảo mật mã hóa an toàn.",
      useSample: "Dùng ảnh mẫu",
      loadingSample: "Đang nạp ảnh...",
      securityBadge: "Chuẩn bảo mật",
      selectEye: "Chọn mắt sàng lọc",
      selectScanType: "Chọn kiểu chụp võng mạc",
      rightEyeLabel: "Mắt Phải (OD)",
      leftEyeLabel: "Mắt Trái (OS)",
      dragDrop: "Kéo thả ảnh hoặc chọn tệp từ máy tính",
      chooseFile: "Chọn ảnh đáy mắt",
      uploadedFile: "Tệp đã chọn",
      fileSizeError: "vượt quá dung lượng tối đa cho phép (15MB)",
      fileEmptyError: "Tệp rỗng (0 bytes). Vui lòng chọn tệp ảnh hợp lệ.",
      fileFormatError: "Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp DICOM (.dcm), PNG (.png), JPEG (.jpg, .jpeg) hoặc TIFF (.tif).",
      availableQuota: "Lượt khám khả dụng:",
      quotaUnit: "lượt",
      topUp: "Nạp thêm",
      startAnalysis: "Tiến hành phân tích AI",
      analyzing: "Đang phân tích AI...",
      retry: "Thử lại",
      closeNotice: "Đóng thông báo",
      analysisFailed: "Không thể hoàn tất phân tích AI",
      fileCheckError: "Lỗi kiểm tra tệp ảnh",
    },
    login: {
      tabLogin: "Đăng nhập",
      tabRegister: "Đăng ký",
      titleLogin: "Đăng nhập",
      titleRegister: "Đăng ký",
      subtitleLogin: "Truy cập hệ thống AURA",
      subtitleRegister: "Tạo tài khoản để sử dụng hệ thống AURA",
      emailLabel: "Địa chỉ Email",
      passwordLabel: "Mật khẩu",
      submitLogin: "Đăng nhập vào hệ thống",
      submitRegister: "Đăng ký tài khoản",
      switchLanguage: "Đổi ngôn ngữ",
    },
    auth: {
      loginForm: {
        email: "Địa chỉ email",
        password: "Mật khẩu",
        loginButton: "Đăng nhập",
        rememberMe: "Ghi nhớ đăng nhập",
        forgotPassword: "Quên mật khẩu?",
        errorMessages: {
          invalidCredentials: "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.",
          emailRequired: "Vui lòng nhập địa chỉ email.",
          passwordRequired: "Vui lòng nhập mật khẩu.",
          generalError: "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại sau.",
        },
        loggingIn: "Đang đăng nhập...",
      },
      registerForm: {
        fullName: "Họ và tên đầy đủ",
        email: "Địa chỉ email",
        password: "Mật khẩu",
        confirmPassword: "Xác nhận mật khẩu",
        phone: "Số điện thoại",
        roleSelection: "Vai trò người dùng",
        registerButton: "Tạo tài khoản",
        termsConsent: "Tôi đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật Dữ liệu Y tế",
      },
      authHeroPanel: {
        tagline: "Hệ thống AI Hỗ trợ Sàng lọc Sức khỏe Vi mạch Võng mạc & Tim mạch",
        hipaaCompliant: "Bảo mật chuẩn HIPAA & ISO 27001",
        aiAccuracy: "Độ chính xác lâm sàng cao với XAI minh bạch",
        clinicalBenefits: "Hỗ trợ phát hiện sớm nguy cơ đột quỵ và biến chứng đái tháo đường",
        trustedByHospitals: "Được tin cậy bởi các cơ sở y tế và phòng khám chuyên khoa",
      },
      verifyEmailLink: {
        verifying: "Đang xác thực liên kết đăng nhập...",
        success: "Xác thực liên kết thành công! Đang chuyển hướng...",
        invalidLink: "Liên kết xác thực không hợp lệ hoặc đã hết hạn.",
        returnToLogin: "Quay lại trang đăng nhập",
      },
    },
    patient: {
      dashboard: {
        greeting: "Xin chào",
        healthStatus: "Tình trạng sức khỏe vi mạch",
        quickActions: {
          uploadScan: "Tải ảnh khám mới",
          viewHistory: "Xem lịch sử sàng lọc",
          doctorChat: "Tư vấn với bác sĩ",
          updateProfile: "Cập nhật hồ sơ bệnh án",
        },
        recentScansTable: "Danh sách ca sàng lọc gần đây",
        creditsRemaining: "Số lượt khám khả dụng",
      },
      history: {
        title: "Lịch sử khám sàng lọc võng mạc",
        searchPlaceholder: "Tìm theo mã ca khám, bác sĩ phụ trách, ghi chú lâm sàng...",
        filters: {
          eye: "Vị trí mắt",
          risk: "Mức độ nguy cơ",
          scanType: "Kiểu chụp",
          sort: "Sắp xếp theo",
        },
        columns: {
          date: "Ngày thực hiện",
          eye: "Mắt chụp",
          modality: "Kiểu chụp",
          riskLevel: "Mức độ nguy cơ",
          status: "Trạng thái",
          doctor: "Bác sĩ thẩm định",
          action: "Thao tác",
        },
        emptyState: "Chưa ghi nhận ca sàng lọc nào trong hồ sơ.",
        viewDetails: "Xem chi tiết chẩn đoán",
        exportReport: "Xuất phiếu khám",
      },
      results: {
        summaryTitle: "Kết Quả Đánh Giá Vi Mạch Đáy Mắt",
        cardiovascularRiskScore: "Điểm nguy cơ tim mạch",
        diabeticRetinopathyGrade: "Phân độ bệnh võng mạc đái tháo đường",
        microvascularBiomarkers: "Chỉ số sinh học vi mạch",
        aiRationale: "Cơ sở phân tích lâm sàng từ AI",
        clinicalRecommendation: "Khuyến nghị lâm sàng từ chuyên gia",
        print: "In phiếu kết quả",
        share: "Chia sẻ kết quả",
        askDoctor: "Trao đổi với bác sĩ",
      },
      chat: {
        consultationTitle: "Kênh tư vấn lâm sàng trực tuyến",
        assignedDoctor: "Bác sĩ phụ trách",
        onlineStatus: "Đang trực tuyến",
        placeholder: "Nhập câu hỏi hoặc mô tả triệu chứng cho bác sĩ...",
        sendButton: "Gửi tin nhắn",
        emptyChat: "Chưa có tin nhắn nào. Hãy bắt đầu trao đổi với bác sĩ.",
        emergencyNotice: "Trong trường hợp khẩn cấp, vui lòng đến ngay cơ sở y tế hoặc liên hệ 115.",
      },
      profile: {
        personalInfo: "Thông tin hành chính cá nhân",
        dob: "Ngày sinh",
        gender: "Giới tính",
        bloodType: "Nhóm máu",
        diabetesType: "Tình trạng đái tháo đường",
        hypertension: "Tiền sử tăng huyết áp",
        smokingStatus: "Tình trạng hút thuốc lá",
        medications: "Thuốc đang sử dụng",
        saveProfile: "Lưu hồ sơ sức khỏe",
      },
      credit: {
        currentQuota: "Hạn mức lượt khám hiện tại",
        packageOptions: "Các gói lượt khám sàng lọc",
        pricing: "Bảng giá dịch vụ",
        buyNow: "Mua gói ngay",
        transferInstructions: "Hướng dẫn chuyển khoản thanh toán",
      },
    },
    doctor: {
      cds: {
        title: "Bàn chẩn đoán hỗ trợ quyết định lâm sàng (CDS)",
        pendingReviewsCount: "Ca chờ thẩm định",
        urgentCases: "Ca nguy kịch cần xử trí",
        reviewedToday: "Đã thẩm định hôm nay",
        totalAssigned: "Tổng bệnh nhân được phân công",
        recentPatientsQueue: "Hàng đợi bệnh nhân gần nhất",
        quickInspection: "Soi chiếu nhanh vi mạch",
      },
      worklist: {
        title: "Danh sách chờ duyệt lâm sàng",
        search: "Tìm bệnh nhân theo tên, mã bệnh nhân (MRN)...",
        filterTabs: {
          pending: "Chờ thẩm định",
          reviewed: "Đã ký duyệt",
          all: "Tất cả hồ sơ",
        },
        riskFilters: "Lọc theo mức độ nguy cơ",
        columns: {
          patient: "Bệnh nhân",
          patientId: "Mã bệnh nhân",
          date: "Thời điểm chụp",
          scanType: "Kiểu chụp",
          aiRisk: "Nguy cơ AI đánh giá",
          doctorRisk: "Bác sĩ kết luận",
          status: "Trạng thái",
          action: "Thao tác",
        },
        reviewButton: "Thẩm định lâm sàng",
      },
      diagnosisModal: {
        title: "Thẩm định kết quả và Ký số kết luận lâm sàng",
        aiPreliminary: "Kết quả phân tích sơ bộ từ AI",
        doctorDecision: {
          approve: "Chấp thuận chẩn đoán của AI",
          modify: "Hiệu chỉnh kết luận lâm sàng",
          reject: "Bác bỏ kết luận của AI",
        },
        adjustedCardio: "Mức nguy cơ tim mạch hiệu chỉnh",
        adjustedDR: "Phân độ võng mạc đái tháo đường hiệu chỉnh",
        icd10Select: "Chỉ định mã bệnh danh ICD-10",
        doctorNotes: "Ghi chú chẩn đoán và phác đồ điều trị",
        digitalSign: "Ký số kết luận y khoa",
        signedAt: "Thời điểm ký duyệt",
        signerName: "Bác sĩ chuyên khoa ký duyệt",
        saveButton: "Lưu và Ký duyệt hồ sơ",
      },
      patientList: {
        title: "Danh sách bệnh nhân quản lý",
        search: "Tìm kiếm bệnh nhân...",
        genderFilter: "Lọc theo giới tính",
        columns: {
          name: "Họ và tên",
          age: "Tuổi",
          gender: "Giới tính",
          phone: "Điện thoại",
          lastScan: "Lần khám gần nhất",
          riskLevel: "Phân tầng nguy cơ",
          actions: "Thao tác",
        },
        viewProfile: "Xem hồ sơ bệnh án",
        assignDoctor: "Chỉ định bác sĩ phụ trách",
      },
      reportsView: {
        title: "Báo cáo y khoa & Nhật ký ký duyệt",
        filter: "Bộ lọc báo cáo",
        columns: {
          code: "Mã hồ sơ",
          patient: "Bệnh nhân",
          date: "Ngày ký",
          findings: "Kết luận lâm sàng",
          status: "Trạng thái ký",
          actions: "Thao tác",
        },
        print: "In phiếu kết quả",
        exportPdf: "Xuất tệp PDF",
        exportCsv: "Xuất tệp CSV",
        downloadSignoff: "Tải chứng thư ký số",
      },
      riskAnalytics: {
        title: "Phân tích và Thống kê nguy cơ quần thể",
        populationDistribution: "Phân bố nguy cơ quần thể",
        riskMatrix: "Ma trận nguy cơ tim mạch và võng mạc",
        ageGroups: "Thống kê theo nhóm tuổi",
        hypertensionVsRetinopathyCorrelation: "Tương quan tăng huyết áp và bệnh võng mạc",
      },
    },
    clinic: {
      portal: {
        title: "Cổng quản lý sàng lọc phòng khám",
        batchScreeningStatus: "Trạng thái xử lý lô ảnh",
        activeCampaigns: "Chiến dịch sàng lọc đang hoạt động",
        assignedDoctors: "Đội ngũ bác sĩ phụ trách",
        quotaBalance: "Số dư hạn mức lượt khám",
        topUp: "Nạp thêm hạn mức",
      },
      batchWorkspace: {
        batchList: "Danh sách lô ảnh sàng lọc",
        status: {
          queued: "Đang xếp hàng",
          processing: "Đang xử lý phân tích",
          completed: "Đã hoàn thành",
          error: "Lỗi chất lượng ảnh",
        },
        newBatchButton: "Tải lên lô ảnh mới",
        batchDetails: "Chi tiết tiến trình lô ảnh",
      },
      batchProcessing: {
        batchTitle: "Tiến trình phân tích lô hàng loạt",
        progress: "Tiến độ xử lý tổng thể",
        itemsProcessed: "Số ca ảnh đã xử lý",
        successRate: "Tỷ lệ phân tích thành công",
        filterStatus: "Lọc theo trạng thái xử lý",
        filterRisk: "Lọc theo mức độ nguy cơ",
        itemsTable: "Danh sách ảnh trong lô",
      },
      batchUploadModal: {
        uploadTitle: "Tải lên lô ảnh võng mạc hàng loạt",
        selectClinic: "Chọn cơ sở phòng khám",
        selectEye: "Chỉ định vị trí mắt",
        dropzone: "Kéo thả thư mục hoặc chọn nhiều tệp ảnh (PNG, JPG, DICOM)",
        filesSelected: "Số tệp ảnh đã chọn",
        uploading: "Đang nạp lô ảnh lên máy chủ...",
        assignDoctor: "Chỉ định bác sĩ chuyên khoa thẩm định lô",
        submitBatch: "Khởi động tiến trình xử lý lô",
      },
      batchDetailModal: {
        itemDetails: "Chi tiết phân tích ca chụp trong lô",
        eye: "Vị trí mắt",
        scanType: "Kiểu chụp võng mạc",
        biomarkers: "Các chỉ số đo lường vi mạch",
        rawFundus: "Ảnh màu đáy mắt gốc",
        heatmap: "Bản đồ nhiệt Grad-CAM",
        doctorSignoffStatus: "Tình trạng thẩm định của bác sĩ",
      },
      campaignAnalytics: {
        campaignTitle: "Thống kê chiến dịch tầm soát cộng đồng",
        totalScreened: "Tổng số lượt khám đã sàng lọc",
        highRiskIdentified: "Số ca phát hiện nguy cơ cao",
        coverageRate: "Tỷ lệ bao phủ mục tiêu",
        demographicChart: "Biểu đồ phân bố nhân khẩu học",
      },
    },
    admin: {
      audit: {
        title: "Nhật ký kiểm toán bảo mật HIPAA",
        searchByUserIp: "Tìm kiếm theo người dùng, hành động, tài nguyên hoặc địa chỉ IP...",
        severityFilter: "Lọc theo mức độ nghiêm trọng",
        actionFilter: "Lọc theo loại hành động",
        columns: {
          timestamp: "Thời gian",
          user: "Người thực hiện",
          role: "Vai trò",
          action: "Hành động",
          resource: "Tài nguyên tác động",
          ip: "Địa chỉ IP",
          severity: "Mức cảnh báo",
        },
        exportAuditTrail: "Xuất nhật ký kiểm toán CSV",
      },
      userManagement: {
        title: "Quản trị danh sách người dùng",
        userList: "Danh sách tài khoản hệ thống",
        changeRole: "Thay đổi vai trò người dùng",
        activateDeactivate: "Kích hoạt / Tạm khóa tài khoản",
        resetPassword: "Đặt lại mật khẩu truy cập",
        saveChanges: "Lưu thay đổi người dùng",
      },
      rbac: {
        rolePermissionMatrix: "Ma trận phân quyền vai trò (RBAC)",
        viewPermissions: "Xem bảng quyền hạn chi tiết",
        editPermissions: "Chỉnh sửa quyền hạn vai trò",
        savePolicy: "Lưu chính sách phân quyền",
      },
      aiConfig: {
        title: "Cấu hình tham số mô hình AI & XAI",
        modelSelection: "Mô hình thị giác máy học",
        temperature: "Độ biến thiên (Temperature)",
        sensitivityThreshold: "Ngưỡng nhạy cảm biến đổi vi mạch",
        endpointUrl: "Địa chỉ máy chủ AI Inference",
        testConnection: "Kiểm tra kết nối máy chủ AI",
        saveParameters: "Lưu cấu hình tham số AI",
      },
      templates: {
        notificationTemplates: "Mẫu thông báo và Chăm sóc khách hàng",
        channel: {
          email: "Thư điện tử (Email)",
          inApp: "Thông báo trong ứng dụng",
          sms: "Tin nhắn SMS",
        },
        title: "Tiêu đề thông báo",
        content: "Nội dung mẫu",
        createTemplate: "Tạo mẫu thông báo mới",
        edit: "Chỉnh sửa mẫu",
        delete: "Xóa mẫu",
      },
      packages: {
        servicePackageList: "Danh mục gói dịch vụ & Hạn mức khám",
        packageName: "Tên gói dịch vụ",
        price: "Đơn giá (VNĐ)",
        quota: "Số lượt khám sàng lọc",
        validity: "Thời hạn sử dụng (ngày)",
        activeToggle: "Trạng thái kích hoạt",
        createPackage: "Tạo gói dịch vụ mới",
      },
    },
    footer: {
      copyright: "© 2026 Hệ thống Hỗ trợ Quyết định Lâm sàng AURA. Bản quyền đã được bảo hộ.",
      version: "Phiên bản 1.0.0 (Bản dựng Lâm sàng)",
      termsOfService: "Điều khoản Sử dụng Dịch vụ",
      privacyPolicy: "Chính sách Bảo mật Dữ liệu Y tế",
      medicalSafetyStatement:
        "Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.",
    },
  },
  en: {
    common: {
      systemName: "AURA",
      systemFullName: "AURA Retinal Microvascular Screening & Clinical Decision Support System",
      medicalDisclaimerTitle: "Medical Safety Disclaimer",
      medicalDisclaimerText:
        "AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist.",
      mandatoryNotice: "Mandatory Clinical Notice:",
      darkRoomOn: "Dark Room: ON",
      darkRoomOff: "Dark Room",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetZoom: "Standard View",
      vesselOverlay: "Vessel Segmentation Overlay",
      opacityLabel: "Heatmap Opacity",
      close: "Close",
      save: "Save Assessment",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading clinical data...",
      refresh: "Refresh",
      retry: "Retry",
      printReport: "Print Medical Report",
      exportCsv: "Export CSV File",
      securityStandard: "Security Standard",
      hipaaCompliant: "HIPAA Compliant",
      notifications: "Notifications",
      markAllAsRead: "Mark all as read",
      noNotifications: "No new notifications.",
      newNotification: "New notification",
      dismiss: "Dismiss",
      pagination: {
        previous: "Previous",
        next: "Next",
        page: "Page",
        of: "of",
        perPage: "Rows per page",
        showing: "Showing",
      },
      status: {
        pending: "Pending",
        processing: "Processing",
        completed: "Completed",
        failed: "Failed",
        approved: "Approved",
        rejected: "Rejected",
        modified: "Modified",
        reviewed: "Reviewed",
        active: "Active",
        inactive: "Inactive",
      },
      actions: {
        view: "View",
        edit: "Edit",
        delete: "Delete",
        download: "Download",
        print: "Print",
        share: "Share",
        refresh: "Refresh",
        back: "Back",
        next: "Next",
        submit: "Submit",
        close: "Close",
        cancel: "Cancel",
        confirm: "Confirm",
      },
      gender: {
        male: "Male",
        female: "Female",
        other: "Other",
      },
      bloodType: {
        a: "Blood type A",
        b: "Blood type B",
        ab: "Blood type AB",
        o: "Blood type O",
        unknown: "Unknown",
      },
      diabetesType: {
        none: "No diabetes",
        type1: "Type 1 diabetes",
        type2: "Type 2 diabetes",
        gestational: "Gestational diabetes",
      },
      emptyStates: {
        noData: "No data records found.",
        noResults: "No results match your search criteria.",
        noHistory: "No screening history available.",
        noPatients: "No patients found in your assigned list.",
        noLogs: "No audit logs recorded.",
      },
      confirmationModals: {
        confirmDelete: "Are you sure you want to delete this record? This action cannot be undone.",
        confirmAction: "Please confirm that you want to proceed with this action.",
        areYouSure: "Are you sure you want to proceed?",
      },
    },
    navigation: {
      dashboard: "Health Dashboard",
      newScan: "New Scan Analysis",
      cdsWorkspace: "Interactive CDS Workspace",
      patientList: "Patient Worklist",
      historyReports: "History & Reports",
      consultation: "Doctor Consultation",
      medicalProfile: "Medical Profile",
      billingCredits: "Billing & Credits",
      riskAnalytics: "Risk Analytics",
      medicalReportsSignoff: "Medical Reports & Sign-off",
      bulkScreening: "Bulk Batch Screening",
      campaignAnalytics: "Campaign Analytics",
      doctorManagement: "Doctor Management",
      userManagement: "User Management",
      rbacPermissions: "RBAC Permissions",
      aiConfiguration: "AI Model Configuration",
      auditLogs: "HIPAA Audit Trail",
      logout: "Log Out",
      clinicApprovals: "Clinic Approvals",
      packageManagement: "Package Management",
      notificationConfig: "Notification Templates & Support",
      creditPackage: "Facility Credit Package",
      groupOverview: "OVERVIEW",
      groupScreening: "RETINAL SCREENING",
      groupCare: "CARE & CONSULTATION",
      groupBilling: "ACCOUNT & SERVICES",
      groupClinical: "CLINICAL DIAGNOSIS",
      groupAnalytics: "ANALYTICS & REPORTS",
      groupCommunication: "COMMUNICATION",
      groupCampaign: "SCREENING CAMPAIGN",
      groupFacility: "STAFF & FACILITY",
      groupUserAdmin: "ACCOUNT ADMINISTRATION",
      groupConfigAudit: "CONFIGURATION & AUDIT",
      workspacePatient: "Patient Workspace",
      workspaceDoctor: "Doctor Clinical Desk",
      workspaceClinic: "Clinic Workspace",
      workspaceAdmin: "System Administration",
    },
    roles: {
      patient: "Patient",
      doctor: "Doctor",
      clinic: "Clinic",
      admin: "Administrator",
    },
    header: {
      tagline: "Retinal microvascular & cardiovascular screening",
      notificationCenter: "Notification Center",
      markAllAsRead: "Mark all as read",
      noNotifications: "No new notifications.",
      newNotification: "New notification",
      gotIt: "Got it",
      hipaaStandard: "HIPAA Compliant",
      logout: "Log Out",
    },
    eyeLaterality: {
      rightEye: "Right Eye (OD)",
      rightEyeShort: "Right Eye",
      leftEye: "Left Eye (OS)",
      leftEyeShort: "Left Eye",
      bothEyes: "Both Eyes (OU)",
      bothEyesShort: "Both Eyes",
      selectEye: "Select Eye for Screening",
    },
    scanTypes: {
      maculaCentered: {
        label: "Macula-Centered Fundus Color",
        description: "Targeted on foveal center and parafoveal capillary network",
      },
      opticDisc: {
        label: "Optic Disc Fundus Color",
        description: "Targeted on neuroretinal rim, optic cup, and vascular arcades",
      },
      oct: {
        label: "Optical Coherence Tomography (OCT)",
        description: "High-resolution cross-sectional tomographic imaging of retinal layers",
      },
    },
    riskLevels: {
      low: "Low Risk",
      moderate: "Moderate Risk",
      high: "High Risk",
      critical: "Critical Risk",
      unverified: "Unverified / Needs Re-evaluation",
    },
    biomarkers: {
      avr: {
        label: "Arteriolar-Venular Ratio",
        abbreviation: "AVR",
        normalRef: "Normal Reference: ~0.67 (2:3)",
        clinicalSignificance: "Indicator of arteriolar narrowing associated with chronic hypertension",
      },
      vesselDensity: {
        label: "Vessel Density",
        unit: "%",
        normalRef: "Normal Range: 16.0% – 22.0%",
        clinicalSignificance: "Reflects retinal capillary perfusion and non-perfusion ischemia",
      },
      tortuosity: {
        label: "Vascular Tortuosity",
        unit: "",
        normalRef: "Normal Range: 1.10 – 1.20",
        clinicalSignificance: "Associated with increased transluminal pressure and vascular remodeling",
      },
      cdr: {
        label: "Vertical Cup-to-Disc Ratio",
        abbreviation: "CDR",
        normalRef: "Normal Reference: 0.30 – 0.40",
        clinicalSignificance: "Crucial metric for glaucomatous optic neuropathy screening",
      },
    },
    clinicalDecision: {
      title: "Doctor Clinical Decision",
      approve: "Approve AI Findings",
      modify: "Modify Clinical Assessment",
      reject: "Reject AI Assessment",
      doctorNotesPlaceholder: "Enter differential diagnosis notes, therapeutic advice, or override rationale...",
      signerLabel: "Reviewing Specialist & HMAC Signature",
      signatureVerified: "Digital Signature Verified",
      saveSuccess: "Clinical findings and digital signature successfully recorded!",
    },
    icd10: {
      "H35.0": "H35.0 — Retinal vascular changes and background retinopathy",
      "H35.03": "H35.03 — Hypertensive retinopathy",
      "E11.3": "E11.3 — Type 2 diabetes mellitus with diabetic retinopathy",
      "E10.3": "E10.3 — Type 1 diabetes mellitus with diabetic retinopathy",
      "I10": "I10 — Essential (primary) hypertension",
      "H40.1": "H40.1 — Primary open-angle glaucoma",
      "H35.3": "H35.3 — Age-related macular degeneration (AMD)",
      "I63": "I63 — Cerebral infarction (Ischemic stroke risk)",
    },
    recommendations: {
      low: [
        "Retinal microvasculature appears healthy with no visible microvascular lesions.",
        "Maintain an antioxidant-rich diet and active physical routine.",
        "Schedule a routine fundus screening examination every 12 months.",
      ],
      moderate: [
        "Mild microvascular narrowing observed; daily home blood pressure and glucose logging advised.",
        "Reduce dietary sodium and saturated fat intake; engage in moderate exercise.",
        "Consult an ophthalmologist or cardiologist within 3 to 6 months for detailed evaluation.",
      ],
      high: [
        "Notable microvascular alterations detected; dilated funduscopy is strongly recommended.",
        "Undergo a comprehensive cardiovascular evaluation to assess target-organ vascular health.",
        "Schedule a clinical follow-up appointment within 2 to 4 weeks.",
      ],
      critical: [
        "Severe microvascular abnormalities observed; potential acute vascular compromise.",
        "Immediate clinical evaluation at an ophthalmology or emergency cardiology center required.",
        "Avoid strenuous physical exertion pending urgent medical consultation.",
      ],
    },
    anomalies: {
      Microaneurysm: "Microaneurysm",
      Hemorrhage: "Retinal Hemorrhage",
      Hard_Exudate: "Hard Exudate",
      AV_Nipping: "A/V Nicking (Nipping)",
      Focal_Narrowing: "Focal Arteriolar Narrowing",
      confidence: "Confidence",
    },
    cdsViewer: {
      title: "Interactive CDS Workspace — Grad-CAM Heatmap",
      patientNotice: "AI highlights vascular structures using color heatmaps. Red/yellow zones indicate abnormal features requiring physician attention.",
      darkRoom: "Dark Room",
      darkRoomOn: "Dark Room: ON",
      darkRoomTitle: "Dark room background optimizes microvascular contrast",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetZoom: "Standard View",
      vesselOverlay: "Vessel Overlay",
      opacityLabel: "Heatmap Opacity:",
      highAttention: "High Attention Area",
      monitoring: "Monitoring Area",
      normal: "Normal",
      showCoordinates: "Show Lesion Coordinates",
      normalMicrovasculature: "Normal microvasculature (0 lesions detected)",
      rawFundus: "True Color Fundus Scan",
      rawFundusAlt: "Raw Fundus Image",
      aiAttentionLayer: "Grad-CAM Heatmap",
      noAnomaliesFound: "No focal microaneurysm lesions detected",
      negativeFindingBannerTitle: "Comprehensive Microvascular Survey: Normal Architecture (0 lesions detected)",
      negativeFindingBannerDesc: "AI surveyed all 4 retinal quadrants and vascular trees, confirming no microaneurysms, hemorrhages, or focal narrowing.",
      clinicallyNegative: "Clinically Negative",
    },
    uploader: {
      title: "Upload Retinal Scan for Screening",
      subtitle: "Supports PNG, JPG, DICOM files (max 15MB). Clinical data is securely encrypted.",
      useSample: "Use Sample Scan",
      loadingSample: "Loading scan...",
      securityBadge: "Security Standard",
      selectEye: "Select Eye for Screening",
      selectScanType: "Select Retinal Scan Modality",
      rightEyeLabel: "Right Eye (OD)",
      leftEyeLabel: "Left Eye (OS)",
      dragDrop: "Drag and drop retinal image or browse files",
      chooseFile: "Select Fundus File",
      uploadedFile: "Selected File",
      fileSizeError: "exceeds maximum allowed size (15MB)",
      fileEmptyError: "File is empty (0 bytes). Please select a valid fundus image.",
      fileFormatError: "Unsupported file format. Please upload DICOM (.dcm), PNG (.png), JPEG (.jpg, .jpeg) or TIFF (.tif).",
      availableQuota: "Available screening quota:",
      quotaUnit: "credits",
      topUp: "Top up",
      startAnalysis: "Start AI Analysis",
      analyzing: "Analyzing with AI...",
      retry: "Retry",
      closeNotice: "Close notice",
      analysisFailed: "AI Analysis could not be completed",
      fileCheckError: "File validation error",
    },
    login: {
      tabLogin: "Sign In",
      tabRegister: "Sign Up",
      titleLogin: "Sign In",
      titleRegister: "Create Account",
      subtitleLogin: "Access your AURA Workspace",
      subtitleRegister: "Create an account to access AURA CDS",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      submitLogin: "Sign In to System",
      submitRegister: "Register Account",
      switchLanguage: "Change Language",
    },
    auth: {
      loginForm: {
        email: "Email address",
        password: "Password",
        loginButton: "Sign In",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        errorMessages: {
          invalidCredentials: "Invalid email or password. Please check your credentials.",
          emailRequired: "Email address is required.",
          passwordRequired: "Password is required.",
          generalError: "Authentication error occurred. Please try again later.",
        },
        loggingIn: "Signing in...",
      },
      registerForm: {
        fullName: "Full name",
        email: "Email address",
        password: "Password",
        confirmPassword: "Confirm password",
        phone: "Phone number",
        roleSelection: "User role",
        registerButton: "Create account",
        termsConsent: "I agree to the Terms of Service and Medical Data Privacy Policy",
      },
      authHeroPanel: {
        tagline: "AI-Powered Retinal Microvascular & Cardiovascular Health Screening System",
        hipaaCompliant: "HIPAA & ISO 27001 Security Compliant",
        aiAccuracy: "High clinical accuracy with transparent Explainable AI",
        clinicalBenefits: "Early detection of stroke risks and diabetic retinopathy complications",
        trustedByHospitals: "Trusted by medical centers and specialized healthcare clinics",
      },
      verifyEmailLink: {
        verifying: "Verifying sign-in link...",
        success: "Link verified successfully! Redirecting...",
        invalidLink: "Invalid or expired verification link.",
        returnToLogin: "Return to sign-in",
      },
    },
    patient: {
      dashboard: {
        greeting: "Welcome",
        healthStatus: "Microvascular health status",
        quickActions: {
          uploadScan: "Upload new scan",
          viewHistory: "View screening history",
          doctorChat: "Chat with doctor",
          updateProfile: "Update medical profile",
        },
        recentScansTable: "Recent screening scans",
        creditsRemaining: "Available screening credits",
      },
      history: {
        title: "Retinal Screening History",
        searchPlaceholder: "Search by scan ID, doctor name, clinical notes...",
        filters: {
          eye: "Eye position",
          risk: "Risk level",
          scanType: "Modality",
          sort: "Sort by",
        },
        columns: {
          date: "Date performed",
          eye: "Eye",
          modality: "Modality",
          riskLevel: "Risk level",
          status: "Status",
          doctor: "Reviewing doctor",
          action: "Action",
        },
        emptyState: "No screening records found in history.",
        viewDetails: "View diagnosis details",
        exportReport: "Export medical report",
      },
      results: {
        summaryTitle: "Retinal Microvascular Assessment Summary",
        cardiovascularRiskScore: "Cardiovascular risk score",
        diabeticRetinopathyGrade: "Diabetic retinopathy grade",
        microvascularBiomarkers: "Microvascular biomarkers",
        aiRationale: "AI clinical rationale",
        clinicalRecommendation: "Clinical recommendations",
        print: "Print report",
        share: "Share results",
        askDoctor: "Consult assigned doctor",
      },
      chat: {
        consultationTitle: "Online Clinical Consultation",
        assignedDoctor: "Assigned doctor",
        onlineStatus: "Online",
        placeholder: "Enter your question or symptoms for the doctor...",
        sendButton: "Send message",
        emptyChat: "No messages yet. Start your conversation with the doctor.",
        emergencyNotice: "In case of emergency, please visit the nearest hospital or call 115 immediately.",
      },
      profile: {
        personalInfo: "Personal administrative information",
        dob: "Date of birth",
        gender: "Gender",
        bloodType: "Blood type",
        diabetesType: "Diabetes status",
        hypertension: "Hypertension history",
        smokingStatus: "Smoking status",
        medications: "Current medications",
        saveProfile: "Save medical profile",
      },
      credit: {
        currentQuota: "Current screening quota",
        packageOptions: "Screening credit packages",
        pricing: "Service pricing",
        buyNow: "Buy now",
        transferInstructions: "Bank transfer instructions",
      },
    },
    doctor: {
      cds: {
        title: "Clinical Decision Support (CDS) Desk",
        pendingReviewsCount: "Pending reviews",
        urgentCases: "Urgent cases",
        reviewedToday: "Reviewed today",
        totalAssigned: "Total assigned patients",
        recentPatientsQueue: "Recent patient queue",
        quickInspection: "Quick microvascular inspection",
      },
      worklist: {
        title: "Clinical Review Worklist",
        search: "Search patients by name, MRN...",
        filterTabs: {
          pending: "Pending review",
          reviewed: "Reviewed",
          all: "All records",
        },
        riskFilters: "Filter by risk level",
        columns: {
          patient: "Patient",
          patientId: "Patient ID",
          date: "Scan timestamp",
          scanType: "Modality",
          aiRisk: "AI preliminary risk",
          doctorRisk: "Doctor confirmed risk",
          status: "Status",
          action: "Action",
        },
        reviewButton: "Review & Sign",
      },
      diagnosisModal: {
        title: "Clinical Validation & Digital Sign-off",
        aiPreliminary: "AI preliminary findings",
        doctorDecision: {
          approve: "Approve AI findings",
          modify: "Modify clinical findings",
          reject: "Reject AI findings",
        },
        adjustedCardio: "Adjusted cardiovascular risk",
        adjustedDR: "Adjusted diabetic retinopathy grade",
        icd10Select: "Assign ICD-10 clinical codes",
        doctorNotes: "Diagnostic notes & management plan",
        digitalSign: "Digital sign-off",
        signedAt: "Signed timestamp",
        signerName: "Signing specialist",
        saveButton: "Save & Record sign-off",
      },
      patientList: {
        title: "Managed Patient Directory",
        search: "Search patient directory...",
        genderFilter: "Filter by gender",
        columns: {
          name: "Full name",
          age: "Age",
          gender: "Gender",
          phone: "Phone number",
          lastScan: "Last screening",
          riskLevel: "Risk stratification",
          actions: "Actions",
        },
        viewProfile: "View medical chart",
        assignDoctor: "Assign attending doctor",
      },
      reportsView: {
        title: "Medical Reports & Sign-off Archives",
        filter: "Report filters",
        columns: {
          code: "Record code",
          patient: "Patient",
          date: "Date signed",
          findings: "Clinical findings",
          status: "Signature status",
          actions: "Actions",
        },
        print: "Print report",
        exportPdf: "Export PDF file",
        exportCsv: "Export CSV file",
        downloadSignoff: "Download signature certificate",
      },
      riskAnalytics: {
        title: "Population Risk Analytics & Epidemiology",
        populationDistribution: "Population risk distribution",
        riskMatrix: "Cardiovascular vs retinal risk matrix",
        ageGroups: "Age group breakdown",
        hypertensionVsRetinopathyCorrelation: "Hypertension vs retinopathy correlation",
      },
    },
    clinic: {
      portal: {
        title: "Clinic Screening Operations Portal",
        batchScreeningStatus: "Batch screening status",
        activeCampaigns: "Active screening campaigns",
        assignedDoctors: "Assigned medical staff",
        quotaBalance: "Screening credit balance",
        topUp: "Top up credits",
      },
      batchWorkspace: {
        batchList: "Batch screening job queue",
        status: {
          queued: "Queued",
          processing: "Processing analysis",
          completed: "Completed",
          error: "Quality issue / Error",
        },
        newBatchButton: "Upload new batch",
        batchDetails: "Batch processing details",
      },
      batchProcessing: {
        batchTitle: "Bulk Batch Analysis Progress",
        progress: "Overall processing progress",
        itemsProcessed: "Processed image scans",
        successRate: "Analysis success rate",
        filterStatus: "Filter by processing status",
        filterRisk: "Filter by risk level",
        itemsTable: "Batch scan items",
      },
      batchUploadModal: {
        uploadTitle: "Upload Bulk Retinal Image Batch",
        selectClinic: "Select clinic facility",
        selectEye: "Assign eye laterality",
        dropzone: "Drag and drop folder or select multiple images (PNG, JPG, DICOM)",
        filesSelected: "Selected scan files",
        uploading: "Uploading batch scans to server...",
        assignDoctor: "Assign specialist for batch sign-off",
        submitBatch: "Launch batch screening process",
      },
      batchDetailModal: {
        itemDetails: "Batch item screening details",
        eye: "Eye laterality",
        scanType: "Scan modality",
        biomarkers: "Quantitative microvascular metrics",
        rawFundus: "True color fundus scan",
        heatmap: "Grad-CAM heatmap attention",
        doctorSignoffStatus: "Doctor sign-off status",
      },
      campaignAnalytics: {
        campaignTitle: "Community Screening Campaign Analytics",
        totalScreened: "Total individuals screened",
        highRiskIdentified: "High-risk cases identified",
        coverageRate: "Target coverage rate",
        demographicChart: "Demographic distribution chart",
      },
    },
    admin: {
      audit: {
        title: "HIPAA Security Audit Trail",
        searchByUserIp: "Search by user, action, resource, or IP address...",
        severityFilter: "Filter by severity level",
        actionFilter: "Filter by action type",
        columns: {
          timestamp: "Timestamp",
          user: "User account",
          role: "Assigned role",
          action: "Action performed",
          resource: "Target resource",
          ip: "IP address",
          severity: "Severity",
        },
        exportAuditTrail: "Export audit trail CSV",
      },
      userManagement: {
        title: "User Account Management",
        userList: "System user directory",
        changeRole: "Change user role",
        activateDeactivate: "Activate / Deactivate account",
        resetPassword: "Reset account password",
        saveChanges: "Save user modifications",
      },
      rbac: {
        rolePermissionMatrix: "Role-Based Access Control (RBAC) Matrix",
        viewPermissions: "View permission matrix",
        editPermissions: "Edit role permissions",
        savePolicy: "Save access policy",
      },
      aiConfig: {
        title: "AI & XAI Model Configuration",
        modelSelection: "Vision foundation model",
        temperature: "Sampling temperature",
        sensitivityThreshold: "Microvascular sensitivity threshold",
        endpointUrl: "AI inference endpoint URL",
        testConnection: "Test AI service connection",
        saveParameters: "Save AI parameters",
      },
      templates: {
        notificationTemplates: "Notification Templates & Customer Support",
        channel: {
          email: "Electronic mail (Email)",
          inApp: "In-app notification",
          sms: "Short message service (SMS)",
        },
        title: "Notification subject",
        content: "Template content",
        createTemplate: "Create new template",
        edit: "Edit template",
        delete: "Delete template",
      },
      packages: {
        servicePackageList: "Service Packages & Screening Quota Directory",
        packageName: "Package name",
        price: "Unit price (VND)",
        quota: "Screening credits",
        validity: "Validity period (days)",
        activeToggle: "Active status",
        createPackage: "Create new service package",
      },
    },
    footer: {
      copyright: "© 2026 AURA Retinal Clinical Decision Support System. All rights reserved.",
      version: "Version 1.0.0 (Clinical Build)",
      termsOfService: "Terms of Service",
      privacyPolicy: "Medical Data Privacy Policy",
      medicalSafetyStatement:
        "AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist.",
    },
  },
};
