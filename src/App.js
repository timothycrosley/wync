import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';
import ActivityPalette from './components/ActivityPalette';
import AddPersonForm from './components/AddPersonForm';
import AddActivityForm from './components/AddActivityForm';
import TabBar from './components/TabBar';
import TabContent from './components/TabContent';
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

  const [selectedActivityId, setSelectedActivityId] = useState('empty');
  const isMouseDownRef = useRef(false);
  const tabKeyPressedRef = useRef(false);

  const timeSlots = generateTimeSlots('00:00', '24:00', 30); // Full 24 hours, 30 min intervals

  // Add mouse event handlers for the entire application
  useEffect(() => {
    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };
    
    // Support for multi-selection with Tab key or Ctrl/Cmd key
    const handleKeyDown = (e) => {
      // Tab key or Ctrl/Cmd key for multi-selection
      if (e.key === 'Tab' || e.key === 'Control' || e.key === 'Meta') {
        // Only prevent default for Tab, as it would change focus
        if (e.key === 'Tab') {
          e.preventDefault();
        }
        tabKeyPressedRef.current = true;
        document.body.classList.add('tab-key-pressed');
      }
      
      // Escape key shortcut to select 'empty' activity
      if (e.key === 'Escape' && tabKeyPressedRef.current) {
        setSelectedActivityId('empty');
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Tab' || e.key === 'Control' || e.key === 'Meta') {
        // Only prevent default for Tab, as it would change focus
        if (e.key === 'Tab') {
          e.preventDefault();
        }
        tabKeyPressedRef.current = false;
        document.body.classList.remove('tab-key-pressed');
        // Clear active cell indicators
        const activeElements = document.querySelectorAll('.tab-key-active');
        activeElements.forEach(el => {
          el.classList.remove('tab-key-active');
        });
      }
    };
    
    // Add event listeners to the window
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.classList.remove('tab-key-pressed');
    };
  }, []);

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
      if (isMouseDownRef.current || tabKeyPressedRef.current) { 
          console.log(`Mouse is down or Tab is pressed, calling updateScheduleForCell`);
          updateScheduleForCell(personId, timeSlot, specificTabId);
          
          // Mark the cell as active when using Tab key
          if (tabKeyPressedRef.current) {
            const cell = document.querySelector(`.time-slot-cell[data-person-id="${personId}"][data-time-slot="${timeSlot}"]`);
            if (cell) {
              cell.classList.add('tab-key-active');
            }
          }
      } else {
          console.log(`Mouse is up, update blocked`);
      }
  }, [isMouseDownRef, tabKeyPressedRef, updateScheduleForCell]);

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

  return (
    <div className="App">
      <div className="controls">
          <AddPersonForm onAddPerson={addPerson} />
          <AddActivityForm onAddActivity={addActivity} />
          <button onClick={clearAllData} className="clear-button">Clear All Data</button>
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
      />
      <div className="layout-container">
          <ActivityPalette
              activities={activities}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
              onRemoveActivity={removeActivity}
              onUpdateActivityColor={updateActivityColor}
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
              />
            ))}
          </div>
      </div>
    </div>
  );
}

export default App;
