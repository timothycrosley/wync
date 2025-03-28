export const generateTimeSlots = (start, end, intervalMinutes) => {
    const slots = [];
    let [startHour, startMinute] = start.split(':').map(Number);
    let [endHour, endMinute] = end.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        slots.push(timeString);

        currentMinute += intervalMinutes;
        currentHour += Math.floor(currentMinute / 60);
        currentMinute %= 60;
    }

    return slots;
};
