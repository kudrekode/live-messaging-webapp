import { useState } from 'react';
import {useNavigate} from 'react-router-dom';

const LoginPage = () => {

    //The useState hook is used to
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    //The useNavigate hook is used to push to correct pages (updated from useHistory in react v6)
    const navigate = useNavigate();

    //Handle Login using async function to ensure that the API has responded before moving forward
    const handleLogin = async () => {
        const response = await fetch('URL', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // We send cookies with requests to ensure JWT can be more secure and dont have to store details in local storage
        });

        if (!response.ok) {
            console.error('Login request failed:', response.status, response.statusText);
            alert('Login failed. Please check your credentials.');
            return;
        }

        const data = await response.json();

        //Log the response for debugging purposes to ensure the API response is as expected (not recommended for production)
        console.log('Full response data:', data);

        if (data.message === 'Login successful' && data.role !== undefined) {

            localStorage.setItem('authToken', data.token); // Save JWT token from API response
            console.log('Auth token:', data.token); // Verify token is present (again debug)

            localStorage.setItem('userId', data.userId);
            localStorage.setItem('name', data.name); // Save name

            if (parseInt(data.role) === 1) {
                navigate('/admin-dashboard');
            } else if (parseInt(data.role) === 2) {
                navigate('/user-dashboard');
            } else {
                alert('Unknown role');
            }
        } else {
            alert('Invalid login');
        }

    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h1>LOGIN</h1>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="login-input"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="login-input"
                />
                <button onClick={handleLogin} className="login-button">
                    Login
                </button>
            </div>
        </div>
    );
};

export default LoginPage;