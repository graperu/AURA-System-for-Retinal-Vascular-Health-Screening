import React, { useEffect, useState } from 'react';
import { Bell, Users, Shield, Camera, Bot, Plus, Trash2 } from 'lucide-react';
import { assistantApi, familyApi, notificationApi, privacyApi } from '../services/api';

export const NotificationSettingsView: React.FC = () => {
  const [prefs, setPrefs] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    notificationApi.preferences().then((r) => {
      if (r.success) setPrefs(r.data);
    });
  }, []);

  const toggle = async (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await notificationApi.updatePreferences(next);
    setMsg('Đã lưu tùy chọn thông báo');
  };

  const remind = async () => {
    const r = await notificationApi.remindAppointment();
    setMsg(r.success ? 'Đã gửi nhắc lịch tái khám (web/email theo tùy chọn).' : r.message || 'Lỗi');
  };

  if (!prefs) return <p className="text-xs text-slate-500">Đang tải tùy chọn...</p>;

  const rows: [string, string][] = [
    ['webPush', 'Web / Mobile Push'],
    ['emailEnabled', 'Email thông báo'],
    ['smsEnabled', 'SMS (bật thêm; ca CRITICAL vẫn gửi SMS an toàn)'],
    ['aiReady', 'Kết quả AI sẵn sàng'],
    ['doctorMessage', 'Tin nhắn / phản hồi bác sĩ'],
    ['appointmentReminder', 'Nhắc lịch tái khám'],
    ['lowCredit', 'Cảnh báo credit sắp hết'],
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-cyan-700" />
        <div>
          <h2 className="text-lg font-bold">Cài đặt thông báo (FR-9)</h2>
          <p className="text-xs text-slate-500">Bật/tắt từng kênh và từng loại thông báo.</p>
        </div>
      </div>
      {rows.map(([key, label]) => (
        <label key={key} className="flex items-center justify-between text-sm border-b border-slate-100 py-2">
          <span>{label}</span>
          <input type="checkbox" checked={!!prefs[key]} onChange={() => void toggle(key)} />
        </label>
      ))}
      <button onClick={() => void remind()} className="px-4 py-2 bg-cyan-700 text-white text-xs font-bold rounded-xl">
        Tạo nhắc lịch tái khám (demo)
      </button>
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </div>
  );
};

