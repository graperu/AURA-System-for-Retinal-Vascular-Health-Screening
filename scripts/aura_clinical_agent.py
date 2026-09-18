#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
AURA CLINICAL AI AGENT - GOOGLE ANTIGRAVITY PYTHON SDK INTEGRATION
=============================================================================
Kịch bản điều phối Agentic AI sử dụng Google Antigravity Python SDK
(google-antigravity) dành riêng cho Hệ thống Sàng Lọc Sức Khỏe Vi Mạch Võng Mạc AURA.

Tính năng:
1. Tư vấn lâm sàng tương tác thời gian thực với Antigravity Agent.
2. Phân tích ảnh võng mạc đa phương thức (Multimodal Retinal Vision Inspection).
3. Tự động kiểm toán an toàn y tế và rà soát mã nguồn (Clinical & Security Audit).
=============================================================================
"""

import asyncio
import os
import sys
from pathlib import Path

# Nạp cấu hình từ .env nếu có
def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("\"'")
                    if k not in os.environ:
                        os.environ[k] = v

load_env()

try:
    from google.antigravity import (
        Agent,
        LocalAgentConfig,
        CapabilitiesConfig,
        from_file,
    )
    from google.antigravity.utils.interactive import run_interactive_loop
except ImportError as e:
    print("\n[!] LỖI: Chưa cài đặt google-antigravity.")
    print("Vui lòng chạy: pip install google-antigravity\n")
    sys.exit(1)

# Chỉ dẫn hệ thống lâm sàng chuẩn AURA
AURA_CLINICAL_SYSTEM_INSTRUCTIONS = """
Bạn là AURA Clinical AI Agent - Chuyên gia Hỗ trợ Quyết định Lâm sàng (Clinical Decision Support) 
chuyên về phân tích hình thái vi mạch đáy mắt và nhãn khoa phòng ngừa.

Quy chuẩn nghiệp vụ y tế của bạn:
1. Phân tầng nguy cơ theo 4 mức độ chuẩn AURA:
   - Thấp (Low: 0-39 điểm): Vi mạch bình thường, tiếp tục theo dõi định kỳ hàng năm.
   - Trung bình (Moderate: 40-64 điểm): Tổn thương vi mạch nhẹ/lan tỏa, tư vấn chế độ sống và khám chuyên khoa trong 3-6 tháng.
   - Cao (High: 65-84 điểm): Tổn thương vi phình mạch, xuất huyết hoặc giãn mạch rõ, cần chuyển tuyến bác sĩ chuyên khoa.
   - Rất cao (Critical: 85-100 điểm): Bệnh võng mạc tăng sinh hoặc biến cố thiếu máu cấp, cần can thiệp y tế khẩn cấp.
2. Khảo sát 4 cấu trúc giải phẫu:
   - Gai thị (Optic Disc) & Tỷ lệ lõm gai (Cup-to-Disc Ratio - CDR chuẩn <= 0.4).
   - Hoàng điểm (Macula) & Vùng vô mạch hoàng điểm (FAZ).
   - Mạng lưới mạch máu võng mạc (Arteriolar-to-Venular Ratio - AVR chuẩn 2:3 hay 0.67).
   - Các tổn thương vi mạch khu trú (Vi phình mạch Microaneurysms, Xuất huyết Hemorrhage, Xuất tiết Hard Exudates, Dấu hiệu bắt chéo AV Nicking).
