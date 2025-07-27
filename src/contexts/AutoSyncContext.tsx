import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  initializeGoogleSheets, 
  getSheetData,
  syncDataFromGoogleSheets
} from '../services/googleSheetsService';
import { 
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment
} from '../types';

interface AutoSyncConfig {
  isEnabled: boolean;
  interval: number; // seconds cho auto sync
  syncDirection: 'upload' | 'download' | 'bidirectional';
  lastDataHash: string;
}

interface AutoSyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  error: string | null;
  syncCount: number;
  isConnected: boolean;
  isProcessing: boolean;
  lastDataUpdate: string | null;
  dataVersion: number;
}

interface AutoSyncContextType {
  config: AutoSyncConfig;
  status: AutoSyncStatus;
  updateConfig: (newConfig: Partial<AutoSyncConfig>) => void;
  startAutoSync: () => void;
  stopAutoSync: () => void;
  performManualSync: () => Promise<void>;
  resetStats: () => void;
  forceSync: () => Promise<void>;
  refreshData: () => Promise<void>;
  forceDownloadFromSheets: () => Promise<boolean>;
  showUpdateNotification: boolean;
  isRateLimited: boolean;
}

const AutoSyncContext = createContext<AutoSyncContextType | undefined>(undefined);

// Tạo hash cho dữ liệu để kiểm tra thay đổi
const createDataHash = (data: any): string => {
  const dataString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Lưu config vào localStorage
const saveConfigToStorage = (config: AutoSyncConfig) => {
  localStorage.setItem('autoSyncConfig', JSON.stringify(config));
};

// Lấy config từ localStorage
const getConfigFromStorage = (): AutoSyncConfig => {
  const saved = localStorage.getItem('autoSyncConfig');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Lỗi khi parse auto sync config:', error);
    }
  }
  
  // Default config
  return {
    isEnabled: false, // Tắt mặc định để tránh rate limiting
    interval: 30, // 30 giây để tránh rate limiting
    syncDirection: 'download',
    lastDataHash: ''
  };
};

