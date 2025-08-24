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
import { Users } from "lucide-react";

interface ReferredUser {
  firstName: string;
  lastName: string;
  whatsappNumber: string;
}

export default function ReferralsPage() {
  const { data: referredUsers = [], isLoading } = useQuery<ReferredUser[]>({
    queryKey: ["/api/user/referrals"],
  });

  return (
    <div data-testid="section-referrals">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Referrals</h1>
        <p className="text-gray-600">
          Here are the users you've successfully referred.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referred Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
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
