import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom'; // Import useHistory for React Router v5
import { useUserContext } from '../UserContext'; // Import the UserContext
import { Link } from 'react-router-dom'; // Import Link for navigation

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LoginForm = styled.form`
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
`;

const InputWrapper = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #007bff;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const RegisterLink = styled.p`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const RegisterButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #218838;
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { setUserContext } = useUserContext(); // Get setUserContext from the context
  const history = useHistory(); // Use useHistory for React Router v5

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Get user object from Firebase Auth
      setEmail('');
      setPassword('');

      // Store user in context
      setUserContext(user);
      localStorage.setItem('user', JSON.stringify(user)); // Store user object as string
      // Navigate to the /discover/Popular route after successful login
      history.push('/discover/Popular');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Title>Login</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <InputWrapper>
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputWrapper>
        <InputWrapper>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </InputWrapper>
        <SubmitButton type="submit">Login</SubmitButton>
        
        {/* Button to navigate to Register page */}
        <RegisterLink>
          Don't have an account?{' '}
          <Link to="/register">
            <RegisterButton type="button">Go to Register</RegisterButton>
          </Link>
        </RegisterLink>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;
