import React from 'react';
import './ActivityPalette.css'; // We'll create this CSS file next

function ActivityPalette({ activities, selectedActivityId, onSelectActivity, onRemoveActivity }) {
  // Filter out the 'Empty' activity from the visible palette
  const displayActivities = activities.filter(a => a.id !== 'empty');

  const handleRemoveClick = (e, activityId) => {
    e.stopPropagation(); // Prevent selecting the activity when clicking remove
    onRemoveActivity(activityId);
  };

  return (
    <div className="activity-palette">
      <h3>Activities</h3>
      {/* Option to explicitly select 'Empty' to clear cells */}
       <div
        key="empty"
        className={`activity-item ${selectedActivityId === 'empty' ? 'selected' : ''}`}
        onClick={() => onSelectActivity('empty')}
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #ccc' }} // Style for empty
      >
        Clear Cell
      </div>
      {/* Display other activities with remove buttons */}
      {displayActivities.map(activity => (
        <div
          key={activity.id}
          className={`activity-item ${selectedActivityId === activity.id ? 'selected' : ''}`}
          onClick={() => onSelectActivity(activity.id)}
          style={{ backgroundColor: activity.color }}
        >
          <span className="activity-name">{activity.name}</span>
          <button 
            onClick={(e) => handleRemoveClick(e, activity.id)} 
            className="remove-button activity-remove-button" 
            title="Remove Activity"
          >
            ×
          </button>
        </div>
      ))}
      <p className="palette-instructions">Click an activity, then click on the grid to assign.</p>
    </div>
  );
}

export default ActivityPalette;
