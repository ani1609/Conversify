import { useState, useEffect, useRef } from 'react';
import '../index.css';
import '../styles/ChatSystem.css';
import Chat from './Chat.js';
import axios from "axios";
import io from 'socket.io-client';
import {ReactComponent as Group} from '../icons/group.svg';
import { useTheme } from './ThemeContext';
import {ReactComponent as DefaultAsset} from '../assets/default1.svg';
import {ReactComponent as RightArrow} from '../icons/rightArrow.svg';
const socket=io.connect("http://localhost:3000");


function ChatSystem()
{
    const { dark, setDark } = useTheme();
	const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
	const [showChat, setShowChat]=useState(false);
    const [roomId, setRoomId] = useState('');
    const [roomName, setRoomName] = useState('');
    const [groupProfilePic, setGroupProfilePic] = useState('');
    const [joinedRooms, setJoinedRooms] = useState([]);
    const userToken = JSON.parse(localStorage.getItem('chatUserToken'));
    const [user, setUser] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const roomsListRef = useRef(null);
    const [searchShadow, setSearchShadow] = useState(false);



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
            // console.log(response.data.rooms);
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
            window.location.reload();
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
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
            window.location.reload();
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
		setShowJoinForm(false);
		setShowChat(true);
    };


    const handleRoomClick = (roomId, roomName) =>
    {
        setRoomId(roomId);
        // console.log("clicked room id is ",roomId);
        setRoomName(roomName);
        // console.log("clicked room name is ",roomName);
        const groupProfilePic = joinedRooms.find((room) => room.roomId === roomId).groupProfilePic;
        setGroupProfilePic(groupProfilePic);
        // console.log("clicked room profile pic is ",groupProfilePic);

        // getPublicKeys(roomId);
        socket.emit('join_room', { roomId : roomId, user});
        setShowChat(false);
        setShowChat(true);
    };

    function formatTime(date) 
    {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }

    function isToday(date) 
    {
        const today = new Date();
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
    }
      
    // Function to check if a date is yesterday
    function isYesterday(date) 
    {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return (
          date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear()
        );
    }

    const handleRoomsScroll = () =>
    {
        if (roomsListRef.current.scrollTop>10) 
        {
            console.log("scrolled");
            setSearchShadow(true);
        }
        else
        {
            setSearchShadow(false);
        }
    }

    const modifyLastMessage = (lastMsg) =>
    {
        if(lastMsg.length>25)
        {
            return lastMsg.slice(0,25) + '...';
        }
        else
        {
            return lastMsg;
        }
    }



    return (
        <div className='chatSystem_parent'>
            <div className={dark ? 'rooms_container dark_bg' : 'rooms_container light_bg'} style={{ borderRight: dark ? '1px solid rgb(78, 78, 78)' : '1px solid rgb(165, 165, 165)' }}>
                <div className='join_create_container' style={{ borderBottom: dark ? '1px solid rgb(78, 78, 78)' : '1px solid rgb(165, 165, 165)' }}>
                    <button onClick={() => {setShowCreateForm(true); setShowJoinForm(false)}} className={dark ? 'dark_bg dark_hover dark_border' : 'light_bg light_hover light_border'}>Create Room</button>
                    <button onClick={() => {setShowJoinForm(true); setShowCreateForm(false)}} className={dark ? 'dark_bg dark_hover dark_border ' : 'light_bg light_hover light_border'}>Join Room</button>

                    {showCreateForm && <div className='create_form_parent' onClick={()=> setShowCreateForm(false)}>
                        <div className={dark? 'dark_create_form_container' : 'light_create_form_container'} onClick={(e)=> e.stopPropagation()}>
                            <h1>Create Room</h1>
                            <form onSubmit={handleCreateRoom}>
                                <input
                                    type='text'
                                    id="roomName"
                                    autoComplete="off"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder='Enter Room Name'
                                    required
                                />
                                <button type='submit'><RightArrow className='right_arrow_icon'/></button>
                            </form>
                        </div>
                    </div>}

                    {showJoinForm && <div className='join_form_parent' onClick={()=> setShowJoinForm(false)}>
                        <div className={dark? 'dark_join_form_container' : 'light_join_form_container'} onClick={(e)=> e.stopPropagation()}>
                            <h1>Join Room</h1>
                            <form onSubmit={handleJoinRoom}>
                                <input
                                    type='text'
                                    id="roomId"
                                    autoComplete="off"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    placeholder='Enter Room Id'
                                    required
                                />
                                <button type='submit'><RightArrow className='right_arrow_icon'/></button>
                            </form>
                        </div>
                    </div>}
                </div>

                <div className='rooms_list'>
                    <div className={searchShadow ? dark ? 'dark_room-filter dark_room-filter-shadow' : 'light_room-filter light_room-filter-shadow' : dark ? 'dark_room-filter' : 'light_room-filter'}>
                        <input
                            type="text"
                            placeholder="Search for a chat room"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                   <ul ref={roomsListRef} onScroll={handleRoomsScroll}>
                        {joinedRooms.filter((room) =>room.roomName.toLowerCase().includes(searchQuery.toLowerCase())).map((room, index) => (
                            <div key={index}>
                                <li key={index} className={dark ? 'dark_hover' : 'light_hover'}>
                                        <div className='room_click'  onClick={() => handleRoomClick(room.roomId, room.roomName)}></div>
                                    {room.groupProfilePic && <img src={room.groupProfilePic} alt='room_profile_pic'/>}
                                    {!room.groupProfilePic && <Group className={dark ? 'dark_group_icon' : 'light_group_icon'}/>}
                                    <div className='grp_details'>
                                        <div>
                                            <p className={dark ? 'room_name dark_primary-font' : 'room_name light_primary-font'}>{room.roomName}</p>
                                            {room.lastMessage && <p className={dark ? 'last_message dark_secondary-font' : 'last_message light_secondary-font'}>{room.lastMessage.senderName}: {modifyLastMessage(room.lastMessage.message)}</p>}
                                            {!room.lastMessage && <p className={dark ? 'tap_to_chat dark_secondary-font' : 'tap_to_chat light_secondary-font'}>Tap to start chat</p>}
                                        </div>
                                        {room.lastMessage?.timestamp && (
                                            <p className={dark ? 'last_msg_timestamp dark_secondary-font' : 'last_msg_timestamp light_secondary-font'}>
                                                {isToday(new Date(room.lastMessage.timestamp))
                                                ? formatTime(new Date(room.lastMessage.timestamp))
                                                : isYesterday(new Date(room.lastMessage.timestamp))
                                                ? 'Yesterday'
                                                : new Date(room.lastMessage.timestamp).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                </li>

                                <div className='line' style={{ backgroundColor: dark ? 'rgb(78, 78, 78)' : 'rgb(199, 199, 199)' }}></div>
                            </div>
                        ))}
                    </ul>
                </div>
            </div>

            {!showChat &&
                <div className={dark ? 'default_asset_in_chat_container dark_bg' : 'default_asset_in_chat_container light_bg'}>
                    <DefaultAsset className='default_asset_in_chat'/>
                </div>
            }


            {showChat && 
                <Chat
                    user={user}
                    socket={socket}
                    roomId={roomId}
                    roomName={roomName}
                    groupProfilePic={groupProfilePic}
                />
            }
        </div>
    );
}

export default ChatSystem;
