import '../styles/App.css';
import { ThemeProvider } from './ThemeContext';
import Navbar from '../components/Navbar.js';
import ChatSystem from './ChatSystem.js';

function App() 
{
    return (
        <ThemeProvider>
            <div className="App">
                <Navbar/>
                <ChatSystem/>
            </div>
        </ThemeProvider>
    );
}

export default App;
