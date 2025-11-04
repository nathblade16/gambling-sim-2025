import { PlusIcon } from "@heroicons/react/20/solid";

export default function Loans( { loansObject, payOffLoan, setNewLoanOpen } : {
    loansObject: Array<{
        loanNumber: number;
        amount: number;
        opened: number;
    }>;
    payOffLoan: (index: number) => void;
    setNewLoanOpen: (open: boolean) => void;
} ) {
    return (
        <div className="bg-gray-800 rounded-lg p-6 text-white w-64 overflow-y-scroll h-96">
            <h2 className="text-2xl font-bold mb-4">Active Loans</h2>
            {loansObject.map( ( loan, index ) => (
                <div key={index} className="mb-4 p-4 bg-gray-700 rounded-md flex gap-2 flex-col">
                    <h3 className="text-lg font-semibold">Loan {loan.loanNumber}</h3>
                    <p>Amount: {loan.amount}</p>
                    <p>Opened on spin {loan.opened}</p>
                    <button className="bg-gray-600 p-4 rounded-md hover:bg-gray-500" onClick={() => { payOffLoan(index) }}>Pay Off</button>
                </div>
            ))}
            <button className="absolute bottom-0 left-0 p-4" onClick={() => { setNewLoanOpen(true) }}>
                <PlusIcon className="h-6 w-6 text-white" />
            </button>
        </div>
    );
}