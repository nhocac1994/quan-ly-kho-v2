import { supabaseAPIs } from './supabaseService';
import { supabase } from './supabaseService';
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

    create: async (product: Omit<Product, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<Product> => {
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

    create: async (supplier: Omit<Supplier, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<Supplier> => {
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
        // First, delete all shipment headers that reference this supplier
        const { data: shipmentHeaders, error: headersError } = await supabase
          .from('shipment_headers')
          .select('id')
          .or(`supplier_id.eq.${id},supplier_name.eq.${id}`);
        
        if (headersError) {
          console.error('Failed to get shipment headers for supplier:', headersError);
          throw headersError;
        }
        
        // Delete shipment items for each header
        if (shipmentHeaders && shipmentHeaders.length > 0) {
          const headerIds = shipmentHeaders.map(header => header.id);
          
          // Delete shipment items first
          const { error: itemsError } = await supabase
            .from('shipment_items')
            .delete()
            .in('shipment_header_id', headerIds);
          
          if (itemsError) {
            console.error('Failed to delete shipment items:', itemsError);
            throw itemsError;
          }
          
          // Then delete shipment headers
          const { error: deleteHeadersError } = await supabase
            .from('shipment_headers')
            .delete()
            .in('id', headerIds);
          
          if (deleteHeadersError) {
            console.error('Failed to delete shipment headers:', deleteHeadersError);
            throw deleteHeadersError;
          }
        }
        
        // Finally delete the supplier
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

    create: async (customer: Omit<Customer, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<Customer> => {
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
        // First, delete all shipment headers that reference this customer
        const { data: shipmentHeaders, error: headersError } = await supabase
          .from('shipment_headers')
          .select('id')
          .or(`customer_id.eq.${id},customer_name.eq.${id}`);
        
        if (headersError) {
          console.error('Failed to get shipment headers for customer:', headersError);
          throw headersError;
        }
        
        // Delete shipment items for each header
        if (shipmentHeaders && shipmentHeaders.length > 0) {
          const headerIds = shipmentHeaders.map(header => header.id);
          
          // Delete shipment items first
          const { error: itemsError } = await supabase
            .from('shipment_items')
            .delete()
            .in('shipment_header_id', headerIds);
          
          if (itemsError) {
            console.error('Failed to delete shipment items:', itemsError);
            throw itemsError;
          }
          
          // Then delete shipment headers
          const { error: deleteHeadersError } = await supabase
            .from('shipment_headers')
            .delete()
            .in('id', headerIds);
          
          if (deleteHeadersError) {
            console.error('Failed to delete shipment headers:', deleteHeadersError);
            throw deleteHeadersError;
          }
        }
        
        // Finally delete the customer
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

  // Legacy Inbound Shipments API - Đã deprecated
  inboundShipments: {
    getAll: async (): Promise<InboundShipment[]> => {
      console.warn('inboundShipments.getAll() is deprecated. Use shipmentHeaders.getByType("inbound") instead.');
      return [];
    },

    getById: async (id: string): Promise<InboundShipment | null> => {
      console.warn('inboundShipments.getById() is deprecated. Use shipmentHeaders.getById() instead.');
      return null;
    },

    create: async (shipment: Omit<InboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<InboundShipment> => {
      console.warn('inboundShipments.create() is deprecated. Use shipmentHeaders.create() instead.');
      throw new Error('Deprecated API');
    },

    update: async (id: string, shipment: Partial<InboundShipment>): Promise<InboundShipment> => {
      console.warn('inboundShipments.update() is deprecated. Use shipmentHeaders.update() instead.');
      throw new Error('Deprecated API');
    },

    delete: async (id: string): Promise<void> => {
      console.warn('inboundShipments.delete() is deprecated. Use shipmentHeaders.delete() instead.');
    },

    subscribe: (callback: (payload: any) => void) => {
      console.warn('inboundShipments.subscribe() is deprecated. Use shipmentHeaders.subscribe() instead.');
      return { unsubscribe: () => {} };
    }
  },

  // Legacy Outbound Shipments API - Đã deprecated
  outboundShipments: {
    getAll: async (): Promise<OutboundShipment[]> => {
      console.warn('outboundShipments.getAll() is deprecated. Use shipmentHeaders.getByType("outbound") instead.');
      return [];
    },

    getById: async (id: string): Promise<OutboundShipment | null> => {
      console.warn('outboundShipments.getById() is deprecated. Use shipmentHeaders.getById() instead.');
      return null;
    },

    create: async (shipment: Omit<OutboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<OutboundShipment> => {
      console.warn('outboundShipments.create() is deprecated. Use shipmentHeaders.create() instead.');
      throw new Error('Deprecated API');
    },

    update: async (id: string, shipment: Partial<OutboundShipment>): Promise<OutboundShipment> => {
      console.warn('outboundShipments.update() is deprecated. Use shipmentHeaders.update() instead.');
      throw new Error('Deprecated API');
    },

    delete: async (id: string): Promise<void> => {
      console.warn('outboundShipments.delete() is deprecated. Use shipmentHeaders.delete() instead.');
    },

    subscribe: (callback: (payload: any) => void) => {
      console.warn('outboundShipments.subscribe() is deprecated. Use shipmentHeaders.subscribe() instead.');
      return { unsubscribe: () => {} };
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

    create: async (company: Omit<CompanyInfo, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<CompanyInfo> => {
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

  // Shipment Headers API (cho cả inbound và outbound)
  shipmentHeaders: {
    getAll: async (): Promise<any[]> => {
      try {
        return await supabaseAPIs.shipmentHeaders.getAll();
      } catch (error) {
        console.error('Failed to get shipment headers from Supabase:', error);
        throw error;
      }
    },

    getByType: async (type: 'inbound' | 'outbound'): Promise<any[]> => {
      try {
        return await supabaseAPIs.shipmentHeaders.getByType(type);
      } catch (error) {
        console.error('Failed to get shipment headers by type from Supabase:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<any | null> => {
      try {
        return await supabaseAPIs.shipmentHeaders.getById(id);
      } catch (error) {
        console.error('Failed to get shipment header from Supabase:', error);
        throw error;
      }
    },

    create: async (header: any): Promise<any> => {
      try {
        return await supabaseAPIs.shipmentHeaders.create(header);
      } catch (error) {
        console.error('Failed to create shipment header in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, header: any): Promise<any> => {
      try {
        return await supabaseAPIs.shipmentHeaders.update(id, header);
      } catch (error) {
        console.error('Failed to update shipment header in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.shipmentHeaders.delete(id);
      } catch (error) {
        console.error('Failed to delete shipment header in Supabase:', error);
        throw error;
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      return supabaseAPIs.shipmentHeaders.subscribe(callback);
    }
  },

  // Shipment Items API
  shipmentItems: {
    getByHeaderId: async (headerId: string): Promise<any[]> => {
      try {
        return await supabaseAPIs.shipmentItems.getByHeaderId(headerId);
      } catch (error) {
        console.error('Failed to get shipment items from Supabase:', error);
        throw error;
      }
    },

    create: async (item: any): Promise<any> => {
      try {
        return await supabaseAPIs.shipmentItems.create(item);
      } catch (error) {
        console.error('Failed to create shipment item in Supabase:', error);
        throw error;
      }
    },

    createMany: async (items: any[]): Promise<any[]> => {
      try {
        return await supabaseAPIs.shipmentItems.createMany(items);
      } catch (error) {
        console.error('Failed to create multiple shipment items in Supabase:', error);
        throw error;
      }
    },

    update: async (id: string, item: any): Promise<any> => {
      try {
        return await supabaseAPIs.shipmentItems.update(id, item);
      } catch (error) {
        console.error('Failed to update shipment item in Supabase:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await supabaseAPIs.shipmentItems.delete(id);
      } catch (error) {
        console.error('Failed to delete shipment item in Supabase:', error);
        throw error;
      }
    },

    deleteByHeaderId: async (headerId: string): Promise<void> => {
      try {
        await supabaseAPIs.shipmentItems.deleteByHeaderId(headerId);
      } catch (error) {
        console.error('Failed to delete shipment items by header ID in Supabase:', error);
        throw error;
      }
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

    create: async (user: Omit<User, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<User> => {
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
  shipmentHeaders,
  shipmentItems
} = dataService; 