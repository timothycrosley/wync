import React, { useState } from 'react';

function AddPersonForm({ onAddPerson }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return; // Prevent adding empty names
    onAddPerson(name.trim());
    setName(''); // Clear input after adding
  };

  return (
    <form onSubmit={handleSubmit} className="add-person-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add new person"
      />
      <button type="submit">Add Person</button>
    </form>
  );
}

export default AddPersonForm;
