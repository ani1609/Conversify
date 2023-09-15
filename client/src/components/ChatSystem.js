import { useState, useEffect } from 'react';
import '../index.css';
import '../styles/ChatSystem.css';
import Chat from './Chat.js';
import axios from "axios";
import io from 'socket.io-client';
const socket=io.connect("http://localhost:3000");


function ChatSystem()
{
    const [showJoinCreateButtons, setShowJoinCreateButtons] = useState(true);
	const [showJoinForm, setShowJoinForm] = useState(false);
	const [showChat, setShowChat]=useState(false);
    const [roomId, setRoomId] = useState('');
    const userToken = JSON.parse(localStorage.getItem('chatUserToken'));
    

    const fetchDataFromProtectedAPI = async (userToken) => 
    {
        try 
        {
            const config = {
                headers: {
                Authorization: `Bearer ${userToken}`,
                },
            };
            const response = await axios.get("http://localhost:3000/api/user", config);
            // setUser(response.data.user);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
    };

    const getRoomId = async (userToken) =>
    {
        try
        {
            const config = {
                headers: {
                Authorization: `Bearer ${userToken}`,
                },
            };
            const response = await axios.get("http://localhost:3000/api/user/getRoomId", config);
            console.log(response.data);
            // setRoomId(response.data.roomId);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
    }

    useEffect(() =>
    {
        if(userToken)
        {
            fetchDataFromProtectedAPI(userToken);
            getRoomId(userToken);
        }
    }, []);

    const uploadRoomId = async (roomId, userToken) =>
    {
        try
        {
            const config = {
                headers: {
                Authorization: `Bearer ${userToken}`,
                },
            };
            const response = await axios.post("http://localhost:3000/api/user/uploadRoomId", { roomId }, config);
            console.log(response.data.message);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
    }

    const handleCreateRoom = async () =>
	{
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
		let uniqueRoomId = '';
	  
		for (let i = 0; i < 9; i++) 
		{
		  	const randomIndex = Math.floor(Math.random() * characters.length);
		  	if (i==3 || i==6)
		  	{
		  		uniqueRoomId = uniqueRoomId + '-';
		  	}
		  	uniqueRoomId = uniqueRoomId + characters[randomIndex];
		}
		socket.emit('create_room', uniqueRoomId);
		console.log(uniqueRoomId);
		setRoomId(uniqueRoomId);
        uploadRoomId(uniqueRoomId, userToken);
		setShowJoinCreateButtons(false);
		setShowChat(true);
	};
  
    const handleJoinRoom = async (e) => 
    {
		e.preventDefault();
        socket.emit('join_room', roomId);
		console.log(roomId);
        uploadRoomId(roomId, userToken);
		setShowJoinCreateButtons(false);
		setShowJoinForm(false);
		setShowChat(true);
    };



    return (
        <div className='chatSystem_parent'>
            <div className='rooms_container'>
                {showJoinCreateButtons && <div>
                    <button onClick={handleCreateRoom}>Create Room</button>
                    <button onClick={() => setShowJoinForm(true)}>Join Room</button>
                </div>}

                {showJoinForm && <form onSubmit={handleJoinRoom}>
                    <input
                        type='text'
                        id="room"
                        autoComplete="off"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        required
                    />
                    <button type='submit'>Join Room</button>
                </form>}
            </div>
            {showChat && 
                <Chat
                    roomId={roomId}
                    socket={socket}
                />
            }
        </div>
    );
}

export default ChatSystem;
