import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

interface ImportOutboundData {
  loai_xuat: string;
  ngay_xuat: string;
  ten_khach_hang: string;
  ma_hoa_don: string;
  sl_san_pham: number;
  sl_nhap: number;
  tai_xe: string;
  noi_dung_xuat: string;
  ghi_chu: string;
}

interface ImportExcelOutboundDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: ImportOutboundData[]) => void;
  customers: any[];
}

const ImportExcelOutboundDialog: React.FC<ImportExcelOutboundDialogProps> = ({
  open,
  onClose,
  onImport,
  customers,
}) => {
  const [importedData, setImportedData] = useState<ImportOutboundData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Loại Xuất': 'Xuất hàng',
        'Ngày Xuất': '2025-07-27',
        'Khách Hàng': 'Khách hàng A',
        'Mã Hóa Đơn': 'HD001',
        'Số Lượng Sản Phẩm': 10,
        'Số Lượng Nhập': 8,
        'Tài Xế': 'Nguyễn Văn A',
        'Nội Dung Xuất': 'Xuất hàng cho khách hàng',
        'Ghi Chú': 'Ghi chú mẫu',
      },
      {
        'Loại Xuất': 'Xuất trả',
        'Ngày Xuất': '2025-07-27',
        'Khách Hàng': 'Khách hàng B',
        'Mã Hóa Đơn': 'HD002',
        'Số Lượng Sản Phẩm': 5,
        'Số Lượng Nhập': 5,
        'Tài Xế': 'Trần Thị B',
        'Nội Dung Xuất': 'Xuất trả hàng',
        'Ghi Chú': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // Loại Xuất
      { wch: 12 }, // Ngày Xuất
      { wch: 20 }, // Khách Hàng
      { wch: 15 }, // Mã Hóa Đơn
      { wch: 20 }, // Số Lượng Sản Phẩm
      { wch: 18 }, // Số Lượng Nhập
      { wch: 15 }, // Tài Xế
      { wch: 30 }, // Nội Dung Xuất
      { wch: 25 }, // Ghi Chú
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'mau_xuat_kho.xlsx');
  };

  const validateData = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row number (starting from 2)
      
      if (!row.loai_xuat) {
        errors.push(`Dòng ${rowNum}: Thiếu Loại Xuất`);
      }
      if (!row.ngay_xuat) {
        errors.push(`Dòng ${rowNum}: Thiếu Ngày Xuất`);
      }
      if (!row.ten_khach_hang) {
        errors.push(`Dòng ${rowNum}: Thiếu Khách Hàng`);
      }
      if (!row.ma_hoa_don) {
        errors.push(`Dòng ${rowNum}: Thiếu Mã Hóa Đơn`);
      }
      if (isNaN(row.sl_san_pham) || row.sl_san_pham < 0) {
        errors.push(`Dòng ${rowNum}: Số Lượng Sản Phẩm không hợp lệ`);
      }
      if (isNaN(row.sl_nhap) || row.sl_nhap < 0) {
        errors.push(`Dòng ${rowNum}: Số Lượng Nhập không hợp lệ`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with specific column mapping
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setErrors(['File Excel phải có ít nhất 1 dòng dữ liệu (không tính header)']);
          return;
        }

        // Skip header row and map data
        const mappedData: ImportOutboundData[] = jsonData.slice(1).map((row: any) => ({
          loai_xuat: row[0] || '',
          ngay_xuat: row[1] ? new Date(row[1]).toISOString().split('T')[0] : '',
          ten_khach_hang: row[2] || '',
          ma_hoa_don: row[3] || '',
          sl_san_pham: parseInt(row[4]) || 0,
          sl_nhap: parseInt(row[5]) || 0,
          tai_xe: row[6] || '',
          noi_dung_xuat: row[7] || '',
          ghi_chu: row[8] || '',
        }));

        const validation = validateData(mappedData);
        setErrors(validation.errors);
        setIsValid(validation.valid);
        setImportedData(mappedData);
      } catch (error) {
        setErrors(['Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.']);
        console.error('Error reading Excel file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (isValid && importedData.length > 0) {
      onImport(importedData);
      onClose();
      setImportedData([]);
      setErrors([]);
      setIsValid(false);
    }
  };

  const handleRemoveRow = (index: number) => {
    const newData = importedData.filter((_, i) => i !== index);
    setImportedData(newData);
    const validation = validateData(newData);
    setErrors(validation.errors);
    setIsValid(validation.valid);
  };

  const handleClose = () => {
    onClose();
    setImportedData([]);
    setErrors([]);
    setIsValid(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UploadIcon />
          <Typography variant="h6">Import Excel - Xuất Kho</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tải mẫu Excel và điền dữ liệu theo định dạng, sau đó upload file để import.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTemplate}
            >
              Tải Mẫu Excel
            </Button>
            
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
            >
              Chọn File Excel
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>

          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Có {errors.length} lỗi cần sửa:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {errors.map((error, index) => (
                  <li key={index}>
                    <Typography variant="body2">{error}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          {isValid && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                ✅ Dữ liệu hợp lệ! Có {importedData.length} phiếu xuất kho để import.
              </Typography>
            </Alert>
          )}
        </Box>

        {importedData.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preview Dữ Liệu ({importedData.length} phiếu)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Loại Xuất</TableCell>
                    <TableCell>Ngày Xuất</TableCell>
                    <TableCell>Khách Hàng</TableCell>
                    <TableCell>Mã Hóa Đơn</TableCell>
                    <TableCell align="right">SL SP</TableCell>
                    <TableCell align="right">SL Nhập</TableCell>
                    <TableCell>Tài Xế</TableCell>
                    <TableCell>Nội Dung</TableCell>
                    <TableCell align="center">Thao Tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importedData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip
                          label={row.loai_xuat}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.ngay_xuat}</TableCell>
                      <TableCell>{row.ten_khach_hang}</TableCell>
                      <TableCell>{row.ma_hoa_don}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={row.sl_san_pham}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={row.sl_nhap}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.tai_xe}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {row.noi_dung_xuat}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xóa dòng này">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveRow(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!isValid || importedData.length === 0}
          startIcon={<CheckIcon />}
        >
          Import ({importedData.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportExcelOutboundDialog; 