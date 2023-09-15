import {Link, useNavigate} from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Navbar.css';
import {ReactComponent as Profile} from '../icons/profile.svg';

function Navbar()
{
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showSignupForm, setShowSignupForm] = useState(false);
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [passwordUnmatched, setPasswordUnmatched] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
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

    const handleLogin = async (e) =>
    {
        e.preventDefault();
        try
        {
            const response = await axios.post('http://localhost:3000/api/users/login', loginData);
            localStorage.setItem('chatUserToken', JSON.stringify(response.data.token));
            fetchDataFromProtectedAPI(response.data.token);
            setInvalidEmail(false);
            setShowLoginForm(false);
            setLoginData({
                email: '',
                password: ''
            });
        }
        catch(error)
        {
            if (error.response.status === 401)
            {
                setInvalidEmail(true);
                console.error(error.response.data.message);
                return;
            }
            console.error(error.response.data.message);
        }
    }

    const handleSignup = async (e) =>
    {
        e.preventDefault();
        try
        {
            if(signupData.password !== signupData.confirmPassword)
            {
                setPasswordUnmatched(true);
                console.error('Passwords do not match');
                return;
            }
            const response = await axios.post('http://localhost:3000/api/users/signup', signupData);
            localStorage.setItem('chatUserToken', JSON.stringify(response.data.token));
            fetchDataFromProtectedAPI(response.data.token);
            setUserExists(false);
            setPasswordUnmatched(false);
            setShowSignupForm(false);
            setSignupData({
                name: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
        }
        catch(error)
        {
            if (error.response.status === 409)
            {
                setUserExists(true);
                console.error(error.response.data.message);
                return;
            }
            console.error(error.response.data.message);
        }
        setShowSignupForm(false);
    }

    const handleLogout = () =>
    {
        localStorage.removeItem('chatUserToken');
        window.location.reload();
        setUser(null);
    }


    return(
        <div className='navbar_parent'>
            <a href=''>Chat</a>
            {user?.name && <p>{user.name}</p>}
            <ul className='nav_tabs'>
                {!userToken && <li onClick={()=>setShowLoginForm(true)}>Log in</li>}
                {!userToken && <li onClick={()=>setShowSignupForm(true)}>Sign up</li>}
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
                <div className='login_form_container'>
                    <span onClick={()=>setShowLoginForm(false)}>X</span>
                    <form onSubmit={handleLogin}>
                        <input
                            type='email'
                            placeholder='email'
                            value={loginData.email}
                            onChange={(e)=>setLoginData({...loginData, email: e.target.value})}
                            required
                        />
                        <input
                            type='password'
                            placeholder='Password'
                            value={loginData.password}
                            onChange={(e)=>setLoginData({...loginData, password: e.target.value})}
                            required
                        />
                        <button type='submit'>Log in</button>
                    </form>
                </div>
            }

            {showSignupForm &&
                <div className='signup_form_container'>
                    <span onClick={()=>setShowSignupForm(false)}>X</span>
                    <form onSubmit={handleSignup}>
                        <input 
                            type='text'
                            placeholder='Name'
                            value={signupData.name}
                            onChange={(e)=>setSignupData({...signupData, name: e.target.value})}
                            required
                        />
                        <input
                            type='email'
                            placeholder='Email'
                            value={signupData.email}
                            onChange={(e)=>setSignupData({...signupData, email: e.target.value})}
                            required
                        />
                        <input 
                            type='password'
                            placeholder='Password'
                            value={signupData.password}
                            onChange={(e)=>setSignupData({...signupData, password: e.target.value})}
                            required
                        />
                        <input
                            type='password'
                            placeholder='Confirm Password'
                            value={signupData.confirmPassword}
                            onChange={(e)=>setSignupData({...signupData, confirmPassword: e.target.value})}
                            required
                        />
                        <button type='submit'>Sign up</button>
                    </form>
                </div>
            }
        </div>
    );
}

export default Navbar;