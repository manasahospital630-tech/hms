import QRCode from 'qrcode';

export const getAbsoluteLogoUrl = (logoPath?: string | null): string | null => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  const trimmed = logoPath.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const origin = window.location.origin;
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${cleanPath}`;
};

export const getHospitalLogoHtml = (logoUrlInput?: string | null, heightPx = 70): string => {
  const logoUrl = getAbsoluteLogoUrl(logoUrlInput);

  const fallbackSvg = `
    <div class="logo-fallback-container" style="display: flex; align-items: center; justify-content: center; width: ${heightPx + 10}px; height: ${heightPx}px;">
      <svg width="${heightPx}" height="${heightPx}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="18" fill="url(#mh-grad-logo)"/>
        <path d="M22 76V24L50 52L78 24V76" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="mh-grad-logo" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0F172A"/>
            <stop offset="1" stop-color="#1E3A8A"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  `;

  if (!logoUrl) {
    return fallbackSvg;
  }

  return `
    <div style="display: flex; align-items: center; justify-content: flex-start; position: relative;">
      <img 
        src="${logoUrl}" 
        alt="Logo" 
        style="height: ${heightPx}px; max-width: 140px; object-fit: contain;" 
        onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
      />
      <div style="display: none; align-items: center; justify-content: center;">
        ${fallbackSvg}
      </div>
    </div>
  `;
};

export const generateQrDataUrl = async (text: string): Promise<string> => {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
};

export const getQrCodeHeaderHtml = async (verifyUrl: string, label = 'VERIFY REPORT'): Promise<string> => {
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  if (!qrDataUrl) {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #fff; text-align: center; box-sizing: border-box; flex-shrink: 0; margin-left: 20px;">
        <svg viewBox="0 0 24 24" width="45" height="45" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span style="font-size: 6px; font-weight: bold; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.2px;">${label}</span>
      </div>
    `;
  }

  return `
    <div class="qr-header-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 80px; height: 80px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #fff; text-align: center; box-sizing: border-box; flex-shrink: 0; margin-left: 20px;">
      <img src="${qrDataUrl}" alt="${label}" style="width: 58px; height: 58px; display: block;" />
      <span style="font-size: 6px; font-weight: bold; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.2px;">${label}</span>
    </div>
  `;
};
