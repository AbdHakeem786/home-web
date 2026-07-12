import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { walletApi, ApiError, type ApiWalletTransaction } from "../../api";
import { cn, formatPKR } from "../../lib/utils";

const statusTone: Record<ApiWalletTransaction["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  completed: "success",
  rejected: "danger",
};

export default function WorkerWallet() {
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<ApiWalletTransaction[]>([]);
  const [error, setError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [accountDetails, setAccountDetails] = useState("");

  function reload() {
    Promise.all([walletApi.getWalletSummary(), walletApi.listMyTransactions()]).then(([summary, txResult]) => {
      setBalance(summary.balance);
      setTxns(txResult.transactions);
    });
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleWithdraw() {
    if (balance <= 0 || !accountDetails.trim()) return;
    setWithdrawing(true);
    setError("");
    try {
      await walletApi.requestWithdrawal(balance, "bank", accountDetails.trim());
      setShowWithdrawForm(false);
      setAccountDetails("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Withdrawal failed.");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-bold text-ink">Wallet</h1>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-3 py-2.5 text-sm text-danger">{error}</p>}

      <Card className="bg-primary text-white">
        <p className="text-sm text-white/70">Available balance</p>
        <p className="mt-1 font-mono text-3xl font-bold">{formatPKR(balance)}</p>
        {!showWithdrawForm ? (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 !bg-white !text-primary"
            icon={<ArrowDownToLine size={14} />}
            disabled={balance <= 0}
            onClick={() => setShowWithdrawForm(true)}
          >
            Withdraw
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <Input
              id="accountDetails"
              placeholder="Bank / JazzCash account number"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              className="!bg-white/10 !text-white placeholder:!text-white/50"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="!bg-white !text-primary"
                disabled={withdrawing || balance <= 0 || !accountDetails.trim()}
                onClick={handleWithdraw}
              >
                {withdrawing ? "Processing..." : `Withdraw ${formatPKR(balance)}`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!border-white/30 !text-white"
                disabled={withdrawing}
                onClick={() => setShowWithdrawForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <h2 className="mb-2 mt-6 font-display text-sm font-semibold text-ink">Transactions</h2>
      <div className="flex flex-col gap-2">
        {txns.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-muted">No transactions yet.</p>
        )}
        {txns.map((t) => (
          <Card key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  t.type === "credit" ? "bg-success-light text-success" : "bg-danger-light text-danger"
                )}
              >
                <ArrowUpRight size={16} className={t.type === "debit" ? "rotate-180" : ""} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{t.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-ink-muted">{new Date(t.createdAt).toLocaleDateString()}</p>
                  {t.type === "debit" && <Badge tone={statusTone[t.status]}>{t.status}</Badge>}
                </div>
              </div>
            </div>
            <span className={cn("font-mono text-sm font-semibold", t.type === "credit" ? "text-success" : "text-danger")}>
              {t.type === "credit" ? "+" : "-"}{formatPKR(t.amount)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
