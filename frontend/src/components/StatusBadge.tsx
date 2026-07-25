type StatusState = 'healthy' | 'loading' | 'unavailable'

export function StatusBadge({ label, status }: { label: string; status: StatusState }) {
  const statusText =
    status === 'healthy'
      ? 'Sẵn sàng'
      : status === 'loading'
      ? 'Đang kiểm tra…'
      : 'Chưa sẵn sàng'

  return (
    <div className="status-card">
      <span className={`status-dot ${status}`} />
      <div>
        <span className="eyebrow">{label}</span>
        <strong>{statusText}</strong>
      </div>
    </div>
  )
}
