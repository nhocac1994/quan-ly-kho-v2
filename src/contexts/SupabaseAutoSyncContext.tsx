import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';

interface AutoSyncConfig {
  isEnabled: boolean;
  interval: number; // seconds cho auto sync
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
  refreshData: () => Promise<void>;
  showUpdateNotification: boolean;
}

// Tạo hash từ data để detect changes
const createDataHash = (data: any): string => {
  return btoa(JSON.stringify(data)).slice(0, 16);
};

// Lưu config vào localStorage
const saveConfigToStorage = (config: AutoSyncConfig) => {
  localStorage.setItem('supabase_auto_sync_config', JSON.stringify(config));
};

// Lấy config từ localStorage
const getConfigFromStorage = (): AutoSyncConfig => {
  const saved = localStorage.getItem('supabase_auto_sync_config');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Default config
  return {
    isEnabled: true,
    interval: 60, // 60 seconds (1 phút)
    lastDataHash: ''
  };
};

const AutoSyncContext = createContext<AutoSyncContextType | undefined>(undefined);

export const SupabaseAutoSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    products, 
    suppliers, 
    customers, 
    inboundShipments, 
    outboundShipments, 
    companyInfo, 
    users,
    refreshData,
    realtimeStatus
  } = useSupabase();

  const [config, setConfig] = useState<AutoSyncConfig>(getConfigFromStorage);
  // Lấy sync count từ localStorage
  const getInitialSyncCount = (): number => {
    const saved = localStorage.getItem('supabase_auto_sync_syncCount');
    return saved ? parseInt(saved, 10) : 0;
  };

  const [status, setStatus] = useState<AutoSyncStatus>({
    isRunning: false,
    lastSync: null,
    error: null,
    syncCount: getInitialSyncCount(),
    isConnected: true, // Supabase luôn connected
    isProcessing: false,
    lastDataUpdate: null,
    dataVersion: 0
  });

  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncLockRef = useRef(false);

  // Lưu config khi thay đổi
  useEffect(() => {
    saveConfigToStorage(config);
  }, [config]);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<AutoSyncConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Kiểm tra kết nối Supabase
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Kiểm tra realtime status
      const allConnected = Object.values(realtimeStatus).every(status => status);
      return allConnected;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra kết nối Supabase:', error);
      return false;
    }
  }, [realtimeStatus]);

  // Refresh data từ Supabase
  const refreshDataFromSupabase = useCallback(async (): Promise<boolean> => {
    try {
      await refreshData();
      return true;
    } catch (error) {
      console.error('❌ Lỗi refresh data từ Supabase:', error);
      return false;
    }
  }, [refreshData]);

  // Thực hiện sync
  const performSync = useCallback(async () => {
    if (syncLockRef.current) {
      console.log('⏳ Sync đang chạy, bỏ qua...');
      return;
    }

    syncLockRef.current = true;
    setStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      console.log('🔄 Bắt đầu sync với Supabase...');
      
      // Kiểm tra kết nối
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log('❌ Không thể kết nối Supabase');
        setStatus(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: 'Không thể kết nối Supabase',
          isConnected: false 
        }));
        return;
      }

      // Refresh data từ Supabase
      const success = await refreshDataFromSupabase();
      if (success) {
        const newSyncCount = status.syncCount + 1;
        localStorage.setItem('supabase_auto_sync_syncCount', newSyncCount.toString());
        setStatus(prev => ({ 
          ...prev, 
          syncCount: newSyncCount,
          lastSync: new Date().toISOString(),
          error: null,
          isConnected: true,
          isProcessing: false
        }));
        console.log('✅ Sync thành công');
      } else {
        setStatus(prev => ({ 
          ...prev, 
          error: 'Không thể refresh data từ Supabase',
          isProcessing: false 
        }));
        console.log('❌ Sync thất bại');
      }
    } catch (error: any) {
      console.error('❌ Lỗi sync:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: `Lỗi sync: ${error?.message || error}`,
        isProcessing: false 
      }));
    } finally {
      syncLockRef.current = false;
    }
  }, [checkConnection, refreshDataFromSupabase]);

  // Refresh data
  const refreshDataHandler = useCallback(async () => {
    await refreshDataFromSupabase();
  }, [refreshDataFromSupabase]);

  // Bắt đầu auto-sync
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (config.isEnabled && config.interval > 0) {
      // Thực hiện sync ngay lập tức
      performSync();
      
      // Thiết lập interval cho auto sync
      intervalRef.current = setInterval(performSync, config.interval * 1000);
      setStatus(prev => ({ ...prev, isRunning: true }));
      
      console.log(`🔄 Auto sync đã bắt đầu với interval ${config.interval}s`);
    }
  }, [config.isEnabled, config.interval, performSync]);

  // Dừng auto-sync
  const stopAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus(prev => ({ ...prev, isRunning: false }));
    console.log('⏹️ Auto sync đã dừng');
  }, []);

  // Manual sync
  const performManualSync = useCallback(async () => {
    await performSync();
  }, [performSync]);

  // Reset stats
  const resetStats = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      syncCount: 0,
      lastSync: null,
      error: null,
      dataVersion: 0
    }));
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto start nếu enabled
  useEffect(() => {
    if (config.isEnabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
  }, [config.isEnabled, config.interval]);

  const value: AutoSyncContextType = {
    config,
    status,
    updateConfig,
    startAutoSync,
    stopAutoSync,
    performManualSync,
    resetStats,
    refreshData: refreshDataHandler,
    showUpdateNotification
  };

  return (
    <AutoSyncContext.Provider value={value}>
      {children}
    </AutoSyncContext.Provider>
  );
};

export const useSupabaseAutoSync = (): AutoSyncContextType => {
  const context = useContext(AutoSyncContext);
  if (context === undefined) {
    throw new Error('useSupabaseAutoSync must be used within a SupabaseAutoSyncProvider');
  }
  return context;
}; 