import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReferredUser {
  firstName: string;
  lastName: string;
  whatsappNumber: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  depositBalance: string;
  withdrawalBalance: string;
  isAdmin?: boolean;
  referralCode?: string;
}

interface ReferralsPageProps {
  user: User | undefined;
}

export default function ReferralsPage({ user }: ReferralsPageProps) {
  const { toast } = useToast();
  const { data: referredUsers = [], isLoading } = useQuery<ReferredUser[]>({
    queryKey: ["/api/user/referrals"],
  });

  const handleCopy = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({
        title: "Copied!",
        description: "Your referral code has been copied to the clipboard.",
      });
    }
  };

  return (
    <div data-testid="section-referrals">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Referrals</h1>
        <p className="text-gray-600">
          Share your referral code to earn rewards.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <p className="text-2xl font-mono p-3 bg-secondary/10 rounded-lg">
              {user?.referralCode || "..."}
            </p>
            <Button onClick={handleCopy} size="icon" variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referred Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {referredUsers.map((user, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                    <p><strong>WhatsApp:</strong> {user.whatsappNumber}</p>
                  </div>
                ))}
              </div>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>WhatsApp Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referredUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.firstName}</TableCell>
                        <TableCell>{user.lastName}</TableCell>
                        <TableCell>{user.whatsappNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {referredUsers.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                You haven't referred any users yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
