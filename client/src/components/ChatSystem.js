import { useState, useEffect } from 'react';
import '../index.css';
import '../styles/ChatSystem.css';
import Chat from './Chat.js';
import axios from "axios";
import io from 'socket.io-client';
import { set } from 'mongoose';
const socket=io.connect("http://localhost:3000");


function ChatSystem()
{
    const [showJoinCreateButtons, setShowJoinCreateButtons] = useState(true);
	const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
	const [showChat, setShowChat]=useState(false);
    const [roomId, setRoomId] = useState('');
    const [roomName, setRoomName] = useState('');
    const [roomMembers, setRoomMembers] = useState([]);
    const [publicKeys, setPublicKeys] = useState([]);
    const [joinedRooms, setJoinedRooms] = useState([]);
    const userToken = JSON.parse(localStorage.getItem('chatUserToken'));
    let roomClick=false;
    const [user, setUser] = useState({});
    

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
            setUser(response.data.user);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
    };

    const getJoinedRooms = async (userToken) =>
    {
        try
        {
            const config = {
                headers: {
                Authorization: `Bearer ${userToken}`,
                },
            };
            const response = await axios.get("http://localhost:3000/api/user/getJoinedRooms", config);
            console.log(response.data);
            setJoinedRooms(response.data.rooms);
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
            getJoinedRooms(userToken);
        }
    }, []);

    const getroomMembers = async (roomId) =>
    {
        try
        {
            const response = await axios.post('http://localhost:3000/api/chat/getRoomMembers', { roomId });
            setRoomMembers(response.data.roomMembers);
            const keys = response.data.roomMembers.map(member => member.armoredPublicKey);
            setPublicKeys(keys);
        }
        catch(error)
        {
            console.error("Error in fetching room members ",error);
        }
    }

    useEffect(() =>
    {
        if (roomId && roomId.length === 11)
        {
            getroomMembers(roomId);
        }
    }, [roomId]);


    const handleCreateRoom = async (e) =>
	{
        e.preventDefault();
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
        try
        {
            const config = 
            {
                headers: 
                {
                    Authorization: `Bearer ${userToken}`,
                },
            };
            const data = 
            {
                roomId: uniqueRoomId,
                roomName: roomName,
            };
            const response = await axios.post("http://localhost:3000/api/chat/createRoom", data, config);
		    setRoomId(uniqueRoomId);
            console.log(response.data.message);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
		setShowJoinCreateButtons(false);
		setShowChat(true);
        setShowCreateForm(false);
	};


    useEffect(() =>
    {
        socket.on('join_room', (data) =>
        {
            console.log(data.user.name," joined the chat");
            setRoomMembers((roomMembers) => [...roomMembers, data.user]);
            setPublicKeys((publicKeys) => [...publicKeys, data.user.armoredPublicKey]);
        });
    }, [socket]);

  
    const handleJoinRoom = async (e) => 
    {
		e.preventDefault();
        socket.emit('join_room', { roomId, user});
		console.log(roomId);
        try
        {
            const config = 
            {
                headers: 
                {
                    Authorization: `Bearer ${userToken}`,
                },
            };

            const data =
            {
                roomId: roomId
            };
            const response = await axios.post("http://localhost:3000/api/chat/joinRoom", data, config);
            console.log(response.data.message);
            getroomMembers(roomId);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
		setShowJoinCreateButtons(false);
		setShowJoinForm(false);
		setShowChat(true);
    };


    const getPublicKeys = async (roomId) =>
    {
        try
        {
            const response = await axios.post('http://localhost:3000/api/chat/getPublicKeys', { roomId });
            // return response.data.publicKey;
            setPublicKeys([]);
            setPublicKeys(response.data.publicKeys);
            console.log(response.data.publicKeys);
        }
        catch(error)
        {
            console.error("Error in fetching public key ",error);
        }
    }

    const handleRoomClick = (e) =>
    {
        roomClick=true;
        const id = e.target.parentElement.children[1].innerText;
        console.log("clicked room id is ",id);
        getPublicKeys(id);
        socket.emit('join_room', { roomId : id, user});
        setRoomId(id);
        setShowChat(false);
        setShowChat(true);
        roomClick=false;
    };



    return (
        <div className='chatSystem_parent'>
            <div className='rooms_container'>
                <div className='join_create_container'>
                    {showJoinCreateButtons && <div>
                        <button onClick={() => setShowCreateForm(true)}>Create Room</button>
                        <button onClick={() => setShowJoinForm(true)}>Join Room</button>
                    </div>}

                    {showCreateForm && <form onSubmit={handleCreateRoom}>
                        <label htmlFor="roomName">Enter Room Name</label>
                        <input
                            type='text'
                            id="roomName"
                            autoComplete="off"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            required
                        />
                        <button type='submit'>Create Room</button>
                    </form>}

                    {showJoinForm && <form onSubmit={handleJoinRoom}>
                        <label htmlFor="roomId">Enter Room Id</label>
                        <input
                            type='text'
                            id="roomId"
                            autoComplete="off"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            required
                        />
                        <button type='submit'>Join Room</button>
                    </form>}
                </div>

                <div className='rooms_list'>
                    {/* <input
                        type="text"
                        placeholder="Search for a chat room"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />*/}
                   <ul>
                        {joinedRooms.map((room, index) => (
                            <li key={index} onClick={handleRoomClick}>
                                <p>{room.roomName}</p>
                                <p>{room.roomId}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>


            {showChat && 
                <Chat
                    roomId={roomId}
                    socket={socket}
                    roomMembers={roomMembers}
                    publicKeys={publicKeys}
                    user={user}
                    roomClick={roomClick}
                />
            }
        </div>
    );
}

export default ChatSystem;