3. Luôn bảo đảm giao tiếp chuẩn mực, trung thực, tôn trọng bảo mật thông tin bệnh nhân (HIPAA) và tuân thủ Tuyên bố miễn trừ trách nhiệm y tế của Bộ Y Tế.
"""

async def interactive_clinical_chat():
    """Chế độ 1: Trò chuyện và tư vấn lâm sàng tương tác với Antigravity Agent"""
    print("\n" + "="*70)
    print("  AURA CLINICAL AGENT - PHIÊN TƯƠNG TÁC THỜI GIAN THỰC")
    print("  (Gõ 'exit' hoặc 'quit' để quay lại menu chính)")
    print("="*70 + "\n")

    config = LocalAgentConfig(
        system_instructions=AURA_CLINICAL_SYSTEM_INSTRUCTIONS,
        capabilities=CapabilitiesConfig(),
    )

    async with Agent(config) as agent:
        await run_interactive_loop(agent)

async def analyze_retinal_image(image_path: str = None):
    """Chế độ 2: Phân tích ảnh chụp đáy mắt võng mạc sử dụng Antigravity Vision"""
    project_root = Path(__file__).resolve().parent.parent
    default_img = project_root / "frontend" / "public" / "assets" / "images" / "fundus_original.png"

    if not image_path:
        user_input = input(f"\nNhập đường dẫn ảnh võng mạc (Enter để dùng ảnh mặc định '{default_img.name}'): ").strip()
        image_path = user_input if user_input else str(default_img)

    img_file = Path(image_path)
    if not img_file.exists():
        print(f"\n[!] Không tìm thấy tệp ảnh tại: {img_file}")
        return

    print(f"\n[+] Đang nạp ảnh võng mạc: {img_file.name}")
    print("[+] Khởi tạo Antigravity Agent phân tích đa phương thức...")

    config = LocalAgentConfig(
        system_instructions=AURA_CLINICAL_SYSTEM_INSTRUCTIONS,
        capabilities=CapabilitiesConfig(),
    )

    prompt = f"""
    Hãy phân tích ảnh chụp đáy mắt võng mạc từ tệp '{img_file.name}'.
    Cung cấp đánh giá lâm sàng theo cấu trúc:
    1. Đánh giá chất lượng ảnh (Độ nét, độ phơi sáng, trường chụp hoàng điểm/gai thị).
    2. Khảo sát giải phẫu (Gai thị CDR, Hoàng điểm, Tỷ lệ đường kính động-tĩnh mạch AVR).
    3. Phát hiện tổn thương vi mạch (Vi phình mạch, xuất huyết, xuất tiết cứng, dấu bắt chéo AV).
    4. Điểm nguy cơ ước tính (0-100) và Phân tầng rủi ro lâm sàng.
    5. Khuyến nghị kế hoạch theo dõi y khoa cho người bệnh.
    """

    async with Agent(config) as agent:
        print("\n--- ĐANG SUY LUẬN & PHÂN TÍCH (STREAMING PHẢN HỒI) ---\n")
        response = await agent.chat(prompt)

        async for token in response:
            sys.stdout.write(token)
            sys.stdout.flush()
        print("\n" + "-"*70 + "\n")

async def run_safety_audit():
    """Chế độ 3: Tự động kiểm toán an toàn y tế và bảo mật mã nguồn AURA"""
    print("\n[+] Đang khởi chạy Antigravity Agent để kiểm toán an toàn mã nguồn AURA...")

    config = LocalAgentConfig(
        system_instructions="""
        Bạn là Antigravity Security & HIPAA Auditor chuyên biệt cho phần mềm y tế.
        Nhiệm vụ: Phân tích tính an toàn của dự án AURA:
        - Xác minh file .env được bảo vệ trong .gitignore.
        - Kiểm tra xem có hardcode API key, SMTP password hay thông tin bí mật nào không.
        - Đánh giá tính toàn vẹn của cơ chế phân quyền RBAC 4 vai trò (Patient, Doctor, Clinic, Admin).
        """,
        capabilities=CapabilitiesConfig(enable_tools=True),
    )

    async with Agent(config) as agent:
        prompt = "Hãy rà soát nhanh tình trạng bảo mật hiện tại của thư mục cấu hình và các tệp tin trong dự án AURA."
        print("\n--- KẾT QUẢ KIỂM TOÁN TỪ ANTIGRAVITY AGENT ---\n")
        response = await agent.chat(prompt)
        async for token in response:
            sys.stdout.write(token)
            sys.stdout.flush()
        print("\n" + "="*70 + "\n")

def print_menu():
    print("""
=============================================================================
         AURA SYSTEM - GOOGLE ANTIGRAVITY PYTHON SDK ASSISTANT
=============================================================================
  [1] Trò chuyện & Tư vấn Lâm sàng Tương tác (Interactive Clinical Chat)
  [2] Phân tích Ảnh Đáy Mắt Võng Mạc Multimodal (Fundus Vision Analysis)
  [3] Tự động Kiểm toán An toàn Y tế & Bảo mật Mã nguồn (Security Audit)
  [4] Thoát (Exit)
=============================================================================
""")

async def main():
    while True:
        print_menu()
        choice = input("Vui lòng chọn một tùy chọn [1-4]: ").strip()
        if choice == "1":
            await interactive_clinical_chat()
        elif choice == "2":
            await analyze_retinal_image()
        elif choice == "3":
            await run_safety_audit()
        elif choice == "4":
            print("\nTạm biệt! Đã đóng phiên Antigravity Agent.\n")
            break
        else:
            print("\n[!] Tùy chọn không hợp lệ, vui lòng chọn lại.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nĐã hủy phiên làm việc bởi người dùng.")
