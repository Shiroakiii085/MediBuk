import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readCSV, writeCSV, User } from '@/lib/githubDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, address, lat, lng, phone } = body;

    // Basic Validation
    if (!email || !password || !full_name || !address || !phone) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.' },
        { status: 400 }
      );
    }

    // Read existing users
    const users = await readCSV<User>('users.csv');

    // Check if user already exists
    const emailExists = users.some(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký sử dụng trong hệ thống.' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    // Create new user object
    const newUser: User = {
      user_id: `usr_${Date.now()}`,
      email: email.toLowerCase(),
      password_hash,
      full_name,
      address,
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      role: 'patient', // Default registration role is patient
      phone
    };

    // Append and save to CSV
    users.push(newUser);
    await writeCSV<User>('users.csv', users);

    return NextResponse.json(
      { message: 'Đăng ký tài khoản thành công!' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống trong quá trình đăng ký.' },
      { status: 500 }
    );
  }
}
