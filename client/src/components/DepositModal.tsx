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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, Copy } from "lucide-react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");

  const { data: depositInfo } = useQuery<{ qrCodeUrl: string; upiId: string }>({
    queryKey: ["/api/deposit-info"],
    enabled: isOpen,
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; utrNumber: string }) => {
      await apiRequest("POST", "/api/user/deposit", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Deposit request submitted successfully! It will be reflected in your balance after admin verification.",
      });
      setAmount("");
      setUtrNumber("");
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit deposit request",
        variant: "destructive",
      });
    },
  });

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "UPI ID copied to clipboard." });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!utrNumber) {
      toast({
        title: "Error",
        description: "Please enter the UTR/Transaction ID",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate({ amount, utrNumber });
  };

  const handleClose = () => {
    setAmount("");
    setUtrNumber("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-deposit">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Deposit Funds</DialogTitle>
          <p className="text-center text-gray-600">Follow the steps below to add funds</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-background rounded-lg">
            <Label className="text-sm font-medium text-gray-500">Step 1: Pay using UPI</Label>
            <p className="text-gray-600">Scan the QR code or use the UPI ID below.</p>
            <div className="mt-2 flex flex-col items-center justify-center p-3 bg-white border rounded-md">
              {depositInfo?.qrCodeUrl ? (
                <img src={depositInfo.qrCodeUrl} alt="UPI QR Code" className="w-48 h-48" />
              ) : (
                <p>Loading QR Code...</p>
              )}
              {depositInfo?.upiId && (
                <div className="mt-4 w-full flex items-center justify-between p-2 bg-gray-100 rounded-md">
                  <span className="font-mono text-sm text-primary">{depositInfo.upiId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(depositInfo.upiId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="p-4 bg-background rounded-lg space-y-2">
               <Label className="text-sm font-medium text-gray-500">Step 2: Confirm Deposit</Label>
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount Deposited (INR)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Enter exact amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    data-testid="input-deposit-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-utr">UTR / Transaction ID</Label>
                  <Input
                    id="deposit-utr"
                    type="text"
                    placeholder="Enter the 12-digit UTR"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    data-testid="input-deposit-utr"
                  />
                </div>
             </div>
            <Button
              type="submit"
              className="w-full"
              disabled={depositMutation.isPending}
              data-testid="button-deposit-submit"
            >
              {depositMutation.isPending ? "Submitting..." : "Submit Deposit Request"}
            </Button>
          </form>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 right-4"
          onClick={handleClose}
          data-testid="button-close-deposit"
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
