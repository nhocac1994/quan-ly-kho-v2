import { supabaseAPIs } from './supabaseService';
import {
  Product,
  Supplier,
  Customer,
  InboundShipment,
  OutboundShipment,
  CompanyInfo,
  User,
  InboundDetail,
  OutboundDetail
} from '../types';

// Chỉ sử dụng Supabase - không có Mock Data
const DATA_SOURCE = 'supabase';

// Service adapter chỉ sử dụng Supabase
export const dataService = {
  // Products API
  products: {
    getAll: async (): Promise<Product[]> => {
      try {
        return await supabaseAPIs.products.getAll();
      } catch (error) {
        console.error('Failed to get products from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Product | null> => {
      try {
        return await supabaseAPIs.products.getById(id);
      } catch (error) {
        console.error('Failed to get product from Supabase:', error);
        throw error;
      }
    },

    create: async (product: Omit<Product, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<Product> => {
      try {
        return await supabaseAPIs.products.create(product);
      } catch (error) {
        console.error('Failed to create product in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, product: Partial<Product>): Promise<Product> => {
      try {
        return await supabaseAPIs.products.update(id, product);
      } catch (error) {
        console.error('Failed to update product in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.products.delete(id);
      } catch (error) {
        console.error('Failed to delete product in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.products.subscribe(callback);
    }
  },

  // Suppliers API
  suppliers: {
    getAll: async (): Promise<Supplier[]> => {
      try {
        return await supabaseAPIs.suppliers.getAll();
      } catch (error) {
        console.error('Failed to get suppliers from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Supplier | null> => {
      try {
        return await supabaseAPIs.suppliers.getById(id);
      } catch (error) {
        console.error('Failed to get supplier from Supabase:', error);
        throw error;
      }
    },

    create: async (supplier: Omit<Supplier, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<Supplier> => {
      try {
        return await supabaseAPIs.suppliers.create(supplier);
      } catch (error) {
        console.error('Failed to create supplier in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
      try {
        return await supabaseAPIs.suppliers.update(id, supplier);
      } catch (error) {
        console.error('Failed to update supplier in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.suppliers.delete(id);
      } catch (error) {
        console.error('Failed to delete supplier in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.suppliers.subscribe(callback);
    }
  },

  // Customers API
  customers: {
    getAll: async (): Promise<Customer[]> => {
      try {
        return await supabaseAPIs.customers.getAll();
      } catch (error) {
        console.error('Failed to get customers from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Customer | null> => {
      try {
        return await supabaseAPIs.customers.getById(id);
      } catch (error) {
        console.error('Failed to get customer from Supabase:', error);
        throw error;
      }
    },

    create: async (customer: Omit<Customer, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<Customer> => {
      try {
        return await supabaseAPIs.customers.create(customer);
      } catch (error) {
        console.error('Failed to create customer in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
      try {
        return await supabaseAPIs.customers.update(id, customer);
      } catch (error) {
        console.error('Failed to update customer in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.customers.delete(id);
      } catch (error) {
        console.error('Failed to delete customer in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.customers.subscribe(callback);
    }
  },

  // Inbound Shipments API
  inboundShipments: {
    getAll: async (): Promise<InboundShipment[]> => {
      try {
        return await supabaseAPIs.inboundShipments.getAll();
      } catch (error) {
        console.error('Failed to get inbound shipments from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<InboundShipment | null> => {
      try {
        return await supabaseAPIs.inboundShipments.getById(id);
      } catch (error) {
        console.error('Failed to get inbound shipment from Supabase:', error);
        throw error;
      }
    },

    create: async (shipment: Omit<InboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<InboundShipment> => {
      try {
        return await supabaseAPIs.inboundShipments.create(shipment);
      } catch (error) {
        console.error('Failed to create inbound shipment in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, shipment: Partial<InboundShipment>): Promise<InboundShipment> => {
      try {
        return await supabaseAPIs.inboundShipments.update(id, shipment);
      } catch (error) {
        console.error('Failed to update inbound shipment in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.inboundShipments.delete(id);
      } catch (error) {
        console.error('Failed to delete inbound shipment in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.inboundShipments.subscribe(callback);
    }
  },

  // Outbound Shipments API
  outboundShipments: {
    getAll: async (): Promise<OutboundShipment[]> => {
      try {
        return await supabaseAPIs.outboundShipments.getAll();
      } catch (error) {
        console.error('Failed to get outbound shipments from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<OutboundShipment | null> => {
      try {
        return await supabaseAPIs.outboundShipments.getById(id);
      } catch (error) {
        console.error('Failed to get outbound shipment from Supabase:', error);
        throw error;
      }
    },

    create: async (shipment: Omit<OutboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<OutboundShipment> => {
      try {
        return await supabaseAPIs.outboundShipments.create(shipment);
      } catch (error) {
        console.error('Failed to create outbound shipment in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, shipment: Partial<OutboundShipment>): Promise<OutboundShipment> => {
      try {
        return await supabaseAPIs.outboundShipments.update(id, shipment);
      } catch (error) {
        console.error('Failed to update outbound shipment in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.outboundShipments.delete(id);
      } catch (error) {
        console.error('Failed to delete outbound shipment in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.outboundShipments.subscribe(callback);
    }
  },

  // Company Info API
  companyInfo: {
    getAll: async (): Promise<CompanyInfo[]> => {
      try {
        return await supabaseAPIs.companyInfo.getAll();
      } catch (error) {
        console.error('Failed to get company info from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<CompanyInfo | null> => {
      try {
        return await supabaseAPIs.companyInfo.getById(id);
      } catch (error) {
        console.error('Failed to get company info from Supabase:', error);
        throw error;
      }
    },

    create: async (company: Omit<CompanyInfo, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<CompanyInfo> => {
      try {
        return await supabaseAPIs.companyInfo.create(company);
      } catch (error) {
        console.error('Failed to create company info in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, company: Partial<CompanyInfo>): Promise<CompanyInfo> => {
      try {
        return await supabaseAPIs.companyInfo.update(id, company);
      } catch (error) {
        console.error('Failed to update company info in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.companyInfo.delete(id);
      } catch (error) {
        console.error('Failed to delete company info in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.companyInfo.subscribe(callback);
    }
  },

  // Users API
  users: {
    getAll: async (): Promise<User[]> => {
      try {
        return await supabaseAPIs.users.getAll();
      } catch (error) {
        console.error('Failed to get users from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<User | null> => {
      try {
        return await supabaseAPIs.users.getById(id);
      } catch (error) {
        console.error('Failed to get user from Supabase:', error);
        throw error;
      }
    },

    create: async (user: Omit<User, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<User> => {
      try {
        return await supabaseAPIs.users.create(user);
      } catch (error) {
        console.error('Failed to create user in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, user: Partial<User>): Promise<User> => {
      try {
        return await supabaseAPIs.users.update(id, user);
      } catch (error) {
        console.error('Failed to update user in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.users.delete(id);
      } catch (error) {
        console.error('Failed to delete user in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.users.subscribe(callback);
    }
  },

  // Inbound Details API - trả về mảng rỗng (chưa có bảng trong Supabase)
  inboundDetails: {
    getAll: async (): Promise<InboundDetail[]> => {
      console.log('Inbound details not available in Supabase yet');
      return [];
    },

    getById: async (id: string): Promise<InboundDetail | null> => {
      console.log('Inbound details not available in Supabase yet');
      return null;
    },

    create: async (detail: Omit<InboundDetail, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<InboundDetail> => {
      throw new Error('Inbound details not available in Supabase yet');
    },

    update: async (id: string, detail: Partial<InboundDetail>): Promise<InboundDetail> => {
      throw new Error('Inbound details not available in Supabase yet');
    },

    delete: async (id: string): Promise<void> => {
      throw new Error('Inbound details not available in Supabase yet');
    },

    subscribe: (callback: (payload: any) => void) => {
      return { unsubscribe: () => {} };
    }
  },

  // Outbound Details API - trả về mảng rỗng (chưa có bảng trong Supabase)
  outboundDetails: {
    getAll: async (): Promise<OutboundDetail[]> => {
      console.log('Outbound details not available in Supabase yet');
      return [];
    },

    getById: async (id: string): Promise<OutboundDetail | null> => {
      console.log('Outbound details not available in Supabase yet');
      return null;
    },

    create: async (detail: Omit<OutboundDetail, 'id' | 'ngay_tao' | 'nguoi_tao' | 'update'>): Promise<OutboundDetail> => {
      throw new Error('Outbound details not available in Supabase yet');
    },

    update: async (id: string, detail: Partial<OutboundDetail>): Promise<OutboundDetail> => {
      throw new Error('Outbound details not available in Supabase yet');
    },

    delete: async (id: string): Promise<void> => {
      throw new Error('Outbound details not available in Supabase yet');
    },

    subscribe: (callback: (payload: any) => void) => {
      return { unsubscribe: () => {} };
    }
  }
};

// Export để sử dụng trong components
export const {
  products,
  suppliers,
  customers,
  inboundShipments,
  outboundShipments,
  companyInfo,
  users,
  inboundDetails,
  outboundDetails
} = dataService; 