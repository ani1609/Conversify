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

  const handleRemoveMember = async (email) => {
    socket.emit("removeMember", { roomId, email });

    // try {
    //   const config = {
    //     headers: {
    //       Authorization: `Bearer ${userToken}`,
    //     },
    //   };
    //   const response = await axios.post(
    //     "http://localhost:4000/api/chat/removeMember",
    //     {
    //       roomId,
    //       email,
    //     },
    //     config
    //   );
    //   console.log(response.data);
    // } catch (error) {
    //   console.error("Error removing member ", error);
    // }
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
                {member.ProfilePic ? (
                  <img src={member.ProfilePic} alt="profile" />
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
                        <p>Remove</p>
                        <span
                          style={{
                            backgroundColor: dark ? "#ededed" : "#000000",
                          }}
                        ></span>
                        <p>Make admin</p>
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
