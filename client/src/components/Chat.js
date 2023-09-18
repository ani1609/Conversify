import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Chat.css';


function Chat(props) 
{
	const { roomId, socket } = props;
    const [message, setMessage] = useState('');
	const [previousMessages, setPreviousMessages] = useState([]);
    const [messages, setMessages] = useState([]);
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
			// console.log("user is ", response.data.user);
            setUser(response.data.user);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
    };

	useEffect(() =>
	{
		const userToken = JSON.parse(localStorage.getItem('chatUserToken'));
		fetchDataFromProtectedAPI(userToken);
	}, []);

	const getChats = async (roomId) =>
	{
		try
		{
			const response = await axios.post('http://localhost:3000/api/chat/getChat', { roomId });
			console.log(response.data);
			setPreviousMessages(response.data.chats);
		}
		catch(error)
		{
			console.error(error);
		}
	}

	useEffect(() =>
	{
		if (roomId)
		{
			getChats(roomId);
		}
	}, [roomId]);


	useEffect(() => 
	{
		socket.on('receive_message', (data) => 
		{
		  	console.log("received message is", data);
			setMessages((messages) => [...messages, data.data]);
		});
	  }, [socket]);
  
    const handleSendMessage = async (e) => 
    {
        e.preventDefault();
        if (message && user && user.name) 
		{
			socket.emit('send_message', { roomId, message, senderName: user.name, senderEmail: user.email, timeStamp: Date.now() });
			setMessage('');
		}
		try
		{
			const response = await axios.post('http://localhost:3000/api/chat/upload', { roomId, message, senderEmail: user.email, timeStamp: Date.now() });
			console.log(response.data);
		}
		catch(error)
		{
			console.error(error);
		}
    };

    return (
      	<div>
			<form>
				{previousMessages.map((data, index) => (
					<div key={index} className='previous_messages'>
						<p>{data.message}</p>
					</div>
				))}

				{messages.map((data, index) => (
					<div key={index} className='message'>
						<p>{data.message}</p>
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
    );
}

export default Chat;