export const FamilyProfilesView: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState({ displayName: '', relationship: 'CHILD', dateOfBirth: '', gender: 'Other' });

  const load = () => familyApi.list().then((r) => r.success && setMembers(r.data || []));
  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-cyan-700" />
        <div>
          <h2 className="text-lg font-bold">Hồ sơ gia đình</h2>
          <p className="text-xs text-slate-500">Một tài khoản — nhiều hồ sơ (ông bà, bố mẹ, con).</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="px-3 py-2 border rounded-xl text-xs"
          placeholder="Họ tên"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
        <select
          className="px-3 py-2 border rounded-xl text-xs"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
        >
          <option value="SELF">Tôi</option>
          <option value="PARENT">Bố/Mẹ</option>
          <option value="CHILD">Con</option>
          <option value="GRANDPARENT">Ông/Bà</option>
          <option value="SPOUSE">Vợ/Chồng</option>
        </select>
        <input
          type="date"
          className="px-3 py-2 border rounded-xl text-xs"
          value={form.dateOfBirth}
          onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
        />
        <button
          className="px-3 py-2 bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
          onClick={async () => {
            await familyApi.create({ ...form, dateOfBirth: form.dateOfBirth || null });
            setForm({ ...form, displayName: '' });
            void load();
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between border rounded-xl px-3 py-2 text-xs">
            <span>
              <strong>{m.displayName}</strong> — {m.relationship} {m.active ? '(đang xem)' : ''}
            </span>
            <span className="flex gap-2">
              {!m.active && (
                <button className="text-cyan-700 font-bold" onClick={() => familyApi.activate(m.id).then(load)}>
                  Chuyển
                </button>
              )}
              <button onClick={() => familyApi.remove(m.id).then(load)}>
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const PrivacyRightsView: React.FC = () => {
  const [allow, setAllow] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    privacyApi.get().then((r) => {
      if (r.success && r.data) setAllow(!!r.data.allowAnonymousAiTraining);
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-cyan-700" />
        <div>
          <h2 className="text-lg font-bold">Quyền riêng tư & dữ liệu</h2>
          <p className="text-xs text-slate-500">GDPR / HIPAA: đồng ý huấn luyện ẩn danh, xuất dữ liệu, xóa tài khoản.</p>
        </div>
      </div>
      <label className="flex items-center justify-between text-sm">
        <span>Cho phép dùng dữ liệu ẩn danh cải thiện mô hình AI</span>
        <input
          type="checkbox"
          checked={allow}
          onChange={async (e) => {
            setAllow(e.target.checked);
            await privacyApi.update(e.target.checked);
            setMsg('Đã lưu tùy chọn huấn luyện AI');
          }}
        />
      </label>
      <button
        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        onClick={async () => {
          const r = await privacyApi.exportData();
          if (r.success) {
            const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'aura-personal-data.json';
            a.click();
            URL.revokeObjectURL(url);
            setMsg('Đã tải bản trích xuất dữ liệu cá nhân');
          }
        }}
      >
        Xuất toàn bộ dữ liệu cá nhân
      </button>
      <button
        className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
        onClick={async () => {
          if (!window.confirm('Xóa vĩnh viễn / vô hiệu hóa tài khoản?')) return;
          await privacyApi.deleteAccount();
          setMsg('Tài khoản đã được đánh dấu xóa. Đăng xuất rồi liên hệ admin nếu cần khôi phục trong thời gian ân hạn.');
        }}
      >
        Yêu cầu xóa tài khoản
      </button>
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </div>
  );
};

export const CaptureGuideView: React.FC = () => {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6 text-cyan-700" />
          <h2 className="text-lg font-bold">Hướng dẫn chụp ảnh võng mạc chuẩn</h2>
        </div>
        <ol className="list-decimal pl-5 text-xs text-slate-700 space-y-2">
          <li>Ngồi thẳng, cằm và trán tựa chắc trên máy (hoặc giữ điện thoại song song mặt, khoảng 10–15 cm nếu dùng adapter).</li>
          <li>Tắt đèn phòng mạnh phía sau máy ảnh để giảm lóa; nhìn vào điểm định thị.</li>
          <li>Mở mắt rộng, không chớp lúc bấm chụp; lấy nét vào đồng tử / phản xạ đỏ.</li>
          <li>Kiểm tra ảnh: thấy rõ đĩa thị và hoàng điểm, không mờ, không che mi, không lóa trắng.</li>
          <li>Chụp cả hai mắt (OD/OS) nếu bác sĩ yêu cầu; tải ảnh gốc, không crop mất mạch máu.</li>
        </ol>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
          {['Ánh sáng đều', 'Mắt mở rộng', 'Nét đĩa thị'].map((t) => (
            <div key={t} className="p-6 rounded-xl bg-slate-100 border border-dashed border-slate-300 font-semibold text-slate-600">
              Minh họa: {t}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-cyan-700" />
          <h2 className="text-lg font-bold">Trợ lý thuật ngữ y khoa</h2>
        </div>
        <p className="text-xs text-slate-500">Hỏi AVR, Grad-CAM, CDR, HbA1c, mật độ mạch... Chatbot không thay thế bác sĩ.</p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border rounded-xl text-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ví dụ: AVR là gì?"
          />
          <button
            className="px-4 py-2 bg-cyan-700 text-white text-xs font-bold rounded-xl"
            onClick={async () => {
              const r = await assistantApi.ask(q);
              setA(r.data?.answer || r.message || 'Không trả lời được');
            }}
          >
            Hỏi
          </button>
        </div>
        {a && <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">{a}</p>}
      </div>
    </div>
  );
};
