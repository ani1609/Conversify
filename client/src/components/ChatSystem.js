import { useState, useEffect } from 'react';
import '../index.css';
import '../styles/ChatSystem.css';
import Chat from './Chat.js';
import axios from "axios";
import io from 'socket.io-client';
import { useTheme } from './ThemeContext';
const socket=io.connect("http://localhost:3000");


function ChatSystem()
{
    const { dark, setDark } = useTheme();
    const [showJoinCreateButtons, setShowJoinCreateButtons] = useState(true);
	const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
	const [showChat, setShowChat]=useState(false);
    const [roomId, setRoomId] = useState('');
    const [roomName, setRoomName] = useState('');
    const [groupProfilePic, setGroupProfilePic] = useState('');
    const [roomMembers, setRoomMembers] = useState([]);
    const [publicKeys, setPublicKeys] = useState([]);
    const [joinedRooms, setJoinedRooms] = useState([]);
    const userToken = JSON.parse(localStorage.getItem('chatUserToken'));
    const [user, setUser] = useState({});


    useEffect(() =>
    {
        console.log("mdoe is ", dark);
    }, [dark]);
    

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

    const getJoinedRoomsBasicDetails = async (userToken) =>
    {
        try
        {
            const config = {
                headers: {
                Authorization: `Bearer ${userToken}`,
                },
            };
            const response = await axios.get("http://localhost:3000/api/user/getJoinedRoomsBasicDetails", config);
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
            getJoinedRoomsBasicDetails(userToken);
        }
    }, []);


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
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
		setShowJoinCreateButtons(false);
		setShowJoinForm(false);
		setShowChat(true);
    };


    // const getPublicKeys = async (roomId) =>
    // {
    //     try
    //     {
    //         const response = await axios.post('http://localhost:3000/api/chat/getPublicKeys', { roomId });
    //         // return response.data.publicKey;
    //         setPublicKeys([]);
    //         setPublicKeys(response.data.publicKeys);
    //         console.log(response.data.publicKeys);
    //     }
    //     catch(error)
    //     {
    //         console.error("Error in fetching public key ",error);
    //     }
    // }

    const handleRoomClick = (e) =>
    {
        const roomId = e.target.parentElement.children[1].innerText;
        setRoomId(roomId);
        console.log("clicked room id is ",roomId);
        const roomName = e.target.parentElement.children[0].innerText;
        setRoomName(roomName);
        console.log("clicked room name is ",roomName);
        const groupProfilePic = joinedRooms.find((room) => room.roomId === roomId).groupProfilePic;
        setGroupProfilePic(groupProfilePic);
        console.log("clicked room profile pic is ",groupProfilePic);

        // getPublicKeys(roomId);
        socket.emit('join_room', { roomId : roomId, user});
        setShowChat(false);
        setShowChat(true);
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
                    user={user}
                    socket={socket}
                    roomId={roomId}
                    roomName={roomName}
                    groupProfilePic={groupProfilePic}
                    // publicKeys={publicKeys}
                />
            }
        </div>
    );
}

export default ChatSystem;
