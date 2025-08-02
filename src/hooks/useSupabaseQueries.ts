import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  products,
  suppliers,
  customers,
  inboundShipments,
  outboundShipments,
  companyInfo,
  users
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
};

// Products queries
export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      return await products.getAll();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Inbound Shipments queries
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