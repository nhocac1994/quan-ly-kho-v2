import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productsAPI,
  suppliersAPI,
  customersAPI,
  inboundShipmentsAPI,
  outboundShipmentsAPI
} from '../services/googleSheetsService';
import { useInventory } from '../context/InventoryContext';
import { 
  Product, 
  Supplier, 
  Customer, 
  InboundShipment, 
  OutboundShipment 
} from '../types';

// Query keys
export const queryKeys = {
  products: ['products'] as const,
  suppliers: ['suppliers'] as const,
  customers: ['customers'] as const,
  inboundShipments: ['inboundShipments'] as const,
  outboundShipments: ['outboundShipments'] as const,
};

// Products queries
export const useProducts = () => {
  const { dispatch } = useInventory();
  
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const products = await productsAPI.getAll();
        dispatch({ type: 'SET_PRODUCTS', payload: products });
        return products;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch products' });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const newProduct = await productsAPI.create(product);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const updatedProduct = await productsAPI.update(id, product);
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      return updatedProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
};

// Suppliers queries
export const useSuppliers = () => {
  const { dispatch } = useInventory();
  
  return useQuery({
    queryKey: queryKeys.suppliers,
    queryFn: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const suppliers = await suppliersAPI.getAll();
        dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });
        return suppliers;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch suppliers' });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddSupplier = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id'>) => {
      const newSupplier = await suppliersAPI.create(supplier);
      dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier });
      return newSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      const updatedSupplier = await suppliersAPI.update(id, supplier);
      dispatch({ type: 'UPDATE_SUPPLIER', payload: updatedSupplier });
      return updatedSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
    },
  });
};

// Customers queries
export const useCustomers = () => {
  const { dispatch } = useInventory();
  
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const customers = await customersAPI.getAll();
        dispatch({ type: 'SET_CUSTOMERS', payload: customers });
        return customers;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch customers' });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id'>) => {
      const newCustomer = await customersAPI.create(customer);
      dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
      return newCustomer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const updatedCustomer = await customersAPI.update(id, customer);
      dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
      return updatedCustomer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
};

// Inbound Shipments queries
export const useInboundShipments = () => {
  const { dispatch } = useInventory();
  
  return useQuery({
    queryKey: queryKeys.inboundShipments,
    queryFn: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const shipments = await inboundShipmentsAPI.getAll();
        dispatch({ type: 'SET_INBOUND_SHIPMENTS', payload: shipments });
        return shipments;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch inbound shipments' });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddInboundShipment = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async (shipment: Omit<InboundShipment, 'id'>) => {
      const newShipment = await inboundShipmentsAPI.create(shipment);
      dispatch({ type: 'ADD_INBOUND_SHIPMENT', payload: newShipment });
      return newShipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundShipments });
    },
  });
};

// Outbound Shipments queries
export const useOutboundShipments = () => {
  const { dispatch } = useInventory();
  
  return useQuery({
    queryKey: queryKeys.outboundShipments,
    queryFn: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const shipments = await outboundShipmentsAPI.getAll();
        dispatch({ type: 'SET_OUTBOUND_SHIPMENTS', payload: shipments });
        return shipments;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch outbound shipments' });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddOutboundShipment = () => {
  const queryClient = useQueryClient();
  const { dispatch } = useInventory();
  
  return useMutation({
    mutationFn: async (shipment: Omit<OutboundShipment, 'id'>) => {
      const newShipment = await outboundShipmentsAPI.create(shipment);
      dispatch({ type: 'ADD_OUTBOUND_SHIPMENT', payload: newShipment });
      return newShipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundShipments });
    },
  });
}; 