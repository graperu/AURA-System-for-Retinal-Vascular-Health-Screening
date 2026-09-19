package com.aura.dicom;

import com.aura.common.exception.ClinicalProcessingException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service handling binary DICOM detection, clinical metadata extraction,
 * de-identification, and pixel data stream extraction for Fundus Cameras (NFR-19).
 */
@Service
public class DicomIngestionService {

  private static final Logger log = LoggerFactory.getLogger(DicomIngestionService.class);

  // DICOM Prefix "DICM" at offset 128
  private static final byte[] DICOM_MAGIC = new byte[] {(byte) 'D', (byte) 'I', (byte) 'C', (byte) 'M'};

  /**
   * Checks whether the provided binary data conforms to the DICOM standard (PS 3.10 preamble).
   */
  public boolean isDicom(byte[] data) {
    if (data == null || data.length < 132) {
      return false;
    }
    return data[128] == DICOM_MAGIC[0]
        && data[129] == DICOM_MAGIC[1]
        && data[130] == DICOM_MAGIC[2]
        && data[131] == DICOM_MAGIC[3];
  }

  /**
   * Decodes Base64 data (handling optional data URL prefix) and detects DICOM preamble.
   */
  public boolean isDicomBase64(String payload) {
    if (payload == null || payload.isBlank()) {
      return false;
    }
    try {
      byte[] decoded = decodeBase64Payload(payload);
      return isDicom(decoded);
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * Extracts clinical metadata tags from a binary DICOM file.
   * Tags:
   *  - Patient Name (0010,0010)
   *  - Patient ID / MRN (0010,0020)
   *  - Modality (0008,0060)
   *  - Eye Laterality (0020,0060 or 0020,0062)
   *  - Study Date (0008,0020)
   *  - Dimensions: Rows (0028,0010), Columns (0028,0011)
   */
  public DicomMetadata extractMetadata(byte[] data) {
    if (!isDicom(data)) {
      return DicomMetadata.nonDicom();
    }

    String patientName = null;
    String patientId = null;
    String modality = "OP";
    String laterality = null;
    String studyDate = null;
    Integer rows = null;
    Integer cols = null;

    int offset = 132;
    int len = data.length;

    while (offset + 8 <= len) {
      int group = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
      int elem = (data[offset + 2] & 0xFF) | ((data[offset + 3] & 0xFF) << 8);
      offset += 4;

      // Stop parsing once we hit Pixel Data (7FE0,0010)
      if (group == 0x7FE0 && elem == 0x0010) {
        break;
      }

      int valLength = 0;
      boolean isExplicit = isAsciiUpper(data[offset]) && isAsciiUpper(data[offset + 1]);

      if (isExplicit) {
        String vr = new String(data, offset, 2, StandardCharsets.US_ASCII);
        offset += 2;

        if (vr.equals("OB") || vr.equals("OW") || vr.equals("OF") || vr.equals("SQ") || vr.equals("UT") || vr.equals("UN")) {
          if (offset + 6 > len) break;
          offset += 2; // skip 2 reserved bytes
          valLength = (data[offset] & 0xFF)
              | ((data[offset + 1] & 0xFF) << 8)
              | ((data[offset + 2] & 0xFF) << 16)
              | ((data[offset + 3] & 0xFF) << 24);
          offset += 4;
        } else {
          if (offset + 2 > len) break;
          valLength = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
          offset += 2;
        }
      } else {
        // Implicit VR
        if (offset + 4 > len) break;
        valLength = (data[offset] & 0xFF)
            | ((data[offset + 1] & 0xFF) << 8)
            | ((data[offset + 2] & 0xFF) << 16)
            | ((data[offset + 3] & 0xFF) << 24);
        offset += 4;
      }

      // Support Undefined Length Sequence (0xFFFFFFFF / -1) (MED-02)
      if (valLength == -1) {
        int seqEnd = findSequenceEnd(data, offset);
        if (seqEnd > offset && seqEnd <= len) {
          offset = seqEnd;
          continue;
        } else {
          log.warn("Malformed Undefined Length Sequence at offset {}; aborting metadata extraction", offset);
          break;
        }
      }

      if (valLength < 0 || offset + valLength > len) {
        break;
      }

      // Check for target tags
      if (group == 0x0010 && elem == 0x0010) {
        patientName = new String(data, offset, valLength, StandardCharsets.UTF_8).trim();
      } else if (group == 0x0010 && elem == 0x0020) {
        patientId = new String(data, offset, valLength, StandardCharsets.UTF_8).trim();
      } else if (group == 0x0008 && elem == 0x0060) {
        modality = new String(data, offset, valLength, StandardCharsets.US_ASCII).trim();
      } else if ((group == 0x0020 && elem == 0x0060) || (group == 0x0020 && elem == 0x0062)) {
        String latStr = new String(data, offset, valLength, StandardCharsets.US_ASCII).trim().toUpperCase();
        if (latStr.contains("R") || latStr.contains("OD")) {
          laterality = "OD";
        } else if (latStr.contains("L") || latStr.contains("OS")) {
          laterality = "OS";
        } else {
          laterality = latStr;
        }
      } else if (group == 0x0008 && elem == 0x0020) {
        studyDate = new String(data, offset, valLength, StandardCharsets.US_ASCII).trim();
      } else if (group == 0x0028 && elem == 0x0010 && valLength >= 2) {
        rows = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
      } else if (group == 0x0028 && elem == 0x0011 && valLength >= 2) {
        cols = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
      }

      offset += valLength;
    }

    return new DicomMetadata(
        patientName,
        patientId,
        modality,
        laterality,
        studyDate,
        rows,
        cols,
        true
    );
  }

  /**
   * De-identifies DICOM header tags (0010,0010 PatientName) and (0010,0020 PatientID/MRN)
   * in the binary stream, replacing PHI with pseudonymized identifiers.
   */
  public byte[] deidentifyDicom(byte[] data, String pseudonymName, String deidentifiedMrn) {
    if (!isDicom(data)) {
      return data;
    }

    try {
      ByteArrayOutputStream out = new ByteArrayOutputStream(data.length);
      // Write 128 preamble bytes + 4 magic bytes "DICM"
      out.write(data, 0, 132);

      int offset = 132;
      int len = data.length;

      while (offset + 4 <= len) {
        int tagStart = offset;
        int group = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
        int elem = (data[offset + 2] & 0xFF) | ((data[offset + 3] & 0xFF) << 8);
        offset += 4;

        // If Pixel Data (7FE0,0010), write rest of stream verbatim and stop
        if (group == 0x7FE0 && elem == 0x0010) {
          out.write(data, tagStart, len - tagStart);
          break;
        }

        if (offset >= len) {
          out.write(data, tagStart, len - tagStart);
          break;
        }

        boolean isExplicit = (offset + 2 <= len) && isAsciiUpper(data[offset]) && isAsciiUpper(data[offset + 1]);
        int valLength = 0;
        int valOffset = 0;
        boolean is32BitExplicit = false;
        String vr = null;

        if (isExplicit) {
          vr = new String(data, offset, 2, StandardCharsets.US_ASCII);
          offset += 2;
          if (vr.equals("OB") || vr.equals("OW") || vr.equals("OF") || vr.equals("SQ") || vr.equals("UT") || vr.equals("UN")) {
            is32BitExplicit = true;
            if (offset + 6 > len) {
              out.write(data, tagStart, len - tagStart);
              break;
            }
            offset += 2; // skip 2 reserved bytes
            valLength = (data[offset] & 0xFF)
                | ((data[offset + 1] & 0xFF) << 8)
                | ((data[offset + 2] & 0xFF) << 16)
                | ((data[offset + 3] & 0xFF) << 24);
            offset += 4;
            valOffset = offset;
          } else {
            if (offset + 2 > len) {
              out.write(data, tagStart, len - tagStart);
              break;
            }
            valLength = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
            offset += 2;
            valOffset = offset;
          }
        } else {
          if (offset + 4 > len) {
            out.write(data, tagStart, len - tagStart);
            break;
          }
          valLength = (data[offset] & 0xFF)
              | ((data[offset + 1] & 0xFF) << 8)
              | ((data[offset + 2] & 0xFF) << 16)
              | ((data[offset + 3] & 0xFF) << 24);
          offset += 4;
          valOffset = offset;
        }

        // Support Undefined Length Sequence (0xFFFFFFFF / -1) without aborting loop (MED-02)
        if (valLength == -1) {
          int seqEnd = findSequenceEnd(data, valOffset);
          if (seqEnd > valOffset && seqEnd <= len) {
            // Write sequence elements verbatim and continue parsing subsequent PHI tags
            out.write(data, tagStart, seqEnd - tagStart);
            offset = seqEnd;
            continue;
          } else {
            log.warn("Malformed Undefined Length Sequence at offset {}; falling back to verbatim tail write", valOffset);
            out.write(data, tagStart, len - tagStart);
            break;
          }
        }

        if (valLength < 0 || valOffset + valLength > len) {
          out.write(data, tagStart, len - tagStart);
          break;
        }

        if (group == 0x0010 && elem == 0x0010 && pseudonymName != null) {
          writeReplacedElement(out, group, elem, isExplicit, vr, is32BitExplicit, pseudonymName);
        } else if (group == 0x0010 && elem == 0x0020 && deidentifiedMrn != null) {
          writeReplacedElement(out, group, elem, isExplicit, vr, is32BitExplicit, deidentifiedMrn);
        } else {
          out.write(data, tagStart, (valOffset + valLength) - tagStart);
        }

        offset = valOffset + valLength;
      }

      return out.toByteArray();
    } catch (Exception e) {
      log.warn("Failed to de-identify DICOM binary tags, falling back to original: {}", e.getMessage());
      return data;
    }
  }

  private void writeReplacedElement(ByteArrayOutputStream out, int group, int elem, boolean isExplicit, String vr, boolean is32BitExplicit, String value) throws IOException {
    out.write(group & 0xFF);
    out.write((group >> 8) & 0xFF);
    out.write(elem & 0xFF);
    out.write((elem >> 8) & 0xFF);

    byte[] valBytes = value.getBytes(StandardCharsets.UTF_8);
    // DICOM elements should have even length; pad with space if odd
    if (valBytes.length % 2 != 0) {
      byte[] padded = new byte[valBytes.length + 1];
      System.arraycopy(valBytes, 0, padded, 0, valBytes.length);
      padded[valBytes.length] = (byte) ' ';
      valBytes = padded;
    }

    if (isExplicit) {
      out.write((vr != null ? vr : "LO").getBytes(StandardCharsets.US_ASCII));
      if (is32BitExplicit) {
        out.write(0);
        out.write(0);
        out.write(valBytes.length & 0xFF);
        out.write((valBytes.length >> 8) & 0xFF);
        out.write((valBytes.length >> 16) & 0xFF);
        out.write((valBytes.length >> 24) & 0xFF);
      } else {
        out.write(valBytes.length & 0xFF);
        out.write((valBytes.length >> 8) & 0xFF);
      }
    } else {
      out.write(valBytes.length & 0xFF);
      out.write((valBytes.length >> 8) & 0xFF);
      out.write((valBytes.length >> 16) & 0xFF);
      out.write((valBytes.length >> 24) & 0xFF);
    }
    out.write(valBytes);
  }

  /**
   * Safely extracts the pixel stream from DICOM binary data and converts it into standard PNG bytes.
   * If an encapsulated JPEG/PNG stream is detected in PixelData (0xFF,0xD8), extracts it directly.
   * Otherwise synthesizes a high-contrast fundus visualization.
   */
  public byte[] extractPixelDataAsPng(byte[] data) {
    if (data == null) {
      return new byte[0];
    }

    // 1. Scan for encapsulated JPEG SOI marker (0xFF, 0xD8, 0xFF)
    int jpegOffset = findJpegMarker(data);
    if (jpegOffset >= 0) {
      try {
        byte[] jpegBytes = Arrays.copyOfRange(data, jpegOffset, data.length);
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(jpegBytes));
        if (img != null) {
          ByteArrayOutputStream baos = new ByteArrayOutputStream();
          ImageIO.write(img, "png", baos);
          return baos.toByteArray();
        }
      } catch (Exception ex) {
        log.warn("Could not decode encapsulated JPEG stream from DICOM: {}", ex.getMessage());
      }
    }

    // 2. Completely eliminate synthetic cartoon eye fallback (MED-01)
    // Generating synthetic visual representations of patient fundus anatomy is a Class I medical safety hazard.
    throw new ClinicalProcessingException(
        "Không thể trích xuất luồng ảnh pixel hợp lệ từ tệp DICOM (Transfer Syntax không được hỗ trợ hoặc dữ liệu bị lỗi). "
            + "Hệ thống từ chối tạo ảnh giả lập (synthetic fallback) để bảo đảm an toàn chẩn đoán y tế tuyệt đối.");
  }

  /**
   * Scans forward through a DICOM Undefined Length Sequence (0xFFFFFFFF) to locate
   * the matching Sequence Delimitation Item (0xFFFE, 0xE0DD).
   * Supports nested sequences by tracking sequence nesting depth.
   *
   * @param data Raw binary DICOM stream
   * @param startOffset Offset where sequence value starts (immediately following the 4-byte 0xFFFFFFFF length)
   * @return Offset immediately following the 8-byte Sequence Delimitation Item (tag + 4-byte length), or -1 if malformed
   */
  private int findSequenceEnd(byte[] data, int startOffset) {
    int offset = startOffset;
    int len = data.length;
    int depth = 1;

    while (offset + 8 <= len) {
      int group = (data[offset] & 0xFF) | ((data[offset + 1] & 0xFF) << 8);
      int elem = (data[offset + 2] & 0xFF) | ((data[offset + 3] & 0xFF) << 8);

      // Stop if Pixel Data (7FE0, 0010) is unexpectedly encountered
      if (group == 0x7FE0 && elem == 0x0010) {
        log.warn("Unexpected Pixel Data (7FE0,0010) encountered while scanning sequence at offset {}", offset);
        return offset;
      }

      // Check for Sequence Delimitation Item (FFFE, E0DD)
      if (group == 0xFFFE && elem == 0xE0DD) {
        depth--;
        offset += 8; // Skip tag (4 bytes) + length (4 bytes of 0x00)
        if (depth == 0) {
          return offset;
        }
        continue;
      }

      // Check for Item Delimitation Item (FFFE, E00D)
      if (group == 0xFFFE && elem == 0xE00D) {
        offset += 8; // Skip tag (4 bytes) + length (4 bytes of 0x00)
        continue;
      }

      // Check for Item Tag (FFFE, E000)
      if (group == 0xFFFE && elem == 0xE000) {
        offset += 8; // Skip tag (4 bytes) + length (4 bytes)
        continue;
      }

      // Check for nested explicit VR SQ with undefined length (0xFFFFFFFF)
      if (offset + 12 <= len && isAsciiUpper(data[offset + 4]) && isAsciiUpper(data[offset + 5])) {
        String vr = new String(data, offset + 4, 2, StandardCharsets.US_ASCII);
        if ("SQ".equals(vr)) {
          int sqLen = (data[offset + 8] & 0xFF)
              | ((data[offset + 9] & 0xFF) << 8)
              | ((data[offset + 10] & 0xFF) << 16)
              | ((data[offset + 11] & 0xFF) << 24);
          if (sqLen == -1) {
            depth++;
            offset += 12;
            continue;
          }
        }
      }

      // Check for nested implicit VR SQ with undefined length
      if (offset + 8 <= len && group != 0xFFFE) {
        int possibleLen = (data[offset + 4] & 0xFF)
            | ((data[offset + 5] & 0xFF) << 8)
            | ((data[offset + 6] & 0xFF) << 16)
            | ((data[offset + 7] & 0xFF) << 24);
        if (possibleLen == -1 && offset + 12 <= len) {
          // Look ahead to check if next tag is an Item tag (FFFE, E000)
          int nextGroup = (data[offset + 8] & 0xFF) | ((data[offset + 9] & 0xFF) << 8);
          int nextElem = (data[offset + 10] & 0xFF) | ((data[offset + 11] & 0xFF) << 8);
          if (nextGroup == 0xFFFE && nextElem == 0xE000) {
            depth++;
            offset += 8;
            continue;
          }
        }
      }

      offset++;
    }

    return -1;
  }

  public byte[] decodeBase64Payload(String payload) {
    String clean = payload.trim();
    if (clean.contains(",")) {
      clean = clean.substring(clean.indexOf(",") + 1);
    }
    return Base64.getDecoder().decode(clean);
  }

  private void overwriteTagValue(byte[] array, int offset, int maxLen, String replacement) {
    byte[] repBytes = replacement.getBytes(StandardCharsets.UTF_8);
    int copyLen = Math.min(repBytes.length, maxLen);
    System.arraycopy(repBytes, 0, array, offset, copyLen);
    for (int i = copyLen; i < maxLen; i++) {
      array[offset + i] = (byte) ' '; // DICOM padding with space
    }
  }

  private int findJpegMarker(byte[] data) {
    int start = (isDicom(data)) ? 132 : 0;
    for (int i = start; i < data.length - 3; i++) {
      if ((data[i] & 0xFF) == 0xFF
          && (data[i + 1] & 0xFF) == 0xD8
          && (data[i + 2] & 0xFF) == 0xFF) {
        return i;
      }
    }
    return -1;
  }

  private boolean isAsciiUpper(byte b) {
    return b >= 'A' && b <= 'Z';
  }
}
