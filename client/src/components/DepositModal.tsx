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
import { X } from "lucide-react";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");

  const { data: qrCodeData } = useQuery<{ qrCodeUrl: string }>({
    queryKey: ["/api/admin/qr-code"],
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
        description: "Deposit request submitted successfully! It will be processed within 24 hours.",
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
        description: "Please enter the UTR number",
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
          <p className="text-center text-gray-600">Add money to your investment account</p>
        </DialogHeader>
        
        {/* QR Code */}
        <div className="text-center mb-6">
          <div className="bg-gray-100 p-4 rounded-lg inline-block">
            {qrCodeData?.qrCodeUrl ? (
              <img 
                src={qrCodeData.qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-48 h-48 mx-auto"
                data-testid="img-qr-code"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                <p className="text-gray-500">QR Code Loading...</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">Scan the QR code with your payment app</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount (USD)</Label>
            <Input 
              id="deposit-amount"
              type="number" 
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              data-testid="input-deposit-amount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-utr">UTR Number</Label>
            <Input 
              id="deposit-utr"
              type="text" 
              placeholder="Enter UTR number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              data-testid="input-deposit-utr"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={depositMutation.isPending}
            data-testid="button-deposit-submit"
          >
            {depositMutation.isPending ? "Submitting..." : "Submit Deposit"}
          </Button>
        </form>
        
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
