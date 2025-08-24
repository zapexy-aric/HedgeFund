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

interface PlanReturn {
  id: string;
  dailyReturn: string;
}

export default function ClaimRewardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralEarnings = [], isLoading: referralLoading } = useQuery<ReferralEarning[]>({
    queryKey: ["/api/user/referral-earnings"],
  });

  const { data: planReturns = [], isLoading: planReturnsLoading } = useQuery<PlanReturn[]>({
    queryKey: ["/api/user/unclaimed-plan-returns"],
  });

  const claimMutation = useMutation({
    mutationFn: () =>
      fetch("/api/user/claim-all-rewards", { method: "POST" }).then(
        (res) => res.json(),
      ),
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `You have successfully claimed ${formatCurrency(parseFloat(data.totalClaimed))}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/referral-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/unclaimed-plan-returns"] });
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

  const totalReferralUnclaimed = referralEarnings.reduce(
    (sum, earning) => sum + parseFloat(earning.amount),
    0,
  );

  const totalPlanReturnsUnclaimed = planReturns.reduce(
    (sum, investment) => sum + parseFloat(investment.dailyReturn),
    0,
  );

  const totalUnclaimed = totalReferralUnclaimed + totalPlanReturnsUnclaimed;
  const isLoading = referralLoading || planReturnsLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div data-testid="section-claim-rewards">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Claim All Rewards
        </h1>
        <p className="text-gray-500 text-sm">
          Collect your referral earnings and daily plan returns.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <Gift className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-xl">Your Unclaimed Rewards</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500">Referral Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalReferralUnclaimed)}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500">Plan Returns</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPlanReturnsUnclaimed)}</p>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-lg font-semibold">Total Claimable Amount</p>
                <p className="text-4xl font-bold text-primary mb-4">
                  {formatCurrency(totalUnclaimed)}
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending || totalUnclaimed === 0}
                >
                  {claimMutation.isPending ? "Claiming..." : "Claim All Now"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
