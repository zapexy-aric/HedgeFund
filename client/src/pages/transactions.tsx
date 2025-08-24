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
import { ArrowDown, ArrowUp, Briefcase, TrendingUp, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/all-transactions"],
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDown className="h-4 w-4" />;
      case "withdrawal":
        return <ArrowUp className="h-4 w-4" />;
      case "investment_return":
        return <TrendingUp className="h-4 w-4" />;
      case "investment":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div data-testid="section-transactions">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Transaction History</h1>
        <p className="text-gray-600">
          View all your past transactions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-semibold capitalize">{transaction.type.replace("_", " ")}</p>
                      <p className={`font-semibold ${parseFloat(transaction.amount) > 0 ? 'text-secondary' : 'text-accent'}`}>{formatCurrency(transaction.amount)}</p>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                    <p className="text-sm capitalize">{transaction.status}</p>
                  </div>
                ))}
              </div>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="capitalize flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            transaction.type === 'deposit' ? 'bg-secondary text-white' :
                            transaction.type === 'withdrawal' ? 'bg-accent text-white' :
                            'bg-primary text-white'
                          }`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          {transaction.type.replace("_", " ")}
                        </TableCell>
                        <TableCell className={`${parseFloat(transaction.amount) > 0 ? 'text-secondary' : 'text-accent'}`}>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell className="capitalize">{transaction.status}</TableCell>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {transactions.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                You have no transactions yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
