import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; size?: 'sm' | 'md' | 'lg'; children: React.ReactNode; }

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, size = 'md', children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
