import React from 'react';
import { X, MapPin } from 'lucide-react';
import { LocationSettings } from './LocationSettings';

export const LocationModal = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="var(--emerald-light)" />
            <h3 className="modal-title">تحديد الدولة والمدينة</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <LocationSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
};
