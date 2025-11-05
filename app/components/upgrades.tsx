"use client";

import React, { useMemo, useState } from "react";

export type Upgrade = {
	id: string;
	name: string;
	description: string;
	cost: number;
	increment?: number;
};

export type UpgradesProps = {
	upgrades?: Upgrade[];
	money?: number; // used to determine locked state
	purchased?: string[]; // externally controlled purchased ids
	onBuy?: (upgrade: Upgrade) => void; // called when user buys an upgrade
};

export default function Upgrades({ upgrades, money = 0, purchased = [], onBuy }: UpgradesProps) {
	// minimal local purchase state for the draft; if parent controls via `purchased` that will be respected
	const [localPurchased, setLocalPurchased] = useState<Record<string, boolean>>({});
	const [localPrices, setLocalPrices] = useState<Record<string, number>>({});

	const allUpgrades: Upgrade[] = useMemo(() => {
		if (upgrades && upgrades.length) return upgrades;
		// fallback demo upgrades (draft)
		return [
			{ id: "temu-accountant", name: "Temu Accountant", description: "Automatically gamble $10 once every 10s.", cost: 200, increment: 1.2 },
			{ id: "luck-boost", name: "Luck Boost", description: "Slightly increase win chance.", cost: 500 },
			{ id: "golden-coin", name: "Golden Coin", description: "Doubles coin value for 30s after a flip.", cost: 1500 },
		];
	}, [upgrades]);

	const isPurchased = (id: string) => Boolean(localPurchased[id] || purchased.includes(id));

	// For repeatable/incrementing upgrades we should not treat external `purchased` flag
	// as meaning the item is permanently owned. This helper returns whether the
	// given upgrade should be considered purchased (disabled) in the UI.
	const isPurchasedForUpgrade = (u: Upgrade) => {
		// locally purchased (one-time buys) always win
		if (localPurchased[u.id]) return true;
		// if this upgrade is repeatable (has increment) we don't treat external
		// `purchased` as a permanent owned flag — only non-increment upgrades are exclusive
		if (u.increment) return false;
		return purchased.includes(u.id);
	};

	const canAfford = (cost: number) => money >= cost;

	const getPrice = (u: Upgrade) => {
		return localPrices[u.id] ?? u.cost;
	};

	const handleBuy = (u: Upgrade) => {
		if (isPurchasedForUpgrade(u)) return;
		const price = getPrice(u);
		if (!canAfford(price)) return;
		// optimistic local purchase/update
		if (!u.increment) {
			setLocalPurchased((s) => ({ ...s, [u.id]: true }));
		} else {
			setLocalPrices((s) => ({ ...s, [u.id]: Number((price * u.increment!).toFixed(2)) }));
		}
		if (onBuy) onBuy(u);
	};

	return (
		<div className="bg-gray-800 rounded-lg p-6 text-white w-64 overflow-y-scroll h-96">
			<h2 className="text-xl font-semibold mb-3">Upgrades</h2>

			<div className="flex flex-col gap-3">
				{allUpgrades.map((u) => {
					const purchasedFlag = isPurchasedForUpgrade(u);
					const affordable = canAfford(getPrice(u));
					return (
						<div
							key={u.id}
							className={`relative rounded-md border bg-gray-700 p-3 transition-all hover:scale-[1.01] ${
								purchasedFlag ? "border-green-400/30" : "border-white/5"
							}`}
						>
							<div className="flex justify-between items-start gap-2">
								<div>
									<h3 className="font-semibold text-white">{u.name}</h3>
									<p className="text-sm text-gray-300">{u.description}</p>
								</div>
								<div className="text-right">
									<div className="text-sm text-yellow-300 font-medium">{getPrice(u)}</div>
									<div className="text-xs text-gray-400">coins</div>
								</div>
							</div>

							<div className="mt-3 flex items-center justify-between gap-2">
								<button
									onClick={() => handleBuy(u)}
									disabled={!affordable || purchasedFlag}
									className={`rounded-md px-3 py-1 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
										purchasedFlag
											? "bg-green-500 text-white"
											: affordable
											? "bg-blue-500 hover:bg-blue-400 text-white"
											: "bg-gray-600 text-gray-300"
									}`}
								>
									{purchasedFlag ? "Purchased" : affordable ? "Buy" : "Locked"}
								</button>

								<div className="text-xs text-gray-400">{purchasedFlag ? "Owned" : affordable ? "Available" : "Too expensive"}</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

