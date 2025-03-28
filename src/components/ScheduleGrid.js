import React from 'react';
import PersonColumn from './PersonColumn';
import './ScheduleGrid.css'; // We'll create this CSS file next

function ScheduleGrid({ 
  people, 
  timeSlots, 
  schedule, 
  activities, 
  onCellUpdate, // Renamed prop 
  onCellEnter, // Add new prop
  selectedActivityColor, 
  onRemovePerson // Add new prop
}) {

  // Find the activity object based on its ID
  const getActivityById = (id) => {
    return activities.find(a => a.id === id);
  };

  // Prevent default drag behavior which can interfere
  const handleDragStart = (e) => {
    e.preventDefault();
  }

  return (
    <div 
      className="schedule-grid-container"
      onDragStart={handleDragStart}
    >
        <div className="schedule-grid">
            {/* Time Slot Labels Column */}
            <div className="time-slots-column">
                <div className="header-cell time-header-cell">Time</div> {/* Header for time */}
                <div className="summary-space"></div> {/* Space for summaries */}
                {timeSlots.map(slot => (
                    <div key={slot} className="time-slot-label">{slot}</div>
                ))}
            </div>

            {/* Person Columns */}
            {people.map(person => (
                <PersonColumn
                    key={person.id}
                    person={person}
                    timeSlots={timeSlots}
                    schedule={schedule[person.id] || {}}
                    getActivityById={getActivityById}
                    onCellUpdate={onCellUpdate} // Pass down renamed prop
                    onCellEnter={onCellEnter} // Pass down new handler
                    selectedActivityColor={selectedActivityColor}
                    onRemovePerson={onRemovePerson} // Pass down handler
                />
            ))}
        </div>
    </div>

  );
}

export default ScheduleGrid;
