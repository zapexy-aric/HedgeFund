import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { DepositModal } from "@/components/DepositModal";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import { PurchasePlanModal } from "@/components/PurchasePlanModal";
import { 
  Home, 
  PieChart, 
  Briefcase, 
  User, 
  Plus, 
  Minus, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  ArrowUp,
  ArrowDown,
  BarChart3,
  LogOut
} from "lucide-react";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  depositBalance: string;
  withdrawalBalance: string;
  isAdmin?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

interface InvestmentPlan {
  id: string;
  name: string;
  dailyPercentage: string;
  minInvestment: string;
  maxInvestment: string;
  durationDays: number;
  isPopular: boolean;
  imageUrl?: string;
}

interface UserInvestment {
  id: string;
  planId: string;
  amount: string;
  dailyReturn: string;
  totalReturn: string;
  daysCompleted: number;
  status: string;
  purchaseDate: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("home");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showPurchasePlanModal, setShowPurchasePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isAuthenticated,
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: isAuthenticated,
  });

  const { data: plans = [] } = useQuery<InvestmentPlan[]>({
    queryKey: ["/api/plans"],
    enabled: isAuthenticated,
  });

  const { data: investments = [] } = useQuery<UserInvestment[]>({
    queryKey: ["/api/user/investments"],
    enabled: isAuthenticated,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: isAuthenticated,
  });

  const { data: telegramSupport } = useQuery<{ telegramUrl: string }>({
    queryKey: ["/api/admin/telegram-support"],
    enabled: isAuthenticated,
  });

  const handlePurchasePlan = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setShowPurchasePlanModal(true);
  };

  const handleContactSupport = () => {
    const telegramUrl = telegramSupport?.telegramUrl || "https://t.me/hedgefund_support";
    window.open(telegramUrl, "_blank");
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInvestmentProgress = (investment: UserInvestment, plan: InvestmentPlan) => {
    if (!plan) return 0;
    return (investment.daysCompleted / plan.durationDays) * 100;
  };

  const getInvestmentPlan = (planId: string) => {
    return plans.find(p => p.id === planId);
  };

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "plans", icon: PieChart, label: "Plans" },
    { id: "purchased", icon: Briefcase, label: "Purchased Plans" },
    { id: "profile", icon: User, label: "Profile" },
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="https://i.ibb.co/H8mXMmJ/Adobe-Express-file.png" alt="HedgeFund Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold text-gray-800">HedgeFund</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600" data-testid="text-welcome">
              Welcome, <span className="font-semibold">{user?.firstName || user?.lastName || 'User'}</span>
            </span>
            <div className="hidden md:flex items-center space-x-4">
              {user?.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/admin'}
                  data-testid="button-admin-panel"
                >
                  Admin Panel
                </Button>
              )}
              <Button 
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await fetch('/api/logout', { method: 'POST' });
                  window.location.reload();
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-20 bg-white shadow-sm h-screen sticky top-[88px] flex flex-col">
          <div className="p-4 space-y-4 flex-grow">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                size="icon"
                className="w-12 h-12"
                onClick={() => setActiveSection(item.id)}
                data-testid={`button-nav-${item.id}`}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            ))}
          </div>
          <div className="p-4 md:hidden">
             <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12"
                onClick={async () => {
                  await fetch('/api/logout', { method: 'POST' });
                  window.location.reload();
                }}
                data-testid="button-mobile-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Home Section */}
          {activeSection === "home" && (
            <div data-testid="section-home">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Home</h1>
                <p className="text-gray-600">Stay updated with the latest announcements and opportunities</p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-secondary to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Invested</p>
                        <p className="text-2xl font-bold" data-testid="text-total-invested">
                          {formatCurrency(investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0).toString())}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-100" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Returns</p>
                        <p className="text-2xl font-bold" data-testid="text-total-returns">
                          {formatCurrency(investments.reduce((sum, inv) => sum + parseFloat(inv.totalReturn), 0).toString())}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-100" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Active Plans</p>
                        <p className="text-2xl font-bold" data-testid="text-active-plans">
                          {investments.filter(inv => inv.status === 'active').length}
                        </p>
                      </div>
                      <Briefcase className="h-8 w-8 text-purple-100" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Announcements */}
              <div className="grid lg:grid-cols-2 gap-6">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} data-testid={`card-announcement-${announcement.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {announcement.imageUrl && (
                          <img
                            src={announcement.imageUrl}
                            alt={announcement.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-2">{announcement.title}</h3>
                          <p className="text-gray-600 text-sm">{announcement.content}</p>
                          <span className="text-xs text-gray-500 mt-2 block">
                            {formatDate(announcement.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Plans Section */}
          {activeSection === "plans" && (
            <div data-testid="section-plans">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Investment Plans</h1>
                <p className="text-gray-600">Choose from our carefully curated investment opportunities</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className="hover:shadow-md transition-shadow duration-200 flex flex-col"
                    data-testid={`card-plan-${plan.id}`}
                  >
                    {plan.imageUrl && (
                      <img
                        src={plan.imageUrl}
                        alt={plan.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4 flex flex-col flex-grow">
                      <CardTitle className="text-lg font-bold mb-2">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold text-primary mb-4">
                        {formatCurrency(((parseFloat(plan.minInvestment) * parseFloat(plan.dailyPercentage)) / 100).toString())}
                        <span className="text-sm text-gray-500 font-normal"> / day</span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>Min Investment</span>
                          <span className="font-semibold">{formatCurrency(plan.minInvestment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Investment</span>
                          <span className="font-semibold">{formatCurrency(plan.maxInvestment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration</span>
                          <span className="font-semibold">{plan.durationDays} Days</span>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-auto"
                        onClick={() => handlePurchasePlan(plan)}
                        data-testid={`button-invest-${plan.id}`}
                      >
                        Invest Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Purchased Plans Section */}
          {activeSection === "purchased" && (
            <div data-testid="section-purchased">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Investments</h1>
                <p className="text-gray-600">Track your active and completed investment plans</p>
              </div>
              
              <div className="space-y-6">
                {investments.map((investment) => {
                  const plan = getInvestmentPlan(investment.planId);
                  const progress = plan ? getInvestmentProgress(investment, plan) : 0;
                  const daysLeft = plan ? plan.durationDays - investment.daysCompleted : 0;
                  
                  return (
                    <Card key={investment.id} className="overflow-hidden" data-testid={`card-investment-${investment.id}`}>
                      {plan?.imageUrl && (
                        <img
                          src={plan.imageUrl}
                          alt={plan?.name || ''}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{plan?.name || 'Unknown Plan'}</h3>
                            <p className="text-sm text-gray-500">Purchased: {formatDate(investment.purchaseDate)}</p>
                          </div>
                          <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div className="p-3 bg-background rounded-lg">
                            <p className="text-gray-600">Daily Return</p>
                            <p className="font-bold text-secondary text-base">{formatCurrency(investment.dailyReturn)}</p>
                          </div>
                          <div className="p-3 bg-background rounded-lg">
                            <p className="text-gray-600">Investment</p>
                            <p className="font-bold text-gray-800 text-base">{formatCurrency(investment.amount)}</p>
                          </div>
                          <div className="p-3 bg-background rounded-lg">
                            <p className="text-gray-600">Total Return</p>
                            <p className="font-bold text-gray-800 text-base">{formatCurrency(investment.totalReturn)}</p>
                          </div>
                          <div className="p-3 bg-background rounded-lg">
                            <p className="text-gray-600">Duration</p>
                            <p className="font-bold text-gray-800 text-base">{plan?.durationDays} Days</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress</span>
                            <span>{daysLeft} days left</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {investments.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Investments Yet</h3>
                      <p className="text-gray-500 mb-4">Start your investment journey by choosing a plan</p>
                      <Button onClick={() => setActiveSection("plans")}>
                        View Investment Plans
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === "profile" && (
            <div data-testid="section-profile">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile & Wallet</h1>
                <p className="text-gray-600">Manage your account and financial transactions</p>
              </div>
              
              {/* Balance Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Deposit Balance</h3>
                      <DollarSign className="h-8 w-8 text-blue-100" />
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-deposit-balance">
                      {formatCurrency(user?.depositBalance || "0")}
                    </p>
                    <p className="text-blue-100 text-sm mt-2">Available for investment</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-secondary to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Withdrawal Balance</h3>
                      <TrendingUp className="h-8 w-8 text-green-100" />
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-withdrawal-balance">
                      {formatCurrency(user?.withdrawalBalance || "0")}
                    </p>
                    <p className="text-green-100 text-sm mt-2">Ready for withdrawal</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Button 
                  className="flex items-center justify-center space-x-3 py-4 bg-primary hover:bg-blue-700"
                  onClick={() => setShowDepositModal(true)}
                  data-testid="button-deposit"
                >
                  <Plus className="h-5 w-5" />
                  <span>Deposit Funds</span>
                </Button>
                
                <Button 
                  className="flex items-center justify-center space-x-3 py-4 bg-secondary hover:bg-green-700"
                  onClick={() => setShowWithdrawalModal(true)}
                  data-testid="button-withdraw"
                >
                  <Minus className="h-5 w-5" />
                  <span>Withdraw Funds</span>
                </Button>
                
                <Button 
                  className="flex items-center justify-center space-x-3 py-4 bg-blue-500 hover:bg-blue-600"
                  onClick={handleContactSupport}
                  data-testid="button-support"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Customer Support</span>
                </Button>
              </div>
              
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                        data-testid={`row-transaction-${transaction.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-secondary text-white' :
                            transaction.type === 'withdrawal' ? 'bg-accent text-white' :
                            'bg-primary text-white'
                          }`}>
                            {transaction.type === 'deposit' && <ArrowDown className="h-4 w-4" />}
                            {transaction.type === 'withdrawal' && <ArrowUp className="h-4 w-4" />}
                            {transaction.type === 'investment_return' && <TrendingUp className="h-4 w-4" />}
                            {transaction.type === 'investment' && <Briefcase className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 capitalize">
                              {transaction.type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${
                            parseFloat(transaction.amount) > 0 ? 'text-secondary' : 'text-accent'
                          }`}>
                            {parseFloat(transaction.amount) > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </span>
                          <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                        </div>
                      </div>
                    ))}
                    
                    {transactions.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No transactions yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
      
      <WithdrawalModal 
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={user?.withdrawalBalance || "0"}
      />
      
      <PurchasePlanModal 
        isOpen={showPurchasePlanModal}
        onClose={() => setShowPurchasePlanModal(false)}
        plan={selectedPlan}
        availableBalance={user?.depositBalance || "0"}
      />
    </div>
  );
}
