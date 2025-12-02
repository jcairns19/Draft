/**
 * Utility functions for time formatting
 */

/**
 * Format time from 24-hour to 12-hour format
 * @param {string} timeString - Time string in HH:MM:SS format
 * @returns {string} Formatted time string in 12-hour format with AM/PM
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Check if a restaurant is currently open based on open and close times
 * @param {string} openTime - Opening time in HH:MM:SS format
 * @param {string} closeTime - Closing time in HH:MM:SS format
 * @returns {boolean} True if restaurant is currently open
 */
export const isOpen = (openTime, closeTime) => {
  if (!openTime || !closeTime) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  const [openHours, openMinutes] = openTime.split(':').map(Number);
  const openMinutesTotal = openHours * 60 + openMinutes;

  const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
  const closeMinutesTotal = closeHours * 60 + closeMinutes;

  // Handle cases where close time is next day (e.g., 02:00:00 means 2 AM next day)
  if (closeMinutesTotal < openMinutesTotal) {
    // Restaurant closes after midnight
    return currentTime >= openMinutesTotal || currentTime < closeMinutesTotal;
  } else {
    // Normal case: opens and closes same day
    return currentTime >= openMinutesTotal && currentTime < closeMinutesTotal;
  }
};