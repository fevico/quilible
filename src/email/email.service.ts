import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }
 
  // Generate 4-digit verification code 
  generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Send verification email with 4-digit code
  async sendVerificationEmail(email: string, name: string, verificationCode: string) {
    try {
      const html = this.getVerificationEmailTemplate(name, verificationCode);
      
      const { data, error } = await this.resend.emails.send({
        from: `${process.env.EMAIL_FROM}`, // Replace with your domain  
        to: [email],
        subject: 'Verify Your Email Address',
        html: html, 
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, name: string) {
    try {
      const html = this.getWelcomeEmailTemplate(name);
      
      const { data, error } = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>', // Replace with your domain
        to: [email],
        subject: 'Welcome to Our Platform!',
        html: html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Send password reset email with 4-digit code
  async sendPasswordResetEmail(email: string, name: string, resetCode: string) {
    try {
      const html = this.getPasswordResetTemplate(name, resetCode);
      
      const { data, error } = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>', // Replace with your domain
        to: [email],
        subject: 'Reset Your Password',
        html: html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Send 2FA code email
  async sendTwoFactorEmail(email: string, name: string, twoFactorCode: string) {
    try {
      const html = this.getTwoFactorTemplate(name, twoFactorCode);
      
      const { data, error } = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>', // Replace with your domain
        to: [email],
        subject: 'Your Two-Factor Authentication Code',
        html: html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Error sending 2FA email:', error);
      throw error;
    }
  }

  // Email Templates with 4-digit codes
  private getVerificationEmailTemplate(name: string, verificationCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 10px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600;
        }
        .content { 
            padding: 40px 30px; 
        }
        .code-container { 
            text-align: center; 
            margin: 30px 0;
        }
        .verification-code { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            font-size: 32px; 
            font-weight: bold; 
            padding: 20px 40px; 
            border-radius: 10px; 
            letter-spacing: 8px; 
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            background: #f8f9fa;
        }
        .instructions {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up! Use the verification code below to complete your registration:</p>
            
            <div class="code-container">
                <div class="verification-code">${verificationCode}</div>
            </div>

            <div class="instructions">
                <strong>How to use this code:</strong>
                <ol>
                    <li>Go to the verification page in our app</li>
                    <li>Enter the 4-digit code shown above</li>
                    <li>Click "Verify Email" to complete the process</li>
                </ol>
            </div>
            
            <p><strong>This code will expire in 15 minutes.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome!</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 10px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600;
        }
        .content { 
            padding: 40px 30px; 
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            background: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome Aboard!</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to our platform! We're excited to have you on board.</p>
            
            <p>Here's what you can do now:</p>
            <ul>
                <li>Complete your profile</li>
                <li>Explore our features</li>
                <li>Get started with your first project</li>
            </ul>

            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The Team</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(name: string, resetCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 10px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600;
        }
        .content { 
            padding: 40px 30px; 
        }
        .code-container { 
            text-align: center; 
            margin: 30px 0;
        }
        .reset-code { 
            display: inline-block; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white; 
            font-size: 32px; 
            font-weight: bold; 
            padding: 20px 40px; 
            border-radius: 10px; 
            letter-spacing: 8px; 
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            background: #f8f9fa;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Use the code below to reset your password:</p>
            
            <div class="code-container">
                <div class="reset-code">${resetCode}</div>
            </div>

            <div class="warning">
                <strong>Important:</strong> This code will expire in 15 minutes for security reasons.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getTwoFactorTemplate(name: string, twoFactorCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Code</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 10px; 
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
            padding: 40px 20px; 
            text-align: center; 
            color: white;
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600;
        }
        .content { 
            padding: 40px 30px; 
        }
        .code-container { 
            text-align: center; 
            margin: 30px 0;
        }
        .twofactor-code { 
            display: inline-block; 
            background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
            color: white; 
            font-size: 32px; 
            font-weight: bold; 
            padding: 20px 40px; 
            border-radius: 10px; 
            letter-spacing: 8px; 
            text-align: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px;
            background: #f8f9fa;
        }
        .note {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Two-Factor Authentication</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your two-factor authentication code is:</p>
            
            <div class="code-container">
                <div class="twofactor-code">${twoFactorCode}</div>
            </div>

            <div class="note">
                <strong>Note:</strong> This code will expire in 5 minutes.
            </div>
            
            <p>If you didn't request this code, please secure your account immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}