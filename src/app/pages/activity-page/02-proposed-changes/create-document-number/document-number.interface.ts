export interface FileInfo {
  id: string;
  name?: string;
  size?: number;
  // tambah properti lain sesuai kebutuhan
}

export interface Document {
  status: string;
  id: number;
  doc_type: string;
  doc_number: string | null;
  id_header: string | null;
  file: FileInfo | null; // sekarang file adalah object
}
