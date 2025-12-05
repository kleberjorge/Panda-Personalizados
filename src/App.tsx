import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  Activity, PieChart, Settings, Menu, X, LogOut, Lock, Users, RefreshCw
} from 'lucide-react';
import { InventoryView, ProductView, SalesAndOpsView, ReportsView, SettingsView, DashboardView, PayrollView } from './components/Views';
import { Material, Product, Sale, Expense, OperationalLog, OperationalTarget, Unit, Marketplace, User, Role, InventoryTransaction, PayrollTransaction, SystemConfig } from './types';

// --- Mock/Initial Data ---
const INITIAL_MATERIALS: Material[] = [
  { id: '1', name: 'Papel Couché 150g', unit: Unit.M2, costPerUnit: 2.50, currentStock: 100, minStock: 20, lossPercentage: 5 },
  { id: '2', name: 'Tinta Vinílica Preta', unit: Unit.L, costPerUnit: 150.00, currentStock: 5, minStock: 1, lossPercentage: 2 },
];

const INITIAL_TARGETS: OperationalTarget[] = [
  { id: '1', metricName: 'Anúncios Criados', targetDaily: 5, unitRate: 2.00 },
  { id: '2', metricName: 'Pacotes Enviados', targetDaily: 20, unitRate: 0.50 },
];

const INITIAL_MARKETPLACES: Marketplace[] = [
    { id: '1', name: 'Mercado Livre - Clássico', fixedFee: 5.00, variableFeePercent: 12, adsFeePercent: 0, shippingCost: 20, taxPercent: 4 },
    { id: '2', name: 'Shopee', fixedFee: 3.00, variableFeePercent: 18, adsFeePercent: 2, shippingCost: 15, taxPercent: 4 },
    { id: '3', name: 'Balcão / Loja Física', fixedFee: 0, variableFeePercent: 0, adsFeePercent: 0, shippingCost: 0, taxPercent: 0 },
];

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', pin: '1234', role: Role.ADMIN },
  { id: '2', name: 'Funcionário', pin: '0000', role: Role.EMPLOYEE },
];

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link to={to} className={`flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100 hover:bg-emerald-700'}`}>
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

