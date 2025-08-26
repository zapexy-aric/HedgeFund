import { useAuth } from "@/hooks/useAuth";

interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  depositBalance: string;
  withdrawalBalance: string;
  isAdmin?: boolean;
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  CreditCard, 
  Banknote, 
  PlusCircle, 
  LayoutDashboard,
  Settings,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  MessageSquare,
  Building,
  DollarSign,
} from "lucide-react";

interface AdminUser {
  id: string;
  whatsappNumber: string;
  firstName?: string;
  lastName?: string;
  depositBalance: string;
  withdrawalBalance: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AdminTransactionData {
  transaction: {
    id: string;
    userId: string;
    type: string;
    amount: string;
    status: string;
    utrNumber?: string;
    createdAt: string;
  };
  user: { whatsappNumber: string } | null;
}

interface WithdrawalRequestData {
  withdrawalRequest: {
    id: string;
    userId: string;
    amount: string;
    upiId: string;
    fullName: string;
    status: string;
    createdAt: string;
  };
  user: { whatsappNumber: string } | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface InvestmentPlan {
  id: string;
  name: string;
  dailyPercentage: string;
  minInvestment: string;
  maxInvestment: string;
  durationDays: number;
  isActive: boolean;
  isPopular: boolean;
}

export default function AdminDashboard() {
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const user = authUser as AuthUser | null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [newPlan, setNewPlan] = useState({
    name: "",
    dailyPercentage: "",
    minInvestment: "",
    maxInvestment: "",
    durationDays: "",
    isPopular: false
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    imageUrl: ""
  });
  const [newPartner, setNewPartner] = useState({
    name: "",
    logoUrl: ""
  });
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [settings, setSettings] = useState({
    deposit_qr_code_url: "",
    deposit_upi_id: "",
    telegram_support_url: "",
  });
  const [adjustmentData, setAdjustmentData] = useState({
    userWhatsappNumber: "",
    amount: "",
    type: "admin_credit",
    remarks: "",
  });

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: transactionsData = [] } = useQuery<AdminTransactionData[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: withdrawalRequestsData = [] } = useQuery<WithdrawalRequestData[]>({
    queryKey: ["/api/admin/withdrawal-requests"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: plans = [] } = useQuery<InvestmentPlan[]>({
    queryKey: ["/api/plans"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: settingsData } = useQuery<any[]>({
    queryKey: ["/api/admin/settings"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  useEffect(() => {
    if (settingsData) {
      const newSettings: any = {};
      settingsData.forEach((setting: { key: string, value: string }) => {
        newSettings[setting.key] = setting.value;
      });
      setSettings(newSettings);
    }
  }, [settingsData]);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/approve-withdrawal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      toast({ title: "Success", description: "Withdrawal approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve withdrawal", variant: "destructive" });
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/reject-withdrawal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      toast({ title: "Success", description: "Withdrawal rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject withdrawal", variant: "destructive" });
    },
  });

  const approveDepositMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: string }) => {
      await apiRequest("POST", `/api/admin/approve-deposit/${id}`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "Deposit approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve deposit", variant: "destructive" });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      await apiRequest("POST", "/api/admin/create-plan", planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setNewPlan({ name: "", dailyPercentage: "", minInvestment: "", maxInvestment: "", durationDays: "", isPopular: false });
      toast({ title: "Success", description: "Investment plan created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create investment plan", variant: "destructive" });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      await apiRequest("POST", "/api/admin/create-announcement", announcementData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setNewAnnouncement({ title: "", content: "", imageUrl: "" });
      toast({ title: "Success", description: "Announcement created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create announcement", variant: "destructive" });
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: any) => {
      await apiRequest("POST", "/api/admin/create-partner", partnerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setNewPartner({ name: "", logoUrl: "" });
      toast({ title: "Success", description: "Partner created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create partner", variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      await apiRequest("PUT", `/api/admin/update-plan/${editingPlan?.id}`, planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      setEditingPlan(null);
      setNewPlan({ name: "", dailyPercentage: "", minInvestment: "", maxInvestment: "", durationDays: "", isPopular: false });
      toast({ title: "Success", description: "Investment plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update investment plan", variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Success", description: "Announcement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/delete-plan/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Success", description: "Plan deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete plan", variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: { key: string; value: string }[]) => {
      for (const setting of settingsData) {
        await apiRequest("PUT", `/api/admin/settings/${setting.key}`, { value: setting.value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async (data: typeof adjustmentData) => {
      await apiRequest("POST", "/api/admin/adjust-balance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setAdjustmentData({ userWhatsappNumber: "", amount: "", type: "admin_credit", remarks: "" });
      toast({ title: "Success", description: "Balance adjusted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to adjust balance", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.dailyPercentage || !newPlan.minInvestment || !newPlan.maxInvestment || !newPlan.durationDays) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createPlanMutation.mutate({
      ...newPlan,
      durationDays: parseInt(newPlan.durationDays),
      isActive: true,
    });
  };

  const handleUpdatePlan = () => {
    if (!editingPlan || !newPlan.name || !newPlan.dailyPercentage || !newPlan.minInvestment || !newPlan.maxInvestment || !newPlan.durationDays) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    updatePlanMutation.mutate({
      ...newPlan,
      durationDays: parseInt(newPlan.durationDays),
      isActive: true,
    });
  };

  const handleEditPlan = (plan: InvestmentPlan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      dailyPercentage: plan.dailyPercentage,
      minInvestment: plan.minInvestment,
      maxInvestment: plan.maxInvestment,
      durationDays: plan.durationDays.toString(),
      isPopular: plan.isPopular,
    });
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setNewPlan({ name: "", dailyPercentage: "", minInvestment: "", maxInvestment: "", durationDays: "", isPopular: false });
  };

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({ title: "Error", description: "Please fill in title and content", variant: "destructive" });
      return;
    }
    createAnnouncementMutation.mutate({
      ...newAnnouncement,
      isActive: true,
    });
  };

  const handleCreatePartner = () => {
    if (!newPartner.name || !newPartner.logoUrl) {
      toast({ title: "Error", description: "Please fill in name and logo URL", variant: "destructive" });
      return;
    }
    createPartnerMutation.mutate({
      ...newPartner,
      isActive: true,
    });
  };

  const pendingDeposits = transactionsData.filter(t => t.transaction.type === 'deposit' && t.transaction.status === 'pending');
  const pendingWithdrawals = withdrawalRequestsData.filter(w => w.withdrawalRequest.status === 'pending');

  const tabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "deposits", label: "Deposits", icon: CreditCard },
    { id: "withdrawals", label: "Withdrawals", icon: Banknote },
    { id: "plans", label: "Plans", icon: PlusCircle },
    { id: "announcements", label: "Announcements", icon: MessageSquare },
    { id: "partners", label: "Partners", icon: Building },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "balance", label: "Adjust Balance", icon: DollarSign },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              H
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-800">HedgeFund Admin</span>
              <p className="text-sm text-gray-500">Administrative Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Admin: <span className="font-semibold">{user?.firstName || 'Admin'}</span>
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={async () => {
                await fetch('/api/logout', { method: 'POST' });
                window.location.reload();
              }}
              data-testid="button-admin-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <nav className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <div className="p-4 space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`button-admin-tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div data-testid="section-admin-overview">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Overview</h1>
              
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-100" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-secondary to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Pending Deposits</p>
                        <p className="text-2xl font-bold">{pendingDeposits.length}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-green-100" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Pending Withdrawals</p>
                        <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
                      </div>
                      <Banknote className="h-8 w-8 text-orange-100" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Active Plans</p>
                        <p className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</p>
                      </div>
                      <PlusCircle className="h-8 w-8 text-purple-100" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div data-testid="section-admin-users">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
              
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`card-admin-user-${user.id}`}
                      >
                        <div>
                          <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                          <p className="text-sm text-gray-500">{user.whatsappNumber}</p>
                          <p className="text-xs text-gray-400">Joined: {formatDate(user.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Deposit: {formatCurrency(user.depositBalance)}</p>
                          <p className="text-sm">Withdrawal: {formatCurrency(user.withdrawalBalance)}</p>
                          {user.isAdmin && <Badge className="mt-1">Admin</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Deposits Tab */}
          {activeTab === "deposits" && (
            <div data-testid="section-admin-deposits">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Deposit Management</h1>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending Deposits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingDeposits.map((deposit) => (
                      <div 
                        key={deposit.transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`card-admin-deposit-${deposit.transaction.id}`}
                      >
                        <div>
                          <h3 className="font-semibold">{formatCurrency(deposit.transaction.amount)}</h3>
                          <p className="text-sm text-gray-500">User: {deposit.user?.whatsappNumber}</p>
                          <p className="text-sm text-gray-500">UTR: {deposit.transaction.utrNumber}</p>
                          <p className="text-xs text-gray-400">{formatDate(deposit.transaction.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveDepositMutation.mutate({ id: deposit.transaction.id, amount: deposit.transaction.amount })}
                            disabled={approveDepositMutation.isPending}
                            data-testid={`button-approve-deposit-${deposit.transaction.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {pendingDeposits.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No pending deposits</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === "withdrawals" && (
            <div data-testid="section-admin-withdrawals">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Withdrawal Management</h1>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending Withdrawals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div 
                        key={withdrawal.withdrawalRequest.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`card-admin-withdrawal-${withdrawal.withdrawalRequest.id}`}
                      >
                        <div>
                          <h3 className="font-semibold">{formatCurrency(withdrawal.withdrawalRequest.amount)}</h3>
                          <p className="text-sm text-gray-500">User: {withdrawal.user?.whatsappNumber}</p>
                          <p className="text-sm text-gray-500">Name: {withdrawal.withdrawalRequest.fullName}</p>
                          <p className="text-sm text-gray-500">UPI: {withdrawal.withdrawalRequest.upiId}</p>
                          <p className="text-xs text-gray-400">{formatDate(withdrawal.withdrawalRequest.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveWithdrawalMutation.mutate(withdrawal.withdrawalRequest.id)}
                            disabled={approveWithdrawalMutation.isPending}
                            data-testid={`button-approve-withdrawal-${withdrawal.withdrawalRequest.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectWithdrawalMutation.mutate(withdrawal.withdrawalRequest.id)}
                            disabled={rejectWithdrawalMutation.isPending}
                            data-testid={`button-reject-withdrawal-${withdrawal.withdrawalRequest.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {pendingWithdrawals.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No pending withdrawals</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Plans Tab */}
          {activeTab === "plans" && (
            <div data-testid="section-admin-plans">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Investment Plans</h1>
              
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="plan-name">Plan Name</Label>
                      <Input
                        id="plan-name"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter plan name"
                        data-testid="input-plan-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-percentage">Daily Percentage (%)</Label>
                      <Input
                        id="plan-percentage"
                        type="number"
                        step="0.01"
                        value={newPlan.dailyPercentage}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, dailyPercentage: e.target.value }))}
                        placeholder="1.50"
                        data-testid="input-plan-percentage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-min">Min Investment</Label>
                      <Input
                        id="plan-min"
                        type="number"
                        value={newPlan.minInvestment}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, minInvestment: e.target.value }))}
                        placeholder="100"
                        data-testid="input-plan-min"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-max">Max Investment</Label>
                      <Input
                        id="plan-max"
                        type="number"
                        value={newPlan.maxInvestment}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, maxInvestment: e.target.value }))}
                        placeholder="10000"
                        data-testid="input-plan-max"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan-duration">Duration (Days)</Label>
                      <Input
                        id="plan-duration"
                        type="number"
                        value={newPlan.durationDays}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, durationDays: e.target.value }))}
                        placeholder="30"
                        data-testid="input-plan-duration"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="plan-popular"
                        checked={newPlan.isPopular}
                        onChange={(e) => setNewPlan(prev => ({ ...prev, isPopular: e.target.checked }))}
                        data-testid="checkbox-plan-popular"
                      />
                      <Label htmlFor="plan-popular">Mark as Popular</Label>
                    </div>
                    <Button
                      onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                      disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                      className="w-full"
                      data-testid="button-create-plan"
                    >
                      {editingPlan
                        ? (updatePlanMutation.isPending ? "Updating..." : "Update Plan")
                        : (createPlanMutation.isPending ? "Creating..." : "Create Plan")}
                    </Button>
                    {editingPlan && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCancelEdit}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className="p-3 border rounded-lg"
                          data-testid={`card-admin-plan-${plan.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{plan.name}</h4>
                              <p className="text-sm text-gray-500">{plan.dailyPercentage}% daily</p>
                              <p className="text-xs text-gray-400">
                                {formatCurrency(plan.minInvestment)} - {formatCurrency(plan.maxInvestment)}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleEditPlan(plan)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => deletePlanMutation.mutate(plan.id)}
                                disabled={deletePlanMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {plan.isPopular && <Badge variant="secondary">Popular</Badge>}
                              <Badge variant={plan.isActive ? "default" : "outline"}>
                                {plan.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <div data-testid="section-admin-announcements">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Announcements</h1>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Announcement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="announcement-title">Title</Label>
                      <Input
                        id="announcement-title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter announcement title"
                        data-testid="input-announcement-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="announcement-content">Content</Label>
                      <Textarea
                        id="announcement-content"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter announcement content"
                        rows={4}
                        data-testid="textarea-announcement-content"
                      />
                    </div>
                    <div>
                      <Label htmlFor="announcement-image">Image URL (Optional)</Label>
                      <Input
                        id="announcement-image"
                        value={newAnnouncement.imageUrl}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-announcement-image"
                      />
                    </div>
                    <Button
                      onClick={handleCreateAnnouncement}
                      disabled={createAnnouncementMutation.isPending}
                      className="w-full"
                      data-testid="button-create-announcement"
                    >
                      {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="p-3 border rounded-lg"
                          data-testid={`card-admin-announcement-${announcement.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{announcement.title}</h4>
                              <p className="text-sm text-gray-500 truncate">{announcement.content}</p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                disabled={deleteAnnouncementMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === "partners" && (
            <div data-testid="section-admin-partners">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Partners</h1>

              <Card>
                <CardHeader>
                  <CardTitle>Add New Partner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="partner-name">Partner Name</Label>
                    <Input
                      id="partner-name"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter partner name"
                      data-testid="input-partner-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partner-logo">Logo URL</Label>
                    <Input
                      id="partner-logo"
                      value={newPartner.logoUrl}
                      onChange={(e) => setNewPartner(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      data-testid="input-partner-logo"
                    />
                  </div>
                  <Button
                    onClick={handleCreatePartner}
                    disabled={createPartnerMutation.isPending}
                    className="w-full"
                    data-testid="button-create-partner"
                  >
                    {createPartnerMutation.isPending ? "Adding..." : "Add Partner"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div data-testid="section-admin-settings">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Site Settings</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Deposit & Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="qr-code-url">QR Code URL</Label>
                    <Input
                      id="qr-code-url"
                      value={settings.deposit_qr_code_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, deposit_qr_code_url: e.target.value }))}
                      placeholder="Enter QR code image URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="upi-id">UPI ID</Label>
                    <Input
                      id="upi-id"
                      value={settings.deposit_upi_id}
                      onChange={(e) => setSettings(prev => ({ ...prev, deposit_upi_id: e.target.value }))}
                      placeholder="Enter UPI ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="helpline-link">Helpline Link</Label>
                    <Input
                      id="helpline-link"
                      value={settings.telegram_support_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, telegram_support_url: e.target.value }))}
                      placeholder="Enter Telegram/WhatsApp link"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({ key, value }));
                      updateSettingsMutation.mutate(settingsToUpdate);
                    }}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Balance Adjustment Tab */}
          {activeTab === "balance" && (
            <div data-testid="section-admin-balance">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Adjust User Balance</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Manual Balance Adjustment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adj-whatsapp">User WhatsApp Number</Label>
                    <Input
                      id="adj-whatsapp"
                      value={adjustmentData.userWhatsappNumber}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, userWhatsappNumber: e.target.value }))}
                      placeholder="Enter user's WhatsApp number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adj-amount">Amount</Label>
                    <Input
                      id="adj-amount"
                      type="number"
                      value={adjustmentData.amount}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adj-type">Adjustment Type</Label>
                    <select
                      id="adj-type"
                      value={adjustmentData.type}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="admin_credit">Credit (Add)</option>
                      <option value="admin_debit">Debit (Subtract)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="adj-remarks">Remarks</Label>
                    <Textarea
                      id="adj-remarks"
                      value={adjustmentData.remarks}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Enter reason for adjustment"
                    />
                  </div>
                  <Button
                    onClick={() => adjustBalanceMutation.mutate(adjustmentData)}
                    disabled={adjustBalanceMutation.isPending}
                  >
                    {adjustBalanceMutation.isPending ? "Adjusting..." : "Adjust Balance"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}