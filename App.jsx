import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, setInitDone } from './redux/slices/authSlice';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { isInitializing } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If this fails (expired/invalid token), the auth slice's rejected
      // reducer is expected to clear the token and still flip isInitializing off.
      dispatch(fetchCurrentUser());
    } else {
      dispatch(setInitDone());
    }
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <span className="app-loading__spinner" aria-hidden="true" />
        <span className="app-loading__text">Đang tải...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
