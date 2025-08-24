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
  const [loginData, setLoginData] = useState({
    whatsappNumber: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    fullName: "",
    whatsappNumber: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });

  const handleWhatsappChange = (setter: Function, value: string) => {
    if (value.length <= 10) {
      setter((prev: any) => ({ ...prev, whatsappNumber: value.replace(/\D/g, '') }));
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { whatsappNumber: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      onClose();
      if (data.isAdmin) {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid WhatsApp number or password",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { whatsappNumber: string; password: string; firstName?: string; lastName?: string; referralCode?: string }) => {
      const response = await apiRequest("POST", "/api/register", data);
       if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unknown error occurred" }));
        throw new Error(errorData.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      onClose();
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleLoginChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignupChange = (field: string, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = () => {
    if (!loginData.whatsappNumber || !loginData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({
      ...loginData,
      whatsappNumber: `+91${loginData.whatsappNumber}`,
    });
  };

  const handleSignup = () => {
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!signupData.whatsappNumber || !signupData.password) {
      toast({
        title: "Error",
        description: "WhatsApp number and password are required",
        variant: "destructive",
      });
      return;
    }

    const [firstName, lastName] = signupData.fullName.split(' ', 2);
    signupMutation.mutate({
      whatsappNumber: `+91${signupData.whatsappNumber}`,
      password: signupData.password,
      firstName: firstName || '',
      lastName: lastName || '',
      referralCode: signupData.referralCode || undefined,
    });
  };

  const resetForms = () => {
    setLoginData({
      whatsappNumber: "",
      password: "",
    });
    setSignupData({
      fullName: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
    });
  };

  const handleClose = () => {
    resetForms();
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
              <div className="flex items-center">
                <span className="p-2 border rounded-l-md bg-gray-100 text-gray-500">+91</span>
                <Input
                  id="login-whatsapp"
                  type="tel"
                  placeholder="9876543210"
                  value={loginData.whatsappNumber}
                  onChange={(e) => handleWhatsappChange(setLoginData, e.target.value)}
                  data-testid="input-login-whatsapp"
                  className="rounded-l-none"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input 
                id="login-password"
                type="password" 
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => handleLoginChange("password", e.target.value)}
                data-testid="input-login-password"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
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
                value={signupData.fullName}
                onChange={(e) => handleSignupChange("fullName", e.target.value)}
                data-testid="input-signup-fullname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-whatsapp">WhatsApp Number</Label>
              <div className="flex items-center">
                <span className="p-2 border rounded-l-md bg-gray-100 text-gray-500">+91</span>
                <Input
                  id="signup-whatsapp"
                  type="tel"
                  placeholder="9876543210"
                  value={signupData.whatsappNumber}
                  onChange={(e) => handleWhatsappChange(setSignupData, e.target.value)}
                  data-testid="input-signup-whatsapp"
                  className="rounded-l-none"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input 
                id="signup-password"
                type="password" 
                placeholder="Create a password"
                value={signupData.password}
                onChange={(e) => handleSignupChange("password", e.target.value)}
                data-testid="input-signup-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Repeat Password</Label>
              <Input 
                id="signup-confirm"
                type="password" 
                placeholder="Repeat your password"
                value={signupData.confirmPassword}
                onChange={(e) => handleSignupChange("confirmPassword", e.target.value)}
                data-testid="input-signup-confirm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
              <Input 
                id="signup-referral"
                type="text" 
                placeholder="Enter referral code"
                value={signupData.referralCode}
                onChange={(e) => handleSignupChange("referralCode", e.target.value)}
                data-testid="input-signup-referral"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSignup}
              disabled={signupMutation.isPending}
              data-testid="button-signup-submit"
            >
              {signupMutation.isPending ? "Creating Account..." : "Create Account"}
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
