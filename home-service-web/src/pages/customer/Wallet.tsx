import { useEffect, useState } from "react";
import { ArrowUpRight, Wallet as WalletIcon } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import { customerWalletApi, type ApiCustomerWalletTransaction } from "../../api";
import { cn, formatPKR } from "../../lib/utils";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<ApiCustomerWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([customerWalletApi.getWalletSummary(), customerWalletApi.listMyTransactions()])
      .then(([summary, txResult]) => {
        if (cancelled) return;
        setBalance(summary.balance);
        setTxns(txResult.transactions);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <TopBar title="Wallet" back />
      <div className="p-4">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary-dark p-4 text-white shadow-button">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-2 text-sm text-white/70">
            <WalletIcon size={16} /> Wallet balance
          </div>
          <p className="relative mt-1 font-mono text-3xl font-bold">{formatPKR(balance)}</p>
          <p className="relative mt-2 text-xs text-white/70">
            Automatically applied at checkout on your next booking.
          </p>
        </div>

        <h2 className="mb-2 mt-6 font-display text-sm font-semibold text-ink">Transactions</h2>
        <div className="flex flex-col gap-2">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          {!loading && txns.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-muted">
              No transactions yet. Credits from refunds or support show up here.
            </p>
          )}
          {txns.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                    t.type === "credit" ? "bg-success-light text-success" : "bg-danger-light text-danger"
                  )}
                >
                  <ArrowUpRight size={16} className={t.type === "debit" ? "rotate-180" : ""} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{t.label}</p>
                  <p className="text-xs text-ink-muted">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span
                className={cn(
                  "font-mono text-sm font-semibold",
                  t.type === "credit" ? "text-success" : "text-danger"
                )}
              >
                {t.type === "credit" ? "+" : "-"}
                {formatPKR(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
