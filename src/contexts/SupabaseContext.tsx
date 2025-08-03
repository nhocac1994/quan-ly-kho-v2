import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, subscribeToRealtime } from '../services/supabaseService';
import { dataService } from '../services/dataService';
import {
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment,
  CompanyInfo,
  User
} from '../types';

interface SupabaseContextType {
  // State
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  inboundShipments: InboundShipment[];
  outboundShipments: OutboundShipment[];
  companyInfo: CompanyInfo[];
  users: User[];
  
  // Loading states
  loading: {
    products: boolean;
    suppliers: boolean;
    customers: boolean;
    inboundShipments: boolean;
    outboundShipments: boolean;
    companyInfo: boolean;
    users: boolean;
  };
  
  // Error states
  errors: {
    products: string | null;
    suppliers: string | null;
    customers: string | null;
    inboundShipments: string | null;
    outboundShipments: string | null;
    companyInfo: string | null;
    users: string | null;
  };
  
  // Actions
  refreshData: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshInboundShipments: () => Promise<void>;
  refreshOutboundShipments: () => Promise<void>;
  refreshCompanyInfo: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  
  // Realtime status
  realtimeStatus: {
    products: boolean;
    suppliers: boolean;
    customers: boolean;
    inboundShipments: boolean;
    outboundShipments: boolean;
    companyInfo: boolean;
    users: boolean;
  };
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inboundShipments, setInboundShipments] = useState<InboundShipment[]>([]);
  const [outboundShipments, setOutboundShipments] = useState<OutboundShipment[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Loading states
  const [loading, setLoading] = useState({
    products: false,
    suppliers: false,
    customers: false,
    inboundShipments: false,
    outboundShipments: false,
    companyInfo: false,
    users: false,
  });

  // Error states
  const [errors, setErrors] = useState({
    products: null as string | null,
    suppliers: null as string | null,
    customers: null as string | null,
    inboundShipments: null as string | null,
    outboundShipments: null as string | null,
    companyInfo: null as string | null,
    users: null as string | null,
  });

  // Realtime status
  const [realtimeStatus, setRealtimeStatus] = useState({
    products: false,
    suppliers: false,
    customers: false,
    inboundShipments: false,
    outboundShipments: false,
    companyInfo: false,
    users: false,
  });

  // Fetch functions
  const fetchProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    setErrors(prev => ({ ...prev, products: null }));
    
    try {
      const data = await dataService.products.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setErrors(prev => ({ ...prev, products: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const fetchSuppliers = async () => {
    setLoading(prev => ({ ...prev, suppliers: true }));
    setErrors(prev => ({ ...prev, suppliers: null }));
    
    try {
      const data = await dataService.suppliers.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setErrors(prev => ({ ...prev, suppliers: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, suppliers: false }));
    }
  };

  const fetchCustomers = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    setErrors(prev => ({ ...prev, customers: null }));
    
    try {
      const data = await dataService.customers.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setErrors(prev => ({ ...prev, customers: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  const fetchInboundShipments = async () => {
    setLoading(prev => ({ ...prev, inboundShipments: true }));
    setErrors(prev => ({ ...prev, inboundShipments: null }));
    
    try {
      // Sử dụng shipmentHeaders thay vì inboundShipments
      const data = await dataService.shipmentHeaders.getByType('inbound');
      setInboundShipments(data);
    } catch (error) {
      console.error('Error fetching inbound shipments:', error);
      setErrors(prev => ({ ...prev, inboundShipments: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, inboundShipments: false }));
    }
  };

  const fetchOutboundShipments = async () => {
    setLoading(prev => ({ ...prev, outboundShipments: true }));
    setErrors(prev => ({ ...prev, outboundShipments: null }));
    
    try {
      // Sử dụng shipmentHeaders thay vì outboundShipments
      const data = await dataService.shipmentHeaders.getByType('outbound');
      setOutboundShipments(data);
    } catch (error) {
      console.error('Error fetching outbound shipments:', error);
      setErrors(prev => ({ ...prev, outboundShipments: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, outboundShipments: false }));
    }
  };

  const fetchCompanyInfo = async () => {
    setLoading(prev => ({ ...prev, companyInfo: true }));
    setErrors(prev => ({ ...prev, companyInfo: null }));
    
    try {
      const data = await dataService.companyInfo.getAll();
      setCompanyInfo(data);
    } catch (error) {
      console.error('Error fetching company info:', error);
      setErrors(prev => ({ ...prev, companyInfo: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, companyInfo: false }));
    }
  };

  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    setErrors(prev => ({ ...prev, users: null }));
    
    try {
      const data = await dataService.users.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrors(prev => ({ ...prev, users: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Refresh functions
  const refreshProducts = async () => {
    await fetchProducts();
  };

  const refreshSuppliers = async () => {
    await fetchSuppliers();
  };

  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const refreshInboundShipments = async () => {
    await fetchInboundShipments();
  };

  const refreshOutboundShipments = async () => {
    await fetchOutboundShipments();
  };

  const refreshCompanyInfo = async () => {
    await fetchCompanyInfo();
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const refreshData = async () => {
    await Promise.all([
      fetchProducts(),
      fetchSuppliers(),
      fetchCustomers(),
      fetchInboundShipments(),
      fetchOutboundShipments(),
      fetchCompanyInfo(),
      fetchUsers(),
    ]);
  };

  // Setup realtime subscriptions
  useEffect(() => {
    console.log('Setting up Supabase realtime subscriptions...');

    // Products subscription
    const productsSubscription = subscribeToRealtime('products', (payload) => {
      console.log('Products realtime update:', payload);
      fetchProducts(); // Refresh data when changes occur
    });

    // Suppliers subscription
    const suppliersSubscription = subscribeToRealtime('suppliers', (payload) => {
      console.log('Suppliers realtime update:', payload);
      fetchSuppliers();
    });

    // Customers subscription
    const customersSubscription = subscribeToRealtime('customers', (payload) => {
      console.log('Customers realtime update:', payload);
      fetchCustomers();
    });

    // Inbound shipments subscription
    const inboundSubscription = subscribeToRealtime('inbound_shipments', (payload) => {
      console.log('Inbound shipments realtime update:', payload);
      fetchInboundShipments();
    });

    // Outbound shipments subscription
    const outboundSubscription = subscribeToRealtime('outbound_shipments', (payload) => {
      console.log('Outbound shipments realtime update:', payload);
      fetchOutboundShipments();
    });

    // Company info subscription
    const companySubscription = subscribeToRealtime('company_info', (payload) => {
      console.log('Company info realtime update:', payload);
      fetchCompanyInfo();
    });

    // Users subscription
    const usersSubscription = subscribeToRealtime('users', (payload) => {
      console.log('Users realtime update:', payload);
      fetchUsers();
    });

    // Update realtime status
    setRealtimeStatus({
      products: true,
      suppliers: true,
      customers: true,
      inboundShipments: true,
      outboundShipments: true,
      companyInfo: true,
      users: true,
    });

    // Initial data fetch
    refreshData();

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up Supabase realtime subscriptions...');
      productsSubscription.unsubscribe();
      suppliersSubscription.unsubscribe();
      customersSubscription.unsubscribe();
      inboundSubscription.unsubscribe();
      outboundSubscription.unsubscribe();
      companySubscription.unsubscribe();
      usersSubscription.unsubscribe();
    };
  }, []);

  const value: SupabaseContextType = {
    // State
    products,
    suppliers,
    customers,
    inboundShipments,
    outboundShipments,
    companyInfo,
    users,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    refreshData,
    refreshProducts,
    refreshSuppliers,
    refreshCustomers,
    refreshInboundShipments,
    refreshOutboundShipments,
    refreshCompanyInfo,
    refreshUsers,
    
    // Realtime status
    realtimeStatus,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}; 