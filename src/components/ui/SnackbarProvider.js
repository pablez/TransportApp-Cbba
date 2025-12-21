import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '../../components/admin/Snackbar';

const SnackbarContext = createContext(null);

export const SnackbarProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(3000);
  const [actionLabel, setActionLabel] = useState(null);
  const [actionCallback, setActionCallback] = useState(null);

  const showSnackbar = useCallback((msg, ms = 3000, actLabel = null, actCb = null) => {
    setMessage(String(msg || ''));
    setDuration(ms);
    setActionLabel(actLabel);
    setActionCallback(() => actCb);
    setVisible(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setVisible(false);
    setTimeout(() => setMessage(''), 300);
    setActionLabel(null);
    setActionCallback(null);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      <Snackbar visible={visible} message={message} duration={duration} onHide={hideSnackbar} actionLabel={actionLabel} onAction={() => { if (actionCallback) actionCallback(); }} />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
};

export default SnackbarProvider;
