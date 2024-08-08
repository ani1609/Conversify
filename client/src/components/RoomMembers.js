import { useTheme } from "./ThemeContext";
import "../styles/RoomMembers.css";
import { ReactComponent as Profile } from "../icons/profile.svg";
import { X } from "lucide-react";

function RoomMembers(props) {
  const { user, roomMembers, setShowRoomMembersComponent } = props;
  const { dark } = useTheme();

  const isUserAdmin = roomMembers.some(
    (member) => member.isAdmin && member.email === user.email
  );

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
            <>
              <li key={index}>
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
                <p>{member.name}</p>
                {isUserAdmin && (
                  <div>
                    <button>Remove</button>
                    <button>Make admin</button>
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
            </>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default RoomMembers;
