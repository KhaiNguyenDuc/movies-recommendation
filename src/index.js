import React, { Fragment } from 'react';
import { Helmet } from 'react-helmet';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import { ThemeProvider } from 'styled-components';
import theme from './utils/theme';
import GlobalStyle from './utils/globals';
import App from './containers/App';

import '../node_modules/react-modal-video/scss/modal-video.scss';
import '../node_modules/slick-carousel/slick/slick.css';
import '../node_modules/slick-carousel/slick/slick-theme.css';
import UserProvider from './UserContext';

ReactDOM.render(
  <Provider store={store}>
    <UserProvider>
    <ThemeProvider theme={theme}>
      <Fragment>
        <Helmet>
          <title>Movie Library</title>
          <meta
            name="description"
            content=""
          />
          <link rel="canonical" href="https://movies.fidalgo.dev" />
        </Helmet>
        <App />
        <GlobalStyle />
      </Fragment>
    </ThemeProvider>
    </UserProvider>
  </Provider>,
  document.querySelector('#root')
);
