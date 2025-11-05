"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type Result = "heads" | "tails";

export type CoinProps = {
  size?: number | string; // px number or css size
  onResult?: (result: Result) => void;
  initial?: Result;
  // legacy / controlled props used by the app: if provided, they take precedence
  isFlipping?: boolean;
  result?: string | null;
};

export default function Coin({ size = 120, onResult, initial = "heads", isFlipping: externalFlipping, result: externalResult }: CoinProps) {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Result | null>(initial ?? null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const applyFinalTransform = useCallback((r: Result) => {
    if (!innerRef.current) return;
    const deg = r === "tails" ? 180 : 0;
    innerRef.current.style.transform = `rotateX(${deg}deg)`;
  }, []);

  // initialize transform to initial value
  useEffect(() => {
    if (result) applyFinalTransform(result);
  }, [result, applyFinalTransform]);

  // If parent is controlling the result (passes `result` prop), respond to it:
  useEffect(() => {
    if (externalResult) {
      const norm = (externalResult as string).toLowerCase() === "tails" ? "tails" : "heads";
      setResult(norm);
      applyFinalTransform(norm);
    }
  }, [externalResult, applyFinalTransform]);

  const flip = useCallback(() => {
    // if an external flipping prop is provided, this component is likely used in controlled mode
    // but we still allow local flips when uncontrolled.
    if (externalFlipping ?? flipping) return;
    const chosen: Result = Math.random() < 0.5 ? "heads" : "tails";
    setFlipping(true);

    // Kick off the CSS animation by adding class; the keyframes provide the spin.
    // After the animation duration, set the final transform to land on the chosen face.
    // Animation duration is 800ms in globals.css; we use a slightly longer timeout to be safe.
    timeoutRef.current = window.setTimeout(() => {
      setFlipping(false);
      setResult(chosen);
      applyFinalTransform(chosen);
      if (onResult) onResult(chosen);
    }, 820);
  }, [flipping, externalFlipping, onResult, applyFinalTransform]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    },
    [flip]
  );

  const sizeStyle = typeof size === "number" ? `${size}px` : size;

  // If parent supplies controlled props, prefer them
  const showingFlipping = externalFlipping ?? flipping;
  const showingResult = (externalResult as Result | undefined) ?? result;

  return (
    <div
      className="coin-3d"
      style={{ width: sizeStyle, height: sizeStyle, cursor: showingFlipping ? "wait" : "pointer" }}
      role="button"
      tabIndex={0}
      onClick={() => flip()}
      onKeyDown={onKeyDown}
      aria-pressed={showingFlipping}
      aria-label="Flip coin"
    >
      <div
        ref={innerRef}
        className={`coin-3d__inner ${showingFlipping ? "is-flipping" : ""} ${!showingFlipping && showingResult ? "is-reveal" : ""}`}
      >
        <div className="coin-3d__face coin-3d__face--heads">
          <Image src="./images/heads.svg" alt="Heads" layout="fill" objectFit="contain" />
        </div>
        <div className="coin-3d__face coin-3d__face--tails">
          <Image src="./images/tails.svg" alt="Tails" layout="fill" objectFit="contain" />
        </div>
        <div className="coin-3d__edge" />
      </div>
      {/* announce result for screen readers */}
      <span className="sr-only" aria-live="polite">{showingResult ? `Result: ${showingResult}` : ""}</span>
    </div>
  );
}
