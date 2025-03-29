import React, { useCallback } from 'react';
import ScheduleGrid from './ScheduleGrid';
import './TabContent.css';

// TabContent component to isolate each tab's content
const TabContent = React.memo(({ 
  tabId, 
  isActive,
  people,
  timeSlots,
  schedule,
  activities,
  onCellUpdateDirect,
  onCellEnter,
  onCellClick,
  selectedActivityColor,
  onRemovePerson,
  onRenamePerson,
  onAddPerson
}) => {
  // Create tab-specific event handlers
  const handleCellUpdateDirect = useCallback((personId, timeSlot) => {
    console.log(`Direct cell update in tab ${tabId}:`, personId, timeSlot);
    onCellUpdateDirect(personId, timeSlot, tabId);
  }, [tabId, onCellUpdateDirect]);
  
  const handleCellEnter = useCallback((personId, timeSlot) => {
    onCellEnter(personId, timeSlot, tabId);
  }, [tabId, onCellEnter]);
  
  const handleCellClick = useCallback((personId, timeSlot) => {
    onCellClick(personId, timeSlot, tabId);
  }, [tabId, onCellClick]);
  
  // Check if this schedule is empty (all cells set to empty)
  const isEmptySchedule = useCallback(() => {
    if (!schedule || Object.keys(schedule).length === 0) return true;
    
    // Check if all cells are 'empty'
    for (const personId in schedule) {
      for (const timeSlot in schedule[personId]) {
        if (schedule[personId][timeSlot] !== 'empty') {
          return false;
        }
      }
    }
    return true;
  }, [schedule]);
  
  const isEmpty = isEmptySchedule();
  
  console.log(`Rendering TabContent for ${tabId}, active: ${isActive}, empty: ${isEmpty}`);
  
  // Only render content if this tab is active
  if (!isActive) return null;
  
  return (
    <div className="tab-content">
      {/* Empty state indicator */}
      {isEmpty && people.length > 0 && (
        <div className="empty-schedule-indicator">
          <p>This schedule is empty. Start by selecting an activity and clicking on a cell to assign it.</p>
        </div>
      )}
      
      {/* Regular grid */}
      <ScheduleGrid
        key={`schedule-grid-${tabId}`}
        people={people}
        timeSlots={timeSlots}
        schedule={schedule}
        activities={activities}
        onCellUpdateDirect={handleCellUpdateDirect}
        onCellEnter={handleCellEnter}
        onCellClick={handleCellClick}
        selectedActivityColor={selectedActivityColor}
        onRemovePerson={onRemovePerson}
        onRenamePerson={onRenamePerson}
        onAddPerson={onAddPerson}
      />
    </div>
  );
});

export default TabContent; 