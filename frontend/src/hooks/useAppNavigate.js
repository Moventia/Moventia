import { useNavigate, useLocation } from 'react-router-dom';

export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return (to, options) => {
    // If the user tries to navigate to the exact same path they are currently on,
    // we use replace: true so that we don't push a duplicate entry to the browser history.
    const targetPath = typeof to === 'string' ? to : to?.pathname;
    
    if (targetPath && targetPath === location.pathname) {
      if (typeof to === 'number') {
        navigate(to); // It's a delta, like navigate(-1)
        return;
      }
      navigate(to, { ...options, replace: true });
    } else {
      navigate(to, options);
    }
  };
}
