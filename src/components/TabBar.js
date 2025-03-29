import React, { useState, useRef } from 'react';
import './TabBar.css';

function TabBar({ 
  tabs, 
  activeTabId, 
  onTabSelect, 
  onAddTab, 
  onRemoveTab, 
  onRenameTab, 
  onClearTab,
  onDuplicateTab,
  onReorderTabs,
  onClearAllData
}) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [newTabName, setNewTabName] = useState('');
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [dragOverTabId, setDragOverTabId] = useState(null);
  const dragCounterRef = useRef({});
  
  const handleTabClick = (tabId) => {
    if (editingTabId !== tabId) {
      onTabSelect(tabId);
    }
  };

  const handleTabDoubleClick = (tabId, currentName) => {
    setEditingTabId(tabId);
    setNewTabName(currentName);
  };

  const handleTabNameChange = (e) => {
    setNewTabName(e.target.value);
  };

  const handleTabNameSave = (tabId) => {
    if (newTabName.trim()) {
      onRenameTab(tabId, newTabName.trim());
    }
    setEditingTabId(null);
  };

  const handleTabNameKeyDown = (e, tabId) => {
    if (e.key === 'Enter') {
      handleTabNameSave(tabId);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
    }
  };

  const handleTabNameBlur = (tabId) => {
    handleTabNameSave(tabId);
  };
  
  // Drag and drop handlers
  const handleDragStart = (e, tabId) => {
    if (editingTabId) return; // Don't allow dragging while editing
    
    setDraggedTabId(tabId);
    // Set the drag image (optional - can customize later)
    // For now just make it semi-transparent
    e.currentTarget.style.opacity = '0.4';
    
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    // Set empty data (required for some browsers)
    e.dataTransfer.setData('text/plain', tabId);
  };
  
  const handleDragEnd = (e) => {
    setDraggedTabId(null);
    setDragOverTabId(null);
    // Reset opacity
    e.currentTarget.style.opacity = '1';
    // Reset all drag counter trackers
    dragCounterRef.current = {};
  };
  
  const handleDragOver = (e, tabId) => {
    // Necessary to allow dropping
    e.preventDefault();
    if (draggedTabId === tabId) return; // Can't drop on self
    
    setDragOverTabId(tabId);
  };
  
  const handleDragEnter = (e, tabId) => {
    e.preventDefault();
    if (draggedTabId === tabId) return; // Can't drop on self
    
    // Track enter counts to handle nested elements
    dragCounterRef.current[tabId] = (dragCounterRef.current[tabId] || 0) + 1;
    setDragOverTabId(tabId);
  };
  
  const handleDragLeave = (e, tabId) => {
    // Decrement counter and only clear dragOverTabId if completely left
    dragCounterRef.current[tabId] = (dragCounterRef.current[tabId] || 1) - 1;
    if (dragCounterRef.current[tabId] === 0) {
      if (dragOverTabId === tabId) {
        setDragOverTabId(null);
      }
    }
  };
  
  const handleDrop = (e, targetTabId) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId) return;
    
    // Reset visual states
    setDraggedTabId(null);
    setDragOverTabId(null);
    
    // Find indices for source and target
    const sourceIndex = tabs.findIndex(tab => tab.id === draggedTabId);
    const targetIndex = tabs.findIndex(tab => tab.id === targetTabId);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Create new array with reordered tabs
      const newTabs = [...tabs];
      const [movedTab] = newTabs.splice(sourceIndex, 1);
      newTabs.splice(targetIndex, 0, movedTab);
      
      // Call parent handler to update tabs order
      if (onReorderTabs) {
        onReorderTabs(newTabs);
      }
    }
  };

  return (
    <div className="tab-bar">
      <button className="add-tab-button" onClick={onAddTab} title="Add new tab">
        +
      </button>
      <div className="tabs-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''} ${dragOverTabId === tab.id ? 'drag-over' : ''} ${draggedTabId === tab.id ? 'dragging' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onDoubleClick={() => handleTabDoubleClick(tab.id, tab.name)}
            draggable={editingTabId !== tab.id}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragEnter={(e) => handleDragEnter(e, tab.id)}
            onDragLeave={(e) => handleDragLeave(e, tab.id)}
            onDrop={(e) => handleDrop(e, tab.id)}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={newTabName}
                onChange={handleTabNameChange}
                onKeyDown={(e) => handleTabNameKeyDown(e, tab.id)}
                onBlur={() => handleTabNameBlur(tab.id)}
                autoFocus
                className="tab-name-input"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tab-name">{tab.name}</span>
            )}
            {tabs.length > 1 && (
              <button
                className="tab-close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTab(tab.id);
                }}
                title="Close tab"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="tab-actions">
        <button className="tab-action-button" onClick={onClearTab} title="Clear current tab">
          Clear Tab
        </button>
        <button className="tab-action-button" onClick={onDuplicateTab} title="Duplicate current tab">
          Duplicate Tab
        </button>
        <button className="tab-action-button clear-all-button" onClick={onClearAllData} title="Clear all data including people, activities, and tabs">
          Clear All
        </button>
      </div>
    </div>
  );
}

export default TabBar; 