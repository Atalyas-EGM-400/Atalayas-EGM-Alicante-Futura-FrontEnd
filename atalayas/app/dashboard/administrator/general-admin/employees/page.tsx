'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';

// --- Interfaces ---
interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  jobRole?: string;
  companyId: string | null;
  createdAt: string;
  avatarUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  Company?: Company;
}

// --- Constantes de Estilo ---
const ROLE_LABELS: Record<string, string> = {
  GENERAL_ADMIN: 'Súper Admin',
  ADMIN: 'Admin Empresa',
  EMPLOYEE: 'Empleado',
  PUBLIC: 'Público',
};

const ROLE_COLORS: Record<string, string> = {
  GENERAL_ADMIN: 'bg-purple-100 text-purple-700 border border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 border border-blue-200',
  EMPLOYEE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  PUBLIC: 'bg-orange-100 text-orange-700 border border-orange-200',
};

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // --- Estados de Paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // Cambia este número para mostrar más o menos filas por página

  // Modal eliminar
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal dar de baja / reactivar
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${getToken()}` };
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(storedUser);

      const [usersRes, compRes] = await Promise.all([
        fetch(API_ROUTES.USERS.GET_ALL, { headers }),
        fetch(API_ROUTES.COMPANIES.GET_ALL, { headers }).catch(() => null),
      ]);

      const usersData = await usersRes.json();

      if (compRes && compRes.ok) {
        const compData = await compRes.json();
        setCompanies(Array.isArray(compData) ? compData : []);
      }

      if (Array.isArray(usersData)) {
        if (storedUser.role === 'ADMIN') {
          const filtered = usersData.filter(
            (u) =>
              String(u.companyId || '').trim() ===
              String(storedUser.companyId || '').trim(),
          );
          setUsers(filtered);
        } else {
          setUsers(usersData);
        }
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetear a la página 1 cada vez que se alteren los filtros globales
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompany, showInactive]);

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_ROUTES.USERS.GET_ALL}/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
      } else {
        alert('No se pudo eliminar el usuario.');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!userToDeactivate) return;
    setTogglingStatus(true);
    const isActive = userToDeactivate.status !== 'INACTIVE';
    const endpoint = isActive
      ? `${API_ROUTES.USERS.GET_ALL}/${userToDeactivate.id}/deactivate`
      : `${API_ROUTES.USERS.GET_ALL}/${userToDeactivate.id}/reactivate`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userToDeactivate.id
              ? { ...u, status: isActive ? 'INACTIVE' : 'ACTIVE' }
              : u,
          ),
        );
        setUserToDeactivate(null);
      } else {
        alert('No se pudo cambiar el estado del usuario.');
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDownloadCSV = () => {
    const employeesToExport = users.filter((user) => user.role === 'EMPLOYEE');
    const csvRows = [['nombre', 'email', 'rol', 'puesto', 'estado']];

    employeesToExport.forEach((employee) => {
      csvRows.push([
        employee.name || '',
        employee.email || '',
        'EMPLOYEE',
        employee.jobRole || '',
        employee.status === 'INACTIVE' ? 'Baja' : 'Activo',
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'empleados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Filtrado y ordenación total de usuarios
  const allFilteredUsers = users
    .filter((user) => {
      const matchCompany =
        selectedCompany === 'ALL' ||
        String(user.companyId) === String(selectedCompany);
      const matchSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = showInactive
        ? user.status === 'INACTIVE'
        : user.status !== 'INACTIVE';
      return matchCompany && matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const rolesOrder: Record<string, number> = {
        GENERAL_ADMIN: 1,
        ADMIN: 2,
        EMPLOYEE: 3,
        PUBLIC: 4,
      };
      return (rolesOrder[a.role] || 99) - (rolesOrder[b.role] || 99);
    });

  // 2. Cálculos matemáticos de la paginación
  const totalPages = Math.ceil(allFilteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  // 3. Segmentar únicamente los usuarios que corresponden a la página activa
  const displayedUsers = allFilteredUsers.slice(startIndex, endIndex);

  const inactiveCount = users.filter((u) => u.status === 'INACTIVE').length;

  if (!currentUser) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background font-sans text-foreground">
      <main className="flex-1 overflow-x-hidden flex flex-col relative">
        <PageHeader
          title={
            currentUser.role === 'GENERAL_ADMIN'
              ? 'Gestión de Usuarios'
              : 'Empleados'
          }
          description={
            currentUser.role === 'GENERAL_ADMIN'
              ? 'Administra los usuarios de la plataforma'
              : 'Administra tu equipo'
          }
          icon={<i className="bi bi-people-fill"></i>}
          action={
            <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
              {currentUser.role !== 'GENERAL_ADMIN' && (
                <>
                  <button
                    onClick={handleDownloadCSV}
                    className="flex-1 md:flex-none bg-background border border-input hover:bg-muted text-foreground font-bold px-3 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <i className="bi bi-download"></i>{' '}
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                  <Link
                    href="/dashboard/administrator/general-admin/employees/moreNew"
                    className="flex-1 md:flex-none bg-background border border-input hover:bg-muted text-foreground font-bold px-3 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                  >
                    <i className="bi bi-file-earmark-arrow-up"></i>{' '}
                    <span className="hidden sm:inline">Masiva</span>
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/administrator/general-admin/employees/new"
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
              >
                <i className="bi bi-person-plus-fill"></i> Nuevo
              </Link>
            </div>
          }
        />

        <div className="p-4 md:p-6 lg:p-10 flex-1 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          <div className="bg-card rounded-2xl md:rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col">

            {/* FILTROS */}
            <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
              <div className="relative w-full sm:max-w-md">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full bg-background border border-input rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Toggle activos / bajas */}
                <button
                  onClick={() => setShowInactive((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    showInactive
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-background border-input text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <i
                    className={`bi ${showInactive ? 'bi-person-slash' : 'bi-person-check'}`}
                  ></i>
                  {showInactive ? (
                    <span>
                      Bajas
                      {inactiveCount > 0 && (
                        <span className="ml-1.5 bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                          {inactiveCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    'Activos'
                  )}
                </button>

                {currentUser.role === 'GENERAL_ADMIN' && (
                  <div className="relative">
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full sm:w-64 appearance-none bg-background border border-input px-4 py-2.5 pr-10 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:border-primary transition-all"
                    >
                      <option value="ALL">Todas las empresas</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <i className="bi bi-building absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"></i>
                  </div>
                )}
              </div>
            </div>

            {/* TABLA */}
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-150 md:min-w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-6 py-4">Usuario</th>
                    {currentUser.role === 'GENERAL_ADMIN' && (
                      <th className="hidden lg:table-cell px-6 py-4">
                        Empresa
                      </th>
                    )}
                    <th className="px-6 py-4 text-center">Rol</th>
                    <th className="hidden md:table-cell px-6 py-4">Puesto</th>
                    <th className="hidden md:table-cell px-6 py-4 text-center">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5" colSpan={6}>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </td>
                      </tr>
                    ))
                  ) : displayedUsers.length > 0 ? (
                    displayedUsers.map((user) => {
                      const isInactive = user.status === 'INACTIVE';
                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-muted/30 transition-colors group ${isInactive ? 'opacity-60' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 md:gap-4">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover border border-border/50 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs md:text-sm font-bold text-primary border border-primary/20 shrink-0">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {user.name}
                                </p>
                                <p className="text-[11px] md:text-xs font-medium text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {currentUser.role === 'GENERAL_ADMIN' && (
                            <td className="hidden lg:table-cell px-6 py-4">
                              <span className="text-[11px] font-bold text-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
                                {user.Company?.name || 'Independiente'}
                              </span>
                            </td>
                          )}

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-lg text-[8px] md:text-[9px] uppercase font-black tracking-widest ${ROLE_COLORS[user.role]}`}
                            >
                              {ROLE_LABELS[user.role] || user.role}
                            </span>
                          </td>

                          <td className="hidden md:table-cell px-6 py-4">
                            <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-tight">
                              {user.jobRole || (
                                <span className="text-muted-foreground/30 italic font-normal">
                                  Sin asignar
                                </span>
                              )}
                            </span>
                          </td>

                          {/* Columna Estado */}
                          <td className="hidden md:table-cell px-6 py-4 text-center">
                            {isInactive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                Baja
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                Activo
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Link
                                href={`/dashboard/administrator/employees/${user.id}`}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </Link>

                              {/* Botón dar de baja / reactivar — solo para EMPLOYEES */}
                              {user.role === 'EMPLOYEE' && (
                                <button
                                  onClick={() => setUserToDeactivate(user)}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                                    isInactive
                                      ? 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'
                                      : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50'
                                  }`}
                                  title={isInactive ? 'Reactivar' : 'Dar de baja'}
                                >
                                  <i
                                    className={`bi ${isInactive ? 'bi-person-check' : 'bi-person-dash'}`}
                                  ></i>
                                </button>
                              )}

                              <button
                                onClick={() => setUserToDelete(user)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-muted-foreground font-medium"
                      >
                        {showInactive
                          ? 'No hay empleados dados de baja'
                          : 'No hay usuarios que coincidan con la búsqueda'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BARRA DE CONTROLES DE PAGINACIÓN */}
            {!loading && allFilteredUsers.length > 0 && (
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10 text-xs">
                <p className="text-muted-foreground font-medium text-center sm:text-left">
                  Mostrando <span className="text-foreground font-bold">{startIndex + 1}</span> al{' '}
                  <span className="text-foreground font-bold">
                    {Math.min(endIndex, allFilteredUsers.length)}
                  </span>{' '}
                  de <span className="text-foreground font-bold">{allFilteredUsers.length}</span> usuarios
                </p>

                <div className="flex items-center gap-1.5 justify-center">
                  {/* Botón página anterior */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-input bg-background hover:bg-muted font-bold transition-all disabled:opacity-40 disabled:hover:bg-background"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  {/* Números de página */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-8 h-8 rounded-xl font-bold transition-all ${
                          currentPage === pageNumber
                            ? 'bg-secondary text-secondary-foreground shadow-sm'
                            : 'border border-input bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {/* Botón página siguiente */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-input bg-background hover:bg-muted font-bold transition-all disabled:opacity-40 disabled:hover:bg-background"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* MODAL ELIMINAR */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="bi bi-exclamation-octagon"></i>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                ¿Eliminar usuario?
              </h3>
              <p className="text-muted-foreground text-sm mb-8">
                Estás a punto de borrar a{' '}
                <strong>{userToDelete.name}</strong>. Esta acción no se puede
                deshacer.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Confirmar Eliminación'}
                </button>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="w-full py-3 bg-muted text-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DAR DE BAJA / REACTIVAR */}
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="text-center">
              {userToDeactivate.status === 'INACTIVE' ? (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="bi bi-person-check"></i>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    ¿Reactivar empleado?
                  </h3>
                  <p className="text-muted-foreground text-sm mb-8">
                    <strong>{userToDeactivate.name}</strong> volverá a tener
                    acceso a la plataforma y aparecerá como activo.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleToggleStatus}
                      disabled={togglingStatus}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {togglingStatus ? 'Procesando...' : 'Confirmar Reactivación'}
                    </button>
                    <button
                      onClick={() => setUserToDeactivate(null)}
                      className="w-full py-3 bg-muted text-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="bi bi-person-dash"></i>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    ¿Dar de baja al empleado?
                  </h3>
                  <p className="text-muted-foreground text-sm mb-8">
                    <strong>{userToDeactivate.name}</strong> quedará marcado
                    como baja. No se eliminan sus datos y podrás reactivarlo
                    cuando quieras.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleToggleStatus}
                      disabled={togglingStatus}
                      className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                      {togglingStatus ? 'Procesando...' : 'Confirmar Baja'}
                    </button>
                    <button
                      onClick={() => setUserToDeactivate(null)}
                      className="w-full py-3 bg-muted text-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}