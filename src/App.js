import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';
import ActivityPalette from './components/ActivityPalette';
import AddPersonForm from './components/AddPersonForm';
import AddActivityForm from './components/AddActivityForm';
import TabBar from './components/TabBar';
import TabContent from './components/TabContent';
import InfoPopover from './components/InfoPopover';
import { generateTimeSlots } from './utils/timeUtils'; // We'll create this util later

const DEFAULT_COLOR = '#FFFFFF'; // White for empty slots
const DEFAULT_ACTIVITIES = [{ id: 'empty', name: 'Empty', color: DEFAULT_COLOR }];
const DEFAULT_TAB_NAME = 'Schedule';

// Function to generate random colors (we might improve this later)
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Maximum number of actions to keep in history
const MAX_HISTORY_SIZE = 50;

function App() {
  // State Initialization
  const [people, setPeople] = useState(() => {
    const savedPeople = localStorage.getItem('scheduleAppPeople');
    return savedPeople ? JSON.parse(savedPeople) : [];
  });

  const [activities, setActivities] = useState(() => {
    const savedActivities = localStorage.getItem('scheduleAppActivities');
    const parsedActivities = savedActivities ? JSON.parse(savedActivities) : [];
    // Ensure 'Empty' activity is always present and first
    const existingEmpty = parsedActivities.find(a => a.id === 'empty');
    if (!existingEmpty) {
        return [...DEFAULT_ACTIVITIES, ...parsedActivities];
    }
    // Make sure 'Empty' is first if it exists but isn't first
    return [
        ...DEFAULT_ACTIVITIES,
        ...parsedActivities.filter(a => a.id !== 'empty')
    ];
  });
  
  // Tabs state
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem('scheduleAppTabs');
    return savedTabs ? JSON.parse(savedTabs) : [
      { id: 'default', name: DEFAULT_TAB_NAME }
    ];
  });
  
  const [activeTabId, setActiveTabId] = useState(() => {
    const savedActiveTabId = localStorage.getItem('scheduleAppActiveTabId');
    return savedActiveTabId || 'default';
  });

  // Multi-schedule state
  const [schedules, setSchedules] = useState(() => {
    const savedSchedules = localStorage.getItem('scheduleAppSchedules');
    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules);
      // Ensure each tab has a schedule
      const tabs = JSON.parse(localStorage.getItem('scheduleAppTabs') || '[]');
      const defaultSchedules = {};
      tabs.forEach(tab => {
        if (!parsedSchedules[tab.id]) {
          defaultSchedules[tab.id] = {};
        }
      });
      return { ...defaultSchedules, ...parsedSchedules };
    }
    
    // Check if there's a legacy single schedule to migrate
    const legacySchedule = localStorage.getItem('scheduleAppSchedule');
    if (legacySchedule) {
      return { 'default': JSON.parse(legacySchedule) };
    }
    
    return { 'default': {} };
  });

  // Undo/Redo History State
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  const isActionInProgress = useRef(false);

  const [selectedActivityId, setSelectedActivityId] = useState('empty');
  const isMouseDownRef = useRef(false);

  const timeSlots = generateTimeSlots('00:00', '24:00', 30);

  // Add to history when state changes
  useEffect(() => {
    // Skip if the change is from an undo/redo operation
    if (isUndoRedoAction || isActionInProgress.current) {
      setIsUndoRedoAction(false);
      return;
    }

    // Create a snapshot of the current state
    const snapshot = {
      people: [...people],
      activities: [...activities],
      tabs: [...tabs],
      schedules: JSON.parse(JSON.stringify(schedules)),
      activeTabId
    };

    // If we're not at the end of history, truncate the future states
    if (historyIndex < history.length - 1) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
    } else {
      // Otherwise just append to history
      setHistory(prev => {
        // Keep history under maximum size
        const newHistory = [...prev, snapshot];
        if (newHistory.length > MAX_HISTORY_SIZE) {
          return newHistory.slice(newHistory.length - MAX_HISTORY_SIZE);
        }
        return newHistory;
      });
    }
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [people, activities, tabs, schedules, activeTabId]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isActionInProgress.current = true;
      const prevState = history[historyIndex - 1];
      
      // Apply previous state
      setPeople(prevState.people);
      setActivities(prevState.activities);
      setTabs(prevState.tabs);
      setSchedules(prevState.schedules);
      setActiveTabId(prevState.activeTabId);
      
      // Mark that we're undoing to prevent adding to history
      setIsUndoRedoAction(true);
      setHistoryIndex(prev => prev - 1);
      
      setTimeout(() => {
        isActionInProgress.current = false;
      }, 0);
    }
  }, [history, historyIndex]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isActionInProgress.current = true;
      const nextState = history[historyIndex + 1];
      
      // Apply next state
      setPeople(nextState.people);
      setActivities(nextState.activities);
      setTabs(nextState.tabs);
      setSchedules(nextState.schedules);
      setActiveTabId(nextState.activeTabId);
      
      // Mark that we're redoing to prevent adding to history
      setIsUndoRedoAction(true);
      setHistoryIndex(prev => prev + 1);
      
      setTimeout(() => {
        isActionInProgress.current = false;
      }, 0);
    }
  }, [history, historyIndex]);

  // Add mouse event handlers for the entire application
  useEffect(() => {
    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };
    
    // Support for keyboard shortcuts only
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    // Add event listeners to the window
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Effect to save data to Local Storage whenever it changes
  useEffect(() => {
    localStorage.setItem('scheduleAppPeople', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    // Filter out the default 'Empty' activity before saving
    const activitiesToSave = activities.filter(a => a.id !== 'empty');
    localStorage.setItem('scheduleAppActivities', JSON.stringify(activitiesToSave));
  }, [activities]);
  
  useEffect(() => {
    localStorage.setItem('scheduleAppTabs', JSON.stringify(tabs));
  }, [tabs]);
  
  useEffect(() => {
    localStorage.setItem('scheduleAppActiveTabId', activeTabId);
  }, [activeTabId]);
  
  useEffect(() => {
    localStorage.setItem('scheduleAppSchedules', JSON.stringify(schedules));
  }, [schedules]);

  // Initialize schedule for new people
  useEffect(() => {
    setSchedules(prevSchedules => {
      const newSchedules = { ...prevSchedules };
      let schedulesUpdated = false;
      
      // Update each tab's schedule
      Object.keys(newSchedules).forEach(tabId => {
        const schedule = newSchedules[tabId] || {};
        let scheduleUpdated = false;
        
        people.forEach(person => {
          if (!schedule[person.id]) {
            schedule[person.id] = {};
            timeSlots.forEach(slot => {
              schedule[person.id][slot.value] = 'empty'; // Use slot.value (24h format) as key
            });
            scheduleUpdated = true;
          } else {
            // Ensure all current timeslots exist for the person
            timeSlots.forEach(slot => {
              if (schedule[person.id][slot.value] === undefined) {
                schedule[person.id][slot.value] = 'empty';
                scheduleUpdated = true;
              }
            });
            // Clean up old timeslots no longer in use (optional)
            Object.keys(schedule[person.id]).forEach(existingSlot => {
              if (!timeSlots.some(slot => slot.value === existingSlot)) {
                delete schedule[person.id][existingSlot];
                scheduleUpdated = true;
              }
            });
          }
        });
        
        // Clean up schedule entries for people who no longer exist (optional)
        Object.keys(schedule).forEach(personId => {
          if (!people.some(p => p.id === personId)) {
            delete schedule[personId];
            scheduleUpdated = true;
          }
        });
        
        if (scheduleUpdated) {
          newSchedules[tabId] = schedule;
          schedulesUpdated = true;
        }
      });

      return schedulesUpdated ? newSchedules : prevSchedules;
    });
  }, [people, timeSlots, tabs]); // Rerun if people, timeSlots, or tabs change

  // Ensure all tabs have valid schedules on component mount
  useEffect(() => {
    setSchedules(prevSchedules => {
      const newSchedules = { ...prevSchedules };
      let needsUpdate = false;
      
      // Make sure each tab has a schedule
      tabs.forEach(tab => {
        if (!newSchedules[tab.id]) {
          console.log(`Creating missing schedule for tab ${tab.id}`);
          newSchedules[tab.id] = {};
          needsUpdate = true;
        }
      });
      
      // Clean up orphaned schedules (no matching tab)
      Object.keys(newSchedules).forEach(scheduleId => {
        if (!tabs.some(tab => tab.id === scheduleId)) {
          console.log(`Removing orphaned schedule for deleted tab ${scheduleId}`);
          delete newSchedules[scheduleId];
          needsUpdate = true;
        }
      });
      
      return needsUpdate ? newSchedules : prevSchedules;
    });
  }, [tabs]); // Run when tabs change

  // Handler for when tab is selected
  const handleTabSelect = useCallback((tabId) => {
    console.log(`Switching to tab: ${tabId}`);
    setActiveTabId(tabId);
    // Force a re-render of the schedule grid by toggling a state value
    setForceUpdate(prev => !prev);
  }, []);
  
  // Add a state to force updates
  const [forceUpdate, setForceUpdate] = useState(false);

  // Clear all cells in the current tab
  const clearTab = useCallback((tabId = null) => {
    const targetTabId = tabId || activeTabId;
    
    if (window.confirm(`Are you sure you want to clear all assignments in the "${tabs.find(t => t.id === targetTabId)?.name}" tab?`)) {
      setSchedules(prevSchedules => {
        const currentSchedule = prevSchedules[targetTabId] || {};
        const clearedSchedule = {};
        
        // Preserve the people structure but reset all assignments to 'empty'
        Object.keys(currentSchedule).forEach(personId => {
          clearedSchedule[personId] = {};
          timeSlots.forEach(slot => {
            clearedSchedule[personId][slot.value] = 'empty';
          });
        });
        
        return {
          ...prevSchedules,
          [targetTabId]: clearedSchedule
        };
      });
    }
  }, [activeTabId, tabs, timeSlots]);
  
  // Duplicate the current tab
  const duplicateTab = useCallback(() => {
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (!currentTab) return;
    
    const newTabId = `tab_${Date.now()}`;
    const newTabName = `${currentTab.name} (Copy)`;
    
    // Add new tab
    setTabs(prevTabs => [...prevTabs, { id: newTabId, name: newTabName }]);
    
    // Copy the current tab's schedule
    setSchedules(prevSchedules => {
      const currentSchedule = prevSchedules[activeTabId] || {};
      return {
        ...prevSchedules,
        [newTabId]: JSON.parse(JSON.stringify(currentSchedule))
      };
    });
    
    // Set the new tab as active
    handleTabSelect(newTabId);
  }, [activeTabId, tabs, handleTabSelect]);

  // Handlers for tabs
  const handleAddTab = () => {
    const newTabId = `tab_${Date.now()}`;
    const newTabName = `${DEFAULT_TAB_NAME} ${tabs.length + 1}`;
    
    // Add new tab
    setTabs(prevTabs => [...prevTabs, { id: newTabId, name: newTabName }]);
    
    // Create a new blank schedule (not copying the current tab)
    setSchedules(prevSchedules => {
      // Create empty schedule with entries for all people
      const emptySchedule = {};
      people.forEach(person => {
        emptySchedule[person.id] = {};
        timeSlots.forEach(slot => {
          emptySchedule[person.id][slot.value] = 'empty';
        });
      });
      
      return {
        ...prevSchedules,
        [newTabId]: emptySchedule
      };
    });
    
    // Set the new tab as active
    handleTabSelect(newTabId);
  };
  
  const handleRemoveTab = (tabId) => {
    if (tabs.length <= 1) return; // Don't remove the last tab
    
    if (window.confirm("Are you sure you want to remove this schedule tab?")) {
      // If removing the active tab, switch to another tab
      if (tabId === activeTabId) {
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        const newActiveIndex = tabIndex === 0 ? 1 : tabIndex - 1;
        handleTabSelect(tabs[newActiveIndex].id);
      }
      
      // Remove tab
      setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
      
      // Remove schedule
      setSchedules(prevSchedules => {
        const newSchedules = { ...prevSchedules };
        delete newSchedules[tabId];
        return newSchedules;
      });
    }
  };
  
  const handleRenameTab = (tabId, newName) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId ? { ...tab, name: newName } : tab
      )
    );
  };

  // Function to rename a person
  const renamePerson = useCallback((personId, newName) => {
    if (!newName.trim()) return; // Prevent empty names
    
    // Check for duplicate names
    if (people.some(p => p.name === newName.trim() && p.id !== personId)) {
      alert('A person with this name already exists.');
      return;
    }
    
    // Update the person's name
    setPeople(prevPeople => 
      prevPeople.map(person => 
        person.id === personId ? { ...person, name: newName.trim() } : person
      )
    );
  }, [people]);

  // Handlers for people and activities
  const addPerson = (name) => {
    if (name && !people.some(p => p.name === name)) {
      const newPerson = { id: Date.now().toString(), name }; // Simple ID generation
      setPeople(prevPeople => [...prevPeople, newPerson]);
    } else {
      alert('Person name cannot be empty or duplicate.');
    }
  };

  const addActivity = (name) => {
    if (name && !activities.some(a => a.name === name && a.id !== 'empty')) {
      const newActivity = { id: Date.now().toString(), name, color: getRandomColor() };
      setActivities(prevActivities => [...prevActivities, newActivity]);
    } else {
       alert('Activity name cannot be empty or duplicate.');
    }
  };

  const removePerson = (personIdToRemove) => {
    if (window.confirm("Are you sure you want to remove this person from all schedules?")) {
        // Remove from people state
        setPeople(prevPeople => prevPeople.filter(p => p.id !== personIdToRemove));
        
        // Remove from all schedules
        setSchedules(prevSchedules => {
          const newSchedules = { ...prevSchedules };
          Object.keys(newSchedules).forEach(tabId => {
            if (newSchedules[tabId][personIdToRemove]) {
              delete newSchedules[tabId][personIdToRemove];
            }
          });
          return newSchedules;
        });
    }
  };

  const removeActivity = (activityIdToRemove) => {
     // Prevent removing the default 'empty' activity
     if (activityIdToRemove === 'empty') return;

     if (window.confirm("Are you sure you want to remove this activity? It will be cleared from all schedules.")) {
        // Remove from activities state
        setActivities(prevActivities => prevActivities.filter(a => a.id !== activityIdToRemove));
        
        // If the removed activity was selected, select 'empty'
        if (selectedActivityId === activityIdToRemove) {
            setSelectedActivityId('empty');
        }

        // Update all schedules: replace removed activityId with 'empty'
        setSchedules(prevSchedules => {
          const newSchedules = { ...prevSchedules };
          Object.keys(newSchedules).forEach(tabId => {
            const schedule = newSchedules[tabId];
            Object.keys(schedule).forEach(personId => {
              Object.keys(schedule[personId]).forEach(timeSlot => {
                if (schedule[personId][timeSlot] === activityIdToRemove) {
                  schedule[personId][timeSlot] = 'empty';
                }
              });
            });
          });
          return newSchedules;
        });
     }
  };

  const clearAllData = () => {
      if (window.confirm("Are you sure you want to clear all people, activities, and schedule data?")) {
          setPeople([]);
          setActivities([...DEFAULT_ACTIVITIES]); // Reset to just the default 'empty'
          
          // Reset to a single default tab
          setTabs([{ id: 'default', name: DEFAULT_TAB_NAME }]);
          setActiveTabId('default');
          
          // Clear all schedules
          setSchedules({ 'default': {} });
          
          setSelectedActivityId('empty');
      }
  };

  // Handler to update an activity's color (accepts optional newColor and newName)
  const updateActivityColor = useCallback((activityIdToUpdate, newColor = null, newName = null) => {
    // Don't update the 'empty' activity color
    if (activityIdToUpdate === 'empty') return;

    // Use provided color or generate a random one
    const finalColor = newColor || getRandomColor(); 

    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === activityIdToUpdate 
          ? { 
              ...activity, 
              color: finalColor,
              // Update name if provided
              ...(newName !== null ? { name: newName } : {})
            } 
          : activity
      )
    );
  }, []); // No dependencies needed as setActivities is stable

  // Function to update schedule state for specific tab
  const updateScheduleForCell = useCallback((personId, timeSlot, specificTabId = null) => {
    // Use provided tabId or fall back to active tab
    const targetTabId = specificTabId || activeTabId;
    
    console.log(`Updating schedule for tab ${targetTabId}, person ${personId}, timeslot ${timeSlot}`);
    
    setSchedules(prevSchedules => {
      const currentSchedule = prevSchedules[targetTabId] || {};
      
      // Only update if the activity is changing
      if (currentSchedule[personId]?.[timeSlot] === selectedActivityId) {
        console.log(`Cell already has selected activity, skipping update`);
        return prevSchedules;
      }
      
      console.log(`Updating cell in tab ${targetTabId} with activity ${selectedActivityId}`);
      
      // Create a new schedule object for this tab
      const updatedSchedule = {
        ...currentSchedule,
        [personId]: {
          ...(currentSchedule[personId] || {}),
          [timeSlot]: selectedActivityId,
        },
      };
      
      // Create a new schedules object with the updated tab schedule
      const newSchedules = {
        ...prevSchedules,
        [targetTabId]: updatedSchedule
      };
      
      console.log(`Updated schedules:`, Object.keys(newSchedules).map(id => ({ id, peopleCount: Object.keys(newSchedules[id]).length })));
      
      return newSchedules;
    });
  }, [activeTabId, selectedActivityId]);

  // Mouse drag handler
  const handleCellEnter = useCallback((personId, timeSlot, specificTabId = null) => {
      console.log(`Cell Entered (${personId}, ${timeSlot}) - checking ref`);
      if (isMouseDownRef.current) { 
          console.log(`Mouse is down, calling updateScheduleForCell`);
          updateScheduleForCell(personId, timeSlot, specificTabId);
      } else {
          console.log(`Mouse is up, update blocked`);
      }
  }, [isMouseDownRef, updateScheduleForCell]);

  // Function to handle direct cell click (separate from drag)
  const handleCellClick = useCallback((personId, timeSlot, specificTabId = null) => {
      updateScheduleForCell(personId, timeSlot, specificTabId);
  }, [updateScheduleForCell]);

  const getSelectedActivityColor = () => {
      const activity = activities.find(a => a.id === selectedActivityId);
      return activity ? activity.color : DEFAULT_COLOR;
  }

  // Get current schedule for active tab
  const getCurrentSchedule = useCallback(() => {
    // Ensure the schedule exists for the active tab
    if (!schedules[activeTabId]) {
      console.log(`No schedule found for tab ${activeTabId}, creating empty one`);
      setSchedules(prev => ({ ...prev, [activeTabId]: {} }));
      return {};
    }
    console.log(`Loaded schedule for tab ${activeTabId}:`, Object.keys(schedules[activeTabId]));
    return schedules[activeTabId];
  }, [activeTabId, schedules]);

  // Handle tab reordering from drag and drop
  const handleReorderTabs = useCallback((newTabsOrder) => {
    setTabs(newTabsOrder);
  }, []);

  // Export all data to a JSON file
  const exportData = useCallback(() => {
    // Prompt user for filename
    const defaultFilename = `schedule_${new Date().toISOString().split('T')[0]}`;
    const filename = prompt("Enter filename for export:", defaultFilename);
    
    // If user cancels or enters empty string, abort
    if (!filename || !filename.trim()) return;
    
    // Create a JSON object with all the application data
    const exportData = {
      people,
      activities: activities.filter(a => a.id !== 'empty'), // Don't export the empty activity
      tabs,
      schedules,
      activeTabId
    };

    // Convert to a JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob with the data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Add .json extension if not already present
    const filenameWithExtension = filename.trim().endsWith('.json') 
      ? filename.trim() 
      : `${filename.trim()}.json`;
      
    link.download = filenameWithExtension;
    
    // Append to the document, click to download, then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [people, activities, tabs, schedules, activeTabId]);

  // Import data from a JSON file
  const importData = useCallback((event) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        // Parse the JSON data
        const importedData = JSON.parse(e.target.result);
        
        // Validate the imported data has required structures
        if (!importedData.people || !importedData.activities || 
            !importedData.tabs || !importedData.schedules) {
          alert("Invalid schedule file format!");
          return;
        }
        
        // Confirm before overwriting
        if (window.confirm("This will replace all your current data. Are you sure you want to continue?")) {
          // Update all application state with imported data
          setPeople(importedData.people);
          
          // Ensure we have the empty activity
          const emptyActivity = activities.find(a => a.id === 'empty');
          setActivities([emptyActivity, ...importedData.activities]);
          
          setTabs(importedData.tabs);
          setSchedules(importedData.schedules);
          
          // Set active tab id if valid, otherwise use the first tab
          if (importedData.activeTabId && importedData.tabs.some(tab => tab.id === importedData.activeTabId)) {
            setActiveTabId(importedData.activeTabId);
          } else if (importedData.tabs.length > 0) {
            setActiveTabId(importedData.tabs[0].id);
          }
          
          // Clear selected activity
          setSelectedActivityId('empty');
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert("Error importing data: " + error.message);
      }
    };
    
    if (event.target.files[0]) {
      fileReader.readAsText(event.target.files[0]);
    }
    
    // Reset the file input so the same file can be loaded again if needed
    event.target.value = '';
  }, [activities]);

  // Handle file input click for import
  const handleImportClick = useCallback(() => {
    document.getElementById('file-import').click();
  }, []);

  return (
    <div className="App">
      {/* Hidden file input for importing */}
      <input 
        type="file" 
        id="file-import" 
        accept=".json" 
        style={{ display: 'none' }} 
        onChange={importData}
      />
      
      <div className="layout-container">
          <ActivityPalette
              activities={activities}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
              onRemoveActivity={removeActivity}
              onUpdateActivityColor={updateActivityColor}
              onAddActivity={addActivity}
          />
          
          <div className="tabs-content-container">
            {/* Render a TabContent for each tab but only show the active one */}
            {tabs.map(tab => (
              <TabContent
                key={`tab-content-${tab.id}`}
                tabId={tab.id}
                isActive={tab.id === activeTabId}
                people={people}
                timeSlots={timeSlots}
                schedule={schedules[tab.id] || {}}
                activities={activities}
                onCellUpdateDirect={updateScheduleForCell}
                onCellEnter={handleCellEnter}
                onCellClick={handleCellClick}
                selectedActivityColor={getSelectedActivityColor()}
                onRemovePerson={removePerson}
                onRenamePerson={renamePerson}
                onAddPerson={addPerson}
              />
            ))}
          </div>
      </div>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={handleTabSelect}
        onAddTab={handleAddTab}
        onRemoveTab={handleRemoveTab}
        onRenameTab={handleRenameTab}
        onClearTab={() => clearTab()}
        onDuplicateTab={duplicateTab}
        onReorderTabs={handleReorderTabs}
        onClearAllData={clearAllData}
        onExport={exportData}
        onImport={handleImportClick}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      
      {/* Info Popover */}
      <InfoPopover />
    </div>
  );
}

export default App;
