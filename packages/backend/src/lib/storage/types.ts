export interface StorageAdapter {
  save(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
  }): Promise<string>; // returns image ID
  get(id: string): Promise<{ buffer: Buffer; mimetype: string } | null>;
  delete(id: string): Promise<void>;
}
