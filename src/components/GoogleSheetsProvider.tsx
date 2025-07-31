import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { Box, Typography, CircularProgress } from '@mui/material';
import { initializeGoogleSheets } from '../services/googleSheetsService';

interface GoogleSheetsProviderProps {
  children: React.ReactNode;
}

export const GoogleSheetsProvider: React.FC<GoogleSheetsProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initGoogleSheets = async () => {
      try {
        await initializeGoogleSheets();
        setIsInitialized(true);
      } catch (err) {
        console.warn('Google Sheets not accessible, using mock data');
        setIsInitialized(true); // Vẫn khởi tạo thành công với mock data
      }
    };

    initGoogleSheets();
  }, []);

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={2}>
        <Typography variant="h6" color="error" gutterBottom>
          Lỗi Kết Nối
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={500}>
          {error}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={500}>
          Vui lòng kiểm tra file .env và cấu hình Google Service Account theo hướng dẫn trong GOOGLE_SETUP.md
        </Typography>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={2}>
        <CircularProgress />
        <Typography>Đang kết nối Google Sheets...</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}; 