"use client";

import { useState, useEffect, useRef } from "react";
import Dropdown from "./components/dropdown";
import Dialogbox from "./components/dialogbox";
import Loans from "./components/loans";
import NewLoan from "./components/newLoan";
import Coin from "./components/coin";
import Upgrades from "./components/upgrades";

export default function Home() {
  const [result, setResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [bet, setBet] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const [money, setMoney] = useState(25);
  const [open, setOpen] = useState(false);
  const [newLoanOpen, setNewLoanOpen] = useState(false);
  const [loansObject, setLoansObject] = useState<Array<{
    loanNumber: number;
    amount: number;
    opened: number;
  }>>([]);
  const [currentFlip, setCurrentFlip] = useState(0);
  const [upgrades, setUpgrades] = useState<Array<{
    id: string;
    name: string;
    description: string;
    cost: number;
  }>>([]);
  const [purchased, setPurchased] = useState<string[]>([]);
  // Upgrade-related state
  const [payoutMultiplier, setPayoutMultiplier] = useState(0.9); // default used previously
  const [winChance, setWinChance] = useState(0.5);
  const [autoFlipEnabled, setAutoFlipEnabled] = useState(false);
  const [goldenPurchased, setGoldenPurchased] = useState(false);
  const [goldenActive, setGoldenActive] = useState(false);
  const autoFlipRef = useRef<number | null>(null);
  const goldenTimeoutRef = useRef<number | null>(null);

  function handleBuy(upgrade: { id: string; name: string; description: string; cost: number }) {
    if (purchased.includes(upgrade.id)) return;
    if (money < upgrade.cost) return;
    setPurchased((prev) => [...prev, upgrade.id]);
    setMoney((prev) => prev - upgrade.cost);
    // Apply upgrade effects immediately when purchased
    switch (upgrade.id) {
      case "temu-accountant":
        setAutoFlipEnabled(true);
        break;
      case "luck-boost":
        // increase win chance by 5%
        setWinChance((c) => Math.min(0.95, parseFloat((c + 0.05).toFixed(3))));
        break;
      case "golden-coin":
        setGoldenPurchased(true);
        break;
      default:
        break;
    }
  }

  function flip(isAuto = false) {
    if (!isAuto) {
      if (isFlipping) return; // avoid double clicks
    }
    if (!bet) {
      alert("Please select your bet before flipping the coin.");
      return;
    }
    if (money < betAmount) {
      alert("You don't have enough money for this bet, try a loan");
      return;
    }
    setIsFlipping(true);
    const r = Math.random() < winChance ? "Heads" : "Tails";
    // play the flip animation, then reveal the result
    window.setTimeout(() => {
      setResult(r);
      setIsFlipping(false);
      if (bet === r) {
        // compute payout using multiplier and golden state
        const goldenFactor = goldenActive ? 2 : 1;
        let payout = 0;
        if (!isAuto) {
          payout = parseFloat((payoutMultiplier * goldenFactor * betAmount).toFixed(2));
        } else {
          payout = parseFloat((payoutMultiplier * goldenFactor * 10).toFixed(2));
        }
        setMoney((prev) => parseFloat((prev + payout).toFixed(2)));
        if (!isAuto) {
          setOpen(true);
        }
        // If player bought golden coin, activating golden mode for a short duration after a win
        if (goldenPurchased) {
          // clear previous timer
          if (goldenTimeoutRef.current) window.clearTimeout(goldenTimeoutRef.current);
          setGoldenActive(true);
          // disable after 30s
          goldenTimeoutRef.current = window.setTimeout(() => setGoldenActive(false), 30_000);
        }
      } else {
        if (!isAuto) {
          setMoney(prev => parseFloat((prev - betAmount).toFixed(2)));
        } else {
          setMoney(prev => parseFloat((prev - 10).toFixed(2)));
        }
      }
      // compute next flip index (use currentFlip captured here)
      const nextFlip = currentFlip + 1;

      // Update all loans once: apply interest, remove expired loans.
      setLoansObject(prevLoans => {
        let hasExpired = false;
        const updatedLoans = prevLoans.map(loan => ({
          ...loan,
          amount: parseFloat((loan.amount * 1.05).toFixed(2))
        }));

        const activeLoans = updatedLoans.filter(loan => {
          if (nextFlip - loan.opened >= 10) {
            hasExpired = true;
          }
          return true;
        });

        if (hasExpired) {
          // If any loan expired, apply the penalty (reset money to 0).
          setMoney(() => 0);
        }

        return activeLoans;
      });

      // finally bump the flip counter
      setCurrentFlip(prev => prev + 1);
    }, 800); // match animation duration in CSS
  }

  // Auto-flipper effect: when enabled, flip automatically every 10s if there's a bet and enough money
  useEffect(() => {
    if (!autoFlipEnabled) return;
    // clear any existing interval
    if (autoFlipRef.current) {
      window.clearInterval(autoFlipRef.current);
      autoFlipRef.current = null;
    }
    autoFlipRef.current = window.setInterval(() => {
      // attempt an automatic flip only when conditions are met
      if (!bet) return;
      if (isFlipping) return;
      if (money < betAmount) return;
      flip(true);
    }, 10_000);

    return () => {
      if (autoFlipRef.current) {
        window.clearInterval(autoFlipRef.current);
        autoFlipRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFlipEnabled, bet, betAmount, money, isFlipping]);

  // cleanup golden timer on unmount
  useEffect(() => {
    return () => {
      if (goldenTimeoutRef.current) window.clearTimeout(goldenTimeoutRef.current);
      if (autoFlipRef.current) window.clearInterval(autoFlipRef.current);
    };
  }, []);
  function payOffLoan(index: number) {
    if (money >= loansObject[index].amount) {
      setMoney(money - loansObject[index].amount);
      setLoansObject(loansObject.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 p-8 bg-white dark:bg-black rounded-lg shadow">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">You have ${money}</h1>
        <div className="flex flex-col items-center gap-4">
          <Coin isFlipping={isFlipping} result={result} />
          <div className="text-xl font-medium">{result ?? "Flip the coin"}</div>
          <div className="relative">
            <Dropdown options={[
              { label: "Heads", value: "Heads" },
              { label: "Tails", value: "Tails" }
            ]} onChange={(value) => setBet(value)} value={bet} />
          </div>
          <input type="number" placeholder="Type Your Bet Here..." className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={betAmount} onChange={(e) => { setBetAmount(Number(e.target.value)) }} />
          <button
            onClick={() => flip()}
            className="mt-2 rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:opacity-90"
          >
            Flip
          </button>
          <Dialogbox
            title="Congratulations!"
            description={`You won $${betAmount * 2}! However, 10% of your winnings have been taxed.`}
            open={open}
            setOpen={setOpen}
          />
          <div className="absolute right-0 mr-8 self-center top-50 bottom-50">
            <Loans loansObject={loansObject} payOffLoan={payOffLoan} setNewLoanOpen={setNewLoanOpen} />
          </div>
          <div className="absolute left-0 mr-8 self-center top-50 bottom-50">
            <Upgrades upgrades={upgrades} money={money} purchased={purchased} onBuy={handleBuy} />
          </div>
          <NewLoan open={newLoanOpen} setOpen={setNewLoanOpen} loansObject={loansObject} setLoansObject={setLoansObject} money={money} setMoney={setMoney} currentFlip={currentFlip} />
        </div>
      </main>
    </div>
  );
}
