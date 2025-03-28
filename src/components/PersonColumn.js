import React, { useMemo } from 'react';
import TimeSlotCell from './TimeSlotCell';
import './PersonColumn.css'; // Create CSS next

const TIME_INTERVAL_MINUTES = 30; // Assuming 30 min intervals as set in App.js

function PersonColumn({ person, timeSlots, schedule, getActivityById, onCellUpdate, onCellEnter, selectedActivityColor, onRemovePerson }) {

  // Calculate summaries
  const activitySummaries = useMemo(() => {
    const summaries = {};
    let unassignedMinutes = 0;

    timeSlots.forEach(slot => {
      const activityId = schedule[slot];
      if (activityId && activityId !== 'empty') {
        const activity = getActivityById(activityId);
        if (activity) {
          summaries[activityId] = (summaries[activityId] || 0) + TIME_INTERVAL_MINUTES;
        }
      } else {
        unassignedMinutes += TIME_INTERVAL_MINUTES;
      }
    });

    // Convert minutes to hours
    Object.keys(summaries).forEach(id => {
      summaries[id] = (summaries[id] / 60).toFixed(1); // Keep one decimal place
    });

    const unassignedHours = (unassignedMinutes / 60).toFixed(1);

    return { summaries, unassignedHours };
  }, [schedule, timeSlots, getActivityById]);

  const handleRemoveClick = (e) => {
    e.stopPropagation(); // Prevent triggering other clicks if needed
    onRemovePerson(person.id);
  };

  return (
    <div className="person-column">
      <div className="header-cell person-header-cell">
        <span className="person-name">{person.name}</span>
        <button onClick={handleRemoveClick} className="remove-button person-remove-button" title="Remove Person">×</button>
      </div>

      {/* Activity Summary Section */}
      <div className="activity-summary">
          {Object.entries(activitySummaries.summaries).map(([activityId, hours]) => {
              const activity = getActivityById(activityId);
              return activity ? (
                  <div key={activityId} className="summary-item">
                      <span className="summary-color" style={{ backgroundColor: activity.color }}></span>
                      <span className="summary-name">{activity.name}:</span>
                      <span className="summary-hours">{hours}h</span>
                  </div>
              ) : null;
          })}
          <div className="summary-item unassigned-summary">
              <span className="summary-color" style={{ backgroundColor: '#eee' }}></span>
              <span className="summary-name">Unassigned:</span>
              <span className="summary-hours">{activitySummaries.unassignedHours}h</span>
          </div>
      </div>

      {/* Time Slot Cells */}
      {timeSlots.map(slot => {
        const activityId = schedule[slot];
        const activity = activityId ? getActivityById(activityId) : getActivityById('empty');

        return (
          <TimeSlotCell
            key={slot}
            timeSlot={slot}
            personId={person.id}
            activity={activity}
            onUpdate={onCellUpdate}
            onEnter={onCellEnter}
            selectedActivityColor={selectedActivityColor}
          />
        );
      })}
    </div>
  );
}

export default PersonColumn;
