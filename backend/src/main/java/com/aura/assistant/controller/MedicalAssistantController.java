package com.aura.assistant.controller;

import com.aura.common.response.ApiResponse;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
public class MedicalAssistantController {

  @PostMapping("/ask")
  public ApiResponse<Map<String, String>> ask(@RequestBody Map<String, String> body) {
    String q = body.getOrDefault("question", "").toLowerCase(Locale.ROOT);
    String answer = answer(q);
    return ApiResponse.success(Map.of("answer", answer, "disclaimer", "Chatbot chỉ giải thích thuật ngữ, không thay thế bác sĩ."));
  }

  private String answer(String q) {
    List<Map.Entry<String, String>> kb =
        List.of(
            Map.entry(
                "avr",
                "AVR (Arteriovenous Ratio) là tỉ lệ đường kính động mạch / tĩnh mạch võng mạc. AVR thấp (thường < 0.67) gợi ý hẹp động mạch, hay gặp khi tăng huyết áp lâu ngày."),
            Map.entry(
                "a/v",
                "Tỉ lệ A/V mô tả độ mảnh của động mạch so với tĩnh mạch trên ảnh đáy mắt. Bác sĩ dùng chỉ số này để theo dõi tổn thương vi mạch theo thời gian."),
            Map.entry(
                "grad-cam",
                "Grad-CAM là bản đồ nhiệt giải thích AI: vùng màu nóng cho thấy mô hình đang 'nhìn' vào đâu khi chấm điểm nguy cơ, giúp bác sĩ đối chiếu lâm sàng."),
            Map.entry(
                "heatmap",
                "Heatmap (bản đồ nhiệt) phủ lên ảnh võng mạc để khoanh vùng AI cho là bất thường. Đây là công cụ hỗ trợ, không phải chẩn đoán cuối."),
            Map.entry(
                "cdr",
                "CDR (Cup-to-Disc Ratio) là tỉ lệ hõm đĩa / đĩa thị. CDR tăng có thể liên quan glaucoma; cần bác sĩ nhãn khoa xác nhận, không tự kết luận."),
            Map.entry(
                "hba1c",
                "HbA1c phản ánh đường huyết trung bình 2–3 tháng. Bệnh võng mạc đái tháo đường thường nặng hơn khi HbA1c cao kéo dài."),
            Map.entry(
                "tortuosity",
                "Chỉ số xoắn mạch (tortuosity) đo độ 'lượn sóng' của mạch máu. Tăng xoắn có thể gặp trong tăng huyết áp hoặc bệnh mạch máu mạn."),
            Map.entry(
                "mật độ",
                "Mật độ mạch (vessel density) ước lượng phần trăm diện tích mạch trên vùng phân tích. Giảm mật độ có thể gợi ý thiếu tưới máu."),
            Map.entry(
                "critical",
                "Mức CRITICAL nghĩa là AI thấy dấu hiệu nguy cơ rất cao. Bạn nên liên hệ bác sĩ trong 24–48 giờ, không tự ý dùng thuốc thêm."),
            Map.entry(
                "chụp",
                "Trước khi chụp đáy mắt: ngồi ổn định, mở mắt rộng, tránh lóa mạnh, lấy nét vào đồng tử. Ảnh mờ/lóa làm AI kém chính xác."));
    for (var e : kb) {
      if (q.contains(e.getKey())) {
        return e.getValue();
      }
    }
    Map<String, String> extra = new LinkedHashMap<>();
    extra.put("default", "Bạn có thể hỏi về AVR, Grad-CAM, CDR, HbA1c, mật độ mạch, hoặc cách chụp ảnh chuẩn. Câu hỏi chưa có trong từ điển y khoa rút gọn của AURA.");
    return extra.get("default");
  }
}
