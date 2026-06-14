import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { readCSV, writeCSV, User } from '@/lib/githubDb';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { action } = body;

    // Read all users
    const users = await readCSV<User>('users.csv');
    const userIndex = users.findIndex(u => u.user_id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản.' }, { status: 404 });
    }

    const currentUser = users[userIndex];

    if (action === 'updateProfile') {
      const { full_name, address, lat, lng, phone } = body;

      if (!full_name || !address || !phone) {
        return NextResponse.json({ error: 'Các trường thông tin không được để trống.' }, { status: 400 });
      }

      // Update fields
      currentUser.full_name = full_name;
      currentUser.address = address;
      currentUser.lat = parseFloat(lat) || 0;
      currentUser.lng = parseFloat(lng) || 0;
      currentUser.phone = phone;

      // Write back to CSV
      await writeCSV<User>('users.csv', users);

      return NextResponse.json({ 
        message: 'Cập nhật thông tin thành công!',
        user: {
          full_name: currentUser.full_name,
          address: currentUser.address,
          lat: currentUser.lat,
          lng: currentUser.lng,
          phone: currentUser.phone
        }
      });
    }

    if (action === 'changePassword') {
      const { oldPassword, newPassword } = body;

      if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ mật khẩu cũ và mới.' }, { status: 400 });
      }

      // Compare old password (async to avoid blocking event loop)
      const isOldValid = await bcrypt.compare(oldPassword, currentUser.password_hash);
      if (!isOldValid) {
        return NextResponse.json({ error: 'Mật khẩu cũ không chính xác.' }, { status: 400 });
      }

      // Hash new password
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync(newPassword, salt);

      currentUser.password_hash = password_hash;

      // Write back to CSV
      await writeCSV<User>('users.csv', users);

      return NextResponse.json({ message: 'Thay đổi mật khẩu thành công!' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    console.error('Profile API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý yêu cầu cập nhật.' },
      { status: 500 }
    );
  }
}

// Fetch current user details
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const users = await readCSV<User>('users.csv');
    const user = users.find(u => u.user_id === userId);

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    // Return profile safely (excluding password_hash)
    const { password_hash, ...profileSafe } = user;
    return NextResponse.json({ profile: profileSafe });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
