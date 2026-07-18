import React from 'react';

interface VitalsData { systolic_bp?: number; diastolic_bp?: number; pulse_rate?: number; temperature_celsius?: number; weight_kg?: number; height_cm?: number; spo2?: number; }

export const VitalsCard: React.FC<{ vitals: VitalsData }> = ({ vitals }) => {
  const items = [
    { label: 'BP', value: vitals.systolic_bp && vitals.diastolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : null, abnormal: (vitals.systolic_bp || 0) > 140 || (vitals.diastolic_bp || 0) > 90 },
    { label: 'Pulse', value: vitals.pulse_rate ? `${vitals.pulse_rate} bpm` : null, abnormal: (vitals.pulse_rate || 0) > 100 || (vitals.pulse_rate || 0) < 60 },
    { label: 'Temp', value: vitals.temperature_celsius ? `${vitals.temperature_celsius}°C` : null, abnormal: (vitals.temperature_celsius || 0) > 37.5 },
    { label: 'Weight', value: vitals.weight_kg ? `${vitals.weight_kg} kg` : null, abnormal: false },
    { label: 'Height', value: vitals.height_cm ? `${vitals.height_cm} cm` : null, abnormal: false },
    { label: 'SpO2', value: vitals.spo2 ? `${vitals.spo2}%` : null, abnormal: (vitals.spo2 || 100) < 95 },
  ].filter(i => i.value);

  if (items.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No vitals recorded</p>;

  return (
    <div className="vitals-grid">
      {items.map((item) => (
        <div className="vital-item" key={item.label}>
          <div className="vital-label">{item.label}</div>
          <div className={`vital-value ${item.abnormal ? 'abnormal' : ''}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};
