import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Chat.css';
import * as openpgp from 'openpgp/lightweight';


function Chat(props) 
{
	const { roomId, socket, roomMembers, publicKeys, user } = props;
    const [plainText, setPlainText] = useState('');
	const [previousMessages, setPreviousMessages] = useState([]);
    const [messages, setMessages] = useState([]);


	const decryptMessages = async (message) =>
	{
		try
		{
			const { data: decrypted } = await openpgp.decrypt
			({
				message: await openpgp.readMessage({ armoredMessage: message }),
				decryptionKeys: await openpgp.readPrivateKey({ armoredKey: user.encryptedPrivateKey }),
			});
			return decrypted;
		}
		catch(error)
		{
			// console.error("Error in decrypting message ",error);
		}
	}
	

	const getChats = async (roomId) =>
	{
		try
		{
			const response = await axios.post('http://localhost:3000/api/chat/getChat', { roomId });
			const decrypted = await Promise.all(response.data.chats.map(chat => decryptMessages(chat.message)));
			const chats = response.data.chats.map((chat, index) =>
			{
				chat.message = decrypted[index];
				return chat;
			});
			setPreviousMessages(chats);
		}
		catch(error)
		{
			console.error("Error is fetching previous chats ",error);
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
		socket.on('receive_message', async (data) => 
		{
			const decrypted = await decryptMessages(data.data.message);
			data.data.message = decrypted;
			setMessages((messages) => [...messages, data.data]);
		});
	}, [socket]);

  
    const handleSendMessage = async (e) => 
    {
        e.preventDefault();
		let encrypted;
        if (plainText && user && user.name && publicKeys) 
		{
			const unArmoredPublicKeys = await Promise.all(publicKeys.map(armoredKey => openpgp.readKey({ armoredKey : armoredKey })));
			const message = await openpgp.createMessage({ text: plainText });
    		encrypted = await openpgp.encrypt({
				message,
				encryptionKeys: unArmoredPublicKeys,
			});
			socket.emit('send_message', { roomId, message : encrypted, senderName: user.name, senderEmail: user.email, timeStamp: Date.now() });
			setPlainText('');
		}
		try
		{
			const response = await axios.post('http://localhost:3000/api/chat/upload', { roomId, message : encrypted, senderEmail: user.email, timeStamp: Date.now() });
			console.log(response.data);
		}
		catch(error)
		{
			console.error("Error in sending message ",error);
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
					value={plainText}
					onChange={(e) => setPlainText(e.target.value)}
					required
				/>
				<button type='submit' onClick={handleSendMessage}>Send</button>
			</form>
    	</div>
    );
}

export default Chat;
