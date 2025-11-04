"use client";

import { useState } from "react";
import Dropdown from "./components/dropdown";
import Dialogbox from "./components/dialogbox";
import Loans from "./components/loans";
import NewLoan from "./components/newLoan";

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

  function flip() {
    if (isFlipping) return; // avoid double clicks
    if (!bet) {
      alert("Please select your bet before flipping the coin.");
      return;
    }
    if (money < betAmount) {
      alert("You don't have enough money for this bet, try a loan");
      return;
    }
    setIsFlipping(true);
    const r = Math.random() < 0.5 ? "Heads" : "Tails";
    // play the flip animation, then reveal the result
    window.setTimeout(() => {
      setResult(r);
      setIsFlipping(false);
      if (bet === r) {
        setMoney(prev => parseFloat((prev + 0.9 * betAmount).toFixed(2)));
        setOpen(true);
      } else {
        setMoney(prev => parseFloat((prev - betAmount).toFixed(2)));
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
          <div className="text-8xl">
            <span
              className={`coin ${isFlipping ? "coin--flip" : result ? "coin--reveal" : ""}`}
            >
              {isFlipping
                ? "🪙"
                : result === "Heads"
                  ? "🪙"
                  : result === "Tails"
                    ? "⚪️"
                    : "🪙"}
            </span>
          </div>
          <div className="text-xl font-medium">{result ?? "Flip the coin"}</div>
          <div className="relative">
            <Dropdown options={[
              { label: "Heads", value: "Heads" },
              { label: "Tails", value: "Tails" }
            ]} onChange={(value) => setBet(value)} value={bet} />
          </div>
          <input type="number" placeholder="Type Your Bet Here..." className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={betAmount} onChange={(e) => { setBetAmount(Number(e.target.value)) }} />
          <button
            onClick={flip}
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
          <NewLoan open={newLoanOpen} setOpen={setNewLoanOpen} loansObject={loansObject} setLoansObject={setLoansObject} money={money} setMoney={setMoney} currentFlip={currentFlip} />
        </div>
      </main>
    </div>
  );
}
