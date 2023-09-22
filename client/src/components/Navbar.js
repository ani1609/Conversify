import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Navbar.css';
import {ReactComponent as Profile} from '../icons/profile.svg';
import Login from './Login.js';
import Signup from './Signup.js';

function Navbar()
{
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showSignupForm, setShowSignupForm] = useState(false);
    const [user, setUser] = useState({});
    const userToken = JSON.parse(localStorage.getItem('chatUserToken'));
    const [profileDropDown, setProfileDropDown] = useState(false);
    

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
            setUser(response.data.user);
            console.log(response.data.user);
        }
        catch (error)
        {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() =>
    {
        if(userToken)
        {
            fetchDataFromProtectedAPI(userToken);
        }
    }, []);

    const handleLogout = () =>
    {
        localStorage.removeItem('chatUserToken');
        setUser(null);
        window.location.reload();
    }



    return(
        <div className='navbar_parent'>
            <a href=''>Conversify</a>
            {user?.name && <p>{user.name}</p>}
            <ul className='nav_tabs'>
                {!userToken && <li onClick={()=>setShowLoginForm(true)} className='login'>Log in</li>}
                {!userToken && <li onClick={()=>setShowSignupForm(true)} className='signup'>Sign up</li>}
                {userToken && <li onMouseEnter={() => setProfileDropDown(true)} onMouseLeave={() => setProfileDropDown(true)}>
                    {user?.profilePic ?
                        <img src={user.profilePic} alt='profile pic' />
                        :
                        <Profile className='profile_icon'/>
                    }
                </li>}
            </ul>
            {profileDropDown &&
                    <ul className='profile_dropdown' onMouseEnter={() => setProfileDropDown(true)} onMouseLeave={() => setProfileDropDown(true)}>
                        <li>Profile</li>
                        <li onClick={handleLogout}>Log Out</li>
                    </ul>
            }

            {showLoginForm &&
                <div className='login_parent'><Login /></div>
            }

            {showSignupForm &&
                <div className='signup_parent'><Signup/></div>
            }
        </div>
    );
}

export default Navbar;
