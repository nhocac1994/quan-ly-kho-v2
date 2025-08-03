import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseService';
import {
  products,
  suppliers,
  customers,
  inboundShipments,
  outboundShipments,
  companyInfo,
  users,
  shipmentHeaders,
  shipmentItems
} from '../services/dataService-supabase-only';
import { 
  Product, 
  Supplier, 
  Customer, 
  InboundShipment, 
  OutboundShipment,
  CompanyInfo,
  User
} from '../types';

// Query keys
export const queryKeys = {
  products: ['products'] as const,
  suppliers: ['suppliers'] as const,
  customers: ['customers'] as const,
  inboundShipments: ['inboundShipments'] as const,
  outboundShipments: ['outboundShipments'] as const,
  companyInfo: ['companyInfo'] as const,
  users: ['users'] as const,
  shipmentItems: ['shipmentItems'] as const,
};

// Products queries
export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      console.log('🔄 Fetching products from Supabase...');
      try {
        // Lấy dữ liệu trực tiếp từ bảng products thay vì view
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .order('ten_san_pham', { ascending: true });

        if (error) {
          console.error('❌ Error fetching products:', error);
          const fallbackData = await products.getAll();
          console.log(`📊 Fallback: Total products found: ${fallbackData.length}`);
          return fallbackData;
        }

        console.log(`📊 Total products found: ${productsData.length}`);
        console.log('📋 Products data:', productsData);

        // Map dữ liệu trực tiếp từ bảng products
        const mappedProducts = productsData.map(item => ({
          id: item.id,
          san_pham_id: item.san_pham_id,
          ten_san_pham: item.ten_san_pham,
          kho_id: item.kho_id || '',
          ten_kho: item.ten_kho || '',
          dvt: item.dvt || '',
          sl_ton: item.sl_ton || 0, // Sử dụng sl_ton trực tiếp từ bảng products
          hien_thi: item.hien_thi || 'Có',
          ghi_chu: item.ghi_chu || '',
          ngay_tao: item.ngay_tao || new Date().toISOString(),
          nguoi_tao: item.nguoi_tao || 'System',
          updated_at: item.updated_at || new Date().toISOString()
        }));

        return mappedProducts;
      } catch (error) {
        console.error('Error in useProducts:', error);
        return [];
      }
    },
    staleTime: 5 * 1000, // 5 seconds - cập nhật nhanh hơn
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await products.create(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      return await products.update(id, product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await products.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

// Hook để refresh products thủ công
export const useRefreshProducts = () => {
  const queryClient = useQueryClient();
  
  return () => {
    console.log('🔄 Force refreshing products...');
    // Clear cache và fetch lại từ Supabase
    queryClient.removeQueries({ queryKey: queryKeys.products });
    queryClient.invalidateQueries({ queryKey: queryKeys.products });
    queryClient.refetchQueries({ queryKey: queryKeys.products });
  };
};

// Hook để fetch products trực tiếp từ Supabase (không qua cache)
export const useForceFetchProducts = () => {
  return async () => {
    console.log('🔄 Force fetching products directly from Supabase...');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('ngay_tao', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching products:', error);
        throw error;
      }
      
      console.log('✅ Products fetched directly:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in force fetch:', error);
      throw error;
    }
  };
};

// Hook để so sánh dữ liệu cache với dữ liệu thực tế
export const useCompareProductsData = () => {
  return async () => {
    console.log('🔍 Comparing cached data with Supabase data...');
    try {
      // Lấy dữ liệu từ cache
      const cachedData = await products.getAll();
      console.log('📦 Cached data:', cachedData);
      
      // Lấy dữ liệu trực tiếp từ Supabase
      const { data: freshData, error } = await supabase
        .from('products')
        .select('*')
        .order('ngay_tao', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching fresh data:', error);
        return { cached: cachedData, fresh: null, error };
      }
      
      console.log('🆕 Fresh data from Supabase:', freshData);
      
      // So sánh
      const isDifferent = JSON.stringify(cachedData) !== JSON.stringify(freshData);
      console.log('🔍 Data is different:', isDifferent);
      
      return { cached: cachedData, fresh: freshData, isDifferent };
    } catch (error) {
      console.error('❌ Error comparing data:', error);
      throw error;
    }
  };
};

// Hook để gọi function refresh stock từ database
export const useRefreshStockFromDatabase = () => {
  const queryClient = useQueryClient();
  
  return async (productId?: string) => {
    console.log('🔄 Refreshing stock from database...');
    try {
      if (productId) {
        // Refresh cho một sản phẩm cụ thể
        const { data, error } = await supabase
          .rpc('refresh_product_stock', { product_id_param: productId });
        
        if (error) {
          console.error('❌ Error refreshing stock for product:', error);
          throw error;
        }
        
        console.log('✅ Stock refreshed for product:', data);
      } else {
        // Refresh cho tất cả sản phẩm
        const { error } = await supabase
          .rpc('quick_update_stock');
        
        if (error) {
          console.error('❌ Error refreshing all stocks:', error);
          throw error;
        }
        
        console.log('✅ All stocks refreshed');
      }
      
      // Invalidate cache để fetch lại dữ liệu
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      
      return true;
    } catch (error) {
      console.error('❌ Error in refresh stock:', error);
      throw error;
    }
  };
};

// Suppliers queries
export const useSuppliers = () => {
  return useQuery({
    queryKey: queryKeys.suppliers,
    queryFn: async () => {
      return await suppliers.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await suppliers.create(supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      return await suppliers.update(id, supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await suppliers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
};

// Customers queries
export const useCustomers = () => {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      return await customers.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await customers.create(customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      return await customers.update(id, customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await customers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
};

// Shipment Headers queries
export const useShipmentHeaders = (type?: 'inbound' | 'outbound') => {
  return useQuery({
    queryKey: type ? ['shipmentHeaders', type] : ['shipmentHeaders'],
    queryFn: async () => {
      if (type) {
        return await shipmentHeaders.getByType(type);
      }
      return await shipmentHeaders.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useShipmentHeader = (id: string) => {
  return useQuery({
    queryKey: ['shipmentHeader', id],
    queryFn: async () => {
      return await shipmentHeaders.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddShipmentHeader = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (header: any) => {
      return await shipmentHeaders.create(header);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipmentHeaders'] });
    },
  });
};

export const useUpdateShipmentHeader = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...header }: any) => {
      return await shipmentHeaders.update(id, header);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipmentHeaders'] });
    },
  });
};

export const useDeleteShipmentHeader = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await shipmentHeaders.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipmentHeaders'] });
    },
  });
};

// Shipment Items queries
export const useShipmentItems = (headerId: string) => {
  return useQuery({
    queryKey: ['shipmentItems', headerId],
    queryFn: async () => {
      return await shipmentItems.getByHeaderId(headerId);
    },
    enabled: !!headerId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddShipmentItems = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: any[]) => {
      return await shipmentItems.createMany(items);
    },
    onSuccess: (_, variables) => {
      // Invalidate items for the specific header
      if (variables.length > 0) {
        const headerId = variables[0].shipment_header_id;
        queryClient.invalidateQueries({ queryKey: ['shipmentItems', headerId] });
      }
      // Invalidate products để cập nhật sl_ton
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

export const useDeleteShipmentItems = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (headerId: string) => {
      return await shipmentItems.deleteByHeaderId(headerId);
    },
    onSuccess: (_, headerId) => {
      queryClient.invalidateQueries({ queryKey: ['shipmentItems', headerId] });
      // Invalidate products để cập nhật sl_ton
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

// Legacy Inbound Shipments queries (giữ lại để tương thích)
export const useInboundShipments = () => {
  return useQuery({
    queryKey: queryKeys.inboundShipments,
    queryFn: async () => {
      return await inboundShipments.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddInboundShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shipment: Omit<InboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await inboundShipments.create(shipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundShipments });
    },
  });
};

export const useUpdateInboundShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...shipment }: Partial<InboundShipment> & { id: string }) => {
      return await inboundShipments.update(id, shipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundShipments });
    },
  });
};

export const useDeleteInboundShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await inboundShipments.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundShipments });
    },
  });
};