export const AutoSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AutoSyncConfig>(getConfigFromStorage);
  const [status, setStatus] = useState<AutoSyncStatus>({
    isRunning: false,
    lastSync: null,
    error: null,
    syncCount: 0,
    isConnected: false,
    isProcessing: false,
    lastDataUpdate: null,
    dataVersion: 0
  });

  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncLockRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Kiểm tra kết nối Google Sheets
  const checkConnection = useCallback(async () => {
    try {
      await initializeGoogleSheets();
      setStatus(prev => ({ ...prev, isConnected: true }));
      return true;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra kết nối:', error);
      setStatus(prev => ({ ...prev, isConnected: false }));
      return false;
    }
  }, []);

  // Tải dữ liệu từ Google Sheets
  const downloadDataFromSheets = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Đang tải dữ liệu từ Google Sheets...');

      // Sử dụng syncDataFromGoogleSheets để map dữ liệu đúng cách
      const syncedData = await syncDataFromGoogleSheets();

      // Lưu vào localStorage với dữ liệu đã được map
      localStorage.setItem('products', JSON.stringify(syncedData.products));
      localStorage.setItem('suppliers', JSON.stringify(syncedData.suppliers));
      localStorage.setItem('customers', JSON.stringify(syncedData.customers));
      localStorage.setItem('inboundShipments', JSON.stringify(syncedData.inboundShipments));
      localStorage.setItem('outboundShipments', JSON.stringify(syncedData.outboundShipments));

      // Tạo hash mới
      const newHash = createDataHash(syncedData);

      // Kiểm tra thay đổi
      if (newHash !== config.lastDataHash) {
        setShowUpdateNotification(true);
        setTimeout(() => setShowUpdateNotification(false), 5000);
        
        setConfig(prev => ({ ...prev, lastDataHash: newHash }));
        saveConfigToStorage({ ...config, lastDataHash: newHash });
      }

      setStatus(prev => ({
        ...prev,
        lastDataUpdate: new Date().toISOString(),
        dataVersion: prev.dataVersion + 1,
        error: null
      }));

      console.log('✅ Tải dữ liệu thành công từ Google Sheets với mapping đúng');
      return true;

    } catch (error) {
      console.error('❌ Lỗi tải dữ liệu:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Lỗi tải dữ liệu từ Google Sheets'
      }));
      return false;
    }
  }, [config.lastDataHash]);

  // Thực hiện sync
  const performSync = useCallback(async () => {
    if (syncLockRef.current || isRateLimited) {
      console.log('⏸️ Sync bị khóa hoặc rate limited');
      return;
    }

    syncLockRef.current = true;
    setStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      console.log('🔄 Bắt đầu sync...');
      
      // Kiểm tra kết nối
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log('❌ Không thể kết nối Google Sheets');
        setStatus(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: 'Không thể kết nối Google Sheets',
          isConnected: false 
        }));
        return;
      }

      // Tải dữ liệu từ Google Sheets (không cần lock vì đã được quản lý ở đây)
      const success = await downloadDataFromSheets();
      if (success) {
        setStatus(prev => ({ 
          ...prev, 
          syncCount: prev.syncCount + 1,
          lastSync: new Date().toISOString(),
          error: null,
          isConnected: true,
          isProcessing: false
        }));
        console.log('✅ Sync thành công');
      } else {
        setStatus(prev => ({ 
          ...prev, 
          error: 'Không thể tải dữ liệu từ Google Sheets',
          isProcessing: false 
        }));
        console.log('❌ Sync thất bại');
      }
    } catch (error: any) {
      console.error('❌ Lỗi sync:', error);
      
      // Kiểm tra rate limiting
      if (error?.message?.includes('429') || error?.status === 429) {
        setIsRateLimited(true);
        setStatus(prev => ({ 
          ...prev, 
          error: 'Rate limited - Đợi 1 phút trước khi thử lại',
          isProcessing: false 
        }));
        
        // Tự động reset rate limit sau 1 phút
        setTimeout(() => {
          setIsRateLimited(false);
          setStatus(prev => ({ ...prev, error: null }));
        }, 60000);
      } else {
        setStatus(prev => ({ 
          ...prev, 
          error: `Lỗi sync: ${error?.message || error}`,
          isProcessing: false 
        }));
      }
    } finally {
      syncLockRef.current = false;
    }
  }, [checkConnection, downloadDataFromSheets, isRateLimited]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await downloadDataFromSheets();
  }, [downloadDataFromSheets]);

  // Force download từ Google Sheets
  const forceDownloadFromSheets = useCallback(async (): Promise<boolean> => {
    return await downloadDataFromSheets();
  }, [downloadDataFromSheets]);

  // Bắt đầu auto-sync
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (config.isEnabled && config.interval > 0 && !isRateLimited) {
      // Thực hiện sync ngay lập tức
      performSync();
      
      // Thiết lập interval cho auto sync
      intervalRef.current = setInterval(performSync, config.interval * 1000);
      setStatus(prev => ({ ...prev, isRunning: true }));
      
      console.log(`🔄 Auto sync đã bắt đầu với interval ${config.interval}s`);
    }
  }, [config.isEnabled, config.interval, performSync, isRateLimited]);

  // Dừng auto-sync
  const stopAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus(prev => ({ ...prev, isRunning: false }));
    console.log('⏹️ Auto sync đã dừng');
  }, []);

  // Force sync ngay lập tức
  const forceSync = useCallback(async () => {
    if (syncLockRef.current) {
      console.log('🔄 Sync đang chạy, bỏ qua force sync');
      return;
    }
    await performSync();
  }, [performSync]);

  // Cập nhật config
  const updateConfig = useCallback((newConfig: Partial<AutoSyncConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    saveConfigToStorage(updatedConfig);
    
    // Restart auto-sync nếu cần
    if (updatedConfig.isEnabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
  }, [config, startAutoSync, stopAutoSync]);

  // Sync thủ công
  const performManualSync = useCallback(async () => {
    await performSync();
  }, [performSync]);

  // Reset stats
  const resetStats = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      syncCount: 0,
      lastSync: null,
      error: null
    }));
  }, []);

  // Khởi tạo khi component mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Kiểm tra kết nối ban đầu
      checkConnection();
      
      // Tải dữ liệu từ Google Sheets khi khởi động
      downloadDataFromSheets().then((success) => {
        if (success) {
          console.log('✅ Khởi tạo dữ liệu thành công từ Google Sheets');
        } else {
          console.log('⚠️ Không thể tải dữ liệu từ Google Sheets, sử dụng dữ liệu local');
        }
        
        // Bắt đầu auto-sync sau khi tải dữ liệu
        if (config.isEnabled) {
          startAutoSync();
        }
      });
    }
  }, [config.isEnabled, checkConnection, downloadDataFromSheets, startAutoSync]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const value: AutoSyncContextType = {
    config,
    status,
    updateConfig,
    startAutoSync,
    stopAutoSync,
    performManualSync,
    resetStats,
    forceSync,
    refreshData,
    forceDownloadFromSheets,
    showUpdateNotification,
    isRateLimited
  };

  return (
    <AutoSyncContext.Provider value={value}>
      {children}
    </AutoSyncContext.Provider>
  );
};

export const useAutoSync = (): AutoSyncContextType => {
  const context = useContext(AutoSyncContext);
  if (!context) {
    throw new Error('useAutoSync must be used within an AutoSyncProvider');
  }
  return context;
}; 