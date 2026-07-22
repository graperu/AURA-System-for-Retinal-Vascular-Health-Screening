function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0d0d12',
      color: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        AURA System Skeleton
      </h1>
      <p style={{ color: '#9ca3af', fontSize: '1.2rem' }}>
        Hệ thống Sàng lọc Sức khỏe Mạch máu Võng mạc
      </p>
      <div style={{ marginTop: '20px', padding: '15px 25px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
        Mô-đun Frontend React + TypeScript đã sẵn sàng.
      </div>
    </div>
  );
}

export default App;
