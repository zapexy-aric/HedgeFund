import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Info } from "lucide-react";

interface InvestmentPlan {
  id: string;
  name: string;
  dailyPercentage: string;
  minInvestment: string;
  maxInvestment: string;
  durationDays: number;
  isPopular: boolean;
}

interface PurchasePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InvestmentPlan | null;
  availableBalance: string;
}

export function PurchasePlanModal({ isOpen, onClose, plan, availableBalance }: PurchasePlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  const purchaseMutation = useMutation({
    mutationFn: async (data: { planId: string; amount: string }) => {
      await apiRequest("POST", "/api/user/purchase-plan", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Investment plan purchased successfully! Your daily returns will start from tomorrow.",
      });
      setAmount("");
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase investment plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) return;

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const investmentAmount = parseFloat(amount);
    const minInvestment = parseFloat(plan.minInvestment);
    const maxInvestment = parseFloat(plan.maxInvestment);
    const available = parseFloat(availableBalance);

    if (investmentAmount < minInvestment) {
      toast({
        title: "Error",
        description: `Minimum investment for this plan is ${formatCurrency(plan.minInvestment)}`,
        variant: "destructive",
      });
      return;
    }

    if (investmentAmount > maxInvestment) {
      toast({
        title: "Error",
        description: `Maximum investment for this plan is ${formatCurrency(plan.maxInvestment)}`,
        variant: "destructive",
      });
      return;
    }

    if (investmentAmount > available) {
      toast({
        title: "Error",
        description: "Amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate({ planId: plan.id, amount });
  };

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount));
  };

  const calculateDailyReturn = () => {
    if (!plan || !amount) return "0.00";
    const investment = parseFloat(amount);
    const percentage = parseFloat(plan.dailyPercentage);
    return ((investment * percentage) / 100).toFixed(2);
  };

  const calculateTotalReturn = () => {
    if (!plan || !amount) return "0.00";
    const dailyReturn = parseFloat(calculateDailyReturn());
    return (dailyReturn * plan.durationDays).toFixed(2);
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-purchase-plan">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Purchase Investment Plan</DialogTitle>
          <p className="text-center text-gray-600">Invest in {plan.name}</p>
        </DialogHeader>
        
        {/* Plan Details */}
        <div className="bg-background p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            {plan.isPopular && <Badge className="bg-secondary">Popular</Badge>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Daily Return Rate</p>
              <p className="font-semibold text-primary">{plan.dailyPercentage}%</p>
            </div>
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-semibold">{plan.durationDays} Days</p>
            </div>
            <div>
              <p className="text-gray-500">Minimum Investment</p>
              <p className="font-semibold">{formatCurrency(plan.minInvestment)}</p>
            </div>
            <div>
              <p className="text-gray-500">Maximum Investment</p>
              <p className="font-semibold">{formatCurrency(plan.maxInvestment)}</p>
            </div>
          </div>
        </div>
        
        {/* Available Balance */}
        <div className="bg-primary/10 p-3 rounded-lg mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="font-bold text-primary" data-testid="text-available-balance">
              {formatCurrency(availableBalance)}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="investment-amount">Investment Amount (INR)</Label>
            <Input 
              id="investment-amount"
              type="number" 
              placeholder="Enter investment amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={plan.minInvestment}
              max={Math.min(parseFloat(plan.maxInvestment), parseFloat(availableBalance)).toString()}
              step="0.01"
              data-testid="input-investment-amount"
            />
          </div>
          
          {/* Investment Calculations */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-secondary">Investment Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Daily Return</p>
                  <p className="font-semibold text-secondary" data-testid="text-daily-return">
                    {formatCurrency(calculateDailyReturn())}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Return</p>
                  <p className="font-semibold text-secondary" data-testid="text-total-return">
                    {formatCurrency(calculateTotalReturn())}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={purchaseMutation.isPending || !amount || parseFloat(amount) <= 0}
            data-testid="button-purchase-submit"
          >
            {purchaseMutation.isPending ? "Processing..." : "Purchase Plan"}
          </Button>
        </form>
        
        {/* Info Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Your daily returns will be credited to your withdrawal balance automatically. The investment will be deducted from your deposit balance.
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 right-4"
          onClick={handleClose}
          data-testid="button-close-purchase"
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
