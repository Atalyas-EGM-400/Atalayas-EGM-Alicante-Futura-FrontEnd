'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';
// ✅ Añadidos los imports que faltaban para las animaciones
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'GENERAL_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'PUBLIC';
  jobRole?: string;
  companyId: string | null;
  createdAt: string;
  avatarUrl?: string;
  isActive?: boolean; 
  Company?: Company;
}

// --- Constantes de Estilo ---
const ROLE_LABELS: Record<User['role'], string> = {
  GENERAL_ADMIN: 'Súper Admin',
  ADMIN: 'Admin Empresa',
  EMPLOYEE: 'Empleado',
  PUBLIC: 'Público',
};

const ROLE_COLORS: Record<User['role'], string> = {
  GENERAL_ADMIN: 'bg-purple-100 text-purple-700 border border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 border border-blue-200',
  EMPLOYEE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  PUBLIC: 'bg-orange-100 text-orange-700 border border-orange-200',
};

const ITEMS_PER_PAGE = 10;

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableJobRoles, setAvailableJobRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLoadingRoles] = useState(false); // Corregido warning de variable no usada
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedJobRole, setSelectedJobRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE'); // Mantener definición por si se usa luego

  // ESTADO DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para el modal de eliminación
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchAvailableJobRoles = async () => {
    setLoadingRoles(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_ROUTES.USERS.GET_ALL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableJobRoles(Array.isArray(data) ? data : []);
      } else {
        setAvailableJobRoles([]);
      }
    } catch (err) {
      console.error("Error cargando roles de trabajo:", err);
      setAvailableJobRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${getToken()}` };
      const storedUser: User = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!storedUser.id) return;
      setCurrentUser(storedUser);

      const [usersRes, compRes] = await Promise.all([
        fetch(API_ROUTES.USERS.GET_ALL, { headers }),
        fetch(API_ROUTES.COMPANIES.GET_ALL, { headers }).catch(() => null)
      ]);

      const usersData = await usersRes.json();

      if (compRes && compRes.ok) {
        const compData = await compRes.json();
        setCompanies(Array.isArray(compData) ? compData : []);
      }

      if (Array.isArray(usersData)) {
        if (storedUser.role === 'ADMIN') {
          const filtered = usersData.filter(u =>
            String(u.companyId || '').trim() === String(storedUser.companyId || '').trim()
          );
          setUsers(filtered);
        } else {
          setUsers(usersData);
        }
      }

      await fetchAvailableJobRoles();
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetear a la página 1 cuando cambie cualquier filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompany, selectedJobRole]);

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_ROUTES.USERS.GET_ALL}/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (res.ok) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        setUserToDelete(null);
      } else {
        alert("No se pudo eliminar el usuario.");
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Función placeholder para evitar error de ejecución
  const handleToggleStatus = (user: User) => {
    console.log("Cambiar estado de:", user.name);
  };

  const handleDownloadCSV = () => {
    const employeesToExport = users.filter(user => user.role === 'EMPLOYEE');
    const csvRows = ['\uFEFFnombre,email,rol,puesto'];

    employeesToExport.forEach(employee => {
      const name = employee.name?.includes(',') ? `"${employee.name}"` : (employee.name || '');
      const jobRole = employee.jobRole?.includes(',') ? `"${employee.jobRole}"` : (employee.jobRole || '');
      
      csvRows.push([name, employee.email || '', 'EMPLOYEE', jobRole].join(','));
    });

    const csvContent = csvRows.join('\n');
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

  // 1. Filtrar y ordenar la lista completa primero
  const filteredUsers = users
    .filter(user => {
      const matchCompany = selectedCompany === 'ALL' || String(user.companyId) === String(selectedCompany);
      const matchJobRole = !selectedJobRole || user.jobRole === selectedJobRole;
      const matchSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCompany && matchJobRole && matchSearch;
    })
    .sort((a, b) => {
      const rolesOrder: Record<string, number> = { 'GENERAL_ADMIN': 1, 'ADMIN': 2, 'EMPLOYEE': 3, 'PUBLIC': 4 };
      return (rolesOrder[a.role] || 99) - (rolesOrder[b.role] || 99);
    });

  // 2. Cálculos matemáticos de paginación
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  
  // 3. Segmentar los usuarios
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);

  const hasActiveJobRoleFilter = selectedJobRole !== '';

  if (!currentUser) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background font-sans text-foreground">
      <main className="flex-1 overflow-x-hidden flex flex-col relative">
        <PageHeader
          title={currentUser.role === 'GENERAL_ADMIN' ? "Gestión Global" : "Empleados"}
          description={currentUser.role === 'GENERAL_ADMIN' ? "Control de perfiles y empresas" : "Administra tu equipo"}
          icon={<i className="bi bi-people-fill"></i>}
          action={
            <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
              {currentUser.role !== 'GENERAL_ADMIN' && (
                <>
                  <button
                    onClick={handleDownloadCSV}
                    className="flex-1 md:flex-none bg-card border border-border hover:bg-muted text-foreground font-bold px-3 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <i className="bi bi-download"></i> <span className="hidden sm:inline">CSV</span>
                  </button>
                  <Link
                    href="/dashboard/administrator/admin/employees/moreNew"
                    className="flex-1 md:flex-none bg-card border border-border hover:bg-muted text-foreground font-bold px-3 py-2 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <i className="bi bi-file-earmark-arrow-up"></i> <span className="hidden sm:inline">Masiva</span>
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/administrator/admin/employees/new"
                className="w-full md:w-auto bg-secondary hover:opacity-90 text-secondary-foreground font-bold px-4 py-2 rounded-xl transition-opacity text-xs shadow-sm flex items-center justify-center gap-2"
              >
                <i className="bi bi-person-plus-fill"></i> Nuevo
              </Link>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto w-full bg-card rounded-3xl shadow-sm border border-border flex flex-col min-h-100">

            {/* FILTROS */}
            <div className="p-4 border-b border-border flex flex-col gap-4 bg-muted/20">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:flex-1">
                  <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className="w-full bg-background border border-input rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all font-medium shadow-sm"
                  />
                </div>

                {currentUser.role === 'GENERAL_ADMIN' && (
                  <div className="relative w-full sm:w-auto min-w-45">
                    <i className="bi bi-building absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full appearance-none bg-background border border-input pl-11 pr-10 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:border-primary transition-all shadow-sm"
                    >
                      <option value="ALL">Todas las empresas</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <i className="bi bi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-xs"></i>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:min-w-50">
                    <i className="bi bi-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                    <select
                      value={selectedJobRole}
                      onChange={(e) => setSelectedJobRole(e.target.value)}
                      className="w-full appearance-none bg-background border border-input pl-11 pr-10 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:border-primary transition-all shadow-sm"
                    >
                      <option value="">Todos los puestos</option>
                      {availableJobRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <i className="bi bi-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-xs"></i>
                  </div>

                  {hasActiveJobRoleFilter && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">
                      <i className="bi bi-check-circle-fill text-[8px]"></i>
                      Filtrado por: {selectedJobRole}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TABLA CORREGIDA */}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-150 md:min-w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-6 py-4">Usuario</th>
                    {currentUser.role === 'GENERAL_ADMIN' && (
                      <th className="hidden lg:table-cell px-6 py-4">Empresa</th>
                    )}
                    <th className="px-6 py-4 text-center">Rol</th>
                    <th className="hidden md:table-cell px-6 py-4">Puesto</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5" colSpan={currentUser.role === 'GENERAL_ADMIN' ? 5 : 4}>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {displayedUsers.length > 0 ? (
                        displayedUsers.map((user) => (
                          <motion.tr 
                            key={user.id} 
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 md:gap-4">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover border border-border/50 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs md:text-sm font-bold text-primary border border-primary/20 shrink-0">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate flex items-center gap-2">
                                    {user.name}
                                    {user.isActive === false && (
                                      <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Baja</span>
                                    )}
                                  </p>
                                  <p className="text-[11px] md:text-xs font-medium text-muted-foreground truncate">{user.email}</p>
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
                              <span className={`inline-block px-3 py-1 rounded-lg text-[8px] md:text-[9px] uppercase font-black tracking-widest ${ROLE_COLORS[user.role]}`}>
                                {ROLE_LABELS[user.role] || user.role}
                              </span>
                            </td>

                            <td className="hidden md:table-cell px-6 py-4">
                              <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-tight">
                                {user.jobRole || <span className="text-muted-foreground/30 italic font-normal">Sin asignar</span>}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  onClick={() => handleToggleStatus(user)} 
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${user.isActive === false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50'}`}
                                  title={user.isActive === false ? "Reactivar Empleado" : "Dar de baja"}
                                >
                                  <i className={`bi ${user.isActive === false ? 'bi-person-check-fill' : 'bi-person-slash'}`}></i>
                                </button>
                                <Link href={`/dashboard/administrator/admin/employees/${user.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                                  <i className="bi bi-pencil-square"></i>
                                </Link>
                                <button onClick={() => setUserToDelete(user)} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
  <td colSpan={currentUser.role === 'GENERAL_ADMIN' ? 5 : 4} className="px-6 py-20 text-center text-muted-foreground font-medium">
                            {activeTab === 'INACTIVE' 
                              ? 'No hay empleados dados de baja.' 
                              : 'No hay usuarios activos que coincidan con la búsqueda.'}
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground font-medium">
                  Mostrando del <span className="font-bold text-foreground">{startIndex + 1}</span> al{' '}
                  <span className="font-bold text-foreground">
                    {Math.min(endIndex, filteredUsers.length)}
                  </span>{' '}
                  de <span className="font-bold text-foreground">{filteredUsers.length}</span> empleados
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-9 px-3 rounded-xl border border-input bg-background text-foreground text-xs font-bold transition-all hover:bg-muted disabled:opacity-40 disabled:hover:bg-background flex items-center gap-1"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition-all border ${
                          currentPage === pageNumber
                            ? 'bg-secondary border-secondary text-secondary-foreground shadow-sm'
                            : 'bg-background border-input text-foreground hover:bg-muted'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-9 px-3 rounded-xl border border-input bg-background text-foreground text-xs font-bold transition-all hover:bg-muted disabled:opacity-40 disabled:hover:bg-background flex items-center gap-1"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* MODAL DE ELIMINACIÓN */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-border">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                  <i className="bi bi-exclamation-octagon"></i>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">¿Eliminar usuario?</h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Estás a punto de borrar a <strong>{userToDelete.name}</strong>. Esta acción no se puede deshacer.
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}