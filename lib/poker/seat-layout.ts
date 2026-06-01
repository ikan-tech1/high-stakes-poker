import type { CSSProperties } from "react";

export function getSeatPosition(
  seatIndex: number,
  totalSeats: number
): CSSProperties {
  if (seatIndex === 0) {
    return {
      bottom: "4%",
      left: "50%",
      transform: "translateX(-50%)",
    };
  }

  const botIndex = seatIndex - 1;
  const botCount = totalSeats - 1;
  const startAngle = 205;
  const endAngle = 335;
  const angle =
    botCount === 1
      ? 270
      : startAngle + (botIndex / (botCount - 1)) * (endAngle - startAngle);

  const rad = (angle * Math.PI) / 180;
  const cx = 50;
  const cy = 40;
  const rx = 44;
  const ry = 36;
  const x = cx + rx * Math.cos(rad);
  const y = cy + ry * Math.sin(rad);

  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
  };
}
