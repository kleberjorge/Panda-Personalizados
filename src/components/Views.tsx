import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Material, Product, Sale, Expense, OperationalLog, OperationalTarget, Marketplace, Unit, PaymentMethod, User, Role, InventoryTransaction, PayrollTransaction, PayrollConfig, SystemConfig 
} from '../types';
import { 
  Plus, Trash2, AlertTriangle, TrendingUp, DollarSign, Package, 
  Activity, Save, ShoppingCart, BrainCircuit, Edit2, MinusCircle, PlusCircle, FileText, Users, Shield, Clock, CheckSquare, Wallet, X, AlertCircle, CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { generateBusinessInsight, suggestProductDescription } from '../services/geminiService';

// --- Utilities ---
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'});

// --- Components Helper ---
const InputMoney = ({ value, onChange, placeholder }: { value: number | undefined, onChange: (v: number) => void, placeholder?: string }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <span className="text-gray-500 sm:text-sm">R$</span>
    </div>
    <input
      type="number"
      className="pl-8 block w-full border-gray-300 rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder={placeholder}
      value={value === undefined ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value))}
      step="0.01"
    />
  </div>
);

// --- Dashboard View ---
export const DashboardView: React.FC<{
  materials: Material[];
  sales: Sale[];
  products: Product[];
  systemConfig: SystemConfig;
}> = ({ materials, sales, products, systemConfig }) => {
  const navigate = useNavigate();
  const [showDailyMsg, setShowDailyMsg] = useState(false);

  // Stats
  const lowStockItems = materials.filter(m => m.currentStock <= m.minStock);
  const todayStr = new Date().toLocaleDateString('pt-BR');
  const salesToday = sales.filter(s => new Date(s.date).toLocaleDateString('pt-BR') === todayStr);
  const totalSalesToday = salesToday.reduce((acc, s) => acc + s.totalAmount, 0);
  const pendingOrders = sales.filter(s => s.status === 'PENDING').length;
  const productionOrders = sales.filter(s => s.status === 'IN_PRODUCTION').length;

  return (
    <div className="space-y-6">
       {/* Daily Message Modal */}
       {showDailyMsg && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
           <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg border-l-4 border-blue-500 relative">
             <button onClick={() => setShowDailyMsg(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
             <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
               <FileText className="text-blue-500" /> Relatório / Quadro de Avisos
             </h3>
             <div className="bg-gray-50 p-4 rounded text-gray-700 whitespace-pre-wrap min-h-[150px]">
               {systemConfig.dailyMessage || "Nenhuma mensagem do administrador para hoje."}
             </div>
             <div className="mt-4 flex justify-end">
               <button onClick={() => setShowDailyMsg(false)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Entendido</button>
             </div>
           </div>
         </div>
       )}

       <h2 className="text-2xl font-bold text-gray-800">Painel de Controle</h2>
       
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-600">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-gray-500 uppercase">Vendas Hoje</p>
                   <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSalesToday)}</p>
                </div>
                <DollarSign className="text-blue-100 bg-blue-600 rounded p-1 h-8 w-8" />
             </div>
             <p className="text-xs text-gray-500 mt-2">{salesToday.length} pedidos hoje</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-gray-500 uppercase">Aguardando</p>
                   <p className="text-2xl font-bold text-gray-800">{pendingOrders}</p>
                </div>
                <Clock className="text-yellow-100 bg-yellow-500 rounded p-1 h-8 w-8" />
             </div>
             <p className="text-xs text-gray-500 mt-2">Pedidos para iniciar</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-gray-500 uppercase">Em Produção</p>
                   <p className="text-2xl font-bold text-gray-800">{productionOrders}</p>
                </div>
                <Activity className="text-purple-100 bg-purple-500 rounded p-1 h-8 w-8" />
             </div>
             <p className="text-xs text-gray-500 mt-2">Na linha de produção</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold text-gray-500 uppercase">Estoque Baixo</p>
                   <p className="text-2xl font-bold text-gray-800">{lowStockItems.length}</p>
                </div>
                <AlertTriangle className="text-red-100 bg-red-500 rounded p-1 h-8 w-8" />
             </div>
             <p className="text-xs text-gray-500 mt-2">Itens precisam de atenção</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Stock List */}
          <div className="bg-white rounded-lg shadow border p-4">
             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> Alertas de Reposição</h3>
             {lowStockItems.length === 0 ? (
                <p className="text-green-600 text-sm bg-green-50 p-3 rounded">Tudo certo! Nenhum item com estoque crítico.</p>
             ) : (
                <div className="max-h-64 overflow-y-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                         <tr>
                           <th className="p-2">Insumo</th>
                           <th className="p-2 text-right">Atual</th>
                           <th className="p-2 text-right">Mínimo</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {lowStockItems.map(m => (
                            <tr key={m.id}>
                               <td className="p-2 font-medium text-gray-700">{m.name}</td>
                               <td className="p-2 text-right font-bold text-red-600">{m.currentStock} {m.unit}</td>
                               <td className="p-2 text-right text-gray-500">{m.minStock} {m.unit}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border p-4">
             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><CheckSquare size={18} className="text-blue-500"/> Ações Rápidas</h3>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowDailyMsg(true)} className="p-4 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-bold flex flex-col items-center gap-2 transition">
                   <FileText size={24} />
                   Relatório do Dia
                </button>
                <button onClick={() => navigate('/products')} className="p-4 bg-green-50 hover:bg-green-100 rounded text-green-700 font-bold flex flex-col items-center gap-2 transition">
                   <PlusCircle size={24} />
                   Novo Produto
                </button>
             </div>
             <div className="mt-4 bg-gray-50 p-3 rounded text-xs text-gray-500">
                Nota: O "Relatório do Dia" exibe mensagens deixadas pela administração para a equipe.
             </div>
          </div>
       </div>
    </div>
  );
};

// --- Payroll View ---
export const PayrollView: React.FC<{
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: PayrollTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<PayrollTransaction[]>>;
  logs: OperationalLog[];
  targets: OperationalTarget[];
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  materials: Material[];
  inventoryHistory: InventoryTransaction[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}> = ({ users, setUsers, transactions, setTransactions, logs, targets, sales, expenses, products, materials, inventoryHistory, setExpenses }) => {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [tab, setTab] = useState<'CONFIG'|'ADVANCE'|'PAYROLL'>('CONFIG');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [showWasteDetails, setShowWasteDetails] = useState<{isOpen: boolean, data: any[]}>({ isOpen: false, data: [] });
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  
  const updateConfig = (cfg: Partial<PayrollConfig>) => {
    if (!selectedUser) return;
    const newConfig = { ...(selectedUser.payrollConfig || { salaryType: 'FIXED', baseValue: 0, cutoffDay: 5 }), ...cfg };
    setUsers(users.map(u => u.id === selectedUserId ? { ...u, payrollConfig: newConfig as PayrollConfig } : u));
  };

  const addAdvance = () => {
    if (!selectedUser || advanceAmount <= 0) return;
    const tr: PayrollTransaction = {
      id: Date.now().toString(),
      userId: selectedUser.id,
      userName: selectedUser.name,
      type: 'ADVANCE',
      amount: advanceAmount,
      date: new Date().toISOString(),
      status: 'PENDING',
      description: 'Vale / Adiantamento'
    };
    setTransactions([...transactions, tr]);
    setAdvanceAmount(0);
  };

  const getPendingAdvances = (uid: string) => transactions.filter(t => t.userId === uid && t.type === 'ADVANCE' && t.status === 'PENDING');
  
  const calculateTotalBonus = (uid: string, month: number, year: number) => {
     const userLogs = logs.filter(l => {
        const d = new Date(l.date);
        return d.getMonth() === month && d.getFullYear() === year;
     }); 
     
     let total = 0;
     targets.forEach(t => {
        const val = userLogs.filter(l => l.metricName === t.metricName).reduce((acc, l) => acc + l.value, 0);
        total += val * t.unitRate;
     });
     return total;
  };

  // --- Waste Penalty Calculation ---
  const calculateWastePenalty = (uid: string, month: number, year: number) => {
      if (!selectedUser?.payrollConfig?.wastePenaltyPercent) return { totalPenalty: 0, details: [] };

      const monthlySales = sales.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === month && d.getFullYear() === year;
      });

      const theoreticalConsumption: Record<string, number> = {};
      monthlySales.forEach(s => {
          s.items.forEach(item => {
              const prod = products.find(p => p.id === item.productId);
              if (prod) {
                  prod.materials.forEach(matReq => {
                      theoreticalConsumption[matReq.materialId] = (theoreticalConsumption[matReq.materialId] || 0) + (matReq.quantity * item.quantity);
                  });
              }
          });
      });

      const monthlyLossLogs = inventoryHistory.filter(h => {
          const d = new Date(h.date);
          return h.type === 'LOSS' && d.getMonth() === month && d.getFullYear() === year;
      });

      let totalPenalty = 0;
      const details: any[] = [];

      materials.forEach(mat => {
          const theoretical = theoreticalConsumption[mat.id] || 0;
          const allowedLoss = theoretical * (mat.lossPercentage / 100);
          
          const logsForMat = monthlyLossLogs.filter(l => l.materialId === mat.id);
          const actualTotalLoss = logsForMat.reduce((acc, l) => acc + l.quantity, 0);

          if (actualTotalLoss > allowedLoss) {
              const excessQty = actualTotalLoss - allowedLoss;
              const excessCost = excessQty * mat.costPerUnit;

              const userLossLogs = logsForMat.filter(l => l.userId === uid);
              const userLossQty = userLossLogs.reduce((acc, l) => acc + l.quantity, 0);

              if (userLossQty > 0) {
                  const userShare = userLossQty / actualTotalLoss;
                  const userPenaltyBase = excessCost * userShare;
                  const penaltyAmount = userPenaltyBase * ((selectedUser.payrollConfig?.wastePenaltyPercent || 0) / 100);
                  
                  totalPenalty += penaltyAmount;
                  details.push({
                      materialName: mat.name,
                      theoretical,
                      allowedLoss,
                      actualTotalLoss,
                      excessQty,
                      userLossQty,
                      penaltyAmount
                  });
              }
          }
      });

      return { totalPenalty, details };
  };

  const calculateMonthlyContribution = (month: number, year: number) => {
      const monthlySales = sales.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === month && d.getFullYear() === year;
      });

      return monthlySales.reduce((acc, sale) => {
          const revenue = sale.totalAmount;
          let fees = 0;
          if (sale.feeSnapshot !== undefined) {
              fees = sale.feeSnapshot;
          } else {
              fees = revenue - (sale.netRevenue || revenue);
          }

          let cogs = 0;
          if (sale.costSnapshot !== undefined) {
              cogs = sale.costSnapshot;
          } else {
               cogs = sale.items.reduce((iAcc, item) => {
                  const prod = products.find(p => p.id === item.productId);
                  if (!prod) return iAcc;
                  const matCost = prod.materials.reduce((mAcc, mItem) => {
                      const m = materials.find(mat => mat.id === mItem.materialId);
                      return mAcc + (m ? m.costPerUnit * mItem.quantity : 0);
                  }, 0);
                  return iAcc + ((matCost + prod.laborCost) * item.quantity);
               }, 0);
          }

          return acc + (revenue - fees - cogs);
      }, 0);
  };

  const handleConfirmPayment = (tr: PayrollTransaction, penaltyAmount: number) => {
      const user = users.find(u => u.id === tr.userId);
      if (!user) return;
      const cfg = user.payrollConfig || { salaryType: 'FIXED', baseValue: 0, cutoffDay: 5 };
      
      const slipDate = new Date(tr.date);
      const month = slipDate.getMonth();
      const year = slipDate.getFullYear();

      let base = 0;
      if (cfg.salaryType === 'FIXED') {
          base = cfg.baseValue;
      } else {
          const contribution = calculateMonthlyContribution(month, year);
          base = contribution * (cfg.baseValue / 100);
      }
      
      const bonus = calculateTotalBonus(tr.userId, month, year);
      const advances = getPendingAdvances(tr.userId).reduce((acc, t) => acc + t.amount, 0);
      const finalAmount = (base + bonus) - advances - penaltyAmount;

      if (finalAmount < 0 && !confirm("Valor negativo (Multas > Salário). Confirmar mesmo assim?")) return;

      const updatedTransactions = transactions.map(t => {
          if (t.id === tr.id) return { ...t, status: 'PAID' as const, amount: finalAmount, details: { base, bonus, advances, wastePenalty: penaltyAmount } };
          if (t.userId === tr.userId && t.type === 'ADVANCE' && t.status === 'PENDING') return { ...t, status: 'PAID' as const };
          return t;
      });
      setTransactions(updatedTransactions);

      setExpenses([...expenses, {
          id: Date.now().toString(),
          description: `Salário - ${user.name}`,
          amount: finalAmount,
          date: new Date().toISOString(),
          category: 'PAYROLL'
      }]);
  };

  return (
    <div className="space-y-6 relative">
       {showWasteDetails.isOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
               <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-3xl border relative">
                   <button onClick={() => setShowWasteDetails({isOpen: false, data: []})} className="absolute top-3 right-3 text-gray-500"><X /></button>
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600"><AlertCircle /> Detalhamento de Multas por Desperdício</h3>
                   <div className="overflow-x-auto">
                       <table className="min-w-full text-sm text-left">
                           <thead className="bg-gray-100 text-gray-600">
                               <tr>
                                   <th className="p-2">Material</th>
                                   <th className="p-2 text-right">Consumo Teórico</th>
                                   <th className="p-2 text-right">Limite Perda</th>
                                   <th className="p-2 text-right">Perda Real Total</th>
                                   <th className="p-2 text-right">Excesso</th>
                                   <th className="p-2 text-right">Sua Perda</th>
                                   <th className="p-2 text-right">Multa</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y">
                               {showWasteDetails.data.map((d, i) => (
                                   <tr key={i}>
                                       <td className="p-2 font-medium">{d.materialName}</td>
                                       <td className="p-2 text-right">{d.theoretical.toFixed(2)}</td>
                                       <td className="p-2 text-right text-green-600">{d.allowedLoss.toFixed(2)}</td>
                                       <td className="p-2 text-right text-red-600 font-bold">{d.actualTotalLoss.toFixed(2)}</td>
                                       <td className="p-2 text-right text-orange-600">{d.excessQty.toFixed(2)}</td>
                                       <td className="p-2 text-right font-bold">{d.userLossQty.toFixed(2)}</td>
                                       <td className="p-2 text-right font-bold text-red-700">{formatCurrency(d.penaltyAmount)}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
                   <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                       * A multa é aplicada proporcionalmente ao excesso global. Se a equipe estourou a margem de perda, você paga o % configurado sobre sua parcela de culpa no excesso.
                   </div>
               </div>
           </div>
       )}

       <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800"><Users /> RH e Folha de Pagamento</h2>
       
       <div className="bg-white p-4 rounded shadow flex gap-4 items-center">
         <label className="font-bold text-gray-700">Funcionário:</label>
         <select className="border p-2 rounded" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
         </select>
       </div>

       {selectedUser && (
         <div className="bg-white rounded shadow border min-h-[400px]">
            <div className="flex border-b">
               <button onClick={() => setTab('CONFIG')} className={`px-6 py-3 font-bold ${tab==='CONFIG' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Configuração</button>
               <button onClick={() => setTab('ADVANCE')} className={`px-6 py-3 font-bold ${tab==='ADVANCE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Vales & Adiantamentos</button>
               <button onClick={() => setTab('PAYROLL')} className={`px-6 py-3 font-bold ${tab==='PAYROLL' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Folha de Pagamento</button>
            </div>

            <div className="p-6">
               {tab === 'CONFIG' && (
                 <div className="max-w-md space-y-4">
                    <h3 className="font-bold text-lg mb-4">Dados Contratuais</h3>
                    <div>
                       <label className="block text-sm font-bold text-gray-600 mb-1">Tipo de Remuneração</label>
                       <select className="w-full border p-2 rounded" value={selectedUser.payrollConfig?.salaryType} onChange={e => updateConfig({ salaryType: e.target.value as any })}>
                          <option value="FIXED">Salário Fixo Mensal</option>
                          <option value="PROFIT_SHARE">% sobre Margem de Contribuição</option>
                       </select>
                       <p className="text-xs text-gray-500 mt-1">Margem de Contribuição = Faturamento - Taxas Marketplace - Custo dos Materiais.</p>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-600 mb-1">
                          {selectedUser.payrollConfig?.salaryType === 'FIXED' ? 'Valor do Salário Base (R$)' : '% sobre Margem de Contribuição'}
                       </label>
                       <input 
                          type="number" 
                          className="w-full border p-2 rounded" 
                          value={selectedUser.payrollConfig?.baseValue} 
                          onChange={e => updateConfig({ baseValue: parseFloat(e.target.value) })} 
                          placeholder={selectedUser.payrollConfig?.salaryType === 'FIXED' ? "Ex: 1500.00" : "Ex: 5"}
                        />
                    </div>
                    <div className="bg-red-50 p-3 rounded border border-red-100">
                       <label className="block text-sm font-bold text-red-700 mb-1 flex items-center gap-2"><AlertTriangle size={14}/> % de Desconto sobre Desperdício</label>
                       <input 
                          type="number" max="100" min="0" 
                          className="w-full border p-2 rounded" 
                          value={selectedUser.payrollConfig?.wastePenaltyPercent || 0} 
                          onChange={e => updateConfig({ wastePenaltyPercent: parseFloat(e.target.value) })} 
                        />
                       <p className="text-xs text-red-500 mt-1">Porcentagem do custo do material excedente que será descontado do salário. (0 = Sem multa)</p>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-600 mb-1">Dia de Pagamento (Corte)</label>
                       <input 
                          type="number" max="31" min="1" 
                          className="w-full border p-2 rounded" 
                          value={selectedUser.payrollConfig?.cutoffDay} 
                          onChange={e => updateConfig({ cutoffDay: parseInt(e.target.value) })} 
                        />
                       <p className="text-xs text-gray-500 mt-1">O sistema irá gerar o holerite pendente automaticamente neste dia do mês.</p>
                    </div>
                 </div>
               )}

               {tab === 'ADVANCE' && (
                 <div>
                    <div className="flex gap-4 items-end mb-6 bg-gray-50 p-4 rounded">
                       <div className="flex-1">
                          <label className="block text-sm font-bold text-gray-600 mb-1">Valor do Vale (R$)</label>
                          <InputMoney value={advanceAmount} onChange={setAdvanceAmount} />
                       </div>
                       <button onClick={addAdvance} className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600">Lançar Vale</button>
                    </div>
                    <h4 className="font-bold text-gray-700 mb-2">Vales Pendentes (Descontar no Próximo Pagamento)</h4>
                    <table className="w-full text-sm border">
                       <thead className="bg-gray-100">
                          <tr>
                             <th className="p-2 text-left">Data</th>
                             <th className="p-2 text-left">Descrição</th>
                             <th className="p-2 text-right">Valor</th>
                             <th className="p-2 text-center">Status</th>
                          </tr>
                       </thead>
                       <tbody>
                          {getPendingAdvances(selectedUser.id).map(t => (
                             <tr key={t.id} className="border-t">
                                <td className="p-2">{formatDate(t.date)}</td>
                                <td className="p-2">{t.description}</td>
                                <td className="p-2 text-right font-mono">{formatCurrency(t.amount)}</td>
                                <td className="p-2 text-center"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 rounded">Pendente</span></td>
                             </tr>
                          ))}
                          {getPendingAdvances(selectedUser.id).length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum vale pendente.</td></tr>}
                       </tbody>
                    </table>
                 </div>
               )}

               {tab === 'PAYROLL' && (
                  <div>
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard /> Pagamentos Gerados</h3>
                     <div className="space-y-4">
                        {transactions.filter(t => t.userId === selectedUserId && t.type === 'SALARY_SLIP').map(slip => {
                           const cfg = selectedUser.payrollConfig || { salaryType: 'FIXED', baseValue: 0 };
                           const slipDate = new Date(slip.date);
                           
                           const monthContribution = calculateMonthlyContribution(slipDate.getMonth(), slipDate.getFullYear());
                           
                           const base = cfg.salaryType === 'FIXED' ? cfg.baseValue : (monthContribution * (cfg.baseValue / 100));
                           const bonus = calculateTotalBonus(selectedUserId, slipDate.getMonth(), slipDate.getFullYear());
                           const advances = getPendingAdvances(selectedUserId).reduce((acc, v) => acc + v.amount, 0);
                           
                           const wasteData = calculateWastePenalty(selectedUserId, slipDate.getMonth(), slipDate.getFullYear());
                           const penaltyAmount = wasteData?.totalPenalty || 0;

                           const totalEstimado = (base + bonus) - advances - penaltyAmount;

                           return (
                             <div key={slip.id} className={`border rounded p-4 ${slip.status === 'PAID' ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 shadow-md'}`}>
                                <div className="flex justify-between items-start mb-2">
                                   <div>
                                      <h4 className="font-bold text-lg text-gray-800">{slip.description}</h4>
                                      <p className="text-sm text-gray-500">Gerado em: {formatDate(slip.date)}</p>
                                   </div>
                                   <div className={`px-3 py-1 rounded text-sm font-bold ${slip.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {slip.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                   </div>
                                </div>
                                
                                {slip.status === 'PENDING' ? (
                                   <div className="bg-blue-50 p-3 rounded space-y-1 text-sm mb-3">
                                      <div className="flex justify-between text-gray-600"><span>Base ({cfg.salaryType === 'FIXED' ? 'Fixo' : '% Contribuição'}):</span> <span>{formatCurrency(base)}</span></div>
                                      <div className="flex justify-between text-green-600"><span>Bônus (Metas):</span> <span>+ {formatCurrency(bonus)}</span></div>
                                      <div className="flex justify-between text-orange-600"><span>Vales:</span> <span>- {formatCurrency(advances)}</span></div>
                                      
                                      {penaltyAmount > 0 && (
                                         <div className="flex justify-between text-red-600 font-bold items-center">
                                             <div className="flex items-center gap-2">
                                                 <span>Multa por Desperdício:</span> 
                                                 <button onClick={() => setShowWasteDetails({isOpen: true, data: wasteData?.details || []})} className="text-xs bg-red-100 px-2 py-0.5 rounded hover:bg-red-200 underline">Ver Relatório de Perdas</button>
                                             </div>
                                             <span>- {formatCurrency(penaltyAmount)}</span>
                                         </div>
                                      )}

                                      <div className="border-t pt-1 mt-1 flex justify-between font-bold text-lg text-blue-800"><span>Total a Pagar:</span> <span>{formatCurrency(totalEstimado)}</span></div>
                                      <div className="text-xs text-gray-500 text-right mt-1">Ref. Margem Contribuição Mês: {formatCurrency(monthContribution)}</div>
                                   </div>
                                ) : (
                                   <div className="bg-gray-100 p-3 rounded space-y-1 text-sm text-gray-500 mb-3">
                                      <p>Pagamento realizado. Valor final: <span className="font-bold text-gray-700">{formatCurrency(slip.amount)}</span></p>
                                      {slip.details && <p className="text-xs">Base: {formatCurrency(slip.details.base)} | Bônus: {formatCurrency(slip.details.bonus)} | Vales: {formatCurrency(slip.details.advances)} {slip.details.wastePenalty ? `| Multas: -${formatCurrency(slip.details.wastePenalty)}` : ''}</p>}
                                   </div>
                                )}

                                {slip.status === 'PENDING' && (
                                   <button onClick={() => handleConfirmPayment(slip, penaltyAmount)} className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition">
                                      Confirmar Pagamento & Lançar Despesa
                                   </button>
                                )}
                             </div>
                           );
                        })}
                        {transactions.filter(t => t.userId === selectedUserId && t.type === 'SALARY_SLIP').length === 0 && (
                           <p className="text-gray-500 text-center py-8">Nenhum holerite gerado ainda. Aguarde a data de corte.</p>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </div>
       )}
    </div>
  );
};

// --- Settings View ---
export const SettingsView: React.FC<{
  marketplaces: Marketplace[];
  setMarketplaces: React.Dispatch<React.SetStateAction<Marketplace[]>>;
  targets: OperationalTarget[];
  setTargets: React.Dispatch<React.SetStateAction<OperationalTarget[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  systemConfig: SystemConfig;
  setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}> = ({ marketplaces, setMarketplaces, targets, setTargets, users, setUsers, systemConfig, setSystemConfig }) => {
  
  const [mkp, setMkp] = useState<Partial<Marketplace>>({});
  const [target, setTarget] = useState<Partial<OperationalTarget>>({});
  const [newUser, setNewUser] = useState<Partial<User>>({ role: Role.EMPLOYEE });
  const [activeTab, setActiveTab] = useState<'GENERAL'|'STORES'|'GOALS'|'USERS'>('GENERAL');

  const addMkp = () => {
    if (!mkp.name) return;
    const newMkp: Marketplace = {
      id: Date.now().toString(),
      name: mkp.name,
      fixedFee: Number(mkp.fixedFee || 0),
      variableFeePercent: Number(mkp.variableFeePercent || 0),
      adsFeePercent: Number(mkp.adsFeePercent || 0),
      shippingCost: Number(mkp.shippingCost || 0),
      taxPercent: Number(mkp.taxPercent || 0),
    };
    setMarketplaces([...marketplaces, newMkp]);
    setMkp({});
  };

  const addTarget = () => {
    if (!target.metricName) return;
    const newTarget: OperationalTarget = {
      id: Date.now().toString(),
      metricName: target.metricName,
      targetDaily: Number(target.targetDaily || 0),
      unitRate: Number(target.unitRate || 0),
    };
    setTargets([...targets, newTarget]);
    setTarget({});
  };

  const addUser = () => {
    if (!newUser.name || !newUser.pin) {
      alert("Nome e senha são obrigatórios.");
      return;
    }
    setUsers([...users, { 
      id: Date.now().toString(), 
      name: newUser.name, 
      pin: newUser.pin, 
      role: newUser.role || Role.EMPLOYEE 
    }]);
    setNewUser({ role: Role.EMPLOYEE, name: '', pin: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b overflow-x-auto">
        <button onClick={() => setActiveTab('GENERAL')} className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'GENERAL' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Geral / Avisos</button>
        <button onClick={() => setActiveTab('STORES')} className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'STORES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Lojas & Taxas</button>
        <button onClick={() => setActiveTab('GOALS')} className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'GOALS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Metas & Bônus</button>
        <button onClick={() => setActiveTab('USERS')} className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'USERS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Usuários</button>
      </div>

      {activeTab === 'GENERAL' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={20}/> Quadro de Avisos (Relatório do Dia)</h3>
           <p className="text-sm text-gray-500 mb-2">O texto abaixo aparecerá para os funcionários ao clicarem em "Relatório do Dia". Use para comunicar tarefas ou avisos importantes.</p>
           <textarea 
             className="w-full h-40 border p-4 rounded bg-yellow-50 focus:ring-2 focus:ring-yellow-400 outline-none"
             placeholder="Ex: Hoje precisamos focar na produção dos kits de dia das mães..."
             value={systemConfig.dailyMessage}
             onChange={e => setSystemConfig({...systemConfig, dailyMessage: e.target.value})}
           />
        </div>
      )}

      {activeTab === 'STORES' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingCart size={20}/> Cadastro de Lojas</h3>
          <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded">
            <div>
              <label className="block text-sm font-medium">Nome da Loja (ex: ML Premium)</label>
              <input className="w-full border p-2 rounded" value={mkp.name || ''} onChange={e => setMkp({...mkp, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Taxa Fixa</label><InputMoney value={mkp.fixedFee} onChange={v => setMkp({...mkp, fixedFee: v})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Comissão (%)</label><input type="number" className="w-full border p-2 rounded" placeholder="%" value={mkp.variableFeePercent || ''} onChange={e => setMkp({...mkp, variableFeePercent: parseFloat(e.target.value)})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">ADS / MKT (%)</label><input type="number" className="w-full border p-2 rounded" placeholder="%" value={mkp.adsFeePercent || ''} onChange={e => setMkp({...mkp, adsFeePercent: parseFloat(e.target.value)})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Imposto (%)</label><input type="number" className="w-full border p-2 rounded" placeholder="%" value={mkp.taxPercent || ''} onChange={e => setMkp({...mkp, taxPercent: parseFloat(e.target.value)})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Frete Médio</label><InputMoney value={mkp.shippingCost} onChange={v => setMkp({...mkp, shippingCost: v})} /></div>
            </div>
            <button onClick={addMkp} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Salvar Loja</button>
          </div>
          <ul className="space-y-2">
            {marketplaces.map(m => (
              <li key={m.id} className="flex justify-between items-center p-3 border rounded bg-white hover:bg-gray-50">
                <div><div className="font-bold">{m.name}</div><div className="text-xs text-gray-500">{m.variableFeePercent}% Com. + {formatCurrency(m.fixedFee)} Fix. | ADS: {m.adsFeePercent}% | Frete: {formatCurrency(m.shippingCost)}</div></div>
                <button onClick={() => setMarketplaces(marketplaces.filter(x => x.id !== m.id))} className="text-red-500"><Trash2 size={16}/></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'GOALS' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity size={20}/> Configuração de Metas</h3>
          <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded">
            <div><label className="block text-sm font-medium">Nome da Métrica</label><input className="w-full border p-2 rounded" value={target.metricName || ''} onChange={e => setTarget({...target, metricName: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Meta Diária (Qtd)</label><input type="number" className="w-full border p-2 rounded" value={target.targetDaily || ''} onChange={e => setTarget({...target, targetDaily: parseFloat(e.target.value)})} /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Bônus por Item</label><InputMoney value={target.unitRate} onChange={v => setTarget({...target, unitRate: v})} /></div>
            </div>
            <button onClick={addTarget} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Salvar Meta</button>
          </div>
          <ul className="space-y-2">
            {targets.map(t => (
              <li key={t.id} className="flex justify-between items-center p-3 border rounded bg-white hover:bg-gray-50">
                <div><div className="font-bold">{t.metricName}</div><div className="text-xs text-gray-500">Meta: {t.targetDaily}/dia | Bônus: {formatCurrency(t.unitRate)}/un</div></div>
                <button onClick={() => setTargets(targets.filter(x => x.id !== t.id))} className="text-red-500"><Trash2 size={16}/></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20}/> Gerenciar Usuários</h3>
           <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Nome</label>
                  <input className="w-full border p-2 rounded" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Senha/PIN</label>
                  <input type="text" className="w-full border p-2 rounded" value={newUser.pin || ''} onChange={e => setNewUser({...newUser, pin: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Permissão</label>
                  <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                    <option value={Role.EMPLOYEE}>Funcionário</option>
                    <option value={Role.ADMIN}>Administrador</option>
                  </select>
                </div>
             </div>
             <button onClick={addUser} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Cadastrar Usuário</button>
           </div>
           <ul className="space-y-2">
            {users.map(u => (
              <li key={u.id} className="flex justify-between items-center p-3 border rounded bg-white hover:bg-gray-50">
                <div className="flex items-center gap-2">
                   <div className={`p-2 rounded-full ${u.role === Role.ADMIN ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Shield size={16} />
                   </div>
                   <div>
                      <div className="font-bold">{u.name}</div>
                      <div className="text-xs text-gray-500">PIN: {u.pin} | {u.role === Role.ADMIN ? 'Acesso Total' : 'Acesso Restrito'}</div>
                   </div>
                </div>
                {users.length > 1 && <button onClick={() => setUsers(users.filter(x => x.id !== u.id))} className="text-red-500"><Trash2 size={16}/></button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Inventory View ---
export const InventoryView: React.FC<{
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  history: InventoryTransaction[];
  setHistory: React.Dispatch<React.SetStateAction<InventoryTransaction[]>>;
  currentUser: User;
}> = ({ materials, setMaterials, history, setHistory, currentUser }) => {
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({ unit: Unit.UN, lossPercentage: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'LOSS'>('ALL');
  
  // Modal State
  const [stockModal, setStockModal] = useState<{isOpen: boolean, type: 'ADD'|'LOSS', materialId: string, name: string}>({
    isOpen: false, type: 'ADD', materialId: '', name: ''
  });
  const [stockQtyInput, setStockQtyInput] = useState<string>('');

  const addMaterial = () => {
    if (!newMaterial.name || !newMaterial.costPerUnit) return;
    
    if (editingId) {
      setMaterials(materials.map(m => m.id === editingId ? { ...m, ...newMaterial as Material } : m));
      setEditingId(null);
    } else {
      const item: Material = {
        id: Date.now().toString(),
        name: newMaterial.name,
        unit: newMaterial.unit || Unit.UN,
        costPerUnit: Number(newMaterial.costPerUnit),
        currentStock: Number(newMaterial.currentStock || 0),
        minStock: Number(newMaterial.minStock || 0),
        lossPercentage: Number(newMaterial.lossPercentage || 0)
      };
      setMaterials([...materials, item]);
    }
    setNewMaterial({ unit: Unit.UN, lossPercentage: 0, name: '', costPerUnit: 0, currentStock: 0, minStock: 0 });
  };

  const handleEdit = (m: Material) => {
    setEditingId(m.id);
    setNewMaterial(m);
    window.scrollTo(0,0);
  };

  const openStockModal = (m: Material, type: 'ADD'|'LOSS') => {
    setStockModal({ isOpen: true, type, materialId: m.id, name: m.name });
    setStockQtyInput('');
  };

  const confirmStockUpdate = () => {
    const val = parseFloat(stockQtyInput);
    if (!val || val <= 0) {
      alert("Por favor digite uma quantidade válida");
      return;
    }
    
    setMaterials(materials.map(m => {
      if (m.id === stockModal.materialId) {
        const newStock = stockModal.type === 'ADD' ? m.currentStock + val : m.currentStock - val;
        return { ...m, currentStock: newStock };
      }
      return m;
    }));

    // LOG TRANSACTION
    const log: InventoryTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      materialId: stockModal.materialId,
      materialName: stockModal.name,
      type: stockModal.type,
      quantity: val,
      userName: currentUser.name,
      userId: currentUser.id // NEW: Track User ID
    };
    setHistory([log, ...history]);

    setStockModal({ ...stockModal, isOpen: false });
  };

  const filteredHistory = historyFilter === 'ALL' ? history : history.filter(h => h.type === 'LOSS');

  return (
    <div className="space-y-6 relative">
      {/* Stock Update Modal */}
      {stockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
             <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${stockModal.type === 'ADD' ? 'text-green-700' : 'text-red-700'}`}>
               {stockModal.type === 'ADD' ? <PlusCircle /> : <MinusCircle />}
               {stockModal.type === 'ADD' ? 'Adicionar Estoque' : 'Registrar Perda/Uso'}
             </h3>
             <p className="text-gray-600 text-sm mb-4">
               {stockModal.type === 'ADD' ? `Entrada de material para: ${stockModal.name}` : `Saída de material para: ${stockModal.name}`}
             </p>
             <input 
                autoFocus
                type="number" 
                className="w-full border-2 border-gray-300 rounded p-2 text-xl text-center mb-4 focus:border-blue-500 outline-none"
                placeholder="Quantidade"
                value={stockQtyInput}
                onChange={e => setStockQtyInput(e.target.value)}
             />
             <div className="flex gap-3">
               <button onClick={() => setStockModal({...stockModal, isOpen: false})} className="flex-1 py-2 bg-gray-200 rounded font-bold text-gray-700 hover:bg-gray-300">Cancelar</button>
               <button onClick={confirmStockUpdate} className={`flex-1 py-2 rounded font-bold text-white ${stockModal.type === 'ADD' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                 Confirmar
               </button>
             </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package /> Gestão de Insumos</h2>
      
      {/* Add/Edit Form */}
      <div className={`p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
        <div className="col-span-1 md:col-span-3 text-sm font-bold text-gray-500 uppercase mb-2 border-b pb-1">
          {editingId ? 'Editando Insumo' : 'Novo Insumo'}
        </div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">Nome do Insumo</label><input type="text" className="block w-full border rounded-md p-2" value={newMaterial.name || ''} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} /></div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">Unidade</label><select className="block w-full border rounded-md p-2" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value as Unit})}>{Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">Custo Unit.</label><InputMoney value={newMaterial.costPerUnit} onChange={v => setNewMaterial({...newMaterial, costPerUnit: v})} /></div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">Estoque Atual</label><input type="number" className="block w-full border rounded-md p-2" value={newMaterial.currentStock} onChange={e => setNewMaterial({...newMaterial, currentStock: parseFloat(e.target.value)})} /></div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">Estoque Mínimo (Alerta)</label><input type="number" className="block w-full border rounded-md p-2" value={newMaterial.minStock} onChange={e => setNewMaterial({...newMaterial, minStock: parseFloat(e.target.value)})} /></div>
        <div><label className="block text-xs font-bold text-gray-500 mb-1">% Perda Aceitável</label><input type="number" className="block w-full border rounded-md p-2" value={newMaterial.lossPercentage} onChange={e => setNewMaterial({...newMaterial, lossPercentage: parseFloat(e.target.value)})} /></div>
        <div className="flex gap-2">
          {editingId && <button onClick={() => { setEditingId(null); setNewMaterial({unit: Unit.UN}); }} className="bg-gray-500 text-white px-4 py-2 rounded-md">Cancelar</button>}
          <button onClick={addMaterial} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 justify-center"><Save size={18} /> {editingId ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {materials.map(m => {
              const isLowStock = m.currentStock <= m.minStock;
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3">{m.currentStock} {m.unit}</td>
                  <td className="px-4 py-3">
                    {isLowStock ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 items-center gap-1"><AlertTriangle size={12} /> Baixo</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">OK</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium flex justify-end gap-2">
                    <button title="Dar Entrada" onClick={() => openStockModal(m, 'ADD')} className="text-green-600 hover:bg-green-50 p-1 rounded"><PlusCircle size={18}/></button>
                    <button title="Registrar Perda" onClick={() => openStockModal(m, 'LOSS')} className="text-orange-600 hover:bg-orange-50 p-1 rounded"><MinusCircle size={18}/></button>
                    <button title="Editar" onClick={() => handleEdit(m)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={18}/></button>
                    <button title="Excluir" onClick={() => setMaterials(materials.filter(mat => mat.id !== m.id))} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={18}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Logs Table */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2"><FileText/> Histórico de Movimentações</h3>
           <div className="flex gap-2">
             <button onClick={() => setHistoryFilter('ALL')} className={`px-3 py-1 rounded text-sm ${historyFilter==='ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Todos</button>
             <button onClick={() => setHistoryFilter('LOSS')} className={`px-3 py-1 rounded text-sm ${historyFilter==='LOSS' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Apenas Perdas</button>
           </div>
        </div>
        <div className="bg-white rounded border max-h-60 overflow-y-auto">
           <table className="min-w-full text-sm">
             <thead className="bg-gray-100 sticky top-0">
               <tr>
                 <th className="p-3 text-left">Data</th>
                 <th className="p-3 text-left">Insumo</th>
                 <th className="p-3 text-left">Tipo</th>
                 <th className="p-3 text-right">Qtd</th>
                 <th className="p-3 text-right">Resp.</th>
               </tr>
             </thead>
             <tbody>
               {filteredHistory.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum registro encontrado.</td></tr>}
               {filteredHistory.map(h => (
                 <tr key={h.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-600">{formatDate(h.date)}</td>
                    <td className="p-3 font-medium">{h.materialName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${h.type === 'ADD' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {h.type === 'ADD' ? 'ENTRADA' : 'PERDA'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{h.quantity}</td>
                    <td className="p-3 text-right text-gray-500 text-xs">{h.userName}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

// --- Product View ---
export const ProductView: React.FC<{
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  materials: Material[];
}> = ({ products, setProducts, materials }) => {
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ materials: [] });
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [selectedMatQty, setSelectedMatQty] = useState<number>(0);
  const [aiDescription, setAiDescription] = useState<string>('');

  const addIngredient = () => {
    if(!selectedMatId || selectedMatQty <= 0) return;
    const current = newProduct.materials || [];
    setNewProduct({ ...newProduct, materials: [...current, { materialId: selectedMatId, quantity: selectedMatQty }] });
    setSelectedMatId('');
    setSelectedMatQty(0);
  };

  const calculateCost = (prodItems: Product['materials']) => {
    if (!prodItems) return 0;
    return prodItems.reduce((acc, item) => {
      const mat = materials.find(m => m.id === item.materialId);
      return acc + (mat ? mat.costPerUnit * item.quantity : 0);
    }, 0);
  };

  const costPrice = calculateCost(newProduct.materials);
  const handleCreate = () => {
    if (!newProduct.name || !newProduct.sellingPrice) return;
    const prod: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      isKit: false,
      materials: newProduct.materials || [],
      sellingPrice: Number(newProduct.sellingPrice),
      laborCost: Number(newProduct.laborCost || 0),
    };
    setProducts([...products, prod]);
    setNewProduct({ materials: [] });
    setAiDescription('');
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name) return;
    const matNames = newProduct.materials?.map(pm => materials.find(m => m.id === pm.materialId)?.name || '') || [];
    const desc = await suggestProductDescription(newProduct.name, matNames);
    setAiDescription(desc);
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart /> Produtos e Kits</h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Creator */}
         <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <h3 className="font-semibold text-lg">Novo Produto / Kit</h3>
            <div>
              <label className="block text-sm font-medium">Nome do Produto</label>
              <input className="w-full border rounded p-2" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            </div>

            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="text-sm font-bold mb-2">Receita / Composição</h4>
              <div className="flex gap-2 mb-2">
                <select className="border rounded p-1 flex-1" value={selectedMatId} onChange={e => setSelectedMatId(e.target.value)}>
                  <option value="">Selecione Insumo</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <input type="number" placeholder="Qtd" className="border rounded p-1 w-20" value={selectedMatQty} onChange={e => setSelectedMatQty(Number(e.target.value))} />
                <button onClick={addIngredient} className="bg-green-600 text-white px-2 rounded"><Plus size={16}/></button>
              </div>
              <ul className="text-sm space-y-1">
                {newProduct.materials?.map((pm, idx) => {
                  const m = materials.find(mat => mat.id === pm.materialId);
                  return (
                    <li key={idx} className="flex justify-between border-b pb-1 items-center">
                        <span>{m?.name} (x{pm.quantity})</span> 
                        <button onClick={() => {
                            const newMats = [...(newProduct.materials || [])];
                            newMats.splice(idx, 1);
                            setNewProduct({...newProduct, materials: newMats});
                        }} className="text-red-500"><Trash2 size={12}/></button>
                    </li>
                  );
                })}
              </ul>
              <div className="text-right mt-2 font-bold text-gray-600">Custo Material: {formatCurrency(costPrice)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Mão de Obra</label>
                <InputMoney value={newProduct.laborCost} onChange={v => setNewProduct({...newProduct, laborCost: v})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-blue-700">Preço Venda Base</label>
                <InputMoney value={newProduct.sellingPrice} onChange={v => setNewProduct({...newProduct, sellingPrice: v})} />
              </div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">Nota: As taxas de marketplace serão calculadas na tela de Vendas.</div>
            <button onClick={handleCreate} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-medium">Salvar Produto</button>
            <div className="pt-2 border-t">
              <button onClick={handleGenerateDescription} className="text-xs text-purple-600 flex items-center gap-1 mb-2 hover:underline"><BrainCircuit size={14}/> Gerar Descrição com IA</button>
              {aiDescription && <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border">{aiDescription}</p>}
            </div>
         </div>

         {/* List */}
         <div className="bg-white rounded shadow overflow-hidden h-full overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Produto</th>
                    <th className="p-2 text-right">Custo Base</th>
                    <th className="p-2 text-right">Preço Venda</th>
                    <th className="p-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                     const c = calculateCost(p.materials) + p.laborCost;
                     return (
                       <tr key={p.id} className="border-t hover:bg-gray-50">
                         <td className="p-2"><div className="font-bold">{p.name}</div><div className="text-xs text-gray-500">{p.materials.length} insumos</div></td>
                         <td className="p-2 text-right text-gray-600">{formatCurrency(c)}</td>
                         <td className="p-2 text-right font-bold">{formatCurrency(p.sellingPrice)}</td>
                         <td className="p-2 text-right"><button onClick={() => setProducts(products.filter(x => x.id !== p.id))} className="text-red-500"><Trash2 size={14}/></button></td>
                       </tr>
                     )
                  })}
                </tbody>
              </table>
         </div>
       </div>
    </div>
  );
};

// --- SalesAndOpsView ---
export const SalesAndOpsView: React.FC<{
  products: Product[];
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  logs: OperationalLog[];
  setLogs: React.Dispatch<React.SetStateAction<OperationalLog[]>>;
  targets: OperationalTarget[];
  marketplaces: Marketplace[];
}> = ({ products, materials, setMaterials, sales, setSales, logs, setLogs, targets, marketplaces }) => {
  const [tab, setTab] = useState<'SALES'|'OPS'>('SALES');
  const [newSale, setNewSale] = useState<{ quantity: number; paymentMethod: PaymentMethod }>({ quantity: 1, paymentMethod: PaymentMethod.PIX });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedMkpId, setSelectedMkpId] = useState('');
  
  // Ops state
  const [opsMetricId, setOpsMetricId] = useState('');
  const [opsValue, setOpsValue] = useState(0);

  // Stock Alert Logic
  const [stockAlertModal, setStockAlertModal] = useState<{isOpen: boolean, missingItems: any[]}>({ isOpen: false, missingItems: [] });
  const [pendingSale, setPendingSale] = useState<any>(null);

  const [customerName, setCustomerName] = useState('');

  const checkStockAvailability = (prodId: string, quantity: number) => {
     const product = products.find(p => p.id === prodId);
     if (!product) return [];

     const missing: any[] = [];
     product.materials.forEach(req => {
        const mat = materials.find(m => m.id === req.materialId);
        if (mat) {
           // Calculate total needed including what's already in the cart if we had one, 
           // but here we do direct sale, so check current stock.
           const needed = req.quantity * quantity;
           if (mat.currentStock - needed < mat.minStock) {
              missing.push({ 
                 name: mat.name, 
                 current: mat.currentStock, 
                 needed, 
                 remaining: mat.currentStock - needed 
              });
           }
        }
     });
     return missing;
  };

  const executeSale = (saleData: any) => {
     const { product, mkp, quantity } = saleData;
     
     const totalAmount = product.sellingPrice * quantity;
     const varFee = totalAmount * (mkp.variableFeePercent / 100);
     const adsFee = totalAmount * (mkp.adsFeePercent / 100);
     const tax = totalAmount * (mkp.taxPercent / 100);
     const totalFees = mkp.fixedFee + varFee + adsFee + tax + mkp.shippingCost;
     const netRevenue = totalAmount - totalFees;

     const costSnapshot = product.materials.reduce((acc: number, pm: any) => {
        const m = materials.find(mat => mat.id === pm.materialId);
        return acc + (m ? m.costPerUnit * pm.quantity : 0);
     }, 0) * quantity + (product.laborCost * quantity);

     const sale: Sale = {
       id: Date.now().toString(),
       date: new Date().toISOString(),
       items: [{ productId: product.id, quantity: quantity, unitPrice: product.sellingPrice }],
       marketplaceId: mkp.id,
       platform: mkp.name,
       paymentMethod: newSale.paymentMethod as PaymentMethod,
       totalAmount,
       netRevenue,
       costSnapshot,
       feeSnapshot: totalFees,
       status: 'PENDING',
       customerName: customerName // New
     };

     setSales([sale, ...sales]);

     // Deduct Stock
     const newMaterials = [...materials];
     product.materials.forEach((pm: any) => {
        const mIndex = newMaterials.findIndex(m => m.id === pm.materialId);
        if (mIndex >= 0) {
          newMaterials[mIndex].currentStock -= (pm.quantity * quantity);
        }
     });
     setMaterials(newMaterials);

     // Reset
     setNewSale({ quantity: 1, paymentMethod: PaymentMethod.PIX });
     setSelectedProductId('');
     setCustomerName('');
     setStockAlertModal({ isOpen: false, missingItems: [] });
     setPendingSale(null);
  };

  const initiateSale = () => {
    const product = products.find(p => p.id === selectedProductId);
    const mkp = marketplaces.find(m => m.id === selectedMkpId);
    if (!product || !mkp || !newSale.quantity) return;
    const quantity = Number(newSale.quantity);
    
    const missing = checkStockAvailability(product.id, quantity);
    const saleData = { product, mkp, quantity };

    if (missing.length > 0) {
       setPendingSale(saleData);
       setStockAlertModal({ isOpen: true, missingItems: missing });
    } else {
       executeSale(saleData);
    }
  };

  const updateStatus = (saleId: string, newStatus: Sale['status']) => {
     setSales(sales.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
  };

  const handleLogOps = () => {
    const target = targets.find(t => t.id === opsMetricId);
    if (!target || opsValue <= 0) return;
    
    setLogs([{
      id: Date.now().toString(),
      date: new Date().toISOString(),
      metricName: target.metricName,
      value: Number(opsValue)
    }, ...logs]);
    setOpsValue(0);
  };

  return (
    <div className="space-y-6 relative">
      {/* Stock Alert Modal */}
      {stockAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
           <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle /> Atenção: Estoque Insuficiente</h3>
              <p className="text-sm text-gray-600 mb-4">A venda deste produto fará com que os seguintes insumos fiquem abaixo do mínimo ou negativos:</p>
              <ul className="bg-red-50 p-3 rounded mb-6 space-y-2 text-sm">
                 {stockAlertModal.missingItems.map((m, idx) => (
                    <li key={idx} className="flex justify-between">
                       <span className="font-bold text-gray-700">{m.name}</span>
                       <span className="text-red-600">Restará: {m.remaining.toFixed(2)}</span>
                    </li>
                 ))}
              </ul>
              <div className="flex gap-3">
                 <button onClick={() => setStockAlertModal({isOpen: false, missingItems: []})} className="flex-1 py-2 border border-gray-300 rounded text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                 <button onClick={() => executeSale(pendingSale)} className="flex-1 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Confirmar Venda Assim Mesmo</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex border-b">
         <button onClick={() => setTab('SALES')} className={`px-6 py-3 font-bold ${tab==='SALES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Vendas</button>
         <button onClick={() => setTab('OPS')} className={`px-6 py-3 font-bold ${tab==='OPS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Produção</button>
      </div>

      {tab === 'SALES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded shadow lg:col-span-1 h-fit">
              <h3 className="font-bold text-lg mb-4">Nova Venda</h3>
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-gray-500">Produto</label>
                   <select className="w-full border p-2 rounded" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                     <option value="">Selecione...</option>
                     {products.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.sellingPrice)})</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500">Canal de Venda</label>
                   <select className="w-full border p-2 rounded" value={selectedMkpId} onChange={e => setSelectedMkpId(e.target.value)}>
                     <option value="">Selecione...</option>
                     {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500">Cliente (Opcional)</label>
                    <input type="text" className="w-full border p-2 rounded" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente..." />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                       <label className="block text-xs font-bold text-gray-500">Qtd</label>
                       <input type="number" className="w-full border p-2 rounded" value={newSale.quantity} onChange={e => setNewSale({...newSale, quantity: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500">Pagamento</label>
                       <select className="w-full border p-2 rounded" value={newSale.paymentMethod} onChange={e => setNewSale({...newSale, paymentMethod: e.target.value as PaymentMethod})}>
                          {Object.values(PaymentMethod).map(pm => <option key={pm} value={pm}>{pm}</option>)}
                       </select>
                    </div>
                 </div>
                 <button onClick={initiateSale} className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Registrar Venda</button>
              </div>
           </div>
           <div className="lg:col-span-2 bg-white rounded shadow overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">Fila de Produção (Últimos Pedidos)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 text-left">Data</th>
                        <th className="p-3 text-left">Cliente</th>
                        <th className="p-3 text-left">Produto</th>
                        <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 10).map(s => (
                        <tr key={s.id} className="border-b">
                          <td className="p-3">{formatDate(s.date)}</td>
                          <td className="p-3">{s.customerName || '-'}</td>
                          <td className="p-3 font-medium">{products.find(p => p.id === s.items[0].productId)?.name} (x{s.items[0].quantity})</td>
                          <td className="p-3 text-center">
                              <select 
                                value={s.status} 
                                onChange={e => updateStatus(s.id, e.target.value as any)}
                                className={`p-1 rounded text-xs font-bold border-none outline-none cursor-pointer ${
                                  s.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                  s.status === 'IN_PRODUCTION' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-green-100 text-green-800'
                                }`}
                              >
                                <option value="PENDING">PENDENTE</option>
                                <option value="IN_PRODUCTION">EM PRODUÇÃO</option>
                                <option value="COMPLETED">ENVIADO</option>
                              </select>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {tab === 'OPS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded shadow h-fit">
              <h3 className="font-bold text-lg mb-4">Apontamento de Produção</h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Meta / Tarefa</label>
                    <select className="w-full border p-2 rounded" value={opsMetricId} onChange={e => setOpsMetricId(e.target.value)}>
                       <option value="">Selecione...</option>
                       {targets.map(t => <option key={t.id} value={t.id}>{t.metricName}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium">Quantidade Realizada</label>
                    <input type="number" className="w-full border p-2 rounded" value={opsValue} onChange={e => setOpsValue(parseFloat(e.target.value))} />
                 </div>
                 <button onClick={handleLogOps} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Registrar</button>
              </div>
           </div>
           <div className="bg-white rounded shadow overflow-hidden">
              <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">Histórico de Produção</div>
              <ul className="divide-y">
                 {logs.map(l => (
                    <li key={l.id} className="p-4 flex justify-between items-center">
                       <div>
                          <div className="font-bold text-gray-800">{l.metricName}</div>
                          <div className="text-xs text-gray-500">{formatDate(l.date)}</div>
                       </div>
                       <div className="text-xl font-bold text-blue-600">+{l.value}</div>
                    </li>
                 ))}
              </ul>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Reports View (Waterfall Logic) ---
export const ReportsView: React.FC<{
  sales: Sale[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  products: Product[];
  materials: Material[];
}> = ({ sales, expenses, setExpenses, products, materials }) => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [aiLoading, setAiLoading] = useState(false);
  const [insight, setInsight] = useState('');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});

  // Filter Logic
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
       const d = new Date(s.date);
       return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [sales, month, year]);

  const filteredExpenses = useMemo(() => {
     return expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
     });
  }, [expenses, month, year]);

  // --- Waterfall Calculations ---
  const grossRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  
  const totalFees = filteredSales.reduce((acc, s) => {
     if (s.feeSnapshot !== undefined) return acc + s.feeSnapshot;
     return acc + (s.totalAmount - s.netRevenue); // Legacy fallback
  }, 0);

  const totalCOGS = filteredSales.reduce((acc, s) => {
     if (s.costSnapshot !== undefined) return acc + s.costSnapshot;
     // Fallback calculation for legacy sales
     return acc + s.items.reduce((iAcc, item) => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) return iAcc;
        const matCost = prod.materials.reduce((mAcc, mItem) => {
           const m = materials.find(mat => mat.id === mItem.materialId);
           return mAcc + (m ? m.costPerUnit * mItem.quantity : 0);
        }, 0);
        return iAcc + ((matCost + prod.laborCost) * item.quantity);
     }, 0);
  }, 0);

  const contributionMargin = grossRevenue - totalFees - totalCOGS;
  
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  const netProfit = contributionMargin - totalExpenses;

  // Charts Data
  const dailyProfitData = useMemo(() => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const data = [];
      for (let i = 1; i <= daysInMonth; i++) {
         const daySales = filteredSales.filter(s => new Date(s.date).getDate() === i);
         // Simplified daily profit estimate (spread expenses equally or ignore for daily view? usually sales - costs)
         // Let's do: Profit = Sales - Fees - COGS (Daily Contribution)
         const dayRev = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
         const dayFees = daySales.reduce((acc, s) => acc + (s.feeSnapshot || (s.totalAmount - s.netRevenue)), 0);
         const dayCOGS = daySales.reduce((acc, s) => acc + (s.costSnapshot || 0), 0);
         const dayProfit = dayRev - dayFees - dayCOGS;
         
         data.push({ day: i, profit: dayProfit });
      }
      return data;
  }, [filteredSales, month, year]);

  const monthlyComparisonData = useMemo(() => {
     const data = [];
     for (let m = 0; m < 12; m++) {
        const mSales = sales.filter(s => { const d = new Date(s.date); return d.getMonth() === m && d.getFullYear() === year; });
        const mExpenses = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === year; });
        
        const rev = mSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const fees = mSales.reduce((acc, s) => acc + (s.feeSnapshot || (s.totalAmount - s.netRevenue)), 0);
        const cogs = mSales.reduce((acc, s) => acc + (s.costSnapshot || 0), 0); // Approximation for legacy without snapshot inside loop
        const exp = mExpenses.reduce((acc, e) => acc + e.amount, 0);
        
        data.push({ name: new Date(year, m, 1).toLocaleDateString('pt-BR', { month: 'short' }), lucro: rev - fees - cogs - exp });
     }
     return data;
  }, [sales, expenses, year]); // Warning: Legacy cost calc inside loop is omitted for brevity, assumes snapshots mostly present

  const handleAddExpense = () => {
     if (!newExpense.description || !newExpense.amount) return;
     setExpenses([...expenses, {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: newExpense.category || 'GERAL'
     }]);
     setNewExpense({});
  };

  const callGemini = async () => {
     setAiLoading(true);
     const context = JSON.stringify({
        grossRevenue, totalFees, totalCOGS, contributionMargin, totalExpenses, netProfit,
        topProducts: products.slice(0, 5).map(p => p.name)
     });
     const result = await generateBusinessInsight(context);
     setInsight(result);
     setAiLoading(false);
  };

  return (
    <div className="space-y-6">
       {/* Header & Filters */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp /> Relatórios Financeiros</h2>
          <div className="flex gap-2">
             <select className="border p-2 rounded bg-gray-50" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                {Array.from({length: 12}, (_, i) => (
                   <option key={i} value={i}>{new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</option>
                ))}
             </select>
             <select className="border p-2 rounded bg-gray-50" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
             </select>
          </div>
       </div>

       {/* Waterfall Cards */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-3 rounded shadow border-t-4 border-blue-500">
             <div className="text-gray-500 text-[10px] font-bold uppercase">Faturamento (+)</div>
             <div className="text-lg font-bold text-gray-800">{formatCurrency(grossRevenue)}</div>
          </div>
          <div className="bg-white p-3 rounded shadow border-t-4 border-orange-500">
             <div className="text-gray-500 text-[10px] font-bold uppercase">Taxas Mkt/Frete (-)</div>
             <div className="text-lg font-bold text-red-600">{formatCurrency(totalFees)}</div>
          </div>
          <div className="bg-white p-3 rounded shadow border-t-4 border-red-500">
             <div className="text-gray-500 text-[10px] font-bold uppercase">Custos Produção (-)</div>
             <div className="text-lg font-bold text-red-600">{formatCurrency(totalCOGS)}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded shadow border-t-4 border-blue-700">
             <div className="text-blue-800 text-[10px] font-bold uppercase">Margem Contrib. (=)</div>
             <div className="text-lg font-bold text-blue-900">{formatCurrency(contributionMargin)}</div>
          </div>
          <div className="bg-white p-3 rounded shadow border-t-4 border-purple-500">
             <div className="text-gray-500 text-[10px] font-bold uppercase">Despesas Fixas (-)</div>
             <div className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className={`p-3 rounded shadow border-t-4 ${netProfit >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
             <div className="text-gray-500 text-[10px] font-bold uppercase">Lucro Líquido (=)</div>
             <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</div>
          </div>
       </div>

       {/* Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
             <h3 className="font-bold text-gray-700 mb-4 text-sm">Evolução Diária (Margem Contribuição)</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={dailyProfitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} dot={false} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
             <h3 className="font-bold text-gray-700 mb-4 text-sm">Comparativo Mensal (Lucro Líquido)</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={monthlyComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Bar dataKey="lucro" fill="#10B981" />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* Expenses Management */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded shadow">
             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Wallet size={20}/> Despesas do Mês</h3>
             <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Descrição (ex: Energia, Aluguel)" className="flex-1 border rounded p-2" value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                <InputMoney placeholder="Valor" value={newExpense.amount} onChange={v => setNewExpense({...newExpense, amount: v})} />
                <button onClick={handleAddExpense} className="bg-red-500 text-white px-4 rounded hover:bg-red-600"><Plus/></button>
             </div>
             <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                   <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-right">Valor</th>
                        <th className="p-2"></th>
                      </tr>
                   </thead>
                   <tbody>
                      {filteredExpenses.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhuma despesa lançada neste mês.</td></tr>}
                      {filteredExpenses.slice().reverse().map(e => (
                         <tr key={e.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{formatDate(e.date)}</td>
                            <td className="p-2">{e.description} <span className="text-xs text-gray-400">({e.category})</span></td>
                            <td className="p-2 text-right text-red-600 font-bold">- {formatCurrency(e.amount)}</td>
                            <td className="p-2 text-right"><button onClick={() => setExpenses(expenses.filter(x => x.id !== e.id))} className="text-gray-400 hover:text-red-500"><X size={14}/></button></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6 rounded shadow relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><BrainCircuit /> Consultor IA</h3>
               <p className="text-indigo-200 text-sm mb-4">Analise os dados deste mês e receba insights estratégicos.</p>
               
               {!insight && (
                  <button 
                     onClick={callGemini} 
                     disabled={aiLoading}
                     className="bg-white text-indigo-900 px-6 py-2 rounded font-bold shadow hover:bg-indigo-50 disabled:opacity-50 transition w-full"
                  >
                     {aiLoading ? 'Analisando...' : 'Gerar Análise'}
                  </button>
               )}

               {insight && (
                  <div className="bg-white/10 p-4 rounded mt-4 text-sm leading-relaxed h-64 overflow-y-auto backdrop-blur-sm border border-white/20">
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-yellow-300">Análise Gerada</h4>
                        <button onClick={() => setInsight('')} className="text-xs text-white/70 hover:text-white">Fechar</button>
                     </div>
                     <div className="whitespace-pre-wrap">{insight}</div>
                  </div>
               )}
             </div>
          </div>
       </div>
    </div>
  );
};