import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
});

// Protect all subpaths of dashboard, booking, and account
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/booking/:path*',
    '/account/:path*'
  ]
};
