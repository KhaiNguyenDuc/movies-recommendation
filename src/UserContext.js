// src/contexts/UserContext.js
import React, { createContext, useState, useContext } from 'react';

// Create UserContext
const UserContext = createContext();

// Create a custom hook to use the UserContext
export const useUserContext = () => {
  return useContext(UserContext);
};

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // This function will be used to update the user state when they log in
  const setUserContext = (user) => {
    setUser(user);
  };

  return (
    <UserContext.Provider value={{ user, setUserContext }}>
      {children}
    </UserContext.Provider>
  );
};


export default UserProvider;
