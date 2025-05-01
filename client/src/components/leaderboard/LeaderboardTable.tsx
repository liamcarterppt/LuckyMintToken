import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  telegramUsername?: string;
  walletAddress?: string;
  tasksCompleted: number;
  totalTasks: number;
  lkmtEarned: number;
  isVerified: boolean;
}

const LeaderboardTable: React.FC<{ limit?: number; showViewAll?: boolean }> = ({ 
  limit = 10,
  showViewAll = false 
}) => {
  const [page, setPage] = useState(1);
  
  // Fetch leaderboard data
  const { data, isLoading } = useQuery<{ entries: LeaderboardEntry[], total: number }>({
    queryKey: ['/api/leaderboard', page, limit],
  });
  
  const entries = data?.entries || [];
  const totalEntries = data?.total || 0;
  const totalPages = Math.ceil(totalEntries / limit);
  
  if (isLoading) {
    return <div className="text-center py-6">Loading leaderboard...</div>;
  }
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p>No leaderboard data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-white/5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/10">
              <TableHead className="text-foreground/70">Rank</TableHead>
              <TableHead className="text-foreground/70">User</TableHead>
              <TableHead className="text-foreground/70">Tasks</TableHead>
              <TableHead className="text-foreground/70">$LKMT Earned</TableHead>
              <TableHead className="text-foreground/70">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow 
                key={entry.userId} 
                className="border-b border-white/5 hover:bg-white/5"
              >
                <TableCell>
                  <div className="flex items-center">
                    <span 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        entry.rank === 1
                          ? "bg-primary/10 text-primary"
                          : entry.rank === 2
                          ? "bg-secondary/10 text-secondary"
                          : entry.rank === 3
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-foreground/70"
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${entry.username}`} 
                        alt={entry.username} 
                      />
                      <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {entry.telegramUsername 
                          ? `@${entry.telegramUsername}` 
                          : entry.username}
                      </p>
                      {entry.walletAddress && (
                        <p className="text-xs text-foreground/50">
                          {`${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="text-success text-sm" />
                    {entry.tasksCompleted}/{entry.totalTasks}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{entry.lkmtEarned} $LKMT</span>
                </TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.isVerified
                        ? "bg-success/10 text-success"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {entry.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination or View All button */}
      {totalPages > 1 && (
        <div className="p-4 flex justify-between items-center">
          <div className="text-sm text-foreground/70">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalEntries)} of {totalEntries} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-white/10"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* View All button (only shown on home page) */}
      {showViewAll && (
        <div className="p-4 flex justify-center">
          <Button
            variant="link"
            className="text-accent flex items-center gap-1"
            asChild
          >
            <a href="/leaderboard">
              View All <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
