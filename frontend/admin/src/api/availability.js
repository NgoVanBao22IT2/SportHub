import apiClient from './apiClient';

/**
 * Check court availability and fetch pricing details for a given date & time interval.
 * @param {string} courtId
 * @param {string} date - Format: YYYY-MM-DD
 * @param {string} startTime - Format: HH:mm or HH:mm:ss
 * @param {string} endTime - Format: HH:mm or HH:mm:ss
 */
export const checkCourtAvailability = async (courtId, date, startTime, endTime) => {
  try {
    const response = await apiClient.get(`/availability/courts/${courtId}`, {
      params: {
        date,
        start_time: startTime,
        end_time: endTime,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking court availability:', error);
    throw error;
  }
};

/**
 * Fetch full daily availability matrix for a venue.
 * @param {string} venueId
 * @param {string} date - Format: YYYY-MM-DD
 */
export const getVenueDailyAvailability = async (venueId, date) => {
  try {
    const response = await apiClient.get(`/availability/venue/${venueId}`, {
      params: { date }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching venue daily availability:', error);
    throw error;
  }
};
