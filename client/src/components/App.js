import { useEffect, useState } from "react";
import "../styles/App.css";
import { ThemeProvider } from "./ThemeContext";
import Navbar from "../components/Navbar.js";
import ChatSystem from "./ChatSystem.js";
import Default from "./Default.js";
import axios from "axios";

function App() {
  const userToken = JSON.parse(localStorage.getItem("chatUserToken"));
  const [user, setUser] = useState({});

  const fetchDataFromProtectedAPI = async (userToken) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      const response = await axios.get(
        "http://localhost:4000/api/user",
        config
      );
      const modifiedUser = {
        name: response.data.user.name,
        email: response.data.user.email,
        profilePic: response.data.user.profilePic,
        armoredPublicKey: response.data.user.armoredPublicKey,
        encryptedPrivateKey: response.data.user.encryptedPrivateKey,
      };
      setUser(modifiedUser);
      console.log(modifiedUser);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (userToken) {
      fetchDataFromProtectedAPI(userToken);
    }
  }, [userToken]);

  return (
    <ThemeProvider>
      <div className="App">
        <Navbar user={user} />
        {userToken ? <ChatSystem user={user} /> : <Default />}
      </div>
    </ThemeProvider>
  );
}

export default App;
