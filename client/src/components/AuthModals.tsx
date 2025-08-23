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
import { X } from "lucide-react";

interface AuthModalsProps {
  showModal: "login" | "signup" | null;
  onClose: () => void;
  onSwitchModal: (type: "login" | "signup") => void;
}

export function AuthModals({ showModal, onClose, onSwitchModal }: AuthModalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: "",
    whatsappNumber: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const updateWhatsAppMutation = useMutation({
    mutationFn: async (data: { whatsappNumber: string; referralCode?: string }) => {
      await apiRequest("POST", "/api/auth/update-whatsapp", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Account setup completed successfully!",
      });
      onClose();
      // Redirect to refresh the page and show dashboard
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete account setup",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = () => {
    // Redirect to Replit Auth login
    window.location.href = "/api/login";
  };

  const handleSignup = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.whatsappNumber) {
      toast({
        title: "Error",
        description: "WhatsApp number is required",
        variant: "destructive",
      });
      return;
    }

    // For now, redirect to Replit Auth. In a full implementation,
    // you would store the additional data and complete setup after auth
    window.location.href = "/api/login";
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={showModal === "login"} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" data-testid="modal-login">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Welcome Back</DialogTitle>
            <p className="text-center text-gray-600">Login to your HedgeFund account</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-whatsapp">WhatsApp Number</Label>
              <Input 
                id="login-whatsapp"
                type="tel" 
                placeholder="+1 234 567 8900"
                data-testid="input-login-whatsapp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input 
                id="login-password"
                type="password" 
                placeholder="Enter your password"
                data-testid="input-login-password"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleLogin}
              data-testid="button-login-submit"
            >
              Login
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => onSwitchModal("signup")}
              data-testid="button-switch-to-signup"
            >
              Don't have an account? Sign up
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleClose}
            data-testid="button-close-login"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showModal === "signup"} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" data-testid="modal-signup">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Create Account</DialogTitle>
            <p className="text-center text-gray-600">Join HedgeFund and start investing</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-fullname">Full Name</Label>
              <Input 
                id="signup-fullname"
                type="text" 
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                data-testid="input-signup-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-whatsapp">WhatsApp Number</Label>
              <Input 
                id="signup-whatsapp"
                type="tel" 
                placeholder="+1 234 567 8900"
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                data-testid="input-signup-whatsapp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input 
                id="signup-password"
                type="password" 
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                data-testid="input-signup-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Repeat Password</Label>
              <Input 
                id="signup-confirm"
                type="password" 
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                data-testid="input-signup-confirm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
              <Input 
                id="signup-referral"
                type="text" 
                placeholder="Enter referral code"
                value={formData.referralCode}
                onChange={(e) => handleInputChange("referralCode", e.target.value)}
                data-testid="input-signup-referral"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSignup}
              data-testid="button-signup-submit"
            >
              Create Account
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => onSwitchModal("login")}
              data-testid="button-switch-to-login"
            >
              Already have an account? Login
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleClose}
            data-testid="button-close-signup"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
