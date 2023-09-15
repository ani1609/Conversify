import '../styles/App.css';
import Navbar from '../components/Navbar.js';
import ChatSystem from './ChatSystem.js';

function App() {
  return (
    <div className="App">
      <Navbar/>
      <ChatSystem/>
    </div>
  );
}

export default App;