// Outbound Shipments queries
export const useOutboundShipments = () => {
  return useQuery({
    queryKey: queryKeys.outboundShipments,
    queryFn: async () => {
      return await outboundShipments.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddOutboundShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shipment: Omit<OutboundShipment, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await outboundShipments.create(shipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundShipments });
    },
  });
};

export const useUpdateOutboundShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...shipment }: Partial<OutboundShipment> & { id: string }) => {
      return await outboundShipments.update(id, shipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundShipments });
    },
  });
};

export const useDeleteOutboundShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await outboundShipments.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundShipments });
    },
  });
};

// Company Info queries
export const useCompanyInfo = () => {
  return useQuery({
    queryKey: queryKeys.companyInfo,
    queryFn: async () => {
      return await companyInfo.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddCompanyInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (company: Omit<CompanyInfo, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await companyInfo.create(company);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyInfo });
    },
  });
};

export const useUpdateCompanyInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...company }: Partial<CompanyInfo> & { id: string }) => {
      return await companyInfo.update(id, company);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyInfo });
    },
  });
};

// Users queries
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      return await users.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (user: Omit<User, 'id' | 'ngay_tao' | 'nguoi_tao' | 'updated_at'>) => {
      return await users.create(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...user }: Partial<User> & { id: string }) => {
      return await users.update(id, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await users.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}; 