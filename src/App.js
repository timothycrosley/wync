import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import ScheduleGrid from './components/ScheduleGrid';
import ActivityPalette from './components/ActivityPalette';
import AddPersonForm from './components/AddPersonForm';
import AddActivityForm from './components/AddActivityForm';
import { generateTimeSlots } from './utils/timeUtils'; // We'll create this util later

const DEFAULT_COLOR = '#FFFFFF'; // White for empty slots
const DEFAULT_ACTIVITIES = [{ id: 'empty', name: 'Empty', color: DEFAULT_COLOR }];

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

  const [schedule, setSchedule] = useState(() => {
    const savedSchedule = localStorage.getItem('scheduleAppSchedule');
    return savedSchedule ? JSON.parse(savedSchedule) : {};
  });

  const [selectedActivityId, setSelectedActivityId] = useState('empty');
  const isMouseDownRef = useRef(false);

  const timeSlots = generateTimeSlots('00:00', '24:00', 30); // Full 24 hours, 30 min intervals

  // Global mouse listeners effect
  useEffect(() => {
    const handleGlobalMouseDown = () => {
      console.log("GLOBAL MOUSE DOWN - Setting ref to true"); // --- DEBUG LOG --- 
      isMouseDownRef.current = true;
    };
    const handleGlobalMouseUp = () => {
      console.log("GLOBAL MOUSE UP - Setting ref to false"); // --- DEBUG LOG --- 
      isMouseDownRef.current = false;
    };

    window.addEventListener('mousedown', handleGlobalMouseDown);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    // Cleanup function
    return () => {
      console.log("Removing window listeners");
      window.removeEventListener('mousedown', handleGlobalMouseDown);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // Effect to load data from Local Storage on mount (already done in useState initializers)

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
    localStorage.setItem('scheduleAppSchedule', JSON.stringify(schedule));
  }, [schedule]);

  // Initialize schedule for new people
  useEffect(() => {
    setSchedule(prevSchedule => {
      const newSchedule = { ...prevSchedule };
      let scheduleUpdated = false;
      people.forEach(person => {
        if (!newSchedule[person.id]) {
          newSchedule[person.id] = {};
          timeSlots.forEach(slot => {
            newSchedule[person.id][slot] = 'empty'; // Default to 'empty' activity
          });
          scheduleUpdated = true;
        } else {
          // Ensure all current timeslots exist for the person
          timeSlots.forEach(slot => {
            if (newSchedule[person.id][slot] === undefined) {
                newSchedule[person.id][slot] = 'empty';
                scheduleUpdated = true;
            }
          });
           // Clean up old timeslots no longer in use (optional)
           Object.keys(newSchedule[person.id]).forEach(existingSlot => {
               if (!timeSlots.includes(existingSlot)) {
                   delete newSchedule[person.id][existingSlot];
                   scheduleUpdated = true;
               }
           });
        }
      });
       // Clean up schedule entries for people who no longer exist (optional)
       Object.keys(newSchedule).forEach(personId => {
           if (!people.some(p => p.id === personId)) {
               delete newSchedule[personId];
               scheduleUpdated = true;
           }
       });

      return scheduleUpdated ? newSchedule : prevSchedule;
    });
  }, [people, timeSlots]); // Rerun if people or timeSlots change

  // Handlers
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
    if (window.confirm("Are you sure you want to remove this person and their schedule?")) {
        // Remove from people state
        setPeople(prevPeople => prevPeople.filter(p => p.id !== personIdToRemove));
        // Remove from schedule state
        setSchedule(prevSchedule => {
            const newSchedule = { ...prevSchedule };
            delete newSchedule[personIdToRemove];
            return newSchedule;
        });
    }
  };

  const removeActivity = (activityIdToRemove) => {
     // Prevent removing the default 'empty' activity
     if (activityIdToRemove === 'empty') return;

     if (window.confirm("Are you sure you want to remove this activity? It will be cleared from the schedule.")) {
        // Remove from activities state
        setActivities(prevActivities => prevActivities.filter(a => a.id !== activityIdToRemove));
        
        // If the removed activity was selected, select 'empty'
        if (selectedActivityId === activityIdToRemove) {
            setSelectedActivityId('empty');
        }

        // Update schedule: replace removed activityId with 'empty'
        setSchedule(prevSchedule => {
            const newSchedule = { ...prevSchedule };
            Object.keys(newSchedule).forEach(personId => {
                Object.keys(newSchedule[personId]).forEach(timeSlot => {
                    if (newSchedule[personId][timeSlot] === activityIdToRemove) {
                        newSchedule[personId][timeSlot] = 'empty';
                    }
                });
            });
            return newSchedule;
        });
     }
  };

  const clearAllData = () => {
      if (window.confirm("Are you sure you want to clear all people, activities, and schedule data?")) {
          setPeople([]);
          setActivities([...DEFAULT_ACTIVITIES]); // Reset to just the default 'empty'
          setSchedule({});
          setSelectedActivityId('empty');
          // Local storage will be updated by the useEffect hooks
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

  const updateCell = useCallback((personId, timeSlot, checkMouseDown = false) => {
    console.log(`   updateCell (${personId}, ${timeSlot}): checkMouseDown=${checkMouseDown}, isMouseDownRef.current=${isMouseDownRef.current}`); 
    if (checkMouseDown && !isMouseDownRef.current) {
        console.log(`   Update blocked for (${personId}, ${timeSlot}) - ref is false`);
        return;
    }
    // Defer the state update slightly to prevent interfering with mouseup event detection
    setTimeout(() => {
      setSchedule(prevSchedule => {
        // Check if the cell already has the target activity (important inside timeout)
        if (prevSchedule[personId]?.[timeSlot] === selectedActivityId) {
          return prevSchedule;
        }
        console.log(`   Updating schedule for (${personId}, ${timeSlot}) [via setTimeout]`);
        const newSchedule = {
          ...prevSchedule,
          [personId]: {
            ...(prevSchedule[personId] || {}),
            [timeSlot]: selectedActivityId,
          },
        };
        return newSchedule;
      });
    }, 0); // Timeout of 0 ms defers execution until after current event loop cycle
  }, [selectedActivityId, isMouseDownRef]);

  const handleCellEnter = useCallback((personId, timeSlot) => {
      console.log(`   Cell Entered (${personId}, ${timeSlot}) - calling updateCell with check`);
      updateCell(personId, timeSlot, true);
  }, [updateCell]);

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
              schedule={schedule}
              activities={activities}
              onCellUpdate={updateCell}
              onCellEnter={handleCellEnter}
              selectedActivityColor={getSelectedActivityColor()}
              onRemovePerson={removePerson}
          />
      </div>
    </div>
  );
}

export default App;
