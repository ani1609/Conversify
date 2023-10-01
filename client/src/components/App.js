import '../styles/App.css';
import { ThemeProvider } from './ThemeContext';
import Navbar from '../components/Navbar.js';
import ChatSystem from './ChatSystem.js';
import Default from './Default.js';

function App() 
{
    const userToken = JSON.parse(localStorage.getItem('chatUserToken'));

    return (
        <ThemeProvider>
            <div className="App">
                <Navbar/>
                {userToken ? <ChatSystem/> : <Default/>}
            </div>
        </ThemeProvider>
    );
}

export default App;
