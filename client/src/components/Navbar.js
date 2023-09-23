import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Navbar.css';
import {ReactComponent as Profile} from '../icons/profile.svg';
import Login from './Login.js';
import Signup from './Signup.js';
import { useTheme } from './ThemeContext';
import {ReactComponent as Light} from '../icons/light_mode.svg';
import {ReactComponent as Dark} from '../icons/dark_mode.svg';

function Navbar()
{
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showSignupForm, setShowSignupForm] = useState(false);
    const [user, setUser] = useState({});
    const { dark, setDark } = useTheme();
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
        <div className={dark ? 'navbar_parent dark_bg' : 'navbar_parent light_bg'} style={{ borderBottom: dark ? '1px solid rgb(78, 78, 78)' : '1px solid rgb(165, 165, 165)' }}>
            <a href=''>Conversify</a>
            <ul className='nav_tabs'>
                <li onClick={()=>setDark(!dark)} className={dark ? 'theme dark_hover dark_border' : 'theme light_hover light_border'}>
                        {dark ? <Dark className='dark_icon'/> : <Light className='light_icon'/>}
                </li>
                {!userToken && <li onClick={()=>setShowLoginForm(true)} className={dark ? 'login dark_hover dark_border' : 'login light_hover light_border'}>Log in</li>}
                {!userToken && <li onClick={()=>setShowSignupForm(true)} className={dark ? 'signup dark_hover dark_border' : 'signup light_hover light_border'}>Sign up</li>}
                {userToken && user?.profilePic && <li className='profile_pic_wrapper'><img src={user.profilePic} alt='profile_pic'/></li>}
                {userToken && !user.profilePic && <li className={dark ? 'profile_icon_wrapper dark_hover dark_border' : 'profile_icon_wrapper light_hover light_border'} onMouseEnter={() => setProfileDropDown(true)}><Profile className='profile_icon'/></li>}
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
