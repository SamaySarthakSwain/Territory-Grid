/**
 * ============================================================================
 * TERRITORY GRID // NETWORK HEALTH MONITOR & OFFLINE RESILIENCE HUD
 * ============================================================================
 * Detects cellular / Wi-Fi drops, displays tactical HUD connection telemetry,
 * and automatically triggers telemetry resynchronization upon network restoration.
 * ============================================================================
 */

(function (window) {
  'use strict';

  let isOnline = navigator.onLine !== false;
  const statusListeners = [];
  let pillElement = null;

  function ensurePillElement() {
    if (pillElement) return pillElement;
    pillElement = document.getElementById('gridNetworkPill');
    if (!pillElement) {
      pillElement = document.createElement('div');
      pillElement.id = 'gridNetworkPill';
      pillElement.style.cssText = [
        'position: fixed',
        'top: 14px',
        'left: 50%',
        'transform: translateX(-50%)',
        'z-index: 99999',
        'padding: 6px 14px',
        'border-radius: 999px',
        'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        'font-size: 11px',
        'font-weight: 700',
        'letter-spacing: 0.05em',
        'text-transform: uppercase',
        'display: none',
        'align-items: center',
        'gap: 8px',
        'box-shadow: 0 4px 20px rgba(0,0,0,0.5)',
        'transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pointer-events: none',
        'backdrop-filter: blur(12px)',
        '-webkit-backdrop-filter: blur(12px)'
      ].join(';');
      document.body.appendChild(pillElement);
    }
    return pillElement;
  }

  function showStatus(online) {
    isOnline = online;
    const pill = ensurePillElement();

    if (!online) {
      pill.style.display = 'flex';
      pill.style.background = 'rgba(239, 68, 68, 0.2)';
      pill.style.border = '1px solid rgba(239, 68, 68, 0.6)';
      pill.style.color = '#fca5a5';
      pill.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;animation:pulse 1.2s infinite"></span> SIGNAL SEVERED • LOCAL CACHE ACTIVE';
      if (window.tacticalFeedback) {
        window.tacticalFeedback.error();
      }
    } else {
      pill.style.display = 'flex';
      pill.style.background = 'rgba(16, 185, 129, 0.2)';
      pill.style.border = '1px solid rgba(16, 185, 129, 0.6)';
      pill.style.color = '#6ee7b7';
      pill.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981"></span> GRID TELEMETRY RESTORED';

      if (window.tacticalFeedback) {
        window.tacticalFeedback.success();
      }

      // Auto-hide after 2.8s
      setTimeout(() => {
        if (isOnline) {
          pill.style.opacity = '0';
          setTimeout(() => {
            if (isOnline) {
              pill.style.display = 'none';
              pill.style.opacity = '1';
            }
          }, 300);
        }
      }, 2800);
    }

    statusListeners.forEach(fn => {
      try { fn(online); } catch (e) {}
    });
  }

  // Browser events
  window.addEventListener('online', () => showStatus(true));
  window.addEventListener('offline', () => showStatus(false));

  // Capacitor Network Plugin Integration
  document.addEventListener('DOMContentLoaded', () => {
    ensurePillElement();
    if (window.Capacitor?.Plugins?.Network) {
      window.Capacitor.Plugins.Network.getStatus().then(status => {
        if (!status.connected) showStatus(false);
      }).catch(() => {});

      window.Capacitor.Plugins.Network.addListener('networkStatusChange', status => {
        showStatus(!!status.connected);
      });
    }
  });

  window.networkMonitor = {
    isOnline: function () {
      return isOnline;
    },
    onStatusChange: function (fn) {
      if (typeof fn === 'function') statusListeners.push(fn);
    }
  };

})(window);
