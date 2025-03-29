import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import TimeSlotCell from './TimeSlotCell';
import './PersonColumn.css'; // Create CSS next

const TIME_INTERVAL_MINUTES = 30; // Assuming 30 min intervals as set in App.js

function PersonColumn({ 
  person, 
  timeSlots, 
  schedule, 
  getActivityById, 
  onCellUpdateDirect, 
  onCellEnter, 
  onCellClick, 
  selectedActivityColor, 
  onRemovePerson,
  onRenamePerson
}) {
  // State for editing person name
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(person.name);

  // Calculate summaries
  const activitySummaries = useMemo(() => {
    const summaries = {};
    let unassignedMinutes = 0;

    timeSlots.forEach(slot => {
      const activityId = schedule[slot.value]; // Use slot.value for lookup
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

  // Handle double click to start editing
  const handleNameDoubleClick = (e) => {
    e.preventDefault();
    setIsEditing(true);
    setNewName(person.name);
  };

  // Handle name change
  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  // Handle save name
  const handleNameSave = () => {
    if (newName.trim()) {
      onRenamePerson(person.id, newName);
    }
    setIsEditing(false);
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNewName(person.name); // Reset to original
    }
  };

  // Handle blur
  const handleBlur = () => {
    handleNameSave();
  };

  return (
    <div className="person-column">
      <div className="header-cell person-header-cell">
        {isEditing ? (
          <input
            type="text"
            value={newName}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            className="person-name-input"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="person-name"
            onDoubleClick={handleNameDoubleClick}
            title="Double-click to rename"
          >
            {person.name}
          </span>
        )}
        <button onClick={handleRemoveClick} className="remove-button person-remove-button" title="Remove Person">×</button>
      </div>

      {/* Activity Summary Section */}
      <div className="activity-summary">
          {Object.entries(activitySummaries.summaries).length > 0 ? (
              // Only show activities if there are any
              Object.entries(activitySummaries.summaries).map(([activityId, hours]) => {
                  const activity = getActivityById(activityId);
                  return activity ? (
                      <div key={activityId} className="summary-item">
                          <span className="summary-color" style={{ backgroundColor: activity.color }}></span>
                          <span className="summary-name">{activity.name}:</span>
                          <span className="summary-hours">{hours}h</span>
                      </div>
                  ) : null;
              })
          ) : (
              // Show a message if no activities are assigned
              <div className="summary-item empty-message">
                  <span className="summary-name">No activities assigned</span>
              </div>
          )}
          <div className="summary-item unassigned-summary">
              <span className="summary-color" style={{ backgroundColor: '#eee' }}></span>
              <span className="summary-name">Unassigned:</span>
              <span className="summary-hours">{activitySummaries.unassignedHours}h</span>
          </div>
      </div>

      {/* Time Slot Cells */}
      {timeSlots.map(slot => {
        const activityId = schedule[slot.value] || 'empty'; // Default to empty if not found
        const activity = getActivityById(activityId);

        return (
          <TimeSlotCell
            key={slot.value}
            timeSlot={slot}
            personId={person.id}
            activity={activity}
            onUpdateDirect={onCellUpdateDirect}
            onEnter={onCellEnter}
            onClick={onCellClick}
            selectedActivityColor={selectedActivityColor}
          />
        );
      })}
    </div>
  );
}

export default PersonColumn;
