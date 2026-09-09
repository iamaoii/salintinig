import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket.js';

/**
 * Custom hook for real-time Socket.io + smart notification polling.
 * - Receives instant push notifications over WebSockets (< 50ms delay).
 * - Pauses background polling when tab is hidden/inactive.
 * - Triggers an immediate refresh when returning to active tab.
 *
 * @param {Function} fetchFn - Function to execute for fetching notifications.
 * @param {number} intervalMs - Fallback polling interval in milliseconds (default: 60000ms).
 * @param {Array} dependencies - Dependency array to trigger refetch (e.g. location.pathname).
 */
export function useSmartNotificationPoll(fetchFn, intervalMs = 60000, dependencies = []) {
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    let timerId = null;

    const runFetch = () => {
      if (document.visibilityState === 'visible' && typeof fetchRef.current === 'function') {
        fetchRef.current();
      }
    };

    const startPolling = () => {
      stopPolling();
      if (document.visibilityState === 'visible') {
        timerId = setInterval(runFetch, intervalMs);
      }
    };

    const stopPolling = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runFetch();
        startPolling();
      } else {
        stopPolling();
      }
    };

    const handleCustomUpdate = () => {
      runFetch();
    };

    // Initial fetch and start fallback polling if visible
    runFetch();
    startPolling();

    // Subscribe to real-time WebSockets
    const socket = getSocket();
    socket.on('notification:new', handleCustomUpdate);
    socket.on('notifications:updated', handleCustomUpdate);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('notificationsUpdated', handleCustomUpdate);

    return () => {
      stopPolling();
      socket.off('notification:new', handleCustomUpdate);
      socket.off('notifications:updated', handleCustomUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('notificationsUpdated', handleCustomUpdate);
    };
  }, [...dependencies]);
}
