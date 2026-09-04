import React from 'react';

export function DoctorArtwork() {
  return (
    <div className="doctor-artwork">
      <svg className="doctor-artwork__back" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <circle cx="118" cy="112" r="14" fill="#FF668A" />
        <circle cx="88" cy="145" r="7" fill="rgba(255,255,255,0.72)" />
        <path d="M115 310 L235 430" fill="none" stroke="#FFD078" strokeWidth="28" strokeLinecap="round" />
        <path d="M360 390 L485 265" fill="none" stroke="#A8B6FF" strokeWidth="28" strokeLinecap="round" opacity="0.76" />
      </svg>
      <img src="/images/auth-doctor.png" alt="Nhân viên y tế AURA" className="doctor-artwork__image" />
      <svg className="doctor-artwork__front" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path d="M190 305 L300 410 L410 305" fill="none" stroke="#FF668A" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
