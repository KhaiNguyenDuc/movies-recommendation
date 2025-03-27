import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Router, Switch, Route, Redirect } from 'react-router-dom';
import history from '../history';
import { connect } from 'react-redux';
import { init } from '../actions';
import ReactGA from 'react-ga';

import Sidebar from './Sidebar';
import MenuMobile from './MenuMobile';
import Discover from './Discover';
import Genre from './Genre';
import Search from './Search';
import Movie from './Movie';
import Person from './Person';
import ShowError from './ShowError';
import Login from '../components/Login';
import Register from '../components/Register';

import NotFound from '../components/NotFound';
import SearchBar from '../components/SearchBar';
import Loader from '../components/Loader';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowLeft,
  faArrowRight,
  faHome,
  faCalendar,
  faPoll,
  faHeart,
  faDotCircle,
  faStar as fasFaStar,
  faSearch,
  faChevronRight,
  faChevronLeft,
  faLink,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as farFaStar } from '@fortawesome/free-regular-svg-icons';

library.add(
  fab,
  faArrowLeft,
  faArrowRight,
  faHome,
  faCalendar,
  faPoll,
  faHeart,
  faDotCircle,
  fasFaStar,
  farFaStar,
  faSearch,
  faChevronRight,
  faChevronLeft,
  faLink,
  faPlay
);

const MainWrapper = styled.div`
  display: flex;
  flex-direction: ${props => (props.isMobile ? 'column' : 'row')};
  position: relative;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  user-select: none;
`;

const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 4rem;

  @media ${props => props.theme.mediaQueries.larger} {
    padding: 6rem 3rem;
  }

  @media ${props => props.theme.mediaQueries.large} {
    padding: 4rem 2rem;
  }
`;

const SearhBarWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 2rem;
`;

ReactGA.initialize('UA-137885307-1');
ReactGA.pageview(window.location.pathname + window.location.search);

const App = ({ init, isLoading }) => {
  const [isMobile, setisMobile] = useState(null);

  useEffect(() => {
    init();

    // Check if the current route is not /login or /register
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register') {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        history.push('/login'); // Redirect to login if not authenticated
      }
    }
  }, []);

  const changeMobile = () => {
    window.matchMedia('(max-width: 80em)').matches
      ? setisMobile(true)
      : setisMobile(false);
  };

  useEffect(() => {
    changeMobile();
    window.addEventListener('resize', changeMobile);
    return () => window.removeEventListener('resize', changeMobile);
  }, []);

  if (isLoading) {
    return (
      <ContentWrapper>
        <Loader />
      </ContentWrapper>
    );
  }

  return (
    <Router history={history}>
      <React.Fragment>
        <MainWrapper isMobile={isMobile}>
          {isMobile ? (
            <MenuMobile />
          ) : (
            <>
              <Sidebar />
              <SearhBarWrapper>
                <SearchBar />
              </SearhBarWrapper>
            </>
          )}
          <ContentWrapper>
            <Switch>
              <Route
                path={process.env.PUBLIC_URL + '/'}
                exact
                render={() => (
                  <Redirect
                    from={process.env.PUBLIC_URL + '/'}
                    to={process.env.PUBLIC_URL + '/discover/Popular'}
                  />
                )}
              />
              <Route
                path={process.env.PUBLIC_URL + '/genres/:name'}
                exact
                component={Genre}
              />
              <Route
                path={process.env.PUBLIC_URL + '/discover/:name'}
                exact
                component={Discover}
              />
              <Route
                path={process.env.PUBLIC_URL + '/search/:query'}
                exact
                component={Search}
              />
              <Route
                path={process.env.PUBLIC_URL + '/movie/:id'}
                exact
                component={Movie}
              />
              <Route
                path={process.env.PUBLIC_URL + '/person/:id'}
                exact
                component={Person}
              />

              {/* Public Routes */}
              <Route
                path={process.env.PUBLIC_URL + '/login'}
                exact
                component={Login}
              />
              <Route
                path={process.env.PUBLIC_URL + '/register'}
                exact
                component={Register}
              />

              <Route
                path="/404"
                component={() => (
                  <NotFound title="Upps!" subtitle={`This doesn't exist...`} />
                )}
              />
              <Route
                path={process.env.PUBLIC_URL + '/error'}
                component={ShowError}
              />
              <Route
                component={() => (
                  <NotFound title="Upps!" subtitle={`This doesn't exist...`} />
                )}
              />
            </Switch>
          </ContentWrapper>
        </MainWrapper>
      </React.Fragment>
    </Router>
  );
};

const mapStateToProps = ({ geral }) => {
  return { isLoading: geral.loading };
};

export default connect(
  mapStateToProps,
  { init }
)(App);
