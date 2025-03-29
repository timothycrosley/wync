import React, { useState } from 'react';
import './TabBar.css';

function TabBar({ 
  tabs, 
  activeTabId, 
  onTabSelect, 
  onAddTab, 
  onRemoveTab, 
  onRenameTab, 
  onClearTab,
  onDuplicateTab
}) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [newTabName, setNewTabName] = useState('');

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

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onDoubleClick={() => handleTabDoubleClick(tab.id, tab.name)}
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
          Clear
        </button>
        <button className="tab-action-button" onClick={onDuplicateTab} title="Duplicate current tab">
          Duplicate
        </button>
        <button className="add-tab-button" onClick={onAddTab} title="Add new tab">
          +
        </button>
      </div>
    </div>
  );
}

export default TabBar; 