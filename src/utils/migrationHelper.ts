import { supabase } from '../services/supabaseService';
import { syncDataFromGoogleSheets } from '../services/googleSheetsService';

interface MigrationProgress {
  current: number;
  total: number;
  table: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  error?: string;
}

interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  errors: string[];
  duration: number;
}

export class MigrationHelper {
  private progress: MigrationProgress[] = [];
  private onProgress?: (progress: MigrationProgress[]) => void;

  constructor(onProgress?: (progress: MigrationProgress[]) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(table: string, current: number, total: number, status: MigrationProgress['status'], error?: string) {
    const index = this.progress.findIndex(p => p.table === table);
    if (index >= 0) {
      this.progress[index] = { current, total, table, status, error };
    } else {
      this.progress.push({ current, total, table, status, error });
    }
    
    if (this.onProgress) {
      this.onProgress([...this.progress]);
    }
  }

  async migrateAllData(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalRecords = 0;
    let migratedRecords = 0;

    try {
      console.log('🔄 Bắt đầu migration dữ liệu từ Google Sheets sang Supabase...');

      // Lấy dữ liệu từ Google Sheets
      const googleData = await syncDataFromGoogleSheets();
      
      // Migrate từng bảng
      const migrationTasks = [
        this.migrateProducts(googleData.products),
        this.migrateSuppliers(googleData.suppliers),
        this.migrateCustomers(googleData.customers),
        this.migrateInboundShipments(googleData.inboundShipments),
        this.migrateOutboundShipments(googleData.outboundShipments),
        this.migrateCompanyInfo(googleData.companyInfo),
        this.migrateUsers(googleData.users),
      ];

      const results = await Promise.allSettled(migrationTasks);

      // Tính toán kết quả
      results.forEach((result, index) => {
        const tableNames = ['products', 'suppliers', 'customers', 'inboundShipments', 'outboundShipments', 'companyInfo', 'users'];
        const tableName = tableNames[index];
        
        if (result.status === 'fulfilled') {
          totalRecords += result.value.total;
          migratedRecords += result.value.migrated;
        } else {
          errors.push(`${tableName}: ${result.reason}`);
        }
      });

      const duration = Date.now() - startTime;
      
      console.log(`✅ Migration hoàn thành! ${migratedRecords}/${totalRecords} records migrated in ${duration}ms`);
      
      return {
        success: errors.length === 0,
        totalRecords,
        migratedRecords,
        errors,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Migration failed:', error);
      
      return {
        success: false,
        totalRecords,
        migratedRecords,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration,
      };
    }
  }

  private async migrateProducts(products: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'products';
    this.updateProgress(table, 0, products.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < products.length; i++) {
      try {
        const product = products[i];
        
        // Kiểm tra xem sản phẩm đã tồn tại chưa
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('san_pham_id', product.san_pham_id)
          .single();

        if (!existing) {
          // Insert sản phẩm mới
          const { error } = await supabase.from('products').insert({
            san_pham_id: product.san_pham_id,
            ten_san_pham: product.ten_san_pham,
            kho_id: product.kho_id,
            ten_kho: product.ten_kho,
            dvt: product.dvt,
            sl_ton: product.sl_ton || 0,
            hien_thi: product.hien_thi || 'Có',
            ghi_chu: product.ghi_chu || '',
          });

          if (error) {
            console.error(`Error migrating product ${product.san_pham_id}:`, error);
          } else {
            migrated++;
          }
        }

        this.updateProgress(table, i + 1, products.length, 'in-progress');
        
        // Delay nhỏ để tránh rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating product at index ${i}:`, error);
      }
    }

    this.updateProgress(table, products.length, products.length, 'completed');
    return { total: products.length, migrated };
  }

  private async migrateSuppliers(suppliers: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'suppliers';
    this.updateProgress(table, 0, suppliers.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < suppliers.length; i++) {
      try {
        const supplier = suppliers[i];
        
        const { data: existing } = await supabase
          .from('suppliers')
          .select('id')
          .eq('ten_ncc', supplier.ten_ncc)
          .single();

        if (!existing) {
          const { error } = await supabase.from('suppliers').insert({
            ten_ncc: supplier.ten_ncc,
            hien_thi: supplier.hien_thi || 'Có',
            ten_day_du: supplier.ten_day_du || '',
            loai_ncc: supplier.loai_ncc || '',
            logo: supplier.logo || '',
            nguoi_dai_dien: supplier.nguoi_dai_dien || '',
            sdt: supplier.sdt || '',
            tinh_trang: supplier.tinh_trang || 'Hoạt động',
            nv_phu_trach: supplier.nv_phu_trach || '',
            ghi_chu: supplier.ghi_chu || '',
          });

          if (error) {
            console.error(`Error migrating supplier ${supplier.ten_ncc}:`, error);
          } else {
            migrated++;
          }
        }

        this.updateProgress(table, i + 1, suppliers.length, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating supplier at index ${i}:`, error);
      }
    }

    this.updateProgress(table, suppliers.length, suppliers.length, 'completed');
    return { total: suppliers.length, migrated };
  }

  private async migrateCustomers(customers: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'customers';
    this.updateProgress(table, 0, customers.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < customers.length; i++) {
      try {
        const customer = customers[i];
        
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('ten_khach_hang', customer.ten_khach_hang)
          .single();

        if (!existing) {
          const { error } = await supabase.from('customers').insert({
            ten_khach_hang: customer.ten_khach_hang,
            hien_thi: customer.hien_thi || 'Có',
            ten_day_du: customer.ten_day_du || '',
            loai_khach_hang: customer.loai_khach_hang || '',
            logo: customer.logo || '',
            nguoi_dai_dien: customer.nguoi_dai_dien || '',
            sdt: customer.sdt || '',
            tinh_trang: customer.tinh_trang || 'Hoạt động',
            nv_phu_trach: customer.nv_phu_trach || '',
            ghi_chu: customer.ghi_chu || '',
          });

          if (error) {
            console.error(`Error migrating customer ${customer.ten_khach_hang}:`, error);
          } else {
            migrated++;
          }
        }

        this.updateProgress(table, i + 1, customers.length, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating customer at index ${i}:`, error);
      }
    }

    this.updateProgress(table, customers.length, customers.length, 'completed');
    return { total: customers.length, migrated };
  }

  private async migrateInboundShipments(shipments: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'inbound_shipments';
    this.updateProgress(table, 0, shipments.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < shipments.length; i++) {
      try {
        const shipment = shipments[i];
        
        const { error } = await supabase.from('inbound_shipments').insert({
          xuat_kho_id: shipment.xuat_kho_id,
          ngay_nhap: shipment.ngay_nhap,
          san_pham_id: shipment.san_pham_id,
          ten_san_pham: shipment.ten_san_pham,
          nhom_san_pham: shipment.nhom_san_pham || '',
          hang_sx: shipment.hang_sx || '',
          hinh_anh: shipment.hinh_anh || '',
          thong_tin: shipment.thong_tin || '',
          quy_cach: shipment.quy_cach || '',
          dvt: shipment.dvt || '',
          sl_nhap: shipment.sl_nhap || 0,
          ghi_chu: shipment.ghi_chu || '',
          nha_cung_cap_id: shipment.nha_cung_cap_id || '',
          ten_nha_cung_cap: shipment.ten_nha_cung_cap || '',
          dia_chi: shipment.dia_chi || '',
          so_dt: shipment.so_dt || '',
          noi_dung_nhap: shipment.noi_dung_nhap || '',
        });

        if (error) {
          console.error(`Error migrating inbound shipment ${shipment.xuat_kho_id}:`, error);
        } else {
          migrated++;
        }

        this.updateProgress(table, i + 1, shipments.length, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating inbound shipment at index ${i}:`, error);
      }
    }

    this.updateProgress(table, shipments.length, shipments.length, 'completed');
    return { total: shipments.length, migrated };
  }

  private async migrateOutboundShipments(shipments: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'outbound_shipments';
    this.updateProgress(table, 0, shipments.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < shipments.length; i++) {
      try {
        const shipment = shipments[i];
        
        const { error } = await supabase.from('outbound_shipments').insert({
          xuat_kho_id: shipment.xuat_kho_id,
          ngay_xuat: shipment.ngay_xuat,
          san_pham_id: shipment.san_pham_id,
          ten_san_pham: shipment.ten_san_pham,
          nhom_san_pham: shipment.nhom_san_pham || '',
          hang_sx: shipment.hang_sx || '',
          hinh_anh: shipment.hinh_anh || '',
          thong_tin: shipment.thong_tin || '',
          quy_cach: shipment.quy_cach || '',
          dvt: shipment.dvt || '',
          sl_xuat: shipment.sl_xuat || 0,
          ghi_chu: shipment.ghi_chu || '',
          so_hd: shipment.so_hd || '',
          ma_kh: shipment.ma_kh || '',
          ten_khach_hang: shipment.ten_khach_hang || '',
          dia_chi: shipment.dia_chi || '',
          so_dt: shipment.so_dt || '',
          noi_dung_xuat: shipment.noi_dung_xuat || '',
        });

        if (error) {
          console.error(`Error migrating outbound shipment ${shipment.xuat_kho_id}:`, error);
        } else {
          migrated++;
        }

        this.updateProgress(table, i + 1, shipments.length, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating outbound shipment at index ${i}:`, error);
      }
    }

    this.updateProgress(table, shipments.length, shipments.length, 'completed');
    return { total: shipments.length, migrated };
  }

  private async migrateCompanyInfo(companies: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'company_info';
    this.updateProgress(table, 0, companies.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < companies.length; i++) {
      try {
        const company = companies[i];
        
        const { data: existing } = await supabase
          .from('company_info')
          .select('id')
          .eq('ten_cong_ty', company.ten_cong_ty)
          .single();

        if (!existing) {
          const { error } = await supabase.from('company_info').insert({
            ten_cong_ty: company.ten_cong_ty,
            hien_thi: company.hien_thi || 'Có',
            ten_day_du: company.ten_day_du || '',
            loai_cong_ty: company.loai_cong_ty || '',
            logo: company.logo || '',
            nguoi_dai_dien: company.nguoi_dai_dien || '',
            sdt: company.sdt || '',
            tinh_trang: company.tinh_trang || 'Hoạt động',
            nv_phu_trach: company.nv_phu_trach || '',
            ghi_chu: company.ghi_chu || '',
          });

          if (error) {
            console.error(`Error migrating company ${company.ten_cong_ty}:`, error);
          } else {
            migrated++;
          }
        }

        this.updateProgress(table, i + 1, companies.length, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating company at index ${i}:`, error);
      }
    }

    this.updateProgress(table, companies.length, companies.length, 'completed');
    return { total: companies.length, migrated };
  }

  private async migrateUsers(users: any[]): Promise<{ total: number; migrated: number }> {
    const table = 'users';
    this.updateProgress(table, 0, users.length, 'in-progress');
    
    let migrated = 0;
    
    for (let i = 0; i < users.length; i++) {
      try {
        const user = users[i];
        
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!existing) {
          const { error } = await supabase.from('users').insert({
            ho_va_ten: user.ho_va_ten,
            email: user.email,
            chuc_vu: user.chuc_vu || '',
            phan_quyen: user.phan_quyen || 'User',
            password_hash: '', // Không migrate password vì lý do bảo mật
            quyen_xem: user.quyen_xem || 'Có',
            quyen_them: user.quyen_them || 'Có',
            quyen_sua: user.quyen_sua || 'Có',
            quyen_xoa: user.quyen_xoa || 'Có',
            quyen_xuat: user.quyen_xuat || 'Có',
            quyen_nhap: user.quyen_nhap || 'Có',
            quyen_bao_cao: user.quyen_bao_cao || 'Có',
            quyen_cai_dat: user.quyen_cai_dat || 'Có',
          });

          if (error) {
            console.error(`Error migrating user ${user.email}:`, error);
          } else {
            migrated++;
          }
        }

        this.updateProgress(table, i + 1, users.length, 'in-progress');
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error migrating user at index ${i}:`, error);
      }
    }

    this.updateProgress(table, users.length, users.length, 'completed');
    return { total: users.length, migrated };
  }

  // Utility method để kiểm tra trạng thái migration
  getMigrationStatus(): MigrationProgress[] {
    return [...this.progress];
  }

  // Utility method để reset migration
  resetMigration(): void {
    this.progress = [];
  }
} 