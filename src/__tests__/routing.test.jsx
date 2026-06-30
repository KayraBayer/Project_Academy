import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminRoute from '../routes/AdminRoute';
import ProtectedRoute from '../routes/ProtectedRoute';
import RoleRedirect from '../routes/RoleRedirect';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function setAuthState(overrides = {}) {
  useAuth.mockReturnValue({
    currentUser: null,
    loading: false,
    role: null,
    userProfile: null,
    ...overrides,
  });
}

function renderStudentGuard(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Sayfası</div>} />
        <Route path="/admin" element={<div>Admin Paneli</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Öğrenci Paneli</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function renderAdminGuard(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Sayfası</div>} />
        <Route path="/dashboard" element={<div>Öğrenci Paneli</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin Paneli</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function renderRoleRedirect() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<div>Login Sayfası</div>} />
        <Route path="/dashboard" element={<div>Öğrenci Paneli</div>} />
        <Route path="/admin" element={<div>Admin Paneli</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('route korumaları', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('oturum kontrolü sürerken loading gösterir', () => {
    setAuthState({ loading: true });

    renderStudentGuard();

    expect(screen.getByText('Oturum kontrol ediliyor')).toBeInTheDocument();
  });

  it('oturumsuz öğrenciyi login sayfasına yönlendirir', () => {
    setAuthState();

    renderStudentGuard();

    expect(screen.getByText('Login Sayfası')).toBeInTheDocument();
  });

  it('aktif öğrencinin öğrenci paneline girmesine izin verir', () => {
    setAuthState({
      currentUser: { uid: 'student-1' },
      role: 'student',
      userProfile: { status: 'active', role: 'student' },
    });

    renderStudentGuard();

    expect(screen.getByText('Öğrenci Paneli')).toBeInTheDocument();
  });

  it('admin kullanıcısını öğrenci routeundan admin paneline taşır', () => {
    setAuthState({
      currentUser: { uid: 'admin-1' },
      role: 'admin',
      userProfile: { status: 'active', role: 'admin' },
    });

    renderStudentGuard();

    expect(screen.getByText('Admin Paneli')).toBeInTheDocument();
  });

  it('öğrencinin admin sayfasına erişmesini engeller', () => {
    setAuthState({
      currentUser: { uid: 'student-1' },
      role: 'student',
      userProfile: { status: 'active', role: 'student' },
    });

    renderAdminGuard();

    expect(screen.getByText('Öğrenci Paneli')).toBeInTheDocument();
  });

  it('aktif adminin admin paneline girmesine izin verir', () => {
    setAuthState({
      currentUser: { uid: 'admin-1' },
      role: 'admin',
      userProfile: { status: 'active', role: 'admin' },
    });

    renderAdminGuard();

    expect(screen.getByText('Admin Paneli')).toBeInTheDocument();
  });

  it('pasif hesapları login sayfasına yönlendirir', () => {
    setAuthState({
      currentUser: { uid: 'student-1' },
      role: 'student',
      userProfile: { status: 'suspended', role: 'student' },
    });

    renderStudentGuard();

    expect(screen.getByText('Login Sayfası')).toBeInTheDocument();
  });

  it('ilk açılışta role göre doğru panele yönlendirir', () => {
    setAuthState({
      currentUser: { uid: 'admin-1' },
      role: 'admin',
      userProfile: { status: 'active', role: 'admin' },
    });

    renderRoleRedirect();

    expect(screen.getByText('Admin Paneli')).toBeInTheDocument();
  });
});
