/**
 * ============================================================================
 * TERRITORY GRID // GEOSPATIAL RADAR & HAVERSINE RANGE ENGINE
 * ============================================================================
 * Calculates exact geodesic distance and compass bearing between operatives
 * and campus checkpoints with zero external API calls.
 * ============================================================================
 */

(function (window) {
  'use strict';

  const EARTH_RADIUS_METERS = 6371000;

  function toRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function toDeg(radians) {
    return (radians * 180) / Math.PI;
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(EARTH_RADIUS_METERS * c);
  }

  function calculateBearing(lat1, lon1, lat2, lon2) {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    let theta = toDeg(Math.atan2(y, x));
    theta = (theta + 360) % 360;

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    const idx = Math.round(theta / 45);
    return {
      degrees: Math.round(theta),
      cardinal: directions[idx]
    };
  }

  let currentPos = null;
  let watchId = null;

  const territoryGeo = {
    haversineDistance: haversineDistance,
    calculateBearing: calculateBearing,

    startTracking: function (onUpdate) {
      if (!navigator.geolocation) return;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          currentPos = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          if (typeof onUpdate === 'function') onUpdate(currentPos);
        },
        (err) => {
          console.warn('[TerritoryGeo tracking warning]:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 8000
        }
      );
    },

    stopTracking: function () {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    },

    getCurrentPosition: function () {
      return currentPos;
    },

    formatRangeBadge: function (targetLat, targetLon) {
      if (!currentPos || !targetLat || !targetLon) return null;
      const dist = haversineDistance(
        currentPos.latitude,
        currentPos.longitude,
        targetLat,
        targetLon
      );
      const brg = calculateBearing(
        currentPos.latitude,
        currentPos.longitude,
        targetLat,
        targetLon
      );

      if (dist <= 25) {
        return {
          distanceMeters: dist,
          label: '🎯 AT CHECKPOINT (' + dist + 'm)',
          atStation: true
        };
      }

      return {
        distanceMeters: dist,
        bearing: brg.degrees,
        cardinal: brg.cardinal,
        label: '📍 ' + dist + 'm • ' + brg.cardinal + ' ' + brg.degrees + '°',
        atStation: false
      };
    }
  };

  window.territoryGeo = territoryGeo;

})(window);
