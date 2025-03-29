import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';
import ActivityPalette from './components/ActivityPalette';
import AddPersonForm from './components/AddPersonForm';
import AddActivityForm from './components/AddActivityForm';
import TabBar from './components/TabBar';
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
      return JSON.parse(savedSchedules);
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

  const timeSlots = generateTimeSlots('00:00', '24:00', 30); // Full 24 hours, 30 min intervals

  // Add mouse event handlers for the entire application
  useEffect(() => {
    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };
    
    // Add event listeners to the window
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
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

  // Get current schedule for active tab
  const getCurrentSchedule = () => {
    return schedules[activeTabId] || {};
  };

  // Handlers for tabs
  const handleAddTab = () => {
    const newTabId = `tab_${Date.now()}`;
    const newTabName = `${DEFAULT_TAB_NAME} ${tabs.length + 1}`;
    
    // Add new tab
    setTabs(prevTabs => [...prevTabs, { id: newTabId, name: newTabName }]);
    
    // Create new schedule based on the current active tab's schedule
    setSchedules(prevSchedules => ({
      ...prevSchedules,
      [newTabId]: JSON.parse(JSON.stringify(prevSchedules[activeTabId] || {}))
    }));
    
    // Set the new tab as active
    setActiveTabId(newTabId);
  };
  
  const handleRemoveTab = (tabId) => {
    if (tabs.length <= 1) return; // Don't remove the last tab
    
    if (window.confirm("Are you sure you want to remove this schedule tab?")) {
      // If removing the active tab, switch to another tab
      if (tabId === activeTabId) {
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        const newActiveIndex = tabIndex === 0 ? 1 : tabIndex - 1;
        setActiveTabId(tabs[newActiveIndex].id);
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

  // Handler to update an activity's color (accepts optional newColor)
  const updateActivityColor = useCallback((activityIdToUpdate, newColor = null) => {
    // Don't update the 'empty' activity color
    if (activityIdToUpdate === 'empty') return;

    // Use provided color or generate a random one
    const finalColor = newColor || getRandomColor(); 

    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === activityIdToUpdate 
          ? { ...activity, color: finalColor } // Use finalColor
          : activity
      )
    );
  }, []); // No dependencies needed as setActivities is stable

  // Function to update schedule state for current tab
  const updateScheduleForCell = useCallback((personId, timeSlot) => {
    setSchedules(prevSchedules => {
      const currentSchedule = prevSchedules[activeTabId] || {};
      if (currentSchedule[personId]?.[timeSlot] === selectedActivityId) {
        return prevSchedules;
      }
      
      console.log(`   Updating schedule for (${personId}, ${timeSlot}) in tab ${activeTabId}`);
      const updatedSchedule = {
        ...currentSchedule,
        [personId]: {
          ...(currentSchedule[personId] || {}),
          [timeSlot]: selectedActivityId,
        },
      };
      
      return {
        ...prevSchedules,
        [activeTabId]: updatedSchedule
      };
    });
  }, [activeTabId, selectedActivityId]);

  // Mouse drag handler
  const handleCellEnter = useCallback((personId, timeSlot) => {
      console.log(`   Cell Entered (${personId}, ${timeSlot}) - checking ref`);
      if (isMouseDownRef.current) { 
          console.log(`   --> Mouse is down, calling updateScheduleForCell`);
          updateScheduleForCell(personId, timeSlot);
      } else {
          console.log(`   --> Mouse is up, update blocked`);
      }
  }, [isMouseDownRef, updateScheduleForCell]);

  const getSelectedActivityColor = () => {
      const activity = activities.find(a => a.id === selectedActivityId);
      return activity ? activity.color : DEFAULT_COLOR;
  }

  return (
    <div className="App">
      <h1>Day Schedule Sync</h1>
      <div className="controls">
          <AddPersonForm onAddPerson={addPerson} />
          <AddActivityForm onAddActivity={addActivity} />
          <button onClick={clearAllData} className="clear-button">Clear All Data</button>
      </div>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onAddTab={handleAddTab}
        onRemoveTab={handleRemoveTab}
        onRenameTab={handleRenameTab}
      />
      <div className="layout-container">
          <ActivityPalette
              activities={activities}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
              onRemoveActivity={removeActivity}
              onUpdateActivityColor={updateActivityColor}
          />
          <ScheduleGrid
              people={people}
              timeSlots={timeSlots}
              schedule={getCurrentSchedule()}
              activities={activities}
              onCellUpdateDirect={updateScheduleForCell}
              onCellEnter={handleCellEnter}
              selectedActivityColor={getSelectedActivityColor()}
              onRemovePerson={removePerson}
          />
      </div>
    </div>
  );
}

export default App;
