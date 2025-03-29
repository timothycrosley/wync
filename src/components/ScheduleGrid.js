import React, { useCallback } from 'react';
import PersonColumn from './PersonColumn';
import './ScheduleGrid.css'; // We'll create this CSS file next

function ScheduleGrid({ 
  people, 
  timeSlots, 
  schedule, 
  activities, 
  onCellUpdateDirect,
  onCellEnter,
  onCellClick,
  selectedActivityColor, 
  onRemovePerson,
  onRenamePerson
}) {

  const getActivityById = useCallback((id) => {
    return activities.find(a => a.id === id) || { id: 'empty', name: 'Empty', color: '#FFFFFF' };
  }, [activities]);

  // Prevent default drag behavior which can interfere
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  }

  // Prevent text selection during drag
  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  }

  return (
    <div 
      className="schedule-grid-container"
      onDragStart={handleDragStart}
      onSelectStart={handleSelectStart}
      onMouseDown={(e) => e.preventDefault()}
    >
        <div className="schedule-grid grid-aligned">
            {/* Time Slot Labels Column */}
            <div className="time-slots-column column-aligned">
                <div className="header-cell time-header-cell">Time</div> {/* Header for time */}
                <div className="summary-space"></div> {/* Space for summaries */}
                {timeSlots.map(slot => (
                    <div key={slot.value} className="time-slot-label">
                        {slot.display}
                    </div>
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
                    onCellUpdateDirect={onCellUpdateDirect}
                    onCellEnter={onCellEnter}
                    onCellClick={onCellClick}
                    selectedActivityColor={selectedActivityColor}
                    onRemovePerson={onRemovePerson}
                    onRenamePerson={onRenamePerson}
                />
            ))}
        </div>
    </div>

  );
}

export default ScheduleGrid;
