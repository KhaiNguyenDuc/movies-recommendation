import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from '../firebase';
import { useHistory } from 'react-router-dom'; // Use useHistory from react-router-dom v5
import styled from 'styled-components';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RegisterForm = styled.form`
  padding: 2rem;
  border-radius: 8px;
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

const LoginButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #5a6268;
  }
`;

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const history = useHistory(); // Use useHistory from React Router v5

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Register the user
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');

      // Redirect to login page after successful registration
      history.push('/login'); // Use history.push() to navigate
    } catch (err) {
      setError(err.message);
    }
  };

  const navigateToLogin = () => {
    history.push('/login'); // Navigate to login page
  };

  return (
    <RegisterContainer>
      <RegisterForm onSubmit={handleSubmit}>
        <Title>Register</Title>
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
        <SubmitButton type="submit">Register</SubmitButton>

        {/* Login button that navigates to the login page */}
        <LoginButton type="button" onClick={navigateToLogin}>
          Already have an account? Login
        </LoginButton>
      </RegisterForm>
    </RegisterContainer>
  );
};

export default Register;
