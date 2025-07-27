import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { 
  Product, 
  Supplier, 
  Customer, 
  InboundShipment, 
  OutboundShipment 
} from '../types';

// State interface
interface InventoryState {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  inboundShipments: InboundShipment[];
  outboundShipments: OutboundShipment[];
  loading: boolean;
  error: string | null;
}

// Action types
type InventoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_INBOUND_SHIPMENTS'; payload: InboundShipment[] }
  | { type: 'ADD_INBOUND_SHIPMENT'; payload: InboundShipment }
  | { type: 'UPDATE_INBOUND_SHIPMENT'; payload: InboundShipment }
  | { type: 'DELETE_INBOUND_SHIPMENT'; payload: string }
  | { type: 'SET_OUTBOUND_SHIPMENTS'; payload: OutboundShipment[] }
  | { type: 'ADD_OUTBOUND_SHIPMENT'; payload: OutboundShipment }
  | { type: 'UPDATE_OUTBOUND_SHIPMENT'; payload: OutboundShipment }
  | { type: 'DELETE_OUTBOUND_SHIPMENT'; payload: string };

// Initial state
const initialState: InventoryState = {
  products: [],
  suppliers: [],
  customers: [],
  inboundShipments: [],
  outboundShipments: [],
  loading: false,
  error: null,
};

// Reducer
function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        ),
      };
    
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload),
      };
    
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier =>
          supplier.id === action.payload.id ? action.payload : supplier
        ),
      };
    
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(supplier => supplier.id !== action.payload),
      };
    
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer =>
          customer.id === action.payload.id ? action.payload : customer
        ),
      };
    
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload),
      };
    
    case 'SET_INBOUND_SHIPMENTS':
      return { ...state, inboundShipments: action.payload };
    
    case 'ADD_INBOUND_SHIPMENT':
      return { ...state, inboundShipments: [...state.inboundShipments, action.payload] };
    
    case 'UPDATE_INBOUND_SHIPMENT':
      return {
        ...state,
        inboundShipments: state.inboundShipments.map(shipment =>
          shipment.id === action.payload.id ? action.payload : shipment
        ),
      };
    
    case 'DELETE_INBOUND_SHIPMENT':
      return {
        ...state,
        inboundShipments: state.inboundShipments.filter(shipment => shipment.id !== action.payload),
      };
    
    case 'SET_OUTBOUND_SHIPMENTS':
      return { ...state, outboundShipments: action.payload };
    
    case 'ADD_OUTBOUND_SHIPMENT':
      return { ...state, outboundShipments: [...state.outboundShipments, action.payload] };
    
    case 'UPDATE_OUTBOUND_SHIPMENT':
      return {
        ...state,
        outboundShipments: state.outboundShipments.map(shipment =>
          shipment.id === action.payload.id ? action.payload : shipment
        ),
      };
    
    case 'DELETE_OUTBOUND_SHIPMENT':
      return {
        ...state,
        outboundShipments: state.outboundShipments.filter(shipment => shipment.id !== action.payload),
      };
    
    default:
      return state;
  }
}

// Context
interface InventoryContextType {
  state: InventoryState;
  dispatch: React.Dispatch<InventoryAction>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Provider component
interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // Lắng nghe thay đổi từ localStorage khi auto sync
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        // Tải dữ liệu từ localStorage
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const inboundShipments = JSON.parse(localStorage.getItem('inboundShipments') || '[]');
        const outboundShipments = JSON.parse(localStorage.getItem('outboundShipments') || '[]');

        // Cập nhật state
        dispatch({ type: 'SET_PRODUCTS', payload: products });
        dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });
        dispatch({ type: 'SET_CUSTOMERS', payload: customers });
        dispatch({ type: 'SET_INBOUND_SHIPMENTS', payload: inboundShipments });
        dispatch({ type: 'SET_OUTBOUND_SHIPMENTS', payload: outboundShipments });

        console.log('🔄 Inventory context đã cập nhật từ localStorage');
      } catch (error) {
        console.error('❌ Lỗi khi cập nhật inventory context:', error);
      }
    };

    // Lắng nghe sự kiện storage change
    window.addEventListener('storage', handleStorageChange);
    
    // Tải dữ liệu ban đầu
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <InventoryContext.Provider value={{ state, dispatch }}>
      {children}
    </InventoryContext.Provider>
  );
};

// Custom hook to use the context
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}; 