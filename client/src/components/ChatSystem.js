import { useState, useEffect, useRef } from "react";
import "../index.css";
import "../styles/ChatSystem.css";
import Chat from "./Chat.js";
import axios from "axios";
import io from "socket.io-client";
import { ReactComponent as Group } from "../icons/group.svg";
import { useTheme } from "./ThemeContext";
import { ReactComponent as DefaultAsset } from "../assets/default1.svg";
import { ReactComponent as RightArrow } from "../icons/rightArrow.svg";
const socket = io.connect("http://localhost:4000");

function ChatSystem(props) {
  const { dark } = useTheme();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [groupProfilePic, setGroupProfilePic] = useState("");
  const [joinedRooms, setJoinedRooms] = useState([]);
  const userToken = JSON.parse(localStorage.getItem("chatUserToken"));
  const { user } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const roomsListRef = useRef(null);
  const [searchShadow, setSearchShadow] = useState(false);
  const [notifications, setNotifications] = useState({});
  const [openedRoom, setOpenedRoom] = useState("");

  useEffect(() => {
    const joinAllRooms = async (roomIds) => {
      roomIds.forEach((roomId) => {
        socket.emit("join_room", { roomId, user });
        console.log("joined room ", roomId);
      });
    };

    const getJoinedRoomsBasicDetails = async (userToken) => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        };
        const response = await axios.get(
          "http://localhost:4000/api/user/getJoinedRoomsBasicDetails",
          config
        );
        console.log(response.data.rooms);
        setJoinedRooms(response.data.rooms);
        const roomIds = response.data.rooms.map((room) => room.roomId);
        joinAllRooms(roomIds);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (userToken && user) {
      getJoinedRoomsBasicDetails(userToken);
    }
  }, [userToken, user]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
    let uniqueRoomId = "";

    for (let i = 0; i < 9; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      if (i === 3 || i === 6) {
        uniqueRoomId = uniqueRoomId + "-";
      }
      uniqueRoomId = uniqueRoomId + characters[randomIndex];
    }
    socket.emit("create_room", uniqueRoomId);
    console.log(uniqueRoomId);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      const data = {
        roomId: uniqueRoomId,
        roomName: roomName,
      };
      const response = await axios.post(
        "http://localhost:4000/api/chat/createRoom",
        data,
        config
      );
      setRoomId(uniqueRoomId);
      console.log(response.data.message);
      window.location.reload();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setShowCreateForm(false);
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    socket.emit("join_room", { roomId, user });
    console.log(roomId);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };

      const data = {
        roomId: roomId,
      };
      const response = await axios.post(
        "http://localhost:4000/api/chat/joinRoom",
        data,
        config
      );
      console.log(response.data.message);
      window.location.reload();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleRoomClick = (roomId, roomName) => {
    setOpenedRoom(roomId);
    setNotifications((prevNotifications) => ({
      ...prevNotifications,
      [roomId]: 0,
    }));
    setRoomId(roomId);
    setRoomName(roomName);
    const groupProfilePic = joinedRooms.find(
      (room) => room.roomId === roomId
    ).groupProfilePic;
    setGroupProfilePic(groupProfilePic);

    // getPublicKeys(roomId);
    socket.emit("join_room", { roomId: roomId, user });
    setShowChat(true);
  };

  const handleRoomsScroll = () => {
    if (roomsListRef.current.scrollTop > 10) {
      console.log("scrolled");
      setSearchShadow(true);
    } else {
      setSearchShadow(false);
    }
  };

  //convert text to ...
  const truncateText = (text, limit) => {
    if (text.length > limit) {
      return text.substring(0, limit) + "...";
    } else {
      return text;
    }
  };

  useEffect(() => {
    const handleNotification = (data) => {
      console.log(`Received notification in room ${data.data.roomId}`);
      if (data.data.roomId !== openedRoom) {
        setNotifications((prevNotifications) => ({
          ...prevNotifications,
          [data.data.roomId]: (prevNotifications[data.data.roomId] || 0) + 1,
        }));
      }
    };

    socket.on("receive_notification", handleNotification);

    return () => {
      socket.off("receive_notification", handleNotification);
    };
  }, [openedRoom]);

  return (
    <div className="chatSystem_parent">
      <div
        className={
          dark ? "rooms_container dark_bg" : "rooms_container light_bg"
        }
        style={{
          borderRight: dark
            ? "1px solid rgb(78, 78, 78)"
            : "1px solid rgb(165, 165, 165)",
        }}
      >
        <div
          className="join_create_container"
          style={{
            borderBottom: dark
              ? "1px solid rgb(78, 78, 78)"
              : "1px solid rgb(165, 165, 165)",
          }}
        >
          <button
            onClick={() => {
              setShowCreateForm(true);
              setShowJoinForm(false);
            }}
            className={
              dark
                ? "dark_bg dark_hover dark_border"
                : "light_bg light_hover light_border"
            }
          >
            Create Room
          </button>
          <button
            onClick={() => {
              setShowJoinForm(true);
              setShowCreateForm(false);
            }}
            className={
              dark
                ? "dark_bg dark_hover dark_border "
                : "light_bg light_hover light_border"
            }
          >
            Join Room
          </button>

          {showCreateForm && (
            <div
              className="create_form_parent"
              onClick={() => setShowCreateForm(false)}
            >
              <div
                className={
                  dark
                    ? "dark_create_form_container"
                    : "light_create_form_container"
                }
                onClick={(e) => e.stopPropagation()}
              >
                <h1>Create Room</h1>
                <form onSubmit={handleCreateRoom}>
                  <input
                    type="text"
                    id="roomName"
                    autoComplete="off"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter Room Name"
                    required
                  />
                  <button type="submit">
                    <RightArrow className="right_arrow_icon" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {showJoinForm && (
            <div
              className="join_form_parent"
              onClick={() => setShowJoinForm(false)}
            >
              <div
                className={
                  dark
                    ? "dark_join_form_container"
                    : "light_join_form_container"
                }
                onClick={(e) => e.stopPropagation()}
              >
                <h1>Join Room</h1>
                <form onSubmit={handleJoinRoom}>
                  <input
                    type="text"
                    id="roomId"
                    autoComplete="off"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter Room Id"
                    required
                  />
                  <button type="submit">
                    <RightArrow className="right_arrow_icon" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="rooms_list">
          <div
            className={
              searchShadow
                ? dark
                  ? "dark_room-filter dark_room-filter-shadow"
                  : "light_room-filter light_room-filter-shadow"
                : dark
                ? "dark_room-filter"
                : "light_room-filter"
            }
          >
            <input
              type="text"
              placeholder="Search for a chat room"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ul
            ref={roomsListRef}
            onScroll={handleRoomsScroll}
            className="custom_scroll_bar"
          >
            {joinedRooms
              .filter((room) =>
                room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((room, index) => (
                <div key={index}>
                  <li
                    key={index}
                    className={dark ? "dark_hover" : "light_hover"}
                  >
                    <div
                      className="room_click"
                      onClick={() =>
                        handleRoomClick(room.roomId, room.roomName)
                      }
                    ></div>
                    {room.groupProfilePic && (
                      <img src={room.groupProfilePic} alt="room_profile_pic" />
                    )}
                    {!room.groupProfilePic && (
                      <Group
                        className={
                          dark ? "dark_group_icon" : "light_group_icon"
                        }
                      />
                    )}
                    <div className="grp_details">
                      <div>
                        <p
                          className={
                            dark
                              ? "room_name dark_primary-font"
                              : "room_name light_primary-font"
                          }
                        >
                          {room.roomName}
                        </p>
                        {room.isRemovedFromRoom && !room.isRoomLeft && (
                          <p
                            className={
                              dark
                                ? "tap_to_chat dark_secondary-font"
                                : "tap_to_chat light_secondary-font"
                            }
                          >
                            {truncateText(
                              `${room.removerName} removed you from the room`,
                              30
                            )}
                          </p>
                        )}
                        {room.isRoomLeft && !room.isRemovedFromRoom && (
                          <p
                            className={
                              dark
                                ? "tap_to_chat dark_secondary-font"
                                : "tap_to_chat light_secondary-font"
                            }
                          >
                            You left the room
                          </p>
                        )}
                        {!room.isRoomLeft && !room.isRemovedFromRoom && (
                          <p
                            className={
                              dark
                                ? "tap_to_chat dark_secondary-font"
                                : "tap_to_chat light_secondary-font"
                            }
                          >
                            Tap to chat
                          </p>
                        )}
                      </div>
                    </div>
                    {notifications[room.roomId] > 0 && (
                      <p
                        className={
                          dark
                            ? "dark_notification_count"
                            : "light_notification_count"
                        }
                      >
                        {notifications[room.roomId]}
                      </p>
                    )}
                  </li>

                  <div
                    className="line"
                    style={{
                      backgroundColor: dark
                        ? "rgb(78, 78, 78)"
                        : "rgb(199, 199, 199)",
                    }}
                  ></div>
                </div>
              ))}
          </ul>
        </div>
      </div>

      {!showChat && (
        <div
          className={
            dark
              ? "default_asset_in_chat_container dark_bg"
              : "default_asset_in_chat_container light_bg"
          }
        >
          <DefaultAsset className="default_asset_in_chat" />
        </div>
      )}

      {showChat && (
        <Chat
          user={user}
          socket={socket}
          roomId={roomId}
          openedRoom={openedRoom}
          roomName={roomName}
          groupProfilePic={groupProfilePic}
        />
      )}
    </div>
  );
}

export default ChatSystem;
