// Our own history object so we can redirect on action creators
// We use normal router because of this and pass it our history object
import { createBrowserHistory } from 'history';

export default createBrowserHistory({
    basename: process.env.PUBLIC_URL, // This will take care of your GitHub Pages subdirectory
});
