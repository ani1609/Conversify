import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Chat.css';


function Chat(props) 
{
	const { roomId, socket } = props;
    const [message, setMessage] = useState('');
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


	useEffect(() => 
	{
		socket.on('receive_message', (data) => 
		{
			setMessages(prevMessages => [...prevMessages, data.message]);
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
			const response = await axios.post('http://localhost:3000/api/chat/upload', { roomId, message, senderName: user.name, senderEmail: user.email, timeStamp: Date.now() });
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
			{messages.filter((_, index) => index % 2 === 0).map((msg, index) => (
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
    );
}

export default Chat;
