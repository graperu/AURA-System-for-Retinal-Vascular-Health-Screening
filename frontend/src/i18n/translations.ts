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
    loadingInit: string;
    statusLabel: string;
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
    scanResults: string;
    doctorReviews: string;
    systemAlerts: string;
    markAsUnread: string;
    clearAll: string;
    unread: string;
    all: string;
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
    Cotton_Wool_Spot: string;
    Neovascularization: string;
    Venous_Beading: string;
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
      signInWithGoogle: string;
      signInWithMagicLink: string;
      magicLinkSent: string;
      orDivider: string;
      accountEmailLabel: string;
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
      signUpWithGoogle: string;
      orDivider: string;
      optionalLabel: string;
      passwordRequirementsHint: string;
      verifyOtpTitle: string;
      otpSentTo: string;
      enterOtpLabel: string;
      resendIn: string;
      resendOtpBtn: string;
      verifyAndCreateBtn: string;
      changeEmailBtn: string;
      sendingOtp: string;
      verifyingOtp: string;
    };
    authHeroPanel: {
      tagline: string;
      hipaaCompliant: string;
      aiAccuracy: string;
      clinicalBenefits: string;
      trustedByHospitals: string;
      aiScreeningSupport: string;
      retinalAnalysis: string;
      medicalWarning: string;
    };
    verifyEmailLink: {
      verifying: string;
      success: string;
      invalidLink: string;
      returnToLogin: string;
      verifyingTitle: string;
      verifyingStatus: string;
      signingInStatus: string;
      failedTitle: string;
      emailRequiredError: string;
      loginFailedError: string;
    };
    passwordInput: {
      showPassword: string;
      hidePassword: string;
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
        resetFilters: string;
        resetFiltersTooltip: string;
        resetFiltersNotice: string;
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
      immutabilityNotice: string;
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
      loading: string;
      syncing: string;
      noAssignedTitle: string;
      noAssignedDesc: string;
      viewPatientList: string;
      reload: string;
      feedbackSuccess: string;
      screeningNotice: string;
      selectPatientFirst: string;
      switchPatient: string;
      message: string;
      printResult: string;
      noResultsYet: string;
      noResultsDesc: string;
      loadingScreeningHistory: string;
      bloodPressure: string;
      hba1c: string;
      attendingDoctor: string;
      notMeasured: string;
      notTested: string;
      yearsOld: string;
    };
    worklist: {
      title: string;
      search: string;
      searchLabel: string;
      searchPlaceholder: string;
      reviewStatusLabel: string;
      riskLevelLabel: string;
      refresh: string;
      addPatient: string;
      reset: string;
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
        vitals: string;
      };
      reviewButton: string;
      openCds: string;
      pendingReview: string;
      reviewed: string;
      priorityCritical: string;
      priorityHigh: string;
      priorityModerate: string;
      priorityLow: string;
      criticalLevel: string;
      highLevel: string;
      moderateLevel: string;
      lowLevel: string;
      allLevels: string;
      allStatuses: string;
      emptyFiltered: string;
      totalAssignedNotice: string;
    };
    diagnosisModal: {
      title: string;
      aiPreliminary: string;
      patientLabel: string;
      analysisIdLabel: string;
      decisionLabel: string;
      doctorDecision: {
        approve: string;
        modify: string;
        reject: string;
      };
      adjustedCardio: string;
      adjustedDR: string;
      icd10Select: string;
      doctorNotes: string;
      defaultNotes: string;
      digitalSign: string;
      signedAt: string;
      signerName: string;
      saveButton: string;
      pkiSignatureLabel: string;
      cancel: string;
      icdOptions: {
        h350: string;
        e113: string;
        i10: string;
        h401: string;
        h353: string;
      };
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
      subtitle: string;
      filter: string;
      totalReports: string;
      pendingReview: string;
      reviewed: string;
      searchLabel: string;
      searchPlaceholder: string;
      allTab: string;
      pendingTab: string;
      reviewedTab: string;
      listTitle: string;
      columns: {
        code: string;
        patient: string;
        date: string;
        findings: string;
        status: string;
        actions: string;
        eye: string;
        aiRisk: string;
        hmac: string;
      };
      unsigned: string;
      reviewAndSign: string;
      print: string;
      exportPdf: string;
      exportCsv: string;
      downloadSignoff: string;
      emptyReports: string;
      certModalTitle: string;
      certModalDesc: string;
      validCert: string;
      sealedDesc: string;
      hmacHashLabel: string;
      close: string;
      approvedDecision: string;
      modifiedDecision: string;
      signingDoctor: string;
      signedAtLabel: string;
      recordCodeLabel: string;
      patientLabel: string;
      clinicalDecisionLabel: string;
    };
    riskAnalytics: {
      title: string;
      subtitle: string;
      refresh: string;
      populationDistribution: string;
      riskMatrix: string;
      ageGroups: string;
      hypertensionVsRetinopathyCorrelation: string;
      assignedPatients: string;
      assignedPatientsDesc: string;
      clinicallyReviewed: string;
      clinicallyReviewedDesc: string;
      pendingReview: string;
      pendingReviewDesc: string;
      consensusWithAi: string;
      consensusWithAiDesc: string;
      riskDistributionTitle: string;
      totalCases: string;
      critical: string;
      highRisk: string;
      moderate: string;
      lowNormal: string;
      pctOfTotal: string;
      avgBiomarkersTitle: string;
      cohortAverage: string;
      avRatioLabel: string;
      avRatioRef: string;
      vesselDensityLabel: string;
      vesselDensityRef: string;
      tortuosityLabel: string;
      tortuosityRef: string;
      cdrLabel: string;
      cdrRef: string;
      avWarning: string;
      recentScreeningsTitle: string;
      filterTag: string;
      viewAll: string;
      emptyRecent: string;
      modified: string;
      approvedSigned: string;
    };
    consultation: {
      title: string;
      subtitle: string;
      stompActive: string;
      assignedPatients: string;
      searchPlaceholder: string;
      noPatients: string;
      vitalBp: string;
      vitalHba1c: string;
      attendingDoctor: string;
      openCds: string;
      openCdsTitle: string;
      safetyWarningTitle: string;
      safetyWarningText: string;
      loadingHistory: string;
      noMessagesTitle: string;
      noMessagesText: string;
      quickRepliesLabel: string;
      quickReplies: string[];
      inputPlaceholder: string;
      sendButton: string;
      selectPatientPrompt: string;
    };
    assignmentBoard: {
      title: string;
      subtitle: string;
      selectDoctorPlaceholder: string;
      assignButton: string;
      selected: string;
      assignedNotice: string;
      unassignedNotice: string;
      unassignedColumn: string;
      allAssigned: string;
      dropToAssign: string;
      noMrn: string;
      loading: string;
    };
    validationBar: {
      title: string;
      subtitle: string;
      printReport: string;
      savedSuccess: string;
      decisionLabel: string;
      decisions: {
        approve: string;
        modify: string;
        reject: string;
      };
      adjustedCardio: string;
      adjustedDR: string;
      icd10Label: string;
      notesLabel: string;
      saveButton: string;
      savingButton: string;
    };
    newPatientModal: {
      title: string;
      description: string;
      fullName: string;
      mrn: string;
      age: string;
      gender: string;
      phone: string;
      systolicBp: string;
      diastolicBp: string;
      hba1c: string;
      cancel: string;
      save: string;
    };
    reportModal: {
      exitEsc: string;
      close: string;
      officialReportTitle: string;
      preliminaryReportTitle: string;
      dualEyeBadge: string;
      reportCode: string;
      exportCsv: string;
      printPdf: string;
      systemTitle: string;
      systemSubtitleReviewed: string;
      systemSubtitlePreliminary: string;
      dualEyeSuffix: string;
      reportCodeLabel: string;
      examDateLabel: string;
      reviewedStatus: string;
      pendingStatus: string;
      unsigned: string;
      fullName: string;
      patientId: string;
      ageGender: string;
      bpDiabetes: string;
      section1: string;
      section2: string;
      section3: string;
      section4: string;
      section5: string;
      overallRisk: string;
      cardioRisk: string;
      strokeRisk: string;
      retinopathyRisk: string;
      glaucomaRisk: string;
      colBiomarker: string;
      colOD: string;
      colOS: string;
      colMeasured: string;
      colReference: string;
      colEvaluation: string;
      bmAvr: string;
      bmDensity: string;
      bmTortuosity: string;
      bmCdr: string;
      doctorDecisionLabel: string;
      doctorApproved: string;
      doctorModified: string;
      validSignature: string;
      signedAtLabel: string;
      reviewingSpecialist: string;
      noSignatureYet: string;
      dualComparisonHeader: string;
      icd10Label: string;
      doctorNotesTitle: string;
      recommendationsTitle: string;
      findingsTitle: string;
    };
  };
  clinic: {
    portal: {
      title: string;
      subtitle: string;
      batchScreeningStatus: string;
      activeCampaigns: string;
      assignedDoctors: string;
      quotaBalance: string;
      topUp: string;
      defaultFacility: string;
      profile: {
        title: string;
        verified: string;
        rejected: string;
        pending: string;
        loading: string;
        orgNameLabel: string;
        orgNamePlaceholder: string;
        licenseNumberLabel: string;
        licenseNumberPlaceholder: string;
        attachedDocLabel: string;
        selectedFile: string;
        submitButton: string;
        submitSuccess: string;
        submitFailed: string;
      };
      doctors: {
        title: string;
        addDoctorPlaceholder: string;
        addDoctorButton: string;
        addDoctorSuccess: string;
        addDoctorFailed: string;
        colName: string;
        colEmail: string;
        colStatus: string;
        colActions: string;
        noDoctors: string;
        statusActive: string;
        deleteTitle: string;
        confirmDelete: string;
        assignTitle: string;
        selectDoctor: string;
        patientIdLabel: string;
        patientIdPlaceholder: string;
        assignButton: string;
        assignSuccess: string;
        assignFailed: string;
      };
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
      totalImages: string;
      batch: string;
      newBatch: string;
      completedAi: string;
      rate: string;
      processingBackground: string;
      asyncQueue: string;
      qualityError: string;
      retakeNeeded: string;
      searchLabel: string;
      searchPlaceholder: string;
      clearSearch: string;
      statusFilterLabel: string;
      allStatuses: string;
      statusCompleted: string;
      statusProcessing: string;
      statusFailed: string;
      exportCsv: string;
      campaignImagesTitle: string;
      facility: string;
      defaultFacility: string;
      batchIdLabel: string;
      colFileId: string;
      colPatient: string;
      colEye: string;
      colStatus: string;
      colActions: string;
      viewDetail: string;
      defaultFundusName: string;
      emptyMessage: string;
      badgeQualityError: string;
      badgeProcessing: string;
      badgeCompleted: string;
    };
    batchProcessing: {
      batchTitle: string;
      progress: string;
      itemsProcessed: string;
      successRate: string;
      filterStatus: string;
      filterRisk: string;
      itemsTable: string;
      allStatuses: string;
      statusDone: string;
      statusProcessing: string;
      statusPending: string;
      statusFailed: string;
      allRisks: string;
      riskHighCritical: string;
      riskModerate: string;
      riskLow: string;
      allEyes: string;
      rightEye: string;
      leftEye: string;
      sortNewest: string;
      sortOldest: string;
      sortRiskDesc: string;
      sortMrnAsc: string;
      pageSize25: string;
      pageSize50: string;
      pageSize100: string;
      pageSizeAll: string;
      closeToast: string;
      campaignIdLabel: string;
      readyForNewBatch: string;
      systemReady: string;
      campaignSubtitle: string;
      bulkQueueProgress: string;
      doneLabel: string;
      scansLabel: string;
      minScansStandard: string;
      timeRemaining: string;
      creditsManagement: string;
      availableCredits: string;
      syncedActivePackage: string;
      topUpButton: string;
      highRiskCard: string;
      highRiskAction: string;
      moderateRiskCard: string;
      moderateRiskAction: string;
      lowRiskCard: string;
      lowRiskAction: string;
      queueProcessingCard: string;
      runningScans: string;
      allCompleted: string;
      emergencyAlertTitle: string;
      emergencyBannerTag: string;
      emergencyDesc: string;
      hideList: string;
      viewAlertDetails: string;
      urgentCaseList: string;
      actionLabel: string;
      aggregatedSurveillanceTitle: string;
      riskDistributionTitle: string;
      riskDistributionDesc: string;
      totalEvaluatedRecords: string;
      meanVascularScore: string;
      highRiskRate: string;
      highSevereCases: string;
      threeYearStrokeRisk: string;
      meanStrokeForecast: string;
      lowRiskRate: string;
      safeCases: string;
      donutMeanScore: string;
      outOf100: string;
      donutCaption: string;
      riskBreakdownTitle: string;
      lowRiskBand: string;
      moderateRiskBand: string;
      highRiskBand: string;
      criticalRiskBand: string;
      casesCount: string;
      searchPlaceholder: string;
      deidentifiedModeOn: string;
      deidentifiedModeOff: string;
      deidentifiedTooltip: string;
      printReportButton: string;
      exportCsvButton: string;
      uploadFolderButton: string;
      colNum: string;
      colThumbnail: string;
      colPatientMrn: string;
      colEye: string;
      colStatus: string;
      colRiskAssessment: string;
      colClinicalVitals: string;
      colActions: string;
      emptyRecords: string;
      viewCdsButton: string;
      badgeCompleted: string;
      badgeProcessing: string;
      badgePending: string;
      badgeError: string;
      showingPagination: string;
      pageOf: string;
      firstPageTitle: string;
      prevPageTitle: string;
      nextPageTitle: string;
      lastPageTitle: string;
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
      standardBadge: string;
      description: string;
      campaignNameLabel: string;
      campaignNamePlaceholder: string;
      facilityLabel: string;
      satelliteOption: string;
      dropzoneHint: string;
      selectFilesButton: string;
      selectFolderButton: string;
      quickDemoTitle: string;
      quickDemoDesc: string;
      loadDemoButton: string;
      demoStandardBadge: string;
      preflightTitle: string;
      scansLoaded: string;
      standardPassed: string;
      standardRequired: string;
      quickAssignLabel: string;
      allOdButton: string;
      allOsButton: string;
      alternateEyesButton: string;
      fillSampleVitalsButton: string;
      fillVitalsTooltip: string;
      filterAllEyes: string;
      filterOd: string;
      filterOs: string;
      clearAllButton: string;
      emptyStaged: string;
      colNum: string;
      colPreview: string;
      colFileName: string;
      colMrnPatient: string;
      colEyePosition: string;
      colVitals: string;
      colActions: string;
      moreScansCount: string;
      estimatedConsumption: string;
      availableBalance: string;
      cancelButton: string;
      deidentifyingQueuing: string;
      startBatchButton: string;
      defaultCampaignName: string;
    };
    batchDetailModal: {
      itemDetails: string;
      eye: string;
      scanType: string;
      biomarkers: string;
      rawFundus: string;
      heatmap: string;
      doctorSignoffStatus: string;
      deidHipaa: string;
      fileLabel: string;
      overallVascularRisk: string;
      modelName: string;
      cardiovascularRisk: string;
      score2Ai: string;
      arteriolarNarrowing: string;
      drRisk: string;
      icdrGrade: string;
      microaneurysms: string;
      threeYearStroke: string;
      strokeProjection: string;
      gunnSign: string;
      heatmapOpacityLabel: string;
      zoomOutTitle: string;
      zoomInTitle: string;
      resetZoomTitle: string;
      lesionBoxesRoi: string;
      anatomyMarkers: string;
      sideBySideView: string;
      directOverlayView: string;
      downloadPng: string;
      nativeFundusTitle: string;
      nativeResolution: string;
      opticDiscLabel: string;
      maculaLabel: string;
      formatLabel: string;
      heatmapLesionTitle: string;
      heatmapAvailable: string;
      noHeatmap: string;
      noHeatmapWarning: string;
      hudHoverHint: string;
      directOverlayTitle: string;
      directOverlaySubtitle: string;
      detectedAnomaliesTitle: string;
      detectedAnomaliesHint: string;
      noFocalLesions: string;
      noLesionsDesc: string;
      biomarkersTitle: string;
      avrLabel: string;
      avrNormal: string;
      tortuosityLabel: string;
      tortuosityDesc: string;
      vesselDensityLabel: string;
      vesselDensityDesc: string;
      cdrLabel: string;
      cdrNormal: string;
      rationalesTitle: string;
      processingDuration: string;
      closeButton: string;
      zoneDisc: string;
      zoneMacula: string;
      zoneSuperiorArcade: string;
      zoneInferiorArcade: string;
      zonePosteriorPole: string;
      defaultRationale1: string;
      defaultRationale2: string;
      defaultRationale3: string;
      defaultRationaleMod1: string;
      defaultRationaleMod2: string;
      defaultRationaleHigh1: string;
      defaultRationaleHigh2: string;
      defaultRationaleHigh3: string;
    };
    campaignAnalytics: {
      campaignTitle: string;
      totalScreened: string;
      highRiskIdentified: string;
      coverageRate: string;
      demographicChart: string;
      pageSubtitle: string;
      loadingMessage: string;
      errorTitle: string;
      errorMessage: string;
      emptyTitle: string;
      emptyDescription: string;
      reloadButton: string;
      exportCsvButton: string;
      totalCampaignsCard: string;
      totalCampaignsSub: string;
      totalImagesCard: string;
      totalImagesSub: string;
      highRiskCard: string;
      highRiskSub: string;
    };
    creditPackage: {
      title: string;
      subtitle: string;
      loading: string;
      quotaDepletedTitle: string;
      quotaLowTitle: string;
      quotaWarningDesc: string;
      topUpNow: string;
      refreshing: string;
      refresh: string;
      renewBuyButton: string;
      availableCredits: string;
      scansUnit: string;
      statusAbundant: string;
      statusLow: string;
      statusDepleted: string;
      scannedInBatch: string;
      totalCampaignScanned: string;
      activePackage: string;
      noActivePackage: string;
      statusActive: string;
      statusUnregistered: string;
      validityPeriod: string;
      indefinite: string;
      autoRenewNotice: string;
      currentPlanNotice: string;
      consumptionProgress: string;
      processedCount: string;
      availableCount: string;
      processedInBatchLegend: string;
      availableCreditsLegend: string;
      packagesSectionTitle: string;
      packagesSectionSubtitle: string;
      vatSupportBadge: string;
      recommendedRibbon: string;
      currentPlanBadge: string;
      currencyVnd: string;
      plusScans: string;
      validityDays: string;
      featuresIncluded: string;
      renewThisPackage: string;
      buyPackageNow: string;
      historySectionTitle: string;
      historySectionSubtitle: string;
      reloadHistory: string;
      colTxnId: string;
      colPackage: string;
      colAmount: string;
      colScans: string;
      colPaidDate: string;
      colMethod: string;
      colStatus: string;
      colReceipt: string;
      emptyHistory: string;
      emptyHistorySub: string;
      providerVietqr: string;
      providerMomo: string;
      providerBank: string;
      providerVnpay: string;
      statusSuccess: string;
      statusPending: string;
      statusFailed: string;
      viewReceipt: string;
      receiptTitle: string;
      providerLabel: string;
      providerSystemName: string;
      providerSystemDesc: string;
      invoiceIdLabel: string;
      servicePackageLabel: string;
      recordedTimeLabel: string;
      paymentGatewayLabel: string;
      settlementStatusLabel: string;
      settledValid: string;
      totalPaidLabel: string;
      receiptDisclaimer: string;
      closeReceipt: string;
      printReceipt: string;
      complianceTitle: string;
      complianceText: string;
      pkgStarterName: string;
      pkgStarterDesc: string;
      pkgCampaignName: string;
      pkgCampaignDesc: string;
      pkgHospitalName: string;
      pkgHospitalDesc: string;
      pkgStarterFeatures: string[];
      pkgCampaignFeatures: string[];
      pkgHospitalFeatures: string[];
    };
  };
  admin: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    tabs: {
      users: string;
      rbac: string;
      notifications: string;
      clinics: string;
      packages: string;
      aiConfig: string;
      audit: string;
    };
    audit: {
      title: string;
      subtitle: string;
      searchByUserIp: string;
      severityFilter: string;
      actionFilter: string;
      resetFilter: string;
      exportBtn: string;
      emptyMessage: string;
      severityAll: string;
      severityInfo: string;
      severityWarning: string;
      severityCritical: string;
      columns: {
        timestamp: string;
        user: string;
        role: string;
        action: string;
        resource: string;
        ip: string;
        severity: string;
        actionResource: string;
        status: string;
      };
      exportAuditTrail: string;
      statusSuccess: string;
      statusFailed: string;
    };
    userManagement: {
      title: string;
      subtitle: string;
      userList: string;
      changeRole: string;
      activateDeactivate: string;
      resetPassword: string;
      saveChanges: string;
      searchPlaceholder: string;
      filterRole: string;
      allRoles: string;
      filterBtn: string;
      emptyUsers: string;
      editUser: string;
      changeRoleBtn: string;
      lockAccount: string;
      unlockAccount: string;
      deleteUser: string;
      deleteSuccess: string;
      batchDeleteSuccess: string;
      deleteModalTitle: string;
      deleteConfirmMessage: string;
      batchDeleteModalTitle: string;
      batchDeleteConfirmMessage: string;
      cannotDeleteSelf: string;
      activeStatus: string;
      suspendedStatus: string;
      notUpdated: string;
      activatedSuccess: string;
      suspendedSuccess: string;
      updatedSuccess: string;
      roleUpdatedSuccess: string;
      editModalTitle: string;
      emailLabel: string;
      fullNameLabel: string;
      phoneLabel: string;
      addressLabel: string;
      roleModalTitle: string;
      roleModalDesc: string;
      confirmRoleBtn: string;
    };
    rbac: {
      rolePermissionMatrix: string;
      subtitle: string;
      viewPermissions: string;
      editPermissions: string;
      savePolicy: string;
      saveMatrix: string;
      savedSuccess: string;
      activePermissions: string;
      permissionCatalogTitle: string;
    };
    aiConfig: {
      title: string;
      subtitle: string;
      modelSelection: string;
      temperature: string;
      sensitivityThreshold: string;
      endpointUrl: string;
      testConnection: string;
      saveParameters: string;
      glaucomaSensitivity: string;
      glaucomaHint: string;
      drConfidence: string;
      drHint: string;
      retrainThreshold: string;
      retrainHint: string;
    };
    templates: {
      notificationTemplates: string;
      subtitle: string;
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
      addTemplate: string;
      subjectPrefix: string;
      statusPrefix: string;
      activeStatus: string;
      inactiveStatus: string;
      policiesTitle: string;
      policiesSubtitle: string;
      savePolicies: string;
      activeChannelsTitle: string;
      emergencyRulesTitle: string;
      inAppChannelLabel: string;
      emailChannelLabel: string;
      smsChannelLabel: string;
      criticalAlertLabel: string;
      criticalAlertDesc: string;
      quietStartLabel: string;
      quietEndLabel: string;
      retentionLabel: string;
      modalCreateTitle: string;
      modalEditTitle: string;
      codeLabel: string;
      nameLabel: string;
      channelLabel: string;
      subjectLabel: string;
      bodyLabel: string;
      descriptionLabel: string;
      enableCheckbox: string;
      saveTemplateBtn: string;
      savedNotice: string;
      policySavedNotice: string;
    };
    packages: {
      servicePackageList: string;
      subtitle: string;
      packageName: string;
      price: string;
      quota: string;
      validity: string;
      activeToggle: string;
      createPackage: string;
      refreshTooltip: string;
      totalPackages: string;
      activePackages: string;
      userPackages: string;
      clinicPackages: string;
      searchPlaceholder: string;
      scopeAll: string;
      scopeUser: string;
      scopeClinic: string;
      days: string;
      lifetime: string;
      active: string;
      inactive: string;
      creditsUnit: string;
      createModalTitle: string;
      editModalTitle: string;
      createModalSubtitle: string;
      codeLabel: string;
      nameLabel: string;
      descLabel: string;
      scopeLabel: string;
      creditsLabel: string;
      priceLabel: string;
      validityLabel: string;
      featuresLabel: string;
      activeImmediateLabel: string;
      saveBtn: string;
      createBtn: string;
      deactivateBtn: string;
      activateBtn: string;
      loadingList: string;
      emptyFiltered: string;
      packageSavedNotice: string;
      packageCreatedNotice: string;
      statusToggledNotice: string;
    };
    clinics: {
      title: string;
      subtitle: string;
      loading: string;
      empty: string;
      licenseLabel: string;
      notProvided: string;
      approve: string;
      reject: string;
      approvedSuccess: string;
      rejectedSuccess: string;
    };
  };
  footer: {
    copyright: string;
    version: string;
    termsOfService: string;
    privacyPolicy: string;
    medicalSafetyStatement: string;
    supportCenter: string;
    securityCert: string;
  };
}

