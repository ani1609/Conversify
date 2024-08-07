import { useState } from "react";
import "../index.css";
import "../styles/Signup.css";
import axios from "axios";
import { useTheme } from "./ThemeContext";
import * as openpgp from "openpgp/lightweight";

function Signup() {
  // const [userExists, setUserExists] = useState(false);
  // const [passwordUnmatched, setPasswordUnmatched] = useState(false);
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    armoredPublicKey: "",
    encryptedPrivateKey: "",
    password: "",
    confirmPassword: "",
  });
  const { dark } = useTheme();

  const generateKeyPair = async (user) => {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: "ecc",
      curve: "curve25519",
      userIDs: [{ name: user.name, email: user.email }],
      format: "armored",
    });
    return { privateKey, publicKey };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { privateKey, publicKey } = await generateKeyPair(signupData);
    try {
      if (signupData.password !== signupData.confirmPassword) {
        // setPasswordUnmatched(true);
        console.error("Passwords do not match");
        return;
      }
      const response = await axios.post(
        "http://localhost:4000/api/users/signup",
        {
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          armoredPublicKey: publicKey,
          encryptedPrivateKey: privateKey,
        }
      );
      localStorage.setItem(
        "chatUserToken",
        JSON.stringify(response.data.token)
      );
      // setUserExists(false);
      // setPasswordUnmatched(false);
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      window.location.reload();
    } catch (error) {
      // if (error.response.status === 409)
      // {
      //     setUserExists(true);
      //     console.error(error.response.data.message);
      //     return;
      // }
      // console.error(error.response.data.message);
      console.log(error);
    }
  };

  return (
    <div
      className={
        dark ? "dark_signup_form_container" : "light_signup_form_container"
      }
      onClick={(e) => e.stopPropagation()}
    >
      <h1>Create Your Account</h1>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Name"
          value={signupData.name}
          onChange={(e) =>
            setSignupData({ ...signupData, name: e.target.value })
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={signupData.email}
          onChange={(e) =>
            setSignupData({ ...signupData, email: e.target.value })
          }
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={signupData.password}
          onChange={(e) =>
            setSignupData({ ...signupData, password: e.target.value })
          }
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={signupData.confirmPassword}
          onChange={(e) =>
            setSignupData({ ...signupData, confirmPassword: e.target.value })
          }
          required
        />
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
}

export default Signup;
