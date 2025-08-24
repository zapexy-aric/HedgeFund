import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralEarning {
  id: string;
  amount: string;
  createdAt: string;
}

export default function ClaimRewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: earnings = [], isLoading } = useQuery<ReferralEarning[]>({
    queryKey: ["/api/user/referral-earnings"],
  });

  const claimMutation = useMutation({
    mutationFn: () =>
      fetch("/api/user/claim-referral-earnings", { method: "POST" }).then(
        (res) => res.json(),
      ),
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `You have successfully claimed ${
          data.totalClaimed
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/referral-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to claim rewards. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const totalUnclaimed = earnings.reduce(
    (sum, earning) => sum + parseFloat(earning.amount),
    0,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div data-testid="section-claim-rewards">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Claim Referral Rewards
        </h1>
        <p className="text-gray-600">
          Collect the rewards you've earned from your referrals.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Gift className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Your Unclaimed Rewards</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-800 mb-4">
                {formatCurrency(totalUnclaimed)}
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => claimMutation.mutate()}
                disabled={claimMutation.isPending || totalUnclaimed === 0}
              >
                {claimMutation.isPending ? "Claiming..." : "Claim Now"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
