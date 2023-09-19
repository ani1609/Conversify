import {Link, useNavigate} from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from "axios";
import '../index.css';
import '../styles/Navbar.css';
import {ReactComponent as Profile} from '../icons/profile.svg';
import * as openpgp from 'openpgp/lightweight';
import { generateKey } from 'openpgp/lightweight';
import { set } from 'mongoose';

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
        armoredPublicKey: '',
        encryptedPrivateKey: '',
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

    const generateKeyPair = async (user) =>
    {
        // const { privateKey, publicKey } = await openpgp.generateKey({
        //     type: 'ecc', // Type of the key, defaults to ECC
        //     curve: 'curve25519', // ECC curve name, defaults to curve25519
        //     userIDs: [{ name: user.name, email: user.email }], // you can pass multiple user IDs
        //     format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
        // });
    
        // console.log("armored private key \n",privateKey);    // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
        // console.log("armored public key \n",publicKey);    // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

        // const actualPrivateKey = await openpgp.readPrivateKey({ armoredKey: privateKey });
        // console.log("actual private key \n",actualPrivateKey);

        const { privateKey, publicKey} = await openpgp.generateKey
        ({
            type: 'ecc', 
            curve: 'curve25519', 
            userIDs: [{ name: user.name, email: user.email }],
            format: 'armored'
        });

        setSignupData({...signupData, armoredPublicKey: publicKey});
        
    
        // console.log("armored private key ",privateKey);
        // console.log("armored public key ",publicKey);

        const actualPublicKey = await openpgp.readKey({ armoredKey: publicKey });
        // console.log("actual public key ",actualPublicKey);

        const actualPrivateKey= await openpgp.readPrivateKey({ armoredKey: privateKey });
        // console.log("actual private key ",actualPrivateKey);

        const passphrase = user.password;

        const encryptedPrivateKey = await openpgp.encryptKey({
            privateKey : actualPrivateKey,
            passphrase : passphrase,
        });

        setSignupData({...signupData, encryptedPrivateKey: encryptedPrivateKey});

        // console.log("encrypted private key ",encryptedPrivateKey);


        const encrypted = await openpgp.encrypt
        ({
            message: await openpgp.createMessage({ text: 'achha thik h' }),
            encryptionKeys: actualPublicKey,
        });
        // console.log("encrypted message",encrypted);


        const message = await openpgp.readMessage({
            armoredMessage: encrypted // parse armored message
        });
        // console.log("parsed message",message);


        const { data: decrypted} = await openpgp.decrypt({
            message,
            decryptionKeys: actualPrivateKey
        });
        // console.log("decrypted message", decrypted); 

        return { privateKey, publicKey };
    }

    useEffect(() =>
    {
        if (user)
        {
            // console.log("user's name is ", user);
            // console.log("user's public key is ", user.armoredPublicKey);
            // console.log("user's private key is ", user.encryptedPrivateKey);
        }
        if(user?.name && user?.email)
        {
            const {privateKey, publicKey} = generateKeyPair(user);
        }
        
    }, [user]);

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
        const { privateKey, publicKey } = await generateKeyPair(signupData);
        try
        {
            if(signupData.password !== signupData.confirmPassword)
            {
                setPasswordUnmatched(true);
                console.error('Passwords do not match');
                return;
            }
            const response = await axios.post('http://localhost:3000/api/users/signup', {
                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                armoredPublicKey: publicKey,
                encryptedPrivateKey: privateKey,
            });
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
            // if (error.response.status === 409)
            // {
            //     setUserExists(true);
            //     console.error(error.response.data.message);
            //     return;
            // }
            // console.error(error.response.data.message);
            console.log(error);
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
