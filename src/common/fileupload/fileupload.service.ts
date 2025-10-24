import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {
  private supabase;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key is not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async uploadFile(file: Express.Multer.File, bucketName: string): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`; // Unique filename
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,  
      });        
    if (error) throw new Error(`File upload failed: ${error.message}`);

    const { data: urlData } = this.supabase.storage.from(bucketName).getPublicUrl(fileName);
    return urlData.publicUrl;  
  }
}