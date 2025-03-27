    import { useEffect } from 'react';
    import { useHistory } from 'react-router-dom';

    const useAuthRedirect = () => {
    const history = useHistory();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const currentPath = window.location.pathname;

        // Check if the user is not logged in and is not on login or register page
        if (!user && currentPath !== '/login' && currentPath !== '/register') {
        // Redirect to login page if the user is not logged in
        history.push('/login');
        }
    }, [history]); // Add `history` as a dependency
    };

    export default useAuthRedirect;
