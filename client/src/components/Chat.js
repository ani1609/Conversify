import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "../index.css";
import "../styles/Chat.css";
import * as openpgp from "openpgp/lightweight";
import { ReactComponent as Group } from "../icons/group.svg";
import { ReactComponent as Options } from "../icons/options.svg";
import { ReactComponent as Profile } from "../icons/profile.svg";
import { ReactComponent as Send } from "../icons/send.svg";
import { useTheme } from "./ThemeContext";
import RoomMembers from "./RoomMembers";

function Chat(props) {
  const { user, socket, roomId, roomName, openedRoom } = props;
  const userToken = JSON.parse(localStorage.getItem("chatUserToken"));
  const [plainText, setPlainText] = useState("");
  const [previousMessages, setPreviousMessages] = useState([]);
  const [creatorName, setCreatorName] = useState("");
  const [timestamp, setTimestamp] = useState(Date.now());
  const [roomMembers, setRoomMembers] = useState([]);
  const [publicKeys, setPublicKeys] = useState([]);
  const [messages, setMessages] = useState([]);
  const [copyMessage, setCopyMessage] = useState(false);
  const { dark } = useTheme();
  const [showChatRoomOptiosn, setShowChatRoomOptions] = useState(false);
  const [showRoomMembersComponent, setShowRoomMembersComponent] =
    useState(false);
  const messageBoxContainerRef = useRef(null);
  const [isRoomLeft, setIsRoomLeft] = useState(false);
  const [isMemberRemovedData, setIsMemberRemovedData] = useState({});
  const [groupProfilePic, setGroupProfilePic] = useState("");
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
    messageBoxContainerRef.current.scrollTop =
      messageBoxContainerRef.current.scrollHeight;
  }, [previousMessages, messages]);

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
        console.error("Error in decrypting message ", error);
      }
    },
    [user.encryptedPrivateKey]
  );

  useEffect(() => {
    if (roomMembers.length > 0) {
      const userInRoom = roomMembers.some(
        (member) => member.isAdmin && member.email === user.email
      );
      setIsUserAdmin(userInRoom);
    }
  }, [roomMembers, user]);

  useEffect(() => {
    socket.on("join_room", (data) => {
      if (openedRoom === data.roomId) {
        console.log(data, "joined the chat");

        // Ensure the user has a valid name and email
        if (data.user.name && data.user.email) {
          const userInRoom = roomMembers.some(
            (member) => member.email === data.user.email
          );

          if (!userInRoom) {
            setPublicKeys((publicKeys) => [
              ...publicKeys,
              data.user.armoredPublicKey,
            ]);

            setRoomMembers((roomMembers) => {
              const updatedRoomMembers = [
                ...roomMembers,
                {
                  email: data.user.email,
                  name: data.user.name,
                  profilePic: data.user.profilePic,
                  armoredPublicKey: data.user.armoredPublicKey,
                  isAdmin: false,
                  joinTimestamp: Date.now(),
                },
              ];

              // Filter out members with missing name or email
              const filteredRoomMembers = updatedRoomMembers.filter(
                (member) => member.name && member.email
              );

              // Remove any duplicates
              return filteredRoomMembers.filter(
                (member, index, self) =>
                  index ===
                  self.findIndex(
                    (t) => t.email === member.email && t.name === member.name
                  )
              );
            });
          }
        }
      }
    });
  }, [socket, roomMembers, openedRoom]);

  useEffect(() => {
    socket.on("receive_message", async (data) => {
      if (data.data.roomId === openedRoom) {
        console.log("received message", data);
        const decrypted = await decryptMessages(data.data.message);
        data.data.message = decrypted;
        setMessages((messages) => [...messages, data.data]);
      }
    });
  }, [socket, user, decryptMessages, openedRoom]);

  useEffect(() => {
    socket.on("room_left", (data) => {
      if (data.roomId === openedRoom) {
        if (data.user.email === user.email) {
          setIsRoomLeft(true);
        }
        setPublicKeys((publicKeys) =>
          publicKeys.filter((key) => key !== data.user.armoredPublicKey)
        );
        setRoomMembers((roomMembers) =>
          roomMembers.filter((member) => member.email !== data.user.email)
        );
        console.log(data.user.email, " left the room");
      }
    });
  }, [socket, user, openedRoom]);

  useEffect(() => {
    socket.on("member_removed", (data) => {
      if (data.roomId === openedRoom) {
        const { removedUser, removerUser } = data;

        console.log("member removed", removedUser.email);

        setPublicKeys((publicKeys) =>
          publicKeys.filter((key) => key !== removedUser.armoredPublicKey)
        );

        setRoomMembers((roomMembers) =>
          roomMembers.filter((member) => member.email !== removedUser.email)
        );

        if (removedUser.email === user.email) {
          setIsMemberRemovedData({
            isRemoved: true,
            removerName: removerUser.name,
          });
        }
      }
    });
  }, [socket, user, openedRoom]);

  useEffect(() => {
    socket.on("member_made_admin", (data) => {
      if (data.roomId === openedRoom) {
        const { userToMakeAdmin } = data;

        console.log("member made admin", userToMakeAdmin.email);

        setRoomMembers((roomMembers) =>
          roomMembers.map((member) =>
            member.email === userToMakeAdmin.email
              ? { ...member, isAdmin: true }
              : member
          )
        );
      }
    });
  }, [socket, user, roomMembers, openedRoom]);

  useEffect(() => {
    socket.on("member_dismissed_as_admin", (data) => {
      if (data.roomId === openedRoom) {
        const { userToDismissAsAdmin } = data;

        console.log("dismissed as admin", userToDismissAsAdmin.email);

        setRoomMembers((roomMembers) =>
          roomMembers.map((member) =>
            member.email === userToDismissAsAdmin.email
              ? { ...member, isAdmin: false }
              : member
          )
        );
      }
    });
  }, [socket, user, roomMembers, openedRoom]);

  useEffect(() => {
    setMessages([]);
  }, [roomId]);

  const getJoinedRoomsAdvancedDetails = useCallback(
    async (roomId) => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        };

        const response = await axios.get(
          `http://localhost:4000/api/chat/getJoinedRoomsAdvancedDetails?roomId=${roomId}`,
          config
        );
        console.log("the advanced details are ", response.data);
        setRoomMembers(response.data.room.roomMembers);
        setCreatorName(response.data.room.creatorName);
        setTimestamp(response.data.room.timestamp);
        setIsRoomLeft(response.data.room.isRoomLeft);
        setIsMemberRemovedData({
          isRemoved: response.data.room.isRemovedFromRoom,
          removerName: response.data.room.removerName,
        });
        setGroupProfilePic(response.data.room.groupProfilePic);
        const decrypted = await Promise.all(
          response.data.room.chats.map((chat) => decryptMessages(chat.message))
        );
        const chats = response.data.room.chats.map((chat, index) => {
          chat.message = decrypted[index];
          return chat;
        });
        setPreviousMessages(chats);
        setPublicKeys(
          response.data.room.roomMembers.map(
            (member) => member.armoredPublicKey
          )
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [userToken, decryptMessages]
  );

  useEffect(() => {
    if (roomId) {
      getJoinedRoomsAdvancedDetails(roomId);
    }
  }, [roomId, getJoinedRoomsAdvancedDetails]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    let encrypted;
    console.log("the public keys are ", publicKeys);
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
      socket.emit("send_notification", {
        roomId,
      });
      setPlainText("");
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };

      const response = await axios.post(
        "http://localhost:4000/api/chat/uploadChat",
        {
          roomId,
          message: encrypted,
          senderName: user.name,
          senderEmail: user.email,
          senderProfilePic: user.profilePic ? user.profilePic : "",
          timestamp: Date.now(),
        },
        config
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

  const handleLeaveGroup = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      const response = await axios.post(
        "http://localhost:4000/api/chat/leaveRoom",
        {
          roomId,
        },
        config
      );
      console.log(response.data);
      // window.location.reload();
    } catch (error) {
      console.error("Error leaving group ", error);
    }

    socket.emit("leave_room", { roomId, user });
  };

  const handleUploadGroupPic = async (e) => {
    const formData = new FormData();
    formData.append("groupProfilePic", e.target.files[0]);
    formData.append("roomId", roomId);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.post(
        "http://localhost:4000/api/uploadGroupProfilePic",
        formData,
        config
      );
      socket.emit("room_pic_uploading", {
        roomId,
        path: response.data.path,
      });
      console.log(response.data);
      setGroupProfilePic(response.data.path);
    } catch (error) {
      console.error("Error uploading profile pic:", error);
    }
  };

  const handleReUploadGroupPic = async (e) => {
    const formData = new FormData();
    formData.append("groupProfilePic", e.target.files[0]);
    formData.append("roomId", roomId);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.post(
        "http://localhost:4000/api/addNewGroupProfilePic",
        formData,
        config
      );
      socket.emit("room_pic_uploading", {
        roomId,
        path: response.data.path,
      });
      console.log(response.data);
      setGroupProfilePic(response.data.path);
    } catch (error) {
      console.error("Error re-uploading profile pic:", error);
    }
  };

  const handleDeleteGroupPic = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      const response = await axios.post(
        "http://localhost:4000/api/deleteGroupProfilePic",
        {
          roomId,
        },
        config
      );
      socket.emit("room_pic_uploading", {
        roomId,
        path: "",
      });
      console.log(response.data);
      setGroupProfilePic("");
    } catch (error) {
      console.error("Error deleting group profile pic:", error);
    }
  };

  useEffect(() => {
    socket.on("room_pic_uploaded", (data) => {
      if (data.data.roomId === openedRoom) {
        console.log("room pic uploaded socket", data.data.path);
        setGroupProfilePic(data.data.path);
      }
    });
  }, [socket, openedRoom]);

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
          {groupProfilePic ? (
            <img
              src={`http://localhost:4000/${groupProfilePic}`}
              alt="group_profile_pic"
            />
          ) : (
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
        <div
          className={
            dark
              ? "group_header_right dark_hover"
              : "group_header_right light_hover"
          }
          onClick={() => setShowChatRoomOptions(!showChatRoomOptiosn)}
        >
          <Options className="options_icon" />
          {showChatRoomOptiosn && (
            <div
              className={
                dark
                  ? "chat_room_options_list dark_primary-font"
                  : "chat_room_options_list light_primary-font"
              }
            >
              <p onClick={handleCopyClick}>Copy RoomID</p>
              {!isRoomLeft && !isMemberRemovedData.isRemoved && (
                <>
                  <span
                    style={{
                      backgroundColor: dark ? "#ededed" : "#000000",
                    }}
                  ></span>
                  <p
                    onClick={() =>
                      setShowRoomMembersComponent(!showRoomMembersComponent)
                    }
                  >
                    Room members
                  </p>
                  <span
                    style={{
                      backgroundColor: dark ? "#ededed" : "#000000",
                    }}
                  ></span>
                  {isUserAdmin &&
                    (groupProfilePic ? (
                      <label onClick={(e) => e.stopPropagation()}>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={handleReUploadGroupPic}
                        />
                        Reupload group photo
                      </label>
                    ) : (
                      <label onClick={(e) => e.stopPropagation()}>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={handleUploadGroupPic}
                        />
                        Upload group photo
                      </label>
                    ))}
                  {groupProfilePic && isUserAdmin && (
                    <>
                      <span
                        style={{
                          backgroundColor: dark ? "#ededed" : "#000000",
                        }}
                      ></span>
                      <p onClick={handleDeleteGroupPic}>Delete group photo</p>
                    </>
                  )}
                  <span
                    style={{
                      backgroundColor: dark ? "#ededed" : "#000000",
                    }}
                  ></span>
                  <p onClick={handleLeaveGroup}>Leave group</p>
                </>
              )}
            </div>
          )}
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

      <div
        className="message_box custom_scroll_bar"
        ref={messageBoxContainerRef}
      >
        {showRoomMembersComponent && (
          <RoomMembers
            user={user}
            socket={socket}
            roomId={roomId}
            isUserAdmin={isUserAdmin}
            setIsRoomLeft={setIsRoomLeft}
            roomMembers={roomMembers}
            setPublicKeys={setPublicKeys}
            setShowRoomMembersComponent={setShowRoomMembersComponent}
          />
        )}
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
                    src={`http://localhost:4000/${data.senderProfilePic}`}
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
                    src={`http://localhost:4000/${data.senderProfilePic}`}
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
                    src={`http://localhost:4000/${data.senderProfilePic}`}
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
                    src={`http://localhost:4000/${data.senderProfilePic}`}
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

      {isMemberRemovedData.isRemoved && (
        <div
          className={
            dark
              ? "member_removed_message_dark"
              : "member_removed_message_light"
          }
        >
          <p>{isMemberRemovedData.removerName} removed you from the room</p>
        </div>
      )}

      {!isRoomLeft && !isMemberRemovedData.isRemoved ? (
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
      ) : (
        <div
          className={
            dark ? "room_left_message_dark" : "room_left_message_light"
          }
        >
          <p>You have left the room</p>
        </div>
      )}
    </div>
  );
}

export default Chat;