function App() {
  // --- Global State (Persistence via LocalStorage) ---
  const [materials, setMaterials] = useState<Material[]>(() => {
    try { const saved = localStorage.getItem('materials'); return saved ? JSON.parse(saved) : INITIAL_MATERIALS; } catch { return INITIAL_MATERIALS; }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try { const saved = localStorage.getItem('products'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try { const saved = localStorage.getItem('sales'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [logs, setLogs] = useState<OperationalLog[]>(() => {
    try { const saved = localStorage.getItem('logs'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try { const saved = localStorage.getItem('expenses'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  const [targets, setTargets] = useState<OperationalTarget[]>(() => {
    try { const saved = localStorage.getItem('targets'); return saved ? JSON.parse(saved) : INITIAL_TARGETS; } catch { return INITIAL_TARGETS; }
  });

  const [marketplaces, setMarketplaces] = useState<Marketplace[]>(() => {
    try { const saved = localStorage.getItem('marketplaces'); return saved ? JSON.parse(saved) : INITIAL_MARKETPLACES; } catch { return INITIAL_MARKETPLACES; }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try { const saved = localStorage.getItem('users'); return saved ? JSON.parse(saved) : INITIAL_USERS; } catch { return INITIAL_USERS; }
  });

  const [inventoryHistory, setInventoryHistory] = useState<InventoryTransaction[]>(() => {
    try { const saved = localStorage.getItem('inventoryHistory'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [payrollTransactions, setPayrollTransactions] = useState<PayrollTransaction[]>(() => {
    try { const saved = localStorage.getItem('payrollTransactions'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    try { const saved = localStorage.getItem('systemConfig'); return saved ? JSON.parse(saved) : { dailyMessage: "Bem-vindo! Nenhuma mensagem hoje." }; } catch { return { dailyMessage: "" }; }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist effects
  useEffect(() => localStorage.setItem('materials', JSON.stringify(materials)), [materials]);
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('logs', JSON.stringify(logs)), [logs]);
  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('targets', JSON.stringify(targets)), [targets]);
  useEffect(() => localStorage.setItem('marketplaces', JSON.stringify(marketplaces)), [marketplaces]);
  useEffect(() => localStorage.setItem('users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('inventoryHistory', JSON.stringify(inventoryHistory)), [inventoryHistory]);
  useEffect(() => localStorage.setItem('payrollTransactions', JSON.stringify(payrollTransactions)), [payrollTransactions]);
  useEffect(() => localStorage.setItem('systemConfig', JSON.stringify(systemConfig)), [systemConfig]);

  // --- AUTOMATIC PAYROLL GENERATION ---
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();
    
    users.forEach(u => {
      if (u.payrollConfig && u.payrollConfig.cutoffDay === currentDay) {
        const hasSlip = payrollTransactions.find(t => 
          t.userId === u.id && 
          t.type === 'SALARY_SLIP' && 
          new Date(t.date).getMonth() === today.getMonth() &&
          new Date(t.date).getFullYear() === today.getFullYear()
        );

        if (!hasSlip) {
          const newSlip: PayrollTransaction = {
             id: Date.now().toString() + Math.random(),
             userId: u.id,
             userName: u.name,
             type: 'SALARY_SLIP',
             status: 'PENDING',
             amount: 0, 
             date: today.toISOString(),
             description: `Salário ref. ${today.toLocaleDateString('pt-BR', {month: 'long'})}`
          };
          setPayrollTransactions(prev => [...prev, newSlip]);
        }
      }
    });
  }, [users, payrollTransactions]);

  // --- ACTIONS ---

  const handleDeleteSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    if (!window.confirm("Tem certeza? Isso excluirá a venda e devolverá os itens ao estoque.")) return;

    // Restore Stock
    const updatedMaterials = [...materials];
    sale.items.forEach(item => {
       const product = products.find(p => p.id === item.productId);
       if (product) {
          product.materials.forEach(matReq => {
             const matIndex = updatedMaterials.findIndex(m => m.id === matReq.materialId);
             if (matIndex >= 0) {
                updatedMaterials[matIndex] = {
                   ...updatedMaterials[matIndex],
                   currentStock: updatedMaterials[matIndex].currentStock + (matReq.quantity * item.quantity)
                };
             }
          });
       }
    });
    
    setMaterials(updatedMaterials);
    setSales(sales.filter(s => s.id !== saleId));
  };

  const handleDeleteInventoryLog = (logId: string) => {
    const log = inventoryHistory.find(l => l.id === logId);
    if(!log) return;

    if(!window.confirm("Tem certeza? Isso reverterá a movimentação de estoque.")) return;

    // Revert Stock Change
    const updatedMaterials = [...materials];
    const matIndex = updatedMaterials.findIndex(m => m.id === log.materialId);
    
    if (matIndex >= 0) {
       if (log.type === 'ADD') {
          // Was Add, so we subtract
          updatedMaterials[matIndex].currentStock -= log.quantity;
       } else {
          // Was Loss, so we add back
          updatedMaterials[matIndex].currentStock += log.quantity;
       }
       setMaterials(updatedMaterials);
    }

    setInventoryHistory(inventoryHistory.filter(h => h.id !== logId));
  };

  const handleExportData = () => {
    const data = {
      materials, products, sales, logs, expenses, targets, marketplaces, users, inventoryHistory, payrollTransactions, systemConfig
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-panda-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.materials) setMaterials(data.materials);
        if (data.products) setProducts(data.products);
        if (data.sales) setSales(data.sales);
        if (data.logs) setLogs(data.logs);
        if (data.expenses) setExpenses(data.expenses);
        if (data.targets) setTargets(data.targets);
        if (data.marketplaces) setMarketplaces(data.marketplaces);
        if (data.users) setUsers(data.users);
        if (data.inventoryHistory) setInventoryHistory(data.inventoryHistory);
        if (data.payrollTransactions) setPayrollTransactions(data.payrollTransactions);
        if (data.systemConfig) setSystemConfig(data.systemConfig);
        alert("Dados importados com sucesso! O sistema foi atualizado.");
      } catch (err) {
        alert("Erro ao importar arquivo. Verifique se é um backup válido.");
      }
    };
    reader.readAsText(file);
  };

  // --- Login Screen ---
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={setCurrentUser} />;
  }

  return (
    <HashRouter>
      <MainLayout 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        state={{ materials, products, sales, logs, expenses, targets, marketplaces, users, inventoryHistory, payrollTransactions, systemConfig }}
        setters={{ setMaterials, setProducts, setSales, setLogs, setExpenses, setTargets, setMarketplaces, setUsers, setInventoryHistory, setPayrollTransactions, setSystemConfig }}
        actions={{ handleDeleteSale, handleDeleteInventoryLog, handleExportData, handleImportData }}
      />
    </HashRouter>
  );
}

// --- Login Component ---
const LoginScreen = ({ users, onLogin }: { users: User[], onLogin: (u: User) => void }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (user && user.pin === pin) {
      onLogin(user);
    } else {
      setError('Senha incorreta.');
    }
  };

  const handleHardReset = () => {
    if(confirm("ATENÇÃO: Isso apagará TODOS os dados salvos neste computador (Vendas, Produtos, Estoque). Use apenas se o sistema estiver travado. Deseja continuar?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 px-4">
       <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
          <div className="text-center mb-6">
             <div className="h-16 w-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">P</div>
             <h1 className="text-2xl font-bold text-gray-800">Panda Personalizados</h1>
             <p className="text-gray-500">Sistema de Gestão v3.0</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">Usuário</label>
               <select className="w-full border p-3 rounded bg-gray-50" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                 {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role === Role.ADMIN ? 'Admin' : 'Func.'})</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-1">Senha / PIN</label>
               <input 
                  type="password" 
                  className="w-full border p-3 rounded bg-gray-50" 
                  placeholder="Digite sua senha"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                />
             </div>
             {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
             <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded font-bold hover:bg-emerald-700 transition">ENTRAR</button>
          </form>
          <div className="mt-8 pt-4 border-t text-center">
            <button onClick={handleHardReset} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 justify-center w-full">
              <RefreshCw size={12}/> Limpar Sistema (Reset)
            </button>
          </div>
       </div>
    </div>
  );
}

const MainLayout = ({ sidebarOpen, setSidebarOpen, state, setters, currentUser, setCurrentUser, actions }: any) => {
  const location = useLocation();
  const path = location.pathname;
  const isAdmin = currentUser?.role === Role.ADMIN;

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-emerald-900 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 z-30 flex flex-col`}>
        <div className="p-6 border-b border-emerald-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Panda</h1>
            <h2 className="text-sm font-light text-emerald-200 tracking-wider">Gestão 3.0</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white"><X /></button>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Visão Geral" active={path === '/'} />
          <SidebarItem to="/inventory" icon={Package} label="Insumos & Estoque" active={path === '/inventory'} />
          <SidebarItem to="/products" icon={ShoppingCart} label="Produtos" active={path === '/products'} />
          <SidebarItem to="/sales" icon={DollarSign} label="Vendas" active={path === '/sales'} />
          {isAdmin && (
            <>
              <SidebarItem to="/reports" icon={PieChart} label="Relatórios & IA" active={path === '/reports'} />
              <SidebarItem to="/payroll" icon={Users} label="RH / Salários" active={path === '/payroll'} />
              <SidebarItem to="/settings" icon={Settings} label="Configurações" active={path === '/settings'} />
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-emerald-800">
           <button onClick={handleLogout} className="flex items-center gap-2 text-emerald-200 hover:text-white w-full">
              <LogOut size={16}/> Sair
           </button>
        </div>
        <div className="p-4 text-emerald-300 text-xs text-center bg-emerald-950">
          v3.0.0 - Completo
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10 p-4 flex items-center justify-between lg:justify-end">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 p-2 rounded hover:bg-gray-100">
            <Menu />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                {isAdmin ? <Lock size={10}/> : null} 
                {isAdmin ? 'Administrador' : 'Funcionário'}
              </p>
            </div>
            <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
               {currentUser?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={
              <DashboardView 
                materials={state.materials}
                sales={state.sales}
                products={state.products}
                systemConfig={state.systemConfig}
              />
            } />
            <Route path="/inventory" element={
               <InventoryView 
                  materials={state.materials} setMaterials={setters.setMaterials} 
                  history={state.inventoryHistory} setHistory={setters.setInventoryHistory}
                  currentUser={currentUser}
                  onDeleteHistory={actions.handleDeleteInventoryLog}
               />
            } />
            <Route path="/products" element={<ProductView products={state.products} setProducts={setters.setProducts} materials={state.materials} />} />
            <Route path="/sales" element={
              <SalesAndOpsView 
                products={state.products} materials={state.materials} setMaterials={setters.setMaterials}
                sales={state.sales} setSales={setters.setSales}
                logs={state.logs} setLogs={setters.setLogs}
                targets={state.targets} marketplaces={state.marketplaces}
                currentUser={currentUser}
                onDeleteSale={actions.handleDeleteSale}
              />
            } />
            <Route path="/reports" element={
              isAdmin ? 
              <ReportsView sales={state.sales} expenses={state.expenses} setExpenses={setters.setExpenses} products={state.products} materials={state.materials} /> 
              : <Navigate to="/" replace />
            } />
            <Route path="/payroll" element={
              isAdmin ?
              <PayrollView 
                 users={state.users} setUsers={setters.setUsers}
                 transactions={state.payrollTransactions} setTransactions={setters.setPayrollTransactions}
                 logs={state.logs}
                 targets={state.targets}
                 sales={state.sales} expenses={state.expenses} products={state.products} materials={state.materials}
                 inventoryHistory={state.inventoryHistory}
                 setExpenses={setters.setExpenses}
              />
              : <Navigate to="/" replace />
            } />
             <Route path="/settings" element={
              isAdmin ?
              <SettingsView 
                 marketplaces={state.marketplaces} setMarketplaces={setters.setMarketplaces}
                 targets={state.targets} setTargets={setters.setTargets}
                 users={state.users} setUsers={setters.setUsers}
                 systemConfig={state.systemConfig} setSystemConfig={setters.setSystemConfig}
                 onExportData={actions.handleExportData}
                 onImportData={actions.handleImportData}
              />
              : <Navigate to="/" replace />
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
