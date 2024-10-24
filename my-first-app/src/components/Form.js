import React from 'react';

function Form() {
    const handleSubmit = (event) => {
      event.preventDefault();
      // Handle form submission
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <input type="text" />
        <button type="submit">Submit</button>
      </form>
    );
  }

export default Form;