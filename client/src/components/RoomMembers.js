import { useState } from "react";
import "../styles/RoomMembers.css";
import { ReactComponent as Profile } from "../icons/profile.svg";
import { X } from "lucide-react";
import axios from "axios";
import { ReactComponent as Options } from "../icons/options.svg";
import { useTheme } from "./ThemeContext";

function RoomMembers(props) {
  const { user, socket, roomId, roomMembers, setShowRoomMembersComponent } =
    props;
  const { dark } = useTheme();
  const userToken = JSON.parse(localStorage.getItem("chatUserToken"));
  const [openOptions, setOpenOptions] = useState({});

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const handleRemoveMember = async (userToRemove) => {
    try {
      socket.emit("remove_member", {
        roomId,
        removedUser: userToRemove,
        removerUser: user,
      });

      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };

      const response = await axios.post(
        "http://localhost:4000/api/chat/removeMember",
        {
          roomId,
          userToRemove,
        },
        config
      );
      console.log(response.data.message);
      setOpenOptions({});
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const isUserAdmin = roomMembers.some(
    (member) => member.isAdmin && member.email === user.email
  );

  const toggleOptions = (index) => {
    setOpenOptions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleMakeAdmin = async (userToMakeAdmin) => {
    socket.emit("make_admin", {
      roomId,
      userToMakeAdmin,
    });

    const config = {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    };

    try {
      const response = await axios.post(
        "http://localhost:4000/api/chat/makeAdmin",
        {
          roomId,
          userToMakeAdmin,
        },
        config
      );
      console.log(response.data.message);
      setOpenOptions({});
    } catch (error) {
      console.error("Error making admin:", error);
    }
  };

  const handleDismissAsAdmin = async (userToDismissAsAdmin) => {
    socket.emit("dismiss_as_admin", {
      roomId,
      userToDismissAsAdmin,
    });

    const config = {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    };

    try {
      const response = await axios.post(
        "http://localhost:4000/api/chat/dismissAsAdmin",
        {
          roomId,
          userToDismissAsAdmin,
        },
        config
      );
      console.log(response.data.message);
      setOpenOptions({});
    } catch (error) {
      console.error("Error dismissing as admin:", error);
    }
  };

  console.log("the member are", roomMembers);

  return (
    <div className="room_members_parent">
      <div
        className={
          dark ? "dark_room_members_container" : "light_room_members_container"
        }
      >
        <div className="room_close_icon">
          <X
            onClick={() => setShowRoomMembersComponent(false)}
            size={24}
            stroke="#ededed"
          />
        </div>
        <h1>Room Members</h1>
        <ul>
          {roomMembers.map((member, index) => (
            <div key={index}>
              <li>
                {member.profilePic ? (
                  <img
                    src={`http://localhost:4000/${member.profilePic}`}
                    alt="profile"
                  />
                ) : (
                  <Profile
                    className={
                      dark
                        ? "dark_room_members_profile_icon"
                        : "light_room_members_profile_icon"
                    }
                  />
                )}
                <div className="name_admin_container">
                  <h1>
                    {member.name} {member.isAdmin && <span>(admin)</span>}
                  </h1>
                  <p>joined at {formatTimestamp(member.joinTimestamp)}</p>
                </div>
                {isUserAdmin && (
                  <div className="room_members_options">
                    <Options
                      onClick={() => toggleOptions(index)}
                      size={20}
                      className={
                        dark
                          ? "dark_room_members_options_icon"
                          : "light_room_members_options_icon"
                      }
                    />
                    {openOptions[index] && (
                      <div
                        className={
                          dark
                            ? "room_members_options_list dark_primary-font"
                            : "room_members_options_list light_primary-font"
                        }
                      >
                        <p onClick={() => handleRemoveMember(member)}>Remove</p>
                        <span
                          style={{
                            backgroundColor: dark ? "#ededed" : "#000000",
                          }}
                        ></span>
                        {member.isAdmin ? (
                          <p onClick={() => handleDismissAsAdmin(member)}>
                            Dismiss as admin
                          </p>
                        ) : (
                          <p onClick={() => handleMakeAdmin(member)}>
                            Make admin
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
              {roomMembers.length - 1 !== index && (
                <div
                  style={{
                    width: "100%",
                    height: "1px",
                    backgroundColor: "#D5D5D5",
                    marginTop: "2px",
                  }}
                ></div>
              )}
            </div>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default RoomMembers;
