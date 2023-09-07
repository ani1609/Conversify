import { useEffect, useState } from 'react';
import '../index.css';
import '../styles/Chat.css';
import io from 'socket.io-client';
const socket=io.connect("http://localhost:3000");


function Chat() 
{
  	const [showJoinCreateButtons, setShowJoinCreateButtons] = useState(true);
	const [showJoinForm, setShowJoinForm] = useState(false);
	const [showChat, setShowChat]=useState(false);
    const [roomId, setRoomId] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

  
	useEffect(() => 
	{
		socket.on('receive_message', (data) => 
		{
			setMessages(prevMessages => [...prevMessages, data.message]);
		});
	}, [socket]);
  
    const handleSendMessage = (e) => 
    {
        e.preventDefault();
        if (message) 
		{
			socket.emit('send_message', { roomId, message });
			setMessage('');
		}
    };

	const generateRoomId = () => 
	{
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
		let roomId = '';
	  
		for (let i = 0; i < 9; i++) 
		{
		  	const randomIndex = Math.floor(Math.random() * characters.length);
		  	if (i==3 || i==6)
		  	{
		  		roomId = roomId + '-';
		  	}
		  	roomId = roomId + characters[randomIndex];
		}
		return roomId;
	}
	  
	const handleCreateRoom = () =>
	{
		const uniqueRoomId = generateRoomId();
		socket.emit('create_room', uniqueRoomId);
		console.log(uniqueRoomId);
		setRoomId(uniqueRoomId);
		setShowJoinCreateButtons(false);
		setShowChat(true);
	};
  
    const handleJoinRoom = (e) => 
    {
		e.preventDefault();
        socket.emit('join_room', roomId);
		console.log(roomId);
		setShowJoinCreateButtons(false);
		setShowJoinForm(false);
		setShowChat(true);
    };

  
    return (
      	<div>
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

			{showChat && <div>
				<form>
					{messages.filter((msg, index) => index % 2 === 0).map((msg, index) => (
						<div key={index} className='message'>
							<p>{msg}</p>
						</div>
					))}
					<input
						type='text'
						id="message"
						autoComplete="off"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						required
					/>
					<button type='submit' onClick={handleSendMessage}>Send</button>
				</form>
			</div>
			}
    	</div>
    );
}

export default Chat;
