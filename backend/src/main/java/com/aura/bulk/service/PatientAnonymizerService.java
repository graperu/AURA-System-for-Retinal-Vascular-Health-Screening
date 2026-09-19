package com.aura.bulk.service;

import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.common.exception.ClinicalProcessingException;
import com.aura.dicom.DicomIngestionService;
import com.aura.dicom.DicomMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * HIPAA NFR-9/NFR-10 compliant patient data anonymizer for Java Spring Boot.
 * Generates SHA-256 HMAC pseudonyms for patient identifiers and strips DICOM PHI tags.
 */
@Service
public class PatientAnonymizerService {

    private static final Logger log = LoggerFactory.getLogger(PatientAnonymizerService.class);

    private final byte[] hmacSecretKeyBytes;
    private final DicomIngestionService dicomIngestionService;

    @Autowired
    public PatientAnonymizerService(
            @Value("${aura.anonymization.hmac-secret:AURA_HIPAA_NFR_JAVA_HMAC_SECRET_2026}") String hmacSecret,
            @Autowired(required = false) DicomIngestionService dicomIngestionService) {
        this.hmacSecretKeyBytes = hmacSecret.getBytes(StandardCharsets.UTF_8);
        this.dicomIngestionService = dicomIngestionService != null ? dicomIngestionService : new DicomIngestionService();
    }

    public PatientAnonymizerService(String hmacSecret) {
        this(hmacSecret, new DicomIngestionService());
    }

    /**
     * De-identifies raw patient data into a PatientAnonymizedDto with SHA-256 HMAC pseudonyms.
     */
    public PatientAnonymizedDto anonymizePatient(
            String rawMrn,
            String rawPatientName,
            int age,
            String gender,
            int systolicBp,
            int diastolicBp,
            double hba1c) {
        
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(hmacSecretKeyBytes, "HmacSHA256");
            mac.init(secretKeySpec);

            String inputString = rawMrn.trim() + ":" + rawPatientName.trim();
            byte[] hashBytes = mac.doFinal(inputString.getBytes(StandardCharsets.UTF_8));
            String hexHash = HexFormat.of().formatHex(hashBytes).toUpperCase();

            String pseudonymId = "ANO-PAT-" + hexHash.substring(0, 8);
            String deidentifiedMrn = "MRN-DEID-" + hexHash.substring(8, 16);

            boolean hasDiabetes = hba1c >= 6.5;
            boolean hasHypertension = systolicBp >= 140 || diastolicBp >= 90;

            return new PatientAnonymizedDto(
                    pseudonymId,
                    deidentifiedMrn,
                    age,
                    gender,
                    systolicBp,
                    diastolicBp,
                    hba1c,
                    hasDiabetes,
                    hasHypertension,
                    Instant.now()
            );
        } catch (Exception e) {
            throw new RuntimeException("HIPAA SHA-256 HMAC Pseudonymization failed", e);
        }
    }

    /**
     * Strips DICOM metadata headers (ISO 15224 standard) and de-identifies PHI tags
     * from Base64 encoded image payloads (NFR-19).
     * If the payload is a binary DICOM file, de-identifies patient tags and extracts
     * clean pixel stream. If the payload is already standard JPEG/PNG, returns it as-is.
     */
    public String stripDicomMetadataHeaders(String base64ImagePayload) {
        if (base64ImagePayload == null || base64ImagePayload.isBlank()) {
            return "";
        }
        try {
            byte[] rawBytes = dicomIngestionService.decodeBase64Payload(base64ImagePayload);
            if (!dicomIngestionService.isDicom(rawBytes)) {
                // Non-DICOM payload (standard JPEG/PNG) - preserve as-is
                return base64ImagePayload;
            }

            // Real binary DICOM detected: extract metadata tags
            DicomMetadata metadata = dicomIngestionService.extractMetadata(rawBytes);
            String rawMrn = (metadata.patientId() != null && !metadata.patientId().isBlank())
                ? metadata.patientId() : "MRN-DICOM-UNKNOWN";
            String rawName = (metadata.patientName() != null && !metadata.patientName().isBlank())
                ? metadata.patientName() : "ANONYMOUS";

            PatientAnonymizedDto anonymized = anonymizePatient(rawMrn, rawName, 50, "UNKNOWN", 120, 80, 5.5);
            byte[] deidentifiedDicomBytes = dicomIngestionService.deidentifyDicom(
                rawBytes, anonymized.pseudonymId(), anonymized.deidentifiedMrn());

            // Convert / extract pixel data safely as standard PNG
            try {
                byte[] pngBytes = dicomIngestionService.extractPixelDataAsPng(deidentifiedDicomBytes);
                if (pngBytes != null && pngBytes.length > 0) {
                    return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);
                }
            } catch (ClinicalProcessingException cpe) {
                log.info("Pixel data cannot be converted to PNG directly ({}); preserving deidentified DICOM container", cpe.getMessage());
            }

            return "data:application/dicom;base64," + Base64.getEncoder().encodeToString(deidentifiedDicomBytes);
        } catch (ClinicalProcessingException cpe) {
            throw cpe;
        } catch (Exception ex) {
            log.error("Failed to strip DICOM metadata: {}", ex.getMessage(), ex);
            throw new ClinicalProcessingException("Lỗi xử lý ẩn danh tệp DICOM: " + ex.getMessage(), ex);
        }
    }
}
