import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.climbing_center]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // You would typically send this data to an API here
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={handleSubmit}>
          <label htmlFor="climbing_center">Climbing Center: </label>
          <select 
            id="climbing_center" 
            name="climbing_center" 
            value={formData.climbing_center} 
            onChange={handleChange}
            style={{ height: '40px', width: '100%' }}
          >
            <option value="">Select climbing center</option>
            <option value="John">Flashpoint Swindon</option>
            <option value="Jane">Flashpoint Bristol</option>
            <option value="Bob">Rockstar Swindon</option>
            <option value="Bob">Redpoint Bristol</option>
          </select><br/><br/>

          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} /><br/><br/>

          <label htmlFor="category">Category:</label>
          <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} /><br/><br/>

          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} /><br/><br/>

          <button type="submit">Submit</button>
        </form>
      </header>
    </div>
  );
}

export default App;





