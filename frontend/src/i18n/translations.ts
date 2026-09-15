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
      loadingInit: "Đang khởi tạo không gian làm việc AURA...",
      statusLabel: "Trạng thái",
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
      negativeFindingBannerTitle: "Cấu trúc vi mạch bình thường (0 điểm tổn thương)",
      negativeFindingBannerDesc: "Không phát hiện vi phình mạch, xuất huyết hay co thắt khu trú.",
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
        signInWithGoogle: "Đăng nhập bằng Google",
        signInWithMagicLink: "Đăng nhập qua liên kết Email",
        magicLinkSent: "Đã gửi liên kết đăng nhập qua Email",
        orDivider: "Hoặc",
        accountEmailLabel: "Email tài khoản",
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
        signUpWithGoogle: "Đăng ký bằng Google",
        orDivider: "Hoặc",
        optionalLabel: "Tùy chọn",
        passwordRequirementsHint: "Mật khẩu 12–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
        verifyOtpTitle: "Xác thực mã OTP",
        otpSentTo: "Mã OTP gồm 6 chữ số đã được gửi tới:",
        enterOtpLabel: "Nhập mã xác thực 6 chữ số",
        resendIn: "Gửi lại mã sau",
        resendOtpBtn: "Gửi lại mã OTP",
        verifyAndCreateBtn: "Xác thực & Tạo tài khoản",
        changeEmailBtn: "Thay đổi thông tin email",
        sendingOtp: "Đang gửi mã OTP...",
        verifyingOtp: "Đang xác thực...",
      },
      authHeroPanel: {
        tagline: "Hệ thống AI Hỗ trợ Sàng lọc Sức khỏe Vi mạch Võng mạc & Tim mạch",
        hipaaCompliant: "Bảo mật chuẩn HIPAA & ISO 27001",
        aiAccuracy: "Độ chính xác lâm sàng cao với XAI minh bạch",
        clinicalBenefits: "Hỗ trợ phát hiện sớm nguy cơ đột quỵ và biến chứng đái tháo đường",
        trustedByHospitals: "Được tin cậy bởi các cơ sở y tế và phòng khám chuyên khoa",
        aiScreeningSupport: "AI hỗ trợ sàng lọc",
        retinalAnalysis: "Phân tích ảnh võng mạc",
        medicalWarning: "Kết quả chỉ hỗ trợ sàng lọc và không thay thế chẩn đoán của bác sĩ.",
      },
      verifyEmailLink: {
        verifying: "Đang xác thực liên kết đăng nhập...",
        success: "Xác thực liên kết thành công! Đang chuyển hướng...",
        invalidLink: "Liên kết xác thực không hợp lệ hoặc đã hết hạn.",
        returnToLogin: "Quay lại trang đăng nhập",
        verifyingTitle: "Xin vui lòng chờ",
        verifyingStatus: "Đang xác thực liên kết...",
        signingInStatus: "Đang đăng nhập vào hệ thống...",
        failedTitle: "Đăng nhập thất bại",
        emailRequiredError: "Cần cung cấp email để tiếp tục.",
        loginFailedError: "Đăng nhập vào hệ thống thất bại.",
      },
      passwordInput: {
        showPassword: "Hiện mật khẩu",
        hidePassword: "Ẩn mật khẩu",
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
          resetFilters: "Đặt lại bộ lọc",
          resetFiltersTooltip: "Đặt lại các điều kiện lọc (Mắt, Mức nguy cơ, Ô tìm kiếm) về mặc định",
          resetFiltersNotice: "Đã đặt lại toàn bộ điều kiện lọc về mặc định. Lịch sử khám bệnh được lưu trữ an toàn theo tiêu chuẩn y tế.",
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
        immutabilityNotice: "Hồ sơ bệnh án điện tử được lưu trữ an toàn theo tiêu chuẩn HIPAA & Bộ Y Tế.",
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
        loading: "Đang nạp dữ liệu Bác sĩ...",
        syncing: "Đang đồng bộ danh sách bệnh nhân được phân công từ hệ thống.",
        noAssignedTitle: "Chưa có Bệnh nhân được phân công",
        noAssignedDesc: "Tài khoản bác sĩ hiện tại chưa được Cơ sở y tế hoặc Admin phân công tiếp nhận bệnh nhân nào.",
        viewPatientList: "Xem Danh Sách Bệnh Nhân",
        reload: "Tải lại",
        feedbackSuccess: "Đã lưu đánh giá chuyên môn và cập nhật hồ sơ sàng lọc của bệnh nhân",
        screeningNotice: "Thông Báo Sàng Lọc",
        selectPatientFirst: "Vui lòng chọn một bệnh nhân được phân công trước khi tải ảnh.",
        switchPatient: "Đổi Bệnh Nhân",
        message: "Nhắn Tin",
        printResult: "In Phiếu Kết Quả",
        noResultsYet: "Chưa Có Kết Quả Sàng Lọc",
        noResultsDesc: "Chưa có ca sàng lọc nào trong hệ thống cho bệnh nhân này.",
        loadingScreeningHistory: "Đang tải lịch sử ca sàng lọc của bệnh nhân...",
        bloodPressure: "Huyết áp",
        hba1c: "HbA1c",
        attendingDoctor: "Bác sĩ phụ trách",
        notMeasured: "Chưa đo",
        notTested: "Chưa xét nghiệm",
        yearsOld: "tuổi",
      },
      worklist: {
        title: "Danh sách ca khám phân công",
        search: "Tìm bệnh nhân theo tên, mã bệnh nhân (MRN)...",
        searchLabel: "Tìm kiếm bệnh nhân",
        searchPlaceholder: "Tìm họ tên, mã MRN...",
        reviewStatusLabel: "Trạng thái thẩm định",
        riskLevelLabel: "Mức nguy cơ",
        refresh: "Làm mới",
        addPatient: "Thêm BN",
        reset: "Đặt lại",
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
          vitals: "Chỉ Số Sinh Hiệu",
        },
        reviewButton: "Thẩm định lâm sàng",
        openCds: "Mở CDS",
        pendingReview: "Chờ bác sĩ xem",
        reviewed: "Đã duyệt",
        priorityCritical: "Cần ưu tiên thẩm định",
        priorityHigh: "Vi tổn thương đáng kể",
        priorityModerate: "Cần theo dõi định kỳ",
        priorityLow: "Cấu trúc vi mạch ổn định",
        criticalLevel: "Rất nghiêm trọng",
        highLevel: "Nguy cơ cao",
        moderateLevel: "Nguy cơ trung bình",
        lowLevel: "Nguy cơ thấp",
        allLevels: "Tất cả mức độ",
        allStatuses: "Tất cả trạng thái",
        emptyFiltered: "Không tìm thấy bệnh nhân nào phù hợp với bộ lọc.",
        totalAssignedNotice: "Tổng cộng {count} bệnh nhân trong danh sách phụ trách.",
      },
      diagnosisModal: {
        title: "Thẩm định kết quả và Ký số kết luận lâm sàng",
        aiPreliminary: "Kết quả phân tích sơ bộ từ AI",
        patientLabel: "Bệnh nhân",
        analysisIdLabel: "Mã phân tích",
        decisionLabel: "Quyết Định Lâm Sàng Của Bác Sĩ:",
        doctorDecision: {
          approve: "Chấp thuận chẩn đoán của AI",
          modify: "Hiệu chỉnh kết luận lâm sàng",
          reject: "Bác bỏ kết luận của AI",
        },
        adjustedCardio: "Mức nguy cơ tim mạch hiệu chỉnh",
        adjustedDR: "Phân độ võng mạc đái tháo đường hiệu chỉnh",
        icd10Select: "Chỉ định mã bệnh danh ICD-10",
        doctorNotes: "Ghi chú chẩn đoán và phác đồ điều trị",
        defaultNotes: "Bác sĩ chuyên khoa đã thẩm định và xác nhận kết quả phân tích sơ bộ từ hệ thống AURA AI.",
        digitalSign: "Ký số kết luận y khoa",
        signedAt: "Thời điểm ký duyệt",
        signerName: "Bác sĩ chuyên khoa ký duyệt",
        saveButton: "Lưu và Ký duyệt hồ sơ",
        pkiSignatureLabel: "Chữ ký số PKI:",
        cancel: "Hủy",
        icdOptions: {
          h350: "H35.0 — Biến đổi mạch máu võng mạc",
          e113: "E11.3 — Bệnh võng mạc đái tháo đường",
          i10: "I10 — Tăng huyết áp vô căn",
          h401: "H40.1 — Glaucoma góc mở nguyên phát",
          h353: "H35.3 — Thoái hóa hoàng điểm tuổi già",
        },
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
        title: "Báo cáo y khoa & Ký duyệt",
        subtitle: "Quản lý kết luận lâm sàng, chữ ký số HMAC và in phiếu kết quả.",
        filter: "Bộ lọc báo cáo",
        totalReports: "Tổng Số Hồ Sơ Báo Cáo",
        pendingReview: "Chờ Bác Sĩ Thẩm Định",
        reviewed: "Đã Ký Duyệt Lâm Sàng",
        searchLabel: "Tìm kiếm hồ sơ báo cáo",
        searchPlaceholder: "Tìm theo MRN, tên bệnh nhân, mã ca...",
        allTab: "Tất cả",
        pendingTab: "Chờ Thẩm Định",
        reviewedTab: "Đã Ký Duyệt",
        listTitle: "Danh sách hồ sơ báo cáo",
        columns: {
          code: "Mã hồ sơ",
          patient: "Bệnh nhân",
          date: "Ngày ký",
          findings: "Kết luận lâm sàng",
          status: "Trạng thái ký",
          actions: "Thao tác",
          eye: "Mắt Khám",
          aiRisk: "Mức Rủi Ro AI",
          hmac: "Chữ Ký Số HMAC",
        },
        unsigned: "Chưa ký số",
        reviewAndSign: "Thẩm Định / Ký",
        print: "In phiếu kết quả",
        exportPdf: "Xuất tệp PDF",
        exportCsv: "Xuất tệp CSV",
        downloadSignoff: "Tải chứng thư ký số",
        emptyReports: "Không tìm thấy hồ sơ báo cáo nào phù hợp với điều kiện lọc.",
        certModalTitle: "Chứng Thư & Chữ Ký Số Lâm Sàng",
        certModalDesc: "Xác thực tính toàn vẹn hồ sơ bệnh án theo tiêu chuẩn bảo mật y tế HIPAA & HMAC-SHA256",
        validCert: "Chữ Ký Số Hợp Lệ & Toàn Vẹn",
        sealedDesc: "Bản ghi chẩn đoán đã được niêm phong mật mã bởi bác sĩ chuyên khoa.",
        hmacHashLabel: "Chuỗi mã băm chữ ký số HMAC:",
        close: "Đóng",
        approvedDecision: "Đồng thuận chẩn đoán AI",
        modifiedDecision: "Hiệu chỉnh chuyên môn",
        signingDoctor: "Bác sĩ ký duyệt",
        signedAtLabel: "Thời điểm ký",
        recordCodeLabel: "Mã ca khám",
        patientLabel: "Bệnh nhân",
        clinicalDecisionLabel: "Quyết định lâm sàng",
      },
      riskAnalytics: {
        title: "Thống Kê Nguy Cơ & Hiệu Suất Lâm Sàng",
        subtitle: "Tổng hợp chỉ số nguy cơ vi mạch, phân bố rủi ro và tỷ lệ đồng thuận với AI.",
        refresh: "Làm mới",
        populationDistribution: "Phân bố nguy cơ quần thể",
        riskMatrix: "Ma trận nguy cơ tim mạch và võng mạc",
        ageGroups: "Thống kê theo nhóm tuổi",
        hypertensionVsRetinopathyCorrelation: "Tương quan tăng huyết áp và bệnh võng mạc",
        assignedPatients: "Bệnh Nhân Phụ Trách",
        assignedPatientsDesc: "Bệnh nhân trong danh sách quản lý",
        clinicallyReviewed: "Đã Duyệt Lâm Sàng",
        clinicallyReviewedDesc: "Ca sàng lọc đã ký số / xác nhận",
        pendingReview: "Chờ Thẩm Định",
        pendingReviewDesc: "Ca AI đã phân tích cần bác sĩ xem",
        consensusWithAi: "Đồng Thuận Với AI",
        consensusWithAiDesc: "Tỷ lệ đồng ý với phân loại AI",
        riskDistributionTitle: "Phân Bố Nguy Cơ Vi Mạch Lâm Sàng",
        totalCases: "Tổng: {count} ca",
        critical: "Nghiêm trọng",
        highRisk: "Nguy cơ cao",
        moderate: "Trung bình",
        lowNormal: "Thấp / Chuẩn",
        pctOfTotal: "{pct}% tổng số ca",
        avgBiomarkersTitle: "Chỉ Số Sinh Học Vi Mạch Trung Bình",
        cohortAverage: "Trung bình nhóm",
        avRatioLabel: "Tỷ lệ động-tĩnh mạch (A/V)",
        avRatioRef: "Chuẩn tham chiếu: ~0.67 (2:3)",
        vesselDensityLabel: "Mật Độ Vi Mạch",
        vesselDensityRef: "Bình thường: 42% - 50%",
        tortuosityLabel: "Độ Xoắn Vặn Mạch Máu",
        tortuosityRef: "Chuẩn: 0.08 - 0.12",
        cdrLabel: "Lõm Gai Thị (CDR)",
        cdrRef: "Sinh lý bình thường: 0.3 - 0.4",
        avWarning: "A/V Ratio < 0.50 phản ánh tình trạng co thắt tiểu động mạch võng mạc nghiêm trọng do xơ vữa hoặc tăng huyết áp mạn tính.",
        recentScreeningsTitle: "Danh Sách Ca Khám Phụ Trách Gần Nhất",
        filterTag: "Lọc: {filter}",
        viewAll: "Xem tất cả",
        emptyRecent: "Không có ca sàng lọc nào phù hợp với bộ lọc hiện tại.",
        modified: "Đã hiệu chỉnh",
        approvedSigned: "Đã duyệt ký",
      },
      consultation: {
        title: "Kênh Tư Vấn & Trao Đổi Trực Tuyến Với Bệnh Nhân",
        subtitle: "Trao đổi lâm sàng trực tiếp thời gian thực.",
        stompActive: "STOMP Realtime Active",
        assignedPatients: "Bệnh Nhân Phụ Trách",
        searchPlaceholder: "Tìm theo tên, MRN, SĐT...",
        noPatients: "Không tìm thấy bệnh nhân nào.",
        vitalBp: "HA",
        vitalHba1c: "HbA1c",
        attendingDoctor: "Bác sĩ phụ trách",
        openCds: "Mở CDS",
        openCdsTitle: "Mở ảnh đáy mắt của bệnh nhân này trên bàn chẩn đoán CDS",
        safetyWarningTitle: "Cảnh báo an toàn y khoa:",
        safetyWarningText: "Kênh trao đổi chuyên môn y khoa thời gian thực. Không sử dụng cho các trường hợp cấp cứu khẩn cấp.",
        loadingHistory: "Đang nạp lịch sử hội thoại...",
        noMessagesTitle: "Chưa có tin nhắn nào",
        noMessagesText: "Bắt đầu cuộc trò chuyện tư vấn với bệnh nhân bằng cách nhập tin nhắn hoặc chọn gợi ý lâm sàng bên dưới.",
        quickRepliesLabel: "Gợi ý nhanh:",
        quickReplies: [
          "Kết quả phân tích vi mạch võng mạc của bác đã được bác sĩ ký duyệt.",
          "Chỉ số A/V Ratio ổn định, bác tiếp tục duy trì phác đồ điều trị và đo huyết áp mỗi sáng.",
          "Đáy mắt có biểu hiện xơ cứng tiểu động mạch nhẹ, bác chú ý kiêng mặn và tái khám sau 3 tháng.",
          "Bác sĩ đã xuất phiếu kết quả chẩn đoán, bác có thể tải về từ hồ sơ bệnh nhân.",
        ],
        inputPlaceholder: "Gửi hướng dẫn lâm sàng cho bệnh nhân...",
        sendButton: "Gửi",
        selectPatientPrompt: "Vui lòng chọn một bệnh nhân ở cột bên trái để bắt đầu cuộc tư vấn.",
      },
      assignmentBoard: {
        title: "Điều phối bệnh nhân cho bác sĩ",
        subtitle: "Kéo thẻ bệnh nhân sang bác sĩ hoặc chọn nhiều bệnh nhân để phân công hàng loạt.",
        selectDoctorPlaceholder: "Chọn bác sĩ phụ trách",
        assignButton: "Phân công",
        selected: "đã chọn",
        assignedNotice: "Đã phân công {count} bệnh nhân.",
        unassignedNotice: "Đã đưa bệnh nhân về danh sách chưa phân công.",
        unassignedColumn: "Chưa phân công",
        allAssigned: "Tất cả bệnh nhân đã có bác sĩ phụ trách.",
        dropToAssign: "Thả bệnh nhân vào đây để phân công.",
        noMrn: "Chưa có MRN",
        loading: "Đang tải bảng phân công...",
      },
      validationBar: {
        title: "Thẩm Định Lâm Sàng & Phê Duyệt Kết Quả Sàng Lọc",
        subtitle: "Bác sĩ xác nhận độ chính xác của AI hoặc điều chỉnh mức độ rủi ro theo chuyên môn.",
        printReport: "In Phiếu Kết Quả",
        savedSuccess: "Đã lưu kết luận lâm sàng và đồng bộ báo cáo sàng lọc thành công!",
        decisionLabel: "Quyết định thẩm định chuyên môn:",
        decisions: {
          approve: "Chấp thuận AI",
          modify: "Hiệu chỉnh nguy cơ",
          reject: "Bác bỏ kết quả",
        },
        adjustedCardio: "Mức nguy cơ Tim mạch:",
        adjustedDR: "Mức nguy cơ Võng mạc ĐTĐ:",
        icd10Label: "Mã bệnh danh ICD-10 (phân tách dấu phẩy):",
        notesLabel: "Ghi chú chẩn đoán lâm sàng:",
        saveButton: "Ký Số & Lưu Kết Quả Lâm Sàng",
        savingButton: "Đang lưu và ký số...",
      },
      newPatientModal: {
        title: "Tiếp Nhận Bệnh Nhân Mới",
        description: "Nhập thông tin hành chính và sinh hiệu cơ bản",
        fullName: "Họ và tên",
        mrn: "Mã hồ sơ MRN",
        age: "Tuổi",
        gender: "Giới tính",
        phone: "Số điện thoại",
        systolicBp: "HA Tâm thu",
        diastolicBp: "HA Tâm trương",
        hba1c: "HbA1c (%)",
        cancel: "Hủy",
        save: "Lưu Hồ Sơ",
      },
      reportModal: {
        exitEsc: "Thoát",
        close: "Đóng",
        officialReportTitle: "Báo Cáo Sàng Lọc Y Tế Võng Mạc AURA",
        preliminaryReportTitle: "Báo Cáo Sàng Lọc Sơ Bộ AURA AI - Đang Chờ Bác Sĩ Thẩm Định",
        dualEyeBadge: "Sàng lọc toàn diện 2 mắt (OD + OS)",
        reportCode: "Mã phiếu:",
        exportCsv: "Xuất CSV",
        printPdf: "In Phiếu / PDF",
        systemTitle: "HỆ THỐNG SÀNG LỌC MẠCH MÁU VÕNG MẠC AURA",
        systemSubtitleReviewed: "Phiếu Báo Cáo Y Tế Chính Thức",
        systemSubtitlePreliminary: "Phiếu Đánh Giá Sơ Bộ",
        dualEyeSuffix: "(2 Mắt OD & OS)",
        reportCodeLabel: "Mã Báo Cáo:",
        examDateLabel: "Ngày Khám:",
        reviewedStatus: "Đã duyệt lâm sàng",
        pendingStatus: "Chờ bác sĩ thẩm định",
        unsigned: "Chưa ký số",
        fullName: "Họ và tên:",
        patientId: "Mã bệnh nhân:",
        ageGender: "Tuổi / Giới tính:",
        bpDiabetes: "Huyết áp / HbA1c:",
        section1: "1. Hình Ảnh Võng Mạc & Bản Đồ Nhiệt Vi Mạch AI",
        section2: "2. Đánh Giá Nguy Cơ Lâm Sàng Đa Bệnh Lý",
        section3: "3. Phân Tích Chỉ Số Sinh Học Vi Mạch Võng Mạc",
        section4: "4. Nhận Định Lâm Sàng AI & Khuyến Nghị Y Khoa",
        section5: "5. Thẩm Định Lâm Sàng & Chữ Ký Số Bác Sĩ",
        overallRisk: "Điểm Nguy Cơ Vi Mạch Tổng Hợp",
        cardioRisk: "Nguy Cơ Tim Mạch (3 Năm)",
        strokeRisk: "Nguy Cơ Đột Quỵ (3 Năm)",
        retinopathyRisk: "Bệnh Võng Mạc Đái Tháo Đường",
        glaucomaRisk: "Nguy Cơ Glaucoma (Tăng Nhãn Áp)",
        colBiomarker: "Chỉ số sinh học",
        colOD: "Mắt Phải (OD)",
        colOS: "Mắt Trái (OS)",
        colMeasured: "Giá trị đo",
        colReference: "Dải tham chiếu chuẩn",
        colEvaluation: "Đánh giá lâm sàng",
        bmAvr: "Tỷ lệ Động/Tĩnh mạch",
        bmDensity: "Mật độ tưới máu vi mạch",
        bmTortuosity: "Độ uốn lượn mạch máu",
        bmCdr: "Tỷ lệ lõm gai thị",
        doctorDecisionLabel: "Quyết định lâm sàng:",
        doctorApproved: "Đồng thuận với phân tích sơ bộ của AI",
        doctorModified: "Hiệu chỉnh kết luận theo chuyên môn bác sĩ",
        validSignature: "Chữ ký số hợp lệ & xác thực PKI",
        signedAtLabel: "Thời điểm ký:",
        reviewingSpecialist: "Bác sĩ chuyên khoa ký duyệt:",
        noSignatureYet: "Chưa có chữ ký số bác sĩ",
        dualComparisonHeader: "Đối chiếu đồng thời 2 mắt: Mắt Phải (OD) & Mắt Trái (OS)",
        icd10Label: "Danh mục mã bệnh quốc tế ICD-10:",
        doctorNotesTitle: "Ghi chú chuyên môn của Bác sĩ:",
        recommendationsTitle: "Khuyến nghị y khoa:",
        findingsTitle: "Nhận định vi mạch AI:",
      },
    },
    clinic: {
      portal: {
        title: "Không gian quản lý sàng lọc phòng khám",
        subtitle: "Quản trị chiến dịch tầm soát vi mạch số lượng lớn, phân công bác sĩ và thống kê lâm sàng.",
        batchScreeningStatus: "Trạng thái xử lý lô ảnh",
        activeCampaigns: "Chiến dịch sàng lọc đang hoạt động",
        assignedDoctors: "Đội ngũ bác sĩ phụ trách",
        quotaBalance: "Số dư hạn mức lượt khám",
        topUp: "Nạp thêm hạn mức",
        defaultFacility: "Phòng khám chuyên khoa",
        profile: {
          title: "Hồ sơ đăng ký & xác thực cơ sở y tế",
          verified: "Đã xác minh",
          rejected: "Bị từ chối",
          pending: "Đang chờ duyệt",
          loading: "Đang tải hồ sơ cơ sở...",
          orgNameLabel: "Tên tổ chức y tế / Phòng khám",
          orgNamePlaceholder: "Ví dụ: Phòng khám Đa khoa AURA",
          licenseNumberLabel: "Số giấy phép hoạt động khám chữa bệnh",
          licenseNumberPlaceholder: "Ví dụ: 01234/SYT-GPHĐ",
          attachedDocLabel: "Tài liệu đính kèm (Giấy phép, chứng chỉ hành nghề)",
          selectedFile: "Đã chọn",
          submitButton: "Lưu & gửi hồ sơ xác minh",
          submitSuccess: "Đã nộp hồ sơ, đang chờ Quản trị viên xác minh.",
          submitFailed: "Nộp hồ sơ thất bại. Vui lòng thử lại.",
        },
        doctors: {
          title: "Quản lý đội ngũ bác sĩ của phòng khám",
          addDoctorPlaceholder: "Nhập email bác sĩ cần thêm...",
          addDoctorButton: "Thêm bác sĩ",
          addDoctorSuccess: "Đã thêm bác sĩ vào danh sách phòng khám thành công.",
          addDoctorFailed: "Thêm bác sĩ thất bại. Vui lòng kiểm tra email.",
          colName: "Họ và tên",
          colEmail: "Email",
          colStatus: "Trạng thái",
          colActions: "Thao tác",
          noDoctors: "Chưa có bác sĩ nào trong cơ sở.",
          statusActive: "Hoạt động",
          deleteTitle: "Xóa khỏi phòng khám",
          confirmDelete: "Bạn có chắc chắn muốn xóa bác sĩ này khỏi phòng khám?",
          assignTitle: "Phân công bệnh nhân cho bác sĩ",
          selectDoctor: "Chọn bác sĩ",
          patientIdLabel: "Mã / ID bệnh nhân",
          patientIdPlaceholder: "Nhập ID bệnh nhân...",
          assignButton: "Phân công tiếp nhận",
          assignSuccess: "Đã phân công bệnh nhân cho bác sĩ thành công.",
          assignFailed: "Phân công bệnh nhân thất bại.",
        },
      },
      batchWorkspace: {
        batchList: "Danh sách lô ảnh sàng lọc",
        status: {
          queued: "Đang xếp hàng",
          processing: "Đang xử lý phân tích",
          completed: "Đã hoàn thành",
          error: "Lỗi chất lượng ảnh",
        },
        newBatchButton: "Tải lên đợt ảnh mới",
        batchDetails: "Chi tiết tiến trình lô ảnh",
        totalImages: "Tổng số ảnh trong đợt",
        batch: "Đợt",
        newBatch: "Mới",
        completedAi: "Đã hoàn thành AI",
        rate: "Tỷ lệ",
        processingBackground: "Đang phân tích ngầm",
        asyncQueue: "Hàng đợi phi đồng bộ",
        qualityError: "Lỗi chất lượng ảnh",
        retakeNeeded: "Cần chụp lại",
        searchLabel: "Tìm kiếm tệp ảnh / ca sàng lọc",
        searchPlaceholder: "Tìm tên tệp ảnh, định danh...",
        clearSearch: "Xóa tìm kiếm",
        statusFilterLabel: "Trạng thái xử lý",
        allStatuses: "Tất cả trạng thái",
        statusCompleted: "Đã hoàn thành",
        statusProcessing: "Đang xử lý",
        statusFailed: "Lỗi chất lượng",
        exportCsv: "Xuất CSV",
        campaignImagesTitle: "Danh sách tệp ảnh chiến dịch",
        facility: "Cơ sở",
        defaultFacility: "Trung tâm sàng lọc",
        batchIdLabel: "Mã",
        colFileId: "Mã tệp / ID ảnh",
        colPatient: "Bệnh nhân (Ẩn danh)",
        colEye: "Mắt khám",
        colStatus: "Trạng thái",
        colActions: "Thao tác",
        viewDetail: "Chi tiết",
        defaultFundusName: "Ảnh đáy mắt",
        emptyMessage: "Chưa có ảnh nào trong đợt khám hiện tại. Bấm 'Tải lên đợt ảnh mới' để tải tệp hàng loạt.",
        badgeQualityError: "Lỗi chất lượng",
        badgeProcessing: "Đang xử lý",
        badgeCompleted: "Đã xử lý",
      },
      batchProcessing: {
        batchTitle: "Tiến trình phân tích lô hàng loạt",
        progress: "Tiến độ xử lý tổng thể",
        itemsProcessed: "Số ca ảnh đã xử lý",
        successRate: "Tỷ lệ phân tích thành công",
        filterStatus: "Lọc theo trạng thái xử lý",
        filterRisk: "Lọc theo mức độ nguy cơ",
        itemsTable: "Danh sách ảnh trong lô",
        allStatuses: "Tất cả trạng thái",
        statusDone: "Đã xong",
        statusProcessing: "Đang xử lý",
        statusPending: "Chờ hàng đợi",
        statusFailed: "Lỗi chất lượng",
        allRisks: "Tất cả mức nguy cơ",
        riskHighCritical: "Nguy cơ cao & nguy kịch (≥70%)",
        riskModerate: "Nguy cơ trung bình (40-69%)",
        riskLow: "Nguy cơ thấp (<40%)",
        allEyes: "Tất cả mắt",
        rightEye: "Mắt phải (OD)",
        leftEye: "Mắt trái (OS)",
        sortNewest: "Mới nhất trước",
        sortOldest: "Cũ nhất trước",
        sortRiskDesc: "Nguy cơ cao nhất",
        sortMrnAsc: "Sắp theo mã hồ sơ (A-Z)",
        pageSize25: "25 ảnh / trang",
        pageSize50: "50 ảnh / trang",
        pageSize100: "100 ảnh / trang (Chuẩn quy mô lớn)",
        pageSizeAll: "Tất cả ảnh",
        closeToast: "Đóng",
        campaignIdLabel: "Mã chiến dịch:",
        readyForNewBatch: "Sẵn sàng tiếp nhận đợt mới",
        systemReady: "Hệ thống sàng lọc AI sẵn sàng",
        campaignSubtitle: "Chiến dịch sàng lọc mạch máu võng mạc",
        bulkQueueProgress: "Tiến độ xử lý hàng đợi AI",
        doneLabel: "Đã xong:",
        scansLabel: "ảnh",
        minScansStandard: "(≥100 ảnh)",
        timeRemaining: "Thời gian còn lại:",
        creditsManagement: "Quản lý lượt khám sàng lọc",
        availableCredits: "lượt AI khả dụng",
        syncedActivePackage: "Đồng bộ từ gói cước hoạt động",
        topUpButton: "+ Mua thêm lượt",
        highRiskCard: "Nguy cơ cao (Khẩn)",
        highRiskAction: "Cần bác sĩ hội chẩn ngay",
        moderateRiskCard: "Nguy cơ trung bình",
        moderateRiskAction: "Khám theo dõi định kỳ",
        lowRiskCard: "Nguy cơ thấp / Bình thường",
        lowRiskAction: "Chỉ số vi mạch an toàn",
        queueProcessingCard: "Đang chờ & phân tích",
        runningScans: "Đang chạy:",
        allCompleted: "Đã hoàn tất toàn bộ",
        emergencyAlertTitle: "Cảnh báo khẩn cấp phát hiện ca bệnh có nguy cơ mạch máu nghiêm trọng",
        emergencyBannerTag: "Cảnh báo lâm sàng khẩn cấp",
        emergencyDesc: "Hệ thống AI nhận diện tổn thương vi mạch võng mạc mức độ nặng (Hẹp tiểu động mạch lan tỏa, tỷ số A/V giảm sâu, nguy cơ đột quỵ cao). Cần kích hoạt quy trình hội chẩn và chuyển tuyến khẩn cấp.",
        hideList: "Ẩn danh sách",
        viewAlertDetails: "Xem chi tiết cảnh báo",
        urgentCaseList: "Danh sách ca bệnh cần can thiệp khẩn cấp:",
        actionLabel: "Chỉ định:",
        aggregatedSurveillanceTitle: "Giám sát nguy cơ mạch máu tổng hợp",
        riskDistributionTitle: "Phân bố nguy cơ mạch máu toàn bộ chiến dịch",
        riskDistributionDesc: "Biểu đồ phân bổ tỷ lệ nguy cơ và các chỉ số vi mạch tổng hợp của tập bệnh nhân sàng lọc.",
        totalEvaluatedRecords: "Tổng đánh giá:",
        meanVascularScore: "Điểm mạch máu trung bình",
        highRiskRate: "Tỷ lệ nguy cơ cao",
        highSevereCases: "ca nguy cơ cao / nguy kịch",
        threeYearStrokeRisk: "Nguy cơ đột quỵ 3 năm",
        meanStrokeForecast: "Dự báo đột quỵ trung bình",
        lowRiskRate: "Tỷ lệ nguy cơ thấp",
        safeCases: "ca an toàn",
        donutMeanScore: "Điểm trung bình",
        outOf100: "trên thang 100",
        donutCaption: "Biểu đồ tròn phân bố mức nguy cơ",
        riskBreakdownTitle: "Chi tiết phân bổ mức nguy cơ",
        lowRiskBand: "Nguy cơ thấp",
        moderateRiskBand: "Nguy cơ trung bình",
        highRiskBand: "Nguy cơ cao",
        criticalRiskBand: "Nguy kịch",
        casesCount: "ca",
        searchPlaceholder: "Tìm theo mã hồ sơ, tên, hoặc tệp ảnh...",
        deidentifiedModeOn: "Chế độ ẩn danh (HIPAA)",
        deidentifiedModeOff: "Chế độ đầy đủ",
        deidentifiedTooltip: "Chuyển đổi hiển thị tên bệnh nhân thành mã định danh ẩn danh",
        printReportButton: "In báo cáo",
        exportCsvButton: "Xuất CSV",
        uploadFolderButton: "Tải lên thư mục (≥100 ảnh)",
        colNum: "#",
        colThumbnail: "Ảnh đáy mắt",
        colPatientMrn: "Bệnh nhân & Mã hồ sơ",
        colEye: "Mắt",
        colStatus: "Trạng thái",
        colRiskAssessment: "Đánh giá nguy cơ",
        colClinicalVitals: "Thông số lâm sàng & AI",
        colActions: "Chi tiết CDS",
        emptyRecords: "Không tìm thấy bản ghi sàng lọc nào khớp với bộ lọc hiện tại.",
        viewCdsButton: "Xem CDS →",
        badgeCompleted: "Hoàn tất",
        badgeProcessing: "Đang chạy",
        badgePending: "Chờ hàng đợi",
        badgeError: "Lỗi đọc ảnh",
        showingPagination: "Hiển thị:",
        pageOf: "Trang",
        firstPageTitle: "Về trang đầu",
        prevPageTitle: "Trang trước",
        nextPageTitle: "Trang sau",
        lastPageTitle: "Đến trang cuối",
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
        standardBadge: "Chuẩn lâm sàng",
        description: "Tiếp nhận ảnh chiến dịch, khử định danh HIPAA và đưa vào hàng đợi AI.",
        campaignNameLabel: "Tên chiến dịch tầm soát",
        campaignNamePlaceholder: "Nhập tên chiến dịch khám...",
        facilityLabel: "Cơ sở / Phòng khám phụ trách",
        satelliteOption: "Điểm sàng lọc vệ tinh / Lưu động",
        dropzoneHint: "Hỗ trợ định dạng DICOM (.dcm), TIFF, PNG, JPG từ máy chụp võng mạc.",
        selectFilesButton: "Chọn nhiều tệp ảnh",
        selectFolderButton: "Kéo thư mục ảnh",
        quickDemoTitle: "Kiểm thử nhanh (Dữ liệu mẫu)",
        quickDemoDesc: "Tạo nhanh 100 ca khám mẫu đầy đủ thông số để kiểm thử hàng đợi AI.",
        loadDemoButton: "Nạp nhanh 100 ảnh mẫu",
        demoStandardBadge: "Dữ liệu mẫu kiểm thử (≥ 100 ảnh)",
        preflightTitle: "Danh sách tiền kiểm tra:",
        scansLoaded: "ảnh đã nạp",
        standardPassed: "Đạt chuẩn ≥ 100 ảnh",
        standardRequired: "Yêu cầu ≥ 100 ảnh",
        quickAssignLabel: "Gán nhanh:",
        allOdButton: "Tất cả mắt phải (OD)",
        allOsButton: "Tất cả mắt trái (OS)",
        alternateEyesButton: "Xen kẽ cặp mắt (OD/OS)",
        fillSampleVitalsButton: "Điền sinh hiệu mẫu",
        fillVitalsTooltip: "Tự động điền huyết áp và HbA1c mẫu cho các ca chưa có thông số",
        filterAllEyes: "Tất cả mắt (OD/OS)",
        filterOd: "Chỉ mắt phải (OD)",
        filterOs: "Chỉ mắt trái (OS)",
        clearAllButton: "Xóa tất cả",
        emptyStaged: "Chưa có ảnh nào được nạp. Hãy kéo thả thư mục ảnh hoặc bấm 'Nạp nhanh 100 ảnh mẫu'.",
        colNum: "STT",
        colPreview: "Xem trước",
        colFileName: "Tên tệp ảnh",
        colMrnPatient: "Mã hồ sơ & Bệnh nhân",
        colEyePosition: "Mắt chụp",
        colVitals: "Sinh hiệu (HA / HbA1c)",
        colActions: "Thao tác",
        moreScansCount: "ảnh khác trong lô tiền kiểm tra.",
        estimatedConsumption: "Tiêu hao dự kiến:",
        availableBalance: "Khả dụng:",
        cancelButton: "Hủy bỏ",
        deidentifyingQueuing: "Đang khử định danh & đẩy hàng đợi...",
        startBatchButton: "Bắt đầu phân tích lô",
        defaultCampaignName: "Chiến dịch tầm soát đột quỵ & mạch máu võng mạc",
      },
      batchDetailModal: {
        itemDetails: "Chi tiết phân tích ca chụp trong lô",
        eye: "Vị trí mắt",
        scanType: "Kiểu chụp võng mạc",
        biomarkers: "Các chỉ số đo lường vi mạch",
        rawFundus: "Ảnh màu đáy mắt gốc",
        heatmap: "Bản đồ nhiệt Grad-CAM",
        doctorSignoffStatus: "Tình trạng thẩm định của bác sĩ",
        deidHipaa: "Khử định danh HIPAA:",
        fileLabel: "Tệp:",
        overallVascularRisk: "Nguy cơ mạch máu chung",
        modelName: "Mô hình AURA Multimodal Vision CDS",
        cardiovascularRisk: "Nguy cơ tim mạch",
        score2Ai: "Mô hình SCORE2-AI",
        arteriolarNarrowing: "Hẹp lòng mạch vi tuần hoàn",
        drRisk: "Võng mạc đái tháo đường",
        icdrGrade: "Phân độ theo ICDR",
        microaneurysms: "Vi phình mạch & xuất huyết nhỏ",
        threeYearStroke: "Đột quỵ 3 năm",
        strokeProjection: "Dự báo đột quỵ",
        gunnSign: "Áp lực thành mạch & dấu hiệu Gunn",
        heatmapOpacityLabel: "Độ mờ bản đồ nhiệt AI:",
        zoomOutTitle: "Thu nhỏ",
        zoomInTitle: "Phóng to",
        resetZoomTitle: "Đặt lại thu phóng",
        lesionBoxesRoi: "Vùng tổn thương",
        anatomyMarkers: "Mốc giải phẫu",
        sideBySideView: "Xem song song",
        directOverlayView: "Chồng lớp trực tiếp",
        downloadPng: "Tải PNG",
        nativeFundusTitle: "Ảnh võng mạc gốc",
        nativeResolution: "512 × 512 điểm ảnh",
        opticDiscLabel: "Gai thị",
        maculaLabel: "Hoàng điểm",
        formatLabel: "Định dạng:",
        heatmapLesionTitle: "Bản đồ nhiệt Grad-CAM & vùng tổn thương",
        heatmapAvailable: "Bản đồ nhiệt Grad-CAM sẵn sàng",
        noHeatmap: "Chưa có bản đồ nhiệt",
        noHeatmapWarning: "Chưa có bản đồ nhiệt Grad-CAM",
        hudHoverHint: "Rê chuột để soi tọa độ & phân tầng vi mạch",
        directOverlayTitle: "Chế độ chồng lớp AI trên ảnh võng mạc bệnh nhân",
        directOverlaySubtitle: "Kéo thanh trượt độ mờ phía trên để so sánh ảnh gốc và quang phổ nhiệt",
        detectedAnomaliesTitle: "Các vùng tổn thương phát hiện bởi AI:",
        detectedAnomaliesHint: "Rê hoặc bấm thẻ để làm nổi bật vị trí trên võng mạc",
        noFocalLesions: "Không phát hiện tổn thương khu trú",
        noLesionsDesc: "Không phát hiện tổn thương vi phình mạch hoặc xuất huyết khu trú trên ảnh này.",
        biomarkersTitle: "Chỉ số sinh học vi mạch võng mạc",
        avrLabel: "Tỷ lệ động-tĩnh mạch (A/V)",
        avrNormal: "Chuẩn bình thường: ~0.67",
        tortuosityLabel: "Độ ngoằn ngoèo mạch máu",
        tortuosityDesc: "Chỉ dấu biến đổi áp lực vi tuần hoàn",
        vesselDensityLabel: "Mật độ vi mạch",
        vesselDensityDesc: "Mật độ mạng lưới mao mạch",
        cdrLabel: "Tỷ lệ lõm đĩa thị (C/D)",
        cdrNormal: "Trong giới hạn an toàn",
        rationalesTitle: "Bằng chứng & luận cứ chẩn đoán AI",
        processingDuration: "Thời gian AI xử lý:",
        closeButton: "Đóng",
        zoneDisc: "Khu vực gai thị",
        zoneMacula: "Khu vực hoàng điểm",
        zoneSuperiorArcade: "Cung mạch thái dương trên",
        zoneInferiorArcade: "Cung mạch thái dương dưới",
        zonePosteriorPole: "Võng mạc cực sau",
        defaultRationale1: "Cung mạch võng mạc phân bố đều đặn, không thấy dấu hiệu tắc nghẽn hay co hẹp.",
        defaultRationale2: "Chưa phát hiện dấu hiệu nén ép hay xơ cứng thành mạch máu.",
        defaultRationale3: "Mạng lưới tưới máu mao mạch võng mạc ổn định.",
        defaultRationaleMod1: "Dấu hiệu co thắt nhẹ vi mạch hoặc biến đổi vi tuần hoàn khu trú.",
        defaultRationaleMod2: "Độ uốn lượn mạch máu cần theo dõi định kỳ.",
        defaultRationaleHigh1: "Suy giảm tỷ lệ A/V (co hẹp tiểu động mạch võng mạc khu trú).",
        defaultRationaleHigh2: "Dấu hiệu nén vách tĩnh mạch tại điểm bắt chéo động-tĩnh mạch.",
        defaultRationaleHigh3: "Độ uốn lượn mạch máu tăng do biến đổi áp lực lưu lượng vi tuần hoàn.",
      },
      campaignAnalytics: {
        campaignTitle: "Thống kê chiến dịch tầm soát cộng đồng",
        totalScreened: "Tổng số lượt khám đã sàng lọc",
        highRiskIdentified: "Số ca phát hiện nguy cơ cao",
        coverageRate: "Tỷ lệ bao phủ mục tiêu",
        demographicChart: "Biểu đồ phân bố nhân khẩu học",
        pageSubtitle: "Dữ liệu tổng hợp toàn cơ sở y tế / phòng khám và các đợt sàng lọc vi mạch.",
        loadingMessage: "Đang tải dữ liệu báo cáo chiến dịch lâm sàng...",
        errorTitle: "Lỗi tải dữ liệu chiến dịch",
        errorMessage: "Không thể kết nối đến máy chủ báo cáo chiến dịch.",
        emptyTitle: "Chưa có dữ liệu chiến dịch",
        emptyDescription: "Phòng khám chưa triển khai chiến dịch sàng lọc nào hoặc chưa có dữ liệu tổng hợp.",
        reloadButton: "Tải lại dữ liệu",
        exportCsvButton: "Xuất dữ liệu (CSV)",
        totalCampaignsCard: "Tổng số chiến dịch",
        totalCampaignsSub: "Chiến dịch sàng lọc cộng đồng đã khởi tạo",
        totalImagesCard: "Tổng số ảnh đã quét",
        totalImagesSub: "Ảnh chụp đáy mắt đã phân tích qua AI",
        highRiskCard: "Bệnh nhân nguy cơ cao",
        highRiskSub: "Ca bệnh cần theo dõi hoặc chuyển tuyến chuyên khoa",
      },
      creditPackage: {
        title: "Thống kê hạn mức & dung lượng khám cơ sở",
        subtitle: "Theo dõi số dư lượt phân tích AI, đợt quét hiện tại và trạng thái hợp đồng dịch vụ.",
        loading: "Đang tải dữ liệu hạn mức và gói cước phòng khám...",
        quotaDepletedTitle: "Cơ sở đã hết lượt khám sàng lọc khả dụng",
        quotaLowTitle: "Hạn mức khám sắp cạn kiệt",
        quotaWarningDesc: "Chiến dịch sàng lọc hàng loạt có thể bị tạm dừng nếu số lượng ảnh tải lên vượt quá số dư lượt khám còn lại. Vui lòng gia hạn hoặc mua thêm gói dịch vụ để đảm bảo hoạt động liên tục.",
        topUpNow: "Nạp thêm lượt ngay",
        refreshing: "Đang cập nhật...",
        refresh: "Làm mới",
        renewBuyButton: "Gia hạn / Mua gói",
        availableCredits: "Lượt khám khả dụng",
        scansUnit: "lượt",
        statusAbundant: "Hạn mức dồi dào",
        statusLow: "Cần sớm nạp thêm",
        statusDepleted: "Đã hết hạn mức",
        scannedInBatch: "Đã quét trong đợt",
        totalCampaignScanned: "Tổng toàn chiến dịch:",
        activePackage: "Gói đang hoạt động",
        noActivePackage: "Chưa kích hoạt gói",
        statusActive: "Đang kích hoạt",
        statusUnregistered: "Chưa đăng ký",
        validityPeriod: "Thời hạn hiệu lực",
        indefinite: "Vô thời hạn",
        autoRenewNotice: "Tự động gia hạn khi mua gói",
        currentPlanNotice: "Áp dụng cho gói đang dùng",
        consumptionProgress: "Tiến độ tiêu hao hạn mức sàng lọc",
        processedCount: "Đã xử lý:",
        availableCount: "Khả dụng:",
        processedInBatchLegend: "Đã phân tích trong đợt",
        availableCreditsLegend: "Lượt khám khả dụng sẵn sàng",
        packagesSectionTitle: "Danh sách gói dịch vụ cấp phòng khám",
        packagesSectionSubtitle: "Hạn mức thiết kế chuyên biệt cho đợt tầm soát vi mạch diện rộng và bệnh viện từ 500 đến 5.000 lượt phân tích AI.",
        vatSupportBadge: "Hỗ trợ hóa đơn VAT & chứng thư y tế",
        recommendedRibbon: "Gói khuyên dùng cho chiến dịch",
        currentPlanBadge: "Đang dùng",
        currencyVnd: "VNĐ",
        plusScans: "lượt phân tích",
        validityDays: "Thời hạn:",
        featuresIncluded: "Tính năng bao gồm:",
        renewThisPackage: "Gia hạn gói này",
        buyPackageNow: "Mua gói ngay",
        historySectionTitle: "Lịch sử giao dịch & hóa đơn phòng khám",
        historySectionSubtitle: "Toàn bộ nhật ký nạp hạn mức, thanh toán hợp đồng dịch vụ và biên lai điện tử.",
        reloadHistory: "Tải lại lịch sử",
        colTxnId: "Mã giao dịch",
        colPackage: "Gói dịch vụ",
        colAmount: "Số tiền (VNĐ)",
        colScans: "Số lượt",
        colPaidDate: "Ngày thanh toán",
        colMethod: "Phương thức",
        colStatus: "Trạng thái",
        colReceipt: "Biên lai",
        emptyHistory: "Chưa có lịch sử giao dịch nào.",
        emptyHistorySub: "Khi cơ sở thanh toán gia hạn hoặc mua gói hạn mức, thông tin hóa đơn sẽ hiển thị tại đây.",
        providerVietqr: "VietQR Napas 24/7",
        providerMomo: "Ví MoMo",
        providerBank: "Chuyển khoản VietQR",
        providerVnpay: "VNPay QR",
        statusSuccess: "Thành công",
        statusPending: "Đang xử lý",
        statusFailed: "Thất bại",
        viewReceipt: "Xem biên lai",
        receiptTitle: "Biên lai điện tử phòng khám",
        providerLabel: "Đơn vị cung cấp dịch vụ:",
        providerSystemName: "HỆ THỐNG Y TẾ AURA CDS & AI SCREENING",
        providerSystemDesc: "Nền tảng sàng lọc vi mạch võng mạc & nguy cơ tim mạch",
        invoiceIdLabel: "Mã hóa đơn:",
        servicePackageLabel: "Gói dịch vụ:",
        recordedTimeLabel: "Thời gian ghi nhận:",
        paymentGatewayLabel: "Cổng thanh toán:",
        settlementStatusLabel: "Trạng thái:",
        settledValid: "Đã quyết toán hợp lệ",
        totalPaidLabel: "Tổng tiền thanh toán:",
        receiptDisclaimer: "Chứng từ điện tử tuân thủ quy chuẩn y tế và có giá trị thanh quyết toán kinh phí chiến dịch sàng lọc.",
        closeReceipt: "Đóng",
        printReceipt: "In biên lai",
        complianceTitle: "Quy định sử dụng hạn mức sàng lọc phòng khám",
        complianceText: "Số lượt khám được cấp chỉ phục vụ cho hoạt động sàng lọc ban đầu và hỗ trợ quyết định lâm sàng tại cơ sở y tế đã được cấp phép. Kết quả phân tích AI không thay thế chẩn đoán xác định của bác sĩ chuyên khoa mắt hoặc tim mạch. Hạn mức chưa sử dụng sẽ được cộng dồn tự động khi cơ sở thực hiện gia hạn trước thời điểm hết hạn của gói hiện tại.",
        pkgStarterName: "Gói cơ sở sàng lọc",
        pkgStarterDesc: "Dành cho phòng khám đa khoa, chuyên khoa mắt triển khai tầm soát quy mô ban đầu.",
        pkgCampaignName: "Gói chiến dịch lâm sàng",
        pkgCampaignDesc: "Lựa chọn tối ưu cho các chiến dịch khám cộng đồng, khám sức khỏe doanh nghiệp lớn.",
        pkgHospitalName: "Gói quy mô bệnh viện",
        pkgHospitalDesc: "Giải pháp toàn diện cho bệnh viện mắt, trung tâm chẩn đoán hình ảnh và hệ thống chuỗi.",
        pkgStarterFeatures: [
          "500 lượt phân tích ảnh vi mạch võng mạc AI",
          "Đánh giá 4 cấp độ nguy cơ (Thấp, Trung bình, Cao, Nguy kịch)",
          "Bản đồ nhiệt Grad-CAM & tính toán tỷ lệ vi mạch A/V",
          "Báo cáo chẩn đoán tóm tắt PDF chuẩn Bộ Y Tế",
          "Hỗ trợ tối đa 2 tài khoản bác sĩ tiếp nhận phân tích",
          "Hỗ trợ kỹ thuật qua email trong giờ hành chính",
        ],
        pkgCampaignFeatures: [
          "2.000 lượt phân tích ảnh võng mạc tốc độ cao",
          "Tự động xử lý đợt hàng loạt tệp ZIP & DICOM",
          "Báo cáo dịch tễ học & thống kê phân tầng nguy cơ toàn chiến dịch",
          "Phân công bệnh nhân tự động cho đội ngũ bác sĩ chuyên khoa",
          "Xuất dữ liệu báo cáo chuyên sâu định dạng CSV/Excel",
          "Không giới hạn số lượng tài khoản bác sĩ trực thuộc",
          "Tiết kiệm 10% chi phí so với gói cơ sở",
        ],
        pkgHospitalFeatures: [
          "5.000 lượt phân tích ảnh võng mạc với băng thông ưu tiên cao nhất",
          "Cổng tích hợp API chuyên biệt với hệ thống PACS / HIS / EMR",
          "Báo cáo dịch tễ học và giám sát xu hướng thời gian thực",
          "Ký số kết luận y khoa với chứng thư số bảo mật cao",
          "Hỗ trợ kỹ thuật chuyên biệt 24/7 & chuyên viên lâm sàng đào tạo",
          "Tùy biến mẫu báo cáo thương hiệu riêng của cơ sở y tế",
          "Tiết kiệm 20% chi phí phân tích vi mạch",
        ],
      },
    },
    admin: {
      dashboardTitle: "Quản trị hệ thống",
      dashboardSubtitle: "Quản lý tài khoản, phân quyền RBAC, gói dịch vụ và nhật ký HIPAA.",
      tabs: {
        users: "Tài Khoản",
        rbac: "Phân Quyền",
        notifications: "Thông Báo",
        clinics: "Duyệt Phòng Khám",
        packages: "Gói Dịch Vụ",
        aiConfig: "Cấu Hình AI",
        audit: "Nhật Ký HIPAA",
      },
      audit: {
        title: "Nhật ký kiểm toán HIPAA",
        subtitle: "Ghi vết mọi thao tác truy cập hồ sơ bệnh án và xuất dữ liệu.",
        searchByUserIp: "Tìm kiếm theo người dùng, hành động, tài nguyên hoặc địa chỉ IP...",
        severityFilter: "Lọc theo mức độ nghiêm trọng",
        actionFilter: "Lọc theo loại hành động",
        resetFilter: "Đặt lại",
        exportBtn: "Xuất Nhật Ký",
        emptyMessage: "Không có nhật ký kiểm toán nào phù hợp.",
        severityAll: "Mức độ (Tất cả)",
        severityInfo: "Thông tin",
        severityWarning: "Cảnh báo",
        severityCritical: "Nguy kịch",
        columns: {
          timestamp: "Thời gian",
          user: "Người thực hiện",
          role: "Vai trò",
          action: "Hành động",
          resource: "Tài nguyên tác động",
          ip: "Địa chỉ IP",
          severity: "Mức cảnh báo",
          actionResource: "Hành động & Tài nguyên",
          status: "Trạng thái",
        },
        exportAuditTrail: "Xuất nhật ký kiểm toán CSV",
        statusSuccess: "Thành công",
        statusFailed: "Thất bại",
      },
      userManagement: {
        title: "Quản lý tài khoản",
        subtitle: "Quản lý trạng thái, thông tin và phân quyền người dùng hệ thống.",
        userList: "Danh sách tài khoản hệ thống",
        changeRole: "Thay đổi vai trò người dùng",
        activateDeactivate: "Kích hoạt / Tạm khóa tài khoản",
        resetPassword: "Đặt lại mật khẩu truy cập",
        saveChanges: "Lưu thay đổi người dùng",
        searchPlaceholder: "Tìm kiếm theo tên hoặc email...",
        filterRole: "Lọc theo vai trò",
        allRoles: "Tất cả vai trò",
        filterBtn: "Lọc",
        emptyUsers: "Không tìm thấy tài khoản người dùng nào.",
        editUser: "Sửa",
        changeRoleBtn: "Đổi Vai Trò",
        lockAccount: "Khóa",
        unlockAccount: "Kích hoạt",
        activeStatus: "HOẠT ĐỘNG",
        suspendedStatus: "VÔ HIỆU HÓA",
        notUpdated: "Chưa cập nhật",
        activatedSuccess: "Đã kích hoạt tài khoản thành công.",
        suspendedSuccess: "Đã vô hiệu hóa (khóa) tài khoản.",
        updatedSuccess: "Đã cập nhật thông tin tài khoản.",
        roleUpdatedSuccess: "Đã thay đổi vai trò tài khoản.",
        editModalTitle: "Chỉnh Sửa Hồ Sơ Tài Khoản",
        emailLabel: "Email đăng nhập",
        fullNameLabel: "Họ và tên",
        phoneLabel: "Số điện thoại liên hệ",
        addressLabel: "Địa chỉ / Cơ sở y tế",
        roleModalTitle: "Phân Quyền Vai Trò",
        roleModalDesc: "Chọn vai trò hệ thống mới cho tài khoản:",
        confirmRoleBtn: "Xác Nhận Đổi",
      },
      rbac: {
        rolePermissionMatrix: "Ma trận phân quyền (RBAC)",
        subtitle: "Thiết lập quyền truy cập cho từng vai trò người dùng.",
        viewPermissions: "Xem bảng quyền hạn chi tiết",
        editPermissions: "Chỉnh sửa quyền hạn vai trò",
        savePolicy: "Lưu chính sách phân quyền",
        saveMatrix: "Lưu Ma Trận Quyền",
        savedSuccess: "Đã lưu ma trận phân quyền thành công.",
        activePermissions: "Quyền kích hoạt",
        permissionCatalogTitle: "Danh Mục Quyền Hạn Cho Vai Trò:",
      },
      aiConfig: {
        title: "Cấu hình tham số AI",
        subtitle: "Điều chỉnh độ nhạy và ngưỡng cảnh báo lâm sàng của mô hình AI.",
        modelSelection: "Mô hình thị giác máy học",
        temperature: "Độ biến thiên",
        sensitivityThreshold: "Ngưỡng nhạy cảm biến đổi vi mạch",
        endpointUrl: "Địa chỉ máy chủ AI Inference",
        testConnection: "Kiểm tra kết nối máy chủ AI",
        saveParameters: "Lưu cấu hình tham số AI",
        glaucomaSensitivity: "Độ Nhạy Sàng Lọc Glaucoma/CVD",
        glaucomaHint: "Tối ưu phát hiện sớm các tổn thương co thắt tiểu động mạch.",
        drConfidence: "Ngưỡng Tin Cậy Bệnh Võng Mạc ĐTĐ",
        drHint: "Yêu cầu AI đạt độ tin cậy tối thiểu trước khi xuất phân loại lâm sàng.",
        retrainThreshold: "Ngưỡng Cảnh Báo Co Thắt A/V Ratio",
        retrainHint: "Kích hoạt cảnh báo nguy cơ tăng huyết áp khi A/V Ratio dưới ngưỡng.",
      },
      templates: {
        notificationTemplates: "Mẫu thông báo",
        subtitle: "Cấu hình nội dung tin nhắn mẫu qua Email, SMS và In-App.",
        channel: {
          email: "Thư điện tử",
          inApp: "Thông báo ứng dụng",
          sms: "Tin nhắn SMS",
        },
        title: "Tiêu đề thông báo",
        content: "Nội dung mẫu",
        createTemplate: "Tạo mẫu thông báo mới",
        edit: "Chỉnh sửa mẫu",
        delete: "Xóa mẫu",
        addTemplate: "Thêm Mẫu Mới",
        subjectPrefix: "Tiêu đề:",
        statusPrefix: "Trạng thái:",
        activeStatus: "Đang kích hoạt",
        inactiveStatus: "Tạm tắt",
        policiesTitle: "Chính sách gửi tin",
        policiesSubtitle: "Thiết lập kích hoạt kênh và quy tắc cảnh báo y tế khẩn cấp.",
        savePolicies: "Lưu Chính Sách",
        activeChannelsTitle: "Kênh Liên Lạc Kích Hoạt",
        emergencyRulesTitle: "Quy Tắc Khẩn Cấp & Giờ Yên Tĩnh",
        inAppChannelLabel: "Thông báo ứng dụng (In-App)",
        emailChannelLabel: "Email y tế (Kết quả & Báo cáo PDF)",
        smsChannelLabel: "Tin nhắn SMS (Cảnh báo nguy cơ cao)",
        criticalAlertLabel: "Cảnh báo khẩn cấp nguy cơ rất cao",
        criticalAlertDesc: "Ưu tiên phát tức thời bất kể giờ yên tĩnh",
        quietStartLabel: "Giờ bắt đầu yên tĩnh",
        quietEndLabel: "Giờ kết thúc yên tĩnh",
        retentionLabel: "Thời gian lưu trữ thông báo theo ngày",
        modalCreateTitle: "Tạo Mẫu Thông Báo Mới",
        modalEditTitle: "Chỉnh Sửa Mẫu Thông Báo",
        codeLabel: "Mã định danh",
        nameLabel: "Tên mẫu hiển thị",
        channelLabel: "Kênh thông báo",
        subjectLabel: "Tiêu đề tin nhắn",
        bodyLabel: "Nội dung chi tiết",
        descriptionLabel: "Mô tả mục đích sử dụng",
        enableCheckbox: "Kích hoạt sử dụng mẫu này",
        saveTemplateBtn: "Lưu Mẫu",
        savedNotice: "Đã lưu mẫu thông báo thành công.",
        policySavedNotice: "Đã cập nhật chính sách gửi tin.",
      },
      packages: {
        servicePackageList: "Gói dịch vụ & Biểu phí",
        subtitle: "Cấu hình gói sàng lọc, số lượt phân tích và hạn mức sử dụng.",
        packageName: "Tên gói dịch vụ",
        price: "Đơn giá",
        quota: "Số lượt khám sàng lọc",
        validity: "Thời hạn sử dụng",
        activeToggle: "Trạng thái kích hoạt",
        createPackage: "Tạo gói dịch vụ mới",
        refreshTooltip: "Làm mới danh sách gói",
        totalPackages: "Tổng Số Gói",
        activePackages: "Đang Mở Bán",
        userPackages: "Gói Cá Nhân",
        clinicPackages: "Gói Phòng Khám",
        searchPlaceholder: "Tìm kiếm gói dịch vụ theo tên, mã...",
        scopeAll: "Tất cả đối tượng",
        scopeUser: "Cá nhân",
        scopeClinic: "Phòng khám",
        days: "ngày",
        lifetime: "Vĩnh viễn",
        active: "Đang bán",
        inactive: "Tạm ngưng",
        creditsUnit: "lượt",
        createModalTitle: "Tạo Gói Dịch Vụ Mới",
        editModalTitle: "Chỉnh Sửa Gói Dịch Vụ",
        createModalSubtitle: "Định nghĩa gói sàng lọc và mức biểu phí",
        codeLabel: "Mã gói",
        nameLabel: "Tên gói dịch vụ",
        descLabel: "Mô tả chi tiết",
        scopeLabel: "Đối tượng áp dụng",
        creditsLabel: "Số lượt sàng lọc",
        priceLabel: "Đơn giá VNĐ",
        validityLabel: "Thời hạn sử dụng theo ngày, 0 = Vĩnh viễn",
        featuresLabel: "Tính năng lâm sàng đi kèm, mỗi dòng một tính năng",
        activeImmediateLabel: "Kích hoạt mở bán ngay",
        saveBtn: "Lưu Thay Đổi",
        createBtn: "Tạo Gói Mới",
        deactivateBtn: "Ngưng bán",
        activateBtn: "Mở bán",
        loadingList: "Đang tải danh sách gói dịch vụ...",
        emptyFiltered: "Không có gói dịch vụ nào phù hợp điều kiện lọc.",
        packageSavedNotice: "Đã cập nhật thông tin gói dịch vụ.",
        packageCreatedNotice: "Đã tạo gói dịch vụ mới thành công.",
        statusToggledNotice: "Đã cập nhật trạng thái mở bán gói dịch vụ.",
      },
      clinics: {
        title: "Phê duyệt phòng khám",
        subtitle: "Xét duyệt giấy phép và cấp quyền sàng lọc cho cơ sở y tế.",
        loading: "Đang tải hồ sơ phòng khám...",
        empty: "Không có hồ sơ phòng khám nào chờ duyệt.",
        licenseLabel: "Giấy phép số:",
        notProvided: "Chưa cung cấp",
        approve: "Phê Duyệt",
        reject: "Từ Chối",
        approvedSuccess: "Đã phê duyệt hồ sơ phòng khám.",
        rejectedSuccess: "Đã từ chối hồ sơ phòng khám.",
      },
    },
    footer: {
      copyright: "© 2026 Hệ thống Hỗ trợ Quyết định Lâm sàng AURA. Bản quyền đã được bảo hộ.",
      version: "Phiên bản 1.0.0 (Bản dựng Lâm sàng)",
      termsOfService: "Điều khoản Sử dụng Dịch vụ",
      privacyPolicy: "Chính sách Bảo mật Dữ liệu Y tế",
      medicalSafetyStatement:
        "Kết quả phân tích do AI thực hiện chỉ nhằm mục đích hỗ trợ sàng lọc và không thay thế chẩn đoán chuyên môn của bác sĩ chuyên khoa mắt hoặc tim mạch.",
      supportCenter: "Trung tâm Hỗ trợ",
      securityCert: "Đạt chuẩn HIPAA & ISO 13485 / ISO 27001",
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
      loadingInit: "Initializing AURA clinical workspace...",
      statusLabel: "Status",
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
      negativeFindingBannerTitle: "Normal microvasculature (0 lesions detected)",
      negativeFindingBannerDesc: "AI surveyed all quadrants; no microaneurysms or focal narrowing detected.",
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
        roleSelection: "User role",
        registerButton: "Create account",
        termsConsent: "I agree to the Terms of Service and Medical Data Privacy Policy",
        signUpWithGoogle: "Sign up with Google",
        orDivider: "Or",
        optionalLabel: "Optional",
        passwordRequirementsHint: "Password must be 12–128 characters, with uppercase, lowercase, numbers, and special characters.",
        verifyOtpTitle: "Verify OTP Code",
        otpSentTo: "A 6-digit OTP code was sent to:",
        enterOtpLabel: "Enter 6-digit verification code",
        resendIn: "Resend code in",
        resendOtpBtn: "Resend OTP Code",
        verifyAndCreateBtn: "Verify & Create Account",
        changeEmailBtn: "Change email address",
        sendingOtp: "Sending OTP code...",
        verifyingOtp: "Verifying...",
      },
      authHeroPanel: {
        tagline: "AI-Powered Retinal Microvascular & Cardiovascular Health Screening System",
        hipaaCompliant: "HIPAA & ISO 27001 Security Compliant",
        aiAccuracy: "High clinical accuracy with transparent Explainable AI",
        clinicalBenefits: "Early detection of stroke risks and diabetic retinopathy complications",
        trustedByHospitals: "Trusted by medical centers and specialized healthcare clinics",
        aiScreeningSupport: "AI Screening Support",
        retinalAnalysis: "Retinal Image Analysis",
        medicalWarning: "Results are for screening support only and do not replace professional doctor diagnosis.",
      },
      verifyEmailLink: {
        verifying: "Verifying sign-in link...",
        success: "Link verified successfully! Redirecting...",
        invalidLink: "Invalid or expired verification link.",
        returnToLogin: "Return to sign-in",
        verifyingTitle: "Please Wait",
        verifyingStatus: "Verifying sign-in link...",
        signingInStatus: "Signing in to system...",
        failedTitle: "Sign-In Failed",
        emailRequiredError: "Email is required to proceed.",
        loginFailedError: "System sign-in failed.",
      },
      passwordInput: {
        showPassword: "Show password",
        hidePassword: "Hide password",
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
          resetFilters: "Reset filters",
          resetFiltersTooltip: "Reset all filter criteria (Eye, Risk level, Search box) to default",
          resetFiltersNotice: "Reset all filter criteria to default. Medical screening history is securely preserved per clinical standards.",
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
        immutabilityNotice: "Electronic Medical Records (EMR) are immutably preserved per HIPAA and MoH clinical standards for lifelong health tracking.",
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
        loading: "Loading doctor workspace...",
        syncing: "Syncing assigned patients from system.",
        noAssignedTitle: "No Assigned Patients",
        noAssignedDesc: "This doctor account has not been assigned any patients yet by clinic or admin.",
        viewPatientList: "View Patient Directory",
        reload: "Reload",
        feedbackSuccess: "Specialist assessment saved and patient record updated",
        screeningNotice: "Screening Notice",
        selectPatientFirst: "Please select an assigned patient before uploading images.",
        switchPatient: "Switch Patient",
        message: "Message",
        printResult: "Print Report",
        noResultsYet: "No Screening Results Yet",
        noResultsDesc: "No screening records yet for this patient in the system.",
        loadingScreeningHistory: "Loading patient screening history...",
        bloodPressure: "Blood Pressure",
        hba1c: "HbA1c",
        attendingDoctor: "Attending doctor",
        notMeasured: "Not measured",
        notTested: "Not tested",
        yearsOld: "years old",
      },
      worklist: {
        title: "Assigned Screening Queue",
        search: "Search patients by name, MRN...",
        searchLabel: "Search patients",
        searchPlaceholder: "Search by name, MRN...",
        reviewStatusLabel: "Review status",
        riskLevelLabel: "Risk level",
        refresh: "Refresh",
        addPatient: "Add Patient",
        reset: "Reset",
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
          vitals: "Vital Signs",
        },
        reviewButton: "Review & Sign",
        openCds: "Open CDS",
        pendingReview: "Pending review",
        reviewed: "Reviewed",
        priorityCritical: "Priority review required",
        priorityHigh: "Significant microvascular lesions",
        priorityModerate: "Routine follow-up required",
        priorityLow: "Stable microvascular architecture",
        criticalLevel: "Critical",
        highLevel: "High risk",
        moderateLevel: "Moderate risk",
        lowLevel: "Low risk",
        allLevels: "All levels",
        allStatuses: "All statuses",
        emptyFiltered: "No patients matching the current filters.",
        totalAssignedNotice: "Total {count} patients in assigned directory.",
      },
      diagnosisModal: {
        title: "Clinical Validation & Digital Sign-off",
        aiPreliminary: "AI preliminary findings",
        patientLabel: "Patient",
        analysisIdLabel: "Analysis ID",
        decisionLabel: "Specialist Clinical Decision:",
        doctorDecision: {
          approve: "Approve AI findings",
          modify: "Modify clinical findings",
          reject: "Reject AI findings",
        },
        adjustedCardio: "Adjusted cardiovascular risk",
        adjustedDR: "Adjusted diabetic retinopathy grade",
        icd10Select: "Assign ICD-10 clinical codes",
        doctorNotes: "Diagnostic notes & management plan",
        defaultNotes: "Specialist has validated and confirmed preliminary findings from AURA AI.",
        digitalSign: "Digital sign-off",
        signedAt: "Signed timestamp",
        signerName: "Signing specialist",
        saveButton: "Save & Record sign-off",
        pkiSignatureLabel: "PKI Digital Signature:",
        cancel: "Cancel",
        icdOptions: {
          h350: "H35.0 — Retinal vascular changes",
          e113: "E11.3 — Diabetic retinopathy",
          i10: "I10 — Essential hypertension",
          h401: "H40.1 — Primary open-angle glaucoma",
          h353: "H35.3 — Age-related macular degeneration",
        },
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
        title: "Medical Reports & Sign-off",
        subtitle: "Manage clinical findings, HMAC digital signatures, and printed reports.",
        filter: "Filter reports",
        totalReports: "Total Reports",
        pendingReview: "Pending Review",
        reviewed: "Approved & Signed",
        searchLabel: "Search reports",
        searchPlaceholder: "Search by MRN, patient name, code...",
        allTab: "All",
        pendingTab: "Pending Review",
        reviewedTab: "Signed",
        listTitle: "Medical reports list",
        columns: {
          code: "Record code",
          patient: "Patient",
          date: "Date signed",
          findings: "Clinical findings",
          status: "Status",
          actions: "Actions",
          eye: "Examined Eye",
          aiRisk: "AI Risk",
          hmac: "HMAC Signature",
        },
        unsigned: "Unsigned",
        reviewAndSign: "Review & Sign",
        print: "Print report",
        exportPdf: "Export PDF",
        exportCsv: "Export CSV",
        downloadSignoff: "Download certificate",
        emptyReports: "No medical reports found matching filters.",
        certModalTitle: "Digital Certificate & Signature",
        certModalDesc: "Chart integrity verification compliant with HIPAA & HMAC-SHA256 standards",
        validCert: "Valid Digital Signature",
        sealedDesc: "Diagnostic record cryptographically sealed by attending specialist.",
        hmacHashLabel: "HMAC signature hash:",
        close: "Close",
        approvedDecision: "Approved AI findings",
        modifiedDecision: "Modified findings",
        signingDoctor: "Signing doctor",
        signedAtLabel: "Signed timestamp",
        recordCodeLabel: "Record code",
        patientLabel: "Patient",
        clinicalDecisionLabel: "Clinical decision",
      },
      riskAnalytics: {
        title: "Risk Analytics & Clinical Performance",
        subtitle: "Summary of retinal microvascular metrics, risk distribution, and AI consensus.",
        refresh: "Refresh",
        populationDistribution: "Population risk distribution",
        riskMatrix: "Cardiovascular vs retinal risk matrix",
        ageGroups: "Age group breakdown",
        hypertensionVsRetinopathyCorrelation: "Hypertension vs retinopathy correlation",
        assignedPatients: "Assigned Patients",
        assignedPatientsDesc: "Patients in managed directory",
        clinicallyReviewed: "Clinically Reviewed",
        clinicallyReviewedDesc: "Signed / verified screenings",
        pendingReview: "Pending Review",
        pendingReviewDesc: "Cases awaiting review",
        consensusWithAi: "Consensus with AI",
        consensusWithAiDesc: "Agreement rate with AI",
        riskDistributionTitle: "Clinical Microvascular Risk Distribution",
        totalCases: "Total: {count} cases",
        critical: "Critical",
        highRisk: "High risk",
        moderate: "Moderate",
        lowNormal: "Low / Normal",
        pctOfTotal: "{pct}% of total",
        avgBiomarkersTitle: "Average Biomarkers",
        cohortAverage: "Cohort average",
        avRatioLabel: "Arteriovenous Ratio (A/V)",
        avRatioRef: "Reference: ~0.67 (2:3)",
        vesselDensityLabel: "Vessel Density",
        vesselDensityRef: "Normal: 42% - 50%",
        tortuosityLabel: "Vascular Tortuosity",
        tortuosityRef: "Normal: 0.08 - 0.12",
        cdrLabel: "Cup-to-Disc Ratio (CDR)",
        cdrRef: "Normal: 0.3 - 0.4",
        avWarning: "A/V Ratio < 0.50 reflects severe arteriolar narrowing due to hypertension.",
        recentScreeningsTitle: "Recent Assigned Cases",
        filterTag: "Filter: {filter}",
        viewAll: "View all",
        emptyRecent: "No screenings match the filter.",
        modified: "Modified",
        approvedSigned: "Approved & Signed",
      },
      consultation: {
        title: "Online Patient Consultation",
        subtitle: "Real-time clinical communication channel.",
        stompActive: "STOMP Realtime Active",
        assignedPatients: "Assigned Patients",
        searchPlaceholder: "Search by name, MRN, phone...",
        noPatients: "No patients found.",
        vitalBp: "BP",
        vitalHba1c: "HbA1c",
        attendingDoctor: "Attending doctor",
        openCds: "Open CDS",
        openCdsTitle: "Open retinal image in CDS workspace",
        safetyWarningTitle: "Medical Safety Notice:",
        safetyWarningText: "Real-time clinical channel. Not for medical emergencies.",
        loadingHistory: "Loading conversation history...",
        noMessagesTitle: "No messages yet",
        noMessagesText: "Start a consultation by typing a message or selecting a quick clinical reply below.",
        quickRepliesLabel: "Quick replies:",
        quickReplies: [
          "Your retinal microvascular analysis has been reviewed and signed off.",
          "Arteriovenous (A/V) ratio is stable; maintain current regimen and check morning BP.",
          "Mild retinal arteriolar sclerosis detected; reduce sodium intake and follow up in 3 months.",
          "Clinical report has been issued and is available for download in your patient portal.",
        ],
        inputPlaceholder: "Send clinical guidance to patient...",
        sendButton: "Send",
        selectPatientPrompt: "Please select a patient from the left column to begin consultation.",
      },
      assignmentBoard: {
        title: "Patient Assignment & Care Coordination",
        subtitle: "Drag patient cards to doctors or select multiple patients for bulk assignment.",
        selectDoctorPlaceholder: "Select attending doctor",
        assignButton: "Assign",
        selected: "selected",
        assignedNotice: "Assigned {count} patients.",
        unassignedNotice: "Patient returned to unassigned queue.",
        unassignedColumn: "Unassigned Patients",
        allAssigned: "All patients have been assigned to doctors.",
        dropToAssign: "Drop patient cards here to assign.",
        noMrn: "No MRN",
        loading: "Loading assignment board...",
      },
      validationBar: {
        title: "Clinical Validation & Screening Approval",
        subtitle: "Specialist validates AI accuracy or overrides risk levels based on clinical judgment.",
        printReport: "Print Medical Report",
        savedSuccess: "Clinical findings saved and screening report synchronized successfully!",
        decisionLabel: "Clinical Validation Decision:",
        decisions: {
          approve: "Approve AI",
          modify: "Modify Risk",
          reject: "Reject Findings",
        },
        adjustedCardio: "Cardiovascular Risk:",
        adjustedDR: "Diabetic Retinopathy Grade:",
        icd10Label: "ICD-10 Diagnostic Codes (comma separated):",
        notesLabel: "Clinical Diagnostic Notes:",
        saveButton: "Sign & Save Clinical Findings",
        savingButton: "Saving and signing...",
      },
      newPatientModal: {
        title: "Register New Patient",
        description: "Enter demographic information and baseline vitals",
        fullName: "Full Name",
        mrn: "MRN Code",
        age: "Age",
        gender: "Gender",
        phone: "Phone Number",
        systolicBp: "Systolic BP",
        diastolicBp: "Diastolic BP",
        hba1c: "HbA1c (%)",
        cancel: "Cancel",
        save: "Save Record",
      },
      reportModal: {
        exitEsc: "Exit (Esc)",
        close: "Close",
        officialReportTitle: "AURA Retinal Medical Screening Report",
        preliminaryReportTitle: "AURA AI Preliminary Screening Report - Awaiting Doctor Review",
        dualEyeBadge: "Comprehensive Dual-Eye Screening (OD + OS)",
        reportCode: "Report Code:",
        exportCsv: "Export CSV",
        printPdf: "Print / PDF",
        systemTitle: "AURA RETINAL VASCULAR SCREENING SYSTEM",
        systemSubtitleReviewed: "Official Medical Report",
        systemSubtitlePreliminary: "Preliminary Assessment Report",
        dualEyeSuffix: "(Dual Eyes OD & OS)",
        reportCodeLabel: "Report Code:",
        examDateLabel: "Exam Date:",
        reviewedStatus: "Clinically Reviewed",
        pendingStatus: "Pending Specialist Review",
        unsigned: "Unsigned",
        fullName: "Full Name:",
        patientId: "Patient ID:",
        ageGender: "Age / Gender:",
        bpDiabetes: "Blood Pressure / HbA1c:",
        section1: "1. Retinal Fundus Images & AI Microvascular Heatmap",
        section2: "2. Multimodal Clinical Risk Assessment",
        section3: "3. Retinal Microvascular Biomarkers Analysis",
        section4: "4. AI Clinical Findings & Management Recommendations",
        section5: "5. Clinical Validation & Specialist Digital Signature",
        overallRisk: "Overall Vascular Risk Score",
        cardioRisk: "Cardiovascular Risk (3-Year)",
        strokeRisk: "Stroke Risk (3-Year)",
        retinopathyRisk: "Diabetic Retinopathy",
        glaucomaRisk: "Glaucoma Risk",
        colBiomarker: "Biomarker",
        colOD: "Right Eye (OD)",
        colOS: "Left Eye (OS)",
        colMeasured: "Measured Value",
        colReference: "Reference Range",
        colEvaluation: "Clinical Evaluation",
        bmAvr: "Arteriovenous Ratio",
        bmDensity: "Capillary Perfusion Density",
        bmTortuosity: "Vascular Tortuosity Index",
        bmCdr: "Vertical Cup-to-Disc Ratio",
        doctorDecisionLabel: "Clinical Decision:",
        doctorApproved: "Approved preliminary AI findings",
        doctorModified: "Clinically modified by specialist",
        validSignature: "Valid Digital Signature & PKI Authentication",
        signedAtLabel: "Signed at:",
        reviewingSpecialist: "Reviewing Specialist:",
        noSignatureYet: "No specialist signature",
        dualComparisonHeader: "Dual eye side-by-side comparison: Right Eye (OD) & Left Eye (OS)",
        icd10Label: "ICD-10 Disease Classification:",
        doctorNotesTitle: "Attending Specialist Clinical Notes:",
        recommendationsTitle: "Management Recommendations:",
        findingsTitle: "AI Microvascular Findings:",
      },
    },
    clinic: {
      portal: {
        title: "Clinic Screening Operations Portal",
        subtitle: "Manage bulk microvascular screening campaigns, assign doctors, and review clinical statistics.",
        batchScreeningStatus: "Batch screening status",
        activeCampaigns: "Active screening campaigns",
        assignedDoctors: "Assigned medical staff",
        quotaBalance: "Screening credit balance",
        topUp: "Top up credits",
        defaultFacility: "Specialized Clinic",
        profile: {
          title: "Healthcare Facility Registration & Verification",
          verified: "Verified",
          rejected: "Rejected",
          pending: "Pending Review",
          loading: "Loading facility profile...",
          orgNameLabel: "Healthcare Organization / Clinic Name",
          orgNamePlaceholder: "e.g., AURA General Clinic",
          licenseNumberLabel: "Operating Medical License Number",
          licenseNumberPlaceholder: "e.g., 01234/DOH-LIC",
          attachedDocLabel: "Attached Documents (License, Practice Certificate)",
          selectedFile: "Selected",
          submitButton: "Save & Submit for Verification",
          submitSuccess: "Profile submitted, awaiting Administrator verification.",
          submitFailed: "Submission failed. Please try again.",
        },
        doctors: {
          title: "Clinic Medical Staff Management",
          addDoctorPlaceholder: "Enter doctor email to add...",
          addDoctorButton: "Add Doctor",
          addDoctorSuccess: "Doctor successfully added to clinic roster.",
          addDoctorFailed: "Failed to add doctor. Please verify email address.",
          colName: "Full Name",
          colEmail: "Email",
          colStatus: "Status",
          colActions: "Actions",
          noDoctors: "No medical staff registered in this facility.",
          statusActive: "Active",
          deleteTitle: "Remove from clinic",
          confirmDelete: "Are you sure you want to remove this doctor from the clinic?",
          assignTitle: "Assign Patient to Doctor",
          selectDoctor: "Select Doctor",
          patientIdLabel: "Patient Code / ID",
          patientIdPlaceholder: "Enter patient ID...",
          assignButton: "Assign to Doctor",
          assignSuccess: "Patient successfully assigned to doctor.",
          assignFailed: "Failed to assign patient to doctor.",
        },
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
        totalImages: "Total images in batch",
        batch: "Batch",
        newBatch: "New",
        completedAi: "AI completed",
        rate: "Rate",
        processingBackground: "Processing in background",
        asyncQueue: "Async processing queue",
        qualityError: "Image quality issue",
        retakeNeeded: "Rescan required",
        searchLabel: "Search scan files / screening cases",
        searchPlaceholder: "Search by file name, patient ID...",
        clearSearch: "Clear search",
        statusFilterLabel: "Processing status",
        allStatuses: "All statuses",
        statusCompleted: "Completed",
        statusProcessing: "Processing",
        statusFailed: "Quality issue",
        exportCsv: "Export CSV",
        campaignImagesTitle: "Campaign scan files",
        facility: "Facility",
        defaultFacility: "Screening Center",
        batchIdLabel: "Batch ID",
        colFileId: "File / Scan ID",
        colPatient: "Patient (De-identified)",
        colEye: "Eye examined",
        colStatus: "Status",
        colActions: "Actions",
        viewDetail: "Details",
        defaultFundusName: "Fundus image",
        emptyMessage: "No images in the current batch. Click 'Upload new batch' to add files.",
        badgeQualityError: "Quality issue",
        badgeProcessing: "Processing",
        badgeCompleted: "Processed",
      },
      batchProcessing: {
        batchTitle: "Bulk Batch Analysis Progress",
        progress: "Overall processing progress",
        itemsProcessed: "Processed image scans",
        successRate: "Analysis success rate",
        filterStatus: "Filter by processing status",
        filterRisk: "Filter by risk level",
        itemsTable: "Batch scan items",
        allStatuses: "All statuses",
        statusDone: "Completed",
        statusProcessing: "Processing",
        statusPending: "Queued",
        statusFailed: "Quality issue",
        allRisks: "All risk levels",
        riskHighCritical: "High & critical risk (≥70%)",
        riskModerate: "Moderate risk (40-69%)",
        riskLow: "Low risk (<40%)",
        allEyes: "All eyes",
        rightEye: "Right eye (OD)",
        leftEye: "Left eye (OS)",
        sortNewest: "Newest first",
        sortOldest: "Oldest first",
        sortRiskDesc: "Highest risk",
        sortMrnAsc: "Sort by MRN (A-Z)",
        pageSize25: "25 scans / page",
        pageSize50: "50 scans / page",
        pageSize100: "100 scans / page (Enterprise standard)",
        pageSizeAll: "All scans",
        closeToast: "Close",
        campaignIdLabel: "Campaign ID:",
        readyForNewBatch: "Ready for new batch",
        systemReady: "AI Screening System Ready",
        campaignSubtitle: "Retinal Vascular Health Screening Campaign",
        bulkQueueProgress: "AI Queue Processing Progress",
        doneLabel: "Completed:",
        scansLabel: "scans",
        minScansStandard: "(≥100 scans)",
        timeRemaining: "Estimated time remaining:",
        creditsManagement: "Screening Credits Management",
        availableCredits: "available AI scans",
        syncedActivePackage: "Synced from active package",
        topUpButton: "+ Purchase Credits",
        highRiskCard: "High Risk (Urgent)",
        highRiskAction: "Immediate clinical review needed",
        moderateRiskCard: "Moderate Risk",
        moderateRiskAction: "Routine follow-up required",
        lowRiskCard: "Low Risk / Normal",
        lowRiskAction: "Normal microvascular metrics",
        queueProcessingCard: "Queued & Processing",
        runningScans: "Running:",
        allCompleted: "All scans completed",
        emergencyAlertTitle: "Emergency alert: critical microvascular cases detected",
        emergencyBannerTag: "Emergency Clinical Alert",
        emergencyDesc: "AI detected severe retinal vascular lesions (generalized arteriolar attenuation, severe A/V ratio reduction, elevated stroke risk). Immediate specialist triage required.",
        hideList: "Hide list",
        viewAlertDetails: "View alert details",
        urgentCaseList: "Cases requiring immediate clinical intervention:",
        actionLabel: "Action:",
        aggregatedSurveillanceTitle: "Aggregated Microvascular Risk Surveillance",
        riskDistributionTitle: "Campaign Microvascular Risk Distribution",
        riskDistributionDesc: "Risk proportion distribution and aggregated microvascular metrics across the screened cohort.",
        totalEvaluatedRecords: "Total evaluated:",
        meanVascularScore: "Mean vascular score",
        highRiskRate: "High risk rate",
        highSevereCases: "high/critical cases",
        threeYearStrokeRisk: "3-Year stroke risk",
        meanStrokeForecast: "Mean predicted stroke risk",
        lowRiskRate: "Low risk rate",
        safeCases: "normal cases",
        donutMeanScore: "Mean score",
        outOf100: "on scale of 100",
        donutCaption: "Risk level distribution donut chart",
        riskBreakdownTitle: "Risk distribution breakdown",
        lowRiskBand: "Low risk",
        moderateRiskBand: "Moderate risk",
        highRiskBand: "High risk",
        criticalRiskBand: "Critical risk",
        casesCount: "cases",
        searchPlaceholder: "Search by MRN, patient name, or scan file...",
        deidentifiedModeOn: "De-identified Mode (HIPAA)",
        deidentifiedModeOff: "Standard Mode",
        deidentifiedTooltip: "Toggle HIPAA SHA-256 de-identified pseudonym view",
        printReportButton: "Print report",
        exportCsvButton: "Export CSV",
        uploadFolderButton: "Upload folder (≥100 scans)",
        colNum: "#",
        colThumbnail: "Fundus scan",
        colPatientMrn: "Patient & MRN",
        colEye: "Eye",
        colStatus: "Status",
        colRiskAssessment: "Risk assessment",
        colClinicalVitals: "Clinical metrics & AI",
        colActions: "CDS details",
        emptyRecords: "No screening records match the current filter.",
        viewCdsButton: "View CDS →",
        badgeCompleted: "Completed",
        badgeProcessing: "Processing",
        badgePending: "Queued",
        badgeError: "Scan error",
        showingPagination: "Showing:",
        pageOf: "Page",
        firstPageTitle: "First page",
        prevPageTitle: "Previous page",
        nextPageTitle: "Next page",
        lastPageTitle: "Last page",
      },
      batchUploadModal: {
        uploadTitle: "Upload Bulk Retinal Image Batch",
        selectClinic: "Select clinic facility",
        selectEye: "Assign eye laterality",
        dropzone: "Drag and drop folder or select multiple images (PNG, JPG, DICOM)",
        filesSelected: "Selected scan files",
        uploading: "Uploading batch scans to server...",
        assignDoctor: "Assign specialist for batch sign-off",
        submitBatch: "Start batch processing",
        standardBadge: "Clinical Standard",
        description: "Intake campaign images, HIPAA de-identification, and queue for AI processing.",
        campaignNameLabel: "Screening campaign name",
        campaignNamePlaceholder: "Enter campaign name...",
        facilityLabel: "Operating clinic / facility",
        satelliteOption: "Satellite / Mobile screening site",
        dropzoneHint: "Supports DICOM (.dcm), TIFF, PNG, JPG from fundus cameras.",
        selectFilesButton: "Select multiple files",
        selectFolderButton: "Select folder",
        quickDemoTitle: "Quick Test (Sample Data)",
        quickDemoDesc: "Quickly generate 100 sample cases to test AI pipeline and queue.",
        loadDemoButton: "Load 100 demo scans",
        demoStandardBadge: "Sample test data (≥ 100 scans)",
        preflightTitle: "Pre-flight verification grid:",
        scansLoaded: "scans loaded",
        standardPassed: "Meets standard (≥ 100 scans)",
        standardRequired: "Requires ≥ 100 scans",
        quickAssignLabel: "Quick assign:",
        allOdButton: "All right eye (OD)",
        allOsButton: "All left eye (OS)",
        alternateEyesButton: "Alternate eyes (OD/OS)",
        fillSampleVitalsButton: "Fill sample vitals",
        fillVitalsTooltip: "Automatically populate sample blood pressure and HbA1c for unscored scans",
        filterAllEyes: "All eyes (OD/OS)",
        filterOd: "Right eye only (OD)",
        filterOs: "Left eye only (OS)",
        clearAllButton: "Clear all",
        emptyStaged: "No scans loaded yet. Drag and drop image files or click 'Load 100 demo scans'.",
        colNum: "#",
        colPreview: "Preview",
        colFileName: "File name",
        colMrnPatient: "MRN & Patient",
        colEyePosition: "Eye position",
        colVitals: "Vitals (BP / HbA1c)",
        colActions: "Actions",
        moreScansCount: "more scans in pre-flight grid.",
        estimatedConsumption: "Estimated consumption:",
        availableBalance: "Available balance:",
        cancelButton: "Cancel",
        deidentifyingQueuing: "De-identifying & queuing...",
        startBatchButton: "Start batch analysis",
        defaultCampaignName: "Stroke & Retinal Vascular Screening Campaign",
      },
      batchDetailModal: {
        itemDetails: "Batch item screening details",
        eye: "Eye laterality",
        scanType: "Scan modality",
        biomarkers: "Quantitative microvascular metrics",
        rawFundus: "True color fundus scan",
        heatmap: "Grad-CAM heatmap attention",
        doctorSignoffStatus: "Doctor sign-off status",
        deidHipaa: "HIPAA de-identification:",
        fileLabel: "File:",
        overallVascularRisk: "Overall vascular risk",
        modelName: "AURA Multimodal Vision CDS Model",
        cardiovascularRisk: "Cardiovascular risk",
        score2Ai: "SCORE2-AI Model",
        arteriolarNarrowing: "Microvascular luminal narrowing",
        drRisk: "Diabetic retinopathy (DR)",
        icdrGrade: "ICDR Classification",
        microaneurysms: "Microaneurysms & blot hemorrhages",
        threeYearStroke: "3-Year stroke risk",
        strokeProjection: "Stroke risk projection",
        gunnSign: "Transmural pressure & Gunn sign",
        heatmapOpacityLabel: "AI heatmap opacity:",
        zoomOutTitle: "Zoom out",
        zoomInTitle: "Zoom in",
        resetZoomTitle: "Reset zoom",
        lesionBoxesRoi: "Lesion regions",
        anatomyMarkers: "Anatomy markers",
        sideBySideView: "Side by side",
        directOverlayView: "Direct overlay",
        downloadPng: "Download PNG",
        nativeFundusTitle: "Original fundus photo",
        nativeResolution: "512 × 512 pixels",
        opticDiscLabel: "Optic disc",
        maculaLabel: "Macula",
        formatLabel: "Format:",
        heatmapLesionTitle: "Grad-CAM heatmap & lesion regions",
        heatmapAvailable: "Grad-CAM heatmap ready",
        noHeatmap: "No heatmap available",
        noHeatmapWarning: "No Grad-CAM heatmap available",
        hudHoverHint: "Hover to inspect coordinates & vascular zones",
        directOverlayTitle: "AI Direct Heatmap Overlay on Retinal Scan",
        directOverlaySubtitle: "Adjust opacity slider above to cross-reference raw fundus and heatmap",
        detectedAnomaliesTitle: "AI-detected lesion anomalies:",
        detectedAnomaliesHint: "Hover or click card to highlight position on retina",
        noFocalLesions: "No focal lesions detected",
        noLesionsDesc: "No microaneurysms or focal hemorrhages detected on this image.",
        biomarkersTitle: "Quantitative retinal biomarkers",
        avrLabel: "Arteriovenous ratio (AVR)",
        avrNormal: "Normal reference: ~0.67",
        tortuosityLabel: "Vascular tortuosity index",
        tortuosityDesc: "Microvascular remodeling marker",
        vesselDensityLabel: "Vessel density",
        vesselDensityDesc: "Capillary network density",
        cdrLabel: "Cup-to-disc ratio (CDR)",
        cdrNormal: "Within normal limits",
        rationalesTitle: "Explainable AI (XAI) clinical rationales",
        processingDuration: "AI processing time:",
        closeButton: "Close",
        zoneDisc: "Optic disc region",
        zoneMacula: "Macular region",
        zoneSuperiorArcade: "Superior temporal arcade",
        zoneInferiorArcade: "Inferior temporal arcade",
        zonePosteriorPole: "Posterior pole retina",
        defaultRationale1: "Retinal arcade vascular distribution is regular without focal narrowing or occlusion.",
        defaultRationale2: "No arteriovenous nicking or vascular wall sclerosis observed.",
        defaultRationale3: "Retinal capillary perfusion network remains stable.",
        defaultRationaleMod1: "Mild arteriolar narrowing or localized microcirculatory alteration.",
        defaultRationaleMod2: "Vascular tortuosity warrants routine periodic monitoring.",
        defaultRationaleHigh1: "Reduced arteriovenous ratio (localized retinal arteriolar narrowing).",
        defaultRationaleHigh2: "Venous compression at arteriovenous crossing points (Gunn sign).",
        defaultRationaleHigh3: "Elevated vascular tortuosity reflecting chronic microcirculatory shear stress.",
      },
      campaignAnalytics: {
        campaignTitle: "Community Screening Campaign Analytics",
        totalScreened: "Total individuals screened",
        highRiskIdentified: "High-risk cases identified",
        coverageRate: "Target coverage rate",
        demographicChart: "Demographic distribution chart",
        pageSubtitle: "Aggregated metrics across clinic facilities and microvascular screening campaigns.",
        loadingMessage: "Loading clinical campaign analytics data...",
        errorTitle: "Campaign data loading error",
        errorMessage: "Unable to connect to campaign reporting server.",
        emptyTitle: "No campaign data available",
        emptyDescription: "The clinic has not initiated any screening campaigns or no aggregated data is available.",
        reloadButton: "Reload data",
        exportCsvButton: "Export data (CSV)",
        totalCampaignsCard: "Total campaigns",
        totalCampaignsSub: "Community screening campaigns initiated",
        totalImagesCard: "Total scans analyzed",
        totalImagesSub: "Retinal fundus images evaluated by AI",
        highRiskCard: "High-risk patients",
        highRiskSub: "Cases requiring clinical follow-up or specialist referral",
      },
      creditPackage: {
        title: "Clinic Screening Quota & Capacity Analytics",
        subtitle: "Track available AI analysis credits, active batch quota, and service agreement status.",
        loading: "Loading clinic screening credits and service packages...",
        quotaDepletedTitle: "Facility screening quota depleted",
        quotaLowTitle: "Screening quota running critically low",
        quotaWarningDesc: "Bulk screening operations may pause if uploaded image volume exceeds remaining balance. Please renew or purchase additional credits.",
        topUpNow: "Top up credits now",
        refreshing: "Updating...",
        refresh: "Refresh",
        renewBuyButton: "Renew / Buy package",
        availableCredits: "Available screening credits",
        scansUnit: "credits",
        statusAbundant: "Abundant quota",
        statusLow: "Low balance",
        statusDepleted: "Quota depleted",
        scannedInBatch: "Scanned in current batch",
        totalCampaignScanned: "Total across campaign:",
        activePackage: "Active service package",
        noActivePackage: "No active package",
        statusActive: "Active",
        statusUnregistered: "Not enrolled",
        validityPeriod: "Validity period",
        indefinite: "Indefinite",
        autoRenewNotice: "Auto-renews upon package purchase",
        currentPlanNotice: "Applies to current active plan",
        consumptionProgress: "Screening quota consumption progress",
        processedCount: "Processed:",
        availableCount: "Available:",
        processedInBatchLegend: "Processed in batch",
        availableCreditsLegend: "Available screening credits",
        packagesSectionTitle: "Clinic Enterprise Service Packages",
        packagesSectionSubtitle: "Dedicated screening capacity designed for community campaigns and eye hospitals from 500 to 5,000 AI evaluations.",
        vatSupportBadge: "VAT Invoice & Medical Certificate Supported",
        recommendedRibbon: "Recommended for campaigns",
        currentPlanBadge: "Current plan",
        currencyVnd: "VND",
        plusScans: "AI evaluations",
        validityDays: "Validity:",
        featuresIncluded: "Included features:",
        renewThisPackage: "Renew this package",
        buyPackageNow: "Purchase package",
        historySectionTitle: "Clinic Transaction History & Receipts",
        historySectionSubtitle: "Complete ledger of quota top-ups, contract settlements, and electronic receipts.",
        reloadHistory: "Reload history",
        colTxnId: "Transaction ID",
        colPackage: "Service package",
        colAmount: "Amount (VND)",
        colScans: "Scans count",
        colPaidDate: "Payment date",
        colMethod: "Method",
        colStatus: "Status",
        colReceipt: "Receipt",
        emptyHistory: "No transaction history recorded yet.",
        emptyHistorySub: "When your facility purchases or renews screening capacity, invoices will appear here.",
        providerVietqr: "VietQR Napas 24/7",
        providerMomo: "MoMo Wallet",
        providerBank: "VietQR Bank Transfer",
        providerVnpay: "VNPay QR",
        statusSuccess: "Success",
        statusPending: "Pending",
        statusFailed: "Failed",
        viewReceipt: "View receipt",
        receiptTitle: "Clinic Electronic Receipt",
        providerLabel: "Service Provider:",
        providerSystemName: "AURA CDS & AI SCREENING HEALTH SYSTEM",
        providerSystemDesc: "Retinal microvascular & cardiovascular risk screening platform",
        invoiceIdLabel: "Invoice ID:",
        servicePackageLabel: "Service package:",
        recordedTimeLabel: "Recorded time:",
        paymentGatewayLabel: "Payment gateway:",
        settlementStatusLabel: "Settlement status:",
        settledValid: "Settled successfully",
        totalPaidLabel: "Total paid:",
        receiptDisclaimer: "Electronic voucher compliant with medical administrative standards for screening campaign cost accounting.",
        closeReceipt: "Close",
        printReceipt: "Print receipt",
        complianceTitle: "Clinic Screening Quota Regulations",
        complianceText: "Allocated screening credits are strictly reserved for initial screening and clinical decision support at authorized medical facilities. AI analysis results do not replace definitive diagnosis by an ophthalmologist or cardiologist. Unused credits rollover automatically upon renewal prior to current plan expiration.",
        pkgStarterName: "Clinic Starter Package",
        pkgStarterDesc: "Designed for general and ophthalmology clinics launching initial community screening programs.",
        pkgCampaignName: "Clinic Campaign Package",
        pkgCampaignDesc: "Optimal choice for public health campaigns and large enterprise employee screening.",
        pkgHospitalName: "Hospital Enterprise Package",
        pkgHospitalDesc: "Comprehensive solution for specialized eye hospitals, diagnostic centers, and healthcare networks.",
        pkgStarterFeatures: [
          "500 AI retinal microvascular evaluations",
          "4 clinical risk tier classifications (Low, Moderate, High, Critical)",
          "Grad-CAM heatmap attention & arteriovenous ratio quantification",
          "Standard PDF summary report compliant with health authority guidelines",
          "Up to 2 doctor seats for clinical review",
          "Standard business hours email support",
        ],
        pkgCampaignFeatures: [
          "2,000 high-throughput retinal scan evaluations",
          "Automated bulk batch processing for ZIP & DICOM folders",
          "Epidemiological reporting & campaign-wide risk stratification",
          "Automated patient assignment to specialist physicians",
          "In-depth clinical data export in CSV/Excel formats",
          "Unlimited affiliated physician accounts",
          "10% cost savings compared to starter tier",
        ],
        pkgHospitalFeatures: [
          "5,000 retinal scan evaluations with highest bandwidth priority",
          "Dedicated API integration for PACS / HIS / EMR hospital systems",
          "Real-time epidemiological surveillance & trend analytics",
          "Digital signing of clinical conclusions with high-assurance certificates",
          "24/7 dedicated technical support & clinical staff onboarding",
          "Custom branded medical reporting templates",
          "20% cost savings on microvascular evaluations",
        ],
      },
    },
    admin: {
      dashboardTitle: "System Administration",
      dashboardSubtitle: "Manage accounts, RBAC matrix, service packages, and HIPAA audit logs.",
      tabs: {
        users: "Accounts",
        rbac: "RBAC Matrix",
        notifications: "Notifications",
        clinics: "Clinic Approvals",
        packages: "Service Packages",
        aiConfig: "AI Config",
        audit: "HIPAA Logs",
      },
      audit: {
        title: "HIPAA Audit Trail",
        subtitle: "Audit log of medical record access and data export activities.",
        searchByUserIp: "Search by user, action, resource, or IP address...",
        severityFilter: "Filter by severity level",
        actionFilter: "Filter by action type",
        resetFilter: "Reset",
        exportBtn: "Export Logs",
        emptyMessage: "No matching audit logs found.",
        severityAll: "Severity (All)",
        severityInfo: "Info",
        severityWarning: "Warning",
        severityCritical: "Critical",
        columns: {
          timestamp: "Timestamp",
          user: "User",
          role: "Role",
          action: "Action",
          resource: "Target Resource",
          ip: "IP Address",
          severity: "Severity",
          actionResource: "Action & Resource",
          status: "Status",
        },
        exportAuditTrail: "Export audit trail CSV",
        statusSuccess: "Success",
        statusFailed: "Failed",
      },
      userManagement: {
        title: "Account Management",
        subtitle: "Manage status, profile details and system permissions.",
        userList: "System user directory",
        changeRole: "Change user role",
        activateDeactivate: "Activate / Deactivate account",
        resetPassword: "Reset account password",
        saveChanges: "Save user modifications",
        searchPlaceholder: "Search by name or email...",
        filterRole: "Filter by role",
        allRoles: "All Roles",
        filterBtn: "Filter",
        emptyUsers: "No user accounts found.",
        editUser: "Edit",
        changeRoleBtn: "Change Role",
        lockAccount: "Suspend",
        unlockAccount: "Activate",
        activeStatus: "ACTIVE",
        suspendedStatus: "SUSPENDED",
        notUpdated: "Not updated",
        activatedSuccess: "Account activated successfully.",
        suspendedSuccess: "Account suspended successfully.",
        updatedSuccess: "Account details updated successfully.",
        roleUpdatedSuccess: "User role changed successfully.",
        editModalTitle: "Edit Account Profile",
        emailLabel: "Login Email",
        fullNameLabel: "Full Name",
        phoneLabel: "Phone Number",
        addressLabel: "Address / Facility",
        roleModalTitle: "Assign User Role",
        roleModalDesc: "Select new system role for account:",
        confirmRoleBtn: "Confirm Change",
      },
      rbac: {
        rolePermissionMatrix: "Role-Based Access Control (RBAC)",
        subtitle: "Configure access permissions for each user role.",
        viewPermissions: "View permission matrix",
        editPermissions: "Edit role permissions",
        savePolicy: "Save access policy",
        saveMatrix: "Save Permission Matrix",
        savedSuccess: "RBAC permission matrix saved successfully.",
        activePermissions: "Active permissions",
        permissionCatalogTitle: "Permission Catalog for Role:",
      },
      aiConfig: {
        title: "AI Configuration",
        subtitle: "Adjust sensitivity and clinical alert thresholds for AI models.",
        modelSelection: "Vision foundation model",
        temperature: "Sampling temperature",
        sensitivityThreshold: "Microvascular sensitivity threshold",
        endpointUrl: "AI inference endpoint URL",
        testConnection: "Test AI connection",
        saveParameters: "Save AI Parameters",
        glaucomaSensitivity: "Glaucoma / CVD Screening Sensitivity",
        glaucomaHint: "Optimizes early detection of arteriolar narrowing.",
        drConfidence: "Diabetic Retinopathy Confidence Threshold",
        drHint: "Requires minimum AI confidence before outputting classification.",
        retrainThreshold: "A/V Ratio Constriction Alert Threshold",
        retrainHint: "Triggers hypertensive alert when A/V Ratio is below threshold.",
      },
      templates: {
        notificationTemplates: "Notification Templates",
        subtitle: "Configure message templates for Email, SMS and In-App channels.",
        channel: {
          email: "Email",
          inApp: "In-App Notification",
          sms: "SMS Message",
        },
        title: "Notification subject",
        content: "Template content",
        createTemplate: "Create new template",
        edit: "Edit template",
        delete: "Delete template",
        addTemplate: "Add New Template",
        subjectPrefix: "Subject:",
        statusPrefix: "Status:",
        activeStatus: "Active",
        inactiveStatus: "Disabled",
        policiesTitle: "Notification Policies",
        policiesSubtitle: "Configure channel triggers and emergency rules.",
        savePolicies: "Save Policies",
        activeChannelsTitle: "Active Communication Channels",
        emergencyRulesTitle: "Emergency Rules & Quiet Hours",
        inAppChannelLabel: "In-App Channel",
        emailChannelLabel: "Medical Email Channel",
        smsChannelLabel: "Emergency SMS Channel",
        criticalAlertLabel: "Emergency Alert for Critical Risk",
        criticalAlertDesc: "Immediate delivery regardless of quiet hours",
        quietStartLabel: "Quiet hours start",
        quietEndLabel: "Quiet hours end",
        retentionLabel: "Retention Period (days)",
        modalCreateTitle: "Create New Notification Template",
        modalEditTitle: "Edit Notification Template",
        codeLabel: "Template Code",
        nameLabel: "Template Name",
        channelLabel: "Notification Channel",
        subjectLabel: "Message Subject",
        bodyLabel: "Message Body",
        descriptionLabel: "Description / Purpose",
        enableCheckbox: "Enable this template",
        saveTemplateBtn: "Save Template",
        savedNotice: "Notification template saved successfully.",
        policySavedNotice: "Notification policies updated successfully.",
      },
      packages: {
        servicePackageList: "Service Packages & Pricing",
        subtitle: "Configure screening packages, quotas, and validity periods.",
        packageName: "Package name",
        price: "Unit price",
        quota: "Screening credits",
        validity: "Validity period",
        activeToggle: "Active status",
        createPackage: "Create new service package",
        refreshTooltip: "Refresh package list",
        totalPackages: "Total Packages",
        activePackages: "Active Packages",
        userPackages: "Individual Packages",
        clinicPackages: "Clinic Packages",
        searchPlaceholder: "Search packages by name, code...",
        scopeAll: "All Audiences",
        scopeUser: "Individual",
        scopeClinic: "Clinic",
        days: "days",
        lifetime: "Lifetime",
        active: "Active",
        inactive: "Inactive",
        creditsUnit: "credits",
        createModalTitle: "Create New Package",
        editModalTitle: "Edit Service Package",
        createModalSubtitle: "Define screening package quotas and pricing tier",
        codeLabel: "Package Code",
        nameLabel: "Package Name",
        descLabel: "Description",
        scopeLabel: "Target Audience",
        creditsLabel: "Screening Credits",
        priceLabel: "Price in VND",
        validityLabel: "Validity in Days, 0 = Lifetime",
        featuresLabel: "Included Clinical Features, one per line",
        activeImmediateLabel: "Activate immediately",
        saveBtn: "Save Changes",
        createBtn: "Create Package",
        deactivateBtn: "Deactivate",
        activateBtn: "Activate",
        loadingList: "Loading service package list...",
        emptyFiltered: "No service packages match the filter criteria.",
        packageSavedNotice: "Service package updated successfully.",
        packageCreatedNotice: "New service package created successfully.",
        statusToggledNotice: "Service package active status updated.",
      },
      clinics: {
        title: "Clinic Approvals",
        subtitle: "Review medical operating licenses and approve bulk screening permissions.",
        loading: "Loading clinic profiles...",
        empty: "No clinic profiles awaiting approval.",
        licenseLabel: "License No:",
        notProvided: "Not provided",
        approve: "Approve",
        reject: "Reject",
        approvedSuccess: "Clinic profile approved successfully.",
        rejectedSuccess: "Clinic profile rejected successfully.",
      },
    },
    footer: {
      copyright: "© 2026 AURA Retinal Clinical Decision Support System. All rights reserved.",
      version: "Version 1.0.0 (Clinical Build)",
      termsOfService: "Terms of Service",
      privacyPolicy: "Medical Data Privacy Policy",
      medicalSafetyStatement:
        "AI-generated screening results are intended for clinical decision support only and do not replace professional diagnosis by an ophthalmologist or cardiologist.",
      supportCenter: "Support Center",
      securityCert: "HIPAA & ISO 13485 / ISO 27001 Certified",
    },
  },
};
