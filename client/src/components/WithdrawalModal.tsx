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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Info } from "lucide-react";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: string;
}

export function WithdrawalModal({ isOpen, onClose, availableBalance }: WithdrawalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [fullName, setFullName] = useState("");

  const withdrawalMutation = useMutation({
    mutationFn: async (data: { amount: string; upiId: string; fullName: string }) => {
      await apiRequest("POST", "/api/user/withdraw", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully! It will be processed within 24-48 hours after admin verification.",
      });
      setAmount("");
      setUpiId("");
      setFullName("");
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) < 110) {
      toast({
        title: "Error",
        description: "Minimum withdrawal amount is ₹110",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > parseFloat(availableBalance)) {
      toast({
        title: "Error",
        description: "Amount exceeds available balance",
        variant: "destructive",
      });
      return;
    }

    if (!upiId) {
      toast({
        title: "Error",
        description: "Please enter your UPI ID",
        variant: "destructive",
      });
      return;
    }

    if (!fullName) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate({ amount, upiId, fullName });
  };

  const handleClose = () => {
    setAmount("");
    setUpiId("");
    setFullName("");
    onClose();
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(parseFloat(amount));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-withdrawal">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Withdraw Funds</DialogTitle>
          <p className="text-center text-gray-600">Request withdrawal from your available balance</p>
        </DialogHeader>
        
        {/* Available Balance Display */}
        <div className="bg-background p-4 rounded-lg mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold text-secondary" data-testid="text-available-balance">
              {formatCurrency(availableBalance)}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">Withdrawal Amount (INR)</Label>
            <Input 
              id="withdrawal-amount"
              type="number" 
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="110"
              max={availableBalance}
              step="0.01"
              data-testid="input-withdrawal-amount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-upi">UPI ID</Label>
            <Input 
              id="withdrawal-upi"
              type="text" 
              placeholder="Enter your UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              data-testid="input-withdrawal-upi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-name">Full Name</Label>
            <Input 
              id="withdrawal-name"
              type="text" 
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              data-testid="input-withdrawal-name"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-green-700"
            disabled={withdrawalMutation.isPending}
            data-testid="button-withdrawal-submit"
          >
            {withdrawalMutation.isPending ? "Submitting..." : "Request Withdrawal"}
          </Button>
        </form>
        
        {/* Info Notice */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Withdrawal requests are processed within 24-48 hours after admin verification.
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 right-4"
          onClick={handleClose}
          data-testid="button-close-withdrawal"
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
