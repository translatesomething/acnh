'use client';

import { useEffect, useRef } from 'react';

export default function CopyNotification({ show, onClose }) {
  const notificationRef = useRef(null);

  useEffect(() => {
    if (show && notificationRef.current) {
      // Animation: fade in
      notificationRef.current.style.opacity = '0';
      notificationRef.current.style.transform = 'translate(-50%, 20px)';
      
      setTimeout(() => {
        if (notificationRef.current) {
          notificationRef.current.style.transition = 'all 150ms ease-out';
          notificationRef.current.style.opacity = '1';
          notificationRef.current.style.transform = 'translate(-50%, 0)';
        }
      }, 10);

      // Auto hide after 1.5 seconds
      const timer = setTimeout(() => {
        if (notificationRef.current) {
          notificationRef.current.style.transition = 'all 150ms ease-in';
          notificationRef.current.style.opacity = '0';
          notificationRef.current.style.transform = 'translate(-50%, -20px)';
          
          setTimeout(() => {
            if (onClose) onClose();
          }, 150);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div ref={notificationRef} className="copy-notification">
      <span className="material-icons">check_circle</span>
      <span>Copied!</span>
      <style jsx>{`
        .copy-notification {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--acnh-green);
          color: white;
          padding: 12px 24px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          pointer-events: none;
        }
        .material-icons {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      `}</style>
    </div>
  );
}
