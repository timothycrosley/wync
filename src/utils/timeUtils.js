// Convert 24-hour time format to 12-hour AM/PM format
export const formatTimeToAMPM = (timeString) => {
  const [hour, minute] = timeString.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

export const generateTimeSlots = (start, end, intervalMinutes) => {
    const slots = [];
    let [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        // Store time in 24-hour format as the internal value
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        
        // Convert to AM/PM format for display
        const formattedTime = formatTimeToAMPM(timeString);
        
        // Store both formats as an object
        slots.push({
            value: timeString,       // 24-hour format for internal use
            display: formattedTime   // AM/PM format for display
        });

        currentMinute += intervalMinutes;
        currentHour += Math.floor(currentMinute / 60);
        currentMinute %= 60;
    }

    return slots;
};