export const translations: Record<SupportedLanguage, ClinicalTranslationSchema> = {
  vi: {
    common: {
      systemName: "AURA",
      systemFullName: "Hệ thống Tầm soát Võng mạc AURA",
      medicalDisclaimerTitle: "Tuyên bố Miễn trừ Y tế",
      medicalDisclaimerText:
        "Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.",
      mandatoryNotice: "Lưu ý y khoa bắt buộc:",
      darkRoomOn: "Buồng tối: BẬT",
      darkRoomOff: "Buồng tối",
      zoomIn: "Phóng to",
      zoomOut: "Thu nhỏ",
      resetZoom: "Chuẩn",
      vesselOverlay: "Mạch máu",
      opacityLabel: "Độ rõ bản đồ",
      close: "Đóng",
      save: "Lưu",
      cancel: "Hủy",
      confirm: "Xác nhận",
      loading: "Đang tải dữ liệu lâm sàng...",
      loadingInit: "Đang khởi động AURA...",
      statusLabel: "Trạng thái",
      refresh: "Làm mới",
      retry: "Thử lại",
      printReport: "In kết quả",
      exportCsv: "Xuất CSV",
      securityStandard: "Bảo mật",
      hipaaCompliant: "Bảo mật HIPAA",
      notifications: "Thông báo",
      markAllAsRead: "Đọc tất cả",
      noNotifications: "Không có thông báo mới.",
      newNotification: "Thông báo mới",
      dismiss: "Đã hiểu",
      pagination: {
        previous: "Trước",
        next: "Sau",
        page: "Trang",
        of: "/",
        perPage: "Dòng/trang",
        showing: "Hiển thị",
      },
      status: {
        pending: "Chờ xử lý",
        processing: "Đang xử lý",
        completed: "Hoàn tất",
        failed: "Thất bại",
        approved: "Đã duyệt",
        rejected: "Từ chối",
        modified: "Đã chỉnh sửa",
        reviewed: "Đã duyệt",
        active: "Đang dùng",
        inactive: "Tạm ngưng",
      },
      actions: {
        view: "Xem",
        edit: "Sửa",
        delete: "Xóa",
        download: "Tải",
        print: "In",
        share: "Chia sẻ",
        refresh: "Làm mới",
        back: "Quay lại",
        next: "Tiếp theo",
        submit: "Gửi",
        close: "Đóng",
        cancel: "Hủy",
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
        unknown: "Chưa rõ",
      },
      diabetesType: {
        none: "Không tiểu đường",
        type1: "Tiểu đường type 1",
        type2: "Tiểu đường type 2",
        gestational: "Tiểu đường thai kỳ",
      },
      emptyStates: {
        noData: "Chưa có dữ liệu.",
        noResults: "Không tìm thấy kết quả phù hợp.",
        noHistory: "Chưa có lịch sử khám.",
        noPatients: "Chưa có bệnh nhân nào.",
        noLogs: "Chưa có nhật ký ghi nhận.",
      },
      confirmationModals: {
        confirmDelete: "Bạn có chắc chắn muốn xóa bản ghi này không?",
        confirmAction: "Xác nhận thực hiện thao tác này?",
        areYouSure: "Bạn có muốn tiếp tục không?",
      },
    },
    navigation: {
      dashboard: "Trang chủ",
      newScan: "Tải ảnh mắt",
      cdsWorkspace: "Bàn chẩn đoán tương tác CDS",
      patientList: "Danh sách bệnh nhân",
      historyReports: "Kết quả & Lịch sử",
      consultation: "Nhắn tin Bác sĩ",
      medicalProfile: "Hồ sơ y tế",
      billingCredits: "Gói cước & Lượt khám",
      riskAnalytics: "Thống kê nguy cơ",
      medicalReportsSignoff: "Lịch sử đánh giá",
      bulkScreening: "Sàng lọc theo lô",
      campaignAnalytics: "Báo cáo chiến dịch",
      doctorManagement: "Quản lý Bác sĩ",
      userManagement: "Quản lý tài khoản",
      rbacPermissions: "Phân quyền truy cập",
      aiConfiguration: "Cấu hình AI",
      auditLogs: "Nhật ký hệ thống",
      logout: "Đăng xuất",
      clinicApprovals: "Duyệt phòng khám",
      packageManagement: "Gói dịch vụ",
      notificationConfig: "Mẫu thông báo",
      creditPackage: "Gói cước",
      groupOverview: "TỔNG QUAN",
      groupScreening: "SÀNG LỌC MẮT",
      groupCare: "CHĂM SÓC & TƯ VẤN",
      groupBilling: "GÓI CƯỚC & LƯỢT KHÁM",
      groupClinical: "CHẨN ĐOÁN LÂM SÀNG",
      groupAnalytics: "THỐNG KÊ & BÁO CÁO",
      groupCommunication: "TƯ VẤN",
      groupCampaign: "CHIẾN DỊCH TẦM SOÁT",
      groupFacility: "PHÒNG KHÁM & BÁC SĨ",
      groupUserAdmin: "QUẢN TRỊ TÀI KHOẢN",
      groupConfigAudit: "CẤU HÌNH & NHẬT KÝ",
      workspacePatient: "Bệnh nhân",
      workspaceDoctor: "Bác sĩ",
      workspaceClinic: "Phòng khám",
      workspaceAdmin: "Quản trị viên",
    },
    roles: {
      patient: "Bệnh nhân",
      doctor: "Bác sĩ",
      clinic: "Phòng khám",
      admin: "Quản trị viên",
    },
    header: {
      tagline: "Tầm soát võng mạc & nguy cơ tim mạch",
      notificationCenter: "Thông Báo",
      markAllAsRead: "Đọc tất cả",
      noNotifications: "Không có thông báo mới.",
      newNotification: "Thông báo mới",
      gotIt: "Đã hiểu",
      hipaaStandard: "Bảo mật chuẩn y tế",
      logout: "Đăng xuất",
      scanResults: "Kết quả sàng lọc",
      doctorReviews: "Thẩm định bác sĩ",
      systemAlerts: "Cảnh báo hệ thống",
      markAsUnread: "Đánh dấu chưa đọc",
      clearAll: "Xóa tất cả",
      unread: "Chưa đọc",
      all: "Tất cả",
    },
    eyeLaterality: {
      rightEye: "Mắt phải (OD)",
      rightEyeShort: "Mắt phải",
      leftEye: "Mắt trái (OS)",
      leftEyeShort: "Mắt trái",
      bothEyes: "Cả hai mắt (OU)",
      bothEyesShort: "Hai mắt",
      selectEye: "Chọn mắt chụp",
    },
    scanTypes: {
      maculaCentered: {
        label: "Ảnh hoàng điểm",
        description: "Chụp vùng trung tâm hoàng điểm mắt",
      },
      opticDisc: {
        label: "Ảnh gai thị",
        description: "Chụp vùng gai thị và đĩa thị",
      },
      oct: {
        label: "Chụp cắt lớp OCT",
        description: "Chụp cắt lớp võng mạc",
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
        label: "Tỷ lệ động/tĩnh mạch",
        abbreviation: "Tỷ lệ A/V",
        normalRef: "Bình thường: ~0.67",
        clinicalSignificance: "Đánh giá mức độ co hẹp mạch máu",
      },
      vesselDensity: {
        label: "Mật độ mạch máu",
        unit: "%",
        normalRef: "Bình thường: 16.0% – 22.0%",
        clinicalSignificance: "Đánh giá tưới máu võng mạc",
      },
      tortuosity: {
        label: "Độ ngoằn ngoèo mạch máu",
        unit: "",
        normalRef: "Bình thường: 1.10 – 1.20",
        clinicalSignificance: "Đánh giá áp lực thành mạch",
      },
      cdr: {
        label: "Tỷ lệ lõm đĩa thị",
        abbreviation: "Tỷ lệ C/D",
        normalRef: "Bình thường: 0.30 – 0.40",
        clinicalSignificance: "Đánh giá nguy cơ tăng nhãn áp (cườm nước)",
      },
    },
    clinicalDecision: {
      title: "Đánh giá của Bác sĩ",
      approve: "Đồng ý với AI",
      modify: "Hiệu chỉnh kết quả",
      reject: "Bác bỏ kết quả",
      doctorNotesPlaceholder: "Nhập ghi chú chẩn đoán, dặn dò hoặc lý do điều chỉnh...",
      signerLabel: "Bác sĩ ký duyệt",
      signatureVerified: "Đã ký duyệt",
      saveSuccess: "Đã lưu kết quả thành công!",
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
        "Mạch máu mắt bình thường, không thấy tổn thương.",
        "Duy trì lối sống lành mạnh, ăn uống đủ chất.",
        "Nên kiểm tra mắt định kỳ 12 tháng/lần.",
      ],
      moderate: [
        "Có dấu hiệu co hẹp nhẹ mạch máu; nên theo dõi huyết áp và đường huyết.",
        "Ăn giảm muối, hạn chế dầu mỡ, vận động nhẹ nhàng.",
        "Nên khám chuyên khoa sau 3 - 6 tháng.",
      ],
      high: [
        "Mạch máu có tổn thương rõ; cần đi khám mắt chuyên sâu.",
        "Nên kiểm tra tim mạch và huyết áp toàn thân.",
        "Tái khám chuyên khoa trong 2 - 4 tuần.",
      ],
      critical: [
        "Tổn thương mạch máu mức độ nặng, cần khám ngay.",
        "Đến ngay bệnh viện mắt hoặc cơ sở y tế gần nhất.",
        "Tránh vận động gắng sức trước khi được bác sĩ khám.",
      ],
    },
    anomalies: {
      Microaneurysm: "Vi phình mạch",
      Hemorrhage: "Xuất huyết võng mạc",
      Hard_Exudate: "Xuất tiết cứng",
      AV_Nipping: "Bắt chéo mạch máu",
      Focal_Narrowing: "Co thắt mạch máu",
      Cotton_Wool_Spot: "Đốm bông (Xuất tiết mềm)",
      Neovascularization: "Tân mạch võng mạc",
      Venous_Beading: "Tĩnh mạch chuỗi hạt",
      confidence: "Độ tin cậy",
    },
    cdsViewer: {
      title: "Bản đồ nhiệt vi mạch AI",
      patientNotice: "AI làm nổi bật vùng nghi ngờ tổn thương (màu đỏ/vàng) để bác sĩ lưu ý.",
      darkRoom: "Buồng tối",
      darkRoomOn: "Buồng tối: BẬT",
      darkRoomTitle: "Chế độ nền tối giúp nhìn rõ mạch máu",
      zoomIn: "Phóng to",
      zoomOut: "Thu nhỏ",
      resetZoom: "Chuẩn",
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
      title: "Tải ảnh mắt",
      subtitle: "Hỗ trợ PNG, JPG, DICOM (tối đa 15MB). Bảo mật an toàn.",
      useSample: "Dùng ảnh mẫu",
      loadingSample: "Đang nạp ảnh...",
      securityBadge: "Bảo mật",
      selectEye: "Chọn mắt chụp",
      selectScanType: "Chọn kiểu chụp",
      rightEyeLabel: "Mắt Phải",
      leftEyeLabel: "Mắt Trái",
      dragDrop: "Kéo thả ảnh hoặc bấm để tải lên",
      chooseFile: "Chọn ảnh mắt",
      uploadedFile: "Ảnh đã chọn",
      fileSizeError: "Dung lượng ảnh vượt quá dung lượng tối đa cho phép (15MB).",
      fileEmptyError: "Tệp rỗng (0 bytes). Vui lòng chọn ảnh khác.",
      fileFormatError: "Định dạng tệp không được hỗ trợ. Chỉ hỗ trợ file PNG, JPG, JPEG, DICOM.",
      availableQuota: "Lượt khám khả dụng:",
      quotaUnit: "lượt",
      topUp: "Nạp thêm",
      startAnalysis: "Phân tích ngay",
      analyzing: "Đang phân tích...",
      retry: "Thử lại",
      closeNotice: "Đóng",
      analysisFailed: "Không thể phân tích ảnh",
      fileCheckError: "Lỗi kiểm tra ảnh",
    },
    login: {
      tabLogin: "Đăng nhập",
      tabRegister: "Đăng ký",
      titleLogin: "Đăng nhập",
      titleRegister: "Đăng ký",
      subtitleLogin: "Đăng nhập tài khoản AURA",
      subtitleRegister: "Tạo tài khoản sử dụng AURA",
      emailLabel: "Địa chỉ Email",
      passwordLabel: "Mật khẩu",
      submitLogin: "Đăng nhập",
      submitRegister: "Đăng ký",
      switchLanguage: "Đổi ngôn ngữ",
    },
    auth: {
      loginForm: {
        email: "Email",
        password: "Mật khẩu",
        loginButton: "Đăng nhập",
        rememberMe: "Ghi nhớ",
        forgotPassword: "Quên mật khẩu?",
        errorMessages: {
          invalidCredentials: "Email hoặc mật khẩu không chính xác.",
          emailRequired: "Vui lòng nhập email.",
          passwordRequired: "Vui lòng nhập mật khẩu.",
          generalError: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        },
        loggingIn: "Đang đăng nhập...",
        signInWithGoogle: "Đăng nhập bằng Google",
        signInWithMagicLink: "Đăng nhập bằng liên kết Email",
        magicLinkSent: "Đã gửi liên kết qua Email",
        orDivider: "Hoặc",
        accountEmailLabel: "Email tài khoản",
      },
      registerForm: {
        fullName: "Họ và tên",
        email: "Email",
        password: "Mật khẩu",
        confirmPassword: "Xác nhận mật khẩu",
        phone: "Số điện thoại",
        roleSelection: "Vai trò",
        registerButton: "Tạo tài khoản",
        termsConsent: "Tôi đồng ý với Điều khoản Sử dụng và Bảo mật",
        signUpWithGoogle: "Đăng ký bằng Google",
        orDivider: "Hoặc",
        optionalLabel: "Tùy chọn",
        passwordRequirementsHint: "Mật khẩu 12–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
        verifyOtpTitle: "Xác thực OTP",
        otpSentTo: "Mã OTP 6 số đã được gửi tới:",
        enterOtpLabel: "Nhập mã OTP 6 số",
        resendIn: "Gửi lại sau",
        resendOtpBtn: "Gửi lại OTP",
        verifyAndCreateBtn: "Xác thực & Tạo tài khoản",
        changeEmailBtn: "Đổi email",
        sendingOtp: "Đang gửi OTP...",
        verifyingOtp: "Đang xác thực...",
      },
      authHeroPanel: {
        tagline: "Hệ thống AI Tầm soát Võng mạc & Nguy cơ Tim mạch",
        hipaaCompliant: "Bảo mật HIPAA & ISO 27001",
        aiAccuracy: "AI chuẩn đoán chính xác, minh bạch",
        clinicalBenefits: "Phát hiện sớm nguy cơ đột quỵ và biến chứng tiểu đường",
        trustedByHospitals: "Được tin cậy bởi các cơ sở y tế chuyên khoa",
        aiScreeningSupport: "AI hỗ trợ sàng lọc",
        retinalAnalysis: "Phân tích ảnh võng mạc",
        medicalWarning: "Kết quả chỉ hỗ trợ sàng lọc và không thay thế chẩn đoán của bác sĩ.",
      },
      verifyEmailLink: {
        verifying: "Đang xác thực...",
        success: "Xác thực thành công! Đang chuyển hướng...",
        invalidLink: "Liên kết không hợp lệ hoặc đã hết hạn.",
        returnToLogin: "Quay lại đăng nhập",
        verifyingTitle: "Vui lòng chờ",
        verifyingStatus: "Đang xác thực...",
        signingInStatus: "Đang đăng nhập...",
        failedTitle: "Đăng nhập thất bại",
        emailRequiredError: "Cần nhập email để tiếp tục.",
        loginFailedError: "Đăng nhập thất bại.",
      },
      passwordInput: {
        showPassword: "Hiện mật khẩu",
        hidePassword: "Ẩn mật khẩu",
      },
    },
    patient: {
      dashboard: {
        greeting: "Xin chào",
        healthStatus: "Đánh giá sức khỏe mắt",
        quickActions: {
          uploadScan: "Tải ảnh mắt",
          viewHistory: "Lịch sử khám",
          doctorChat: "Nhắn tin Bác sĩ",
          updateProfile: "Hồ sơ sức khỏe",
        },
        recentScansTable: "Lần khám gần đây",
        creditsRemaining: "Lượt khám còn lại",
      },
      history: {
        title: "Lịch sử khám",
        searchPlaceholder: "Tìm mã khám, bác sĩ, ghi chú...",
        filters: {
          eye: "Mắt khám",
          risk: "Mức nguy cơ",
          scanType: "Kiểu chụp",
          sort: "Sắp xếp",
          resetFilters: "Đặt lại",
          resetFiltersTooltip: "Đặt lại bộ lọc về mặc định",
          resetFiltersNotice: "Đã đặt lại bộ lọc.",
        },
        columns: {
          date: "Ngày khám",
          eye: "Mắt chụp",
          modality: "Kiểu chụp",
          riskLevel: "Mức nguy cơ",
          status: "Trạng thái",
          doctor: "Bác sĩ",
          action: "Thao tác",
        },
        emptyState: "Chưa có ca khám nào.",
        viewDetails: "Xem chi tiết",
        exportReport: "Xuất phiếu",
        immutabilityNotice: "Hồ sơ bệnh án điện tử (EMR) được lưu trữ an toàn theo tiêu chuẩn HIPAA & Bộ Y Tế.",
      },
      results: {
        summaryTitle: "Đánh Giá Sức Khỏe Mắt",
        cardiovascularRiskScore: "Nguy cơ tim mạch",
        diabeticRetinopathyGrade: "Võng mạc tiểu đường",
        microvascularBiomarkers: "Chỉ số mạch máu mắt",
        aiRationale: "Kết quả phân tích AI",
        clinicalRecommendation: "Lời dặn của bác sĩ",
        print: "In kết quả",
        share: "Chia sẻ",
        askDoctor: "Nhắn tin Bác sĩ",
      },
      chat: {
        consultationTitle: "Nhắn tin với Bác sĩ",
        assignedDoctor: "Bác sĩ phụ trách",
        onlineStatus: "Trực tuyến",
        placeholder: "Nhập tin nhắn trao đổi với Bác sĩ...",
        sendButton: "Gửi",
        emptyChat: "Chưa có tin nhắn nào. Nhập tin nhắn bên dưới để trao đổi với Bác sĩ.",
        emergencyNotice: "Trường hợp khẩn cấp, vui lòng đến ngay cơ sở y tế hoặc gọi 115.",
      },
      profile: {
        personalInfo: "Thông tin cá nhân",
        dob: "Ngày sinh",
        gender: "Giới tính",
        bloodType: "Nhóm máu",
        diabetesType: "Tiểu đường",
        hypertension: "Tăng huyết áp",
        smokingStatus: "Hút thuốc lá",
        medications: "Thuốc đang dùng",
        saveProfile: "Lưu hồ sơ",
      },
      credit: {
        currentQuota: "Lượt khám còn lại",
        packageOptions: "Các gói lượt khám",
        pricing: "Bảng giá",
        buyNow: "Mua gói",
        transferInstructions: "Hướng dẫn chuyển khoản",
      },
    },
    doctor: {
      cds: {
        title: "Bàn chẩn đoán AI",
        pendingReviewsCount: "Chờ duyệt",
        urgentCases: "Nguy cơ cao",
        reviewedToday: "Đã duyệt hôm nay",
        totalAssigned: "Tổng bệnh nhân",
        recentPatientsQueue: "Hàng đợi bệnh nhân",
        quickInspection: "Soi mạch máu",
        loading: "Đang tải dữ liệu...",
        syncing: "Đang đồng bộ danh sách bệnh nhân...",
        noAssignedTitle: "Chưa có bệnh nhân",
        noAssignedDesc: "Tài khoản bác sĩ chưa được phân công bệnh nhân nào.",
        viewPatientList: "Xem danh sách BN",
        reload: "Tải lại",
        feedbackSuccess: "Đã lưu đánh giá và cập nhật hồ sơ",
        screeningNotice: "Thông báo",
        selectPatientFirst: "Vui lòng chọn một bệnh nhân trước khi tải ảnh.",
        switchPatient: "Đổi BN",
        message: "Nhắn tin",
        printResult: "In kết quả",
        noResultsYet: "Chưa có kết quả",
        noResultsDesc: "Bệnh nhân này chưa có dữ liệu khám.",
        loadingScreeningHistory: "Đang tải lịch sử khám...",
        bloodPressure: "Huyết áp",
        hba1c: "HbA1c",
        attendingDoctor: "Bác sĩ phụ trách",
        notMeasured: "Chưa đo",
        notTested: "Chưa xét nghiệm",
        yearsOld: "tuổi",
      },
      worklist: {
        title: "Danh sách ca khám phân công",
        search: "Tìm theo tên, mã BN...",
        searchLabel: "Tìm kiếm bệnh nhân",
        searchPlaceholder: "Tìm tên, mã BN...",
        reviewStatusLabel: "Trạng thái thẩm định",
        riskLevelLabel: "Mức nguy cơ",
        refresh: "Làm mới",
        addPatient: "Thêm BN",
        reset: "Đặt lại",
        filterTabs: {
          pending: "Chờ duyệt",
          reviewed: "Đã duyệt",
          all: "Tất cả",
        },
        riskFilters: "Lọc theo mức nguy cơ",
        columns: {
          patient: "Bệnh nhân",
          patientId: "Mã BN",
          date: "Ngày chụp",
          scanType: "Kiểu chụp",
          aiRisk: "AI đánh giá",
          doctorRisk: "Bác sĩ kết luận",
          status: "Trạng thái",
          action: "Thao tác",
          vitals: "Sinh hiệu",
        },
        reviewButton: "Xem & Duyệt",
        openCds: "Mở CDS",
        pendingReview: "Chờ duyệt",
        reviewed: "Đã duyệt",
        priorityCritical: "Ưu tiên duyệt ngay",
        priorityHigh: "Nguy cơ cao",
        priorityModerate: "Cần theo dõi",
        priorityLow: "Mạch máu ổn định",
        criticalLevel: "Nguy kịch",
        highLevel: "Nguy cơ cao",
        moderateLevel: "Trung bình",
        lowLevel: "Nguy cơ thấp",
        allLevels: "Tất cả mức độ",
        allStatuses: "Tất cả trạng thái",
        emptyFiltered: "Không tìm thấy bệnh nhân phù hợp.",
        totalAssignedNotice: "Tổng cộng {count} bệnh nhân phụ trách.",
      },
      diagnosisModal: {
        title: "Thẩm định kết quả và Ký số kết luận lâm sàng",
        aiPreliminary: "Kết quả phân tích sơ bộ từ AI",
        patientLabel: "Bệnh nhân",
        analysisIdLabel: "Mã ca",
        decisionLabel: "Quyết định của Bác sĩ:",
        doctorDecision: {
          approve: "Đồng Ý AI",
          modify: "Chỉnh Sửa",
          reject: "Bác Bỏ",
        },
        adjustedCardio: "Nguy cơ tim mạch hiệu chỉnh",
        adjustedDR: "Võng mạc tiểu đường hiệu chỉnh",
        icd10Select: "Chỉ định mã ICD-10",
        doctorNotes: "Ghi chú & Lời dặn của bác sĩ",
        defaultNotes: "Bác sĩ chuyên khoa đã xem và duyệt kết quả phân tích AI.",
        digitalSign: "Ký duyệt kết quả",
        signedAt: "Thời điểm ký",
        signerName: "Bác sĩ ký duyệt",
        saveButton: "Lưu và Ký duyệt hồ sơ",
        pkiSignatureLabel: "Chữ ký số PKI:",
        cancel: "Hủy",
        icdOptions: {
          h350: "H35.0 — Biến đổi mạch máu võng mạc",
          e113: "E11.3 — Bệnh võng mạc đái tháo đường",
          i10: "I10 — Tăng huyết áp vô căn",
          h401: "H40.1 — Glaucoma góc mở",
          h353: "H35.3 — Thoái hóa hoàng điểm",
        },
      },
      patientList: {
        title: "Danh sách bệnh nhân",
        search: "Tìm kiếm bệnh nhân...",
        genderFilter: "Giới tính",
        columns: {
          name: "Họ và tên",
          age: "Tuổi",
          gender: "Giới tính",
          phone: "Điện thoại",
          lastScan: "Lần khám gần nhất",
          riskLevel: "Mức nguy cơ",
          actions: "Thao tác",
        },
        viewProfile: "Xem hồ sơ",
        assignDoctor: "Phân công Bác sĩ",
      },
      reportsView: {
        title: "Hồ Sơ Báo Cáo Y Khoa & Ký Duyệt",
        subtitle: "Xem báo cáo, ký số và in phiếu kết quả cho bệnh nhân.",
        filter: "Bộ lọc",
        totalReports: "Tổng Số Hồ Sơ Báo Cáo",
        pendingReview: "Chờ Bác Sĩ Thẩm Định",
        reviewed: "Đã Ký Duyệt Lâm Sàng",
        searchLabel: "Tìm kiếm báo cáo",
        searchPlaceholder: "Tìm theo mã BN, tên bệnh nhân...",
        allTab: "Tất cả",
        pendingTab: "Chờ duyệt",
        reviewedTab: "Đã ký duyệt",
        listTitle: "Danh sách hồ sơ báo cáo",
        columns: {
          code: "Mã hồ sơ",
          patient: "Bệnh nhân",
          date: "Ngày ký",
          findings: "Kết luận lâm sàng",
          status: "Trạng thái",
          actions: "Thao tác",
          eye: "Mắt khám",
          aiRisk: "Nguy cơ AI",
          hmac: "Chữ ký số",
        },
        unsigned: "Chưa ký",
        reviewAndSign: "Xem & Ký",
        print: "In kết quả",
        exportPdf: "Xuất PDF",
        exportCsv: "Xuất CSV",
        downloadSignoff: "Tải chứng thư",
        emptyReports: "Không tìm thấy báo cáo phù hợp.",
        certModalTitle: "Chứng Thư & Chữ Ký Số",
        certModalDesc: "Xác thực tính toàn vẹn hồ sơ theo tiêu chuẩn HIPAA & HMAC",
        validCert: "Chữ ký số hợp lệ",
        sealedDesc: "Hồ sơ đã được niêm phong mật mã bởi bác sĩ chuyên khoa.",
        hmacHashLabel: "Mã băm chữ ký số HMAC:",
        close: "Đóng",
        approvedDecision: "Đồng ý với AI",
        modifiedDecision: "Hiệu chỉnh chuyên môn",
        signingDoctor: "Bác sĩ ký duyệt",
        signedAtLabel: "Thời điểm ký",
        recordCodeLabel: "Mã ca khám",
        patientLabel: "Bệnh nhân",
        clinicalDecisionLabel: "Quyết định",
      },
      riskAnalytics: {
        title: "Thống Kê Nguy Cơ",
        subtitle: "Tổng hợp phân bố nguy cơ và tỷ lệ đồng thuận với AI.",
        refresh: "Làm mới",
        populationDistribution: "Phân bố nguy cơ",
        riskMatrix: "Ma trận nguy cơ tim mạch & võng mạc",
        ageGroups: "Thống kê theo độ tuổi",
        hypertensionVsRetinopathyCorrelation: "Tương quan huyết áp & bệnh võng mạc",
        assignedPatients: "Bệnh Nhân Phụ Trách",
        assignedPatientsDesc: "Bệnh nhân trong danh sách quản lý",
        clinicallyReviewed: "Đã Duyệt Lâm Sàng",
        clinicallyReviewedDesc: "Ca sàng lọc đã ký số / xác nhận",
        pendingReview: "Chờ Thẩm Định",
        pendingReviewDesc: "Ca AI đã phân tích cần bác sĩ xem",
        consensusWithAi: "Đồng Thuận Với AI",
        consensusWithAiDesc: "Tỷ lệ đồng ý với phân tích AI",
        riskDistributionTitle: "Phân Bố Nguy Cơ Mạch Máu",
        totalCases: "Tổng: {count} ca",
        critical: "Nguy kịch",
        highRisk: "Nguy cơ cao",
        moderate: "Trung bình",
        lowNormal: "Thấp / Chuẩn",
        pctOfTotal: "{pct}% tổng số ca",
        avgBiomarkersTitle: "Chỉ Số Mạch Máu Trung Bình",
        cohortAverage: "Trung bình nhóm",
        avRatioLabel: "Tỷ lệ động/tĩnh mạch",
        avRatioRef: "Chuẩn tham chiếu: ~0.67",
        vesselDensityLabel: "Mật độ mạch máu",
        vesselDensityRef: "Bình thường: 42% - 50%",
        tortuosityLabel: "Độ xoắn vặn mạch máu",
        tortuosityRef: "Chuẩn: 0.08 - 0.12",
        cdrLabel: "Tỷ lệ lõm gai thị",
        cdrRef: "Bình thường: 0.3 - 0.4",
        avWarning: "Tỷ lệ động/tĩnh mạch < 0.50 phản ánh tình trạng co thắt tiểu động mạch võng mạc.",
        recentScreeningsTitle: "Danh Sách Ca Khám Phụ Trách Gần Nhất",
        filterTag: "Lọc: {filter}",
        viewAll: "Xem tất cả",
        emptyRecent: "Không có ca khám nào gần đây",
        modified: "Đã hiệu chỉnh",
        approvedSigned: "Đã ký duyệt",
      },
      consultation: {
        title: "Tư Vấn Bệnh Nhân Trực Tuyến",
        subtitle: "Trao đổi chuyên môn lâm sàng hai chiều thời gian thực qua WebSocket.",
        stompActive: "Trực tuyến",
        assignedPatients: "Bệnh Nhân Phụ Trách",
        searchPlaceholder: "Tìm theo tên, mã BN, SĐT...",
        noPatients: "Không tìm thấy bệnh nhân nào.",
        vitalBp: "HA",
        vitalHba1c: "HbA1c",
        attendingDoctor: "Bác sĩ phụ trách",
        openCds: "Mở CDS",
        openCdsTitle: "Mở ca khám này trên bàn chẩn đoán",
        safetyWarningTitle: "Cảnh báo an toàn y khoa:",
        safetyWarningText: "Kênh trao đổi y tế trực tuyến. Không dùng cho cấp cứu.",
        loadingHistory: "Đang tải tin nhắn...",
        noMessagesTitle: "Chưa có tin nhắn nào",
        noMessagesText: "Nhập tin nhắn hoặc chọn gợi ý bên dưới để trao đổi với bệnh nhân.",
        quickRepliesLabel: "Gợi ý nhanh:",
        quickReplies: [
          "Kết quả khám mắt của bạn đã được bác sĩ ký duyệt.",
          "Chỉ số mạch máu mắt ổn định, tiếp tục uống thuốc và đo huyết áp đều đặn.",
          "Mạch máu mắt có dấu hiệu co hẹp nhẹ, nên kiêng mặn và tái khám sau 3 tháng.",
          "Bác sĩ đã xuất phiếu kết quả, bạn có thể tải về từ hồ sơ.",
        ],
        inputPlaceholder: "Nhập tin nhắn dặn dò bệnh nhân...",
        sendButton: "Gửi",
        selectPatientPrompt: "Vui lòng chọn một bệnh nhân ở cột bên trái để bắt đầu nhắn tin.",
      },
      assignmentBoard: {
        title: "Điều phối bệnh nhân cho bác sĩ",
        subtitle: "Gán bệnh nhân cho bác sĩ phụ trách.",
        selectDoctorPlaceholder: "Chọn bác sĩ",
        assignButton: "Phân công",
        selected: "đã chọn",
        assignedNotice: "Đã phân công {count} bệnh nhân.",
        unassignedNotice: "Đã hủy phân công.",
        unassignedColumn: "Chưa phân công",
        allAssigned: "Tất cả bệnh nhân đã có bác sĩ phụ trách.",
        dropToAssign: "Thả bệnh nhân vào đây để phân công.",
        noMrn: "Chưa có mã BN",
        loading: "Đang tải bảng phân công...",
      },
      validationBar: {
        title: "Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc",
        subtitle: "Xác nhận kết quả AI hoặc điều chỉnh theo chuyên môn.",
        printReport: "In kết quả",
        savedSuccess: "Đã lưu kết quả thành công!",
        decisionLabel: "Đánh giá của bác sĩ:",
        decisions: {
          approve: "Chấp thuận AI",
          modify: "Hiệu chỉnh nguy cơ",
          reject: "Bác bỏ kết quả",
        },
        adjustedCardio: "Nguy cơ Tim mạch:",
        adjustedDR: "Võng mạc tiểu đường:",
        icd10Label: "Mã ICD-10 (cách nhau dấu phẩy):",
        notesLabel: "Ghi chú chẩn đoán & dặn dò:",
        saveButton: "Ký & Lưu Kết Quả",
        savingButton: "Đang lưu...",
      },
      newPatientModal: {
        title: "Tiếp Nhận Bệnh Nhân Mới",
        description: "Nhập thông tin cơ bản của bệnh nhân",
        fullName: "Họ và tên",
        mrn: "Mã bệnh nhân",
        age: "Tuổi",
        gender: "Giới tính",
        phone: "Số điện thoại",
        systolicBp: "HA Tâm thu",
        diastolicBp: "HA Tâm trương",
        hba1c: "HbA1c (%)",
        cancel: "Hủy",
        save: "Lưu",
      },
      reportModal: {
        exitEsc: "Thoát",
        close: "Đóng",
        officialReportTitle: "Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA",
        preliminaryReportTitle: "Báo Cáo Sàng Lọc Sơ Bộ AURA AI",
        dualEyeBadge: "Khám cả hai mắt",
        reportCode: "Mã phiếu:",
        exportCsv: "Xuất CSV",
        printPdf: "In Phiếu / PDF",
        systemTitle: "HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA",
        systemSubtitleReviewed: "Phiếu Báo Cáo Y Tế Chính Thức",
        systemSubtitlePreliminary: "Phiếu Đánh Giá Sơ Bộ",
        dualEyeSuffix: "(Cả hai mắt)",
        reportCodeLabel: "Mã Phiếu:",
        examDateLabel: "Ngày Khám:",
        reviewedStatus: "Đã duyệt",
        pendingStatus: "Chờ duyệt",
        unsigned: "Chưa ký",
        fullName: "Họ và tên:",
        patientId: "Mã BN:",
        ageGender: "Tuổi / Giới tính:",
        bpDiabetes: "Huyết áp / HbA1c:",
        section1: "1. Hình Ảnh Mắt & Bản Đồ Nhiệt AI",
        section2: "2. Đánh Giá Mức Nguy Cơ",
        section3: "3. Chỉ Số Mạch Máu Võng Mạc",
        section4: "4. Nhận Định AI & Lời Khuyên Bác Sĩ",
        section5: "5. Kết Luận & Chữ Ký Bác Sĩ",
        overallRisk: "Nguy cơ tổng hợp",
        cardioRisk: "Nguy cơ tim mạch",
        strokeRisk: "Dự báo đột quỵ",
        retinopathyRisk: "Võng mạc tiểu đường",
        glaucomaRisk: "Tăng nhãn áp (cườm nước)",
        colBiomarker: "Chỉ số sinh học",
        colOD: "Mắt Phải",
        colOS: "Mắt Trái",
        colMeasured: "Giá trị đo",
        colReference: "Chuẩn bình thường",
        colEvaluation: "Đánh giá",
        bmAvr: "Tỷ lệ Động/Tĩnh mạch",
        bmDensity: "Mật độ mạch máu",
        bmTortuosity: "Độ uốn lượn mạch máu",
        bmCdr: "Tỷ lệ lõm gai thị",
        doctorDecisionLabel: "Đánh giá bác sĩ:",
        doctorApproved: "Đồng ý với phân tích sơ bộ của AI",
        doctorModified: "Hiệu chỉnh theo chuyên môn bác sĩ",
        validSignature: "Chữ ký số hợp lệ",
        signedAtLabel: "Thời điểm ký:",
        reviewingSpecialist: "Bác sĩ ký duyệt:",
        noSignatureYet: "Chưa ký",
        dualComparisonHeader: "Đối chiếu hai mắt: Mắt Phải & Mắt Trái",
        icd10Label: "Mã bệnh danh (ICD-10):",
        doctorNotesTitle: "Lời dặn của Bác sĩ:",
        recommendationsTitle: "Lời khuyên theo dõi:",
        findingsTitle: "Nhận định AI:",
      },
    },
    clinic: {
      portal: {
        title: "Không gian quản lý sàng lọc phòng khám",
        subtitle: "Quản trị chiến dịch tầm soát vi mạch, phân công bác sĩ và thống kê dữ liệu lâm sàng.",
        batchScreeningStatus: "Trạng thái lô ảnh",
        activeCampaigns: "Chiến dịch đang chạy",
        assignedDoctors: "Bác sĩ phụ trách",
        quotaBalance: "Lượt khám còn lại",
        topUp: "Nạp thêm lượt",
        defaultFacility: "Phòng khám",
        profile: {
          title: "Hồ sơ phòng khám",
          verified: "Đã duyệt",
          rejected: "Từ chối",
          pending: "Chờ duyệt",
          loading: "Đang tải hồ sơ...",
          orgNameLabel: "Tên phòng khám / Cơ sở",
          orgNamePlaceholder: "Ví dụ: Phòng khám Mắt AURA",
          licenseNumberLabel: "Số giấy phép hoạt động",
          licenseNumberPlaceholder: "Ví dụ: 01234/SYT-GPHĐ",
          attachedDocLabel: "Giấy phép đính kèm",
          selectedFile: "Đã chọn",
          submitButton: "Gửi hồ sơ duyệt",
          submitSuccess: "Đã nộp hồ sơ, vui lòng chờ duyệt.",
          submitFailed: "Nộp hồ sơ thất bại.",
        },
        doctors: {
          title: "Đội ngũ Bác sĩ",
          addDoctorPlaceholder: "Nhập email bác sĩ...",
          addDoctorButton: "Thêm bác sĩ",
          addDoctorSuccess: "Đã thêm bác sĩ thành công.",
          addDoctorFailed: "Thêm bác sĩ thất bại.",
          colName: "Họ và tên",
          colEmail: "Email",
          colStatus: "Trạng thái",
          colActions: "Thao tác",
          noDoctors: "Chưa có bác sĩ nào.",
          statusActive: "Hoạt động",
          deleteTitle: "Xóa bác sĩ",
          confirmDelete: "Bạn có chắc muốn xóa bác sĩ này khỏi phòng khám?",
          assignTitle: "Phân công bệnh nhân",
          selectDoctor: "Chọn bác sĩ",
          patientIdLabel: "Mã bệnh nhân",
          patientIdPlaceholder: "Nhập mã BN...",
          assignButton: "Phân công",
          assignSuccess: "Đã phân công thành công.",
          assignFailed: "Phân công thất bại.",
        },
      },
      batchWorkspace: {
        batchList: "Danh sách lô ảnh",
        status: {
          queued: "Chờ xử lý",
          processing: "Đang xử lý",
          completed: "Hoàn tất",
          error: "Lỗi ảnh",
        },
        newBatchButton: "Tải lô ảnh mới",
        batchDetails: "Chi tiết lô ảnh",
        totalImages: "Tổng số ảnh trong đợt",
        batch: "Lô",
        newBatch: "Mới",
        completedAi: "Đã hoàn thành AI",
        rate: "Tỷ lệ",
        processingBackground: "Đang chạy",
        asyncQueue: "Hàng đợi",
        qualityError: "Lỗi chất lượng",
        retakeNeeded: "Cần chụp lại",
        searchLabel: "Tìm kiếm",
        searchPlaceholder: "Tìm tên tệp, mã khám...",
        clearSearch: "Xóa tìm kiếm",
        statusFilterLabel: "Trạng thái",
        allStatuses: "Tất cả trạng thái",
        statusCompleted: "Hoàn tất",
        statusProcessing: "Đang xử lý",
        statusFailed: "Lỗi",
        exportCsv: "Xuất CSV",
        campaignImagesTitle: "Danh sách tệp ảnh chiến dịch",
        facility: "Cơ sở",
        defaultFacility: "Trung tâm sàng lọc",
        batchIdLabel: "Mã",
        colFileId: "Mã tệp",
        colPatient: "Bệnh nhân (Ẩn danh)",
        colEye: "Mắt khám",
        colStatus: "Trạng thái",
        colActions: "Thao tác",
        viewDetail: "Chi tiết",
        defaultFundusName: "Ảnh mắt",
        emptyMessage: "Chưa có ảnh nào trong lô. Bấm 'Tải lô ảnh mới' để bắt đầu.",
        badgeQualityError: "Lỗi ảnh",
        badgeProcessing: "Đang chạy",
        badgeCompleted: "Đã xong",
      },
      batchProcessing: {
        batchTitle: "Tiến trình xử lý lô",
        progress: "Tiến độ tổng thể",
        itemsProcessed: "Số ảnh đã xử lý",
        successRate: "Tỷ lệ thành công",
        filterStatus: "Lọc trạng thái",
        filterRisk: "Lọc mức nguy cơ",
        itemsTable: "Danh sách ảnh trong lô",
        allStatuses: "Tất cả",
        statusDone: "Đã xong",
        statusProcessing: "Đang xử lý",
        statusPending: "Chờ",
        statusFailed: "Lỗi",
        allRisks: "Tất cả mức",
        riskHighCritical: "Nguy cơ cao (≥70%)",
        riskModerate: "Trung bình (40-69%)",
        riskLow: "Thấp (<40%)",
        allEyes: "Tất cả mắt",
        rightEye: "Mắt phải",
        leftEye: "Mắt trái",
        sortNewest: "Mới nhất",
        sortOldest: "Cũ nhất",
        sortRiskDesc: "Nguy cơ cao nhất",
        sortMrnAsc: "Theo mã BN (A-Z)",
        pageSize25: "25 ảnh / trang",
        pageSize50: "50 ảnh / trang",
        pageSize100: "100 ảnh / trang",
        pageSizeAll: "Tất cả",
        closeToast: "Đóng",
        campaignIdLabel: "Mã chiến dịch:",
        readyForNewBatch: "Sẵn sàng nhận lô mới",
        systemReady: "Hệ thống sẵn sàng",
        campaignSubtitle: "Chiến dịch tầm soát võng mạc",
        bulkQueueProgress: "Tiến độ xử lý hàng đợi AI",
        doneLabel: "Đã xong:",
        scansLabel: "ảnh",
        minScansStandard: "(≥100 ảnh)",
        timeRemaining: "Thời gian còn lại:",
        creditsManagement: "Quản lý lượt khám sàng lọc",
        availableCredits: "lượt khả dụng",
        syncedActivePackage: "Đồng bộ từ gói cước",
        topUpButton: "+ Mua thêm lượt",
        highRiskCard: "Nguy cơ cao",
        highRiskAction: "Cần bác sĩ xem ngay",
        moderateRiskCard: "Nguy cơ trung bình",
        moderateRiskAction: "Theo dõi định kỳ",
        lowRiskCard: "Nguy cơ thấp",
        lowRiskAction: "Mạch máu an toàn",
        queueProcessingCard: "Đang phân tích",
        runningScans: "Đang chạy:",
        allCompleted: "Đã hoàn tất",
        emergencyAlertTitle: "Phát hiện ca bệnh có nguy cơ cao",
        emergencyBannerTag: "Cảnh báo khẩn",
        emergencyDesc: "AI nhận diện tổn thương mạch máu mắt nặng. Cần ưu tiên bác sĩ hội chẩn.",
        hideList: "Ẩn danh sách",
        viewAlertDetails: "Xem chi tiết",
        urgentCaseList: "Danh sách ca cần can thiệp:",
        actionLabel: "Chỉ định:",
        aggregatedSurveillanceTitle: "Thống kê nguy cơ toàn bộ",
        riskDistributionTitle: "Chi tiết phân bổ mức nguy cơ",
        riskDistributionDesc: "Biểu đồ phân bổ tỷ lệ nguy cơ của các ca khám.",
        totalEvaluatedRecords: "Tổng ca:",
        meanVascularScore: "Điểm trung bình",
        highRiskRate: "Tỷ lệ nguy cơ cao",
        highSevereCases: "ca nguy cơ cao",
        threeYearStrokeRisk: "Dự báo đột quỵ",
        meanStrokeForecast: "Dự báo đột quỵ TB",
        lowRiskRate: "Tỷ lệ nguy cơ thấp",
        safeCases: "ca an toàn",
        donutMeanScore: "Điểm TB",
        outOf100: "/ 100",
        donutCaption: "Biểu đồ phân bố nguy cơ",
        riskBreakdownTitle: "Chi tiết phân bổ",
        lowRiskBand: "Nguy cơ thấp",
        moderateRiskBand: "Trung bình",
        highRiskBand: "Nguy cơ cao",
        criticalRiskBand: "Nguy kịch",
        casesCount: "ca",
        searchPlaceholder: "Tìm theo mã BN, tên, tệp...",
        deidentifiedModeOn: "Chế độ ẩn danh",
        deidentifiedModeOff: "Hiện thông tin",
        deidentifiedTooltip: "Bật/tắt chế độ ẩn danh thông tin bệnh nhân",
        printReportButton: "In báo cáo",
        exportCsvButton: "Xuất CSV",
        uploadFolderButton: "Tải thư mục (≥100 ảnh)",
        colNum: "#",
        colThumbnail: "Ảnh mắt",
        colPatientMrn: "Bệnh nhân / Mã BN",
        colEye: "Mắt",
        colStatus: "Trạng thái",
        colRiskAssessment: "Mức nguy cơ",
        colClinicalVitals: "Thông số lâm sàng",
        colActions: "Xem chi tiết",
        emptyRecords: "Không tìm thấy ca khám phù hợp.",
        viewCdsButton: "Xem chi tiết →",
        badgeCompleted: "Đã xong",
        badgeProcessing: "Đang chạy",
        badgePending: "Chờ xử lý",
        badgeError: "Lỗi ảnh",
        showingPagination: "Hiển thị:",
        pageOf: "Trang",
        firstPageTitle: "Trang đầu",
        prevPageTitle: "Trang trước",
        nextPageTitle: "Trang sau",
        lastPageTitle: "Trang cuối",
      },
      batchUploadModal: {
        uploadTitle: "Tải lên lô ảnh võng mạc hàng loạt",
        selectClinic: "Chọn phòng khám",
        selectEye: "Chọn mắt chụp",
        dropzone: "Kéo thả thư mục hoặc chọn nhiều ảnh (PNG, JPG, DICOM)",
        filesSelected: "Số tệp đã chọn",
        uploading: "Đang tải ảnh lên...",
        assignDoctor: "Chỉ định Bác sĩ duyệt lô",
        submitBatch: "Bắt đầu phân tích lô",
        standardBadge: "Chuẩn lâm sàng",
        description: "Tiếp nhận ảnh chiến dịch và phân tích qua AI.",
        campaignNameLabel: "Tên chiến dịch tầm soát",
        campaignNamePlaceholder: "Ví dụ: Tầm soát võng mạc 2026...",
        facilityLabel: "Phòng khám phụ trách",
        satelliteOption: "Điểm khám lưu động",
        dropzoneHint: "Hỗ trợ tệp ảnh DICOM, TIFF, PNG, JPG từ máy chụp võng mạc.",
        selectFilesButton: "Chọn nhiều tệp ảnh",
        selectFolderButton: "Kéo thư mục ảnh",
        quickDemoTitle: "Dữ liệu mẫu",
        quickDemoDesc: "Tạo nhanh 100 ca khám mẫu để kiểm thử.",
        loadDemoButton: "Nạp nhanh 100 ảnh mẫu",
        demoStandardBadge: "Dữ liệu mẫu (≥ 100 ảnh)",
        preflightTitle: "Kiểm tra trước tải lên:",
        scansLoaded: "ảnh đã nạp",
        standardPassed: "Đạt chuẩn ≥ 100 ảnh",
        standardRequired: "Yêu cầu ≥ 100 ảnh",
        quickAssignLabel: "Gán nhanh:",
        allOdButton: "Tất cả Mắt Phải",
        allOsButton: "Tất cả Mắt Trái",
        alternateEyesButton: "Xen kẽ hai mắt",
        fillSampleVitalsButton: "Điền sinh hiệu mẫu",
        fillVitalsTooltip: "Tự động điền huyết áp và HbA1c mẫu",
        filterAllEyes: "Tất cả mắt",
        filterOd: "Chỉ Mắt Phải",
        filterOs: "Chỉ Mắt Trái",
        clearAllButton: "Xóa tất cả",
        emptyStaged: "Chưa có ảnh nào. Kéo thả thư mục hoặc bấm 'Nạp nhanh 100 ảnh mẫu'.",
        colNum: "STT",
        colPreview: "Xem trước",
        colFileName: "Tên tệp",
        colMrnPatient: "Mã BN / Bệnh nhân",
        colEyePosition: "Mắt chụp",
        colVitals: "Sinh hiệu (HA / HbA1c)",
        colActions: "Thao tác",
        moreScansCount: "ảnh khác trong lô.",
        estimatedConsumption: "Dự kiến tiêu hao:",
        availableBalance: "Còn lại:",
        cancelButton: "Hủy",
        deidentifyingQueuing: "Đang chuẩn bị phân tích...",
        startBatchButton: "Bắt đầu phân tích lô",
        defaultCampaignName: "Chiến dịch tầm soát võng mạc & tim mạch",
      },
      batchDetailModal: {
        itemDetails: "Chi tiết ca khám trong lô",
        eye: "Mắt chụp",
        scanType: "Kiểu chụp",
        biomarkers: "Chỉ số mạch máu",
        rawFundus: "Ảnh mắt gốc",
        heatmap: "Bản đồ nhiệt AI",
        doctorSignoffStatus: "Trạng thái duyệt",
        deidHipaa: "Chế độ ẩn danh:",
        fileLabel: "Tệp:",
        overallVascularRisk: "Nguy cơ mạch máu chung",
        modelName: "Mô hình AI AURA",
        cardiovascularRisk: "Nguy cơ tim mạch",
        score2Ai: "Mô hình dự báo tim mạch",
        arteriolarNarrowing: "Co hẹp mạch máu",
        drRisk: "Võng mạc tiểu đường",
        icdrGrade: "Phân độ quốc tế ICDR",
        microaneurysms: "Vi phình mạch & xuất huyết",
        threeYearStroke: "Đột quỵ 3 năm",
        strokeProjection: "Dự báo đột quỵ",
        gunnSign: "Dấu hiệu Gunn",
        heatmapOpacityLabel: "Độ mờ bản đồ:",
        zoomOutTitle: "Thu nhỏ",
        zoomInTitle: "Phóng to",
        resetZoomTitle: "Đặt lại zoom",
        lesionBoxesRoi: "Vùng tổn thương",
        anatomyMarkers: "Mốc giải phẫu",
        sideBySideView: "Xem song song",
        directOverlayView: "Chồng lớp",
        downloadPng: "Tải PNG",
        nativeFundusTitle: "Ảnh mắt gốc",
        nativeResolution: "512 × 512 px",
        opticDiscLabel: "Gai thị",
        maculaLabel: "Hoàng điểm",
        formatLabel: "Định dạng:",
        heatmapLesionTitle: "Bản đồ nhiệt Grad-CAM & vùng tổn thương",
        heatmapAvailable: "Bản đồ nhiệt sẵn sàng",
        noHeatmap: "Chưa có bản đồ",
        noHeatmapWarning: "Chưa có bản đồ nhiệt",
        hudHoverHint: "Rê chuột để xem tọa độ tổn thương",
        directOverlayTitle: "Chế độ chồng lớp AI trên ảnh gốc",
        directOverlaySubtitle: "Kéo thanh trượt để so sánh ảnh gốc và vùng tổn thương",
        detectedAnomaliesTitle: "Tổn thương AI phát hiện:",
        detectedAnomaliesHint: "Rê hoặc bấm để xem vị trí trên ảnh mắt",
        noFocalLesions: "Không phát hiện tổn thương",
        noLesionsDesc: "Không phát hiện vi phình mạch hoặc xuất huyết trên ảnh này.",
        biomarkersTitle: "Chỉ số sinh học vi mạch võng mạc",
        avrLabel: "Tỷ lệ động/tĩnh mạch",
        avrNormal: "Bình thường: ~0.67",
        tortuosityLabel: "Độ ngoằn ngoèo",
        tortuosityDesc: "Đánh giá áp lực thành mạch",
        vesselDensityLabel: "Mật độ mạch máu",
        vesselDensityDesc: "Mật độ mao mạch võng mạc",
        cdrLabel: "Lõm gai thị",
        cdrNormal: "Trong giới hạn an toàn",
        rationalesTitle: "Cơ sở phân tích AI",
        processingDuration: "Thời gian xử lý:",
        closeButton: "Đóng",
        zoneDisc: "Vùng gai thị",
        zoneMacula: "Vùng hoàng điểm",
        zoneSuperiorArcade: "Cung mạch trên",
        zoneInferiorArcade: "Cung mạch dưới",
        zonePosteriorPole: "Võng mạc cực sau",
        defaultRationale1: "Mạch máu võng mạc đều đặn, không có dấu hiệu tắc nghẽn.",
        defaultRationale2: "Chưa phát hiện dấu hiệu xơ cứng thành mạch.",
        defaultRationale3: "Tưới máu mạch máu mắt ổn định.",
        defaultRationaleMod1: "Có dấu hiệu co hẹp nhẹ mạch máu khu trú.",
        defaultRationaleMod2: "Độ uốn lượn mạch máu cần theo dõi thêm.",
        defaultRationaleHigh1: "Tỷ lệ A/V giảm (co hẹp tiểu động mạch rõ).",
        defaultRationaleHigh2: "Có dấu hiệu nén ép tại điểm bắt chéo mạch máu.",
        defaultRationaleHigh3: "Mạch máu ngoằn ngoèo do tăng áp lực.",
      },
      campaignAnalytics: {
        campaignTitle: "Báo cáo chiến dịch",
        totalScreened: "Tổng số ca đã khám",
        highRiskIdentified: "Số ca nguy cơ cao",
        coverageRate: "Tỷ lệ hoàn thành",
        demographicChart: "Biểu đồ nhân khẩu học",
        pageSubtitle: "Dữ liệu tổng hợp toàn bộ các đợt tầm soát.",
        loadingMessage: "Đang tải dữ liệu báo cáo chiến dịch lâm sàng...",
        errorTitle: "Lỗi tải dữ liệu",
        errorMessage: "Không thể kết nối đến máy chủ.",
        emptyTitle: "Chưa có dữ liệu",
        emptyDescription: "Phòng khám chưa có chiến dịch sàng lọc nào.",
        reloadButton: "Tải lại",
        exportCsvButton: "Xuất CSV",
        totalCampaignsCard: "Tổng số chiến dịch",
        totalCampaignsSub: "Chiến dịch đã tạo",
        totalImagesCard: "Tổng số ảnh",
        totalImagesSub: "Ảnh mắt đã phân tích AI",
        highRiskCard: "Nguy cơ cao",
        highRiskSub: "Ca cần theo dõi chuyên khoa",
      },
      creditPackage: {
        title: "Gói cước & Lượt khám",
        subtitle: "Theo dõi số lượt phân tích AI còn lại và lịch sử mua gói.",
        loading: "Đang tải dữ liệu hạn mức và gói cước phòng khám...",
        quotaDepletedTitle: "Đã hết lượt khám",
        quotaLowTitle: "Lượt khám sắp hết",
        quotaWarningDesc: "Hãy mua thêm lượt để không làm gián đoạn việc tải ảnh và phân tích AI.",
        topUpNow: "Nạp thêm lượt",
        refreshing: "Đang cập nhật...",
        refresh: "Làm mới",
        renewBuyButton: "Mua thêm gói",
        availableCredits: "Lượt còn lại",
        scansUnit: "lượt",
        statusAbundant: "Dồi dào",
        statusLow: "Sắp hết",
        statusDepleted: "Đã hết",
        scannedInBatch: "Đã quét trong đợt",
        totalCampaignScanned: "Tổng toàn chiến dịch:",
        activePackage: "Gói đang dùng",
        noActivePackage: "Chưa có gói",
        statusActive: "Đang dùng",
        statusUnregistered: "Chưa mua",
        validityPeriod: "Thời hạn",
        indefinite: "Vĩnh viễn",
        autoRenewNotice: "Tự động cộng dồn khi mua thêm",
        currentPlanNotice: "Áp dụng cho gói hiện tại",
        consumptionProgress: "Tiến độ sử dụng lượt khám",
        processedCount: "Đã dùng:",
        availableCount: "Còn lại:",
        processedInBatchLegend: "Đã dùng trong đợt",
        availableCreditsLegend: "Lượt còn lại khả dụng",
        packagesSectionTitle: "Bảng giá gói cước phòng khám",
        packagesSectionSubtitle: "Thiết kế cho các đợt tầm soát từ 500 đến 5.000 lượt phân tích AI.",
        vatSupportBadge: "Hỗ trợ hóa đơn VAT",
        recommendedRibbon: "Khuyên dùng",
        currentPlanBadge: "Đang dùng",
        currencyVnd: "VNĐ",
        plusScans: "lượt phân tích",
        validityDays: "Thời hạn:",
        featuresIncluded: "Bao gồm:",
        renewThisPackage: "Gia hạn gói",
        buyPackageNow: "Mua ngay",
        historySectionTitle: "Lịch sử giao dịch",
        historySectionSubtitle: "Nhật ký nạp tiền và hóa đơn dịch vụ.",
        reloadHistory: "Tải lại",
        colTxnId: "Mã giao dịch",
        colPackage: "Gói cước",
        colAmount: "Số tiền (VNĐ)",
        colScans: "Số lượt",
        colPaidDate: "Ngày thanh toán",
        colMethod: "Phương thức",
        colStatus: "Trạng thái",
        colReceipt: "Hóa đơn",
        emptyHistory: "Chưa có giao dịch nào.",
        emptyHistorySub: "Lịch sử nạp tiền sẽ hiển thị tại đây.",
        providerVietqr: "VietQR 24/7",
        providerMomo: "Ví MoMo",
        providerBank: "Chuyển khoản VietQR",
        providerVnpay: "VNPay QR",
        statusSuccess: "Thành công",
        statusPending: "Đang xử lý",
        statusFailed: "Thất bại",
        viewReceipt: "Xem hóa đơn",
        receiptTitle: "Hóa đơn điện tử",
        providerLabel: "Đơn vị cung cấp:",
        providerSystemName: "HỆ THỐNG AURA AI SCREENING",
        providerSystemDesc: "Nền tảng tầm soát võng mạc & nguy cơ tim mạch",
        invoiceIdLabel: "Mã hóa đơn:",
        servicePackageLabel: "Gói cước:",
        recordedTimeLabel: "Thời gian:",
        paymentGatewayLabel: "Cổng thanh toán:",
        settlementStatusLabel: "Trạng thái:",
        settledValid: "Thành công",
        totalPaidLabel: "Tổng thanh toán:",
        receiptDisclaimer: "Hóa đơn điện tử hợp lệ phục vụ thanh toán kinh phí.",
        closeReceipt: "Đóng",
        printReceipt: "In hóa đơn",
        complianceTitle: "Quy định sử dụng",
        complianceText: "Số lượt khám dùng để phân tích ảnh mắt hỗ trợ sàng lọc. Lượt chưa dùng sẽ được cộng dồn khi gia hạn trước ngày hết hạn.",
        pkgStarterName: "Gói Cơ Bản",
        pkgStarterDesc: "Dành cho phòng khám quy mô vừa và nhỏ.",
        pkgCampaignName: "Gói Chiến Dịch",
        pkgCampaignDesc: "Tối ưu cho các đợt khám cộng đồng và doanh nghiệp.",
        pkgHospitalName: "Gói Bệnh Viện",
        pkgHospitalDesc: "Dành cho bệnh viện mắt và trung tâm chẩn đoán hình ảnh.",
        pkgStarterFeatures: [
          "500 lượt phân tích ảnh mắt AI",
          "Đánh giá 4 mức nguy cơ",
          "Bản đồ nhiệt & tỷ lệ mạch máu A/V",
          "Xuất báo cáo PDF",
          "Tối đa 2 tài khoản bác sĩ",
          "Hỗ trợ kỹ thuật qua email",
        ],
        pkgCampaignFeatures: [
          "2.000 lượt phân tích ảnh mắt",
          "Xử lý nhanh hàng loạt ảnh theo lô",
          "Báo cáo thống kê toàn chiến dịch",
          "Phân công bệnh nhân cho bác sĩ",
          "Xuất báo cáo định dạng CSV/Excel",
          "Không giới hạn tài khoản bác sĩ",
          "Tiết kiệm 10% chi phí",
        ],
        pkgHospitalFeatures: [
          "5.000 lượt phân tích ảnh mắt ưu tiên",
          "Kết nối API với hệ thống bệnh viện",
          "Báo cáo thống kê thời gian thực",
          "Ký số chữ ký điện tử",
          "Hỗ trợ kỹ thuật 24/7",
          "Tùy biến mẫu báo cáo thương hiệu riêng",
          "Tiết kiệm 20% chi phí",
        ],
      },
    },
    admin: {
      dashboardTitle: "Quản trị hệ thống",
      dashboardSubtitle: "Quản lý tài khoản, phân quyền, gói dịch vụ và nhật ký.",
      tabs: {
        users: "Tài Khoản",
        rbac: "Phân Quyền",
        notifications: "Thông Báo",
        clinics: "Duyệt Phòng Khám",
        packages: "Gói Dịch Vụ",
        aiConfig: "Cấu Hình AI",
        audit: "Nhật Ký",
      },
      audit: {
        title: "Nhật ký hệ thống",
        subtitle: "Ghi vết mọi thao tác truy cập dữ liệu trong hệ thống.",
        searchByUserIp: "Tìm theo người dùng, hành động, IP...",
        severityFilter: "Mức cảnh báo",
        actionFilter: "Loại hành động",
        resetFilter: "Đặt lại",
        exportBtn: "Xuất Nhật Ký",
        emptyMessage: "Không có nhật ký phù hợp.",
        severityAll: "Tất cả mức",
        severityInfo: "Thông tin",
        severityWarning: "Cảnh báo",
        severityCritical: "Nguy kịch",
        columns: {
          timestamp: "Thời gian",
          user: "Người thực hiện",
          role: "Vai trò",
          action: "Hành động",
          resource: "Tài nguyên",
          ip: "Địa chỉ IP",
          severity: "Mức độ",
          actionResource: "Hành động & Tài nguyên",
          status: "Trạng thái",
        },
        exportAuditTrail: "Xuất nhật ký CSV",
        statusSuccess: "Thành công",
        statusFailed: "Thất bại",
      },
      userManagement: {
        title: "Quản lý tài khoản",
        subtitle: "Quản lý trạng thái và phân quyền người dùng.",
        userList: "Danh sách tài khoản",
        changeRole: "Đổi vai trò",
        activateDeactivate: "Khóa / Mở khóa",
        resetPassword: "Đặt lại mật khẩu",
        saveChanges: "Lưu thay đổi",
        searchPlaceholder: "Tìm tên hoặc email...",
        filterRole: "Vai trò",
        allRoles: "Tất cả vai trò",
        filterBtn: "Lọc",
        emptyUsers: "Không tìm thấy tài khoản nào.",
        editUser: "Sửa",
        changeRoleBtn: "Đổi Vai Trò",
        lockAccount: "Khóa",
        unlockAccount: "Mở khóa",
        deleteUser: "Xóa",
        deleteSuccess: "Đã xóa tài khoản thành công.",
        batchDeleteSuccess: "Đã xóa thành công các tài khoản đã chọn.",
        deleteModalTitle: "Xác Nhận Xóa Tài Khoản",
        deleteConfirmMessage: "Bạn có chắc chắn muốn xóa tài khoản này không? Tài khoản sẽ bị vô hiệu hóa và loại bỏ khỏi hệ thống.",
        batchDeleteModalTitle: "Xác Nhận Xóa Hàng Loạt",
        batchDeleteConfirmMessage: "Bạn có chắc chắn muốn xóa tất cả các tài khoản đã chọn không?",
        cannotDeleteSelf: "Không thể tự xóa tài khoản của chính mình.",
        activeStatus: "HOẠT ĐỘNG",
        suspendedStatus: "ĐÃ KHÓA",
        notUpdated: "Chưa cập nhật",
        activatedSuccess: "Đã mở khóa tài khoản.",
        suspendedSuccess: "Đã khóa tài khoản.",
        updatedSuccess: "Đã cập nhật thông tin.",
        roleUpdatedSuccess: "Đã đổi vai trò thành công.",
        editModalTitle: "Chỉnh Sửa Tài Khoản",
        emailLabel: "Email",
        fullNameLabel: "Họ và tên",
        phoneLabel: "Số điện thoại",
        addressLabel: "Địa chỉ",
        roleModalTitle: "Phân Quyền Vai Trò",
        roleModalDesc: "Chọn vai trò mới cho tài khoản:",
        confirmRoleBtn: "Xác Nhận",
      },
      rbac: {
        rolePermissionMatrix: "Phân quyền truy cập",
        subtitle: "Thiết lập quyền truy cập cho từng vai trò.",
        viewPermissions: "Xem bảng quyền",
        editPermissions: "Sửa quyền",
        savePolicy: "Lưu quyền",
        saveMatrix: "Lưu Ma Trận Quyền",
        savedSuccess: "Đã lưu phân quyền thành công.",
        activePermissions: "Quyền bật",
        permissionCatalogTitle: "Danh Sách Quyền Cho Vai Trò:",
      },
      aiConfig: {
        title: "Cấu hình AI",
        subtitle: "Điều chỉnh độ nhạy và ngưỡng phát hiện của AI.",
        modelSelection: "Mô hình AI",
        temperature: "Độ biến thiên",
        sensitivityThreshold: "Ngưỡng phát hiện tổn thương",
        endpointUrl: "Địa chỉ máy chủ AI",
        testConnection: "Kiểm tra kết nối AI",
        saveParameters: "Lưu Cấu Hình",
        glaucomaSensitivity: "Độ nhạy Tăng nhãn áp/Tim mạch",
        glaucomaHint: "Phát hiện sớm co thắt tiểu động mạch.",
        drConfidence: "Ngưỡng tin cậy Võng mạc tiểu đường",
        drHint: "Độ tin cậy tối thiểu để AI kết luận.",
        retrainThreshold: "Ngưỡng cảnh báo co thắt mạch",
        retrainHint: "Cảnh báo khi tỷ lệ A/V dưới ngưỡng.",
      },
      templates: {
        notificationTemplates: "Mẫu thông báo",
        subtitle: "Cấu hình nội dung tin nhắn qua Email, SMS và In-App.",
        channel: {
          email: "Email",
          inApp: "Thông báo app",
          sms: "SMS",
        },
        title: "Tiêu đề",
        content: "Nội dung mẫu",
        createTemplate: "Tạo mẫu mới",
        edit: "Sửa mẫu",
        delete: "Xóa mẫu",
        addTemplate: "Thêm Mẫu",
        subjectPrefix: "Tiêu đề:",
        statusPrefix: "Trạng thái:",
        activeStatus: "Đang bật",
        inactiveStatus: "Đang tắt",
        policiesTitle: "Chính sách gửi tin",
        policiesSubtitle: "Thiết lập kênh và quy tắc cảnh báo khẩn cấp.",
        savePolicies: "Lưu Chính Sách",
        activeChannelsTitle: "Kênh Hoạt Động",
        emergencyRulesTitle: "Quy Tắc Khẩn Cấp & Giờ Yên Tĩnh",
        inAppChannelLabel: "Thông báo ứng dụng (In-App)",
        emailChannelLabel: "Email (Kết quả & Phiếu khám)",
        smsChannelLabel: "Tin nhắn SMS (Cảnh báo nguy cơ cao)",
        criticalAlertLabel: "Cảnh báo khẩn cấp nguy kịch",
        criticalAlertDesc: "Gửi ngay lập tức bất kể giờ yên tĩnh",
        quietStartLabel: "Giờ bắt đầu yên tĩnh",
        quietEndLabel: "Giờ kết thúc yên tĩnh",
        retentionLabel: "Thời gian lưu trữ thông báo (ngày)",
        modalCreateTitle: "Tạo Mẫu Thông Báo",
        modalEditTitle: "Sửa Mẫu Thông Báo",
        codeLabel: "Mã mẫu",
        nameLabel: "Tên mẫu",
        channelLabel: "Kênh",
        subjectLabel: "Tiêu đề tin",
        bodyLabel: "Nội dung",
        descriptionLabel: "Mô tả",
        enableCheckbox: "Bật sử dụng mẫu này",
        saveTemplateBtn: "Lưu Mẫu",
        savedNotice: "Đã lưu mẫu thông báo.",
        policySavedNotice: "Đã cập nhật chính sách gửi tin.",
      },
      packages: {
        servicePackageList: "Gói dịch vụ",
        subtitle: "Cấu hình gói khám, số lượt và biểu phí.",
        packageName: "Tên gói",
        price: "Đơn giá",
        quota: "Số lượt khám",
        validity: "Thời hạn",
        activeToggle: "Mở bán",
        createPackage: "Tạo gói mới",
        refreshTooltip: "Làm mới danh sách",
        totalPackages: "Tổng Số Gói",
        activePackages: "Đang Mở Bán",
        userPackages: "Gói Cá Nhân",
        clinicPackages: "Gói Phòng Khám",
        searchPlaceholder: "Tìm gói theo tên, mã...",
        scopeAll: "Tất cả",
        scopeUser: "Cá nhân",
        scopeClinic: "Phòng khám",
        days: "ngày",
        lifetime: "Vĩnh viễn",
        active: "Đang bán",
        inactive: "Tạm ngưng",
        creditsUnit: "lượt",
        createModalTitle: "Tạo Gói Mới",
        editModalTitle: "Sửa Gói Dịch Vụ",
        createModalSubtitle: "Định nghĩa gói sàng lọc và mức phí",
        codeLabel: "Mã gói",
        nameLabel: "Tên gói",
        descLabel: "Mô tả",
        scopeLabel: "Đối tượng",
        creditsLabel: "Số lượt",
        priceLabel: "Đơn giá (VNĐ)",
        validityLabel: "Thời hạn (ngày, 0 = Vĩnh viễn)",
        featuresLabel: "Tính năng đi kèm (mỗi dòng 1 tính năng)",
        activeImmediateLabel: "Mở bán ngay",
        saveBtn: "Lưu Thay Đổi",
        createBtn: "Tạo Gói Mới",
        deactivateBtn: "Ngưng bán",
        activateBtn: "Mở bán",
        loadingList: "Đang tải danh sách...",
        emptyFiltered: "Không có gói nào phù hợp.",
        packageSavedNotice: "Đã cập nhật gói dịch vụ.",
        packageCreatedNotice: "Đã tạo gói mới thành công.",
        statusToggledNotice: "Đã cập nhật trạng thái mở bán.",
      },
      clinics: {
        title: "Duyệt phòng khám",
        subtitle: "Xét duyệt giấy phép và cấp quyền cho cơ sở y tế.",
        loading: "Đang tải hồ sơ...",
        empty: "Không có hồ sơ nào chờ duyệt.",
        licenseLabel: "Số giấy phép:",
        notProvided: "Chưa cung cấp",
        approve: "Phê Duyệt",
        reject: "Từ Chối",
        approvedSuccess: "Đã phê duyệt phòng khám.",
        rejectedSuccess: "Đã từ chối phòng khám.",
      },
    },
    footer: {
      copyright: "© 2026 Hệ thống Tầm soát Võng mạc AURA. Bản quyền được bảo hộ.",
      version: "Phiên bản 1.0.0",
      termsOfService: "Điều khoản Sử dụng",
      privacyPolicy: "Chính sách Bảo mật",
      medicalSafetyStatement:
        "Kết quả phân tích AI chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ chuyên khoa.",
      supportCenter: "Trung tâm Hỗ trợ",
      securityCert: "Đạt chuẩn HIPAA & ISO 13485 / ISO 27001",
    },
  },
  en: {
    common: {
      systemName: "AURA",
      systemFullName: "AURA Retinal Screening System",
      medicalDisclaimerTitle: "Medical Disclaimer",
      medicalDisclaimerText:
        "AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist.",
      mandatoryNotice: "Important Notice:",
      darkRoomOn: "Dark Mode: ON",
      darkRoomOff: "Dark Mode",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetZoom: "Reset",
      vesselOverlay: "Vessels",
      opacityLabel: "Heatmap Opacity",
      close: "Close",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading...",
      loadingInit: "Starting AURA...",
      statusLabel: "Status",
      refresh: "Refresh",
      retry: "Retry",
      printReport: "Print Report",
      exportCsv: "Export CSV",
      securityStandard: "Security",
      hipaaCompliant: "HIPAA Compliant",
      notifications: "Notifications",
      markAllAsRead: "Mark all read",
      noNotifications: "No new notifications.",
      newNotification: "New notification",
      dismiss: "Dismiss",
      pagination: {
        previous: "Previous",
        next: "Next",
        page: "Page",
        of: "of",
        perPage: "Rows / page",
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
        a: "A",
        b: "B",
        ab: "AB",
        o: "O",
        unknown: "Unknown",
      },
      diabetesType: {
        none: "None",
        type1: "Type 1",
        type2: "Type 2",
        gestational: "Gestational",
      },
      emptyStates: {
        noData: "No data found.",
        noResults: "No matching results.",
        noHistory: "No screening history.",
        noPatients: "No assigned patients.",
        noLogs: "No audit logs.",
      },
      confirmationModals: {
        confirmDelete: "Are you sure you want to delete this record? This cannot be undone.",
        confirmAction: "Please confirm that you want to proceed.",
        areYouSure: "Are you sure you want to proceed?",
      },
    },
    navigation: {
      dashboard: "Home",
      newScan: "Upload Scan",
      cdsWorkspace: "CDS Viewer",
      patientList: "Patients",
      historyReports: "Results & History",
      consultation: "Message Doctor",
      medicalProfile: "Medical Profile",
      billingCredits: "Credits & Plans",
      riskAnalytics: "Analytics",
      medicalReportsSignoff: "Review History",
      bulkScreening: "Batch Screening",
      campaignAnalytics: "Campaign Stats",
      doctorManagement: "Doctors",
      userManagement: "Users",
      rbacPermissions: "Permissions",
      aiConfiguration: "AI Config",
      auditLogs: "Audit Logs",
      logout: "Log Out",
      clinicApprovals: "Clinic Approvals",
      packageManagement: "Service Packages",
      notificationConfig: "Notifications",
      creditPackage: "Quota & Plans",
      groupOverview: "OVERVIEW",
      groupScreening: "SCREENING",
      groupCare: "CARE & CONSULT",
      groupBilling: "ACCOUNT & BILLING",
      groupClinical: "CLINICAL",
      groupAnalytics: "ANALYTICS",
      groupCommunication: "MESSAGES",
      groupCampaign: "CAMPAIGN",
      groupFacility: "STAFF & CLINIC",
      groupUserAdmin: "USER ADMIN",
      groupConfigAudit: "SETTINGS & LOGS",
      workspacePatient: "Patient Portal",
      workspaceDoctor: "Doctor Workspace",
      workspaceClinic: "Clinic Portal",
      workspaceAdmin: "Admin Portal",
    },
    roles: {
      patient: "Patient",
      doctor: "Doctor",
      clinic: "Clinic",
      admin: "Administrator",
    },
    header: {
      tagline: "Retinal health & stroke risk screening",
      notificationCenter: "Notifications",
      markAllAsRead: "Mark all read",
      noNotifications: "No new notifications.",
      newNotification: "New notification",
      gotIt: "Got it",
      hipaaStandard: "HIPAA Compliant",
      logout: "Log Out",
      scanResults: "Scan Results",
      doctorReviews: "Doctor Reviews",
      systemAlerts: "System Alerts",
      markAsUnread: "Mark as unread",
      clearAll: "Clear all",
      unread: "Unread",
      all: "All",
    },
    eyeLaterality: {
      rightEye: "Right Eye (OD)",
      rightEyeShort: "Right Eye",
      leftEye: "Left Eye (OS)",
      leftEyeShort: "Left Eye",
      bothEyes: "Both Eyes (OU)",
      bothEyesShort: "Both Eyes",
      selectEye: "Select Eye",
    },
    scanTypes: {
      maculaCentered: {
        label: "Macula (Center)",
        description: "Focuses on central macula and capillaries",
      },
      opticDisc: {
        label: "Optic Disc",
        description: "Focuses on optic nerve and vessel roots",
      },
      oct: {
        label: "OCT Scan",
        description: "Cross-sectional retinal layers",
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
        label: "Arteriovenous Ratio (A/V)",
        abbreviation: "A/V Ratio",
        normalRef: "Normal: ~0.67 (2:3)",
        clinicalSignificance: "Assesses vessel narrowing from high blood pressure",
      },
      vesselDensity: {
        label: "Vessel Density",
        unit: "%",
        normalRef: "Normal: 16.0% – 22.0%",
        clinicalSignificance: "Reflects retinal capillary blood flow",
      },
      tortuosity: {
        label: "Vessel Tortuosity",
        unit: "",
        normalRef: "Normal: 1.10 – 1.20",
        clinicalSignificance: "Related to blood pressure and vessel stiffness",
      },
      cdr: {
        label: "Cup-to-Disc Ratio (CDR)",
        abbreviation: "CDR",
        normalRef: "Normal: 0.30 – 0.40",
        clinicalSignificance: "Glaucoma risk indicator",
      },
    },
    clinicalDecision: {
      title: "Doctor Decision",
      approve: "Approve AI Findings",
      modify: "Adjust Assessment",
      reject: "Reject Findings",
      doctorNotesPlaceholder: "Enter diagnosis notes, advice or override rationale...",
      signerLabel: "Doctor & Signature",
      signatureVerified: "Signature Verified",
      saveSuccess: "Clinical findings and signature saved successfully!",
    },
    icd10: {
      "H35.0": "H35.0 — Retinal vascular changes",
      "H35.03": "H35.03 — Hypertensive retinopathy",
      "E11.3": "E11.3 — Type 2 diabetes with retinopathy",
      "E10.3": "E10.3 — Type 1 diabetes with retinopathy",
      "I10": "I10 — Essential hypertension",
      "H40.1": "H40.1 — Primary open-angle glaucoma",
      "H35.3": "H35.3 — Age-related macular degeneration (AMD)",
      "I63": "I63 — Ischemic stroke risk",
    },
    recommendations: {
      low: [
        "Retinal vessels look healthy with no abnormal signs.",
        "Maintain a healthy diet and regular physical activity.",
        "Get a routine eye screening once a year.",
      ],
      moderate: [
        "Mild vascular changes. Monitor your blood pressure and blood sugar regularly.",
        "Reduce salt, avoid tobacco, and exercise moderately.",
        "Consult a specialist within 3 to 6 months.",
      ],
      high: [
        "Notable vascular changes detected. Dilated eye exam strongly advised.",
        "Schedule a comprehensive cardiovascular checkup.",
        "Follow up with a doctor within 2 to 4 weeks.",
      ],
      critical: [
        "Severe abnormalities detected; urgent medical attention recommended.",
        "Visit an eye specialist or cardiology center immediately.",
        "Avoid heavy physical exertion before seeing a doctor.",
      ],
    },
    anomalies: {
      Microaneurysm: "Microaneurysm",
      Hemorrhage: "Hemorrhage",
      Hard_Exudate: "Hard Exudate",
      AV_Nipping: "A/V Nicking",
      Focal_Narrowing: "Vessel Narrowing",
      Cotton_Wool_Spot: "Cotton Wool Spot",
      Neovascularization: "Neovascularization",
      Venous_Beading: "Venous Beading",
      confidence: "Confidence",
    },
    cdsViewer: {
      title: "AI Heatmap & Vessel Viewer",
      patientNotice: "Red and yellow areas highlight regions of interest for doctor review.",
      darkRoom: "Dark Mode",
      darkRoomOn: "Dark Mode: ON",
      darkRoomTitle: "Toggle dark background for contrast",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      resetZoom: "Reset",
      vesselOverlay: "Vessels",
      opacityLabel: "Heatmap Opacity:",
      highAttention: "High Alert",
      monitoring: "Monitor",
      normal: "Normal",
      showCoordinates: "Show Coordinates",
      normalMicrovasculature: "Normal (0 lesions detected)",
      rawFundus: "Original Photo",
      rawFundusAlt: "Fundus Image",
      aiAttentionLayer: "AI Heatmap",
      noAnomaliesFound: "No lesions detected",
      negativeFindingBannerTitle: "Normal (0 lesions detected)",
      negativeFindingBannerDesc: "AI scanned all quadrants; no abnormal lesions found.",
      clinicallyNegative: "Negative (Normal)",
    },
    uploader: {
      title: "Upload Retinal Photo",
      subtitle: "Supports PNG, JPG, DICOM (max 15MB). Data is encrypted.",
      useSample: "Use Sample",
      loadingSample: "Loading...",
      securityBadge: "Security Standard",
      selectEye: "Select Eye",
      selectScanType: "Select Scan Type",
      rightEyeLabel: "Right Eye (OD)",
      leftEyeLabel: "Left Eye (OS)",
      dragDrop: "Drag and drop eye photo here or click to browse",
      chooseFile: "Choose File",
      uploadedFile: "Selected File",
      fileSizeError: "exceeds maximum size (15MB)",
      fileEmptyError: "File is empty. Please select a valid eye photo.",
      fileFormatError: "Unsupported format. Use DICOM, PNG, JPG or TIFF.",
      availableQuota: "Credits remaining:",
      quotaUnit: "credits",
      topUp: "Buy credits",
      startAnalysis: "Analyze Now",
      analyzing: "Analyzing...",
      retry: "Retry",
      closeNotice: "Close",
      analysisFailed: "Analysis could not be completed",
      fileCheckError: "File error",
    },
    login: {
      tabLogin: "Sign In",
      tabRegister: "Sign Up",
      titleLogin: "Sign In",
      titleRegister: "Create Account",
      subtitleLogin: "Access your AURA Workspace",
      subtitleRegister: "Create an account to use AURA",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      submitLogin: "Sign In",
      submitRegister: "Create Account",
      switchLanguage: "Language",
    },
    auth: {
      loginForm: {
        email: "Email address",
        password: "Password",
        loginButton: "Sign In",
        rememberMe: "Remember me",
        forgotPassword: "Forgot password?",
        errorMessages: {
          invalidCredentials: "Wrong email or password. Please check your details.",
          emailRequired: "Please enter your email.",
          passwordRequired: "Please enter your password.",
          generalError: "Sign-in error. Please try again.",
        },
        loggingIn: "Signing in...",
        signInWithGoogle: "Sign in with Google",
        signInWithMagicLink: "Sign in via Email Link",
        magicLinkSent: "Magic Link Sent",
        orDivider: "Or",
        accountEmailLabel: "Account email",
      },
      registerForm: {
        fullName: "Full name",
        email: "Email address",
        password: "Password",
        confirmPassword: "Confirm password",
        phone: "Phone number",
        roleSelection: "Role",
        registerButton: "Create account",
        termsConsent: "I agree to the Terms of Service & Privacy Policy",
        signUpWithGoogle: "Sign up with Google",
        orDivider: "Or",
        optionalLabel: "Optional",
        passwordRequirementsHint: "Password must be 12–128 characters with uppercase, lowercase, numbers, and symbols.",
        verifyOtpTitle: "Verify OTP Code",
        otpSentTo: "OTP code sent to:",
        enterOtpLabel: "Enter 6-digit OTP code",
        resendIn: "Resend in",
        resendOtpBtn: "Resend Code",
        verifyAndCreateBtn: "Verify & Create",
        changeEmailBtn: "Change email",
        sendingOtp: "Sending OTP...",
        verifyingOtp: "Verifying...",
      },
      authHeroPanel: {
        tagline: "AI Retinal Vascular & Stroke Risk Screening System",
        hipaaCompliant: "HIPAA & ISO 27001 Certified",
        aiAccuracy: "High accuracy with Explainable AI (XAI)",
        clinicalBenefits: "Early stroke and diabetic retinopathy detection",
        trustedByHospitals: "Trusted by clinics and hospitals",
        aiScreeningSupport: "AI Screening",
        retinalAnalysis: "Retinal Image Analysis",
        medicalWarning: "Results are for screening only and do not replace doctor diagnosis.",
      },
      verifyEmailLink: {
        verifying: "Verifying link...",
        success: "Verified! Redirecting...",
        invalidLink: "Invalid or expired link.",
        returnToLogin: "Return to sign in",
        verifyingTitle: "Please Wait",
        verifyingStatus: "Verifying link...",
        signingInStatus: "Signing in...",
        failedTitle: "Sign-In Failed",
        emailRequiredError: "Email is required.",
        loginFailedError: "Sign-in failed.",
      },
      passwordInput: {
        showPassword: "Show",
        hidePassword: "Hide",
      },
    },
    patient: {
      dashboard: {
        greeting: "Welcome",
        healthStatus: "Eye & Vascular Health",
        quickActions: {
          uploadScan: "Upload eye scan",
          viewHistory: "View history",
          doctorChat: "Message doctor",
          updateProfile: "Update profile",
        },
        recentScansTable: "Recent Scans",
        creditsRemaining: "Credits Remaining",
      },
      history: {
        title: "Screening History",
        searchPlaceholder: "Search by scan ID, doctor name, notes...",
        filters: {
          eye: "Eye",
          risk: "Risk level",
          scanType: "Scan type",
          sort: "Sort by",
          resetFilters: "Reset filters",
          resetFiltersTooltip: "Reset all search filters",
          resetFiltersNotice: "All filters reset to default.",
        },
        columns: {
          date: "Date",
          eye: "Eye",
          modality: "Type",
          riskLevel: "Risk",
          status: "Status",
          doctor: "Doctor",
          action: "Action",
        },
        emptyState: "No screening records found.",
        viewDetails: "View Details",
        exportReport: "Export Report",
        immutabilityNotice: "Electronic Medical Records (EMR) are securely preserved per HIPAA and clinical standards.",
      },
      results: {
        summaryTitle: "Screening Results Summary",
        cardiovascularRiskScore: "Cardiovascular Risk",
        diabeticRetinopathyGrade: "Diabetic Retinopathy",
        microvascularBiomarkers: "Vascular Biomarkers",
        aiRationale: "AI Reasoning",
        clinicalRecommendation: "Doctor Recommendations",
        print: "Print Report",
        share: "Share",
        askDoctor: "Message Doctor",
      },
      chat: {
        consultationTitle: "Online Consultation",
        assignedDoctor: "Assigned Doctor",
        onlineStatus: "Online",
        placeholder: "Type your question for the doctor...",
        sendButton: "Send",
        emptyChat: "No messages yet. Start chatting with your doctor.",
        emergencyNotice: "In an emergency, please visit the nearest hospital or call 115 immediately.",
      },
      profile: {
        personalInfo: "Personal Information",
        dob: "Date of birth",
        gender: "Gender",
        bloodType: "Blood type",
        diabetesType: "Diabetes",
        hypertension: "Hypertension",
        smokingStatus: "Smoking",
        medications: "Current medications",
        saveProfile: "Save Profile",
      },
      credit: {
        currentQuota: "Credits Left",
        packageOptions: "Service Packages",
        pricing: "Pricing",
        buyNow: "Buy Now",
        transferInstructions: "Bank Transfer Info",
      },
    },
    doctor: {
      cds: {
        title: "Clinical Decision Desk",
        pendingReviewsCount: "Pending Reviews",
        urgentCases: "Urgent Cases",
        reviewedToday: "Reviewed Today",
        totalAssigned: "Assigned Patients",
        recentPatientsQueue: "Patient Queue",
        quickInspection: "Quick Review",
        loading: "Loading doctor desk...",
        syncing: "Syncing assigned patients...",
        noAssignedTitle: "No Assigned Patients",
        noAssignedDesc: "You do not have any assigned patients at this time.",
        viewPatientList: "Patient List",
        reload: "Reload",
        feedbackSuccess: "Assessment saved and signed!",
        screeningNotice: "Notice",
        selectPatientFirst: "Please select a patient before uploading photos.",
        switchPatient: "Switch Patient",
        message: "Message",
        printResult: "Print Report",
        noResultsYet: "No Results Yet",
        noResultsDesc: "No screening records found for this patient.",
        loadingScreeningHistory: "Loading screening history...",
        bloodPressure: "Blood Pressure",
        hba1c: "HbA1c",
        attendingDoctor: "Doctor",
        notMeasured: "Not measured",
        notTested: "Not tested",
        yearsOld: "years old",
      },
      worklist: {
        title: "Assigned Screening Queue",
        search: "Search patients by name, code...",
        searchLabel: "Search patients",
        searchPlaceholder: "Search by name, code...",
        reviewStatusLabel: "Status",
        riskLevelLabel: "Risk level",
        refresh: "Refresh",
        addPatient: "Add Patient",
        reset: "Reset",
        filterTabs: {
          pending: "Pending",
          reviewed: "Reviewed",
          all: "All",
        },
        riskFilters: "Filter by risk",
        columns: {
          patient: "Patient",
          patientId: "Patient ID",
          date: "Scan Date",
          scanType: "Type",
          aiRisk: "AI Risk",
          doctorRisk: "Doctor Risk",
          status: "Status",
          action: "Action",
          vitals: "Vitals",
        },
        reviewButton: "Review & Sign",
        openCds: "Open CDS",
        pendingReview: "Pending",
        reviewed: "Reviewed",
        priorityCritical: "Needs immediate review",
        priorityHigh: "High risk lesions",
        priorityModerate: "Follow-up needed",
        priorityLow: "Stable",
        criticalLevel: "Critical",
        highLevel: "High risk",
        moderateLevel: "Moderate",
        lowLevel: "Low risk",
        allLevels: "All levels",
        allStatuses: "All statuses",
        emptyFiltered: "No patients match current filters.",
        totalAssignedNotice: "Total {count} patients in queue.",
      },
      diagnosisModal: {
        title: "Review & Sign Assessment",
        aiPreliminary: "AI Preliminary Assessment",
        patientLabel: "Patient",
        analysisIdLabel: "Scan ID",
        decisionLabel: "Doctor Decision:",
        doctorDecision: {
          approve: "Approve AI findings",
          modify: "Adjust assessment",
          reject: "Reject findings",
        },
        adjustedCardio: "Adjusted Cardiovascular Risk",
        adjustedDR: "Adjusted Diabetic Retinopathy",
        icd10Select: "Assign ICD-10 Code",
        doctorNotes: "Notes & Advice",
        defaultNotes: "Specialist validated and confirmed preliminary findings.",
        digitalSign: "Digital Sign-off",
        signedAt: "Signed at",
        signerName: "Doctor",
        saveButton: "Save & Sign",
        pkiSignatureLabel: "Digital Signature:",
        cancel: "Cancel",
        icdOptions: {
          h350: "H35.0 — Retinal vascular changes",
          e113: "E11.3 — Diabetic retinopathy",
          i10: "I10 — Hypertension",
          h401: "H40.1 — Glaucoma",
          h353: "H35.3 — Macular degeneration (AMD)",
        },
      },
      patientList: {
        title: "Patient Directory",
        search: "Search patients...",
        genderFilter: "Gender",
        columns: {
          name: "Full Name",
          age: "Age",
          gender: "Gender",
          phone: "Phone",
          lastScan: "Last Scan",
          riskLevel: "Risk Level",
          actions: "Actions",
        },
        viewProfile: "View Profile",
        assignDoctor: "Assign Doctor",
      },
      reportsView: {
        title: "Reports & Sign-off",
        subtitle: "Manage screening reports, digital signatures, and export options.",
        filter: "Filter",
        totalReports: "Total Reports",
        pendingReview: "Pending",
        reviewed: "Signed",
        searchLabel: "Search reports",
        searchPlaceholder: "Search by code, patient name...",
        allTab: "All",
        pendingTab: "Pending",
        reviewedTab: "Signed",
        listTitle: "Report List",
        columns: {
          code: "Report ID",
          patient: "Patient",
          date: "Date",
          findings: "Findings",
          status: "Status",
          actions: "Actions",
          eye: "Eye",
          aiRisk: "AI Risk",
          hmac: "Signature",
        },
        unsigned: "Unsigned",
        reviewAndSign: "Review & Sign",
        print: "Print",
        exportPdf: "PDF",
        exportCsv: "CSV",
        downloadSignoff: "Certificate",
        emptyReports: "No reports found matching filters.",
        certModalTitle: "Digital Signature Certificate",
        certModalDesc: "Integrity verified via HMAC-SHA256 standard",
        validCert: "Valid Signature",
        sealedDesc: "Record digitally signed by attending doctor.",
        hmacHashLabel: "Signature Hash:",
        close: "Close",
        approvedDecision: "Approved AI findings",
        modifiedDecision: "Adjusted findings",
        signingDoctor: "Doctor",
        signedAtLabel: "Signed at",
        recordCodeLabel: "Report ID",
        patientLabel: "Patient",
        clinicalDecisionLabel: "Doctor Decision",
      },
      riskAnalytics: {
        title: "Risk Analytics",
        subtitle: "Cohort vascular metrics, risk distribution, and AI agreement rate.",
        refresh: "Refresh",
        populationDistribution: "Risk Distribution",
        riskMatrix: "Cardiovascular vs Retinal Matrix",
        ageGroups: "Age Groups",
        hypertensionVsRetinopathyCorrelation: "Hypertension vs Retinopathy",
        assignedPatients: "Assigned Patients",
        assignedPatientsDesc: "In managed list",
        clinicallyReviewed: "Reviewed & Signed",
        clinicallyReviewedDesc: "Completed cases",
        pendingReview: "Pending Review",
        pendingReviewDesc: "Awaiting review",
        consensusWithAi: "AI Agreement Rate",
        consensusWithAiDesc: "Agreement with AI",
        riskDistributionTitle: "Cohort Risk Distribution",
        totalCases: "Total: {count} cases",
        critical: "Critical",
        highRisk: "High risk",
        moderate: "Moderate",
        lowNormal: "Low / Normal",
        pctOfTotal: "{pct}% of total",
        avgBiomarkersTitle: "Average Biomarkers",
        cohortAverage: "Cohort Average",
        avRatioLabel: "A/V Ratio",
        avRatioRef: "Normal: ~0.67 (2:3)",
        vesselDensityLabel: "Vessel Density",
        vesselDensityRef: "Normal: 42% – 50%",
        tortuosityLabel: "Vessel Tortuosity",
        tortuosityRef: "Normal: 0.08 – 0.12",
        cdrLabel: "CDR Ratio",
        cdrRef: "Normal: 0.3 – 0.4",
        avWarning: "A/V Ratio < 0.50 reflects significant arteriolar narrowing.",
        recentScreeningsTitle: "Recent Assigned Cases",
        filterTag: "Filter: {filter}",
        viewAll: "View all",
        emptyRecent: "No cases match filter.",
        modified: "Adjusted",
        approvedSigned: "Approved & Signed",
      },
      consultation: {
        title: "Patient Consultation",
        subtitle: "Real-time communication with patients.",
        stompActive: "Connected",
        assignedPatients: "Patients",
        searchPlaceholder: "Search by name, ID, phone...",
        noPatients: "No patients found.",
        vitalBp: "BP",
        vitalHba1c: "HbA1c",
        attendingDoctor: "Doctor",
        openCds: "Open CDS",
        openCdsTitle: "Open scan in CDS viewer",
        safetyWarningTitle: "Notice:",
        safetyWarningText: "For general consultation only. In emergencies, direct patient to emergency care.",
        loadingHistory: "Loading messages...",
        noMessagesTitle: "No messages yet",
        noMessagesText: "Start the conversation or choose a quick reply below.",
        quickRepliesLabel: "Quick replies:",
        quickReplies: [
          "Your retinal scan has been reviewed and signed off.",
          "Vascular metrics are stable; keep tracking your blood pressure regularly.",
          "Mild vascular changes noted; please reduce sodium intake and follow up in 3 months.",
          "Your screening report is ready to download in your patient portal.",
        ],
        inputPlaceholder: "Type your advice to patient...",
        sendButton: "Send",
        selectPatientPrompt: "Please select a patient from the left column to begin chatting.",
      },
      assignmentBoard: {
        title: "Patient Assignment",
        subtitle: "Assign patients to doctors individually or in bulk.",
        selectDoctorPlaceholder: "Select doctor",
        assignButton: "Assign",
        selected: "selected",
        assignedNotice: "Assigned {count} patients.",
        unassignedNotice: "Returned to unassigned list.",
        unassignedColumn: "Unassigned Patients",
        allAssigned: "All patients have been assigned.",
        dropToAssign: "Drop patient card here to assign.",
        noMrn: "No ID",
        loading: "Loading...",
      },
      validationBar: {
        title: "Clinical Validation",
        subtitle: "Validate AI accuracy or adjust risk level based on clinical evaluation.",
        printReport: "Print Report",
        savedSuccess: "Assessment saved and synced successfully!",
        decisionLabel: "Decision:",
        decisions: {
          approve: "Approve AI",
          modify: "Adjust Risk",
          reject: "Reject",
        },
        adjustedCardio: "Cardiovascular Risk:",
        adjustedDR: "Diabetic Retinopathy:",
        icd10Label: "ICD-10 Code (comma-separated):",
        notesLabel: "Clinical Notes:",
        saveButton: "Sign & Save Assessment",
        savingButton: "Saving...",
      },
      newPatientModal: {
        title: "Register New Patient",
        description: "Enter patient demographic info and baseline vitals",
        fullName: "Full Name",
        mrn: "Patient ID / MRN",
        age: "Age",
        gender: "Gender",
        phone: "Phone Number",
        systolicBp: "Systolic BP",
        diastolicBp: "Diastolic BP",
        hba1c: "HbA1c (%)",
        cancel: "Cancel",
        save: "Save Patient",
      },
      reportModal: {
        exitEsc: "Exit (Esc)",
        close: "Close",
        officialReportTitle: "AURA Retinal Medical Screening Report",
        preliminaryReportTitle: "AURA AI Preliminary Report - Pending Doctor Review",
        dualEyeBadge: "Dual-Eye Screening (OD + OS)",
        reportCode: "Report ID:",
        exportCsv: "Export CSV",
        printPdf: "Print / PDF",
        systemTitle: "AURA RETINAL SCREENING SYSTEM",
        systemSubtitleReviewed: "Official Medical Report",
        systemSubtitlePreliminary: "Preliminary AI Report",
        dualEyeSuffix: "(Dual Eyes OD & OS)",
        reportCodeLabel: "Report ID:",
        examDateLabel: "Exam Date:",
        reviewedStatus: "Doctor Reviewed",
        pendingStatus: "Pending Doctor Review",
        unsigned: "Unsigned",
        fullName: "Full Name:",
        patientId: "Patient ID:",
        ageGender: "Age / Gender:",
        bpDiabetes: "BP / HbA1c:",
        section1: "1. Retinal Fundus Scans & AI Heatmap",
        section2: "2. Multimodal Risk Assessment",
        section3: "3. Retinal Vascular Biomarkers",
        section4: "4. AI Findings & Recommendations",
        section5: "5. Clinical Validation & Doctor Signature",
        overallRisk: "Overall Vascular Risk",
        cardioRisk: "Cardiovascular Risk (3-Year)",
        strokeRisk: "Stroke Risk (3-Year)",
        retinopathyRisk: "Diabetic Retinopathy",
        glaucomaRisk: "Glaucoma Risk",
        colBiomarker: "Biomarker",
        colOD: "Right Eye (OD)",
        colOS: "Left Eye (OS)",
        colMeasured: "Value",
        colReference: "Reference Range",
        colEvaluation: "Evaluation",
        bmAvr: "Arteriovenous Ratio (A/V)",
        bmDensity: "Vessel Density",
        bmTortuosity: "Vessel Tortuosity",
        bmCdr: "Cup-to-Disc Ratio (CDR)",
        doctorDecisionLabel: "Doctor Decision:",
        doctorApproved: "Approved AI findings",
        doctorModified: "Adjusted by doctor",
        validSignature: "Valid Digital Signature",
        signedAtLabel: "Signed at:",
        reviewingSpecialist: "Reviewing Doctor:",
        noSignatureYet: "No doctor signature",
        dualComparisonHeader: "Side-by-side comparison: Right Eye (OD) & Left Eye (OS)",
        icd10Label: "ICD-10 Code:",
        doctorNotesTitle: "Doctor Notes:",
        recommendationsTitle: "Recommendations:",
        findingsTitle: "AI Findings:",
      },
    },
    clinic: {
      portal: {
        title: "Clinic Operations",
        subtitle: "Manage screening campaigns, assign doctors, and track stats.",
        batchScreeningStatus: "Batch Screening",
        activeCampaigns: "Active Campaigns",
        assignedDoctors: "Doctors",
        quotaBalance: "Credits Left",
        topUp: "Buy Credits",
        defaultFacility: "Clinic",
        profile: {
          title: "Facility Profile & Verification",
          verified: "Verified",
          rejected: "Rejected",
          pending: "Pending Review",
          loading: "Loading facility info...",
          orgNameLabel: "Clinic Name",
          orgNamePlaceholder: "e.g. AURA Eye Clinic",
          licenseNumberLabel: "Medical Operating License No.",
          licenseNumberPlaceholder: "e.g. 01234/DOH-LIC",
          attachedDocLabel: "Attached Documents (License, Certificate)",
          selectedFile: "Selected",
          submitButton: "Save & Submit",
          submitSuccess: "Profile submitted, awaiting admin approval.",
          submitFailed: "Submission failed. Please try again.",
        },
        doctors: {
          title: "Doctor Management",
          addDoctorPlaceholder: "Enter doctor email to add...",
          addDoctorButton: "Add Doctor",
          addDoctorSuccess: "Doctor added successfully.",
          addDoctorFailed: "Could not add doctor. Please check the email.",
          colName: "Full Name",
          colEmail: "Email",
          colStatus: "Status",
          colActions: "Actions",
          noDoctors: "No doctors registered yet.",
          statusActive: "Active",
          deleteTitle: "Remove from clinic",
          confirmDelete: "Are you sure you want to remove this doctor?",
          assignTitle: "Assign Patient to Doctor",
          selectDoctor: "Select Doctor",
          patientIdLabel: "Patient ID",
          patientIdPlaceholder: "Enter patient ID...",
          assignButton: "Assign",
          assignSuccess: "Patient assigned successfully.",
          assignFailed: "Failed to assign patient.",
        },
      },
      batchWorkspace: {
        batchList: "Batch Queue",
        status: {
          queued: "Queued",
          processing: "Processing",
          completed: "Completed",
          error: "Error",
        },
        newBatchButton: "Upload Batch",
        batchDetails: "Batch Details",
        totalImages: "Total scans",
        batch: "Batch",
        newBatch: "New",
        completedAi: "Done",
        rate: "Rate",
        processingBackground: "Processing in background",
        asyncQueue: "Queue",
        qualityError: "Quality issue",
        retakeNeeded: "Rescan needed",
        searchLabel: "Search scans",
        searchPlaceholder: "Search by file name, patient ID...",
        clearSearch: "Clear",
        statusFilterLabel: "Status",
        allStatuses: "All statuses",
        statusCompleted: "Completed",
        statusProcessing: "Processing",
        statusFailed: "Failed",
        exportCsv: "Export CSV",
        campaignImagesTitle: "Campaign Scans",
        facility: "Facility",
        defaultFacility: "Screening Center",
        batchIdLabel: "Batch ID",
        colFileId: "Scan ID",
        colPatient: "Patient",
        colEye: "Eye",
        colStatus: "Status",
        colActions: "Actions",
        viewDetail: "Details",
        defaultFundusName: "Fundus photo",
        emptyMessage: "No scans in this batch. Click 'Upload Batch' to add files.",
        badgeQualityError: "Quality issue",
        badgeProcessing: "Processing",
        badgeCompleted: "Completed",
      },
      batchProcessing: {
        batchTitle: "Batch Analysis Progress",
        progress: "Overall Progress",
        itemsProcessed: "Processed Scans",
        successRate: "Success Rate",
        filterStatus: "Filter by status",
        filterRisk: "Filter by risk",
        itemsTable: "Scan List",
        allStatuses: "All statuses",
        statusDone: "Completed",
        statusProcessing: "Processing",
        statusPending: "Queued",
        statusFailed: "Failed",
        allRisks: "All risks",
        riskHighCritical: "High & Critical (≥70%)",
        riskModerate: "Moderate (40-69%)",
        riskLow: "Low (<40%)",
        allEyes: "All eyes",
        rightEye: "Right Eye (OD)",
        leftEye: "Left Eye (OS)",
        sortNewest: "Newest first",
        sortOldest: "Oldest first",
        sortRiskDesc: "Highest risk",
        sortMrnAsc: "Patient ID (A-Z)",
        pageSize25: "25 / page",
        pageSize50: "50 / page",
        pageSize100: "100 / page",
        pageSizeAll: "All",
        closeToast: "Close",
        campaignIdLabel: "Campaign ID:",
        readyForNewBatch: "Ready for next batch",
        systemReady: "System Ready",
        campaignSubtitle: "Retinal Screening Campaign",
        bulkQueueProgress: "Queue Progress",
        doneLabel: "Done:",
        scansLabel: "scans",
        minScansStandard: "(≥100 scans)",
        timeRemaining: "Est. time left:",
        creditsManagement: "Credits Management",
        availableCredits: "available credits",
        syncedActivePackage: "Active package",
        topUpButton: "+ Buy Credits",
        highRiskCard: "High Risk (Urgent)",
        highRiskAction: "Immediate doctor review needed",
        moderateRiskCard: "Moderate Risk",
        moderateRiskAction: "Routine follow-up advised",
        lowRiskCard: "Low Risk / Normal",
        lowRiskAction: "Normal vascular metrics",
        queueProcessingCard: "Queued & Processing",
        runningScans: "Running:",
        allCompleted: "All scans completed",
        emergencyAlertTitle: "Urgent: Critical cases detected",
        emergencyBannerTag: "Critical Alert",
        emergencyDesc: "AI detected severe retinal vascular lesions and elevated stroke risk. Immediate doctor review advised.",
        hideList: "Hide",
        viewAlertDetails: "View details",
        urgentCaseList: "Urgent cases needing doctor review:",
        actionLabel: "Action:",
        aggregatedSurveillanceTitle: "Vascular Risk Summary",
        riskDistributionTitle: "Risk Distribution",
        riskDistributionDesc: "Risk proportions and aggregate metrics across the campaign.",
        totalEvaluatedRecords: "Total evaluated:",
        meanVascularScore: "Avg vascular score",
        highRiskRate: "High risk rate",
        highSevereCases: "high/critical cases",
        threeYearStrokeRisk: "3-Year stroke risk",
        meanStrokeForecast: "Avg stroke forecast",
        lowRiskRate: "Low risk rate",
        safeCases: "normal cases",
        donutMeanScore: "Avg score",
        outOf100: "out of 100",
        donutCaption: "Risk distribution donut chart",
        riskBreakdownTitle: "Risk Breakdown",
        lowRiskBand: "Low risk",
        moderateRiskBand: "Moderate risk",
        highRiskBand: "High risk",
        criticalRiskBand: "Critical risk",
        casesCount: "cases",
        searchPlaceholder: "Search by ID, patient name, file...",
        deidentifiedModeOn: "De-identified (HIPAA)",
        deidentifiedModeOff: "Standard View",
        deidentifiedTooltip: "Toggle anonymized view",
        printReportButton: "Print Report",
        exportCsvButton: "Export CSV",
        uploadFolderButton: "Upload Folder (≥100 scans)",
        colNum: "#",
        colThumbnail: "Photo",
        colPatientMrn: "Patient ID",
        colEye: "Eye",
        colStatus: "Status",
        colRiskAssessment: "Risk Assessment",
        colClinicalVitals: "Metrics & AI",
        colActions: "Details",
        emptyRecords: "No screening records match filters.",
        viewCdsButton: "View CDS →",
        badgeCompleted: "Done",
        badgeProcessing: "Processing",
        badgePending: "Queued",
        badgeError: "Error",
        showingPagination: "Showing:",
        pageOf: "Page",
        firstPageTitle: "First",
        prevPageTitle: "Previous",
        nextPageTitle: "Next",
        lastPageTitle: "Last",
      },
      batchUploadModal: {
        uploadTitle: "Upload Image Batch",
        selectClinic: "Select clinic",
        selectEye: "Eye position",
        dropzone: "Drag and drop folder or images (PNG, JPG, DICOM)",
        filesSelected: "Selected files",
        uploading: "Uploading scans...",
        assignDoctor: "Assign doctor for review",
        submitBatch: "Start Processing",
        standardBadge: "Standard",
        description: "Upload scans for batch AI analysis.",
        campaignNameLabel: "Campaign Name",
        campaignNamePlaceholder: "Enter campaign name...",
        facilityLabel: "Clinic / Facility",
        satelliteOption: "Mobile screening site",
        dropzoneHint: "Supports DICOM (.dcm), TIFF, PNG, JPG.",
        selectFilesButton: "Choose Files",
        selectFolderButton: "Choose Folder",
        quickDemoTitle: "Sample Test Data",
        quickDemoDesc: "Generate 100 demo scans to test the batch processing pipeline.",
        loadDemoButton: "Load 100 demo scans",
        demoStandardBadge: "Demo data (100 scans)",
        preflightTitle: "Scans to process:",
        scansLoaded: "scans loaded",
        standardPassed: "Valid (≥ 100 scans)",
        standardRequired: "Requires ≥ 100 scans",
        quickAssignLabel: "Quick assign:",
        allOdButton: "All Right Eye (OD)",
        allOsButton: "All Left Eye (OS)",
        alternateEyesButton: "Alternate (OD/OS)",
        fillSampleVitalsButton: "Fill sample vitals",
        fillVitalsTooltip: "Fill demo blood pressure and HbA1c values",
        filterAllEyes: "All eyes (OD/OS)",
        filterOd: "Right eye (OD)",
        filterOs: "Left eye (OS)",
        clearAllButton: "Clear All",
        emptyStaged: "No scans loaded yet. Drop files or click 'Load 100 demo scans'.",
        colNum: "#",
        colPreview: "Preview",
        colFileName: "File Name",
        colMrnPatient: "Patient ID",
        colEyePosition: "Eye",
        colVitals: "BP / HbA1c",
        colActions: "Actions",
        moreScansCount: "more scans in queue.",
        estimatedConsumption: "Estimated cost:",
        availableBalance: "Available credits:",
        cancelButton: "Cancel",
        deidentifyingQueuing: "Queuing scans...",
        startBatchButton: "Start Batch Analysis",
        defaultCampaignName: "Retinal Vascular Screening Campaign",
      },
      batchDetailModal: {
        itemDetails: "Scan Details",
        eye: "Eye",
        scanType: "Scan Type",
        biomarkers: "Vascular Biomarkers",
        rawFundus: "Original Photo",
        heatmap: "AI Heatmap",
        doctorSignoffStatus: "Doctor Status",
        deidHipaa: "HIPAA:",
        fileLabel: "File:",
        overallVascularRisk: "Vascular Risk",
        modelName: "AURA Multimodal CDS",
        cardiovascularRisk: "Cardiovascular Risk",
        score2Ai: "SCORE2-AI Model",
        arteriolarNarrowing: "Vessel Narrowing",
        drRisk: "Diabetic Retinopathy",
        icdrGrade: "ICDR Grade",
        microaneurysms: "Microaneurysms",
        threeYearStroke: "3-Year Stroke Risk",
        strokeProjection: "Stroke Forecast",
        gunnSign: "Gunn Sign",
        heatmapOpacityLabel: "Heatmap Opacity:",
        zoomOutTitle: "Zoom Out",
        zoomInTitle: "Zoom In",
        resetZoomTitle: "Reset Zoom",
        lesionBoxesRoi: "Lesions",
        anatomyMarkers: "Anatomy",
        sideBySideView: "Side by Side",
        directOverlayView: "Overlay",
        downloadPng: "Download PNG",
        nativeFundusTitle: "Original Photo",
        nativeResolution: "512 × 512 px",
        opticDiscLabel: "Optic Disc",
        maculaLabel: "Macula",
        formatLabel: "Format:",
        heatmapLesionTitle: "AI Heatmap & Lesions",
        heatmapAvailable: "Heatmap ready",
        noHeatmap: "No heatmap",
        noHeatmapWarning: "No AI heatmap available",
        hudHoverHint: "Hover to inspect coordinates & zones",
        directOverlayTitle: "Heatmap Overlay",
        directOverlaySubtitle: "Use opacity slider to compare original photo and AI heatmap",
        detectedAnomaliesTitle: "Detected Lesions:",
        detectedAnomaliesHint: "Click a card to highlight position on retina",
        noFocalLesions: "No lesions detected",
        noLesionsDesc: "No microaneurysms or focal hemorrhages detected.",
        biomarkersTitle: "Vascular Biomarkers",
        avrLabel: "A/V Ratio (AVR)",
        avrNormal: "Normal: ~0.67",
        tortuosityLabel: "Vessel Tortuosity",
        tortuosityDesc: "Curvature & pressure",
        vesselDensityLabel: "Vessel Density",
        vesselDensityDesc: "Capillary density",
        cdrLabel: "Cup-to-Disc Ratio (CDR)",
        cdrNormal: "Normal",
        rationalesTitle: "AI Clinical Reasoning",
        processingDuration: "AI processing time:",
        closeButton: "Close",
        zoneDisc: "Optic Disc",
        zoneMacula: "Macula",
        zoneSuperiorArcade: "Superior Arcade",
        zoneInferiorArcade: "Inferior Arcade",
        zonePosteriorPole: "Posterior Pole",
        defaultRationale1: "Vascular arcade distribution is normal without focal narrowing.",
        defaultRationale2: "No arteriovenous nicking or vascular wall sclerosis.",
        defaultRationale3: "Capillary perfusion remains stable.",
        defaultRationaleMod1: "Mild arteriolar narrowing observed.",
        defaultRationaleMod2: "Vascular tortuosity warrants periodic monitoring.",
        defaultRationaleHigh1: "Reduced A/V ratio (arteriolar narrowing).",
        defaultRationaleHigh2: "Venous compression at crossing points (Gunn sign).",
        defaultRationaleHigh3: "Elevated tortuosity indicating chronic microcirculatory stress.",
      },
      campaignAnalytics: {
        campaignTitle: "Campaign Analytics",
        totalScreened: "Total Screened",
        highRiskIdentified: "High Risk Cases",
        coverageRate: "Coverage Rate",
        demographicChart: "Demographic Breakdown",
        pageSubtitle: "Aggregate statistics across clinic screening campaigns.",
        loadingMessage: "Loading campaign analytics...",
        errorTitle: "Loading error",
        errorMessage: "Unable to load campaign analytics.",
        emptyTitle: "No campaign data",
        emptyDescription: "No screening campaigns found.",
        reloadButton: "Reload",
        exportCsvButton: "Export CSV",
        totalCampaignsCard: "Total Campaigns",
        totalCampaignsSub: "Screening campaigns",
        totalImagesCard: "Total Scans",
        totalImagesSub: "Analyzed by AI",
        highRiskCard: "High Risk",
        highRiskSub: "Needing doctor review",
      },
      creditPackage: {
        title: "Screening Quota & Packages",
        subtitle: "Track credits balance, active package, and service history.",
        loading: "Loading credit packages...",
        quotaDepletedTitle: "Quota Depleted",
        quotaLowTitle: "Credits Running Low",
        quotaWarningDesc: "Screening may pause if upload volume exceeds your balance. Please top up.",
        topUpNow: "Top Up Now",
        refreshing: "Updating...",
        refresh: "Refresh",
        renewBuyButton: "Buy Package",
        availableCredits: "Available Credits",
        scansUnit: "credits",
        statusAbundant: "Good",
        statusLow: "Low",
        statusDepleted: "Depleted",
        scannedInBatch: "Scanned in batch",
        totalCampaignScanned: "Total scanned:",
        activePackage: "Active Package",
        noActivePackage: "No active package",
        statusActive: "Active",
        statusUnregistered: "Not registered",
        validityPeriod: "Validity",
        indefinite: "Lifetime",
        autoRenewNotice: "Renews upon purchase",
        currentPlanNotice: "Current active plan",
        consumptionProgress: "Quota Usage",
        processedCount: "Used:",
        availableCount: "Remaining:",
        processedInBatchLegend: "Used in batch",
        availableCreditsLegend: "Credits left",
        packagesSectionTitle: "Clinic Service Packages",
        packagesSectionSubtitle: "Designed for clinics and screening campaigns from 500 to 5,000 evaluations.",
        vatSupportBadge: "VAT Invoice Supported",
        recommendedRibbon: "Recommended",
        currentPlanBadge: "Current Plan",
        currencyVnd: "VND",
        plusScans: "scans",
        validityDays: "Validity:",
        featuresIncluded: "Includes:",
        renewThisPackage: "Renew Package",
        buyPackageNow: "Buy Package",
        historySectionTitle: "Transaction History",
        historySectionSubtitle: "Log of quota top-ups and electronic receipts.",
        reloadHistory: "Reload",
        colTxnId: "Transaction ID",
        colPackage: "Package",
        colAmount: "Amount (VND)",
        colScans: "Credits",
        colPaidDate: "Date",
        colMethod: "Method",
        colStatus: "Status",
        colReceipt: "Receipt",
        emptyHistory: "No transactions recorded yet.",
        emptyHistorySub: "Invoices will appear here once you make a purchase.",
        providerVietqr: "VietQR Napas 24/7",
        providerMomo: "MoMo Wallet",
        providerBank: "VietQR Bank Transfer",
        providerVnpay: "VNPay QR",
        statusSuccess: "Success",
        statusPending: "Pending",
        statusFailed: "Failed",
        viewReceipt: "Receipt",
        receiptTitle: "Electronic Receipt",
        providerLabel: "Provider:",
        providerSystemName: "AURA RETINAL SCREENING SYSTEM",
        providerSystemDesc: "Retinal health and cardiovascular risk screening platform",
        invoiceIdLabel: "Invoice ID:",
        servicePackageLabel: "Package:",
        recordedTimeLabel: "Date:",
        paymentGatewayLabel: "Payment Method:",
        settlementStatusLabel: "Status:",
        settledValid: "Success",
        totalPaidLabel: "Total:",
        receiptDisclaimer: "Electronic voucher for clinic accounting.",
        closeReceipt: "Close",
        printReceipt: "Print",
        complianceTitle: "Terms of Use",
        complianceText: "Screening credits are for clinical decision support. AI results do not replace specialist diagnosis. Unused credits rollover upon renewal.",
        pkgStarterName: "Starter Package",
        pkgStarterDesc: "For small clinics and initial screening setups.",
        pkgCampaignName: "Campaign Package",
        pkgCampaignDesc: "Best choice for community screening and large groups.",
        pkgHospitalName: "Hospital Package",
        pkgHospitalDesc: "High capacity for hospitals and diagnostic centers.",
        pkgStarterFeatures: [
          "500 AI retinal evaluations",
          "4 risk tiers (Low, Moderate, High, Critical)",
          "Grad-CAM heatmaps & A/V ratio calculation",
          "PDF summary report",
          "Up to 2 doctor accounts",
          "Email support",
        ],
        pkgCampaignFeatures: [
          "2,000 AI retinal evaluations",
          "Bulk batch upload (ZIP / DICOM folder)",
          "Campaign analytics & risk breakdown",
          "Auto-assign patients to doctors",
          "CSV export",
          "Unlimited doctor accounts",
          "10% discount compared to starter tier",
        ],
        pkgHospitalFeatures: [
          "5,000 AI retinal evaluations (priority speed)",
          "Direct API integration (PACS / HIS / EMR)",
          "Real-time analytics and surveillance",
          "Digital certificate signing",
          "24/7 dedicated support",
          "Custom branded reports",
          "20% discount on evaluations",
        ],
      },
    },
    admin: {
      dashboardTitle: "System Administration",
      dashboardSubtitle: "Manage users, permissions, packages, and HIPAA logs.",
      tabs: {
        users: "Users",
        rbac: "Permissions",
        notifications: "Notifications",
        clinics: "Clinics",
        packages: "Packages",
        aiConfig: "AI Config",
        audit: "Audit Logs",
      },
      audit: {
        title: "HIPAA Audit Trail",
        subtitle: "Log of medical record access and data export activities.",
        searchByUserIp: "Search by user, action, resource, or IP...",
        severityFilter: "Severity",
        actionFilter: "Action type",
        resetFilter: "Reset",
        exportBtn: "Export CSV",
        emptyMessage: "No audit logs found.",
        severityAll: "All Severities",
        severityInfo: "Info",
        severityWarning: "Warning",
        severityCritical: "Critical",
        columns: {
          timestamp: "Time",
          user: "User",
          role: "Role",
          action: "Action",
          resource: "Resource",
          ip: "IP Address",
          severity: "Severity",
          actionResource: "Action & Resource",
          status: "Status",
        },
        exportAuditTrail: "Export CSV",
        statusSuccess: "Success",
        statusFailed: "Failed",
      },
      userManagement: {
        title: "User Management",
        subtitle: "Manage accounts, roles, and status.",
        userList: "User Directory",
        changeRole: "Change Role",
        activateDeactivate: "Toggle Status",
        resetPassword: "Reset Password",
        saveChanges: "Save",
        searchPlaceholder: "Search by name or email...",
        filterRole: "Role",
        allRoles: "All Roles",
        filterBtn: "Filter",
        emptyUsers: "No users found.",
        editUser: "Edit",
        changeRoleBtn: "Change Role",
        lockAccount: "Suspend",
        unlockAccount: "Activate",
        deleteUser: "Delete",
        deleteSuccess: "Account deleted successfully.",
        batchDeleteSuccess: "Selected accounts deleted successfully.",
        deleteModalTitle: "Confirm Account Deletion",
        deleteConfirmMessage: "Are you sure you want to delete this account? The account will be deactivated and removed from the active system.",
        batchDeleteModalTitle: "Confirm Batch Deletion",
        batchDeleteConfirmMessage: "Are you sure you want to delete all selected accounts?",
        cannotDeleteSelf: "You cannot delete your own active account.",
        activeStatus: "ACTIVE",
        suspendedStatus: "SUSPENDED",
        notUpdated: "Not updated",
        activatedSuccess: "Account activated.",
        suspendedSuccess: "Account suspended.",
        updatedSuccess: "Account updated.",
        roleUpdatedSuccess: "Role changed.",
        editModalTitle: "Edit User",
        emailLabel: "Email",
        fullNameLabel: "Full Name",
        phoneLabel: "Phone",
        addressLabel: "Address / Clinic",
        roleModalTitle: "Change User Role",
        roleModalDesc: "Select new role for this account:",
        confirmRoleBtn: "Confirm",
      },
      rbac: {
        rolePermissionMatrix: "Role Permissions (RBAC)",
        subtitle: "Configure access permissions for each user role.",
        viewPermissions: "View Permissions",
        editPermissions: "Edit Permissions",
        savePolicy: "Save Policy",
        saveMatrix: "Save Permissions",
        savedSuccess: "Permissions saved successfully.",
        activePermissions: "Active Permissions",
        permissionCatalogTitle: "Permissions for Role:",
      },
      aiConfig: {
        title: "AI Configuration",
        subtitle: "Adjust sensitivity and clinical alert thresholds.",
        modelSelection: "Vision Model",
        temperature: "Temperature",
        sensitivityThreshold: "Sensitivity Threshold",
        endpointUrl: "AI Endpoint URL",
        testConnection: "Test Connection",
        saveParameters: "Save Parameters",
        glaucomaSensitivity: "Glaucoma / CVD Sensitivity",
        glaucomaHint: "Optimizes early detection of vessel narrowing.",
        drConfidence: "Diabetic Retinopathy Confidence",
        drHint: "Minimum confidence before outputting classification.",
        retrainThreshold: "A/V Ratio Narrowing Alert",
        retrainHint: "Triggers alert when A/V ratio is below threshold.",
      },
      templates: {
        notificationTemplates: "Notification Templates",
        subtitle: "Configure templates for Email, SMS, and In-App channels.",
        channel: {
          email: "Email",
          inApp: "In-App",
          sms: "SMS",
        },
        title: "Subject",
        content: "Content",
        createTemplate: "New Template",
        edit: "Edit",
        delete: "Delete",
        addTemplate: "Add Template",
        subjectPrefix: "Subject:",
        statusPrefix: "Status:",
        activeStatus: "Active",
        inactiveStatus: "Disabled",
        policiesTitle: "Notification Policies",
        policiesSubtitle: "Configure channel rules and quiet hours.",
        savePolicies: "Save Policies",
        activeChannelsTitle: "Active Channels",
        emergencyRulesTitle: "Emergency & Quiet Hours",
        inAppChannelLabel: "In-App Channel",
        emailChannelLabel: "Email Channel",
        smsChannelLabel: "SMS Channel",
        criticalAlertLabel: "Emergency Alert for Critical Risk",
        criticalAlertDesc: "Immediate delivery regardless of quiet hours",
        quietStartLabel: "Quiet hours start",
        quietEndLabel: "Quiet hours end",
        retentionLabel: "Retention (days)",
        modalCreateTitle: "Create Template",
        modalEditTitle: "Edit Template",
        codeLabel: "Template Code",
        nameLabel: "Template Name",
        channelLabel: "Channel",
        subjectLabel: "Subject",
        bodyLabel: "Body",
        descriptionLabel: "Description",
        enableCheckbox: "Enable template",
        saveTemplateBtn: "Save Template",
        savedNotice: "Template saved.",
        policySavedNotice: "Policies updated.",
      },
      packages: {
        servicePackageList: "Service Packages",
        subtitle: "Manage screening packages, quotas, and pricing.",
        packageName: "Package Name",
        price: "Price",
        quota: "Credits",
        validity: "Validity",
        activeToggle: "Status",
        createPackage: "Create Package",
        refreshTooltip: "Refresh list",
        totalPackages: "Total Packages",
        activePackages: "Active",
        userPackages: "Individual",
        clinicPackages: "Clinic",
        searchPlaceholder: "Search packages by name, code...",
        scopeAll: "All",
        scopeUser: "Individual",
        scopeClinic: "Clinic",
        days: "days",
        lifetime: "Lifetime",
        active: "Active",
        inactive: "Inactive",
        creditsUnit: "credits",
        createModalTitle: "Create Package",
        editModalTitle: "Edit Package",
        createModalSubtitle: "Define credits quota and pricing",
        codeLabel: "Package Code",
        nameLabel: "Package Name",
        descLabel: "Description",
        scopeLabel: "Target Audience",
        creditsLabel: "Credits",
        priceLabel: "Price (VND)",
        validityLabel: "Validity in Days (0 = Lifetime)",
        featuresLabel: "Features (one per line)",
        activeImmediateLabel: "Activate immediately",
        saveBtn: "Save",
        createBtn: "Create",
        deactivateBtn: "Deactivate",
        activateBtn: "Activate",
        loadingList: "Loading packages...",
        emptyFiltered: "No packages match search.",
        packageSavedNotice: "Package updated.",
        packageCreatedNotice: "Package created.",
        statusToggledNotice: "Status updated.",
      },
      clinics: {
        title: "Clinic Approvals",
        subtitle: "Review medical licenses and approve clinic accounts.",
        loading: "Loading clinics...",
        empty: "No clinics awaiting approval.",
        licenseLabel: "License No:",
        notProvided: "Not provided",
        approve: "Approve",
        reject: "Reject",
        approvedSuccess: "Clinic approved.",
        rejectedSuccess: "Clinic rejected.",
      },
    },
    footer: {
      copyright: "© 2026 AURA Retinal Screening System. All rights reserved.",
      version: "Version 1.0.0",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      medicalSafetyStatement:
        "AI screening results are for reference only and do not replace doctor diagnosis.",
      supportCenter: "Support Center",
      securityCert: "HIPAA & ISO 27001 Compliant",
    },
  },
};
