import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import StickyBox from 'react-sticky-box';
import { slide as Menu } from 'react-burger-menu';

import SearchBar from '../components/SearchBar';
import TmdbLogoGreen from '../svg/tmdbgreen.svg';
import MenuItem from '../components/MenuItem';
import { useUserContext } from '../UserContext';
import {getCustomRecommendations} from '../api/recommendation';

const WrapperStickyBox = styled(StickyBox)`
  width: 100%;
  z-index: 999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background-color: var(--color-primary-lighter);
  box-shadow: 0 2px 40px var(--shadow-color);
`;

const Hamburguer = styled.div`
  border: none;
  outline: none;
  display: flex;
  flex-direction: column;
  align-self: center;
  justify-content: space-around;
  width: 25px;
  line-height: 1;
  height: auto;
  background-color: transparent;
  cursor: pointer;
`;

const Bar = styled.span`
  transition: all 0.3s;
  border-radius: 10px;
  margin: 2px 0;
  height: 4px;
  width: 100%;
  display: inline-block;
  background-color: var(--color-primary);
`;

const Heading = styled.h2`
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  margin: 0 0 1rem 1rem;
  &:not(:first-child) {
    margin-top: 4rem;
  }
`;

const LinkWrap = styled(Link)`
  text-decoration: none;
  display: block;
  outline: none;
  margin-bottom: 0.5rem;
`;

const StyledCoffe = styled.a`
  display: flex !important;
  outline: none;
  justify-content: center !important;
  align-items: center !important;
  padding: 0.5rem 2rem;
  color: #000000;
  background-color: #ffffff;
  border-radius: 3px;
  font-family: 'Montserrat', sans-serif;
  border: 1px solid transparent;
  text-decoration: none;
  font-family: 'Montserrat';
  font-size: 1.2rem;
  letter-spacing: 0.6px;
  box-shadow: 0px 1px 2px rgba(190, 190, 190, 0.5);
  margin: 2rem auto;
  transition: 0.3s all linear;

  &img {
    width: 27px;
    box-shadow: none;
    border: none;
    vertical-align: middle;
  }

  &:hover,
  &:active,
  &:focus {
    text-decoration: none;
    box-shadow: 0px 1px 2px 2px rgba(190, 190, 190, 0.5);
    opacity: 0.85;
    color: #000000;
  }
`;

const CopyRight = styled.div`
  display: flex;
  align-self: center;
  align-items: center;
  color: ${props => (props.mobile ? '#fff' : 'var(--color-primary-dark)')};
  margin-bottom: ${props => (props.mobile ? '2rem' : '')};
`;

const StyledLink = styled.a`
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
  color: inherit;
`;

const Svg = styled.img`
  max-width: 100%;
  height: 3rem;
`;

const LogoutButton = styled.button`
  background-color: #ff6347;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  margin-top: 1rem;

  &:hover {
    background-color: #ff4500;
    transform: scale(1.05);
  }

  &:active {
    background-color: #e53e34;
  }
`;

var styles = {
  bmBurgerButton: {
    display: 'none',
  },
  bmCrossButton: {
    height: '24px',
    width: '24px',
    marginRight: '1rem',
  },
  bmCross: {
    background: '#fafafa',
  },
  bmMenuWrap: {
    position: 'fixed',
    height: '100%',
    top: 0,
    left: 0,
  },
  bmMenu: {
    background: '#263238',
    overflowY: 'scroll',
    padding: '2.5em 1.5em',
  },
  bmItemList: {
    color: '#fafafa',
    padding: '0.8rem',
  },
  bmItem: {
    outline: 'none',
  },
  bmOverlay: {
    top: 0,
    background: 'rgba(0, 0, 0, 0.3)',
  },
};

const MenuMobile = ({ genres, staticCategories, selected }) => {
  const [isOpened, setisOpened] = useState(false);
  const [userStored, setUser] = useState(null);
  const { user, setUserContext } = useUserContext(); 
  useEffect(() => {
    // Retrieve user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.clear() // Remove user from localStorage
    setUser(null); // Clear the user state
    window.location.href = '/login'; // Redirect to login page
  };

  const isMenuOpen = ({ isOpened }) => {
    setisOpened(isOpened);
  };

  const handleGetRecommendations = async () => {
    const recommendationsList = await getCustomRecommendations();
    console.log(recommendationsList); // You can check the recommendations here
  };
  return (
    <React.Fragment>
      <WrapperStickyBox>
        <Hamburguer onClick={() => setisOpened(true)}>
          <Bar />
          <Bar />
          <Bar />
        </Hamburguer>
        <SearchBar />
      </WrapperStickyBox>
      <Menu isOpen={isOpened} onStateChange={isMenuOpen} styles={styles}>
        {userStored ? (
          <div>
            <h3>Hello, {userStored.email}</h3> {/* You can change the field based on the user object */}
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
            <LogoutButton onClick={() => handleGetRecommendations()}>Get Recommendations</LogoutButton>
          </div>

          
        ) : null}

        <Heading>Discover</Heading>
        {renderStatic(staticCategories, selected, setisOpened)}
        <Heading>Genres</Heading>
        {renderGenres(genres, selected, setisOpened)}
        <StyledCoffe
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.buymeacoffee.com/fidalgodev"
        >
          <img
            src="https://www.buymeacoffee.com/assets/img/BMC-btn-logo.svg"
            alt="Buy me a coffee"
          />
          <span style={{ marginLeft: '5px' }}>Buy me a coffee</span>
        </StyledCoffe>
        <CopyRight mobile={true}>
          Copyright ©
          <StyledLink href="https://www.github.com/fidalgodev">
            Fidalgo
          </StyledLink>
        </CopyRight>
        <Svg
          src={`${TmdbLogoGreen}`}
          alt="The Movie Database"
          style={{ marginBottom: '2rem' }}
        />
      </Menu>
    </React.Fragment>
  );
};

function renderStatic(categories, selected, setisOpened) {
  return categories.map((category, i) => (
    <LinkWrap
      to={`${process.env.PUBLIC_URL}/discover/${category}`}
      key={i}
      onClick={setisOpened ? () => setisOpened(false) : null}
    >
      <MenuItem
        mobile={setisOpened ? 1 : 0}
        title={category}
        selected={category === selected ? true : false}
      />
    </LinkWrap>
  ));
}

function renderGenres(genres, selected, setisOpened) {
  return genres.map(genre => (
    <LinkWrap
      to={`${process.env.PUBLIC_URL}/genres/${genre.name}`}
      key={genre.id}
      onClick={setisOpened ? () => setisOpened(false) : null}
    >
      <MenuItem
        mobile={setisOpened ? 1 : 0}
        title={genre.name}
        selected={genre.name === selected ? true : false}
      />
    </LinkWrap>
  ));
}

const mapStateToProps = ({ geral }) => {
  return {
    staticCategories: geral.staticCategories,
    genres: geral.genres,
    selected: geral.selected,
  };
};

export default connect(mapStateToProps)(MenuMobile);
