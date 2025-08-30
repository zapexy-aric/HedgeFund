import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gem, Bomb } from "lucide-react";

const GRID_SIZE = 25;

// Define the type for our game state
interface MinesGame {
  id: string;
  status: 'active' | 'busted' | 'cashed_out';
  revealedTiles: number[];
  mineLocations?: number[];
  payoutMultiplier: string;
  betAmount: string;
}

export default function MinesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState("10.00");
  const [mineCount, setMineCount] = useState(5);
  const [game, setGame] = useState<MinesGame | null>(null);

  const betMutation = useMutation({
    mutationFn: (data: { betAmount: number; mineCount: number; clientSeed: string }) =>
      apiRequest("POST", "/api/games/mines/bet", data).then(res => res.json()),
    onSuccess: (newGame) => {
      setGame(newGame);
    },
    onError: (error: Error) => {
      toast({ title: "Error placing bet", description: error.message, variant: "destructive" });
    },
  });

  const revealMutation = useMutation({
    mutationFn: (data: { gameId: string; tileIndex: number }) =>
      apiRequest("POST", "/api/games/mines/reveal", data).then(res => res.json()),
    onSuccess: (updatedGame) => {
      setGame(updatedGame);
    },
    onError: (error: Error) => {
      toast({ title: "Error revealing tile", description: error.message, variant: "destructive" });
    },
  });

  const cashoutMutation = useMutation({
    mutationFn: (data: { gameId: string }) =>
      apiRequest("POST", "/api/games/mines/cashout", data).then(res => res.json()),
    onSuccess: (finalGame) => {
      setGame(finalGame);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Invalidate user balance
      toast({ title: "Success!", description: `You cashed out successfully!` });
    },
    onError: (error: Error) => {
      toast({ title: "Error cashing out", description: error.message, variant: "destructive" });
    },
  });

  const handleBet = () => {
    setGame(null);
    betMutation.mutate({
      betAmount: parseFloat(betAmount),
      mineCount: mineCount,
      clientSeed: Math.random().toString(), // Simple client seed for now
    });
  };

  const handleTileClick = (tileIndex: number) => {
    if (!game || game.status !== 'active' || revealMutation.isPending) return;
    revealMutation.mutate({ gameId: game.id, tileIndex });
  };

  const handleCashout = () => {
    if (!game || game.status !== 'active' || cashoutMutation.isPending) return;
    cashoutMutation.mutate({ gameId: game.id });
  };

  const isGameOver = game?.status === 'busted' || game?.status === 'cashed_out';

  return (
    <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
      {/* Game Controls */}
      <Card className="lg:w-1/4">
        <CardHeader>
          <CardTitle>Mines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bet-amount">Bet Amount</Label>
            <Input
              id="bet-amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={game?.status === 'active'}
            />
          </div>
          <div>
            <Label htmlFor="mine-count">Mines (1-24)</Label>
            <Input
              id="mine-count"
              type="number"
              value={mineCount}
              onChange={(e) => setMineCount(Math.max(1, Math.min(24, parseInt(e.target.value, 10))))}
              disabled={game?.status === 'active'}
            />
          </div>
          {game?.status === 'active' ? (
             <Button className="w-full" variant="success" onClick={handleCashout} disabled={cashoutMutation.isPending}>
                Cashout {parseFloat(game.betAmount) * parseFloat(game.payoutMultiplier)}
             </Button>
          ) : (
            <Button className="w-full" onClick={handleBet} disabled={betMutation.isPending}>
              {isGameOver ? 'Play Again' : 'Bet'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Game Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-5 gap-2 aspect-square">
          {Array.from({ length: GRID_SIZE }).map((_, i) => {
            const isRevealed = game?.revealedTiles.includes(i);
            const isMine = isGameOver && game.mineLocations?.includes(i);

            let content: React.ReactNode = null;
            let variant: "outline" | "secondary" | "destructive" = "outline";

            if (isGameOver) {
              if (isMine) {
                variant = "destructive";
                content = <Bomb className="w-6 h-6" />;
              } else if (isRevealed) {
                variant = "secondary";
                content = <Gem className="w-6 h-6 text-emerald-500" />;
              }
            } else if (isRevealed) {
              variant = "secondary";
              content = <Gem className="w-6 h-6 text-emerald-500" />;
            }

            return (
              <Button
                key={i}
                variant={variant}
                className="w-full h-full aspect-square text-lg"
                onClick={() => handleTileClick(i)}
                disabled={game?.status !== 'active' || isRevealed}
              >
                {content}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
