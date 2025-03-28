import React, { useState } from 'react';

function AddActivityForm({ onAddActivity }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return; // Prevent adding empty names
    onAddActivity(name.trim());
    setName(''); // Clear input after adding
  };

  return (
    <form onSubmit={handleSubmit} className="add-activity-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add new activity"
      />
      <button type="submit">Add Activity</button>
    </form>
  );
}

export default AddActivityForm;
