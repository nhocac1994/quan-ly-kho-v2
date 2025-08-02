import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// Cấu hình Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Khởi tạo Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Realtime subscriptions
export const subscribeToRealtime = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      callback
    )
    .subscribe();
};

// Products API với realtime
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    return data;
  },

  create: async (product: Omit<Product, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Realtime subscription
  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('products', callback);
  }
};

// Suppliers API với realtime
export const suppliersAPI = {
  getAll: async (): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<Supplier | null> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }

    return data;
  },

  create: async (supplier: Omit<Supplier, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplier)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('suppliers', callback);
  }
};

// Customers API với realtime
export const customersAPI = {
  getAll: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<Customer | null> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }

    return data;
  },

  create: async (customer: Omit<Customer, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('customers', callback);
  }
};

// Inbound Shipments API với realtime
export const inboundShipmentsAPI = {
  getAll: async (): Promise<InboundShipment[]> => {
    const { data, error } = await supabase
      .from('inbound_shipments')
      .select('*')
      .order('ngay_nhap', { ascending: false });

    if (error) {
      console.error('Error fetching inbound shipments:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<InboundShipment | null> => {
    const { data, error } = await supabase
      .from('inbound_shipments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inbound shipment:', error);
      throw error;
    }

    return data;
  },

  create: async (shipment: Omit<InboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<InboundShipment> => {
    const { data, error } = await supabase
      .from('inbound_shipments')
      .insert([shipment])
      .select()
      .single();

    if (error) {
      console.error('Error creating inbound shipment:', error);
      throw error;
    }

    // Cập nhật số lượng tồn kho
    await updateProductStock(shipment.san_pham_id, shipment.sl_nhap, 'inbound');

    return data;
  },

  update: async (id: string, shipment: Partial<InboundShipment>): Promise<InboundShipment> => {
    const { data, error } = await supabase
      .from('inbound_shipments')
      .update(shipment)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inbound shipment:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('inbound_shipments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inbound shipment:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('inbound_shipments', callback);
  }
};

// Outbound Shipments API với realtime
export const outboundShipmentsAPI = {
  getAll: async (): Promise<OutboundShipment[]> => {
    const { data, error } = await supabase
      .from('outbound_shipments')
      .select('*')
      .order('ngay_xuat', { ascending: false });

    if (error) {
      console.error('Error fetching outbound shipments:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<OutboundShipment | null> => {
    const { data, error } = await supabase
      .from('outbound_shipments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching outbound shipment:', error);
      throw error;
    }

    return data;
  },

  create: async (shipment: Omit<OutboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<OutboundShipment> => {
    const { data, error } = await supabase
      .from('outbound_shipments')
      .insert([shipment])
      .select()
      .single();

    if (error) {
      console.error('Error creating outbound shipment:', error);
      throw error;
    }

    // Cập nhật số lượng tồn kho
    await updateProductStock(shipment.san_pham_id, shipment.sl_xuat, 'outbound');

    return data;
  },

  update: async (id: string, shipment: Partial<OutboundShipment>): Promise<OutboundShipment> => {
    const { data, error } = await supabase
      .from('outbound_shipments')
      .update(shipment)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating outbound shipment:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('outbound_shipments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting outbound shipment:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('outbound_shipments', callback);
  }
};

// Company Info API
export const companyInfoAPI = {
  getAll: async (): Promise<CompanyInfo[]> => {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) {
      console.error('Error fetching company info:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<CompanyInfo | null> => {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company info:', error);
      throw error;
    }

    return data;
  },

  create: async (company: Omit<CompanyInfo, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<CompanyInfo> => {
    const { data, error } = await supabase
      .from('company_info')
      .insert([company])
      .select()
      .single();

    if (error) {
      console.error('Error creating company info:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, company: Partial<CompanyInfo>): Promise<CompanyInfo> => {
    const { data, error } = await supabase
      .from('company_info')
      .update(company)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company info:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('company_info')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company info:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('company_info', callback);
  }
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('ngay_tao', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }

    return data;
  },

  create: async (user: Omit<User, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('users', callback);
  }
};

// Helper function để cập nhật số lượng tồn kho
const updateProductStock = async (sanPhamId: string, quantity: number, type: 'inbound' | 'outbound') => {
  try {
    // Lấy sản phẩm hiện tại
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('sl_ton')
      .eq('san_pham_id', sanPhamId)
      .single();

    if (fetchError) {
      console.error('Error fetching product for stock update:', fetchError);
      return;
    }

    // Tính toán số lượng mới
    const currentStock = product.sl_ton || 0;
    const newStock = type === 'inbound' ? currentStock + quantity : currentStock - quantity;

    // Cập nhật số lượng tồn kho
    const { error: updateError } = await supabase
      .from('products')
      .update({ sl_ton: Math.max(0, newStock) })
      .eq('san_pham_id', sanPhamId);

    if (updateError) {
      console.error('Error updating product stock:', updateError);
    }
  } catch (error) {
    console.error('Error in updateProductStock:', error);
  }
};

// Shipment Headers API
export const shipmentHeadersAPI = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('shipment_headers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shipment headers:', error);
      throw error;
    }

    return data || [];
  },

  getByType: async (type: 'inbound' | 'outbound'): Promise<any[]> => {
    const { data, error } = await supabase
      .from('shipment_headers')
      .select('*')
      .eq('shipment_type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shipment headers by type:', error);
      throw error;
    }

    return data || [];
  },

  getById: async (id: string): Promise<any | null> => {
    const { data, error } = await supabase
      .from('shipment_headers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching shipment header:', error);
      throw error;
    }

    return data;
  },

  create: async (header: any): Promise<any> => {
    const { data, error } = await supabase
      .from('shipment_headers')
      .insert(header)
      .select()
      .single();

    if (error) {
      console.error('Error creating shipment header:', error);
      throw error;
    }

    return data;
  },

  update: async (id: string, header: any): Promise<any> => {
    const { data, error } = await supabase
      .from('shipment_headers')
      .update(header)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shipment header:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('shipment_headers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shipment header:', error);
      throw error;
    }
  },

  subscribe: (callback: (payload: any) => void) => {
    return subscribeToRealtime('shipment_headers', callback);
  }
};

// Shipment Items API
export const shipmentItemsAPI = {
  getByHeaderId: async (headerId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('shipment_items')
      .select('*')
      .eq('shipment_header_id', headerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching shipment items:', error);
      throw error;
    }

    return data || [];
  },

  create: async (item: any): Promise<any> => {
    const { data, error } = await supabase
      .from('shipment_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('Error creating shipment item:', error);
      throw error;
    }

    return data;
  },

  createMany: async (items: any[]): Promise<any[]> => {
    const { data, error } = await supabase
      .from('shipment_items')
      .insert(items)
      .select();

    if (error) {
      console.error('Error creating multiple shipment items:', error);
      throw error;
    }

    return data || [];
  },

  update: async (id: string, item: any): Promise<any> => {
    const { data, error } = await supabase
      .from('shipment_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating shipment item:', error);
      throw error;
    }

    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('shipment_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shipment item:', error);
      throw error;
    }
  },

  deleteByHeaderId: async (headerId: string): Promise<void> => {
    const { error } = await supabase
      .from('shipment_items')
      .delete()
      .eq('shipment_header_id', headerId);

    if (error) {
      console.error('Error deleting shipment items by header ID:', error);
      throw error;
    }
  }
};

// Export tất cả APIs
export const supabaseAPIs = {
  products: productsAPI,
  suppliers: suppliersAPI,
  customers: customersAPI,
  inboundShipments: inboundShipmentsAPI,
  outboundShipments: outboundShipmentsAPI,
  companyInfo: companyInfoAPI,
  users: usersAPI,
  shipmentHeaders: shipmentHeadersAPI,
  shipmentItems: shipmentItemsAPI,
};

// Khởi tạo Supabase
export const initializeSupabase = async (): Promise<void> => {
  try {
    // Test connection
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    throw error;
  }
}; 