import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "../index.css";
import "../styles/Chat.css";
import * as openpgp from "openpgp/lightweight";
import { ReactComponent as Group } from "../icons/group.svg";
import { ReactComponent as Copy } from "../icons/copy.svg";
import { ReactComponent as Options } from "../icons/options.svg";
import { ReactComponent as Profile } from "../icons/profile.svg";
import { ReactComponent as Send } from "../icons/send.svg";
import { useTheme } from "./ThemeContext";

function Chat(props) {
  const { user, socket, roomId, roomName, groupProfilePic } = props;
  const [plainText, setPlainText] = useState("");
  const [previousMessages, setPreviousMessages] = useState([]);
  const [creatorName, setCreatorName] = useState("");
  const [timestamp, setTimestamp] = useState(Date.now());
  const [publicKeys, setPublicKeys] = useState([]);
  const [messages, setMessages] = useState([]);
  const [copyMessage, setCopyMessage] = useState(false);
  const { dark } = useTheme();
  const messageBoxContainerRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
    messageBoxContainerRef.current.scrollTop =
      messageBoxContainerRef.current.scrollHeight;
  }, [previousMessages, messages]);

  useEffect(() => {
    socket.on("join_room", (data) => {
      console.log(data.user.name, " joined the chat");
      setPublicKeys((publicKeys) => [
        ...publicKeys,
        data.user.armoredPublicKey,
      ]);
    });
  }, [socket]);

  useEffect(() => {
    console.log("roomClick is true, setting room messages to null");
    setMessages([]);
  }, [roomId]);

  const decryptMessages = useCallback(
    async (message) => {
      try {
        const { data: decrypted } = await openpgp.decrypt({
          message: await openpgp.readMessage({ armoredMessage: message }),
          decryptionKeys: await openpgp.readPrivateKey({
            armoredKey: user.encryptedPrivateKey,
          }),
        });
        return decrypted;
      } catch (error) {
        // console.error("Error in decrypting message ",error);
      }
    },
    [user.encryptedPrivateKey]
  );

  const getJoinedRoomsAdvancedDetails = useCallback(
    async (roomId) => {
      console.log("getJoinedRoomsAdvancedDetails called ", roomId);
      try {
        const response = await axios.get(
          `http://localhost:3000/api/chat/getJoinedRoomsAdvancedDetails?roomId=${roomId}`
        );
        console.log(response.data);
        setCreatorName(response.data.rooms.creatorName);
        setTimestamp(response.data.rooms.timestamp);
        const decrypted = await Promise.all(
          response.data.rooms.chats.map((chat) => decryptMessages(chat.message))
        );
        const chats = response.data.rooms.chats.map((chat, index) => {
          chat.message = decrypted[index];
          return chat;
        });
        setPreviousMessages(chats);
        setPublicKeys(
          response.data.rooms.roomMembers.map(
            (member) => member.armoredPublicKey
          )
        );
        console.log("chats are ", chats);
        console.log("encrypted chats are ", response.data.rooms.chats);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [decryptMessages]
  );

  useEffect(() => {
    if (roomId) {
      getJoinedRoomsAdvancedDetails(roomId);
    }
  }, [roomId, getJoinedRoomsAdvancedDetails]);

  useEffect(() => {
    socket.on("receive_message", async (data) => {
      console.log("received message", data);
      const decrypted = await decryptMessages(data.data.message);
      data.data.message = decrypted;
      setMessages((messages) => [...messages, data.data]);
    });
  }, [socket, decryptMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    let encrypted;
    if (plainText && user && user.name && publicKeys) {
      const unArmoredPublicKeys = await Promise.all(
        publicKeys.map((armoredKey) =>
          openpgp.readKey({ armoredKey: armoredKey })
        )
      );
      const message = await openpgp.createMessage({ text: plainText });
      encrypted = await openpgp.encrypt({
        message,
        encryptionKeys: unArmoredPublicKeys,
      });
      socket.emit("send_message", {
        roomId,
        message: encrypted,
        senderName: user.name,
        senderProfilePic: user.profilePic ? user.profilePic : "",
        senderEmail: user.email,
        timestamp: Date.now(),
      });
      setPlainText("");
    }
    try {
      const response = await axios.post(
        "http://localhost:3000/api/chat/upload",
        {
          roomId,
          message: encrypted,
          senderName: user.name,
          senderEmail: user.email,
          senderProfilePic: user.profilePic ? user.profilePic : "",
          timestamp: Date.now(),
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error in sending message ", error);
    }
  };

  function formatTimestampForGrpHeader(timestamp) {
    const dateObj = new Date(timestamp);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = String(dateObj.getFullYear()).slice(-2);
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}`;

    return `${formattedTime} ${formattedDate}`;
  }

  function formatTimestampForMsg(timestamp) {
    const dateObj = new Date(timestamp);
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

    const formattedTime = `${hours}:${minutes}`;

    return `${formattedTime}`;
  }

  const handleCopyClick = () => {
    navigator.clipboard.writeText(roomId);
    setCopyMessage(true);
    setTimeout(() => setCopyMessage(false), 2000);
  };

  return (
    <div className={dark ? "chat_parent dark_bg" : "chat_parent light_bg"}>
      <div
        className="group_header"
        style={{
          borderBottom: dark
            ? "1px solid rgb(78, 78, 78)"
            : "1px solid rgb(165, 165, 165)",
        }}
      >
        <div className="group_header_left">
          {!groupProfilePic && (
            <Group
              className={
                dark ? "group_profile_pic_dark" : "group_profile_pic_light"
              }
            />
          )}
          <div>
            <h3
              className={
                dark ? "r_name dark_primary-font" : "r_name light_primary-font"
              }
            >
              {roomName}{" "}
            </h3>
            <p
              className={
                dark
                  ? "creator dark_secondary-font"
                  : "creator light_secondary-font"
              }
            >
              Created by {creatorName} on{" "}
              {formatTimestampForGrpHeader(timestamp)}
            </p>
          </div>
        </div>
        <div className="group_header_right">
          <Copy
            className={dark ? "copy_icon dark_hover" : "copy_icon light_hover"}
            onClick={handleCopyClick}
          />
          <Options
            className={
              dark ? "options_icon dark_hover" : "options_icon light_hover"
            }
          />
        </div>
        {copyMessage && (
          <p
            className={
              dark
                ? "copy_message dark_secondary-font"
                : "copy_message light_secondary-font"
            }
          >
            RoomID copied to clipboard
          </p>
        )}
      </div>

      <div className="message_box" ref={messageBoxContainerRef}>
        {previousMessages.map(
          (data, index) =>
            data.message !== undefined &&
            (data.senderEmail === user.email ? (
              <div className="self_message_container" key={index}>
                <div>
                  <p className="message">{data.message}</p>
                  <p className="timestamp">
                    {formatTimestampForMsg(data.timestamp)}
                  </p>
                </div>
                {data.senderProfilePic ? (
                  <img
                    src={`http://localhost:3000/${data.senderProfilePic}`}
                    alt="profile_pic"
                  />
                ) : (
                  <Profile
                    className={
                      dark
                        ? "dark_chat_box_profile_icon"
                        : "light_chat_box_profile_icon"
                    }
                  />
                )}
              </div>
            ) : (
              <div className="others_message_container" key={index}>
                {data.senderProfilePic ? (
                  <img
                    src={`http://localhost:3000/${data.senderProfilePic}`}
                    alt="profile_pic"
                  />
                ) : (
                  <Profile
                    className={
                      dark
                        ? "dark_chat_box_profile_icon"
                        : "light_chat_box_profile_icon"
                    }
                  />
                )}
                <div>
                  <div>
                    <h4 className="sender_name">{data.senderName}</h4>
                    <p className="message">{data.message}</p>
                  </div>
                  <p className="timestamp">
                    {formatTimestampForMsg(data.timestamp)}
                  </p>
                </div>
              </div>
            ))
        )}
        {messages.map(
          (data, index) =>
            data.message !== undefined &&
            (data.senderEmail === user.email ? (
              <div className="self_message_container" key={index}>
                <div>
                  <p className="message">{data.message}</p>
                  <p className="timestamp">
                    {formatTimestampForMsg(data.timestamp)}
                  </p>
                </div>
                {data.senderProfilePic ? (
                  <img
                    src={`http://localhost:3000/${data.senderProfilePic}`}
                    alt="profile_pic"
                  />
                ) : (
                  <Profile
                    className={
                      dark
                        ? "dark_chat_box_profile_icon"
                        : "light_chat_box_profile_icon"
                    }
                  />
                )}
              </div>
            ) : (
              <div className="others_message_container" key={index}>
                {data.senderProfilePic ? (
                  <img
                    src={`http://localhost:3000/${data.senderProfilePic}`}
                    alt="profile_pic"
                  />
                ) : (
                  <Profile
                    className={
                      dark
                        ? "dark_chat_box_profile_icon"
                        : "light_chat_box_profile_icon"
                    }
                  />
                )}
                <div>
                  <div>
                    <h4 className="sender_name">{data.senderName}</h4>
                    <p className="message">{data.message}</p>
                  </div>
                  <p className="timestamp">
                    {formatTimestampForMsg(data.timestamp)}
                  </p>
                </div>
              </div>
            ))
        )}
      </div>

      <form className={dark ? "form_dark" : "form_light"}>
        <input
          type="text"
          autoComplete="off"
          value={plainText}
          onChange={(e) => setPlainText(e.target.value)}
          required
          placeholder="Type a message"
          autoFocus
        />
        <button type="submit" onClick={handleSendMessage}>
          <Send className="send_icon" />
        </button>
      </form>
    </div>
  );
}

export default Chat;
